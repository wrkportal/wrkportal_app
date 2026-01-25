import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Fetch multi-project roadmap with dependencies
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const months = parseInt(searchParams.get('months') || '12') // Default 12 months
        const includeDependencies = searchParams.get('includeDependencies') !== 'false'

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)

        // Fetch all active projects
        const projects = await prisma.project.findMany({
          where: {
            tenantId: userInfo.tenantId,
            deletedAt: null,
            status: { not: 'COMPLETED' },
            OR: [
              { startDate: { lte: endDate } },
              { endDate: { gte: startDate } },
            ],
          },
          include: {
            releases: {
              where: {
                OR: [
                  { targetDate: { gte: startDate } },
                  { releaseDate: { gte: startDate } },
                ],
              },
              include: {
                tasks: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    status: true,
                  },
                },
              },
              orderBy: {
                targetDate: 'asc',
              },
            },
            sprints: {
              where: {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
              include: {
                tasks: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    status: true,
                    estimatedHours: true,
                  },
                },
              },
              orderBy: {
                startDate: 'asc',
              },
            },
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                priority: true,
                dueDate: true,
              },
            },
          },
          orderBy: {
            startDate: 'asc',
          },
        })

        // Fetch dependencies if requested
        let dependencies: any[] = []
        if (includeDependencies) {
          const deps = await prisma.dependency.findMany({
            where: {
              tenantId: userInfo.tenantId,
              OR: [
                { sourceType: 'PROJECT' },
                { targetType: 'PROJECT' },
              ],
            },
          })

          // Enrich dependencies with project names
          dependencies = await Promise.all(
            deps.map(async (dep: any) => {
              let sourceName = 'Unknown'
              let targetName = 'Unknown'

              if (dep.sourceType === 'PROJECT') {
                const proj = await prisma.project.findFirst({
                  where: { id: dep.sourceId, tenantId: userInfo.tenantId },
                  select: { name: true },
                })
                if (proj) sourceName = proj.name
              }

              if (dep.targetType === 'PROJECT') {
                const proj = await prisma.project.findFirst({
                  where: { id: dep.targetId, tenantId: userInfo.tenantId },
                  select: { name: true },
                })
                if (proj) targetName = proj.name
              }

              return {
                ...dep,
                sourceName,
                targetName,
              }
            })
          )
        }

        // Build roadmap timeline
        const roadmapItems = projects.map((project: any) => {
          const releases = project.releases || []
          const sprints = project.sprints || []
          const tasks = project.tasks || []

          // Calculate project metrics
          const totalTasks = tasks.length
          const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
          const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED').length
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          // Get project dependencies
          const projectDeps = dependencies.filter(
            (d: any) =>
              (d.sourceType === 'PROJECT' && d.sourceId === project.id) ||
              (d.targetType === 'PROJECT' && d.targetId === project.id)
          )

          // Calculate resource allocation (simplified - based on task count)
          const resourceAllocation = {
            totalTasks,
            completedTasks,
            inProgressTasks: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
            blockedTasks,
          }

          return {
            id: project.id,
            name: project.name,
            code: project.code,
            description: project.description,
            status: project.status,
            startDate: project.startDate,
            endDate: project.endDate,
            progress,
            releases: releases.map((r: any) => ({
              id: r.id,
              name: r.name,
              version: r.version,
              targetDate: r.targetDate,
              releaseDate: r.releaseDate,
              status: r.status,
              progress: r.progress || 0,
              totalTasks: r.tasks.length,
              completedTasks: r.tasks.filter((t: any) => t.status === 'DONE').length,
            })),
            sprints: sprints.map((s: any) => ({
              id: s.id,
              name: s.name,
              startDate: s.startDate,
              endDate: s.endDate,
              status: s.status,
              progress: s.progress || 0,
              totalPoints: s.storyPoints || 0,
              completedPoints: s.tasks
                .filter((t: any) => t.status === 'DONE')
                .reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0),
            })),
            dependencies: projectDeps,
            resourceAllocation,
          }
        })

        // Calculate timeline statistics
        const stats = {
          totalProjects: roadmapItems.length,
          activeProjects: roadmapItems.filter((p: any) => p.status === 'IN_PROGRESS').length,
          plannedProjects: roadmapItems.filter((p: any) => p.status === 'PLANNING' || p.status === 'PLANNED').length,
          totalReleases: roadmapItems.reduce((sum: number, p: any) => sum + p.releases.length, 0),
          totalSprints: roadmapItems.reduce((sum: number, p: any) => sum + p.sprints.length, 0),
          totalDependencies: dependencies.length,
          avgProgress: roadmapItems.length > 0
            ? Math.round(roadmapItems.reduce((sum: number, p: any) => sum + p.progress, 0) / roadmapItems.length)
            : 0,
        }

        return NextResponse.json({
          roadmap: roadmapItems,
          dependencies: includeDependencies ? dependencies : [],
          stats,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        })
      } catch (error) {
        console.error('Error fetching multi-project roadmap:', error)
        return NextResponse.json(
          { error: 'Failed to fetch multi-project roadmap' },
          { status: 500 }
        )
      }
    }
  )
}


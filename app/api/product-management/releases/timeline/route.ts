import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Fetch release timeline data
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const months = parseInt(searchParams.get('months') || '6') // Default 6 months

        const whereClause: any = {
          tenantId: userInfo.tenantId,
        }

        if (projectId) {
          whereClause.projectId = projectId
        }

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)

        // Fetch releases
        const releases = await prisma.release.findMany({
          where: {
            ...whereClause,
            OR: [
              { targetDate: { gte: startDate } },
              { releaseDate: { gte: startDate } },
            ],
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
                code: true,
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
            targetDate: 'asc',
          },
        })

        // Calculate release metrics
        const timelineReleases = releases.map((release: any) => {
          const tasks = release.tasks || []
          const totalTasks = tasks.length
          const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
          const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED').length
          const delayedTasks = tasks.filter((t: any) => {
            if (!t.dueDate || t.status === 'DONE') return false
            return new Date(t.dueDate) < new Date()
          }).length

          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

          // Calculate risk level
          let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
          if (blockedTasks > 0 || delayedTasks > totalTasks * 0.2) {
            riskLevel = 'HIGH'
          } else if (delayedTasks > 0 || progress < 50) {
            riskLevel = 'MEDIUM'
          }

          // Check if release is at risk (target date approaching and low progress)
          const daysUntilTarget = Math.ceil(
            (new Date(release.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          if (daysUntilTarget < 14 && progress < 70) {
            riskLevel = 'HIGH'
          }

          return {
            id: release.id,
            name: release.name,
            version: release.version,
            project: release.project,
            status: release.status,
            targetDate: release.targetDate,
            releaseDate: release.releaseDate,
            progress,
            totalTasks,
            completedTasks,
            blockedTasks,
            delayedTasks,
            riskLevel,
          }
        })

        return NextResponse.json({
          releases: timelineReleases,
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
        })
      } catch (error) {
        console.error('Error fetching release timeline:', error)
        return NextResponse.json(
          { error: 'Failed to fetch release timeline' },
          { status: 500 }
        )
      }
    }
  )
}


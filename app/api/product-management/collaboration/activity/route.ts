import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Get real-time collaboration activity
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Fetch recent activity from multiple sources
        const whereClause: any = {
          tenantId: userInfo.tenantId,
        }

        if (projectId) {
          whereClause.projectId = projectId
        }

        // Get recent task updates
        const recentTasks = await prisma.task.findMany({
          where: {
            ...whereClause,
            deletedAt: null,
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: limit,
        })

        // Get recent comments (if Comment model exists)
        // For now, we'll use task updates as activity

        // Get recent project updates
        const recentProjects = await prisma.project.findMany({
          where: {
            ...whereClause,
            deletedAt: null,
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          select: {
            id: true,
            name: true,
            status: true,
            progress: true,
            updatedAt: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        })

        // Get recent releases
        const recentReleases = await prisma.release.findMany({
          where: {
            ...whereClause,
            updatedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        })

        // Format activity feed
        const activities = [
          ...recentTasks.map((task: any) => ({
            id: `task-${task.id}`,
            type: 'TASK_UPDATE',
            title: `Task "${task.title}" updated`,
            description: `Status changed to ${task.status}`,
            project: task.project,
            user: task.assignee,
            timestamp: task.updatedAt,
            entityId: task.id,
            entityType: 'TASK',
          })),
          ...recentProjects.map((project: any) => ({
            id: `project-${project.id}`,
            type: 'PROJECT_UPDATE',
            title: `Project "${project.name}" updated`,
            description: `Progress: ${project.progress}%`,
            project: { id: project.id, name: project.name },
            user: null,
            timestamp: project.updatedAt,
            entityId: project.id,
            entityType: 'PROJECT',
          })),
          ...recentReleases.map((release: any) => ({
            id: `release-${release.id}`,
            type: 'RELEASE_UPDATE',
            title: `Release "${release.name}" updated`,
            description: `Progress: ${release.progress}%`,
            project: release.project,
            user: null,
            timestamp: release.updatedAt,
            entityId: release.id,
            entityType: 'RELEASE',
          })),
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit)

        return NextResponse.json({
          activities,
          summary: {
            totalActivities: activities.length,
            last24Hours: activities.length,
            byType: {
              taskUpdates: activities.filter((a) => a.type === 'TASK_UPDATE').length,
              projectUpdates: activities.filter((a) => a.type === 'PROJECT_UPDATE').length,
              releaseUpdates: activities.filter((a) => a.type === 'RELEASE_UPDATE').length,
            },
          },
        })
      } catch (error) {
        console.error('Error fetching collaboration activity:', error)
        return NextResponse.json(
          { error: 'Failed to fetch collaboration activity' },
          { status: 500 }
        )
      }
    }
  )
}


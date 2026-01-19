import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Fetch product management dashboard statistics
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        // Fetch projects
        const projects = await prisma.project.findMany({
          where: {
            tenantId: userInfo.tenantId,
            deletedAt: null,
          },
          include: {
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                priority: true,
                dueDate: true,
                assigneeId: true,
              },
            },
          },
        })

        // Fetch tasks
        const tasks = await prisma.task.findMany({
          where: {
            tenantId: userInfo.tenantId,
            deletedAt: null,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        // Fetch releases
        const releases = await prisma.release.findMany({
          where: {
            tenantId: userInfo.tenantId,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
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
        })

        // Fetch sprints
        const sprints = await prisma.sprint.findMany({
          where: {
            tenantId: userInfo.tenantId,
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
        })

        // Calculate stats
        const activeProjects = projects.filter(
          (p) => p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
        ).length

        const upcomingReleases = releases.filter(
          (r) => r.status === 'PLANNED' || r.status === 'IN_PROGRESS'
        ).length

        const delayedTasks = tasks.filter((t) => {
          if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
          return new Date(t.dueDate) < new Date()
        }).length

        const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length

        // Calculate roadmap items from projects
        const roadmapItems = projects
          .filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
          .slice(0, 10)
          .map((p) => ({
            id: p.id,
            title: p.name,
            status:
              p.status === 'IN_PROGRESS'
                ? 'In Progress'
                : p.status === 'PLANNING'
                ? 'Planning'
                : p.status === 'PLANNED'
                ? 'Planned'
                : 'Draft',
            eta: p.endDate
              ? new Date(p.endDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'TBD',
            progress: p.progress || 0,
          }))

        // Calculate blockers from blocked tasks
        const blockerItems = tasks
          .filter((t) => t.status === 'BLOCKED')
          .slice(0, 10)
          .map((t) => ({
            id: t.id,
            title: t.title,
            team: t.project?.name || 'Unassigned',
            impact:
              t.priority === 'CRITICAL'
                ? 'Blocks release'
                : t.priority === 'HIGH'
                ? 'Delays feature'
                : 'Minor delay',
            severity:
              t.priority === 'CRITICAL' ? 'High' : t.priority === 'HIGH' ? 'Medium' : 'Low',
          }))

        // Calculate team capacity from actual task assignments
        const teamMap = new Map<
          string,
          { tasks: number; load: number; name: string; userId: string }
        >()
        tasks.forEach((t) => {
          if (t.assigneeId && t.status !== 'DONE' && t.status !== 'CANCELLED') {
            const current = teamMap.get(t.assigneeId) || {
              tasks: 0,
              load: 0,
              name: t.assignee?.name || `User ${t.assigneeId.slice(0, 8)}`,
              userId: t.assigneeId,
            }
            teamMap.set(t.assigneeId, {
              ...current,
              tasks: current.tasks + 1,
              load: current.load + 1,
            })
          }
        })

        // Calculate load percentage (simplified - max 10 tasks = 100% load)
        const teamStatusItems = Array.from(teamMap.values()).map((value) => {
          const load = Math.min(100, (value.tasks / 10) * 100)
          return {
            id: value.userId,
            name: value.name,
            load: Math.round(load),
            status: load > 80 ? 'Overloaded' : load > 60 ? 'Busy' : 'Stable',
          }
        })

        // Calculate metrics from real data
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.status === 'DONE').length
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0'

        const overdueTasks = tasks.filter((t) => {
          if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
          return new Date(t.dueDate) < new Date()
        }).length
        const overdueRate = totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : '0'

        // Calculate sprint velocity (average story points completed per sprint)
        const completedSprints = sprints.filter((s) => s.status === 'COMPLETED')
        let avgVelocity = 0
        if (completedSprints.length > 0) {
          const totalCompletedPoints = completedSprints.reduce((sum, sprint) => {
            const completedPoints = sprint.tasks
              .filter((t) => t.status === 'DONE')
              .reduce((points, t) => points + (t.estimatedHours || 0), 0)
            return sum + completedPoints
          }, 0)
          avgVelocity = Math.round(totalCompletedPoints / completedSprints.length)
        }

        // Calculate release success rate
        const totalReleases = releases.length
        const successfulReleases = releases.filter(
          (r) => r.status === 'RELEASED' && r.releaseDate
        ).length
        const releaseSuccessRate =
          totalReleases > 0 ? ((successfulReleases / totalReleases) * 100).toFixed(1) : '0'

        return NextResponse.json({
          stats: [
            { label: 'Active Projects', value: activeProjects.toString() },
            { label: 'Upcoming Releases', value: upcomingReleases.toString() },
            { label: 'Delayed Tasks', value: delayedTasks.toString() },
            { label: 'Blocked Tasks', value: blockedTasks.toString() },
          ],
          roadmap: roadmapItems,
          blockers: blockerItems,
          teamStatus: teamStatusItems.length > 0 ? teamStatusItems.slice(0, 4) : [
            { id: 'none', name: 'No active tasks', load: 0, status: 'Available' },
          ],
          metrics: [
            { label: 'Task Completion Rate', value: `${completionRate}%` },
            { label: 'Overdue Tasks Rate', value: `${overdueRate}%` },
            { label: 'Active Projects', value: activeProjects.toString() },
            { label: 'Total Tasks', value: totalTasks.toString() },
            { label: 'Sprint Velocity', value: avgVelocity.toString() },
            { label: 'Release Success Rate', value: `${releaseSuccessRate}%` },
          ],
        })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch dashboard data' },
          { status: 500 }
        )
      }
    }
  )
}


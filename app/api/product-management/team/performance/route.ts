import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Fetch team performance metrics
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const months = parseInt(searchParams.get('months') || '3') // Default 3 months

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setMonth(startDate.getMonth() - months)

        // Fetch tasks with assignees
        const whereClause: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
          assigneeId: { not: null },
          createdAt: { gte: startDate },
        }

        if (projectId) {
          whereClause.projectId = projectId
        }

        const tasks = await prisma.task.findMany({
          where: whereClause,
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        // Fetch sprints for velocity calculation
        const sprintWhereClause: any = {
          tenantId: userInfo.tenantId,
          startDate: { gte: startDate },
        }

        if (projectId) {
          sprintWhereClause.projectId = projectId
        }

        const sprints = await prisma.sprint.findMany({
          where: sprintWhereClause,
          include: {
            tasks: {
              where: {
                deletedAt: null,
                assigneeId: { not: null },
              },
              select: {
                id: true,
                status: true,
                estimatedHours: true,
                assigneeId: true,
                updatedAt: true,
              },
            },
          },
        })

        // Calculate performance per team member
        const teamMap = new Map<
          string,
          {
            userId: string
            name: string
            email: string
            totalTasks: number
            completedTasks: number
            inProgressTasks: number
            blockedTasks: number
            totalPoints: number
            completedPoints: number
            avgCycleTime: number
            velocity: number
          }
        >()

        // Process tasks
        tasks.forEach((task) => {
          if (!task.assigneeId) return

          const current = teamMap.get(task.assigneeId) || {
            userId: task.assigneeId,
            name: task.assignee?.name || 'Unknown',
            email: task.assignee?.email || '',
            totalTasks: 0,
            completedTasks: 0,
            inProgressTasks: 0,
            blockedTasks: 0,
            totalPoints: 0,
            completedPoints: 0,
            avgCycleTime: 0,
            velocity: 0,
          }

          current.totalTasks++
          const points = task.estimatedHours || 0
          current.totalPoints += points

          if (task.status === 'DONE') {
            current.completedTasks++
            current.completedPoints += points
          } else if (task.status === 'IN_PROGRESS') {
            current.inProgressTasks++
          } else if (task.status === 'BLOCKED') {
            current.blockedTasks++
          }

          teamMap.set(task.assigneeId, current)
        })

        // Calculate velocity from sprints
        sprints.forEach((sprint) => {
          const sprintTasks = sprint.tasks || []
          const completedTasks = sprintTasks.filter((t) => t.status === 'DONE')

          completedTasks.forEach((task) => {
            if (!task.assigneeId) return
            const member = teamMap.get(task.assigneeId)
            if (member) {
              member.velocity += task.estimatedHours || 0
            }
          })
        })

        // Calculate average cycle time (simplified - time from creation to completion)
        const completedTasks = tasks.filter((t) => t.status === 'DONE' && t.assigneeId)
        const cycleTimes: { [userId: string]: number[] } = {}

        completedTasks.forEach((task) => {
          if (!task.assigneeId || !task.createdAt || !task.updatedAt) return

          const cycleTime = Math.ceil(
            (new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          ) // Days

          if (!cycleTimes[task.assigneeId]) {
            cycleTimes[task.assigneeId] = []
          }
          cycleTimes[task.assigneeId].push(cycleTime)
        })

        // Calculate averages
        Object.keys(cycleTimes).forEach((userId) => {
          const member = teamMap.get(userId)
          if (member && cycleTimes[userId].length > 0) {
            member.avgCycleTime = Math.round(
              cycleTimes[userId].reduce((a, b) => a + b, 0) / cycleTimes[userId].length
            )
          }
        })

        // Convert to array and calculate completion rates
        const teamPerformance = Array.from(teamMap.values()).map((member) => {
          const completionRate =
            member.totalTasks > 0
              ? Math.round((member.completedTasks / member.totalTasks) * 100)
              : 0

          const pointsCompletionRate =
            member.totalPoints > 0
              ? Math.round((member.completedPoints / member.totalPoints) * 100)
              : 0

          return {
            ...member,
            completionRate,
            pointsCompletionRate,
            load: Math.min(100, (member.totalTasks / 10) * 100), // Max 10 tasks = 100%
            status:
              member.blockedTasks > 0
                ? 'Blocked'
                : member.totalTasks > 10
                ? 'Overloaded'
                : member.totalTasks > 6
                ? 'Busy'
                : 'Stable',
          }
        })

        // Sort by completion rate (descending)
        teamPerformance.sort((a, b) => b.completionRate - a.completionRate)

        return NextResponse.json({
          teamPerformance,
          summary: {
            totalMembers: teamPerformance.length,
            avgCompletionRate:
              teamPerformance.length > 0
                ? Math.round(
                    teamPerformance.reduce((sum, m) => sum + m.completionRate, 0) /
                      teamPerformance.length
                  )
                : 0,
            avgVelocity:
              teamPerformance.length > 0
                ? Math.round(
                    teamPerformance.reduce((sum, m) => sum + m.velocity, 0) /
                      teamPerformance.length
                  )
                : 0,
            totalTasks: tasks.length,
            completedTasks: tasks.filter((t) => t.status === 'DONE').length,
          },
        })
      } catch (error) {
        console.error('Error fetching team performance:', error)
        return NextResponse.json(
          { error: 'Failed to fetch team performance' },
          { status: 500 }
        )
      }
    }
  )
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Forecast team capacity
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const months = parseInt(searchParams.get('months') || '3') // Forecast next 3 months
        const userId = searchParams.get('userId') // Optional: specific user

        // Calculate date range
        const startDate = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + months)

        // Fetch all tasks with assignments
        const whereClause: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
          assigneeId: { not: null },
          status: { not: 'DONE' },
          OR: [
            { dueDate: { gte: startDate, lte: endDate } },
            { dueDate: null },
          ],
        }

        if (userId) {
          whereClause.assigneeId = userId
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
                endDate: true,
              },
            },
          },
        })

        // Fetch historical sprint data for velocity calculation
        const sprints = await prisma.sprint.findMany({
          where: {
            tenantId: userInfo.tenantId,
            status: 'COMPLETED',
            endDate: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Last 90 days
          },
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
              },
            },
          },
        })

        // Calculate individual capacity
        const userCapacityMap = new Map<
          string,
          {
            userId: string
            name: string
            email: string
            currentLoad: number
            futureLoad: number
            historicalVelocity: number
            availableCapacity: number
            forecastedAvailability: { month: string; available: number }[]
          }
        >()

        // Process current and future tasks
        tasks.forEach((task: any) => {
          if (!task.assigneeId) return

          const user = userCapacityMap.get(task.assigneeId) || {
            userId: task.assigneeId,
            name: task.assignee?.name || 'Unknown',
            email: task.assignee?.email || '',
            currentLoad: 0,
            futureLoad: 0,
            historicalVelocity: 0,
            availableCapacity: 0,
            forecastedAvailability: [],
          }

          const taskPoints = task.estimatedHours || 1
          const taskDate = task.dueDate ? new Date(task.dueDate) : new Date()

          if (taskDate <= new Date()) {
            user.currentLoad += taskPoints
          } else {
            user.futureLoad += taskPoints
          }

          userCapacityMap.set(task.assigneeId, user)
        })

        // Calculate historical velocity from sprints
        sprints.forEach((sprint: any) => {
          const sprintTasks = sprint.tasks || []
          const completedTasks = sprintTasks.filter((t: any) => t.status === 'DONE')

          completedTasks.forEach((task: any) => {
            if (!task.assigneeId) return
            const user = userCapacityMap.get(task.assigneeId)
            if (user) {
              user.historicalVelocity += task.estimatedHours || 0
            }
          })
        })

        // Calculate average velocity per user
        const sprintCount = sprints.length
        userCapacityMap.forEach((user) => {
          if (sprintCount > 0) {
            user.historicalVelocity = Math.round(user.historicalVelocity / sprintCount)
          }
        })

        // Forecast monthly availability
        const capacityForecasts = Array.from(userCapacityMap.values()).map((user) => {
          const maxCapacity = 40 // Assume 40 points per month (simplified)
          const futureMonths: { month: string; available: number }[] = []

          // Generate monthly forecast
          for (let i = 0; i < months; i++) {
            const forecastDate = new Date()
            forecastDate.setMonth(forecastDate.getMonth() + i)
            const monthKey = forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

            // Estimate load for this month (simplified - distribute future load)
            const monthlyFutureLoad = i === 0 ? user.currentLoad : Math.round(user.futureLoad / months)
            const available = Math.max(0, maxCapacity - monthlyFutureLoad)

            futureMonths.push({
              month: monthKey,
              available,
            })
          }

          const totalLoad = user.currentLoad + user.futureLoad
          const availableCapacity = Math.max(0, maxCapacity - totalLoad)

          return {
            ...user,
            currentLoad: user.currentLoad,
            futureLoad: user.futureLoad,
            totalLoad,
            maxCapacity,
            availableCapacity,
            utilization: Math.min(100, Math.round((totalLoad / maxCapacity) * 100)),
            forecastedAvailability: futureMonths,
            status:
              totalLoad > maxCapacity * 1.2
                ? 'OVERLOADED'
                : totalLoad > maxCapacity
                ? 'FULL'
                : totalLoad > maxCapacity * 0.8
                ? 'BUSY'
                : 'AVAILABLE',
          }
        })

        // Sort by utilization (highest first)
        capacityForecasts.sort((a, b) => b.utilization - a.utilization)

        // Calculate summary
        const summary = {
          totalTeamMembers: capacityForecasts.length,
          available: capacityForecasts.filter((c) => c.status === 'AVAILABLE').length,
          busy: capacityForecasts.filter((c) => c.status === 'BUSY').length,
          full: capacityForecasts.filter((c) => c.status === 'FULL').length,
          overloaded: capacityForecasts.filter((c) => c.status === 'OVERLOADED').length,
          avgUtilization:
            capacityForecasts.length > 0
              ? Math.round(
                  capacityForecasts.reduce((sum, c) => sum + c.utilization, 0) / capacityForecasts.length
                )
              : 0,
          totalAvailableCapacity: capacityForecasts.reduce((sum, c) => sum + c.availableCapacity, 0),
        }

        return NextResponse.json({
          forecasts: capacityForecasts,
          summary,
          forecastPeriod: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            months,
          },
        })
      } catch (error) {
        console.error('Error forecasting capacity:', error)
        return NextResponse.json(
          { error: 'Failed to forecast capacity' },
          { status: 500 }
        )
      }
    }
  )
}


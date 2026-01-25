import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

type SprintTask = {
  status: string
  estimatedHours: number | null
  updatedAt: Date | null
}

type Sprint = {
  id: string
  name: string
  status: string
  startDate: Date
  endDate: Date | null
  storyPoints?: number | null
  tasks: SprintTask[]
}

// GET - Fetch velocity and burndown data
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const sprintId = searchParams.get('sprintId')

        // Fetch sprints
        const whereClause: any = {
          tenantId: userInfo.tenantId,
        }

        if (projectId) {
          whereClause.projectId = projectId
        }

        if (sprintId) {
          whereClause.id = sprintId
        }

        const sprints = await prisma.sprint.findMany({
          where: whereClause,
          include: {
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                estimatedHours: true,
                updatedAt: true,
              },
              orderBy: {
                updatedAt: 'asc',
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
          take: 10, // Last 10 sprints
        })

        // Calculate velocity trend (last 10 sprints)
        const velocityTrend = (sprints as Sprint[])
          .filter((s: Sprint) => s.status === 'COMPLETED')
          .map((sprint: Sprint) => {
            const completedPoints = sprint.tasks
              .filter((t: SprintTask) => t.status === 'DONE')
              .reduce((sum: number, t: SprintTask) => sum + (t.estimatedHours || 0), 0)
            return {
              sprintName: sprint.name,
              sprintId: sprint.id,
              velocity: completedPoints,
              date: sprint.endDate || sprint.startDate,
            }
          })
          .reverse() // Oldest first

        // Calculate average velocity
        const velocities = velocityTrend.map((v: { velocity: number }) => v.velocity)
        const avgVelocity =
          velocities.length > 0
            ? Math.round(velocities.reduce((a: number, b: number) => a + b, 0) / velocities.length)
            : 0

        // Get active sprint for burndown
        const activeSprint = (sprints as Sprint[]).find((s: Sprint) => s.status === 'ACTIVE')
        let burndownData: any[] = []

        if (activeSprint) {
          const totalPoints = activeSprint.storyPoints ||
            activeSprint.tasks.reduce((sum: number, t: SprintTask) => sum + (t.estimatedHours || 0), 0)
          
          const startDate = new Date(activeSprint.startDate)
          const endDate = new Date(activeSprint.endDate ?? activeSprint.startDate)
          const sprintDuration = Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Generate ideal burndown line
          const idealBurnRate = totalPoints / sprintDuration

          // Calculate actual burndown from task completion history
          const days: { [key: string]: number } = {}
          let remainingPoints = totalPoints

          // Initialize all days
          for (let i = 0; i <= sprintDuration; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            const dateKey = date.toISOString().split('T')[0]
            days[dateKey] = remainingPoints
          }

          // Calculate actual burndown based on task updates
          activeSprint.tasks.forEach((task: SprintTask) => {
            if (task.status === 'DONE' && task.updatedAt) {
              const taskDate = new Date(task.updatedAt)
              const taskDateKey = taskDate.toISOString().split('T')[0]
              const taskPoints = task.estimatedHours || 0

              // Update remaining points for this day and all future days
              Object.keys(days).forEach((dateKey) => {
                if (dateKey >= taskDateKey) {
                  days[dateKey] = Math.max(0, days[dateKey] - taskPoints)
                }
              })
            }
          })

          // Generate burndown data points
          for (let i = 0; i <= sprintDuration; i++) {
            const date = new Date(startDate)
            date.setDate(date.getDate() + i)
            const dateKey = date.toISOString().split('T')[0]
            const idealRemaining = Math.max(0, totalPoints - idealBurnRate * i)
            const actualRemaining = days[dateKey] || remainingPoints

            burndownData.push({
              day: i + 1,
              date: dateKey,
              ideal: Math.round(idealRemaining),
              actual: Math.round(actualRemaining),
            })
          }
        }

        return NextResponse.json({
          velocityTrend,
          avgVelocity,
          burndown: burndownData,
          activeSprint: activeSprint
            ? {
                id: activeSprint.id,
                name: activeSprint.name,
                startDate: activeSprint.startDate,
                endDate: activeSprint.endDate,
              }
            : null,
        })
      } catch (error) {
        console.error('Error fetching velocity data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch velocity data' },
          { status: 500 }
        )
      }
    }
  )
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// POST - Simulate what-if scenarios
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const body = await req.json()
        const {
          scenarioType, // 'DELAY', 'RESOURCE_REALLOCATION', 'RELEASE_OPTIMIZATION'
          projectIds,
          delayDays,
          resourceChanges,
          releaseDateChanges,
        } = body

        // Fetch current project data
        const projects = await prisma.project.findMany({
          where: {
            id: { in: projectIds },
            tenantId: userInfo.tenantId,
            deletedAt: null,
          },
          include: {
            tasks: {
              where: {
                deletedAt: null,
              },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            releases: {
              include: {
                tasks: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    status: true,
                    dueDate: true,
                  },
                },
              },
            },
            sprints: {
              include: {
                tasks: {
                  where: {
                    deletedAt: null,
                  },
                  select: {
                    id: true,
                    status: true,
                    estimatedHours: true,
                    assigneeId: true,
                  },
                },
              },
            },
          },
        })

        const scenarios: any[] = []

        // Scenario 1: Delay Impact Analysis
        if (scenarioType === 'DELAY' && delayDays) {
          projects.forEach((project: any) => {
            const delayedEndDate = new Date(project.endDate || new Date())
            delayedEndDate.setDate(delayedEndDate.getDate() + delayDays)

            // Calculate impact on releases
            const impactedReleases = project.releases.map((release: any) => {
              const releaseDate = release.releaseDate || release.targetDate
              const newReleaseDate = new Date(releaseDate)
              newReleaseDate.setDate(newReleaseDate.getDate() + delayDays)

              const tasks = release.tasks || []
              const totalTasks = tasks.length
              const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
              const remainingTasks = totalTasks - completedTasks

              return {
                id: release.id,
                name: release.name,
                currentDate: releaseDate,
                newDate: newReleaseDate,
                delay: delayDays,
                impactedTasks: remainingTasks,
                riskLevel: newReleaseDate < new Date() ? 'HIGH' : 'MEDIUM',
              }
            })

            // Calculate impact on dependencies
            const dependencies = project.tasks.filter((t: any) => t.status !== 'DONE').length

            scenarios.push({
              projectId: project.id,
              projectName: project.name,
              scenarioType: 'DELAY',
              currentEndDate: project.endDate,
              newEndDate: delayedEndDate,
              delayDays,
              impactedReleases,
              impactedDependencies: dependencies,
              riskAssessment: {
                level: delayDays > 30 ? 'HIGH' : delayDays > 14 ? 'MEDIUM' : 'LOW',
                impact: `Project completion delayed by ${delayDays} days`,
                recommendations: [
                  delayDays > 30 ? 'Consider resource reallocation' : null,
                  delayDays > 14 ? 'Review dependent projects' : null,
                  'Update stakeholder communications',
                ].filter(Boolean),
              },
            })
          })
        }

        // Scenario 2: Resource Reallocation
        if (scenarioType === 'RESOURCE_REALLOCATION' && resourceChanges) {
          projects.forEach((project: any) => {
            const tasks = project.tasks || []
            const currentAssignments = new Map<string, number>()

            tasks.forEach((task: any) => {
              if (task.assigneeId) {
                currentAssignments.set(
                  task.assigneeId,
                  (currentAssignments.get(task.assigneeId) || 0) + 1
                )
              }
            })

            // Simulate resource changes
            const newAssignments = new Map(currentAssignments)
            resourceChanges.forEach((change: any) => {
              if (change.fromUserId && change.toUserId) {
                const fromCount = newAssignments.get(change.fromUserId) || 0
                const toCount = newAssignments.get(change.toUserId) || 0
                const transferCount = Math.min(change.taskCount || 0, fromCount)

                newAssignments.set(change.fromUserId, fromCount - transferCount)
                newAssignments.set(change.toUserId, toCount + transferCount)
              }
            })

            // Calculate new completion estimates
            const avgTaskDuration = 5 // days (simplified)
            const currentLoad = Array.from(currentAssignments.values()).reduce((a, b) => a + b, 0)
            const newLoad = Array.from(newAssignments.values()).reduce((a, b) => a + b, 0)
            const loadChange = newLoad - currentLoad

            const estimatedCompletionChange = loadChange * avgTaskDuration
            const newEndDate = new Date(project.endDate || new Date())
            newEndDate.setDate(newEndDate.getDate() + estimatedCompletionChange)

            scenarios.push({
              projectId: project.id,
              projectName: project.name,
              scenarioType: 'RESOURCE_REALLOCATION',
              currentLoad,
              newLoad,
              loadChange,
              currentEndDate: project.endDate,
              estimatedNewEndDate: newEndDate,
              resourceChanges,
              impact: {
                completionChange: estimatedCompletionChange,
                loadRedistribution: Array.from(newAssignments.entries()).map(([userId, count]) => ({
                  userId,
                  taskCount: count,
                })),
              },
            })
          })
        }

        // Scenario 3: Release Date Optimization
        if (scenarioType === 'RELEASE_OPTIMIZATION' && releaseDateChanges) {
          projects.forEach((project: any) => {
            const releases = project.releases || []
            const optimizedReleases = releases.map((release: any) => {
              const change = releaseDateChanges.find((rc: any) => rc.releaseId === release.id)
              if (!change) return null

              const currentDate = release.releaseDate || release.targetDate
              const newDate = new Date(change.newDate)

              const tasks = release.tasks || []
              const totalTasks = tasks.length
              const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
              const remainingTasks = totalTasks - completedTasks

              // Calculate if new date is feasible
              const daysUntilNewDate = Math.ceil(
                (newDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              )
              const avgTasksPerDay = 2 // simplified
              const estimatedDaysNeeded = Math.ceil(remainingTasks / avgTasksPerDay)

              const isFeasible = daysUntilNewDate >= estimatedDaysNeeded
              const riskLevel = isFeasible
                ? daysUntilNewDate < estimatedDaysNeeded * 1.2
                  ? 'MEDIUM'
                  : 'LOW'
                : 'HIGH'

              return {
                id: release.id,
                name: release.name,
                currentDate,
                newDate,
                daysChange: Math.ceil((newDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)),
                remainingTasks,
                estimatedDaysNeeded,
                daysUntilNewDate,
                isFeasible,
                riskLevel,
                recommendations: isFeasible
                  ? []
                  : [
                      'Consider adding resources',
                      'Review task priorities',
                      'Extend timeline if critical',
                    ],
              }
            }).filter(Boolean)

            scenarios.push({
              projectId: project.id,
              projectName: project.name,
              scenarioType: 'RELEASE_OPTIMIZATION',
              optimizedReleases,
              summary: {
                totalReleases: optimizedReleases.length,
                feasibleReleases: optimizedReleases.filter((r: any) => r.isFeasible).length,
                highRiskReleases: optimizedReleases.filter((r: any) => r.riskLevel === 'HIGH').length,
              },
            })
          })
        }

        return NextResponse.json({
          scenarios,
          scenarioType,
          generatedAt: new Date().toISOString(),
        })
      } catch (error) {
        console.error('Error simulating what-if scenario:', error)
        return NextResponse.json(
          { error: 'Failed to simulate scenario' },
          { status: 500 }
        )
      }
    }
  )
}


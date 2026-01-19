import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { analyzeProjectRisks } from '@/lib/ai/services/risk-predictor'

// GET - Predict risks for projects and releases
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const projectId = searchParams.get('projectId')
        const includeReleases = searchParams.get('includeReleases') !== 'false'

        // Fetch projects
        const whereClause: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
          status: { in: ['IN_PROGRESS', 'PLANNED'] },
        }

        if (projectId) {
          whereClause.id = projectId
        }

        const projects = await prisma.project.findMany({
          where: whereClause,
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
            releases: includeReleases
              ? {
                  where: {
                    status: { in: ['PLANNED', 'IN_PROGRESS'] },
                  },
                  include: {
                    tasks: {
                      where: {
                        deletedAt: null,
                      },
                      select: {
                        id: true,
                        status: true,
                        dueDate: true,
                        priority: true,
                      },
                    },
                  },
                }
              : false,
          },
        })

        // Predict risks for each project
        const riskPredictions = await Promise.all(
          projects.map(async (project) => {
            const tasks = project.tasks || []
            const totalTasks = tasks.length
            const completedTasks = tasks.filter((t) => t.status === 'DONE').length
            const blockedTasks = tasks.filter((t) => t.status === 'BLOCKED').length
            const overdueTasks = tasks.filter((t) => {
              if (!t.dueDate || t.status === 'DONE') return false
              return new Date(t.dueDate) < new Date()
            }).length

            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
            const daysUntilDeadline = project.endDate
              ? Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 0

            // Calculate risk indicators
            const riskIndicators = {
              lowProgress: progress < 50 && daysUntilDeadline < 30,
              highBlockedTasks: blockedTasks > totalTasks * 0.2,
              manyOverdue: overdueTasks > totalTasks * 0.15,
              approachingDeadline: daysUntilDeadline < 14 && progress < 70,
              noRecentActivity: false, // Could check last task update
            }

            // Calculate risk score (0-100)
            let riskScore = 0
            if (riskIndicators.lowProgress) riskScore += 25
            if (riskIndicators.highBlockedTasks) riskScore += 30
            if (riskIndicators.manyOverdue) riskScore += 20
            if (riskIndicators.approachingDeadline) riskScore += 25

            const riskLevel =
              riskScore >= 70 ? 'CRITICAL' : riskScore >= 50 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW'

            // Predict delay probability
            const delayProbability = Math.min(
              100,
              Math.max(
                0,
                riskScore +
                  (daysUntilDeadline < 30 ? 20 : 0) +
                  (blockedTasks > 0 ? 15 : 0) +
                  (overdueTasks > 0 ? 10 : 0)
              )
            )

            // Generate mitigation strategies
            const recommendations: string[] = []
            if (riskIndicators.lowProgress) {
              recommendations.push('Accelerate task completion or extend timeline')
            }
            if (riskIndicators.highBlockedTasks) {
              recommendations.push('Resolve blockers immediately')
            }
            if (riskIndicators.manyOverdue) {
              recommendations.push('Review and reprioritize overdue tasks')
            }
            if (riskIndicators.approachingDeadline) {
              recommendations.push('Consider scope reduction or deadline extension')
            }

            // Predict release risks if requested
            let releaseRisks: any[] = []
            if (includeReleases && project.releases) {
              releaseRisks = project.releases.map((release) => {
                const releaseTasks = release.tasks || []
                const releaseTotalTasks = releaseTasks.length
                const releaseCompleted = releaseTasks.filter((t) => t.status === 'DONE').length
                const releaseBlocked = releaseTasks.filter((t) => t.status === 'BLOCKED').length

                const releaseProgress =
                  releaseTotalTasks > 0 ? Math.round((releaseCompleted / releaseTotalTasks) * 100) : 0
                const releaseDate = release.releaseDate || release.targetDate
                const daysUntilRelease = Math.ceil(
                  (new Date(releaseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                )

                let releaseRiskScore = 0
                if (releaseProgress < 50 && daysUntilRelease < 14) releaseRiskScore += 40
                if (releaseBlocked > 0) releaseRiskScore += 30
                if (daysUntilRelease < 7 && releaseProgress < 80) releaseRiskScore += 30

                const releaseRiskLevel =
                  releaseRiskScore >= 70
                    ? 'CRITICAL'
                    : releaseRiskScore >= 50
                    ? 'HIGH'
                    : releaseRiskScore >= 30
                    ? 'MEDIUM'
                    : 'LOW'

                return {
                  id: release.id,
                  name: release.name,
                  version: release.version,
                  targetDate: release.targetDate,
                  riskLevel,
                  riskScore: releaseRiskScore,
                  progress: releaseProgress,
                  daysUntilRelease,
                  blockedTasks: releaseBlocked,
                  recommendations:
                    releaseRiskLevel === 'CRITICAL'
                      ? ['Immediate action required', 'Consider delaying release']
                      : releaseRiskLevel === 'HIGH'
                      ? ['Accelerate completion', 'Resolve blockers']
                      : [],
                }
              })
            }

            return {
              projectId: project.id,
              projectName: project.name,
              riskLevel,
              riskScore,
              delayProbability,
              indicators: riskIndicators,
              recommendations,
              metrics: {
                progress,
                daysUntilDeadline,
                totalTasks,
                completedTasks,
                blockedTasks,
                overdueTasks,
              },
              releaseRisks,
            }
          })
        )

        // Sort by risk score (highest first)
        riskPredictions.sort((a, b) => b.riskScore - a.riskScore)

        return NextResponse.json({
          predictions: riskPredictions,
          summary: {
            totalProjects: riskPredictions.length,
            critical: riskPredictions.filter((p) => p.riskLevel === 'CRITICAL').length,
            high: riskPredictions.filter((p) => p.riskLevel === 'HIGH').length,
            medium: riskPredictions.filter((p) => p.riskLevel === 'MEDIUM').length,
            low: riskPredictions.filter((p) => p.riskLevel === 'LOW').length,
            avgRiskScore:
              riskPredictions.length > 0
                ? Math.round(riskPredictions.reduce((sum, p) => sum + p.riskScore, 0) / riskPredictions.length)
                : 0,
          },
        })
      } catch (error) {
        console.error('Error predicting risks:', error)
        return NextResponse.json(
          { error: 'Failed to predict risks' },
          { status: 500 }
        )
      }
    }
  )
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Predict release success probability
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const releaseId = searchParams.get('releaseId')

        // Fetch historical releases for baseline
        const historicalReleases = await prisma.release.findMany({
          where: {
            tenantId: userInfo.tenantId,
            status: { in: ['RELEASED', 'CANCELLED'] },
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
        })

        // Calculate historical success rate
        const successfulReleases = historicalReleases.filter(
          (r: any) => r.status === 'RELEASED' && r.releaseDate
        ).length
        const historicalSuccessRate =
          historicalReleases.length > 0 ? (successfulReleases / historicalReleases.length) * 100 : 70

        // Fetch current releases to predict
        const whereClause: any = {
          tenantId: userInfo.tenantId,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
        }

        if (releaseId) {
          whereClause.id = releaseId
        }

        const releases = await prisma.release.findMany({
          where: whereClause,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                progress: true,
              },
            },
            tasks: {
              where: {
                deletedAt: null,
              },
              select: {
                id: true,
                status: true,
                dueDate: true,
                priority: true,
                estimatedHours: true,
                assignee: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        })

        // Predict success probability for each release
        const predictions = releases.map((release: any) => {
          const tasks = release.tasks || []
          const totalTasks = tasks.length
          const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
          const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length
          const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED').length
          const overdueTasks = tasks.filter((t: any) => {
            if (!t.dueDate || t.status === 'DONE') return false
            return new Date(t.dueDate) < new Date()
          }).length

          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          const releaseDate = release.releaseDate || release.targetDate
          const daysUntilRelease = Math.ceil(
            (new Date(releaseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )

          // Calculate success factors (0-100 each)
          const progressFactor = progress // Higher progress = higher success
          const timeFactor = daysUntilRelease > 0 ? Math.min(100, (daysUntilRelease / 14) * 100) : 0 // More time = higher success
          const blockerFactor = blockedTasks === 0 ? 100 : Math.max(0, 100 - blockedTasks * 20) // No blockers = higher success
          const overdueFactor =
            overdueTasks === 0 ? 100 : Math.max(0, 100 - (overdueTasks / totalTasks) * 100) // No overdue = higher success

          // Calculate base success probability
          let successProbability =
            (progressFactor * 0.4 + timeFactor * 0.3 + blockerFactor * 0.2 + overdueFactor * 0.1) * 0.7 +
            historicalSuccessRate * 0.3

          // Adjust based on project health
          if (release.project) {
            const projectProgress = release.project.progress || 0
            successProbability = successProbability * 0.8 + projectProgress * 0.2
          }

          // Penalize for critical issues
          if (blockedTasks > totalTasks * 0.2) successProbability -= 20
          if (daysUntilRelease < 7 && progress < 80) successProbability -= 30
          if (overdueTasks > totalTasks * 0.15) successProbability -= 15

          // Ensure probability is between 0 and 100
          successProbability = Math.max(0, Math.min(100, Math.round(successProbability)))

          // Determine success level
          const successLevel =
            successProbability >= 80
              ? 'HIGH'
              : successProbability >= 60
              ? 'MEDIUM'
              : successProbability >= 40
              ? 'LOW'
              : 'CRITICAL'

          // Identify risk factors
          const riskFactors: string[] = []
          if (blockedTasks > 0) riskFactors.push(`${blockedTasks} blocked task(s)`)
          if (overdueTasks > 0) riskFactors.push(`${overdueTasks} overdue task(s)`)
          if (daysUntilRelease < 7 && progress < 80)
            riskFactors.push('Insufficient time remaining')
          if (progress < 50) riskFactors.push('Low completion progress')

          // Generate recommendations
          const recommendations: string[] = []
          if (successProbability < 60) {
            recommendations.push('Accelerate task completion')
            if (blockedTasks > 0) recommendations.push('Resolve blockers immediately')
            if (daysUntilRelease < 14) recommendations.push('Consider extending release date')
          }
          if (overdueTasks > 0) {
            recommendations.push('Address overdue tasks')
          }
          if (progress < 70 && daysUntilRelease < 14) {
            recommendations.push('Review scope and prioritize critical features')
          }

          return {
            releaseId: release.id,
            releaseName: release.name,
            version: release.version,
            project: release.project,
            targetDate: release.targetDate,
            releaseDate: release.releaseDate,
            successProbability,
            successLevel,
            progress,
            daysUntilRelease,
            metrics: {
              totalTasks,
              completedTasks,
              inProgressTasks,
              blockedTasks,
              overdueTasks,
            },
            riskFactors,
            recommendations,
            confidence: Math.min(100, Math.max(50, 100 - riskFactors.length * 10)), // More risk factors = lower confidence
          }
        })

        // Sort by success probability (lowest first - most at risk)
        predictions.sort((a: any, b: any) => a.successProbability - b.successProbability)

        return NextResponse.json({
          predictions,
          summary: {
            totalReleases: predictions.length,
            high: predictions.filter((p: any) => p.successLevel === 'HIGH').length,
            medium: predictions.filter((p: any) => p.successLevel === 'MEDIUM').length,
            low: predictions.filter((p: any) => p.successLevel === 'LOW').length,
            critical: predictions.filter((p: any) => p.successLevel === 'CRITICAL').length,
            avgSuccessProbability:
              predictions.length > 0
                ? Math.round(
                    predictions.reduce((sum: number, p: any) => sum + p.successProbability, 0) / predictions.length
                  )
                : 0,
            historicalSuccessRate: Math.round(historicalSuccessRate),
          },
        })
      } catch (error) {
        console.error('Error predicting release success:', error)
        return NextResponse.json(
          { error: 'Failed to predict release success' },
          { status: 500 }
        )
      }
    }
  )
}


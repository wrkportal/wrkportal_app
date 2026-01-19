import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET - Fetch strategic planning data with OKR integration
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'projects', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const quarter = searchParams.get('quarter') // e.g., "Q1"
        const year = searchParams.get('year') // e.g., "2024"
        const level = searchParams.get('level') // COMPANY, DEPARTMENT, TEAM, INDIVIDUAL

        // Get current quarter if not specified
        const now = new Date()
        const currentYear = year ? parseInt(year) : now.getFullYear()
        const currentQuarter = quarter || `Q${Math.floor(now.getMonth() / 3) + 1}`

        // Fetch OKRs/Goals
        const goalWhere: any = {
          tenantId: userInfo.tenantId,
          status: { in: ['ACTIVE', 'DRAFT'] },
        }

        if (level) {
          goalWhere.level = level
        }

        const goals = await prisma.goal.findMany({
          where: goalWhere,
          include: {
            keyResults: {
              include: {
                checkIns: {
                  orderBy: {
                    createdAt: 'desc',
                  },
                  take: 1,
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Filter by quarter if specified
        const filteredGoals = goals.filter((goal) => {
          const goalQuarter = goal.quarter
          if (quarter && !goalQuarter.includes(currentQuarter)) return false
          if (year && !goalQuarter.includes(currentYear.toString())) return false
          return true
        })

        // Fetch projects aligned with goals (via project name matching or explicit linking)
        const projects = await prisma.project.findMany({
          where: {
            tenantId: userInfo.tenantId,
            deletedAt: null,
            status: { not: 'COMPLETED' },
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
              },
            },
            releases: {
              where: {
                status: { in: ['PLANNED', 'IN_PROGRESS'] },
              },
              select: {
                id: true,
                name: true,
                targetDate: true,
                status: true,
              },
            },
          },
        })

        // Map goals to strategic initiatives
        const strategicInitiatives = filteredGoals.map((goal) => {
          // Find related projects (by name matching or description)
          const relatedProjects = projects.filter((p) => {
            const projectText = `${p.name} ${p.description || ''}`.toLowerCase()
            const goalText = `${goal.title} ${goal.description || ''}`.toLowerCase()
            return projectText.includes(goalText) || goalText.includes(projectText)
          })

          // Calculate goal progress
          const keyResults = goal.keyResults || []
          const totalWeight = keyResults.reduce((sum, kr) => sum + (kr.weight || 0), 0)
          const weightedProgress = keyResults.reduce((sum, kr) => {
            const progress = ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100
            const clampedProgress = Math.max(0, Math.min(100, progress))
            return sum + (clampedProgress * (kr.weight || 0))
          }, 0)
          const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0

          // Calculate confidence
          const avgConfidence = keyResults.length > 0
            ? Math.round(keyResults.reduce((sum, kr) => sum + (kr.confidence || 5), 0) / keyResults.length)
            : 5

          return {
            id: goal.id,
            title: goal.title,
            description: goal.description,
            level: goal.level,
            quarter: goal.quarter,
            owner: goal.owner,
            status: goal.status,
            progress: overallProgress,
            confidence: avgConfidence,
            keyResults: keyResults.map((kr) => {
              const progress = ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100
              const clampedProgress = Math.max(0, Math.min(100, progress))
              return {
                id: kr.id,
                title: kr.title,
                progress: Math.round(clampedProgress),
                currentValue: kr.currentValue,
                targetValue: kr.targetValue,
                unit: kr.unit,
                weight: kr.weight,
                confidence: kr.confidence,
                latestCheckIn: kr.checkIns && kr.checkIns.length > 0 ? kr.checkIns[0] : null,
              }
            }),
            relatedProjects: relatedProjects.map((p) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              progress: p.progress || 0,
              totalTasks: p.tasks.length,
              completedTasks: p.tasks.filter((t) => t.status === 'DONE').length,
              upcomingReleases: p.releases.length,
            })),
          }
        })

        // Group by quarter
        const quarterlyView: { [key: string]: any[] } = {}
        strategicInitiatives.forEach((initiative) => {
          const quarterKey = initiative.quarter
          if (!quarterlyView[quarterKey]) {
            quarterlyView[quarterKey] = []
          }
          quarterlyView[quarterKey].push(initiative)
        })

        // Calculate summary statistics
        const summary = {
          totalInitiatives: strategicInitiatives.length,
          activeInitiatives: strategicInitiatives.filter((i) => i.status === 'ACTIVE').length,
          avgProgress: strategicInitiatives.length > 0
            ? Math.round(strategicInitiatives.reduce((sum, i) => sum + i.progress, 0) / strategicInitiatives.length)
            : 0,
          avgConfidence: strategicInitiatives.length > 0
            ? Math.round(strategicInitiatives.reduce((sum, i) => sum + i.confidence, 0) / strategicInitiatives.length)
            : 0,
          totalProjects: projects.length,
          alignedProjects: strategicInitiatives.reduce((sum, i) => sum + i.relatedProjects.length, 0),
        }

        return NextResponse.json({
          initiatives: strategicInitiatives,
          quarterlyView,
          summary,
          currentQuarter: currentQuarter,
          currentYear: currentYear,
        })
      } catch (error) {
        console.error('Error fetching strategic planning data:', error)
        return NextResponse.json(
          { error: 'Failed to fetch strategic planning data' },
          { status: 500 }
        )
      }
    }
  )
}


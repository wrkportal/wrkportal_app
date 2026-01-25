import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getBudgetDataForAI } from '@/lib/ai/data-access'
import { forecastBudget } from '@/lib/ai/services/budget-forecaster'
import { Prisma } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      projectName, 
      totalBudget, 
      currentSpend, 
      spendHistory, 
      projectDuration, 
      completionPercentage 
    } = body

    let forecast

    // If projectId provided, fetch real data
    if (projectId) {
      const projectData = await getBudgetDataForAI(projectId, session.user.tenantId)

      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const budgetData = projectData.budget as any
      const totalBudgetValue = budgetData?.totalBudget || budgetData?.total || 0
      const spentValue = budgetData?.spentToDate || budgetData?.spent || 0

      // Calculate spend history from timesheets
      type TimesheetWithSelectedFields = Prisma.TimesheetGetPayload<{
        select: {
          date: true
          hours: true
          billable: true
        }
      }>
      
      const monthlySpend = new Map<string, number>()
      projectData.timesheets.forEach((ts: TimesheetWithSelectedFields) => {
        const month = ts.date.toISOString().slice(0, 7) // YYYY-MM
        const current = monthlySpend.get(month) || 0
        monthlySpend.set(month, current + Number(ts.hours) * 100) // Assuming $100/hour rate
      })

      // Transform data to match BudgetForecastContext interface
      const historicalSpend = Array.from(monthlySpend.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({
          date: new Date(month + '-01'), // Convert YYYY-MM to Date
          amount,
        }))

      // Calculate remaining days
      const today = new Date()
      const endDate = projectData.endDate
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

      // Create Budget object
      const budget = {
        id: projectData.id + '-budget',
        entityId: projectData.id,
        entityType: 'PROJECT' as const,
        type: 'OPEX' as const,
        currency: 'USD',
        totalBudget: totalBudgetValue,
        spentToDate: spentValue,
        committed: spentValue * 1.1, // Estimate committed as 110% of spent
        forecast: spentValue * 1.2, // Estimate forecast as 120% of spent
        variance: totalBudgetValue - spentValue,
        categories: [], // Empty categories array
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Create Project object
      const project = {
        id: projectData.id,
        tenantId: session.user.tenantId,
        name: projectData.name,
        description: projectData.code || '',
        code: projectData.code || '',
        status: projectData.status as any,
        ragStatus: 'GREEN' as any,
        ownerId: '',
        managerId: '',
        teamMembers: [],
        startDate: projectData.startDate,
        endDate: projectData.endDate,
        plannedStartDate: projectData.startDate,
        plannedEndDate: projectData.endDate,
        budget: budget as any,
        progress: projectData.progress || 0,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      forecast = await forecastBudget({
        budget: budget as any,
        project: project as any,
        historicalSpend,
        remainingDays,
      })
    } else {
      // Use manually provided data
      if (!totalBudget || !currentSpend) {
        return NextResponse.json(
          { error: 'Total budget and current spend are required' },
          { status: 400 }
        )
      }

      // Create placeholder Budget and Project objects for manual data
      const budget = {
        id: 'manual-budget',
        entityId: 'manual-project',
        entityType: 'PROJECT' as const,
        type: 'OPEX' as const,
        currency: 'USD',
        totalBudget: Number(totalBudget),
        spentToDate: Number(currentSpend),
        committed: Number(currentSpend) * 1.1,
        forecast: Number(currentSpend) * 1.2,
        variance: Number(totalBudget) - Number(currentSpend),
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const project = {
        id: 'manual-project',
        tenantId: session.user.tenantId,
        name: projectName || 'Project',
        description: '',
        code: '',
        status: 'IN_PROGRESS' as any,
        ragStatus: 'GREEN' as any,
        ownerId: '',
        managerId: '',
        teamMembers: [],
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Default 90 days
        plannedStartDate: new Date(),
        plannedEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        budget: budget as any,
        progress: Number(completionPercentage) || 0,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Parse spendHistory if provided, otherwise use empty array
      const historicalSpend: { date: Date; amount: number }[] = []
      if (spendHistory) {
        // Try to parse spendHistory string (format: "YYYY-MM: $amount\n...")
        const lines: string[] = spendHistory.split('\n')
        lines.forEach((line: string) => {
          const match = line.match(/(\d{4}-\d{2}):\s*\$\s*(\d+)/)
          if (match) {
            historicalSpend.push({
              date: new Date(match[1] + '-01'),
              amount: Number(match[2]),
            })
          }
        })
      }

      // Calculate remaining days from projectDuration if provided
      let remainingDays = 30 // Default
      if (projectDuration) {
        // Try to extract days from duration string
        const daysMatch = projectDuration.match(/(\d+)\s*days?/i)
        if (daysMatch) {
          remainingDays = Number(daysMatch[1])
        }
      }

      forecast = await forecastBudget({
        budget: budget as any,
        project: project as any,
        historicalSpend,
        remainingDays,
      })
    }

    return NextResponse.json({ forecast })
  } catch (error) {
    console.error('Budget forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate budget forecast' },
      { status: 500 }
    )
  }
}

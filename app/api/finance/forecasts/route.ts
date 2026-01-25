import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { forecastBudget } from '@/lib/ai/services/budget-forecaster'
import { Prisma } from '@prisma/client'

const createForecastSchema = z.object({
  budgetId: z.string(),
  projectId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  forecastType: z.enum(['AI_POWERED', 'MANUAL', 'SCENARIO', 'HYBRID']).default('AI_POWERED'),
  scenario: z.enum(['BEST_CASE', 'BASE_CASE', 'WORST_CASE']).optional(),
  model: z.enum(['LINEAR', 'EXPONENTIAL', 'SEASONAL', 'MOVING_AVERAGE', 'CUSTOM']).default('LINEAR'),
  forecastedAmount: z.number().positive().optional(), // For manual forecasts
})

// GET /api/finance/forecasts - List forecasts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budgetId')
    const projectId = searchParams.get('projectId')
    const forecastType = searchParams.get('forecastType')

    const where: any = {
      budget: {
        tenantId: (session.user as any).tenantId,
      },
    }

    if (budgetId) where.budgetId = budgetId
    if (projectId) where.projectId = projectId
    if (forecastType) where.forecastType = forecastType

    const forecasts = await prisma.forecast.findMany({
      where,
      include: {
        budget: {
          select: { id: true, name: true, totalAmount: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
        dataPoints: {
          orderBy: { date: 'asc' },
          take: 50,
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: 50,
    })

    return NextResponse.json({ forecasts })
  } catch (error: any) {
    console.error('Error fetching forecasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecasts', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/forecasts - Generate forecast
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER', 'EXECUTIVE']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = createForecastSchema.parse(body)

    // Verify budget exists
    type BudgetWithIncludes = Prisma.BudgetGetPayload<{
      include: {
        categories: true
        actuals: true
      }
    }>

    const budget: BudgetWithIncludes | null = await prisma.budget.findFirst({
      where: {
        id: data.budgetId,
        tenantId: (session.user as any).tenantId,
      },
      include: {
        categories: true,
        actuals: {
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    type CostActual = BudgetWithIncludes['actuals'][0]

    let forecastedAmount: number
    let confidence: number
    let confidenceLow: number | undefined
    let confidenceHigh: number | undefined
    let assumptions: any = null

    // Generate forecast based on type
    if (data.forecastType === 'AI_POWERED' || data.forecastType === 'HYBRID') {
      // Use AI forecasting
      const project = data.projectId
        ? await prisma.project.findFirst({
            where: {
              id: data.projectId,
              tenantId: (session.user as any).tenantId,
            },
          })
        : null

      // Calculate remaining days
      const endDate = new Date(budget.endDate)
      const today = new Date()
      const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

      // Prepare historical spend data
      const historicalSpend = budget.actuals.map((cost: CostActual) => ({
        date: cost.date,
        amount: Number(cost.amount),
      }))

      // Calculate committed (pending costs)
      const pendingCosts: Prisma.CostActualGetPayload<{}>[] = await prisma.costActual.findMany({
        where: {
          budgetId: budget.id,
          approvedAt: null,
        },
      })
      const committed = pendingCosts.reduce((sum: number, c: Prisma.CostActualGetPayload<{}>) => sum + Number(c.amount), 0)
      const spentToDate = budget.actuals.reduce((sum: number, c: CostActual) => sum + Number(c.amount), 0)
      const totalBudget = Number(budget.totalAmount)
      const variance = totalBudget - spentToDate

      // Call AI forecasting service
      // Determine entity type and ID
      const entityId = budget.projectId || budget.programId || budget.portfolioId || budget.id
      const entityType = budget.projectId ? 'PROJECT' : budget.programId ? 'PROGRAM' : 'PORTFOLIO'

      const aiForecast = await forecastBudget({
        budget: {
          id: budget.id,
          entityId,
          entityType: entityType as 'PROJECT' | 'PROGRAM' | 'PORTFOLIO',
          type: 'CAPEX' as any, // Default to CAPEX since type is not in Prisma schema
          currency: budget.currency,
          totalBudget,
          spentToDate,
          committed,
          forecast: totalBudget, // Initial forecast equals budget
          variance,
          categories: budget.categories.map((cat: BudgetWithIncludes['categories'][0]) => ({
            name: cat.name,
            allocated: Number(cat.allocatedAmount),
            spent: Number(cat.spentAmount),
            percentage: Number(cat.percentage),
          })),
          createdAt: budget.createdAt,
          updatedAt: budget.updatedAt,
        },
        project: project || {
          id: data.projectId || budget.id,
          name: budget.name,
          progress: 0,
          code: '',
          description: '',
          startDate: budget.startDate,
          endDate: budget.endDate,
          status: 'IN_PROGRESS' as any,
          ragStatus: 'GREEN' as any,
          budget: {} as any,
        } as any,
        historicalSpend,
        remainingDays,
      })

      forecastedAmount = aiForecast.forecastedFinalCost
      confidence = aiForecast.confidence
      confidenceLow = aiForecast.confidenceInterval.low
      confidenceHigh = aiForecast.confidenceInterval.high
      assumptions = {
        thresholdAlerts: aiForecast.thresholdAlerts,
        costOptimizations: aiForecast.costOptimizations,
        assumptions: aiForecast.assumptions,
      }
    } else if (data.forecastType === 'MANUAL') {
      // Manual forecast
      if (!data.forecastedAmount) {
        return NextResponse.json({ error: 'forecastedAmount is required for manual forecasts' }, { status: 400 })
      }
      forecastedAmount = data.forecastedAmount
      confidence = 100 // User-provided, assume 100% confidence
      assumptions = { note: 'Manual forecast entered by user' }
    } else {
      // Scenario-based forecast
      const baseAmount = Number(budget.totalAmount)
      const currentSpend = budget.actuals.reduce((sum: number, c: CostActual) => sum + Number(c.amount), 0)
      const remainingBudget = baseAmount - currentSpend

      switch (data.scenario) {
        case 'BEST_CASE':
          forecastedAmount = currentSpend + remainingBudget * 0.8 // 20% savings
          confidence = 60
          break
        case 'WORST_CASE':
          forecastedAmount = currentSpend + remainingBudget * 1.3 // 30% overrun
          confidence = 70
          break
        case 'BASE_CASE':
        default:
          forecastedAmount = baseAmount // On budget
          confidence = 80
          break
      }
      assumptions = { scenario: data.scenario }
    }

    // Create forecast record
    const forecast = await prisma.forecast.create({
      data: {
        budgetId: data.budgetId,
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        forecastType: data.forecastType,
        scenario: data.scenario,
        model: data.model,
        forecastedAmount,
        confidence,
        confidenceLow,
        confidenceHigh,
        assumptions,
        generatedBy: (session.user as any).id,
      },
      include: {
        budget: {
          select: { id: true, name: true, totalAmount: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    })

    return NextResponse.json({ forecast }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to create forecast', details: error.message },
      { status: 500 }
    )
  }
}


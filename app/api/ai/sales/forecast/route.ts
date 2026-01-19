import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { forecastRevenue } from '@/lib/ai/services/sales/revenue-forecaster'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { periods, forecastType = 'MONTHLY' } = await request.json()

    if (!periods || !Array.isArray(periods)) {
      return NextResponse.json({ error: 'Periods array is required' }, { status: 400 })
    }

    const tenantId = session.user.tenantId!

    // Fetch historical data (last 12 months of won opportunities)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const wonOpportunities = await prisma.salesOpportunity.findMany({
      where: {
        tenantId,
        status: 'WON',
        actualCloseDate: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        amount: true,
        actualCloseDate: true,
      },
    })

    // Group by period
    const historicalMap = new Map<string, { actualRevenue: number; wonDeals: number }>()
    
    wonOpportunities.forEach(opp => {
      if (!opp.actualCloseDate) return
      
      const date = new Date(opp.actualCloseDate)
      let period: string
      
      if (forecastType === 'MONTHLY') {
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      } else if (forecastType === 'QUARTERLY') {
        const quarter = Math.floor(date.getMonth() / 3) + 1
        period = `${date.getFullYear()}-Q${quarter}`
      } else {
        period = String(date.getFullYear())
      }

      const existing = historicalMap.get(period) || { actualRevenue: 0, wonDeals: 0 }
      historicalMap.set(period, {
        actualRevenue: existing.actualRevenue + Number(opp.amount || 0),
        wonDeals: existing.wonDeals + 1,
      })
    })

    const historicalData = Array.from(historicalMap.entries()).map(([period, data]) => ({
      period,
      actualRevenue: data.actualRevenue,
      wonDeals: data.wonDeals,
      pipelineValue: 0, // Would need historical pipeline data
    }))

    // Fetch current pipeline
    const openOpportunities = await prisma.salesOpportunity.findMany({
      where: {
        tenantId,
        status: 'OPEN',
      },
      select: {
        amount: true,
        probability: true,
        stage: true,
      },
    })

    const totalValue = openOpportunities.reduce((sum, opp) => sum + Number(opp.amount || 0), 0)
    const weightedValue = openOpportunities.reduce(
      (sum, opp) => sum + (Number(opp.amount || 0) * (opp.probability || 0)) / 100,
      0
    )

    const stageMap = new Map<string, { count: number; value: number; weightedValue: number }>()
    
    openOpportunities.forEach(opp => {
      const stage = opp.stage
      const amount = Number(opp.amount || 0)
      const weighted = (amount * (opp.probability || 0)) / 100
      
      const existing = stageMap.get(stage) || { count: 0, value: 0, weightedValue: 0 }
      stageMap.set(stage, {
        count: existing.count + 1,
        value: existing.value + amount,
        weightedValue: existing.weightedValue + weighted,
      })
    })

    const byStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      ...data,
    }))

    // Prepare forecast input
    const forecastInput = {
      historicalData,
      currentPipeline: {
        totalValue,
        weightedValue,
        byStage,
      },
      periods,
      forecastType,
    }

    // Generate forecast
    const forecasts = await forecastRevenue(forecastInput)

    return NextResponse.json({ forecasts })
  } catch (error: any) {
    console.error('Error forecasting revenue:', error)
    return NextResponse.json(
      { error: 'Failed to forecast revenue', details: error.message },
      { status: 500 }
    )
  }
}


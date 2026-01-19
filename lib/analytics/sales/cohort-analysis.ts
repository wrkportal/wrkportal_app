/**
 * Cohort Analysis Service
 * 
 * Analyzes customer cohorts over time (by acquisition period, source, etc.)
 */

import { prisma } from '@/lib/prisma'

export interface CohortData {
  cohort: string // e.g., "2024-01" (month-year)
  cohortSize: number
  periods: {
    period: string // e.g., "2024-01", "2024-02"
    activeCustomers: number
    revenue: number
    retentionRate: number
  }[]
}

export interface CohortAnalysis {
  cohorts: CohortData[]
  cohortType: 'month' | 'quarter' | 'year'
  metric: 'revenue' | 'customers' | 'orders'
}

/**
 * Analyze customer cohorts by acquisition month
 */
export async function analyzeCohorts(
  tenantId: string,
  cohortType: 'month' | 'quarter' | 'year' = 'month',
  metric: 'revenue' | 'customers' | 'orders' = 'revenue',
  startDate?: Date,
  endDate?: Date
): Promise<CohortAnalysis> {
  // Get all accounts/contacts with their first order/opportunity
  const accounts = await prisma.salesAccount.findMany({
    where: {
      tenantId,
      ...(startDate ? {
        createdAt: { gte: startDate }
      } : {})
    },
    include: {
      opportunities: {
        where: {
          stage: 'CLOSED_WON',
          ...(endDate ? {
            actualCloseDate: { lte: endDate }
          } : {})
        },
        select: {
          id: true,
          amount: true,
          actualCloseDate: true,
          createdAt: true
        }
      },
      orders: {
        ...(endDate ? {
          where: {
            createdAt: { lte: endDate }
          }
        } : {}),
        select: {
          id: true,
          totalAmount: true,
          createdAt: true
        }
      }
    }
  })

  // Group accounts by cohort (acquisition period)
  const cohortMap = new Map<string, typeof accounts>()

  accounts.forEach(account => {
    const cohortDate = account.createdAt
    let cohort: string

    if (cohortType === 'month') {
      cohort = `${cohortDate.getFullYear()}-${String(cohortDate.getMonth() + 1).padStart(2, '0')}`
    } else if (cohortType === 'quarter') {
      const quarter = Math.floor(cohortDate.getMonth() / 3) + 1
      cohort = `${cohortDate.getFullYear()}-Q${quarter}`
    } else {
      cohort = String(cohortDate.getFullYear())
    }

    if (!cohortMap.has(cohort)) {
      cohortMap.set(cohort, [])
    }
    cohortMap.get(cohort)!.push(account)
  })

  // Build cohort data
  const cohorts: CohortData[] = []

  cohortMap.forEach((accountsInCohort, cohort) => {
    // Get all periods for this cohort
    const periods: CohortData['periods'] = []

    // Find the date range for all periods
    const allOpportunities = accountsInCohort.flatMap(acc => acc.opportunities)
    const allOrders = accountsInCohort.flatMap(acc => acc.orders)
    
    const allDates = [
      ...allOpportunities.map(opp => opp.actualCloseDate || opp.createdAt),
      ...allOrders.map(order => order.createdAt)
    ].filter(Boolean) as Date[]

    if (allDates.length === 0) {
      return // Skip cohorts with no activity
    }

    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = endDate || new Date(Math.max(...allDates.map(d => d.getTime())))

    // Generate periods from cohort start to max date
    const cohortStart = new Date(cohort.includes('Q') 
      ? `${cohort.split('-')[0]}-${(parseInt(cohort.split('Q')[1]) - 1) * 3 + 1}-01`
      : cohort.includes('-') && cohort.split('-')[1].length === 2
      ? `${cohort}-01`
      : `${cohort}-01-01`
    )

    let currentPeriod = new Date(cohortStart)
    const periodsSet = new Set<string>()

    while (currentPeriod <= maxDate) {
      let period: string

      if (cohortType === 'month') {
        period = `${currentPeriod.getFullYear()}-${String(currentPeriod.getMonth() + 1).padStart(2, '0')}`
        currentPeriod.setMonth(currentPeriod.getMonth() + 1)
      } else if (cohortType === 'quarter') {
        const quarter = Math.floor(currentPeriod.getMonth() / 3) + 1
        period = `${currentPeriod.getFullYear()}-Q${quarter}`
        currentPeriod.setMonth(currentPeriod.getMonth() + 3)
      } else {
        period = String(currentPeriod.getFullYear())
        currentPeriod.setFullYear(currentPeriod.getFullYear() + 1)
      }

      if (periodsSet.has(period)) break
      periodsSet.add(period)

      // Calculate metrics for this period
      const periodStart = new Date(currentPeriod)
      if (cohortType === 'month') {
        periodStart.setMonth(periodStart.getMonth() - 1)
      } else if (cohortType === 'quarter') {
        periodStart.setMonth(periodStart.getMonth() - 3)
      } else {
        periodStart.setFullYear(periodStart.getFullYear() - 1)
      }

      const periodEnd = new Date(currentPeriod)

      let activeCustomers = 0
      let revenue = 0
      let orders = 0

      accountsInCohort.forEach(account => {
        const periodOpps = account.opportunities.filter(opp => {
          const oppDate = opp.actualCloseDate || opp.createdAt
          return oppDate >= periodStart && oppDate < periodEnd
        })
        const periodOrders = account.orders.filter(order => {
          return order.createdAt >= periodStart && order.createdAt < periodEnd
        })

        if (periodOpps.length > 0 || periodOrders.length > 0) {
          activeCustomers++
          revenue += periodOpps.reduce((sum, opp) => sum + Number(opp.amount), 0)
          revenue += periodOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)
          orders += periodOrders.length
        }
      })

      const retentionRate = accountsInCohort.length > 0
        ? (activeCustomers / accountsInCohort.length) * 100
        : 0

      periods.push({
        period,
        activeCustomers,
        revenue: Number(revenue),
        retentionRate: Math.round(retentionRate * 100) / 100
      })
    }

    cohorts.push({
      cohort,
      cohortSize: accountsInCohort.length,
      periods
    })
  })

  // Sort cohorts by date
  cohorts.sort((a, b) => a.cohort.localeCompare(b.cohort))

  return {
    cohorts,
    cohortType,
    metric
  }
}


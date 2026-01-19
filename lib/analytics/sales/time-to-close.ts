/**
 * Time-to-Close Analysis Service
 * 
 * Analyzes average time to close deals by stage, rep, industry, etc.
 */

import { prisma } from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'

export interface TimeToCloseMetrics {
  overall: {
    avgDays: number
    medianDays: number
    minDays: number
    maxDays: number
  }
  byStage: {
    stage: OpportunityStage
    name: string
    avgDays: number
    count: number
  }[]
  byRep: {
    repId: string
    repName: string
    avgDays: number
    count: number
  }[]
  byIndustry: {
    industry: string
    avgDays: number
    count: number
  }[]
  trend: {
    period: string // e.g., "2024-01"
    avgDays: number
    count: number
  }[]
}

/**
 * Analyze time to close
 */
export async function analyzeTimeToClose(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<TimeToCloseMetrics> {
  const where: any = {
    tenantId,
    stage: 'CLOSED_WON',
    actualCloseDate: { not: null }
  }

  if (startDate || endDate) {
    where.actualCloseDate = {}
    if (startDate) {
      where.actualCloseDate.gte = startDate
    }
    if (endDate) {
      where.actualCloseDate.lte = endDate
    }
  }

  // Get closed won opportunities with related data
  const opportunities = await prisma.salesOpportunity.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      account: {
        select: {
          industry: true
        }
      }
    },
    select: {
      id: true,
      createdAt: true,
      actualCloseDate: true,
      stage: true,
      ownerId: true,
      account: {
        select: {
          industry: true
        }
      }
    }
  })

  // Calculate overall metrics
  const daysToClose = opportunities
    .filter(opp => opp.actualCloseDate)
    .map(opp => {
      const days = Math.round(
        (opp.actualCloseDate!.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      return days
    })
    .sort((a, b) => a - b)

  const overall = {
    avgDays: daysToClose.length > 0
      ? Math.round((daysToClose.reduce((sum, days) => sum + days, 0) / daysToClose.length) * 10) / 10
      : 0,
    medianDays: daysToClose.length > 0
      ? daysToClose[Math.floor(daysToClose.length / 2)]
      : 0,
    minDays: daysToClose.length > 0 ? daysToClose[0] : 0,
    maxDays: daysToClose.length > 0 ? daysToClose[daysToClose.length - 1] : 0
  }

  // By stage (for opportunities that went through different stages)
  // Note: This is simplified - in production, track stage entry/exit dates
  const byStage: TimeToCloseMetrics['byStage'] = []

  // By rep
  const repMap = new Map<string, { days: number[], name: string }>()
  opportunities.forEach(opp => {
    if (!opp.actualCloseDate) return
    const days = Math.round(
      (opp.actualCloseDate.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const repId = opp.ownerId
    if (!repMap.has(repId)) {
      repMap.set(repId, {
        days: [],
        name: `${opp.owner?.firstName || ''} ${opp.owner?.lastName || ''}`.trim() || 'Unknown'
      })
    }
    repMap.get(repId)!.days.push(days)
  })

  const byRep: TimeToCloseMetrics['byRep'] = Array.from(repMap.entries()).map(([repId, data]) => ({
    repId,
    repName: data.name,
    avgDays: Math.round((data.days.reduce((sum, d) => sum + d, 0) / data.days.length) * 10) / 10,
    count: data.days.length
  })).sort((a, b) => a.avgDays - b.avgDays)

  // By industry
  const industryMap = new Map<string, number[]>()
  opportunities.forEach(opp => {
    if (!opp.actualCloseDate || !opp.account?.industry) return
    const days = Math.round(
      (opp.actualCloseDate.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const industry = opp.account.industry
    if (!industryMap.has(industry)) {
      industryMap.set(industry, [])
    }
    industryMap.get(industry)!.push(days)
  })

  const byIndustry: TimeToCloseMetrics['byIndustry'] = Array.from(industryMap.entries()).map(([industry, days]) => ({
    industry,
    avgDays: Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) / 10,
    count: days.length
  })).sort((a, b) => a.avgDays - b.avgDays)

  // Trend by month
  const trendMap = new Map<string, number[]>()
  opportunities.forEach(opp => {
    if (!opp.actualCloseDate) return
    const days = Math.round(
      (opp.actualCloseDate.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    const period = `${opp.actualCloseDate.getFullYear()}-${String(opp.actualCloseDate.getMonth() + 1).padStart(2, '0')}`
    if (!trendMap.has(period)) {
      trendMap.set(period, [])
    }
    trendMap.get(period)!.push(days)
  })

  const trend: TimeToCloseMetrics['trend'] = Array.from(trendMap.entries())
    .map(([period, days]) => ({
      period,
      avgDays: Math.round((days.reduce((sum, d) => sum + d, 0) / days.length) * 10) / 10,
      count: days.length
    }))
    .sort((a, b) => a.period.localeCompare(b.period))

  return {
    overall,
    byStage,
    byRep,
    byIndustry,
    trend
  }
}


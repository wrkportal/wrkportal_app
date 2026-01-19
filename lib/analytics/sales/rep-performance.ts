/**
 * Rep Performance Analytics Service
 * 
 * Analyzes individual and team sales rep performance
 */

import { prisma } from '@/lib/prisma'

export interface RepPerformanceMetrics {
  repId: string
  repName: string
  period: {
    startDate: Date
    endDate: Date
  }
  opportunities: {
    total: number
    open: number
    closedWon: number
    closedLost: number
    totalValue: number
    wonValue: number
    avgDealSize: number
  }
  activities: {
    total: number
    calls: number
    emails: number
    meetings: number
    avgPerWeek: number
  }
  conversion: {
    leadToOpportunity: number
    opportunityToWin: number
    overallConversion: number
  }
  velocity: {
    avgTimeToClose: number // days
    dealsClosedThisPeriod: number
    pipelineVelocity: number // deals closed per month
  }
  quota: {
    quota?: number
    achieved?: number
    percentage?: number
  }
}

export interface TeamPerformanceComparison {
  repMetrics: RepPerformanceMetrics[]
  teamAverages: {
    avgDealSize: number
    avgWinRate: number
    avgTimeToClose: number
    avgActivitiesPerWeek: number
  }
  rankings: {
    byRevenue: { repId: string; repName: string; rank: number }[]
    byWinRate: { repId: string; repName: string; rank: number }[]
    byActivity: { repId: string; repName: string; rank: number }[]
  }
}

/**
 * Analyze individual rep performance
 */
export async function analyzeRepPerformance(
  tenantId: string,
  repId: string,
  startDate?: Date,
  endDate?: Date
): Promise<RepPerformanceMetrics> {
  const where: any = {
    tenantId,
    ownerId: repId
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  // Get rep info
  const rep = await prisma.user.findUnique({
    where: { id: repId },
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  })

  // Get opportunities
  const opportunities = await prisma.salesOpportunity.findMany({
    where,
    select: {
      id: true,
      amount: true,
      stage: true,
      status: true,
      createdAt: true,
      actualCloseDate: true
    }
  })

  // Get activities
  const activities = await prisma.salesActivity.findMany({
    where: {
      tenantId,
      userId: repId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {})
        }
      } : {})
    },
    select: {
      id: true,
      type: true,
      createdAt: true
    }
  })

  // Get leads converted by this rep
  const leads = await prisma.salesLead.findMany({
    where: {
      tenantId,
      ownerId: repId,
      status: 'CONVERTED',
      ...(startDate || endDate ? {
        convertedAt: {
          ...(startDate ? { gte: startDate } : {}),
          ...(endDate ? { lte: endDate } : {})
        }
      } : {})
    },
    select: {
      id: true
    }
  })

  // Calculate metrics
  const openOpps = opportunities.filter(opp => opp.status === 'OPEN')
  const closedWon = opportunities.filter(opp => opp.stage === 'CLOSED_WON')
  const closedLost = opportunities.filter(opp => opp.stage === 'CLOSED_LOST')
  const totalValue = opportunities.reduce((sum, opp) => sum + Number(opp.amount), 0)
  const wonValue = closedWon.reduce((sum, opp) => sum + Number(opp.amount), 0)

  // Calculate average deal size (won deals)
  const avgDealSize = closedWon.length > 0
    ? Number(wonValue) / closedWon.length
    : 0

  // Activity breakdown
  const calls = activities.filter(a => a.type === 'CALL').length
  const emails = activities.filter(a => a.type === 'EMAIL').length
  const meetings = activities.filter(a => a.type === 'MEETING').length

  // Calculate weeks in period
  const periodDays = startDate && endDate
    ? Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
    : 30
  const weeks = periodDays / 7
  const avgPerWeek = weeks > 0 ? activities.length / weeks : 0

  // Conversion rates
  const leadToOpportunity = leads.length > 0 && opportunities.length > 0
    ? (opportunities.length / leads.length) * 100
    : 0

  const closedTotal = closedWon.length + closedLost.length
  const opportunityToWin = closedTotal > 0
    ? (closedWon.length / closedTotal) * 100
    : 0

  const overallConversion = leads.length > 0 && closedWon.length > 0
    ? (closedWon.length / leads.length) * 100
    : 0

  // Velocity metrics
  const closedWonWithDate = closedWon.filter(opp => opp.actualCloseDate)
  const avgTimeToClose = closedWonWithDate.length > 0
    ? closedWonWithDate.reduce((sum, opp) => {
        const days = Math.round(
          (opp.actualCloseDate!.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        return sum + days
      }, 0) / closedWonWithDate.length
    : 0

  const pipelineVelocity = closedWon.length / (periodDays / 30) // deals per month

  return {
    repId,
    repName: `${rep?.firstName || ''} ${rep?.lastName || ''}`.trim() || 'Unknown',
    period: {
      startDate: startDate || new Date(0),
      endDate: endDate || new Date()
    },
    opportunities: {
      total: opportunities.length,
      open: openOpps.length,
      closedWon: closedWon.length,
      closedLost: closedLost.length,
      totalValue: Number(totalValue),
      wonValue: Number(wonValue),
      avgDealSize: Math.round(avgDealSize * 100) / 100
    },
    activities: {
      total: activities.length,
      calls,
      emails,
      meetings,
      avgPerWeek: Math.round(avgPerWeek * 10) / 10
    },
    conversion: {
      leadToOpportunity: Math.round(leadToOpportunity * 100) / 100,
      opportunityToWin: Math.round(opportunityToWin * 100) / 100,
      overallConversion: Math.round(overallConversion * 100) / 100
    },
    velocity: {
      avgTimeToClose: Math.round(avgTimeToClose * 10) / 10,
      dealsClosedThisPeriod: closedWon.length,
      pipelineVelocity: Math.round(pipelineVelocity * 10) / 10
    },
    quota: {} // Quota tracking would be implemented separately
  }
}

/**
 * Compare team performance
 */
export async function compareTeamPerformance(
  tenantId: string,
  repIds: string[],
  startDate?: Date,
  endDate?: Date
): Promise<TeamPerformanceComparison> {
  const repMetrics = await Promise.all(
    repIds.map(repId => analyzeRepPerformance(tenantId, repId, startDate, endDate))
  )

  // Calculate team averages
  const teamAverages = {
    avgDealSize: repMetrics.length > 0
      ? repMetrics.reduce((sum, rep) => sum + rep.opportunities.avgDealSize, 0) / repMetrics.length
      : 0,
    avgWinRate: repMetrics.length > 0
      ? repMetrics.reduce((sum, rep) => {
          const total = rep.opportunities.closedWon + rep.opportunities.closedLost
          const winRate = total > 0 ? (rep.opportunities.closedWon / total) * 100 : 0
          return sum + winRate
        }, 0) / repMetrics.length
      : 0,
    avgTimeToClose: repMetrics.length > 0
      ? repMetrics.reduce((sum, rep) => sum + rep.velocity.avgTimeToClose, 0) / repMetrics.length
      : 0,
    avgActivitiesPerWeek: repMetrics.length > 0
      ? repMetrics.reduce((sum, rep) => sum + rep.activities.avgPerWeek, 0) / repMetrics.length
      : 0
  }

  // Rankings
  const byRevenue = repMetrics
    .map(rep => ({
      repId: rep.repId,
      repName: rep.repName,
      revenue: rep.opportunities.wonValue
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .map((rep, index) => ({ ...rep, rank: index + 1 }))

  const byWinRate = repMetrics
    .map(rep => {
      const total = rep.opportunities.closedWon + rep.opportunities.closedLost
      const winRate = total > 0 ? (rep.opportunities.closedWon / total) * 100 : 0
      return {
        repId: rep.repId,
        repName: rep.repName,
        winRate
      }
    })
    .sort((a, b) => b.winRate - a.winRate)
    .map((rep, index) => ({ ...rep, rank: index + 1 }))

  const byActivity = repMetrics
    .map(rep => ({
      repId: rep.repId,
      repName: rep.repName,
      activities: rep.activities.total
    }))
    .sort((a, b) => b.activities - a.activities)
    .map((rep, index) => ({ ...rep, rank: index + 1 }))

  return {
    repMetrics,
    teamAverages,
    rankings: {
      byRevenue: byRevenue.map(({ revenue, ...rest }) => rest),
      byWinRate: byWinRate.map(({ winRate, ...rest }) => rest),
      byActivity: byActivity.map(({ activities, ...rest }) => rest)
    }
  }
}


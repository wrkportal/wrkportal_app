/**
 * Win Rate Analysis Service
 * 
 * Analyzes win rates by stage, rep, source, industry, etc.
 */

import { prisma } from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'

export interface WinRateMetrics {
  overall: {
    winRate: number // Percentage
    totalClosed: number
    won: number
    lost: number
  }
  byStage: {
    stage: OpportunityStage
    name: string
    winRate: number
    closed: number
    won: number
    lost: number
  }[]
  byRep: {
    repId: string
    repName: string
    winRate: number
    closed: number
    won: number
    lost: number
  }[]
  bySource: {
    source: string
    winRate: number
    closed: number
    won: number
    lost: number
  }[]
  byIndustry: {
    industry: string
    winRate: number
    closed: number
    won: number
    lost: number
  }[]
}

/**
 * Analyze win rates
 */
export async function analyzeWinRates(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<WinRateMetrics> {
  const where: any = {
    tenantId,
    status: 'CLOSED'
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

  // Get all closed opportunities
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
    }
  })

  const closedWon = opportunities.filter(opp => opp.stage === 'CLOSED_WON')
  const closedLost = opportunities.filter(opp => opp.stage === 'CLOSED_LOST')
  const totalClosed = closedWon.length + closedLost.length

  const overall = {
    winRate: totalClosed > 0
      ? Math.round((closedWon.length / totalClosed) * 100 * 100) / 100
      : 0,
    totalClosed,
    won: closedWon.length,
    lost: closedLost.length
  }

  // By stage (for opportunities that reached each stage before closing)
  const stageMap = new Map<OpportunityStage, { won: number, lost: number }>()
  
  // Get all opportunities that reached each stage (simplified - assumes current stage is the last reached)
  opportunities.forEach(opp => {
    // For closed opportunities, track by the stage they were in before closing
    // This is simplified - in production, track stage history
    const stage = opp.stage
    if (!stageMap.has(stage)) {
      stageMap.set(stage, { won: 0, lost: 0 })
    }
    if (opp.stage === 'CLOSED_WON') {
      stageMap.get(stage)!.won++
    } else if (opp.stage === 'CLOSED_LOST') {
      stageMap.get(stage)!.lost++
    }
  })

  const byStage: WinRateMetrics['byStage'] = Array.from(stageMap.entries())
    .filter(([stage]) => stage === 'CLOSED_WON' || stage === 'CLOSED_LOST')
    .map(([stage, data]) => {
      const closed = data.won + data.lost
      return {
        stage,
        name: formatStageName(stage),
        winRate: closed > 0
          ? Math.round((data.won / closed) * 100 * 100) / 100
          : 0,
        closed,
        won: data.won,
        lost: data.lost
      }
    })

  // By rep
  const repMap = new Map<string, { won: number, lost: number, name: string }>()
  opportunities.forEach(opp => {
    const repId = opp.ownerId
    if (!repMap.has(repId)) {
      repMap.set(repId, {
        won: 0,
        lost: 0,
        name: `${opp.owner?.firstName || ''} ${opp.owner?.lastName || ''}`.trim() || 'Unknown'
      })
    }
    if (opp.stage === 'CLOSED_WON') {
      repMap.get(repId)!.won++
    } else if (opp.stage === 'CLOSED_LOST') {
      repMap.get(repId)!.lost++
    }
  })

  const byRep: WinRateMetrics['byRep'] = Array.from(repMap.entries())
    .map(([repId, data]) => {
      const closed = data.won + data.lost
      return {
        repId,
        repName: data.name,
        winRate: closed > 0
          ? Math.round((data.won / closed) * 100 * 100) / 100
          : 0,
        closed,
        won: data.won,
        lost: data.lost
      }
    })
    .filter(rep => rep.closed > 0)
    .sort((a, b) => b.winRate - a.winRate)

  // By source
  const sourceMap = new Map<string, { won: number, lost: number }>()
  opportunities.forEach(opp => {
    const source = opp.leadSource || 'UNKNOWN'
    if (!sourceMap.has(source)) {
      sourceMap.set(source, { won: 0, lost: 0 })
    }
    if (opp.stage === 'CLOSED_WON') {
      sourceMap.get(source)!.won++
    } else if (opp.stage === 'CLOSED_LOST') {
      sourceMap.get(source)!.lost++
    }
  })

  const bySource: WinRateMetrics['bySource'] = Array.from(sourceMap.entries())
    .map(([source, data]) => {
      const closed = data.won + data.lost
      return {
        source,
        winRate: closed > 0
          ? Math.round((data.won / closed) * 100 * 100) / 100
          : 0,
        closed,
        won: data.won,
        lost: data.lost
      }
    })
    .filter(src => src.closed > 0)
    .sort((a, b) => b.winRate - a.winRate)

  // By industry
  const industryMap = new Map<string, { won: number, lost: number }>()
  opportunities.forEach(opp => {
    const industry = opp.account?.industry || 'Unknown'
    if (!industryMap.has(industry)) {
      industryMap.set(industry, { won: 0, lost: 0 })
    }
    if (opp.stage === 'CLOSED_WON') {
      industryMap.get(industry)!.won++
    } else if (opp.stage === 'CLOSED_LOST') {
      industryMap.get(industry)!.lost++
    }
  })

  const byIndustry: WinRateMetrics['byIndustry'] = Array.from(industryMap.entries())
    .map(([industry, data]) => {
      const closed = data.won + data.lost
      return {
        industry,
        winRate: closed > 0
          ? Math.round((data.won / closed) * 100 * 100) / 100
          : 0,
        closed,
        won: data.won,
        lost: data.lost
      }
    })
    .filter(ind => ind.closed > 0)
    .sort((a, b) => b.winRate - a.winRate)

  return {
    overall,
    byStage,
    byRep,
    bySource,
    byIndustry
  }
}

function formatStageName(stage: OpportunityStage): string {
  const names: Record<OpportunityStage, string> = {
    PROSPECTING: 'Prospecting',
    QUALIFICATION: 'Qualification',
    NEEDS_ANALYSIS: 'Needs Analysis',
    VALUE_PROPOSITION: 'Value Proposition',
    ID_DECISION_MAKERS: 'ID Decision Makers',
    PERCEPTION_ANALYSIS: 'Perception Analysis',
    PROPOSAL_PRICE_QUOTE: 'Proposal/Price Quote',
    NEGOTIATION_REVIEW: 'Negotiation/Review',
    CLOSED_WON: 'Closed Won',
    CLOSED_LOST: 'Closed Lost'
  }
  return names[stage] || stage
}


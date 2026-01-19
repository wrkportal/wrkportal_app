/**
 * Funnel Analysis Service
 * 
 * Analyzes conversion rates through sales pipeline stages
 */

import { prisma } from '@/lib/prisma'
import { OpportunityStage } from '@prisma/client'

export interface FunnelStage {
  stage: OpportunityStage
  name: string
  count: number
  amount: number
  conversionRate: number // Percentage of opportunities that reach this stage
  dropoffRate: number // Percentage of opportunities that drop off from previous stage
  avgTimeInStage: number // Average days in this stage
}

export interface FunnelAnalysis {
  stages: FunnelStage[]
  totalOpportunities: number
  totalValue: number
  overallConversionRate: number
  period: {
    startDate: Date
    endDate: Date
  }
}

/**
 * Analyze funnel performance
 */
export async function analyzeFunnel(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<FunnelAnalysis> {
  const where: any = {
    tenantId,
    createdAt: {}
  }

  if (startDate) {
    where.createdAt.gte = startDate
  }
  if (endDate) {
    where.createdAt.lte = endDate
  }

  // Get all opportunities
  const opportunities = await prisma.salesOpportunity.findMany({
    where,
    select: {
      id: true,
      stage: true,
      amount: true,
      createdAt: true,
      updatedAt: true,
      status: true,
      actualCloseDate: true
    }
  })

  // Define stage order
  const stageOrder: OpportunityStage[] = [
    'PROSPECTING',
    'QUALIFICATION',
    'NEEDS_ANALYSIS',
    'VALUE_PROPOSITION',
    'ID_DECISION_MAKERS',
    'PERCEPTION_ANALYSIS',
    'PROPOSAL_PRICE_QUOTE',
    'NEGOTIATION_REVIEW',
    'CLOSED_WON',
    'CLOSED_LOST'
  ]

  // Calculate stage metrics
  const stages: FunnelStage[] = []
  let previousCount = opportunities.length
  let previousAmount = opportunities.reduce((sum, opp) => sum + Number(opp.amount), 0)

  for (let i = 0; i < stageOrder.length; i++) {
    const stage = stageOrder[i]
    const stageOpportunities = opportunities.filter(opp => opp.stage === stage)
    const count = stageOpportunities.length
    const amount = stageOpportunities.reduce((sum, opp) => sum + Number(opp.amount), 0)

    // Calculate conversion rate (percentage of initial opportunities that reached this stage)
    const conversionRate = opportunities.length > 0
      ? (count / opportunities.length) * 100
      : 0

    // Calculate dropoff rate (percentage that dropped off from previous stage)
    const dropoffRate = previousCount > 0
      ? ((previousCount - count) / previousCount) * 100
      : 0

    // Calculate average time in stage (if closed)
    let avgTimeInStage = 0
    if (stage === 'CLOSED_WON' || stage === 'CLOSED_LOST') {
      const closedOpps = stageOpportunities.filter(opp => opp.actualCloseDate)
      if (closedOpps.length > 0) {
        const totalDays = closedOpps.reduce((sum, opp) => {
          const days = Math.round(
            (opp.actualCloseDate!.getTime() - opp.createdAt.getTime()) / (1000 * 60 * 60 * 24)
          )
          return sum + days
        }, 0)
        avgTimeInStage = totalDays / closedOpps.length
      }
    } else {
      // For open stages, calculate based on last update
      const stageOpps = stageOpportunities.filter(opp => {
        // Get activities for this opportunity to determine when it entered this stage
        return true // Simplified - in production, track stage entry dates
      })
      // Simplified calculation - in production, track stage entry dates
      avgTimeInStage = 0
    }

    stages.push({
      stage,
      name: formatStageName(stage),
      count,
      amount: Number(amount),
      conversionRate: Math.round(conversionRate * 100) / 100,
      dropoffRate: Math.round(dropoffRate * 100) / 100,
      avgTimeInStage: Math.round(avgTimeInStage * 10) / 10
    })

    previousCount = count
    previousAmount = amount
  }

  const closedWon = opportunities.filter(opp => opp.stage === 'CLOSED_WON')
  const overallConversionRate = opportunities.length > 0
    ? (closedWon.length / opportunities.length) * 100
    : 0

  return {
    stages,
    totalOpportunities: opportunities.length,
    totalValue: Number(opportunities.reduce((sum, opp) => sum + Number(opp.amount), 0)),
    overallConversionRate: Math.round(overallConversionRate * 100) / 100,
    period: {
      startDate: startDate || new Date(0),
      endDate: endDate || new Date()
    }
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


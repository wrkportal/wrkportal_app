/**
 * Attribution Analysis Service
 * 
 * Multi-touch attribution analysis for sales
 */

import { prisma } from '@/lib/prisma'

export interface AttributionTouchpoint {
  id: string
  type: 'EMAIL' | 'CALL' | 'MEETING' | 'WEBINAR' | 'EVENT' | 'CAMPAIGN' | 'WEBSITE' | 'REFERRAL'
  date: Date
  description: string
  contactId?: string
  opportunityId?: string
  leadId?: string
}

export interface AttributionResult {
  opportunityId: string
  opportunityName: string
  totalValue: number
  touchpoints: AttributionTouchpoint[]
  attribution: {
    firstTouch: AttributionTouchpoint | null
    lastTouch: AttributionTouchpoint | null
    linear: Record<string, number> // Touchpoint ID -> credit percentage
    timeDecay: Record<string, number>
    uShaped: Record<string, number>
    wShaped: Record<string, number>
  }
}

/**
 * Analyze attribution for an opportunity
 */
export async function analyzeOpportunityAttribution(
  opportunityId: string,
  tenantId: string
): Promise<AttributionResult> {
  const opportunity = await prisma.salesOpportunity.findUnique({
    where: {
      id: opportunityId,
      tenantId,
    },
    include: {
      activities: {
        orderBy: { createdAt: 'asc' },
      },
      account: true,
    },
  })

  if (!opportunity) {
    throw new Error('Opportunity not found')
  }

  // Collect all touchpoints
  const touchpoints: AttributionTouchpoint[] = []

  // Add activities as touchpoints
  for (const activity of opportunity.activities) {
    let type: AttributionTouchpoint['type'] = 'CALL'
    if (activity.type === 'EMAIL') type = 'EMAIL'
    else if (activity.type === 'MEETING') type = 'MEETING'
    else if (activity.type === 'CALL') type = 'CALL'

    touchpoints.push({
      id: activity.id,
      type,
      date: activity.createdAt,
      description: activity.subject || activity.type,
      opportunityId: opportunity.id,
    })
  }

  // Add lead source as first touchpoint if available
  if (opportunity.leadSource) {
    touchpoints.unshift({
      id: `lead-source-${opportunity.id}`,
      type: mapLeadSourceToTouchpoint(opportunity.leadSource),
      date: opportunity.createdAt,
      description: `Lead source: ${opportunity.leadSource}`,
      opportunityId: opportunity.id,
    })
  }

  // Calculate attribution models
  const attribution = calculateAttribution(touchpoints, opportunity.amount)

  return {
    opportunityId: opportunity.id,
    opportunityName: opportunity.name,
    totalValue: Number(opportunity.amount),
    touchpoints,
    attribution,
  }
}

/**
 * Analyze attribution for multiple opportunities
 */
export async function analyzeAttribution(
  tenantId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
    ownerId?: string
    stage?: string
  }
): Promise<AttributionResult[]> {
  const where: any = {
    tenantId,
    status: 'WON',
  }

  if (filters?.startDate || filters?.endDate) {
    where.actualCloseDate = {}
    if (filters.startDate) where.actualCloseDate.gte = filters.startDate
    if (filters.endDate) where.actualCloseDate.lte = filters.endDate
  }

  if (filters?.ownerId) where.ownerId = filters.ownerId
  if (filters?.stage) where.stage = filters.stage

  const opportunities = await prisma.salesOpportunity.findMany({
    where,
    include: {
      activities: {
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  const results: AttributionResult[] = []

  for (const opportunity of opportunities) {
    try {
      const result = await analyzeOpportunityAttribution(opportunity.id, tenantId)
      results.push(result)
    } catch (error) {
      console.error(`Error analyzing attribution for opportunity ${opportunity.id}:`, error)
    }
  }

  return results
}

/**
 * Calculate attribution using different models
 */
function calculateAttribution(
  touchpoints: AttributionTouchpoint[],
  totalValue: any
): AttributionResult['attribution'] {
  if (touchpoints.length === 0) {
    return {
      firstTouch: null,
      lastTouch: null,
      linear: {},
      timeDecay: {},
      uShaped: {},
      wShaped: {},
    }
  }

  const firstTouch = touchpoints[0]
  const lastTouch = touchpoints[touchpoints.length - 1]
  const numTouchpoints = touchpoints.length

  // Linear attribution: equal credit to all touchpoints
  const linear: Record<string, number> = {}
  const linearCredit = 100 / numTouchpoints
  touchpoints.forEach(tp => {
    linear[tp.id] = linearCredit
  })

  // Time decay: more credit to recent touchpoints
  const timeDecay: Record<string, number> = {}
  const now = Date.now()
  let totalTimeDecay = 0
  touchpoints.forEach(tp => {
    const daysSince = (now - tp.date.getTime()) / (1000 * 60 * 60 * 24)
    const weight = Math.exp(-daysSince / 30) // Exponential decay with 30-day half-life
    timeDecay[tp.id] = weight
    totalTimeDecay += weight
  })
  Object.keys(timeDecay).forEach(id => {
    timeDecay[id] = (timeDecay[id] / totalTimeDecay) * 100
  })

  // U-shaped: 40% first touch, 40% last touch, 20% distributed to middle
  const uShaped: Record<string, number> = {}
  if (numTouchpoints === 1) {
    uShaped[touchpoints[0].id] = 100
  } else if (numTouchpoints === 2) {
    uShaped[touchpoints[0].id] = 50
    uShaped[touchpoints[1].id] = 50
  } else {
    uShaped[touchpoints[0].id] = 40
    uShaped[touchpoints[numTouchpoints - 1].id] = 40
    const middleCredit = 20 / (numTouchpoints - 2)
    for (let i = 1; i < numTouchpoints - 1; i++) {
      uShaped[touchpoints[i].id] = middleCredit
    }
  }

  // W-shaped: 30% first touch, 30% opportunity creation, 30% last touch, 10% distributed
  const wShaped: Record<string, number> = {}
  if (numTouchpoints === 1) {
    wShaped[touchpoints[0].id] = 100
  } else if (numTouchpoints === 2) {
    wShaped[touchpoints[0].id] = 50
    wShaped[touchpoints[1].id] = 50
  } else {
    wShaped[touchpoints[0].id] = 30
    // Find opportunity creation touchpoint (usually second or third)
    const oppCreationIndex = Math.min(1, Math.floor(numTouchpoints / 2))
    wShaped[touchpoints[oppCreationIndex].id] = 30
    wShaped[touchpoints[numTouchpoints - 1].id] = 30
    const remainingCredit = 10 / (numTouchpoints - 3)
    for (let i = 0; i < numTouchpoints; i++) {
      if (i !== 0 && i !== oppCreationIndex && i !== numTouchpoints - 1) {
        wShaped[touchpoints[i].id] = remainingCredit
      }
    }
  }

  return {
    firstTouch,
    lastTouch,
    linear,
    timeDecay,
    uShaped,
    wShaped,
  }
}

function mapLeadSourceToTouchpoint(leadSource: string): AttributionTouchpoint['type'] {
  const mapping: Record<string, AttributionTouchpoint['type']> = {
    'WEB_FORM': 'WEBSITE',
    'EMAIL': 'EMAIL',
    'PHONE': 'CALL',
    'EVENT': 'EVENT',
    'REFERRAL': 'REFERRAL',
    'SOCIAL_MEDIA': 'CAMPAIGN',
    'LINKEDIN': 'CAMPAIGN',
    'ADVERTISING': 'CAMPAIGN',
  }
  return mapping[leadSource] || 'CAMPAIGN'
}

/**
 * Get attribution summary by touchpoint type
 */
export async function getAttributionSummary(
  tenantId: string,
  filters?: {
    startDate?: Date
    endDate?: Date
  }
) {
  const results = await analyzeAttribution(tenantId, filters)

  const summary: Record<string, {
    count: number
    totalValue: number
    linear: number
    timeDecay: number
    uShaped: number
    wShaped: number
  }> = {}

  results.forEach(result => {
    result.touchpoints.forEach(tp => {
      if (!summary[tp.type]) {
        summary[tp.type] = {
          count: 0,
          totalValue: 0,
          linear: 0,
          timeDecay: 0,
          uShaped: 0,
          wShaped: 0,
        }
      }

      summary[tp.type].count++
      summary[tp.type].totalValue += result.totalValue
      summary[tp.type].linear += (result.attribution.linear[tp.id] || 0) * result.totalValue / 100
      summary[tp.type].timeDecay += (result.attribution.timeDecay[tp.id] || 0) * result.totalValue / 100
      summary[tp.type].uShaped += (result.attribution.uShaped[tp.id] || 0) * result.totalValue / 100
      summary[tp.type].wShaped += (result.attribution.wShaped[tp.id] || 0) * result.totalValue / 100
    })
  })

  return summary
}


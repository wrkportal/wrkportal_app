/**
 * AI Deal Scoring Service
 * Predictive analytics for scoring sales opportunities
 */

import { extractStructuredData, analyzeText } from '../../ai-service'
import { SALES_PROMPTS } from '../../prompts-sales'

export interface DealScoreResult {
  opportunityId: string
  score: number // 0-100
  confidence: number // 0-100
  reasoning: string
  factors: {
    factor: string
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    weight: number
    description: string
  }[]
  recommendations: string[]
  predictedCloseDate?: string
  predictedCloseProbability: number // 0-100
}

interface OpportunityData {
  id: string
  name: string
  amount: number
  stage: string
  probability: number
  expectedCloseDate: string | null
  status: string
  daysInPipeline: number
  account?: {
    type: string
    industry: string
  } | null
  activities?: {
    count: number
    lastActivityDate: string | null
    daysSinceLastActivity: number
  }
  contacts?: {
    count: number
    decisionMakers: number
  }
}

export async function scoreDeal(opportunity: OpportunityData): Promise<DealScoreResult> {
  const dealSummary = `
Deal Analysis for Scoring:

**Opportunity:** ${opportunity.name}
**ID:** ${opportunity.id}
**Amount:** $${opportunity.amount.toLocaleString()}
**Stage:** ${opportunity.stage}
**Current Probability:** ${opportunity.probability}%
**Expected Close Date:** ${opportunity.expectedCloseDate || 'Not set'}
**Days in Pipeline:** ${opportunity.daysInPipeline}
**Status:** ${opportunity.status}

**Account Information:**
${opportunity.account ? `- Type: ${opportunity.account.type}\n- Industry: ${opportunity.account.industry}` : '- No account linked'}

**Activity Information:**
- Total Activities: ${opportunity.activities?.count || 0}
- Last Activity: ${opportunity.activities?.lastActivityDate || 'Never'}
- Days Since Last Activity: ${opportunity.activities?.daysSinceLastActivity || 'N/A'}

**Contact Information:**
- Total Contacts: ${opportunity.contacts?.count || 0}
- Decision Makers: ${opportunity.contacts?.decisionMakers || 0}

Analyze this deal and provide a comprehensive score with detailed reasoning.
`

  const schema = `{
  "score": number (0-100),
  "confidence": number (0-100),
  "reasoning": "string (detailed explanation)",
  "factors": [{
    "factor": "string (e.g., 'Stage in Pipeline', 'Activity Level', 'Deal Size')",
    "impact": "POSITIVE | NEGATIVE | NEUTRAL",
    "weight": number (0-10),
    "description": "string"
  }],
  "recommendations": ["string"],
  "predictedCloseDate": "string (ISO date or null)",
  "predictedCloseProbability": number (0-100)
}`

  try {
    const result = await extractStructuredData<any>(dealSummary, schema, SALES_PROMPTS.DEAL_SCORER)

    return {
      opportunityId: opportunity.id,
      score: Math.round(result.score),
      confidence: Math.round(result.confidence),
      reasoning: result.reasoning,
      factors: result.factors || [],
      recommendations: result.recommendations || [],
      predictedCloseDate: result.predictedCloseDate || undefined,
      predictedCloseProbability: Math.round(result.predictedCloseProbability),
    }
  } catch (error) {
    console.error('Error scoring deal:', error)
    throw new Error('Failed to score deal')
  }
}

/**
 * Score multiple deals at once
 */
export async function scoreMultipleDeals(opportunities: OpportunityData[]): Promise<DealScoreResult[]> {
  const results = await Promise.all(
    opportunities.map(opp => scoreDeal(opp).catch(error => {
      console.error(`Error scoring deal ${opp.id}:`, error)
      // Return a default score on error
      return {
        opportunityId: opp.id,
        score: 50,
        confidence: 0,
        reasoning: 'Unable to calculate score',
        factors: [],
        recommendations: [],
        predictedCloseProbability: opp.probability,
      }
    }))
  )

  return results
}


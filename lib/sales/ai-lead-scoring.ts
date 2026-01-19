/**
 * AI-Enhanced Lead Scoring Service
 * 
 * Combines rule-based scoring with AI behavioral analysis
 */

import { prisma } from '@/lib/prisma'
import { LeadScoringEngine } from './lead-scoring'
import { generateChatCompletion } from '@/lib/ai/ai-service'

export interface BehavioralSignals {
  emailOpens?: number
  emailClicks?: number
  websiteVisits?: number
  contentDownloads?: number
  formSubmissions?: number
  demoRequests?: number
  pricingPageViews?: number
  timeOnSite?: number
  pagesViewed?: number
}

export interface AILeadScore {
  baseScore: number
  aiScore: number
  combinedScore: number
  aiFactors: string[]
  recommendations: string[]
  confidence: number
}

/**
 * Calculate AI-enhanced lead score
 */
export async function calculateAILeadScore(
  leadId: string,
  tenantId: string,
  behavioralSignals?: BehavioralSignals
): Promise<AILeadScore> {
  // Get base score from rule-based engine
  const baseScore = await LeadScoringEngine.calculateScore(leadId, tenantId)

  // Get lead data
  const lead = await prisma.salesLead.findUnique({
    where: { id: leadId },
    include: {
      activities: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!lead) {
    return {
      baseScore: 0,
      aiScore: 0,
      combinedScore: 0,
      aiFactors: [],
      recommendations: [],
      confidence: 0,
    }
  }

  // Calculate AI score based on behavioral signals and lead data
  const aiScore = await calculateBehavioralScore(lead, behavioralSignals)

  // Combine scores (70% base, 30% AI)
  const combinedScore = Math.round(baseScore * 0.7 + aiScore * 0.3)

  // Get AI recommendations
  const recommendations = await getAIRecommendations(lead, baseScore, aiScore, behavioralSignals)

  // Extract AI factors
  const aiFactors = extractAIFactors(lead, behavioralSignals, aiScore)

  // Calculate confidence (based on data completeness)
  const confidence = calculateConfidence(lead, behavioralSignals)

  return {
    baseScore,
    aiScore,
    combinedScore,
    aiFactors,
    recommendations,
    confidence,
  }
}

/**
 * Calculate behavioral score using AI
 */
async function calculateBehavioralScore(
  lead: any,
  signals?: BehavioralSignals
): Promise<number> {
  let score = 0

  // Email engagement
  if (signals?.emailOpens) {
    score += Math.min(signals.emailOpens * 2, 20) // Max 20 points
  }
  if (signals?.emailClicks) {
    score += Math.min(signals.emailClicks * 5, 25) // Max 25 points
  }

  // Website engagement
  if (signals?.websiteVisits) {
    score += Math.min(signals.websiteVisits * 3, 15) // Max 15 points
  }
  if (signals?.timeOnSite && signals.timeOnSite > 300) {
    score += 10 // 5+ minutes on site
  }
  if (signals?.pagesViewed && signals.pagesViewed > 5) {
    score += 10 // High page views
  }

  // Content engagement
  if (signals?.contentDownloads) {
    score += signals.contentDownloads * 8 // 8 points per download
  }
  if (signals?.formSubmissions) {
    score += signals.formSubmissions * 15 // 15 points per form
  }

  // High-intent signals
  if (signals?.demoRequests) {
    score += signals.demoRequests * 30 // 30 points per demo request
  }
  if (signals?.pricingPageViews) {
    score += signals.pricingPageViews * 12 // 12 points per pricing view
  }

  // Activity-based scoring
  const recentActivities = lead.activities || []
  const activityCount = recentActivities.length
  if (activityCount > 0) {
    score += Math.min(activityCount * 3, 20) // Max 20 points for activities
  }

  // Email engagement from activities
  const emailActivities = recentActivities.filter((a: any) => a.type === 'EMAIL')
  if (emailActivities.length > 0) {
    score += 10
  }

  // Meeting activities (high intent)
  const meetingActivities = recentActivities.filter((a: any) => a.type === 'MEETING')
  if (meetingActivities.length > 0) {
    score += 25
  }

  // Cap at 100
  return Math.min(score, 100)
}

/**
 * Get AI-powered recommendations
 */
async function getAIRecommendations(
  lead: any,
  baseScore: number,
  aiScore: number,
  signals?: BehavioralSignals
): Promise<string[]> {
  const recommendations: string[] = []

  // Low engagement recommendations
  if (aiScore < 20 && baseScore < 30) {
    recommendations.push('Send personalized email to re-engage')
    recommendations.push('Share relevant content based on industry')
  }

  // High engagement but low conversion
  if (aiScore > 50 && baseScore < 40) {
    recommendations.push('Schedule a discovery call')
    recommendations.push('Send pricing information')
    recommendations.push('Offer a product demo')
  }

  // Demo request but no follow-up
  if (signals?.demoRequests && signals.demoRequests > 0) {
    recommendations.push('URGENT: Schedule demo immediately')
    recommendations.push('Assign to senior sales rep')
  }

  // Pricing page views
  if (signals?.pricingPageViews && signals.pricingPageViews > 0) {
    recommendations.push('Send pricing proposal')
    recommendations.push('Offer discount for early commitment')
  }

  // High activity but no opportunity
  const activityCount = lead.activities?.length || 0
  if (activityCount > 5 && baseScore > 40) {
    recommendations.push('Qualify lead and convert to opportunity')
    recommendations.push('Review lead status and update if needed')
  }

  // Industry-specific recommendations
  if (lead.industry) {
    recommendations.push(`Tailor messaging for ${lead.industry} industry`)
  }

  return recommendations
}

/**
 * Extract AI factors that influenced the score
 */
function extractAIFactors(
  lead: any,
  signals?: BehavioralSignals,
  aiScore?: number
): string[] {
  const factors: string[] = []

  if (signals?.emailOpens && signals.emailOpens > 3) {
    factors.push(`High email engagement (${signals.emailOpens} opens)`)
  }

  if (signals?.emailClicks && signals.emailClicks > 0) {
    factors.push(`Email clicks (${signals.emailClicks})`)
  }

  if (signals?.websiteVisits && signals.websiteVisits > 5) {
    factors.push(`Active website visitor (${signals.websiteVisits} visits)`)
  }

  if (signals?.contentDownloads && signals.contentDownloads > 0) {
    factors.push(`Content engagement (${signals.contentDownloads} downloads)`)
  }

  if (signals?.demoRequests && signals.demoRequests > 0) {
    factors.push(`Demo request (high intent)`)
  }

  if (signals?.pricingPageViews && signals.pricingPageViews > 0) {
    factors.push(`Pricing page views (purchase intent)`)
  }

  const activityCount = lead.activities?.length || 0
  if (activityCount > 3) {
    factors.push(`Active engagement (${activityCount} activities)`)
  }

  const meetingCount = lead.activities?.filter((a: any) => a.type === 'MEETING').length || 0
  if (meetingCount > 0) {
    factors.push(`Meetings scheduled (${meetingCount})`)
  }

  return factors
}

/**
 * Calculate confidence in the score
 */
function calculateConfidence(lead: any, signals?: BehavioralSignals): number {
  let confidence = 50 // Base confidence

  // More data = higher confidence
  if (lead.company) confidence += 10
  if (lead.phone || lead.mobile) confidence += 5
  if (lead.title) confidence += 5
  if (lead.industry) confidence += 5

  // Behavioral signals increase confidence
  if (signals) {
    if (signals.emailOpens) confidence += 5
    if (signals.websiteVisits) confidence += 5
    if (signals.contentDownloads) confidence += 10
    if (signals.demoRequests) confidence += 15
  }

  // Activities increase confidence
  const activityCount = lead.activities?.length || 0
  if (activityCount > 0) confidence += Math.min(activityCount * 2, 10)

  return Math.min(confidence, 100)
}

/**
 * Update lead score with AI enhancement
 */
export async function updateLeadScoreWithAI(
  leadId: string,
  tenantId: string,
  behavioralSignals?: BehavioralSignals
): Promise<AILeadScore> {
  const aiScore = await calculateAILeadScore(leadId, tenantId, behavioralSignals)

  // Update lead with combined score
  await prisma.salesLead.update({
    where: { id: leadId },
    data: {
      score: aiScore.combinedScore,
      // Store AI score data in customFields
      customFields: {
        ...((await prisma.salesLead.findUnique({ where: { id: leadId }, select: { customFields: true } }))?.customFields as any || {}),
        aiScoring: {
          baseScore: aiScore.baseScore,
          aiScore: aiScore.aiScore,
          combinedScore: aiScore.combinedScore,
          confidence: aiScore.confidence,
          factors: aiScore.aiFactors,
          recommendations: aiScore.recommendations,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  })

  return aiScore
}


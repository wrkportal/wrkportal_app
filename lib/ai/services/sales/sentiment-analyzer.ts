/**
 * Sentiment Analysis Service
 * Analyze sentiment in sales communications
 */

import { extractStructuredData } from '../../ai-service'
import { SALES_PROMPTS } from '../../prompts-sales'

export interface SentimentAnalysisResult {
  overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED'
  scores: {
    positive: number // 0-100
    negative: number // 0-100
    neutral: number // 0-100
  }
  confidence: number // 0-100
  indicators: {
    type: 'URGENCY' | 'ENTHUSIASM' | 'CONCERN' | 'BUYING_SIGNAL' | 'OBJECTION' | 'RISK'
    level: 'HIGH' | 'MEDIUM' | 'LOW'
    phrase: string
  }[]
  keyPhrases: string[]
  recommendations: string[]
}

export async function analyzeSentiment(
  text: string,
  context?: {
    type?: 'EMAIL' | 'CALL' | 'NOTE' | 'FEEDBACK'
    opportunityStage?: string
    relationshipStage?: string
  }
): Promise<SentimentAnalysisResult> {
  const analysisText = `
Sentiment Analysis Request:

**Context:**
- Type: ${context?.type || 'GENERAL'}
- Opportunity Stage: ${context?.opportunityStage || 'N/A'}
- Relationship Stage: ${context?.relationshipStage || 'N/A'}

**Text to Analyze:**
${text}

Analyze the sentiment of this sales communication.
`

  const schema = `{
  "overall": "POSITIVE | NEUTRAL | NEGATIVE | MIXED",
  "scores": {
    "positive": number (0-100),
    "negative": number (0-100),
    "neutral": number (0-100)
  },
  "confidence": number (0-100),
  "indicators": [{
    "type": "URGENCY | ENTHUSIASM | CONCERN | BUYING_SIGNAL | OBJECTION | RISK",
    "level": "HIGH | MEDIUM | LOW",
    "phrase": "string"
  }],
  "keyPhrases": ["string"],
  "recommendations": ["string"]
}`

  try {
    const result = await extractStructuredData<any>(analysisText, schema, SALES_PROMPTS.SENTIMENT_ANALYZER)

    return {
      overall: result.overall,
      scores: {
        positive: Math.round(result.scores.positive),
        negative: Math.round(result.scores.negative),
        neutral: Math.round(result.scores.neutral),
      },
      confidence: Math.round(result.confidence),
      indicators: result.indicators || [],
      keyPhrases: result.keyPhrases || [],
      recommendations: result.recommendations || [],
    }
  } catch (error) {
    console.error('Error analyzing sentiment:', error)
    throw new Error('Failed to analyze sentiment')
  }
}


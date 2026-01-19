/**
 * Email Intelligence Service
 * NLP-powered email analysis for sales emails
 */

import { extractStructuredData } from '../../ai-service'
import { SALES_PROMPTS } from '../../prompts-sales'

export interface EmailIntelligenceResult {
  dates: {
    date: string // ISO date
    context: string // What the date refers to
    importance: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  amounts: {
    amount: number
    currency: string
    context: string
  }[]
  products: string[]
  actionItems: {
    action: string
    assignedTo?: string
    dueDate?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }[]
  sentiment: {
    overall: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED'
    confidence: number // 0-100
    indicators: string[]
  }
  entities: {
    people: {
      name: string
      title?: string
      role?: string
    }[]
    companies: string[]
  }
  buyingSignals: string[]
  objections: string[]
  nextSteps: string[]
  context: {
    stage?: string
    urgency: 'HIGH' | 'MEDIUM' | 'LOW'
    relationshipStage: string
  }
}

export async function analyzeEmail(emailContent: string, metadata?: {
  subject?: string
  from?: string
  to?: string
  date?: string
}): Promise<EmailIntelligenceResult> {
  const emailText = `
Email Analysis Request:

**Subject:** ${metadata?.subject || 'N/A'}
**From:** ${metadata?.from || 'N/A'}
**To:** ${metadata?.to || 'N/A'}
**Date:** ${metadata?.date || 'N/A'}

**Email Content:**
${emailContent}

Extract all relevant information from this sales email.
`

  const schema = `{
  "dates": [{
    "date": "string (ISO format or description)",
    "context": "string",
    "importance": "HIGH | MEDIUM | LOW"
  }],
  "amounts": [{
    "amount": number,
    "currency": "string",
    "context": "string"
  }],
  "products": ["string"],
  "actionItems": [{
    "action": "string",
    "assignedTo": "string (optional)",
    "dueDate": "string (optional, ISO format)",
    "priority": "HIGH | MEDIUM | LOW"
  }],
  "sentiment": {
    "overall": "POSITIVE | NEUTRAL | NEGATIVE | MIXED",
    "confidence": number (0-100),
    "indicators": ["string"]
  },
  "entities": {
    "people": [{
      "name": "string",
      "title": "string (optional)",
      "role": "string (optional)"
    }],
    "companies": ["string"]
  },
  "buyingSignals": ["string"],
  "objections": ["string"],
  "nextSteps": ["string"],
  "context": {
    "stage": "string (optional, sales process stage)",
    "urgency": "HIGH | MEDIUM | LOW",
    "relationshipStage": "string"
  }
}`

  try {
    const result = await extractStructuredData<any>(emailText, schema, SALES_PROMPTS.EMAIL_INTELLIGENCE)

    return {
      dates: result.dates || [],
      amounts: result.amounts || [],
      products: result.products || [],
      actionItems: result.actionItems || [],
      sentiment: result.sentiment || {
        overall: 'NEUTRAL',
        confidence: 0,
        indicators: [],
      },
      entities: result.entities || { people: [], companies: [] },
      buyingSignals: result.buyingSignals || [],
      objections: result.objections || [],
      nextSteps: result.nextSteps || [],
      context: result.context || {
        urgency: 'MEDIUM',
        relationshipStage: 'Unknown',
      },
    }
  } catch (error) {
    console.error('Error analyzing email:', error)
    throw new Error('Failed to analyze email')
  }
}


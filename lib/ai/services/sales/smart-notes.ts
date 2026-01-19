/**
 * Smart Notes Service
 * AI-powered note processing and enhancement
 */

import { extractStructuredData } from '../../ai-service'
import { SALES_PROMPTS } from '../../prompts-sales'

export interface SmartNoteResult {
  summary: string
  keyTakeaways: string[]
  actionItems: {
    action: string
    assignedTo?: string
    dueDate?: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    relatedTo?: string // opportunity, account, contact ID
  }[]
  decisions: {
    decision: string
    rationale?: string
    stakeholders?: string[]
  }[]
  concerns: {
    concern: string
    severity: 'HIGH' | 'MEDIUM' | 'LOW'
    recommendedAction?: string
  }[]
  nextSteps: string[]
  tags: string[]
  relatedEntities: {
    type: 'OPPORTUNITY' | 'ACCOUNT' | 'CONTACT'
    identifier: string
    confidence: number
  }[]
}

export async function processNote(
  noteContent: string,
  context?: {
    type?: 'MEETING' | 'CALL' | 'EMAIL' | 'GENERAL'
    relatedToId?: string
    relatedToType?: 'OPPORTUNITY' | 'ACCOUNT' | 'CONTACT'
  }
): Promise<SmartNoteResult> {
  const noteText = `
Note Processing Request:

**Context:**
- Type: ${context?.type || 'GENERAL'}
- Related To: ${context?.relatedToType || 'N/A'} (${context?.relatedToId || 'N/A'})

**Note Content:**
${noteContent}

Process this note and extract structured information.
`

  const schema = `{
  "summary": "string (2-3 sentences)",
  "keyTakeaways": ["string"],
  "actionItems": [{
    "action": "string",
    "assignedTo": "string (optional)",
    "dueDate": "string (optional, ISO format)",
    "priority": "HIGH | MEDIUM | LOW",
    "relatedTo": "string (optional, entity ID)"
  }],
  "decisions": [{
    "decision": "string",
    "rationale": "string (optional)",
    "stakeholders": ["string (optional)"]
  }],
  "concerns": [{
    "concern": "string",
    "severity": "HIGH | MEDIUM | LOW",
    "recommendedAction": "string (optional)"
  }],
  "nextSteps": ["string"],
  "tags": ["string"],
  "relatedEntities": [{
    "type": "OPPORTUNITY | ACCOUNT | CONTACT",
    "identifier": "string",
    "confidence": number (0-100)
  }]
}`

  try {
    const result = await extractStructuredData<any>(noteText, schema, SALES_PROMPTS.SMART_NOTES)

    return {
      summary: result.summary || '',
      keyTakeaways: result.keyTakeaways || [],
      actionItems: result.actionItems || [],
      decisions: result.decisions || [],
      concerns: result.concerns || [],
      nextSteps: result.nextSteps || [],
      tags: result.tags || [],
      relatedEntities: result.relatedEntities || [],
    }
  } catch (error) {
    console.error('Error processing note:', error)
    throw new Error('Failed to process note')
  }
}


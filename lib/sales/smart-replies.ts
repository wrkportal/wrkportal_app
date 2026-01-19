/**
 * Smart Replies Service
 * 
 * AI-powered email reply suggestions
 */

import { generateChatCompletion } from '@/lib/ai/ai-service''

export interface EmailContext {
  subject: string
  body: string
  from: string
  to: string
  threadHistory?: Array<{
    from: string
    to: string
    subject: string
    body: string
    date: Date
  }>
  opportunityId?: string
  leadId?: string
  accountId?: string
}

export interface SmartReply {
  id: string
  text: string
  tone: 'PROFESSIONAL' | 'FRIENDLY' | 'FORMAL' | 'CASUAL'
  length: 'SHORT' | 'MEDIUM' | 'LONG'
  suggested: boolean
}

const SYSTEM_PROMPT = `You are an AI assistant helping sales professionals write effective email replies. Generate 3-5 reply suggestions that are:
- Professional and appropriate for the context
- Clear and concise
- Action-oriented when needed
- Respectful and courteous

Consider the email thread history, relationship context, and sales opportunity status when generating replies.`

/**
 * Generate smart reply suggestions
 */
export async function generateSmartReplies(
  context: EmailContext,
  options?: {
    tone?: 'PROFESSIONAL' | 'FRIENDLY' | 'FORMAL' | 'CASUAL'
    length?: 'SHORT' | 'MEDIUM' | 'LONG'
    count?: number
  }
): Promise<SmartReply[]> {
  try {
    const count = options?.count || 3
    const tone = options?.tone || 'PROFESSIONAL'
    const length = options?.length || 'MEDIUM'

    // Build context message
    let contextMessage = `Generate ${count} email reply suggestions for the following email:\n\n`
    contextMessage += `Subject: ${context.subject}\n`
    contextMessage += `From: ${context.from}\n`
    contextMessage += `To: ${context.to}\n`
    contextMessage += `Body: ${context.body}\n\n`

    if (context.threadHistory && context.threadHistory.length > 0) {
      contextMessage += `Email Thread History:\n`
      context.threadHistory.forEach((email, index) => {
        contextMessage += `\n${index + 1}. From: ${email.from}, Subject: ${email.subject}\n${email.body}\n`
      })
    }

    contextMessage += `\nRequirements:\n`
    contextMessage += `- Tone: ${tone}\n`
    contextMessage += `- Length: ${length}\n`
    contextMessage += `- Generate ${count} different options\n`
    contextMessage += `- Make them actionable and professional\n`

    const messages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT,
      },
      {
        role: 'user' as const,
        content: contextMessage,
      },
    ]

    const completion = await generateChatCompletion(messages, {
      temperature: 0.8,
      maxTokens: 1000,
    })

    const responseText = completion.choices[0].message.content || ''
    
    // Parse the response to extract individual replies
    const replies = parseRepliesFromResponse(responseText, count)

    return replies.map((text, index) => ({
      id: `reply-${Date.now()}-${index}`,
      text,
      tone,
      length,
      suggested: index === 0, // First reply is suggested
    }))
  } catch (error) {
    console.error('Error generating smart replies:', error)
    throw error
  }
}

/**
 * Parse replies from AI response
 */
function parseRepliesFromResponse(response: string, expectedCount: number): string[] {
  const replies: string[] = []

  // Try to find numbered or bulleted replies
  const patterns = [
    /^\d+[\.\)]\s*(.+)$/gm, // Numbered: "1. Reply text"
    /^[-*]\s*(.+)$/gm, // Bulleted: "- Reply text" or "* Reply text"
    /^Reply \d+:\s*(.+)$/gmi, // "Reply 1: text"
  ]

  for (const pattern of patterns) {
    const matches = response.matchAll(pattern)
    for (const match of matches) {
      if (match[1]) {
        replies.push(match[1].trim())
      }
    }
    if (replies.length >= expectedCount) break
  }

  // If no structured format found, try to split by paragraphs
  if (replies.length === 0) {
    const paragraphs = response.split(/\n\n+/).filter(p => p.trim().length > 20)
    replies.push(...paragraphs.slice(0, expectedCount).map(p => p.trim()))
  }

  // If still no replies, return the whole response as one reply
  if (replies.length === 0) {
    replies.push(response.trim())
  }

  return replies.slice(0, expectedCount)
}

/**
 * Generate a single smart reply with specific requirements
 */
export async function generateSingleSmartReply(
  context: EmailContext,
  requirements?: {
    tone?: 'PROFESSIONAL' | 'FRIENDLY' | 'FORMAL' | 'CASUAL'
    length?: 'SHORT' | 'MEDIUM' | 'LONG'
    includeCallToAction?: boolean
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH'
  }
): Promise<string> {
  const replies = await generateSmartReplies(context, {
    tone: requirements?.tone,
    length: requirements?.length,
    count: 1,
  })

  return replies[0]?.text || ''
}


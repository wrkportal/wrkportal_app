/**
 * Meeting Notes to Action Items Analyzer
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { MeetingAnalysis, ActionItem, Decision, RiskItem, FollowUpItem } from '@/types/ai'

export async function analyzeMeetingNotes(
  meetingNotes: string,
  meetingTitle: string,
  meetingDate: Date,
  participants: string[]
): Promise<MeetingAnalysis> {
  const context = `
Analyze the following meeting notes:

**Meeting:** ${meetingTitle}
**Date:** ${meetingDate.toLocaleDateString()}
**Participants:** ${participants.join(', ')}

**Notes:**
${meetingNotes}

Extract all actionable items, decisions, risks, and follow-ups.
`

  const schema = `{
  "actionItems": [{
    "description": "string",
    "owner": "string or null",
    "dueDate": "ISO date string or null",
    "priority": "HIGH | MEDIUM | LOW",
    "context": "string"
  }],
  "decisions": [{
    "description": "string",
    "rationale": "string",
    "impact": "string",
    "decisionMakers": ["string"]
  }],
  "risksDiscussed": [{
    "description": "string",
    "severity": "CRITICAL | HIGH | MEDIUM | LOW",
    "owner": "string or null"
  }],
  "followUps": [{
    "description": "string",
    "owner": "string or null",
    "reason": "string"
  }],
  "keyTakeaways": ["string"]
}`

  const result = await extractStructuredData<any>(context, schema, PROMPTS.MEETING_ANALYZER)

  const actionItems: ActionItem[] = result.actionItems.map((item: any) => ({
    id: `action-${Date.now()}-${Math.random()}`,
    description: item.description,
    owner: item.owner,
    dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
    priority: item.priority,
    context: item.context,
    status: 'PENDING',
  }))

  const decisions: Decision[] = result.decisions.map((dec: any) => ({
    id: `decision-${Date.now()}-${Math.random()}`,
    description: dec.description,
    rationale: dec.rationale,
    impact: dec.impact,
    decisionMakers: dec.decisionMakers,
  }))

  return {
    id: `meeting-${Date.now()}`,
    meetingTitle,
    meetingDate,
    participants,
    actionItems,
    decisions,
    risksDiscussed: result.risksDiscussed,
    followUps: result.followUps,
    keyTakeaways: result.keyTakeaways,
    analyzedAt: new Date(),
  }
}

/**
 * Convert action items to tasks
 */
export function convertActionItemsToTasks(
  actionItems: ActionItem[],
  projectId: string,
  createdBy: string
) {
  return actionItems.map(item => ({
    projectId,
    title: item.description,
    description: `From meeting: ${item.context}`,
    priority: item.priority,
    dueDate: item.dueDate,
    assigneeId: item.owner,
    reporterId: createdBy,
    status: 'TODO' as const,
    tags: ['from-meeting'],
    createdAt: new Date(),
  }))
}

/**
 * Extract action items from meeting (wrapper for analyzeMeetingNotes)
 */
export async function extractActionItems(data: {
  meetingTitle: string
  meetingDate: string | Date
  attendees: string | string[]
  notes: string
}): Promise<{ actionItems: any[] }> {
  const meetingDate = typeof data.meetingDate === 'string' 
    ? new Date(data.meetingDate) 
    : data.meetingDate
  const participants = Array.isArray(data.attendees) 
    ? data.attendees 
    : data.attendees ? data.attendees.split(',').map(a => a.trim()) : []

  const analysis = await analyzeMeetingNotes(
    data.notes,
    data.meetingTitle,
    meetingDate,
    participants
  )

  return {
    actionItems: analysis.actionItems,
  }
}

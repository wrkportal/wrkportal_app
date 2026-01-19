/**
 * Smart Notification Summary Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { NotificationSummary } from '@/types/ai'
import { Notification, UserRole } from '@/types'

interface SummaryContext {
  userId: string
  userRole: UserRole
  notifications: Notification[]
  period: { start: Date; end: Date }
}

export async function summarizeNotifications(
  context: SummaryContext
): Promise<NotificationSummary> {
  const groupedByType = groupNotificationsByType(context.notifications)
  
  const notificationContext = `
Create a personalized notification summary for a ${context.userRole} user.

**Time Period:** ${context.period.start.toLocaleDateString()} - ${context.period.end.toLocaleDateString()}
**Total Notifications:** ${context.notifications.length}

**Breakdown by Type:**
${Object.entries(groupedByType).map(([type, notifs]) => 
  `- ${type}: ${notifs.length} notifications`
).join('\n')}

**Recent Notifications:**
${context.notifications.slice(0, 20).map(n => 
  `[${n.priority}] ${n.type}: ${n.title} - ${n.message}`
).join('\n')}

Create a concise, actionable summary prioritized by urgency and relevance to a ${context.userRole}.
`

  const schema = `{
  "summary": "string (2-3 sentences overview)",
  "urgent": {
    "count": number,
    "items": ["string"]
  },
  "important": {
    "count": number,
    "items": ["string"]
  },
  "fyi": {
    "count": number,
    "items": ["string"]
  }
}`

  const result = await extractStructuredData<any>(
    notificationContext,
    schema,
    PROMPTS.NOTIFICATION_SUMMARIZER
  )

  return {
    userId: context.userId,
    period: context.period,
    summary: result.summary,
    urgent: result.urgent,
    important: result.important,
    fyi: result.fyi,
    totalNotifications: context.notifications.length,
    generatedAt: new Date(),
  }
}

/**
 * Group notifications by type
 */
function groupNotificationsByType(
  notifications: Notification[]
): Record<string, Notification[]> {
  return notifications.reduce((acc, notif) => {
    if (!acc[notif.type]) {
      acc[notif.type] = []
    }
    acc[notif.type].push(notif)
    return acc
  }, {} as Record<string, Notification[]>)
}

/**
 * Get notification priority score
 */
export function calculateNotificationPriority(notification: Notification): number {
  let score = 0

  // Priority weight
  const priorityScores = {
    CRITICAL: 100,
    HIGH: 75,
    MEDIUM: 50,
    LOW: 25,
  }
  score += priorityScores[notification.priority] || 50

  // Type weight (some types are inherently more urgent)
  const typeScores = {
    ESCALATION: 50,
    APPROVAL: 40,
    DEADLINE: 35,
    MENTION: 20,
    ASSIGNMENT: 30,
    STATUS_CHANGE: 15,
  }
  score += typeScores[notification.type] || 10

  // Recency (newer = higher priority)
  const ageInHours = (Date.now() - new Date(notification.createdAt).getTime()) / (1000 * 60 * 60)
  if (ageInHours < 1) score += 20
  else if (ageInHours < 6) score += 10
  else if (ageInHours < 24) score += 5

  return score
}

/**
 * Smart batching of similar notifications
 */
export function batchSimilarNotifications(
  notifications: Notification[]
): { message: string; count: number; notifications: Notification[] }[] {
  const batches: Record<string, Notification[]> = {}

  notifications.forEach(notif => {
    // Create a key based on type and entity
    const key = `${notif.type}-${notif.entityType}-${notif.entityId}`
    if (!batches[key]) {
      batches[key] = []
    }
    batches[key].push(notif)
  })

  return Object.values(batches)
    .filter(batch => batch.length > 1) // Only batch if there are multiple
    .map(batch => ({
      message: createBatchMessage(batch),
      count: batch.length,
      notifications: batch,
    }))
}

function createBatchMessage(notifications: Notification[]): string {
  if (notifications.length === 0) return ''
  
  const firstNotif = notifications[0]
  const type = firstNotif.type
  const count = notifications.length

  if (type === 'ASSIGNMENT') {
    return `${count} new tasks assigned to you`
  } else if (type === 'MENTION') {
    return `You were mentioned ${count} times`
  } else if (type === 'APPROVAL') {
    return `${count} items awaiting your approval`
  } else if (type === 'DEADLINE') {
    return `${count} upcoming deadlines`
  }

  return `${count} ${type.toLowerCase()} notifications`
}


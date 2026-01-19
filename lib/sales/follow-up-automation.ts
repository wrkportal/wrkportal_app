/**
 * Follow-Up Automation Service
 * 
 * Handles automatic follow-ups based on rules (delays, reminders, etc.)
 */

import { prisma } from '@/lib/prisma'
import { SalesAutomationEngine } from './automation-engine'

export interface FollowUpRule {
  triggerDays: number // Days after event
  triggerHours?: number // Additional hours
  actionType: 'CREATE_TASK' | 'SEND_EMAIL' | 'CREATE_ACTIVITY' | 'NOTIFY_USER'
  actionConfig: any
  condition?: (data: any) => boolean
}

/**
 * Schedule a follow-up action
 */
export async function scheduleFollowUp(
  tenantId: string,
  triggerType: string,
  entityType: 'lead' | 'opportunity' | 'quote',
  entityId: string,
  rule: FollowUpRule
): Promise<void> {
  // Calculate follow-up date
  const now = new Date()
  const followUpDate = new Date(now)
  followUpDate.setDate(now.getDate() + rule.triggerDays)
  if (rule.triggerHours) {
    followUpDate.setHours(now.getHours() + rule.triggerHours)
  }

  // Store follow-up in a scheduled activity or use automation rules
  // For now, we'll create a planned activity that can be processed later
  await prisma.salesActivity.create({
    data: {
      tenantId,
      type: 'TASK',
      subject: `Follow-up: ${triggerType}`,
      description: `Automated follow-up for ${entityType} ${entityId}`,
      status: 'PLANNED',
      dueDate: followUpDate,
      leadId: entityType === 'lead' ? entityId : null,
      opportunityId: entityType === 'opportunity' ? entityId : null,
      // Store follow-up config in description or custom field
      // This activity will be processed by a scheduled job
      assignedToId: 'system', // Will need proper user ID
      createdById: 'system',
    },
  })
}

/**
 * Process due follow-ups (should be called by a cron job)
 */
export async function processDueFollowUps(): Promise<void> {
  const now = new Date()
  
  // Find planned activities that are due
  const dueActivities = await prisma.salesActivity.findMany({
    where: {
      status: 'PLANNED',
      dueDate: {
        lte: now,
      },
      subject: {
        startsWith: 'Follow-up:',
      },
    },
    take: 100, // Process in batches
  })

  for (const activity of dueActivities) {
    try {
      // Parse the follow-up information from activity
      const entityType = activity.leadId ? 'lead' : 
                        activity.opportunityId ? 'opportunity' : 
                        'lead'
      const entityId = activity.leadId || activity.opportunityId

      if (!entityId) {
        continue
      }

      // Trigger the follow-up automation
      await SalesAutomationEngine.trigger({
        tenantId: activity.tenantId,
        triggerType: 'FOLLOW_UP_DUE',
        data: {
          [entityType === 'lead' ? 'leadId' : 'opportunityId']: entityId,
          activityId: activity.id,
        },
      })

      // Mark activity as completed or delete it
      await prisma.salesActivity.update({
        where: { id: activity.id },
        data: {
          status: 'COMPLETED',
          completedDate: new Date(),
        },
      })
    } catch (error) {
      console.error(`Error processing follow-up activity ${activity.id}:`, error)
    }
  }
}

/**
 * Create a meeting reminder follow-up
 */
export async function scheduleMeetingReminder(
  tenantId: string,
  activityId: string,
  reminderMinutes: number = 15
): Promise<void> {
  const activity = await prisma.salesActivity.findUnique({
    where: { id: activityId },
    select: {
      id: true,
      dueDate: true,
      type: true,
      tenantId: true,
    },
  })

  if (!activity || activity.type !== 'MEETING' || !activity.dueDate) {
    return
  }

  const reminderDate = new Date(activity.dueDate)
  reminderDate.setMinutes(reminderDate.getMinutes() - reminderMinutes)

  // Create reminder activity
  await prisma.salesActivity.create({
    data: {
      tenantId: activity.tenantId,
      type: 'TASK',
      subject: `Reminder: ${activity.type} reminder`,
      description: `Reminder for meeting scheduled at ${activity.dueDate}`,
      status: 'PLANNED',
      dueDate: reminderDate,
      assignedToId: activity.tenantId, // Will need proper user ID
      createdById: activity.tenantId,
      relatedToType: 'ACTIVITY',
      relatedToId: activity.id,
    },
  })
}

/**
 * Create a proposal follow-up (for sent quotes)
 */
export async function scheduleProposalFollowUp(
  tenantId: string,
  quoteId: string,
  followUpDays: number = 3
): Promise<void> {
  const quote = await prisma.salesQuote.findUnique({
    where: { id: quoteId },
    select: {
      id: true,
      opportunityId: true,
      sentAt: true,
      tenantId: true,
    },
  })

  if (!quote || !quote.sentAt) {
    return
  }

  const followUpDate = new Date(quote.sentAt)
  followUpDate.setDate(followUpDate.getDate() + followUpDays)

  // Create follow-up activity
  await prisma.salesActivity.create({
    data: {
      tenantId: quote.tenantId,
      type: 'TASK',
      subject: 'Follow-up on sent quote',
      description: `Follow up on quote ${quoteId} sent on ${quote.sentAt}`,
      status: 'PLANNED',
      dueDate: followUpDate,
      opportunityId: quote.opportunityId,
      assignedToId: quote.tenantId, // Will need proper user ID
      createdById: quote.tenantId,
      relatedToType: 'QUOTE',
      relatedToId: quote.id,
    },
  })
}

/**
 * Create a welcome sequence follow-up (for new customers/contacts)
 */
export async function scheduleWelcomeSequence(
  tenantId: string,
  entityType: 'lead' | 'contact',
  entityId: string
): Promise<void> {
  // This integrates with email sequences
  // Find welcome email sequence
  const welcomeRule = await prisma.salesAutomationRule.findFirst({
    where: {
      tenantId,
      name: {
        contains: 'Welcome',
        mode: 'insensitive',
      },
      isActive: true,
    },
  })

  if (welcomeRule) {
    const { startEmailSequence } = await import('./email-sequences')
    await startEmailSequence(welcomeRule.id, entityType, entityId, tenantId)
  } else {
    // Create a simple welcome activity if no sequence exists
    await prisma.salesActivity.create({
      data: {
        tenantId,
        type: 'TASK',
        subject: 'Welcome new contact',
        description: `Send welcome message to ${entityType} ${entityId}`,
        status: 'PLANNED',
        dueDate: new Date(), // Immediate
        [entityType === 'lead' ? 'leadId' : 'contactId']: entityId,
        assignedToId: tenantId, // Will need proper user ID
        createdById: tenantId,
      },
    })
  }
}


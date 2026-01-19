/**
 * Email Sequences Service
 * 
 * Manages automated email campaigns and sequences
 */

import { prisma } from '@/lib/prisma'

export interface EmailSequenceStep {
  stepNumber: number
  delayDays: number // Days after previous step (or sequence start)
  delayHours?: number // Additional hours delay
  subject: string
  body: string // HTML or plain text
  template?: string
}

export interface EmailSequence {
  id?: string
  tenantId: string
  name: string
  description?: string
  triggerType: 'LEAD_CREATED' | 'LEAD_QUALIFIED' | 'OPPORTUNITY_CREATED' | 'QUOTE_SENT' | 'MANUAL'
  triggerConditions?: any
  steps: EmailSequenceStep[]
  isActive: boolean
  createdById: string
}

export interface SequenceExecution {
  sequenceId: string
  entityType: 'lead' | 'opportunity' | 'contact'
  entityId: string
  currentStep: number
  nextStepDate?: Date
  completed: boolean
  paused: boolean
}

/**
 * Create an email sequence
 */
export async function createEmailSequence(sequence: Omit<EmailSequence, 'id'>): Promise<string> {
  const seq = await prisma.salesEmailSequence.create({
    data: {
      tenantId: sequence.tenantId,
      name: sequence.name,
      description: sequence.description || null,
      triggerType: sequence.triggerType as any,
      triggerConditions: sequence.triggerConditions || {},
      steps: sequence.steps as any,
      isActive: sequence.isActive !== false,
      createdById: sequence.createdById,
    },
  })

  return seq.id
}

/**
 * Start an email sequence for an entity
 */
export async function startEmailSequence(
  sequenceId: string,
  entityType: 'lead' | 'opportunity' | 'contact',
  entityId: string,
  tenantId: string
): Promise<void> {
  const sequence = await prisma.salesEmailSequence.findUnique({
    where: { id: sequenceId },
  })

  if (!sequence || !sequence.isActive) {
    throw new Error('Sequence not found or inactive')
  }

  // Check if sequence is already running for this entity
  const existing = await prisma.salesEmailSequenceExecution.findFirst({
    where: {
      sequenceId,
      entityType: entityType.toUpperCase() as any,
      entityId,
      completed: false,
      paused: false,
    },
  })

  if (existing) {
    return // Already running
  }

  // Get first step
  const steps = sequence.steps as any as EmailSequenceStep[]
  if (steps.length === 0) {
    return
  }

  const firstStep = steps[0]
  const now = new Date()
  const nextStepDate = new Date(now)
  nextStepDate.setDate(now.getDate() + firstStep.delayDays)
  if (firstStep.delayHours) {
    nextStepDate.setHours(now.getHours() + firstStep.delayHours)
  }

  // Create execution record
  await prisma.salesEmailSequenceExecution.create({
    data: {
      sequenceId,
      tenantId,
      entityType: entityType.toUpperCase() as any,
      entityId,
      currentStep: 0,
      nextStepDate,
      completed: false,
      paused: false,
    },
  })

  // Send first email if delay is 0
  if (firstStep.delayDays === 0 && (!firstStep.delayHours || firstStep.delayHours === 0)) {
    await sendSequenceEmail(sequenceId, entityType, entityId, 0)
  }
}

/**
 * Process pending sequence emails (should be called by a cron job)
 */
export async function processPendingSequenceEmails(): Promise<void> {
  const now = new Date()
  const executions = await prisma.salesEmailSequenceExecution.findMany({
    where: {
      completed: false,
      paused: false,
      nextStepDate: {
        lte: now,
      },
    },
    include: {
      sequence: true,
    },
  })

  for (const execution of executions) {
    try {
      const sequence = execution.sequence
      const steps = sequence.steps as any as EmailSequenceStep[]
      const currentStepIndex = execution.currentStep

      if (currentStepIndex >= steps.length) {
        // Sequence completed
        await prisma.salesEmailSequenceExecution.update({
          where: { id: execution.id },
          data: { 
            completed: true,
            completedAt: new Date(),
          },
        })
        continue
      }

      // Send current step email
      await sendSequenceEmail(
        sequence.id,
        execution.entityType.toLowerCase() as 'lead' | 'opportunity' | 'contact',
        execution.entityId,
        currentStepIndex
      )

      // Calculate next step date
      const nextStepIndex = currentStepIndex + 1
      if (nextStepIndex < steps.length) {
        const nextStep = steps[nextStepIndex]
        const nextStepDate = new Date(now)
        nextStepDate.setDate(now.getDate() + nextStep.delayDays)
        if (nextStep.delayHours) {
          nextStepDate.setHours(now.getHours() + nextStep.delayHours)
        }

        await prisma.salesEmailSequenceExecution.update({
          where: { id: execution.id },
          data: {
            currentStep: nextStepIndex,
            nextStepDate,
          },
        })
      } else {
        // Sequence completed
        await prisma.salesEmailSequenceExecution.update({
          where: { id: execution.id },
          data: { 
            completed: true,
            completedAt: new Date(),
          },
        })
      }
    } catch (error) {
      console.error(`Error processing sequence execution ${execution.id}:`, error)
    }
  }
}

/**
 * Send a sequence email
 */
async function sendSequenceEmail(
  sequenceId: string,
  entityType: 'lead' | 'opportunity' | 'contact',
  entityId: string,
  stepIndex: number
): Promise<void> {
  const sequence = await prisma.salesEmailSequence.findUnique({
    where: { id: sequenceId },
  })

  if (!sequence) {
    return
  }

  const steps = sequence.steps as any as EmailSequenceStep[]
  const step = steps[stepIndex]
  if (!step) {
    return
  }

  // Get entity data
  let entity: any = null
  let email: string | null = null

  if (entityType === 'lead') {
    entity = await prisma.salesLead.findUnique({
      where: { id: entityId },
      include: { assignedTo: true },
    })
    email = entity?.email || null
  } else if (entityType === 'opportunity') {
    entity = await prisma.salesOpportunity.findUnique({
      where: { id: entityId },
      include: {
        account: { include: { contacts: { take: 1 } } },
        owner: true,
      },
    })
    email = entity?.account?.contacts[0]?.email || null
  } else if (entityType === 'contact') {
    entity = await prisma.salesContact.findUnique({
      where: { id: entityId },
      include: { account: true },
    })
    email = entity?.email || null
  }

  if (!email || !entity) {
    console.warn(`Cannot send sequence email: entity not found or no email`)
    return
  }

  // Replace placeholders
  const subject = replacePlaceholders(step.subject, entity)
  const body = replacePlaceholders(step.body, entity)

  // Send email
  try {
    const { sendEmail } = await import('@/lib/email')
    await sendEmail({
      to: email,
      subject,
      html: body,
    })

    // Log email sent
    await prisma.salesActivity.create({
      data: {
        tenantId: sequence.tenantId,
        type: 'EMAIL',
        subject,
        description: `Email sequence step ${stepIndex + 1}: ${subject}`,
        status: 'COMPLETED',
        leadId: entityType === 'lead' ? entityId : null,
        opportunityId: entityType === 'opportunity' ? entityId : null,
        contactId: entityType === 'contact' ? entityId : null,
        createdById: sequence.createdById,
      },
    })
  } catch (error) {
    console.error('Error sending sequence email:', error)
  }
}

/**
 * Replace placeholders in text
 */
function replacePlaceholders(text: string, data: any): string {
  return text
    .replace(/\{\{firstName\}\}/g, data.firstName || data.account?.contacts?.[0]?.firstName || '')
    .replace(/\{\{lastName\}\}/g, data.lastName || data.account?.contacts?.[0]?.lastName || '')
    .replace(/\{\{email\}\}/g, data.email || data.account?.contacts?.[0]?.email || '')
    .replace(/\{\{company\}\}/g, data.company || data.account?.name || data.name || '')
    .replace(/\{\{assignedTo\}\}/g, data.assignedTo?.name || data.owner?.name || '')
    .replace(/\{\{amount\}\}/g, data.amount ? `$${Number(data.amount).toLocaleString()}` : '')
    .replace(/\{\{stage\}\}/g, data.stage || '')
}

/**
 * Pause an email sequence execution
 */
export async function pauseEmailSequence(executionId: string): Promise<void> {
  await prisma.salesEmailSequenceExecution.update({
    where: { id: executionId },
    data: { 
      paused: true,
      pausedAt: new Date(),
    },
  })
}

/**
 * Resume a paused email sequence execution
 */
export async function resumeEmailSequence(executionId: string): Promise<void> {
  const execution = await prisma.salesEmailSequenceExecution.findUnique({
    where: { id: executionId },
    include: { sequence: true },
  })

  if (!execution) {
    throw new Error('Execution not found')
  }

  const sequence = execution.sequence
  const steps = sequence.steps as any as EmailSequenceStep[]
  const currentStep = steps[execution.currentStep]

  if (!currentStep) {
    return
  }

  const now = new Date()
  const nextStepDate = new Date(now)
  nextStepDate.setDate(now.getDate() + currentStep.delayDays)
  if (currentStep.delayHours) {
    nextStepDate.setHours(now.getHours() + currentStep.delayHours)
  }

  await prisma.salesEmailSequenceExecution.update({
    where: { id: executionId },
    data: {
      paused: false,
      pausedAt: null,
      nextStepDate,
    },
  })
}


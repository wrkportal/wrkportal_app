/**
 * Sales Automation Engine
 * Executes automation rules based on triggers
 */

import { prisma } from '@/lib/prisma'

export interface AutomationContext {
  tenantId: string
  triggerType: string
  data: Record<string, any>
}

export class SalesAutomationEngine {
  /**
   * Trigger automation rules based on event
   */
  static async trigger(context: AutomationContext) {
    try {
      const rules = await prisma.salesAutomationRule.findMany({
        where: {
          tenantId: context.tenantId,
          triggerType: context.triggerType as any,
          isActive: true,
        },
        orderBy: {
          priority: 'desc',
        },
      })

      for (const rule of rules) {
        const conditions = rule.triggerConditions as any
        if (this.evaluateConditions(conditions, context.data)) {
          await this.executeActionWithLogging(rule, context)
        }
      }
    } catch (error) {
      console.error('Automation engine error:', error)
    }
  }

  /**
   * Execute action with logging
   */
  static async executeActionWithLogging(rule: any, context: AutomationContext) {
    const startTime = Date.now()
    let executionId: string | null = null
    let status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED' = 'SUCCESS'
    let errorMessage: string | undefined = undefined

    try {
      // Log execution start
      const { logRuleExecution } = await import('./rule-execution-history')
      executionId = await logRuleExecution(
        context.tenantId,
        rule.id,
        context.triggerType,
        context.data,
        rule.actionType,
        rule.actionConfig,
        'SUCCESS', // Will update if fails
        undefined,
        undefined,
        context.data.userId // If provided in context
      )

      // Execute action
      await this.executeAction(rule, context)

      // Update execution with success
      const executionTime = Date.now() - startTime
      const { updateExecutionStatus } = await import('./rule-execution-history')
      await updateExecutionStatus(executionId, 'SUCCESS')
      
      // Update execution time
      await prisma.salesAutomationRuleExecution.update({
        where: { id: executionId },
        data: {
          executionTime,
          completedAt: new Date(),
        },
      })
    } catch (error: any) {
      status = 'FAILED'
      errorMessage = error.message || 'Unknown error'
      
      if (executionId) {
        const { updateExecutionStatus } = await import('./rule-execution-history')
        await updateExecutionStatus(executionId, 'FAILED', errorMessage)
        
        await prisma.salesAutomationRuleExecution.update({
          where: { id: executionId },
          data: {
            executionTime: Date.now() - startTime,
            completedAt: new Date(),
          },
        })
      } else {
        // Log failed execution if logging failed
        try {
          const { logRuleExecution } = await import('./rule-execution-history')
          await logRuleExecution(
            context.tenantId,
            rule.id,
            context.triggerType,
            context.data,
            rule.actionType,
            rule.actionConfig,
            'FAILED',
            errorMessage,
            Date.now() - startTime
          )
        } catch (logError) {
          console.error('Failed to log execution:', logError)
        }
      }
      
      throw error
    }
  }

  /**
   * Evaluate trigger conditions
   */
  static evaluateConditions(conditions: any, data: any): boolean {
    if (!conditions || Object.keys(conditions).length === 0) {
      return true // No conditions = always execute
    }

    // Field-based conditions
    if (conditions.field) {
      const fieldValue = this.getFieldValue(data, conditions.field)
      const operator = conditions.operator || 'equals'
      const expectedValue = conditions.value

      switch (operator) {
        case 'equals':
          return fieldValue === expectedValue
        case 'not_equals':
          return fieldValue !== expectedValue
        case 'contains':
          return String(fieldValue).includes(String(expectedValue))
        case 'greater_than':
          return Number(fieldValue) > Number(expectedValue)
        case 'less_than':
          return Number(fieldValue) < Number(expectedValue)
        case 'in':
          return Array.isArray(expectedValue) && expectedValue.includes(fieldValue)
        default:
          return true
      }
    }

    // Multiple conditions (AND/OR logic)
    if (conditions.conditions) {
      const logic = conditions.logic || 'AND'
      const results = conditions.conditions.map((cond: any) =>
        this.evaluateConditions(cond, data)
      )

      return logic === 'AND' ? results.every(Boolean) : results.some(Boolean)
    }

    return true
  }

  /**
   * Get nested field value from data object
   */
  static getFieldValue(data: any, fieldPath: string): any {
    const parts = fieldPath.split('.')
    let value = data
    for (const part of parts) {
      value = value?.[part]
      if (value === undefined) return null
    }
    return value
  }

  /**
   * Execute automation action
   */
  static async executeAction(rule: any, context: AutomationContext) {
    const actionConfig = rule.actionConfig as any

    try {
      // Support multi-step workflows (if actionConfig contains steps array)
      if (actionConfig.steps && Array.isArray(actionConfig.steps)) {
        await this.executeMultiStepWorkflow(rule, context, actionConfig.steps)
        return
      }

      switch (rule.actionType) {
        case 'ASSIGN_LEAD':
          await this.assignLead(actionConfig, context)
          break
        case 'SEND_EMAIL':
          await this.sendEmail(actionConfig, context)
          break
        case 'CREATE_TASK':
          await this.createTask(actionConfig, context)
          break
        case 'UPDATE_FIELD':
          await this.updateField(actionConfig, context)
          break
        case 'CREATE_ACTIVITY':
          await this.createActivity(actionConfig, context)
          break
        case 'CHANGE_STAGE':
          await this.changeStage(actionConfig, context)
          break
        case 'NOTIFY_USER':
          await this.notifyUser(actionConfig, context)
          break
        default:
          console.warn('Unknown action type:', rule.actionType)
      }
    } catch (error) {
      console.error('Error executing automation action:', error)
    }
  }

  /**
   * Execute multi-step workflow with conditional logic
   */
  static async executeMultiStepWorkflow(
    rule: any,
    context: AutomationContext,
    steps: any[]
  ): Promise<void> {
    for (const step of steps) {
      // Check step conditions
      if (step.condition) {
        const conditionMet = this.evaluateConditions(step.condition, context.data)
        if (!conditionMet) {
          // Skip this step if condition not met
          if (step.elseAction) {
            // Execute else action if provided
            await this.executeStepAction(step.elseAction, context, rule)
          }
          continue
        }
      }

      // Execute step action
      await this.executeStepAction(step.action, context, rule)

      // Handle delay between steps
      if (step.delay) {
        // In a real implementation, this would schedule the next step
        // For now, we execute sequentially (can be enhanced with job scheduling)
        if (step.delay.seconds) {
          await new Promise(resolve => setTimeout(resolve, step.delay.seconds * 1000))
        }
      }
    }
  }

  /**
   * Execute a single step action
   */
  static async executeStepAction(
    action: any,
    context: AutomationContext,
    rule: any
  ): Promise<void> {
    const tempRule = {
      ...rule,
      actionType: action.type,
      actionConfig: action.config || {},
    }

    await this.executeAction(tempRule, context)
  }

  static async assignLead(config: any, context: AutomationContext) {
    if (config.userId && context.data.leadId) {
      await prisma.salesLead.update({
        where: { id: context.data.leadId },
        data: { assignedToId: config.userId },
      })
    } else if (config.assignmentRule) {
      // Auto-assign based on rules (round-robin, region, etc.)
      const lead = await prisma.salesLead.findUnique({
        where: { id: context.data.leadId },
      })

      if (lead) {
        const users = await prisma.user.findMany({
          where: {
            tenantId: context.tenantId,
            role: { in: ['ORG_ADMIN', 'PROJECT_MANAGER', 'TEAM_MEMBER'] },
          },
        })

        if (users.length > 0) {
          // Simple round-robin (can be enhanced)
          const assignedUser = users[Math.floor(Math.random() * users.length)]
          await prisma.salesLead.update({
            where: { id: context.data.leadId },
            data: { assignedToId: assignedUser.id },
          })
        }
      }
    }
  }

  static async sendEmail(config: any, context: AutomationContext) {
    // Email sending implementation
    const { sendEmail } = await import('@/lib/email')

    // Check if this is an email sequence
    if (config.sequence && config.steps) {
      // Handle email sequence - send first step
      const { startEmailSequence } = await import('./email-sequences')
      const entityType = context.data.leadId ? 'lead' : 
                        context.data.opportunityId ? 'opportunity' : 
                        context.data.contactId ? 'contact' : 'lead'
      const entityId = context.data.leadId || context.data.opportunityId || context.data.contactId
      
      if (entityId) {
        // Find the rule ID to use as sequence ID
        const rule = await prisma.salesAutomationRule.findFirst({
          where: {
            tenantId: context.tenantId,
            triggerType: context.triggerType as any,
            actionConfig: { path: ['sequence'], equals: true } as any,
          },
        })
        
        if (rule) {
          await startEmailSequence(rule.id, entityType, entityId, context.tenantId)
        }
      }
      return
    }

    // Regular single email
    const lead = context.data.leadId
      ? await prisma.salesLead.findUnique({
          where: { id: context.data.leadId },
          include: { assignedTo: true },
        })
      : null

    const opportunity = context.data.opportunityId
      ? await prisma.salesOpportunity.findUnique({
          where: { id: context.data.opportunityId },
          include: {
            account: { include: { contacts: { take: 1 } } },
            owner: true,
          },
        })
      : null

    const contact = context.data.contactId
      ? await prisma.salesContact.findUnique({
          where: { id: context.data.contactId },
          include: { account: true, owner: true },
        })
      : null

    let email: string | null = null
    let entityData: any = null

    if (lead && lead.email) {
      email = lead.email
      entityData = lead
    } else if (opportunity && opportunity.account?.contacts?.[0]?.email) {
      email = opportunity.account.contacts[0].email
      entityData = { ...opportunity, ...opportunity.account.contacts[0] }
    } else if (contact && (contact.email || contact.personalEmail)) {
      email = contact.email || contact.personalEmail || null
      entityData = contact
    }

    if (email && entityData) {
      const template = config.template || 'default'
      const subject = this.replacePlaceholders(config.subject || 'Follow-up', entityData)
      const body = this.replacePlaceholders(config.body || 'Hello', entityData)

      await sendEmail({
        to: email,
        subject,
        html: body,
      })
    }
  }

  static async createTask(config: any, context: AutomationContext) {
    if (context.data.leadId || context.data.opportunityId) {
      // Get rule creator ID from context
      const rule = await prisma.salesAutomationRule.findFirst({
        where: {
          tenantId: context.tenantId,
          triggerType: context.triggerType as any,
        },
      })

      // Get default assignee from lead/opportunity if not specified
      let defaultAssigneeId = config.assignedToId || rule?.createdById || null
      
      if (!defaultAssigneeId && context.data.leadId) {
        const lead = await prisma.salesLead.findUnique({
          where: { id: context.data.leadId },
          select: { assignedToId: true, ownerId: true },
        })
        defaultAssigneeId = lead?.assignedToId || lead?.ownerId || null
      }

      await prisma.salesActivity.create({
        data: {
          tenantId: context.tenantId,
          type: 'TASK',
          subject: config.subject || 'Follow up',
          description: config.description || null,
          status: 'PLANNED',
          priority: (config.priority as any) || 'MEDIUM',
          dueDate: config.dueDate ? new Date(config.dueDate) : null,
          leadId: context.data.leadId || null,
          opportunityId: context.data.opportunityId || null,
          assignedToId: defaultAssigneeId,
          createdById: rule?.createdById || defaultAssigneeId || null,
        },
      })
    }
  }

  static async updateField(config: any, context: AutomationContext) {
    const { entityType, entityId, field, value } = config

    if (entityType === 'lead' && entityId) {
      await prisma.salesLead.update({
        where: { id: entityId },
        data: { [field]: value },
      })
    } else if (entityType === 'opportunity' && entityId) {
      await prisma.salesOpportunity.update({
        where: { id: entityId },
        data: { [field]: value },
      })
    }
  }

  static async createActivity(config: any, context: AutomationContext) {
    const rule = await prisma.salesAutomationRule.findFirst({
      where: {
        tenantId: context.tenantId,
        triggerType: context.triggerType as any,
      },
    })

    // Get default assignee
    let defaultAssigneeId = config.assignedToId || rule?.createdById || null
    
    if (!defaultAssigneeId && context.data.leadId) {
      const lead = await prisma.salesLead.findUnique({
        where: { id: context.data.leadId },
        select: { assignedToId: true, ownerId: true },
      })
      defaultAssigneeId = lead?.assignedToId || lead?.ownerId || null
    }

    await prisma.salesActivity.create({
      data: {
        tenantId: context.tenantId,
        type: (config.type as any) || 'NOTE',
        subject: config.subject || 'Activity',
        description: config.description || null,
        status: 'COMPLETED',
        leadId: context.data.leadId || null,
        opportunityId: context.data.opportunityId || null,
        assignedToId: defaultAssigneeId,
        createdById: rule?.createdById || defaultAssigneeId || null,
      },
    })
  }

  static async changeStage(config: any, context: AutomationContext) {
    if (context.data.opportunityId && config.stage) {
      await prisma.salesOpportunity.update({
        where: { id: context.data.opportunityId },
        data: { stage: config.stage },
      })
    }
  }

  static async notifyUser(config: any, context: AutomationContext) {
    if (config.userId) {
      await prisma.notification.create({
        data: {
          tenantId: context.tenantId,
          userId: config.userId,
          type: 'STATUS_CHANGE',
          title: config.title || 'Automation Notification',
          message: config.message || 'An automation rule was triggered',
          entityType: 'LEAD',
          entityId: context.data.leadId || context.data.opportunityId || null,
          priority: (config.priority as any) || 'MEDIUM',
        },
      })
    }
  }

  static replacePlaceholders(text: string, data: any): string {
    return text
      .replace(/\{\{firstName\}\}/g, data.firstName || '')
      .replace(/\{\{lastName\}\}/g, data.lastName || '')
      .replace(/\{\{email\}\}/g, data.email || '')
      .replace(/\{\{company\}\}/g, data.company || '')
      .replace(/\{\{assignedTo\}\}/g, data.assignedTo?.name || '')
  }
}


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
          await this.executeAction(rule, context)
        }
      }
    } catch (error) {
      console.error('Automation engine error:', error)
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

    const lead = context.data.leadId
      ? await prisma.salesLead.findUnique({
          where: { id: context.data.leadId },
          include: { assignedTo: true },
        })
      : null

    if (lead && lead.email) {
      const template = config.template || 'default'
      const subject = this.replacePlaceholders(config.subject || 'Follow-up', lead)
      const body = this.replacePlaceholders(config.body || 'Hello', lead)

      await sendEmail({
        to: lead.email,
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


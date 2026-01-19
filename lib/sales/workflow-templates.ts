/**
 * Workflow Templates Library
 * 
 * Pre-built automation workflow templates for common use cases
 */

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: 'lead-management' | 'follow-up' | 'data-quality' | 'notifications' | 'assignment'
  icon: string
  workflow: {
    triggerType: string
    triggerConditions?: any
    actionType: string
    actionConfig: any
    steps?: any[]
  }
  tags: string[]
  popularity?: number
}

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: 'auto-assign-high-score-leads',
    name: 'Auto-Assign High-Scoring Leads',
    description: 'Automatically assign leads with a score above 80 to the best available sales rep',
    category: 'assignment',
    icon: '🎯',
    workflow: {
      triggerType: 'LEAD_SCORED',
      triggerConditions: {
        field: 'score',
        operator: 'greater_than',
        value: 80,
      },
      actionType: 'ASSIGN_LEAD',
      actionConfig: {
        assignmentRule: 'round-robin',
      },
    },
    tags: ['lead-scoring', 'assignment', 'automation'],
    popularity: 95,
  },
  {
    id: 'welcome-new-lead',
    name: 'Welcome New Lead Sequence',
    description: 'Send a 3-step welcome email sequence to new leads',
    category: 'follow-up',
    icon: '👋',
    workflow: {
      triggerType: 'LEAD_CREATED',
      actionType: 'SEND_EMAIL',
      actionConfig: {
        sequence: true,
        steps: [
          {
            stepNumber: 1,
            delayDays: 0,
            subject: 'Welcome to {{company}}!',
            body: 'Hi {{firstName}}, welcome! We\'re excited to have you.',
          },
          {
            stepNumber: 2,
            delayDays: 2,
            subject: 'Getting Started Guide',
            body: 'Hi {{firstName}}, here\'s a quick guide to get you started...',
          },
          {
            stepNumber: 3,
            delayDays: 5,
            subject: 'How can we help?',
            body: 'Hi {{firstName}}, we\'d love to hear from you...',
          },
        ],
      },
    },
    tags: ['email-sequence', 'welcome', 'onboarding'],
    popularity: 90,
  },
  {
    id: 'follow-up-quote',
    name: 'Quote Follow-Up Sequence',
    description: 'Automatically follow up on sent quotes after 3 days',
    category: 'follow-up',
    icon: '📧',
    workflow: {
      triggerType: 'QUOTE_SENT',
      actionType: 'CREATE_TASK',
      actionConfig: {
        subject: 'Follow up on quote',
        description: 'Follow up on quote sent 3 days ago',
        priority: 'HIGH',
        dueDate: '+3 days',
      },
    },
    tags: ['quote', 'follow-up', 'task'],
    popularity: 85,
  },
  {
    id: 'notify-stage-change',
    name: 'Notify on Stage Change',
    description: 'Send notification when opportunity moves to negotiation stage',
    category: 'notifications',
    icon: '🔔',
    workflow: {
      triggerType: 'OPPORTUNITY_STAGE_CHANGED',
      triggerConditions: {
        field: 'stage',
        operator: 'equals',
        value: 'NEGOTIATION_REVIEW',
      },
      actionType: 'NOTIFY_USER',
      actionConfig: {
        userId: '{{ownerId}}',
        title: 'Opportunity in Negotiation',
        message: '{{opportunityName}} has moved to negotiation stage',
        priority: 'HIGH',
      },
    },
    tags: ['notification', 'stage-change', 'opportunity'],
    popularity: 80,
  },
  {
    id: 'validate-lead-email',
    name: 'Validate Lead Email',
    description: 'Automatically validate and clean lead email addresses',
    category: 'data-quality',
    icon: '✅',
    workflow: {
      triggerType: 'LEAD_CREATED',
      actionType: 'UPDATE_FIELD',
      actionConfig: {
        entityType: 'lead',
        field: 'email',
        value: '{{validatedEmail}}',
      },
    },
    tags: ['validation', 'data-quality', 'email'],
    popularity: 75,
  },
  {
    id: 'assign-by-territory',
    name: 'Assign Leads by Territory',
    description: 'Assign leads to sales reps based on geographic territory',
    category: 'assignment',
    icon: '🗺️',
    workflow: {
      triggerType: 'LEAD_CREATED',
      actionType: 'ASSIGN_LEAD',
      actionConfig: {
        assignmentRule: 'territory',
        territoryField: 'region',
      },
    },
    tags: ['assignment', 'territory', 'geography'],
    popularity: 70,
  },
  {
    id: 'remind-meeting',
    name: 'Meeting Reminder',
    description: 'Send reminder 15 minutes before scheduled meetings',
    category: 'notifications',
    icon: '⏰',
    workflow: {
      triggerType: 'ACTIVITY_COMPLETED',
      triggerConditions: {
        field: 'type',
        operator: 'equals',
        value: 'MEETING',
      },
      actionType: 'NOTIFY_USER',
      actionConfig: {
        userId: '{{assignedToId}}',
        title: 'Meeting Reminder',
        message: 'You have a meeting in 15 minutes: {{subject}}',
        priority: 'HIGH',
      },
    },
    tags: ['meeting', 'reminder', 'notification'],
    popularity: 88,
  },
  {
    id: 'auto-qualify-lead',
    name: 'Auto-Qualify High-Value Leads',
    description: 'Automatically qualify leads from enterprise companies',
    category: 'lead-management',
    icon: '⭐',
    workflow: {
      triggerType: 'LEAD_CREATED',
      triggerConditions: {
        conditions: [
          {
            field: 'company',
            operator: 'contains',
            value: 'Inc',
          },
          {
            field: 'industry',
            operator: 'in',
            value: ['Technology', 'Finance', 'Healthcare'],
          },
        ],
        logic: 'AND',
      },
      actionType: 'UPDATE_FIELD',
      actionConfig: {
        entityType: 'lead',
        field: 'status',
        value: 'QUALIFIED',
      },
    },
    tags: ['qualification', 'enterprise', 'automation'],
    popularity: 82,
  },
  {
    id: 'escalate-stale-opportunity',
    name: 'Escalate Stale Opportunities',
    description: 'Notify manager when opportunity has no activity for 7 days',
    category: 'notifications',
    icon: '⚠️',
    workflow: {
      triggerType: 'OPPORTUNITY_STAGE_CHANGED',
      actionType: 'NOTIFY_USER',
      actionConfig: {
        userId: '{{managerId}}',
        title: 'Stale Opportunity Alert',
        message: '{{opportunityName}} has had no activity for 7 days',
        priority: 'MEDIUM',
      },
    },
    tags: ['escalation', 'opportunity', 'management'],
    popularity: 78,
  },
  {
    id: 'duplicate-check',
    name: 'Check for Duplicates',
    description: 'Automatically check for duplicate leads on creation',
    category: 'data-quality',
    icon: '🔍',
    workflow: {
      triggerType: 'LEAD_CREATED',
      actionType: 'CREATE_TASK',
      actionConfig: {
        subject: 'Review potential duplicate',
        description: 'Check if this lead is a duplicate',
        priority: 'MEDIUM',
      },
    },
    tags: ['duplicate', 'data-quality', 'validation'],
    popularity: 72,
  },
]

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: WorkflowTemplate['category']): WorkflowTemplate[] {
  return workflowTemplates.filter(t => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return workflowTemplates.find(t => t.id === id)
}

/**
 * Search templates
 */
export function searchTemplates(query: string): WorkflowTemplate[] {
  const lowerQuery = query.toLowerCase()
  return workflowTemplates.filter(t =>
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}

/**
 * Get popular templates
 */
export function getPopularTemplates(limit: number = 5): WorkflowTemplate[] {
  return [...workflowTemplates]
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    .slice(0, limit)
}


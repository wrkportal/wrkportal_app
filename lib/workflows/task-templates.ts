/**
 * Task Templates System
 * 
 * Defines task templates for each workflow type and methodology combination.
 * Templates specify the fields, structure, and defaults for creating tasks.
 */

import { WorkflowType } from './terminology'
import { MethodologyType } from './methodologies'

export interface TaskField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'list' | 'checklist'
  required: boolean
  options?: string[] // For select type
  placeholder?: string
}

export interface TaskTemplate {
  id: string
  workflowType: WorkflowType
  methodologyType?: MethodologyType
  name: string
  description?: string
  category: string // "Requirement", "Task", "Issue", "Feature", etc.
  fields: TaskField[]
  defaultStatus: string
  defaultPriority: string
}

// Task templates organized by workflow type
export const taskTemplates: Record<WorkflowType, TaskTemplate[]> = {
  [WorkflowType.SOFTWARE_DEVELOPMENT]: [
    {
      id: 'user-story',
      workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
      methodologyType: MethodologyType.SCRUM,
      name: 'User Story',
      description: 'Create a user story following Scrum format',
      category: 'Requirement',
      fields: [
        { key: 'title', label: 'Story Title', type: 'text', required: true },
        { key: 'asA', label: 'As a...', type: 'text', required: true, placeholder: 'As a [user type]' },
        { key: 'iWant', label: 'I want...', type: 'textarea', required: true, placeholder: 'I want to [action]' },
        { key: 'soThat', label: 'So that...', type: 'textarea', required: true, placeholder: 'So that [benefit]' },
        { key: 'acceptanceCriteria', label: 'Acceptance Criteria', type: 'list', required: true },
        { key: 'storyPoints', label: 'Story Points', type: 'number', required: false },
        { key: 'epic', label: 'Epic', type: 'select', required: false, options: [] },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
    {
      id: 'bug-report',
      workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
      name: 'Bug Report',
      description: 'Report a software bug with detailed information',
      category: 'Issue',
      fields: [
        { key: 'title', label: 'Bug Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'stepsToReproduce', label: 'Steps to Reproduce', type: 'list', required: true },
        { key: 'expectedBehavior', label: 'Expected Behavior', type: 'textarea', required: true },
        { key: 'actualBehavior', label: 'Actual Behavior', type: 'textarea', required: true },
        {
          key: 'severity',
          label: 'Severity',
          type: 'select',
          required: true,
          options: ['Critical', 'High', 'Medium', 'Low'],
        },
        {
          key: 'environment',
          label: 'Environment',
          type: 'select',
          required: false,
          options: ['Development', 'Staging', 'Production'],
        },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'HIGH',
    },
    {
      id: 'technical-task',
      workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
      name: 'Technical Task',
      description: 'Create a technical implementation task',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Task Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'technicalDetails', label: 'Technical Details', type: 'textarea', required: false },
        { key: 'estimatedHours', label: 'Estimated Hours', type: 'number', required: false },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  [WorkflowType.MARKETING]: [
    {
      id: 'marketing-activity',
      workflowType: WorkflowType.MARKETING,
      name: 'Marketing Activity',
      description: 'Create a marketing activity or campaign task',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Activity Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        {
          key: 'channel',
          label: 'Channel',
          type: 'select',
          required: true,
          options: ['Email', 'Social Media', 'SEO', 'PPC', 'Content', 'Events'],
        },
        { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
        { key: 'budget', label: 'Budget', type: 'number', required: false },
        { key: 'expectedROI', label: 'Expected ROI', type: 'number', required: false },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
    {
      id: 'content-creation',
      workflowType: WorkflowType.MARKETING,
      name: 'Content Creation',
      description: 'Create marketing content (blog, social, etc.)',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Content Title', type: 'text', required: true },
        { key: 'contentType', label: 'Content Type', type: 'select', required: true, options: ['Blog Post', 'Social Media', 'Video', 'Infographic', 'Email'] },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'targetAudience', label: 'Target Audience', type: 'text', required: true },
        { key: 'publishDate', label: 'Publish Date', type: 'date', required: false },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  [WorkflowType.SALES]: [
    {
      id: 'sales-activity',
      workflowType: WorkflowType.SALES,
      name: 'Sales Activity',
      description: 'Create a sales activity (call, meeting, demo, etc.)',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Activity Name', type: 'text', required: true },
        {
          key: 'type',
          label: 'Activity Type',
          type: 'select',
          required: true,
          options: ['Call', 'Email', 'Meeting', 'Demo', 'Proposal', 'Follow-up'],
        },
        { key: 'description', label: 'Description', type: 'textarea', required: true },
        { key: 'customer', label: 'Customer/Prospect', type: 'text', required: true },
        { key: 'dealValue', label: 'Deal Value', type: 'number', required: false },
        { key: 'probability', label: 'Win Probability (%)', type: 'number', required: false },
        { key: 'scheduledDate', label: 'Scheduled Date', type: 'date', required: false },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  [WorkflowType.CUSTOMER_SERVICE]: [
    {
      id: 'support-ticket',
      workflowType: WorkflowType.CUSTOMER_SERVICE,
      name: 'Support Ticket',
      description: 'Create a customer support ticket',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Ticket Title', type: 'text', required: true },
        { key: 'description', label: 'Issue Description', type: 'textarea', required: true },
        { key: 'customer', label: 'Customer', type: 'text', required: true },
        {
          key: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High', 'Critical'],
        },
        { key: 'category', label: 'Category', type: 'select', required: false, options: ['Technical', 'Billing', 'Account', 'Feature Request'] },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  [WorkflowType.GENERAL]: [
    {
      id: 'general-task',
      workflowType: WorkflowType.GENERAL,
      name: 'Task',
      description: 'Create a general task',
      category: 'Task',
      fields: [
        { key: 'title', label: 'Task Title', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea', required: false },
        { key: 'dueDate', label: 'Due Date', type: 'date', required: false },
      ],
      defaultStatus: 'TODO',
      defaultPriority: 'MEDIUM',
    },
  ],
  // Add templates for other workflows as needed
  [WorkflowType.PRODUCT_MANAGEMENT]: [],
  [WorkflowType.HUMAN_RESOURCES]: [],
  [WorkflowType.LEGAL]: [],
  [WorkflowType.OPERATIONS]: [],
  [WorkflowType.IT_SUPPORT]: [],
  [WorkflowType.FINANCE]: [],
}

/**
 * Get task templates for a workflow and methodology
 */
export function getTaskTemplates(
  workflowType: WorkflowType | null | undefined,
  methodologyType?: MethodologyType | null
): TaskTemplate[] {
  if (!workflowType) {
    return taskTemplates[WorkflowType.GENERAL]
  }

  const templates = taskTemplates[workflowType] || taskTemplates[WorkflowType.GENERAL]

  // Filter by methodology if specified
  if (methodologyType) {
    return templates.filter(
      (template) => !template.methodologyType || template.methodologyType === methodologyType
    )
  }

  return templates
}

/**
 * Get a specific task template by ID
 */
export function getTaskTemplate(
  workflowType: WorkflowType,
  templateId: string
): TaskTemplate | undefined {
  const templates = taskTemplates[workflowType] || []
  return templates.find((template) => template.id === templateId)
}


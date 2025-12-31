/**
 * Workflow Configuration System
 * 
 * Defines default configurations for each workflow type including:
 * - Default widgets
 * - Default statuses
 * - Available features
 * - Workflow-specific settings
 */

import { WorkflowType } from './terminology'
import { MethodologyType } from './methodologies'

export interface WorkflowConfig {
  workflowType: WorkflowType
  name: string
  description: string
  defaultWidgets: string[]
  availableWidgets: string[]
  defaultStatuses: {
    project: string[]
    task: string[]
    issue: string[]
  }
  features: string[]
  icon?: string
}

export const workflowConfigs: Record<WorkflowType, WorkflowConfig> = {
  [WorkflowType.SOFTWARE_DEVELOPMENT]: {
    workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
    name: 'Software Development',
    description: 'Build and deliver software products with agile methodologies',
    defaultWidgets: [
      'summary-stats',
      'daily-briefing',
      'project-cards',
      'sprint-board',
      'burndown-chart',
      'status-chart',
    ],
    availableWidgets: [
      'sprint-board',
      'burndown-chart',
      'bug-tracker',
      'deployment-pipeline',
      'code-quality',
      'release-calendar',
      'velocity-chart',
      'test-coverage',
    ],
    defaultStatuses: {
      project: ['Backlog', 'Sprint Planning', 'In Development', 'Code Review', 'Testing', 'Deployed'],
      task: ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'],
      issue: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
    },
    features: [
      'Sprint Management',
      'User Stories',
      'Bug Tracking',
      'Code Reviews',
      'Deployment Tracking',
      'Test Coverage',
    ],
    icon: 'Code',
  },
  [WorkflowType.PRODUCT_MANAGEMENT]: {
    workflowType: WorkflowType.PRODUCT_MANAGEMENT,
    name: 'Product Management',
    description: 'Manage product roadmaps, features, and user feedback',
    defaultWidgets: [
      'summary-stats',
      'daily-briefing',
      'project-cards',
      'product-roadmap',
      'feature-requests',
      'status-chart',
    ],
    availableWidgets: [
      'product-roadmap',
      'feature-requests',
      'user-feedback',
      'analytics-dashboard',
      'release-planning',
      'feature-adoption',
      'nps-tracker',
    ],
    defaultStatuses: {
      project: ['Discovery', 'Planning', 'Development', 'Beta', 'Launch', 'Iteration'],
      task: ['Backlog', 'In Progress', 'Review', 'Done'],
      issue: ['New', 'Investigating', 'Resolved'],
    },
    features: [
      'Product Roadmap',
      'Feature Management',
      'User Feedback',
      'Analytics',
      'Release Planning',
    ],
    icon: 'Package',
  },
  [WorkflowType.MARKETING]: {
    workflowType: WorkflowType.MARKETING,
    name: 'Marketing',
    description: 'Plan and execute marketing campaigns with performance tracking',
    defaultWidgets: [
      'summary-stats',
      'daily-briefing',
      'project-cards',
      'campaign-performance',
      'lead-funnel',
      'status-chart',
    ],
    availableWidgets: [
      'campaign-performance',
      'lead-funnel',
      'budget-tracker',
      'social-media-metrics',
      'content-calendar',
      'roi-tracker',
      'conversion-funnel',
    ],
    defaultStatuses: {
      project: ['Planning', 'Active', 'Paused', 'Completed', 'Archived'],
      task: ['Planned', 'In Progress', 'Review', 'Published'],
      issue: ['Identified', 'In Progress', 'Resolved'],
    },
    features: [
      'Campaign Management',
      'Lead Tracking',
      'Budget Management',
      'Content Calendar',
      'Performance Analytics',
    ],
    icon: 'Megaphone',
  },
  [WorkflowType.HUMAN_RESOURCES]: {
    workflowType: WorkflowType.HUMAN_RESOURCES,
    name: 'Human Resources',
    description: 'Manage HR initiatives, recruitment, and employee engagement',
    defaultWidgets: [
      'recruitment-pipeline',
      'training-progress',
      'employee-engagement',
      'performance-reviews',
      'benefits-administration',
    ],
    availableWidgets: [
      'recruitment-pipeline',
      'training-progress',
      'employee-engagement',
      'performance-reviews',
      'benefits-administration',
      'retention-metrics',
    ],
    defaultStatuses: {
      project: ['Planning', 'Active', 'On Hold', 'Completed'],
      task: ['Planned', 'In Progress', 'Completed'],
      issue: ['Reported', 'Investigating', 'Resolved'],
    },
    features: [
      'Recruitment',
      'Training',
      'Performance Management',
      'Employee Engagement',
      'Benefits Administration',
    ],
    icon: 'Users',
  },
  [WorkflowType.LEGAL]: {
    workflowType: WorkflowType.LEGAL,
    name: 'Legal',
    description: 'Manage legal cases, contracts, and compliance matters',
    defaultWidgets: [
      'case-pipeline',
      'document-management',
      'billing-tracker',
      'compliance-calendar',
      'contract-management',
    ],
    availableWidgets: [
      'case-pipeline',
      'document-management',
      'billing-tracker',
      'compliance-calendar',
      'contract-management',
    ],
    defaultStatuses: {
      project: ['Intake', 'Investigation', 'Active', 'Settlement', 'Closed'],
      task: ['New', 'In Progress', 'Review', 'Completed'],
      issue: ['Identified', 'In Progress', 'Resolved'],
    },
    features: [
      'Case Management',
      'Document Management',
      'Billing',
      'Compliance',
      'Contract Management',
    ],
    icon: 'Scale',
  },
  [WorkflowType.CUSTOMER_SERVICE]: {
    workflowType: WorkflowType.CUSTOMER_SERVICE,
    name: 'Customer Service',
    description: 'Handle customer support tickets and service requests',
    defaultWidgets: [
      'summary-stats',
      'daily-briefing',
      'project-cards',
      'ticket-queue',
      'sla-tracker',
      'status-chart',
    ],
    availableWidgets: [
      'ticket-queue',
      'sla-tracker',
      'customer-satisfaction',
      'agent-performance',
      'knowledge-base',
      'response-time',
    ],
    defaultStatuses: {
      project: ['New', 'Open', 'In Progress', 'Waiting', 'Resolved', 'Closed'],
      task: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      issue: ['New', 'Escalated', 'Resolved'],
    },
    features: [
      'Ticket Management',
      'SLA Tracking',
      'Customer Satisfaction',
      'Agent Performance',
      'Knowledge Base',
    ],
    icon: 'Headphones',
  },
  [WorkflowType.OPERATIONS]: {
    workflowType: WorkflowType.OPERATIONS,
    name: 'Operations',
    description: 'Manage operational projects and process improvements',
    defaultWidgets: [
      'process-dashboard',
      'resource-utilization',
      'cost-tracking',
      'performance-metrics',
    ],
    availableWidgets: [
      'process-dashboard',
      'resource-utilization',
      'cost-tracking',
      'performance-metrics',
      'efficiency-metrics',
    ],
    defaultStatuses: {
      project: ['Planning', 'Active', 'Monitoring', 'Completed'],
      task: ['Planned', 'In Progress', 'Completed'],
      issue: ['Identified', 'In Progress', 'Resolved'],
    },
    features: [
      'Process Management',
      'Resource Management',
      'Cost Tracking',
      'Performance Metrics',
    ],
    icon: 'Settings',
  },
  [WorkflowType.IT_SUPPORT]: {
    workflowType: WorkflowType.IT_SUPPORT,
    name: 'IT Support',
    description: 'Manage IT projects, tickets, and system maintenance',
    defaultWidgets: [
      'incident-dashboard',
      'system-health',
      'asset-management',
      'change-management',
      'service-catalog',
    ],
    availableWidgets: [
      'incident-dashboard',
      'system-health',
      'asset-management',
      'change-management',
      'service-catalog',
      'mttr-tracker',
    ],
    defaultStatuses: {
      project: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      task: ['New', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      issue: ['New', 'Investigating', 'Resolved', 'Closed'],
    },
    features: [
      'Incident Management',
      'System Monitoring',
      'Asset Management',
      'Change Management',
      'Service Catalog',
    ],
    icon: 'Server',
  },
  [WorkflowType.FINANCE]: {
    workflowType: WorkflowType.FINANCE,
    name: 'Finance',
    description: 'Manage financial projects, budgets, and reporting',
    defaultWidgets: [
      'budget-dashboard',
      'financial-reports',
      'expense-tracking',
      'revenue-analysis',
      'forecast-charts',
    ],
    availableWidgets: [
      'budget-dashboard',
      'financial-reports',
      'expense-tracking',
      'revenue-analysis',
      'forecast-charts',
      'roi-analysis',
    ],
    defaultStatuses: {
      project: ['Planning', 'Active', 'Review', 'Approved', 'Closed'],
      task: ['Planned', 'In Progress', 'Review', 'Approved'],
      issue: ['Identified', 'In Review', 'Resolved'],
    },
    features: [
      'Budget Management',
      'Financial Reporting',
      'Expense Tracking',
      'Revenue Analysis',
      'Forecasting',
    ],
    icon: 'DollarSign',
  },
  [WorkflowType.SALES]: {
    workflowType: WorkflowType.SALES,
    name: 'Sales',
    description: 'Manage sales pipeline, deals, and customer relationships',
    defaultWidgets: [
      'summary-stats',
      'daily-briefing',
      'project-cards',
      'sales-pipeline',
      'revenue-forecast',
      'status-chart',
    ],
    availableWidgets: [
      'sales-pipeline',
      'revenue-forecast',
      'activity-tracker',
      'customer-relationship',
      'sales-performance',
      'conversion-rate',
    ],
    defaultStatuses: {
      project: ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'],
      task: ['Planned', 'In Progress', 'Completed'],
      issue: ['New', 'In Progress', 'Resolved'],
    },
    features: [
      'Sales Pipeline',
      'Deal Management',
      'Activity Tracking',
      'Customer Relationship',
      'Revenue Forecasting',
    ],
    icon: 'TrendingUp',
  },
  [WorkflowType.GENERAL]: {
    workflowType: WorkflowType.GENERAL,
    name: 'General',
    description: 'Standard project management workflow',
    defaultWidgets: [
      'summary-stats',
      'project-cards',
      'budget-chart',
      'status-chart',
    ],
    availableWidgets: [
      'summary-stats',
      'project-cards',
      'budget-chart',
      'status-chart',
      'risk-chart',
      'issues-chart',
    ],
    defaultStatuses: {
      project: ['Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
      task: ['To Do', 'In Progress', 'In Review', 'Blocked', 'Done', 'Cancelled'],
      issue: ['Open', 'In Progress', 'Resolved', 'Closed'],
    },
    features: [
      'Project Management',
      'Task Tracking',
      'Issue Management',
      'Budget Tracking',
    ],
    icon: 'Folder',
  },
}

/**
 * Get workflow configuration
 */
export function getWorkflowConfig(workflowType: WorkflowType | null | undefined): WorkflowConfig {
  if (!workflowType) {
    return workflowConfigs[WorkflowType.GENERAL]
  }
  return workflowConfigs[workflowType] || workflowConfigs[WorkflowType.GENERAL]
}

/**
 * Get default widgets for a workflow
 */
export function getDefaultWidgets(workflowType: WorkflowType | null | undefined): string[] {
  const config = getWorkflowConfig(workflowType)
  return config.defaultWidgets
}

/**
 * Get available widgets for a workflow
 */
export function getAvailableWidgets(workflowType: WorkflowType | null | undefined): string[] {
  const config = getWorkflowConfig(workflowType)
  return config.availableWidgets
}


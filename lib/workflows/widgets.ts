/**
 * Workflow Widgets System
 * 
 * Defines widget configurations and mappings for each workflow type.
 * Maps widget IDs to React components.
 */

import { WorkflowType } from './terminology'
import { MethodologyType } from './methodologies'
import { getWorkflowConfig, workflowConfigs } from './config'

export interface WidgetConfig {
  id: string
  name: string
  description?: string
  workflowTypes: WorkflowType[] // Which workflows this widget is available for
  methodologyTypes?: MethodologyType[] // Optional: specific methodologies
  component?: string // Component name (for dynamic loading)
  category?: string // Widget category
}

// Widget registry - maps widget IDs to their configurations
export const widgetRegistry: Record<string, WidgetConfig> = {
  // General widgets (available for all workflows)
  'summary-stats': {
    id: 'summary-stats',
    name: 'Summary Statistics',
    description: 'Overview of key metrics',
    workflowTypes: Object.values(WorkflowType),
    category: 'Overview',
  },
  'daily-briefing': {
    id: 'daily-briefing',
    name: 'AI Daily Briefing',
    description: 'AI-generated daily summary',
    workflowTypes: Object.values(WorkflowType),
    category: 'AI',
  },
  'project-cards': {
    id: 'project-cards',
    name: 'Project Cards',
    description: 'Visual cards of all projects',
    workflowTypes: Object.values(WorkflowType),
    category: 'Overview',
  },
  'budget-chart': {
    id: 'budget-chart',
    name: 'Budget Overview',
    description: 'Budget tracking and analysis',
    workflowTypes: Object.values(WorkflowType),
    category: 'Financial',
  },
  'status-chart': {
    id: 'status-chart',
    name: 'Status Distribution',
    description: 'Distribution of project statuses',
    workflowTypes: Object.values(WorkflowType),
    category: 'Analytics',
  },
  'my-tasks': {
    id: 'my-tasks',
    name: 'My Tasks',
    description: 'Tasks assigned to you with calendar view',
    workflowTypes: Object.values(WorkflowType),
    category: 'Tasks',
  },

  // Software Development widgets
  'sprint-board': {
    id: 'sprint-board',
    name: 'Sprint Board',
    description: 'Active sprint with task columns',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    methodologyTypes: [MethodologyType.SCRUM, MethodologyType.AGILE],
    category: 'Development',
  },
  'burndown-chart': {
    id: 'burndown-chart',
    name: 'Sprint Burndown',
    description: 'Sprint progress tracking',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    methodologyTypes: [MethodologyType.SCRUM, MethodologyType.AGILE],
    category: 'Development',
  },
  'bug-tracker': {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Track and manage bugs',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    category: 'Quality',
  },
  'deployment-pipeline': {
    id: 'deployment-pipeline',
    name: 'Deployment Pipeline',
    description: 'CI/CD pipeline status',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    category: 'DevOps',
  },
  'code-quality': {
    id: 'code-quality',
    name: 'Code Quality Metrics',
    description: 'Code coverage and quality metrics',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    category: 'Quality',
  },
  'release-calendar': {
    id: 'release-calendar',
    name: 'Release Calendar',
    description: 'Upcoming releases and deployments',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    category: 'Planning',
  },
  'velocity-chart': {
    id: 'velocity-chart',
    name: 'Sprint Velocity',
    description: 'Team velocity tracking',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    methodologyTypes: [MethodologyType.SCRUM, MethodologyType.AGILE],
    category: 'Analytics',
  },
  'test-coverage': {
    id: 'test-coverage',
    name: 'Test Coverage',
    description: 'Test coverage metrics',
    workflowTypes: [WorkflowType.SOFTWARE_DEVELOPMENT],
    category: 'Quality',
  },

  // Marketing widgets
  'campaign-performance': {
    id: 'campaign-performance',
    name: 'Campaign Performance',
    description: 'Campaign metrics and ROI',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Analytics',
  },
  'lead-funnel': {
    id: 'lead-funnel',
    name: 'Lead Funnel',
    description: 'Lead generation and conversion',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Sales',
  },
  'social-media-metrics': {
    id: 'social-media-metrics',
    name: 'Social Media Metrics',
    description: 'Social media performance',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Analytics',
  },
  'content-calendar': {
    id: 'content-calendar',
    name: 'Content Calendar',
    description: 'Content publishing schedule',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Planning',
  },
  'roi-tracker': {
    id: 'roi-tracker',
    name: 'ROI Tracker',
    description: 'Return on investment tracking',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Financial',
  },
  'conversion-funnel': {
    id: 'conversion-funnel',
    name: 'Conversion Funnel',
    description: 'Conversion rate analysis',
    workflowTypes: [WorkflowType.MARKETING],
    category: 'Analytics',
  },

  // Sales widgets
  'sales-pipeline': {
    id: 'sales-pipeline',
    name: 'Sales Pipeline',
    description: 'Deal pipeline visualization',
    workflowTypes: [WorkflowType.SALES],
    category: 'Sales',
  },
  'revenue-forecast': {
    id: 'revenue-forecast',
    name: 'Revenue Forecast',
    description: 'Revenue predictions',
    workflowTypes: [WorkflowType.SALES],
    category: 'Financial',
  },
  'activity-tracker': {
    id: 'activity-tracker',
    name: 'Sales Activity Tracker',
    description: 'Track sales activities',
    workflowTypes: [WorkflowType.SALES],
    category: 'Activity',
  },
  'customer-relationship': {
    id: 'customer-relationship',
    name: 'Customer Relationships',
    description: 'CRM overview',
    workflowTypes: [WorkflowType.SALES],
    category: 'CRM',
  },
  'sales-performance': {
    id: 'sales-performance',
    name: 'Sales Performance',
    description: 'Team and individual performance',
    workflowTypes: [WorkflowType.SALES],
    category: 'Analytics',
  },
  'conversion-rate': {
    id: 'conversion-rate',
    name: 'Conversion Rate',
    description: 'Deal conversion metrics',
    workflowTypes: [WorkflowType.SALES],
    category: 'Analytics',
  },

  // Customer Service widgets
  'ticket-queue': {
    id: 'ticket-queue',
    name: 'Ticket Queue',
    description: 'Support ticket management',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Support',
  },
  'sla-tracker': {
    id: 'sla-tracker',
    name: 'SLA Tracker',
    description: 'Service level agreement tracking',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Support',
  },
  'customer-satisfaction': {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction',
    description: 'CSAT scores and feedback',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Analytics',
  },
  'agent-performance': {
    id: 'agent-performance',
    name: 'Agent Performance',
    description: 'Support agent metrics',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Analytics',
  },
  'knowledge-base': {
    id: 'knowledge-base',
    name: 'Knowledge Base',
    description: 'Help articles and resources',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Resources',
  },
  'response-time': {
    id: 'response-time',
    name: 'Response Time',
    description: 'Average response time metrics',
    workflowTypes: [WorkflowType.CUSTOMER_SERVICE],
    category: 'Analytics',
  },

  // Product Management widgets
  'product-roadmap': {
    id: 'product-roadmap',
    name: 'Product Roadmap',
    description: 'Product feature roadmap',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Planning',
  },
  'feature-requests': {
    id: 'feature-requests',
    name: 'Feature Requests',
    description: 'User feature requests',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Feedback',
  },
  'user-feedback': {
    id: 'user-feedback',
    name: 'User Feedback',
    description: 'Customer feedback and insights',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Feedback',
  },
  'analytics-dashboard': {
    id: 'analytics-dashboard',
    name: 'Product Analytics',
    description: 'Product usage analytics',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Analytics',
  },
  'release-planning': {
    id: 'release-planning',
    name: 'Release Planning',
    description: 'Upcoming release planning',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Planning',
  },
  'feature-adoption': {
    id: 'feature-adoption',
    name: 'Feature Adoption',
    description: 'Feature usage metrics',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Analytics',
  },
  'nps-tracker': {
    id: 'nps-tracker',
    name: 'NPS Tracker',
    description: 'Net Promoter Score tracking',
    workflowTypes: [WorkflowType.PRODUCT_MANAGEMENT],
    category: 'Analytics',
  },
}

/**
 * Get available widgets for a workflow and methodology
 * Includes widgets from both the registry AND the workflow config
 */
export function getAvailableWidgets(
  workflowType: WorkflowType | null,
  methodologyType?: MethodologyType | null
): WidgetConfig[] {
  const widgetsFromRegistry: WidgetConfig[] = []
  const widgetIdsFromConfig: string[] = []
  
  // Get widgets from registry
  if (!workflowType) {
    // Return general widgets
    widgetsFromRegistry.push(...Object.values(widgetRegistry).filter(
      (widget) => widget.workflowTypes.includes(WorkflowType.GENERAL)
    ))
  } else {
    widgetsFromRegistry.push(...Object.values(widgetRegistry).filter((widget) => {
      // Check if widget supports this workflow
      const supportsWorkflow = widget.workflowTypes.includes(workflowType) ||
                               widget.workflowTypes.includes(WorkflowType.GENERAL)

      if (!supportsWorkflow) return false

      // If methodology specified, check if widget supports it
      if (methodologyType && widget.methodologyTypes) {
        return widget.methodologyTypes.includes(methodologyType)
      }

      // If widget has methodology requirements but none specified, exclude it
      if (widget.methodologyTypes && widget.methodologyTypes.length > 0 && !methodologyType) {
        return false
      }

      return true
    }))
  }

  // Get widget IDs from workflow config
  if (workflowType) {
    const workflowConfig = getWorkflowConfig(workflowType)
    if (workflowConfig) {
      widgetIdsFromConfig.push(...workflowConfig.availableWidgets)
    }
  }

  // Create a map of existing widgets by ID
  const existingWidgetMap = new Map(widgetsFromRegistry.map(w => [w.id, w]))
  const existingIds = new Set(widgetsFromRegistry.map(w => w.id))

  // Add widgets from config that aren't in registry yet (as placeholders)
  const additionalWidgets: WidgetConfig[] = []
  for (const widgetId of widgetIdsFromConfig) {
    if (!existingIds.has(widgetId)) {
      // Create a placeholder widget config
      const widgetName = widgetId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      
      additionalWidgets.push({
        id: widgetId,
        name: widgetName,
        description: `Widget for ${workflowType}`,
        workflowTypes: workflowType ? [workflowType] : [WorkflowType.GENERAL],
        methodologyTypes: methodologyType ? [methodologyType] : undefined,
        category: 'Custom',
      })
    }
  }

  // Combine and return
  return [...widgetsFromRegistry, ...additionalWidgets]
}

/**
 * Get default widgets for a workflow
 */
export function getDefaultWidgetsForWorkflow(
  workflowType: WorkflowType | null
): string[] {
  if (!workflowType) {
    return ['summary-stats', 'project-cards', 'budget-chart', 'status-chart']
  }

  const config = getWorkflowConfig(workflowType)
  return config.defaultWidgets
}

/**
 * Get widget configuration by ID
 * Checks both registry and workflow configs
 */
export function getWidgetConfig(widgetId: string, workflowType?: WorkflowType | null): WidgetConfig | undefined {
  // First check registry
  if (widgetRegistry[widgetId]) {
    return widgetRegistry[widgetId]
  }

  // If not in registry, check if it's in any workflow config
  if (workflowType) {
    const config = getWorkflowConfig(workflowType)
    if (config && config.availableWidgets.includes(widgetId)) {
      // Create placeholder config
      const widgetName = widgetId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return {
        id: widgetId,
        name: widgetName,
        description: `Widget for ${config.name}`,
        workflowTypes: [workflowType],
        category: 'Custom',
      }
    }
  }

  // Check all workflow configs
  for (const config of Object.values(workflowConfigs)) {
    if (config.availableWidgets.includes(widgetId)) {
      const widgetName = widgetId
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      return {
        id: widgetId,
        name: widgetName,
        description: `Widget for ${config.name}`,
        workflowTypes: [config.workflowType],
        category: 'Custom',
      }
    }
  }

  return undefined
}

/**
 * Check if a widget is available for a workflow
 */
export function isWidgetAvailable(
  widgetId: string,
  workflowType: WorkflowType | null,
  methodologyType?: MethodologyType | null
): boolean {
  const available = getAvailableWidgets(workflowType, methodologyType)
  return available.some((w) => w.id === widgetId)
}


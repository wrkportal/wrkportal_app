/**
 * Report Templates Service
 * 
 * Pre-built report templates for common sales reports
 */

import { ReportConfig, ReportSchedule } from './reports'

export interface ReportTemplate {
  id: string
  name: string
  description: string
  category: 'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'OPERATIONAL'
  config: ReportConfig
  schedule?: ReportSchedule
  icon?: string
}

/**
 * Get all available report templates
 */
export function getReportTemplates(): ReportTemplate[] {
  return [
    {
      id: 'pipeline-overview',
      name: 'Pipeline Overview',
      description: 'Comprehensive pipeline analysis with stage distribution and value',
      category: 'ANALYTICS',
      config: {
        name: 'Pipeline Overview',
        type: 'ANALYTICS',
        dataSource: 'opportunities',
        chartType: 'bar',
        groupBy: 'stage',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'win-loss-analysis',
      name: 'Win/Loss Analysis',
      description: 'Analyze won and lost opportunities with reasons',
      category: 'ANALYTICS',
      config: {
        name: 'Win/Loss Analysis',
        type: 'ANALYTICS',
        dataSource: 'opportunities',
        chartType: 'pie',
        filters: {
          status: ['WON', 'LOST'],
        },
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'rep-performance',
      name: 'Rep Performance Report',
      description: 'Sales rep performance metrics and rankings',
      category: 'PERFORMANCE',
      config: {
        name: 'Rep Performance Report',
        type: 'PERFORMANCE',
        dataSource: 'opportunities',
        chartType: 'bar',
        groupBy: 'ownerId',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'lead-conversion',
      name: 'Lead Conversion Report',
      description: 'Track lead conversion rates by source and status',
      category: 'ANALYTICS',
      config: {
        name: 'Lead Conversion Report',
        type: 'ANALYTICS',
        dataSource: 'leads',
        chartType: 'bar',
        groupBy: 'leadSource',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'sales-forecast',
      name: 'Sales Forecast',
      description: 'Revenue forecast based on pipeline and historical data',
      category: 'FORECAST',
      config: {
        name: 'Sales Forecast',
        type: 'FORECAST',
        dataSource: 'forecast',
        chartType: 'line',
        dateRange: {
          start: new Date().toISOString(),
          end: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
        },
      },
    },
    {
      id: 'activity-summary',
      name: 'Activity Summary',
      description: 'Summary of all sales activities and interactions',
      category: 'OPERATIONAL',
      config: {
        name: 'Activity Summary',
        type: 'CUSTOM',
        dataSource: 'activities',
        chartType: 'table',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'time-to-close',
      name: 'Time to Close Analysis',
      description: 'Average time to close deals by stage and rep',
      category: 'ANALYTICS',
      config: {
        name: 'Time to Close Analysis',
        type: 'ANALYTICS',
        dataSource: 'opportunities',
        chartType: 'bar',
        filters: {
          status: 'WON',
        },
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'deal-size-analysis',
      name: 'Deal Size Analysis',
      description: 'Distribution of deal sizes and average deal value',
      category: 'ANALYTICS',
      config: {
        name: 'Deal Size Analysis',
        type: 'ANALYTICS',
        dataSource: 'opportunities',
        chartType: 'bar',
        filters: {
          status: 'WON',
        },
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
          end: new Date().toISOString(),
        },
      },
    },
    {
      id: 'monthly-sales-summary',
      name: 'Monthly Sales Summary',
      description: 'Monthly sales performance with trends',
      category: 'PERFORMANCE',
      config: {
        name: 'Monthly Sales Summary',
        type: 'PERFORMANCE',
        dataSource: 'opportunities',
        chartType: 'line',
        groupBy: 'month',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString(),
          end: new Date().toISOString(),
        },
      },
      schedule: {
        frequency: 'MONTHLY',
        dayOfMonth: 1,
        time: '09:00',
        recipients: [],
        format: 'PDF',
      },
    },
    {
      id: 'quarterly-review',
      name: 'Quarterly Sales Review',
      description: 'Comprehensive quarterly sales performance review',
      category: 'PERFORMANCE',
      config: {
        name: 'Quarterly Sales Review',
        type: 'PERFORMANCE',
        dataSource: 'opportunities',
        chartType: 'table',
        dateRange: {
          start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(),
          end: new Date().toISOString(),
        },
      },
      schedule: {
        frequency: 'QUARTERLY',
        dayOfMonth: 1,
        time: '09:00',
        recipients: [],
        format: 'PDF',
      },
    },
  ]
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): ReportTemplate[] {
  return getReportTemplates().filter(t => t.category === category)
}

/**
 * Get template by ID
 */
export function getTemplateById(templateId: string): ReportTemplate | undefined {
  return getReportTemplates().find(t => t.id === templateId)
}


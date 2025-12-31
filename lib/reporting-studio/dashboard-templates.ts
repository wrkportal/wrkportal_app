// Dashboard Templates for Reporting Studio
// Provides pre-built dashboard configurations for common use cases

import { DashboardWidget } from '@/components/reporting-studio/dashboard-builder'
import { ChartType } from '@/lib/reporting-studio/chart-types'

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  category: 'ANALYTICS' | 'EXECUTIVE' | 'OPERATIONAL' | 'FINANCE' | 'SALES' | 'CUSTOM'
  thumbnail?: string
  widgets: DashboardWidget[]
  tags: string[]
}

// Generate sample data for a chart type
function generateSampleData(chartType: ChartType): any[] {
  const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  switch (chartType) {
    case ChartType.PIE:
      return [
        { name: 'Category A', value: 30 },
        { name: 'Category B', value: 25 },
        { name: 'Category C', value: 20 },
        { name: 'Category D', value: 15 },
        { name: 'Category E', value: 10 },
      ]
    case ChartType.BAR:
    case ChartType.COLUMN:
    case ChartType.LINE:
    case ChartType.AREA:
      return categories.slice(0, 6).map(cat => ({
        category: cat,
        value: Math.floor(Math.random() * 100) + 10,
        value2: Math.floor(Math.random() * 80) + 15,
      }))
    default:
      return categories.slice(0, 6).map(cat => ({
        x: cat,
        y: Math.floor(Math.random() * 100) + 10,
      }))
  }
}

export const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Dashboard',
    description: 'Start with an empty dashboard',
    category: 'CUSTOM',
    widgets: [],
    tags: ['blank', 'empty', 'custom'],
  },
  {
    id: 'executive-overview',
    name: 'Executive Overview',
    description: 'High-level metrics and KPIs for executive decision-making',
    category: 'EXECUTIVE',
    widgets: [
      {
        id: 'widget-1',
        title: 'Revenue Overview',
        chartConfig: {
          type: ChartType.LINE,
          title: 'Revenue Trend',
          xAxis: { field: 'category', label: 'Month' },
          yAxis: { field: 'value', label: 'Revenue ($)' },
          series: [{ field: 'value', label: 'Revenue', color: '#3b82f6' }],
        },
        data: generateSampleData(ChartType.LINE),
        layout: { x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-2',
        title: 'Key Metrics',
        chartConfig: {
          type: ChartType.PIE,
          title: 'Distribution',
          series: [{ field: 'value', label: 'Value' }],
        },
        data: generateSampleData(ChartType.PIE),
        layout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'widget-3',
        title: 'Performance Metrics',
        chartConfig: {
          type: ChartType.COLUMN,
          title: 'Performance by Category',
          xAxis: { field: 'category', label: 'Category' },
          yAxis: { field: 'value', label: 'Value' },
          series: [{ field: 'value', label: 'Performance', color: '#10b981' }],
        },
        data: generateSampleData(ChartType.COLUMN),
        layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
    tags: ['executive', 'kpi', 'metrics', 'overview'],
  },
  {
    id: 'analytics-dashboard',
    name: 'Analytics Dashboard',
    description: 'Comprehensive analytics with multiple chart types',
    category: 'ANALYTICS',
    widgets: [
      {
        id: 'widget-1',
        title: 'Trend Analysis',
        chartConfig: {
          type: ChartType.AREA,
          title: 'Trend Over Time',
          xAxis: { field: 'category', label: 'Time Period' },
          yAxis: { field: 'value', label: 'Value' },
          series: [
            { field: 'value', label: 'Series 1', color: '#3b82f6' },
            { field: 'value2', label: 'Series 2', color: '#10b981' },
          ],
        },
        data: generateSampleData(ChartType.AREA),
        layout: { x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-2',
        title: 'Distribution',
        chartConfig: {
          type: ChartType.BAR,
          title: 'Category Distribution',
          xAxis: { field: 'category', label: 'Category' },
          yAxis: { field: 'value', label: 'Count' },
          series: [{ field: 'value', label: 'Count', color: '#f59e0b' }],
        },
        data: generateSampleData(ChartType.BAR),
        layout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'widget-3',
        title: 'Comparison',
        chartConfig: {
          type: ChartType.COLUMN,
          title: 'Comparison View',
          xAxis: { field: 'category', label: 'Category' },
          yAxis: { field: 'value', label: 'Value' },
          series: [
            { field: 'value', label: 'Current', color: '#3b82f6' },
            { field: 'value2', label: 'Previous', color: '#94a3b8' },
          ],
        },
        data: generateSampleData(ChartType.COLUMN),
        layout: { x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-4',
        title: 'Correlation',
        chartConfig: {
          type: ChartType.SCATTER,
          title: 'Scatter Analysis',
          xAxis: { field: 'x', label: 'X Axis' },
          yAxis: { field: 'y', label: 'Y Axis' },
          series: [{ field: 'y', label: 'Data Points', color: '#8b5cf6' }],
        },
        data: generateSampleData(ChartType.SCATTER),
        layout: { x: 6, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      },
    ],
    tags: ['analytics', 'trends', 'comparison', 'analysis'],
  },
  {
    id: 'financial-dashboard',
    name: 'Financial Dashboard',
    description: 'Financial metrics, revenue, and expense tracking',
    category: 'FINANCE',
    widgets: [
      {
        id: 'widget-1',
        title: 'Revenue Trend',
        chartConfig: {
          type: ChartType.LINE,
          title: 'Revenue Over Time',
          xAxis: { field: 'category', label: 'Month' },
          yAxis: { field: 'value', label: 'Revenue ($)' },
          series: [{ field: 'value', label: 'Revenue', color: '#10b981' }],
        },
        data: generateSampleData(ChartType.LINE),
        layout: { x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-2',
        title: 'Revenue Breakdown',
        chartConfig: {
          type: ChartType.PIE,
          title: 'Revenue by Source',
          series: [{ field: 'value', label: 'Revenue' }],
        },
        data: generateSampleData(ChartType.PIE),
        layout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'widget-3',
        title: 'Expense Analysis',
        chartConfig: {
          type: ChartType.COLUMN,
          title: 'Expenses by Category',
          xAxis: { field: 'category', label: 'Category' },
          yAxis: { field: 'value', label: 'Amount ($)' },
          series: [{ field: 'value', label: 'Expenses', color: '#ef4444' }],
        },
        data: generateSampleData(ChartType.COLUMN),
        layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
    tags: ['finance', 'revenue', 'expenses', 'financial'],
  },
  {
    id: 'sales-dashboard',
    name: 'Sales Dashboard',
    description: 'Sales performance, leads, and conversion metrics',
    category: 'SALES',
    widgets: [
      {
        id: 'widget-1',
        title: 'Sales Performance',
        chartConfig: {
          type: ChartType.BAR,
          title: 'Sales by Region',
          xAxis: { field: 'category', label: 'Region' },
          yAxis: { field: 'value', label: 'Sales ($)' },
          series: [{ field: 'value', label: 'Sales', color: '#3b82f6' }],
        },
        data: generateSampleData(ChartType.BAR),
        layout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-2',
        title: 'Sales Distribution',
        chartConfig: {
          type: ChartType.PIE,
          title: 'Sales by Product',
          series: [{ field: 'value', label: 'Sales' }],
        },
        data: generateSampleData(ChartType.PIE),
        layout: { x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'widget-3',
        title: 'Sales Trend',
        chartConfig: {
          type: ChartType.AREA,
          title: 'Sales Trend Over Time',
          xAxis: { field: 'category', label: 'Month' },
          yAxis: { field: 'value', label: 'Sales ($)' },
          series: [
            { field: 'value', label: 'Current Period', color: '#10b981' },
            { field: 'value2', label: 'Previous Period', color: '#94a3b8' },
          ],
        },
        data: generateSampleData(ChartType.AREA),
        layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
    tags: ['sales', 'performance', 'leads', 'conversion'],
  },
  {
    id: 'operational-dashboard',
    name: 'Operational Dashboard',
    description: 'Operational metrics, processes, and efficiency tracking',
    category: 'OPERATIONAL',
    widgets: [
      {
        id: 'widget-1',
        title: 'Activity Overview',
        chartConfig: {
          type: ChartType.COLUMN,
          title: 'Activities by Type',
          xAxis: { field: 'category', label: 'Activity Type' },
          yAxis: { field: 'value', label: 'Count' },
          series: [{ field: 'value', label: 'Count', color: '#3b82f6' }],
        },
        data: generateSampleData(ChartType.COLUMN),
        layout: { x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
      },
      {
        id: 'widget-2',
        title: 'Status Distribution',
        chartConfig: {
          type: ChartType.PIE,
          title: 'Status Breakdown',
          series: [{ field: 'value', label: 'Count' }],
        },
        data: generateSampleData(ChartType.PIE),
        layout: { x: 8, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
      },
      {
        id: 'widget-3',
        title: 'Performance Trend',
        chartConfig: {
          type: ChartType.LINE,
          title: 'Performance Over Time',
          xAxis: { field: 'category', label: 'Time Period' },
          yAxis: { field: 'value', label: 'Performance Score' },
          series: [{ field: 'value', label: 'Score', color: '#10b981' }],
        },
        data: generateSampleData(ChartType.LINE),
        layout: { x: 0, y: 4, w: 12, h: 4, minW: 6, minH: 3 },
      },
    ],
    tags: ['operations', 'efficiency', 'process', 'performance'],
  },
]

export function getDashboardTemplate(id: string): DashboardTemplate | undefined {
  return DASHBOARD_TEMPLATES.find(template => template.id === id)
}

export function getDashboardTemplatesByCategory(category: DashboardTemplate['category']): DashboardTemplate[] {
  return DASHBOARD_TEMPLATES.filter(template => template.category === category)
}

export function searchDashboardTemplates(query: string): DashboardTemplate[] {
  const lowerQuery = query.toLowerCase()
  return DASHBOARD_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(lowerQuery) ||
    template.description.toLowerCase().includes(lowerQuery) ||
    template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  )
}


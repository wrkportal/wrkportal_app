/**
 * Sales Dashboard Service
 * 
 * Manages custom sales dashboards with drag-and-drop widgets
 */

import { prisma } from '@/lib/prisma'

export interface DashboardWidget {
  id: string
  type: 'METRIC' | 'CHART' | 'TABLE' | 'LIST' | 'KPI' | 'FUNNEL' | 'TIMELINE'
  title: string
  config: {
    dataSource?: string
    metric?: string
    chartType?: 'bar' | 'line' | 'pie' | 'area' | 'scatter'
    filters?: Record<string, any>
    dateRange?: {
      start: string
      end: string
    }
    [key: string]: any
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface DashboardLayout {
  lg: Array<{ i: string; x: number; y: number; w: number; h: number }>
  md: Array<{ i: string; x: number; y: number; w: number; h: number }>
  sm: Array<{ i: string; x: number; y: number; w: number; h: number }>
  xs: Array<{ i: string; x: number; y: number; w: number; h: number }>
}

/**
 * Create a new dashboard
 */
export async function createDashboard(
  tenantId: string,
  ownerId: string,
  data: {
    name: string
    description?: string
    type: 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM'
    widgets?: DashboardWidget[]
    layout?: DashboardLayout
    filters?: Record<string, any>
    isDefault?: boolean
    sharedWith?: string[]
  }
) {
  const dashboard = await (prisma as any).salesDashboard.create({
    data: {
      tenantId,
      ownerId,
      name: data.name,
      description: data.description,
      type: data.type,
      layout: data.layout || {},
      widgets: data.widgets || [],
      filters: data.filters || {},
      isDefault: data.isDefault || false,
      sharedWith: data.sharedWith || [],
    },
  })

  return dashboard
}

/**
 * Get dashboard by ID
 */
export async function getDashboard(
  dashboardId: string,
  tenantId: string,
  userId?: string
) {
  const dashboard = await (prisma as any).salesDashboard.findFirst({
    where: {
      id: dashboardId,
      tenantId,
      OR: [
        { ownerId: userId },
        { sharedWith: { has: userId } },
        { type: 'TEAM' },
        { type: 'EXECUTIVE' },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  })

  return dashboard
}

/**
 * Get all dashboards for a tenant/user
 */
export async function getDashboards(
  tenantId: string,
  userId?: string,
  type?: 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM'
) {
  const where: any = {
    tenantId,
  }

  if (type) {
    where.type = type
  }

  // User can see:
  // - Their own dashboards
  // - Dashboards shared with them
  // - Team dashboards
  // - Executive dashboards
  if (userId) {
    where.OR = [
      { ownerId: userId },
      { sharedWith: { has: userId } },
      { type: 'TEAM' },
      { type: 'EXECUTIVE' },
    ]
  }

  const dashboards = await (prisma as any).salesDashboard.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return dashboards
}

/**
 * Update dashboard
 */
export async function updateDashboard(
  dashboardId: string,
  tenantId: string,
  ownerId: string,
  data: {
    name?: string
    description?: string
    type?: 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM'
    widgets?: DashboardWidget[]
    layout?: DashboardLayout
    filters?: Record<string, any>
    isDefault?: boolean
    sharedWith?: string[]
  }
) {
  // Verify ownership
  const dashboard = await (prisma as any).salesDashboard.findFirst({
    where: {
      id: dashboardId,
      tenantId,
      ownerId,
    },
  })

  if (!dashboard) {
    throw new Error('Dashboard not found or access denied')
  }

  // If setting as default, unset other defaults
  if (data.isDefault === true) {
    await (prisma as any).salesDashboard.updateMany({
      where: {
        tenantId,
        ownerId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    })
  }

  const updated = await (prisma as any).salesDashboard.update({
    where: { id: dashboardId },
    data: {
      name: data.name,
      description: data.description,
      type: data.type,
      layout: data.layout,
      widgets: data.widgets,
      filters: data.filters,
      isDefault: data.isDefault,
      sharedWith: data.sharedWith,
    },
  })

  return updated
}

/**
 * Delete dashboard
 */
export async function deleteDashboard(
  dashboardId: string,
  tenantId: string,
  ownerId: string
) {
  const dashboard = await (prisma as any).salesDashboard.findFirst({
    where: {
      id: dashboardId,
      tenantId,
      ownerId,
    },
  })

  if (!dashboard) {
    throw new Error('Dashboard not found or access denied')
  }

  await (prisma as any).salesDashboard.delete({
    where: { id: dashboardId },
  })

  return { success: true }
}

/**
 * Get default dashboard for user
 */
export async function getDefaultDashboard(
  tenantId: string,
  userId: string
) {
  const dashboard = await (prisma as any).salesDashboard.findFirst({
    where: {
      tenantId,
      ownerId: userId,
      isDefault: true,
    },
  })

  return dashboard
}

/**
 * Get available widget types
 */
export function getAvailableWidgetTypes(): Array<{
  type: DashboardWidget['type']
  name: string
  description: string
  defaultSize: { w: number; h: number }
}> {
  return [
    {
      type: 'METRIC',
      name: 'Metric',
      description: 'Display a single metric value',
      defaultSize: { w: 3, h: 2 },
    },
    {
      type: 'KPI',
      name: 'KPI Card',
      description: 'Key performance indicator with trend',
      defaultSize: { w: 3, h: 3 },
    },
    {
      type: 'CHART',
      name: 'Chart',
      description: 'Visualize data with charts',
      defaultSize: { w: 6, h: 4 },
    },
    {
      type: 'FUNNEL',
      name: 'Funnel',
      description: 'Sales funnel visualization',
      defaultSize: { w: 6, h: 5 },
    },
    {
      type: 'TABLE',
      name: 'Table',
      description: 'Data table view',
      defaultSize: { w: 6, h: 5 },
    },
    {
      type: 'LIST',
      name: 'List',
      description: 'List of items (leads, opportunities, etc.)',
      defaultSize: { w: 6, h: 4 },
    },
    {
      type: 'TIMELINE',
      name: 'Timeline',
      description: 'Timeline visualization',
      defaultSize: { w: 6, h: 4 },
    },
  ]
}


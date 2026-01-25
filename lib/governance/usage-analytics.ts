/**
 * Phase 4.4: Usage Analytics
 * 
 * Track data usage and generate analytics
 */

import { prisma } from '@/lib/prisma'
import { UsageAction } from '@prisma/client'

export interface TrackUsageParams {
  tenantId: string
  resourceType: string
  resourceId: string
  userId?: string | null
  action: UsageAction
  metadata?: Record<string, any>
  duration?: number
}

/**
 * Track a usage event
 */
export async function trackUsage(params: TrackUsageParams) {
  const { tenantId, resourceType, resourceId, userId, action, metadata, duration } = params

  return prisma.dataUsage.create({
    data: {
      tenantId,
      resourceType,
      resourceId,
      userId: userId || null,
      action,
      metadata: metadata || {},
      duration: duration || null,
    },
  })
}

/**
 * Get usage statistics for a resource
 */
export async function getResourceUsageStats(
  resourceType: string,
  resourceId: string,
  tenantId: string,
  startDate?: Date,
  endDate?: Date
) {
  const where: any = {
    tenantId,
    resourceType,
    resourceId,
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [totalViews, totalExports, totalShares, uniqueUsers, usageByAction] = await Promise.all([
    prisma.dataUsage.count({
      where: { ...where, action: UsageAction.VIEWED },
    }),
    prisma.dataUsage.count({
      where: { ...where, action: UsageAction.EXPORTED },
    }),
    prisma.dataUsage.count({
      where: { ...where, action: UsageAction.SHARED },
    }),
    prisma.dataUsage.findMany({
      where,
      select: { userId: true },
      distinct: ['userId'],
    }),
    prisma.dataUsage.groupBy({
      by: ['action'],
      where,
      _count: true,
    }),
  ])

  return {
    totalViews,
    totalExports,
    totalShares,
    uniqueUsers: uniqueUsers.length,
    usageByAction: usageByAction.map((item: any) => ({
      action: item.action,
      count: item._count,
    })),
  }
}

/**
 * Get usage trends over time
 */
export async function getUsageTrends(
  resourceType: string,
  resourceId: string,
  tenantId: string,
  period: 'day' | 'week' | 'month' = 'day',
  days: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const usage = await prisma.dataUsage.findMany({
    where: {
      tenantId,
      resourceType,
      resourceId,
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      action: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by period
  const trends: Record<string, Record<string, number>> = {}

  for (const item of usage) {
    let key: string
    const date = new Date(item.createdAt)

    if (period === 'day') {
      key = date.toISOString().split('T')[0]
    } else if (period === 'week') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      key = weekStart.toISOString().split('T')[0]
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }

    if (!trends[key]) {
      trends[key] = {}
    }

    if (!trends[key][item.action]) {
      trends[key][item.action] = 0
    }

    trends[key][item.action]++
  }

  return Object.entries(trends).map(([date, actions]) => ({
    date,
    ...actions,
  }))
}

/**
 * Get most used resources
 */
export async function getMostUsedResources(
  tenantId: string,
  resourceType?: string,
  limit: number = 10,
  periodDays: number = 30
) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - periodDays)

  const where: any = {
    tenantId,
    createdAt: {
      gte: startDate,
    },
  }

  if (resourceType) {
    where.resourceType = resourceType
  }

  const usage = await prisma.dataUsage.groupBy({
    by: ['resourceType', 'resourceId'],
    where,
    _count: true,
    orderBy: {
      _count: {
        resourceId: 'desc',
      },
    },
    take: limit,
  })

  return usage.map((item: any) => ({
    resourceType: item.resourceType,
    resourceId: item.resourceId,
    usageCount: item._count,
  }))
}


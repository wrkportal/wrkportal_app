/**
 * Phase 4.3: Activity Feed System
 * 
 * Creates and manages activity feed entries
 */

import { prisma } from '@/lib/prisma'
import { ActivityAction } from '@prisma/client'

export interface CreateActivityParams {
  tenantId: string
  userId?: string | null
  resourceType: string
  resourceId?: string | null
  action: ActivityAction
  description: string
  metadata?: Record<string, any>
  mentions?: string[]
}

/**
 * Create an activity feed entry
 */
export async function createActivityFeed(params: CreateActivityParams) {
  const { tenantId, userId, resourceType, resourceId, action, description, metadata, mentions } = params

  return prisma.activityFeed.create({
    data: {
      tenantId,
      userId: userId || null,
      resourceType,
      resourceId: resourceId || null,
      action,
      description,
      metadata: metadata || {},
      mentions: mentions || [],
    },
  })
}

/**
 * Get activity feed for a user
 */
export async function getActivityFeed(
  userId: string,
  tenantId: string,
  options?: {
    resourceType?: string
    resourceId?: string
    limit?: number
    skip?: number
  }
) {
  const { resourceType, resourceId, limit = 50, skip = 0 } = options || {}

  const where: any = {
    tenantId,
    OR: [
      { userId }, // Activities by user
      { mentions: { has: userId } }, // Activities mentioning user
    ],
  }

  if (resourceType) {
    where.resourceType = resourceType
  }

  if (resourceId) {
    where.resourceId = resourceId
  }

  const [activities, total] = await Promise.all([
    prisma.activityFeed.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip,
    }),
    prisma.activityFeed.count({ where }),
  ])

  return { activities, total }
}

/**
 * Get activity feed for a resource
 */
export async function getResourceActivity(
  resourceType: string,
  resourceId: string,
  tenantId: string,
  limit: number = 50
) {
  return prisma.activityFeed.findMany({
    where: {
      tenantId,
      resourceType,
      resourceId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

/**
 * Mark activity as read
 */
export async function markActivityAsRead(activityId: string): Promise<void> {
  await prisma.activityFeed.update({
    where: { id: activityId },
    data: { isRead: true },
  })
}

/**
 * Mark multiple activities as read
 */
export async function markActivitiesAsRead(activityIds: string[]): Promise<void> {
  await prisma.activityFeed.updateMany({
    where: {
      id: { in: activityIds },
    },
    data: {
      isRead: true,
    },
  })
}


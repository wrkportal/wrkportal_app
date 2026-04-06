/**
 * Tier Utilities
 *
 * Utility functions for checking user tiers and tier-based feature access.
 * All infrastructure runs on AWS.
 */

import { prisma } from '@/lib/prisma'

export type UserTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise'

export interface TierLimits {
  aiEnabled: boolean
  aiQueriesPerMonth: number | null // null = unlimited
  automationsPerMonth: number | null // null = unlimited
  storageGB: number | null // null = unlimited
  maxUsers: number | null // null = unlimited
}

/**
 * Get tier limits for a given tier
 */
export function getTierLimits(tier: UserTier): TierLimits {
  switch (tier) {
    case 'free':
      return {
        aiEnabled: false,
        aiQueriesPerMonth: 0,
        automationsPerMonth: 10,
        storageGB: 1,
        maxUsers: 10,
      }
    case 'starter':
      return {
        aiEnabled: false,
        aiQueriesPerMonth: 0,
        automationsPerMonth: 100,
        storageGB: 20,
        maxUsers: 10,
      }
    case 'professional':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: 50,
        automationsPerMonth: 250,
        storageGB: 50,
        maxUsers: 50,
      }
    case 'business':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: 500,
        automationsPerMonth: null,
        storageGB: 250,
        maxUsers: null,
      }
    case 'enterprise':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: null,
        automationsPerMonth: null,
        storageGB: null,
        maxUsers: null,
      }
    default:
      return getTierLimits('free')
  }
}

/**
 * Get user's tier from their tenant
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })

    if (!user) return 'free'

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { plan: true },
    })

    if (!tenant) return 'free'

    const plan = tenant.plan?.toLowerCase() || 'free'
    const validTiers: UserTier[] = ['free', 'starter', 'professional', 'business', 'enterprise']

    if (validTiers.includes(plan as UserTier)) return plan as UserTier

    if (plan.includes('pro') || plan.includes('professional')) return 'professional'
    if (plan.includes('business') || plan.includes('bus')) return 'business'
    if (plan.includes('enterprise') || plan.includes('ent')) return 'enterprise'
    if (plan.includes('starter') || plan.includes('start')) return 'starter'

    return 'free'
  } catch (error) {
    console.error('Error getting user tier:', error)
    return 'free'
  }
}

/**
 * Get user's tier limits
 */
export async function getUserTierLimits(userId: string): Promise<TierLimits> {
  const tier = await getUserTier(userId)
  return getTierLimits(tier)
}

/**
 * Check if user has access to AI features
 */
export async function canUseAI(userId: string): Promise<boolean> {
  const limits = await getUserTierLimits(userId)
  return limits.aiEnabled
}

/**
 * Get current month's AI query count for a tenant
 */
export async function getCurrentMonthAIQueryCount(tenantId: string): Promise<number> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const count = await prisma.activityFeed.count({
      where: {
        tenantId,
        resourceType: 'AI',
        action: 'EXECUTE',
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })

    return count
  } catch (error) {
    console.error('Error getting AI query count:', error)
    return 0
  }
}

/**
 * Log an AI query to ActivityFeed for tracking
 */
export async function logAIQuery(
  tenantId: string,
  userId: string,
  queryType: string = 'CHAT',
  metadata?: Record<string, any>
) {
  try {
    const { createActivityFeed } = await import('@/lib/collaboration/activity-feed')

    await createActivityFeed({
      tenantId,
      userId,
      resourceType: 'AI',
      resourceId: null,
      action: 'EXECUTE',
      description: `AI ${queryType} query executed`,
      metadata: { queryType, timestamp: new Date().toISOString(), ...metadata },
      mentions: [],
    })
  } catch (error) {
    console.error('Error logging AI query:', error)
  }
}

/**
 * Check if user can execute more AI queries this month
 */
export async function canExecuteAIQuery(userId: string, currentMonthCount?: number): Promise<boolean> {
  const limits = await getUserTierLimits(userId)

  if (!limits.aiEnabled) return false
  if (limits.aiQueriesPerMonth === null) return true

  let count = currentMonthCount
  if (count === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })
    count = user ? await getCurrentMonthAIQueryCount(user.tenantId) : 0
  }

  return count < limits.aiQueriesPerMonth
}

/**
 * Get AI query limit information for user
 */
export async function getAIQueryLimitInfo(userId: string) {
  const limits = await getUserTierLimits(userId)

  if (!limits.aiEnabled) {
    return { currentCount: 0, limit: null, remaining: null, canExecute: false }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  })

  const currentCount = user ? await getCurrentMonthAIQueryCount(user.tenantId) : 0
  const canExecute = await canExecuteAIQuery(userId, currentCount)
  const remaining =
    limits.aiQueriesPerMonth === null ? null : Math.max(0, limits.aiQueriesPerMonth - currentCount)

  return { currentCount, limit: limits.aiQueriesPerMonth, remaining, canExecute }
}

/**
 * Get current month's automation count for a tenant
 */
export async function getCurrentMonthAutomationCount(tenantId: string): Promise<number> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    return await prisma.salesAutomationRule.count({
      where: {
        tenantId,
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
    })
  } catch (error) {
    console.error('Error getting automation count:', error)
    return 0
  }
}

/**
 * Check if user can create more automations this month
 */
export async function canCreateAutomation(userId: string, currentMonthCount?: number): Promise<boolean> {
  const limits = await getUserTierLimits(userId)
  if (limits.automationsPerMonth === null) return true

  let count = currentMonthCount
  if (count === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })
    count = user ? await getCurrentMonthAutomationCount(user.tenantId) : 0
  }

  return count < limits.automationsPerMonth
}

/**
 * Get automation limit info for a user
 */
export async function getAutomationLimitInfo(userId: string) {
  const limits = await getUserTierLimits(userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  })
  const currentCount = user ? await getCurrentMonthAutomationCount(user.tenantId) : 0
  const maxAllowed = limits.automationsPerMonth
  return {
    currentCount,
    maxAllowed,
    remaining: maxAllowed === null ? null : Math.max(0, maxAllowed - currentCount),
    canCreate: maxAllowed === null ? true : currentCount < maxAllowed,
  }
}

/**
 * Check if user tier is at least the specified tier
 */
export async function hasMinimumTier(userId: string, minimumTier: UserTier): Promise<boolean> {
  const tier = await getUserTier(userId)
  const tierOrder: UserTier[] = ['free', 'starter', 'professional', 'business', 'enterprise']
  return tierOrder.indexOf(tier) >= tierOrder.indexOf(minimumTier)
}

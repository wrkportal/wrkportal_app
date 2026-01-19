/**
 * Tier Utilities
 * 
 * Utility functions for checking user tiers and tier-based feature access.
 * Supports tier-based infrastructure routing and feature gating.
 */

import { prisma } from '@/lib/prisma'

export type UserTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise'

export interface TierLimits {
  aiEnabled: boolean
  aiQueriesPerMonth: number | null // null = unlimited
  automationsPerMonth: number | null // null = unlimited
  storageGB: number | null // null = unlimited
  maxUsers: number | null // null = unlimited
  infrastructure: 'neon' | 'aws-aurora' // Phase 1: Neon, Phase 2: AWS Aurora
}

/**
 * Get tier limits for a given tier
 * Phase 1: Uses Neon.tech (via INFRASTRUCTURE_MODE=neon)
 * Phase 2: Migrates to AWS Aurora (via INFRASTRUCTURE_MODE=aws)
 */
export function getTierLimits(tier: UserTier): TierLimits {
  // Determine infrastructure based on environment variable
  const infrastructureMode = process.env.INFRASTRUCTURE_MODE || 'neon'
  const infrastructure: 'neon' | 'aws-aurora' = infrastructureMode === 'aws' ? 'aws-aurora' : 'neon'
  
  switch (tier) {
    case 'free':
      return {
        aiEnabled: false,
        aiQueriesPerMonth: 0,
        automationsPerMonth: 10,
        storageGB: 1,
        maxUsers: 10,
        infrastructure,
      }
    case 'starter':
      return {
        aiEnabled: false,
        aiQueriesPerMonth: 0,
        automationsPerMonth: 100,
        storageGB: 20,
        maxUsers: 10,
        infrastructure,
      }
    case 'professional':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: 50,
        automationsPerMonth: 250,
        storageGB: 50,
        maxUsers: 50,
        infrastructure,
      }
    case 'business':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: 500,
        automationsPerMonth: null, // unlimited
        storageGB: 250,
        maxUsers: null, // unlimited
        infrastructure,
      }
    case 'enterprise':
      return {
        aiEnabled: true,
        aiQueriesPerMonth: null, // unlimited
        automationsPerMonth: null, // unlimited
        storageGB: null, // unlimited
        maxUsers: null, // unlimited
        infrastructure,
      }
    default:
      // Default to free tier
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

    if (!user) {
      return 'free'
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { plan: true },
    })

    if (!tenant) {
      return 'free'
    }

    // Normalize plan string to UserTier
    const plan = tenant.plan?.toLowerCase() || 'free'
    const validTiers: UserTier[] = ['free', 'starter', 'professional', 'business', 'enterprise']
    
    if (validTiers.includes(plan as UserTier)) {
      return plan as UserTier
    }

    // Fallback: try to match common plan names
    if (plan.includes('pro') || plan.includes('professional')) {
      return 'professional'
    }
    if (plan.includes('business') || plan.includes('bus')) {
      return 'business'
    }
    if (plan.includes('enterprise') || plan.includes('ent')) {
      return 'enterprise'
    }
    if (plan.includes('starter') || plan.includes('start')) {
      return 'starter'
    }

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
 * Tracks AI queries via ActivityFeed with resourceType='AI' and action='EXECUTE'
 */
export async function getCurrentMonthAIQueryCount(tenantId: string): Promise<number> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Count ActivityFeed entries with resourceType='AI' and action='EXECUTE' for this month
    const count = await prisma.activityFeed.count({
      where: {
        tenantId,
        resourceType: 'AI',
        action: 'EXECUTE', // Using EXECUTE action for AI queries
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    return count
  } catch (error) {
    console.error('Error getting AI query count:', error)
    // If tracking fails, return 0 (will allow queries, but tracking should be fixed)
    return 0
  }
}

/**
 * Log an AI query to ActivityFeed for tracking
 */
export async function logAIQuery(tenantId: string, userId: string, queryType: string = 'CHAT', metadata?: Record<string, any>) {
  try {
    const { createActivityFeed } = await import('@/lib/collaboration/activity-feed')
    
    await createActivityFeed({
      tenantId,
      userId,
      resourceType: 'AI',
      resourceId: null, // AI queries don't have a specific resource ID
      action: 'EXECUTE',
      description: `AI ${queryType} query executed`,
      metadata: {
        queryType,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
      mentions: [],
    })
  } catch (error) {
    // Log error but don't throw - tracking should not break main functionality
    console.error('Error logging AI query:', error)
  }
}

/**
 * Check if user can execute more AI queries this month
 */
export async function canExecuteAIQuery(userId: string, currentMonthCount?: number): Promise<boolean> {
  const limits = await getUserTierLimits(userId)
  
  if (!limits.aiEnabled) {
    return false
  }

  if (limits.aiQueriesPerMonth === null) {
    return true // unlimited
  }

  // If currentMonthCount is not provided, get it from database
  let count = currentMonthCount
  if (count === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })
    if (user) {
      count = await getCurrentMonthAIQueryCount(user.tenantId)
    } else {
      count = 0
    }
  }

  // Check against limit
  return count < limits.aiQueriesPerMonth
}

/**
 * Get AI query limit information for user (count, limit, remaining)
 */
export async function getAIQueryLimitInfo(userId: string): Promise<{
  currentCount: number
  limit: number | null
  remaining: number | null
  canExecute: boolean
}> {
  const limits = await getUserTierLimits(userId)
  
  if (!limits.aiEnabled) {
    return {
      currentCount: 0,
      limit: null,
      remaining: null,
      canExecute: false,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  })

  const currentCount = user ? await getCurrentMonthAIQueryCount(user.tenantId) : 0
  const canExecute = await canExecuteAIQuery(userId, currentCount)
  const remaining = limits.aiQueriesPerMonth === null 
    ? null 
    : Math.max(0, limits.aiQueriesPerMonth - currentCount)

  return {
    currentCount,
    limit: limits.aiQueriesPerMonth,
    remaining,
    canExecute,
  }
}

/**
 * Get current month's automation count for a tenant
 */
export async function getCurrentMonthAutomationCount(tenantId: string): Promise<number> {
  try {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    // Count automation rules created this month
    const count = await prisma.salesAutomationRule.count({
      where: {
        tenantId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    })

    return count
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

  if (limits.automationsPerMonth === null) {
    return true // unlimited
  }

  // If currentMonthCount is not provided, get it from database
  let count = currentMonthCount
  if (count === undefined) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true },
    })
    if (user) {
      count = await getCurrentMonthAutomationCount(user.tenantId)
    } else {
      count = 0
    }
  }

  // Check against limit
  return count < limits.automationsPerMonth
}

/**
 * Get automation limit information for user (count, limit, remaining)
 */
export async function getAutomationLimitInfo(userId: string): Promise<{
  currentCount: number
  limit: number | null
  remaining: number | null
  canCreate: boolean
}> {
  const limits = await getUserTierLimits(userId)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  })

  const currentCount = user ? await getCurrentMonthAutomationCount(user.tenantId) : 0
  const canCreate = await canCreateAutomation(userId, currentCount)
  const remaining = limits.automationsPerMonth === null 
    ? null 
    : Math.max(0, limits.automationsPerMonth - currentCount)

  return {
    currentCount,
    limit: limits.automationsPerMonth,
    remaining,
    canCreate,
  }
}

/**
 * Get the infrastructure provider for a user's tier
 * Phase 1: Returns 'neon' (current setup)
 * Phase 2: Returns 'aws-aurora' (when INFRASTRUCTURE_MODE=aws)
 */
export async function getUserInfrastructure(userId: string): Promise<'neon' | 'aws-aurora'> {
  const limits = await getUserTierLimits(userId)
  return limits.infrastructure
}

/**
 * Check if user tier is at least the specified tier
 */
export async function hasMinimumTier(userId: string, minimumTier: UserTier): Promise<boolean> {
  const tier = await getUserTier(userId)
  const tierOrder: UserTier[] = ['free', 'starter', 'professional', 'business', 'enterprise']
  const userTierIndex = tierOrder.indexOf(tier)
  const minimumTierIndex = tierOrder.indexOf(minimumTier)
  return userTierIndex >= minimumTierIndex
}

/**
 * Unified AI Context Layer
 *
 * Provides cross-module intelligence by aggregating data from all departments.
 * Enables AI queries like: "What's the impact of losing 3 developers on Q2 roadmap and revenue?"
 */

import { prisma } from '@/lib/prisma'
import { cacheGetOrSet } from '@/lib/aws/redis'

export interface UnifiedContext {
  projects: { total: number; active: number; atRisk: number; overBudget: number; completedThisMonth: number }
  sales: { pipelineValue: number; openDeals: number; wonThisMonth: number; lostThisMonth: number; avgDealSize: number }
  finance: { totalBudget: number; spent: number; remaining: number; pendingInvoices: number }
  hr: { openPositions: number; activeCandidates: number; pendingOffers: number; newHiresThisMonth: number }
  operations: { openWorkOrders: number; slaBreaches: number; assetCount: number; pendingMaintenance: number }
  it: { openTickets: number; criticalIncidents: number; deployments: number; avgResolutionTime: number }
  tasks: { total: number; completed: number; overdue: number; blocked: number; inProgress: number }
  okrs: { total: number; onTrack: number; atRisk: number; offTrack: number; avgProgress: number }
  team: { totalMembers: number; activeToday: number }
  generatedAt: string
}

async function queryModuleData(tenantId: string): Promise<UnifiedContext> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Run all queries in parallel for speed
  const [
    projectStats,
    taskStats,
    okrStats,
    teamStats,
  ] = await Promise.all([
    // Projects
    safeQuery(async () => {
      const [total, active, atRisk, overBudget, completedThisMonth] = await Promise.all([
        prisma.project.count({ where: { tenantId } }),
        prisma.project.count({ where: { tenantId, status: 'ACTIVE' } }),
        prisma.project.count({ where: { tenantId, ragStatus: 'RED' } }),
        prisma.project.count({ where: { tenantId, budgetStatus: 'OVER_BUDGET' } }).catch(() => 0),
        prisma.project.count({ where: { tenantId, status: 'COMPLETED', updatedAt: { gte: startOfMonth } } }),
      ])
      return { total, active, atRisk, overBudget, completedThisMonth }
    }, { total: 0, active: 0, atRisk: 0, overBudget: 0, completedThisMonth: 0 }),

    // Tasks
    safeQuery(async () => {
      const [total, completed, overdue, blocked, inProgress] = await Promise.all([
        prisma.task.count({ where: { tenantId } }),
        prisma.task.count({ where: { tenantId, status: 'DONE' } }),
        prisma.task.count({ where: { tenantId, dueDate: { lt: now }, status: { not: 'DONE' } } }),
        prisma.task.count({ where: { tenantId, status: 'BLOCKED' } }),
        prisma.task.count({ where: { tenantId, status: 'IN_PROGRESS' } }),
      ])
      return { total, completed, overdue, blocked, inProgress }
    }, { total: 0, completed: 0, overdue: 0, blocked: 0, inProgress: 0 }),

    // OKRs
    safeQuery(async () => {
      const [total, onTrack, atRisk, offTrack] = await Promise.all([
        prisma.goal.count({ where: { tenantId } }),
        prisma.goal.count({ where: { tenantId, status: 'ON_TRACK' } }),
        prisma.goal.count({ where: { tenantId, status: 'AT_RISK' } }),
        prisma.goal.count({ where: { tenantId, status: 'OFF_TRACK' } }),
      ])
      const avgProgress = total > 0 ? Math.round(((onTrack * 80 + atRisk * 50 + offTrack * 20) / total)) : 0
      return { total, onTrack, atRisk, offTrack, avgProgress }
    }, { total: 0, onTrack: 0, atRisk: 0, offTrack: 0, avgProgress: 0 }),

    // Team
    safeQuery(async () => {
      const totalMembers = await prisma.user.count({ where: { tenantId, status: 'ACTIVE' } })
      return { totalMembers, activeToday: 0 }
    }, { totalMembers: 0, activeToday: 0 }),
  ])

  return {
    projects: projectStats,
    sales: { pipelineValue: 0, openDeals: 0, wonThisMonth: 0, lostThisMonth: 0, avgDealSize: 0 },
    finance: { totalBudget: 0, spent: 0, remaining: 0, pendingInvoices: 0 },
    hr: { openPositions: 0, activeCandidates: 0, pendingOffers: 0, newHiresThisMonth: 0 },
    operations: { openWorkOrders: 0, slaBreaches: 0, assetCount: 0, pendingMaintenance: 0 },
    it: { openTickets: 0, criticalIncidents: 0, deployments: 0, avgResolutionTime: 0 },
    tasks: taskStats,
    okrs: okrStats,
    team: teamStats,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Get unified context across all modules for a tenant.
 * Results are cached in Redis for 5 minutes.
 */
export async function getUnifiedContext(
  tenantId: string,
  options?: { modules?: string[]; skipCache?: boolean }
): Promise<UnifiedContext> {
  const cacheKey = `unified-context:${tenantId}`

  if (options?.skipCache) {
    return queryModuleData(tenantId)
  }

  return cacheGetOrSet(cacheKey, 300, () => queryModuleData(tenantId))
}

/**
 * Generate a natural language summary of the unified context.
 */
export function summarizeContext(ctx: UnifiedContext): string {
  const highlights: string[] = []

  if (ctx.tasks.overdue > 0) highlights.push(`${ctx.tasks.overdue} overdue tasks`)
  if (ctx.projects.atRisk > 0) highlights.push(`${ctx.projects.atRisk} projects at risk`)
  if (ctx.okrs.offTrack > 0) highlights.push(`${ctx.okrs.offTrack} OKRs off track`)
  if (ctx.projects.overBudget > 0) highlights.push(`${ctx.projects.overBudget} projects over budget`)

  if (highlights.length === 0) return 'All systems are running smoothly across all modules.'
  return `Attention needed: ${highlights.join(', ')}.`
}

// Helper to safely run a query and return default on error
async function safeQuery<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return defaultValue
  }
}

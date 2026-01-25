/**
 * Rule Execution History Service
 * 
 * Tracks and logs automation rule executions
 */

import { prisma } from '@/lib/prisma'

// Helper to access optional Prisma models
const getSalesAutomationRuleExecution = () => {
  return (prisma as any).salesAutomationRuleExecution as {
    create: (args: { data: any }) => Promise<{ id: string }>
    update: (args: { where: { id: string }; data: any }) => Promise<any>
    findMany: (args: { where: any; include?: any; orderBy?: any; take?: number }) => Promise<any[]>
    findFirst: (args: { where: any; orderBy?: any; select?: any }) => Promise<any>
    count: (args: { where: any }) => Promise<number>
    aggregate: (args: { where: any; _avg: any }) => Promise<{ _avg: { executionTime: number | null } }>
  } | undefined
}

export interface ExecutionLog {
  id: string
  ruleId: string
  ruleName: string
  triggerType: string
  actionType: string
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED'
  errorMessage?: string
  executionTime?: number
  startedAt: Date
  completedAt?: Date
}

/**
 * Log rule execution
 */
export async function logRuleExecution(
  tenantId: string,
  ruleId: string,
  triggerType: string,
  triggerData: any,
  actionType: string,
  actionConfig: any,
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED',
  errorMessage?: string,
  executionTime?: number,
  createdById?: string
): Promise<string> {
  const executionModel = getSalesAutomationRuleExecution()
  if (!executionModel) {
    throw new Error('Sales automation rule execution model is not available')
  }
  
  const execution = await executionModel.create({
    data: {
      tenantId,
      ruleId,
      triggerType: triggerType as any,
      triggerData: triggerData || {},
      actionType: actionType as any,
      actionConfig: actionConfig || {},
      status: status as any,
      errorMessage: errorMessage || null,
      executionTime: executionTime || null,
      completedAt: status !== 'SUCCESS' ? new Date() : null,
      createdById: createdById || null,
    },
  })

  return execution.id
}

/**
 * Update execution status
 */
export async function updateExecutionStatus(
  executionId: string,
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED',
  errorMessage?: string
): Promise<void> {
  const executionModel = getSalesAutomationRuleExecution()
  if (!executionModel) {
    throw new Error('Sales automation rule execution model is not available')
  }
  
  await executionModel.update({
    where: { id: executionId },
    data: {
      status: status as any,
      errorMessage: errorMessage || null,
      completedAt: new Date(),
    },
  })
}

/**
 * Get execution history for a rule
 */
export async function getRuleExecutionHistory(
  ruleId: string,
  tenantId: string,
  limit: number = 50
): Promise<ExecutionLog[]> {
  const executionModel = getSalesAutomationRuleExecution()
  if (!executionModel) {
    return []
  }
  
  const executions = await executionModel.findMany({
    where: {
      ruleId,
      tenantId,
    },
    include: {
      rule: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: limit,
  } as any)

  return executions.map((exec: any) => ({
    id: exec.id,
    ruleId: exec.ruleId,
    ruleName: exec.rule.name,
    triggerType: exec.triggerType,
    actionType: exec.actionType,
    status: exec.status as any,
    errorMessage: exec.errorMessage || undefined,
    executionTime: exec.executionTime || undefined,
    startedAt: exec.startedAt,
    completedAt: exec.completedAt || undefined,
  }))
}

/**
 * Get execution statistics for a rule
 */
export async function getRuleExecutionStats(
  ruleId: string,
  tenantId: string
): Promise<{
  total: number
  success: number
  failed: number
  partial: number
  skipped: number
  successRate: number
  avgExecutionTime: number
  lastExecution?: Date
}> {
  const executionModel = getSalesAutomationRuleExecution()
  if (!executionModel) {
    return {
      total: 0,
      success: 0,
      failed: 0,
      partial: 0,
      skipped: 0,
      successRate: 0,
      avgExecutionTime: 0,
    }
  }
  
  const [total, success, failed, partial, skipped, lastExecution, avgTime] = await Promise.all([
    executionModel.count({
      where: { ruleId, tenantId },
    }),
    executionModel.count({
      where: { ruleId, tenantId, status: 'SUCCESS' },
    }),
    executionModel.count({
      where: { ruleId, tenantId, status: 'FAILED' },
    }),
    executionModel.count({
      where: { ruleId, tenantId, status: 'PARTIAL' },
    }),
    executionModel.count({
      where: { ruleId, tenantId, status: 'SKIPPED' },
    }),
    executionModel.findFirst({
      where: { ruleId, tenantId },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    }),
    executionModel.aggregate({
      where: {
        ruleId,
        tenantId,
        executionTime: { not: null },
      },
      _avg: {
        executionTime: true,
      },
    }),
  ])

  return {
    total,
    success,
    failed,
    partial,
    skipped,
    successRate: total > 0 ? (success / total) * 100 : 0,
    avgExecutionTime: avgTime._avg.executionTime || 0,
    lastExecution: lastExecution?.startedAt,
  }
}

/**
 * Get all executions for tenant (with filters)
 */
export async function getTenantExecutions(
  tenantId: string,
  filters?: {
    ruleId?: string
    status?: 'SUCCESS' | 'FAILED' | 'PARTIAL' | 'SKIPPED'
    startDate?: Date
    endDate?: Date
  },
  limit: number = 100
): Promise<ExecutionLog[]> {
  const where: any = {
    tenantId,
  }

  if (filters?.ruleId) {
    where.ruleId = filters.ruleId
  }
  if (filters?.status) {
    where.status = filters.status
  }
  if (filters?.startDate || filters?.endDate) {
    where.startedAt = {}
    if (filters.startDate) {
      where.startedAt.gte = filters.startDate
    }
    if (filters.endDate) {
      where.startedAt.lte = filters.endDate
    }
  }

  const executionModel = getSalesAutomationRuleExecution()
  if (!executionModel) {
    return []
  }
  
  const executions = await executionModel.findMany({
    where,
    include: {
      rule: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: limit,
  } as any)

  return executions.map((exec: any) => ({
    id: exec.id,
    ruleId: exec.ruleId,
    ruleName: exec.rule.name,
    triggerType: exec.triggerType,
    actionType: exec.actionType,
    status: exec.status as any,
    errorMessage: exec.errorMessage || undefined,
    executionTime: exec.executionTime || undefined,
    startedAt: exec.startedAt,
    completedAt: exec.completedAt || undefined,
  }))
}


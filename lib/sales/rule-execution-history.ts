/**
 * Rule Execution History Service
 * 
 * Tracks and logs automation rule executions
 */

import { prisma } from '@/lib/prisma'

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
  const execution = await prisma.salesAutomationRuleExecution.create({
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
  await prisma.salesAutomationRuleExecution.update({
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
  const executions = await prisma.salesAutomationRuleExecution.findMany({
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
  })

  return executions.map(exec => ({
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
  const [total, success, failed, partial, skipped, lastExecution, avgTime] = await Promise.all([
    prisma.salesAutomationRuleExecution.count({
      where: { ruleId, tenantId },
    }),
    prisma.salesAutomationRuleExecution.count({
      where: { ruleId, tenantId, status: 'SUCCESS' },
    }),
    prisma.salesAutomationRuleExecution.count({
      where: { ruleId, tenantId, status: 'FAILED' },
    }),
    prisma.salesAutomationRuleExecution.count({
      where: { ruleId, tenantId, status: 'PARTIAL' },
    }),
    prisma.salesAutomationRuleExecution.count({
      where: { ruleId, tenantId, status: 'SKIPPED' },
    }),
    prisma.salesAutomationRuleExecution.findFirst({
      where: { ruleId, tenantId },
      orderBy: { startedAt: 'desc' },
      select: { startedAt: true },
    }),
    prisma.salesAutomationRuleExecution.aggregate({
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

  const executions = await prisma.salesAutomationRuleExecution.findMany({
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
  })

  return executions.map(exec => ({
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


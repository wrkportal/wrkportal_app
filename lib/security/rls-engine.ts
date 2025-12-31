/**
 * Phase 4.2: Row-Level Security (RLS) Engine
 * 
 * This engine evaluates RLS rules and applies them to queries
 */

import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface RLSEvaluationContext {
  userId: string
  tenantId: string
  orgUnitId?: string | null
  role: UserRole
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  resource: string
  // Additional context for rule evaluation
  contextData?: Record<string, any>
}

export interface RLSRuleExpression {
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains' | 'not_contains' | 
            'greater_than' | 'less_than' | 'greater_or_equal' | 'less_or_equal' |
            'and' | 'or' | 'not' | 'is_null' | 'is_not_null' | 'custom'
  field: string
  value?: any
  children?: RLSRuleExpression[]
  customFunction?: string
}

export interface RLSFilter {
  where: any
  select?: any
  include?: any
}

/**
 * Get applicable RLS rules for a context
 */
export async function getApplicableRLSRules(
  context: RLSEvaluationContext
): Promise<any[]> {
  const { userId, tenantId, orgUnitId, role, action, resource } = context

  // Get rules that apply to this context
  const rules = await prisma.rowLevelSecurityRule.findMany({
    where: {
      tenantId,
      resource,
      isActive: true,
      appliesTo: {
        has: action,
      },
      OR: [
        { userId },
        { orgUnitId: orgUnitId || null },
        { role },
        { userId: null, orgUnitId: null, role: null }, // Global rules
      ],
    },
    orderBy: {
      priority: 'asc', // Lower priority number = higher priority
    },
    include: {
      orgUnit: {
        select: {
          id: true,
          name: true,
          parentId: true,
        },
      },
    },
  })

  // Filter out inherited rules if inheritance is disabled
  const applicableRules = rules.filter(rule => {
    if (rule.userId === userId) return true
    if (rule.orgUnitId === orgUnitId) return true
    if (rule.role === role && !rule.userId && !rule.orgUnitId) return true
    
    // Check inheritance for org unit rules
    if (rule.orgUnitId && orgUnitId && rule.inheritance) {
      // Check if org unit is a descendant of rule's org unit
      // This is a simplified check - in production, you'd traverse the hierarchy
      return true // Simplified for now
    }
    
    return false
  })

  return applicableRules
}

/**
 * Evaluate a single RLS rule expression
 */
export function evaluateRuleExpression(
  expression: RLSRuleExpression,
  rowData: Record<string, any>,
  context: RLSEvaluationContext
): boolean {
  const { operator, field, value, children, customFunction } = expression

  // Resolve dynamic values (e.g., "${userId}", "${orgUnitId}")
  const resolvedValue = resolveDynamicValue(value, context)
  const fieldValue = rowData[field]

  switch (operator) {
    case 'equals':
      return fieldValue === resolvedValue

    case 'not_equals':
      return fieldValue !== resolvedValue

    case 'in':
      return Array.isArray(resolvedValue) && resolvedValue.includes(fieldValue)

    case 'not_in':
      return Array.isArray(resolvedValue) && !resolvedValue.includes(fieldValue)

    case 'contains':
      return String(fieldValue || '').includes(String(resolvedValue || ''))

    case 'not_contains':
      return !String(fieldValue || '').includes(String(resolvedValue || ''))

    case 'greater_than':
      return Number(fieldValue) > Number(resolvedValue)

    case 'less_than':
      return Number(fieldValue) < Number(resolvedValue)

    case 'greater_or_equal':
      return Number(fieldValue) >= Number(resolvedValue)

    case 'less_or_equal':
      return Number(fieldValue) <= Number(resolvedValue)

    case 'is_null':
      return fieldValue === null || fieldValue === undefined

    case 'is_not_null':
      return fieldValue !== null && fieldValue !== undefined

    case 'and':
      if (!children || children.length === 0) return true
      return children.every(child => evaluateRuleExpression(child, rowData, context))

    case 'or':
      if (!children || children.length === 0) return false
      return children.some(child => evaluateRuleExpression(child, rowData, context))

    case 'not':
      if (!children || children.length === 0) return false
      return !evaluateRuleExpression(children[0], rowData, context)

    case 'custom':
      if (customFunction) {
        // Evaluate custom function (should be sandboxed in production)
        try {
          // In production, use a sandboxed evaluation mechanism
          const func = new Function('rowData', 'context', customFunction)
          return func(rowData, context)
        } catch (error) {
          console.error('Error evaluating custom function:', error)
          return false
        }
      }
      return false

    default:
      console.warn(`Unknown operator: ${operator}`)
      return false
  }
}

/**
 * Resolve dynamic values in rule expressions (e.g., "${userId}", "${orgUnitId}")
 */
function resolveDynamicValue(value: any, context: RLSEvaluationContext): any {
  if (typeof value === 'string') {
    // Replace placeholders like ${userId}, ${orgUnitId}, etc.
    return value.replace(/\$\{(\w+)\}/g, (match, key) => {
      switch (key) {
        case 'userId':
          return context.userId
        case 'orgUnitId':
          return context.orgUnitId || ''
        case 'role':
          return context.role
        case 'tenantId':
          return context.tenantId
        default:
          // Check contextData
          return context.contextData?.[key] || match
      }
    })
  }
  
  if (Array.isArray(value)) {
    return value.map(v => resolveDynamicValue(v, context))
  }
  
  if (typeof value === 'object' && value !== null) {
    const resolved: any = {}
    for (const [k, v] of Object.entries(value)) {
      resolved[k] = resolveDynamicValue(v, context)
    }
    return resolved
  }
  
  return value
}

/**
 * Build Prisma where clause from RLS rules
 */
export async function buildRLSFilter(
  context: RLSEvaluationContext
): Promise<RLSFilter> {
  const rules = await getApplicableRLSRules(context)

  if (rules.length === 0) {
    // No rules = no restrictions (subject to other permissions)
    return { where: {} }
  }

  // Combine rules with OR (user can access if ANY rule allows)
  // Rules are combined as: (rule1) OR (rule2) OR ...
  const ruleConditions = rules.map(rule => {
    const expression = rule.ruleExpression as RLSRuleExpression
    return buildPrismaCondition(expression, context)
  })

  if (ruleConditions.length === 1) {
    return { where: ruleConditions[0] }
  }

  // Combine with OR
  return {
    where: {
      OR: ruleConditions,
    },
  }
}

/**
 * Convert RLS rule expression to Prisma where condition
 */
function buildPrismaCondition(
  expression: RLSRuleExpression,
  context: RLSEvaluationContext
): any {
  const { operator, field, value, children } = expression
  const resolvedValue = resolveDynamicValue(value, context)

  switch (operator) {
    case 'equals':
      return { [field]: resolvedValue }

    case 'not_equals':
      return { [field]: { not: resolvedValue } }

    case 'in':
      return { [field]: { in: resolvedValue } }

    case 'not_in':
      return { [field]: { notIn: resolvedValue } }

    case 'contains':
      return { [field]: { contains: resolvedValue, mode: 'insensitive' } }

    case 'not_contains':
      return { [field]: { not: { contains: resolvedValue, mode: 'insensitive' } } }

    case 'greater_than':
      return { [field]: { gt: resolvedValue } }

    case 'less_than':
      return { [field]: { lt: resolvedValue } }

    case 'greater_or_equal':
      return { [field]: { gte: resolvedValue } }

    case 'less_or_equal':
      return { [field]: { lte: resolvedValue } }

    case 'is_null':
      return { [field]: null }

    case 'is_not_null':
      return { [field]: { not: null } }

    case 'and':
      if (!children || children.length === 0) return {}
      const andConditions = children.map(child => buildPrismaCondition(child, context))
      return { AND: andConditions }

    case 'or':
      if (!children || children.length === 0) return {}
      const orConditions = children.map(child => buildPrismaCondition(child, context))
      return { OR: orConditions }

    case 'not':
      if (!children || children.length === 0) return {}
      const notCondition = buildPrismaCondition(children[0], context)
      return { NOT: notCondition }

    default:
      return {}
  }
}

/**
 * Check if a row passes RLS rules (for post-query filtering)
 */
export async function checkRowAccess(
  rowData: Record<string, any>,
  context: RLSEvaluationContext
): Promise<boolean> {
  const rules = await getApplicableRLSRules(context)

  if (rules.length === 0) {
    // No rules = access granted (subject to other permissions)
    return true
  }

  // Row must pass at least one rule
  for (const rule of rules) {
    const expression = rule.ruleExpression as RLSRuleExpression
    if (evaluateRuleExpression(expression, rowData, context)) {
      return true
    }
  }

  return false
}

/**
 * Apply RLS filtering to query results
 */
export async function applyRLSToResults<T extends Record<string, any>>(
  results: T[],
  context: RLSEvaluationContext
): Promise<T[]> {
  const filteredResults: T[] = []

  for (const row of results) {
    if (await checkRowAccess(row, context)) {
      filteredResults.push(row)
    }
  }

  return filteredResults
}

/**
 * Get RLS cache key
 */
export function getRLSCacheKey(context: RLSEvaluationContext, ruleId: string): string {
  return `${context.tenantId}:${context.userId}:${context.resource}:${context.action}:${ruleId}`
}

/**
 * Check RLS cache
 */
export async function getCachedRLSResult(
  cacheKey: string
): Promise<any | null> {
  const entry = await prisma.rLSCacheEntry.findUnique({
    where: { cacheKey },
  })

  if (!entry) return null

  if (entry.expiresAt < new Date()) {
    // Expired, delete it
    await prisma.rLSCacheEntry.delete({
      where: { id: entry.id },
    })
    return null
  }

  return entry.evaluationResult as any
}

/**
 * Cache RLS result
 */
export async function cacheRLSResult(
  cacheKey: string,
  context: RLSEvaluationContext,
  ruleId: string,
  result: any,
  ttlSeconds: number = 3600 // Default 1 hour
): Promise<void> {
  await prisma.rLSCacheEntry.upsert({
    where: { cacheKey },
    create: {
      tenantId: context.tenantId,
      userId: context.userId,
      resource: context.resource,
      ruleId,
      cacheKey,
      evaluationResult: result,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
    update: {
      evaluationResult: result,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    },
  })
}


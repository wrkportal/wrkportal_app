/**
 * Phase 4.2: Column-Level Security Engine
 * 
 * This engine handles column-level security and data masking
 */

import { prisma } from '@/lib/prisma'
import { UserRole, ColumnSecurityAction, MaskingType } from '@prisma/client'

export interface ColumnSecurityContext {
  userId: string
  tenantId: string
  orgUnitId?: string | null
  role: UserRole
  resource: string
}

export interface MaskingConfig {
  type: MaskingType
  showFirst?: number // For partial masking
  showLast?: number  // For partial masking
  maskChar?: string  // Character to use for masking
  hashAlgorithm?: string // For hash masking
  customMask?: (value: any) => any // Custom masking function
}

/**
 * Get applicable column security rules
 */
export async function getApplicableColumnRules(
  context: ColumnSecurityContext
): Promise<any[]> {
  const { userId, tenantId, orgUnitId, role, resource } = context

  const rules = await prisma.columnLevelSecurityRule.findMany({
    where: {
      tenantId,
      resource,
      isActive: true,
      OR: [
        { userId },
        { orgUnitId: orgUnitId || null },
        { role },
        { userId: null, orgUnitId: null, role: null }, // Global rules
      ],
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

  // Apply inheritance and priority (user > org unit > role > global)
  const prioritizedRules: any[] = []
  
  // Add user-specific rules first (highest priority)
  prioritizedRules.push(...rules.filter(r => r.userId === userId))
  
  // Add org unit rules
  prioritizedRules.push(...rules.filter(r => r.orgUnitId === orgUnitId && !r.userId))
  
  // Add role rules
  prioritizedRules.push(...rules.filter(r => r.role === role && !r.userId && !r.orgUnitId))
  
  // Add global rules last
  prioritizedRules.push(...rules.filter(r => !r.userId && !r.orgUnitId && !r.role))

  // Deduplicate by column (keep first occurrence = highest priority)
  const uniqueRules = new Map<string, any>()
  for (const rule of prioritizedRules) {
    if (!uniqueRules.has(rule.column)) {
      uniqueRules.set(rule.column, rule)
    }
  }

  return Array.from(uniqueRules.values())
}

/**
 * Apply column security to a data object
 */
export async function applyColumnSecurity<T extends Record<string, any>>(
  data: T,
  context: ColumnSecurityContext
): Promise<T> {
  const rules = await getApplicableColumnRules(context)

  if (rules.length === 0) {
    return data
  }

  const securedData = { ...data }

  for (const rule of rules) {
    const column = rule.column

    if (!(column in securedData)) {
      continue
    }

    switch (rule.action) {
      case ColumnSecurityAction.HIDE:
        // Remove column from result
        delete securedData[column]
        break

      case ColumnSecurityAction.MASK:
        // Mask the value
        securedData[column] = maskValue(
          securedData[column],
          rule.maskingType || MaskingType.FULL,
          rule.maskingConfig as any
        )
        break

      case ColumnSecurityAction.PARTIAL_MASK:
        // Partial masking
        securedData[column] = maskValue(
          securedData[column],
          MaskingType.PARTIAL,
          rule.maskingConfig as any
        )
        break

      case ColumnSecurityAction.READ_ONLY:
        // Column remains visible but should be marked as read-only
        // This is handled at the UI level, not here
        break
    }
  }

  return securedData
}

/**
 * Apply column security to an array of data objects
 */
export async function applyColumnSecurityToArray<T extends Record<string, any>>(
  dataArray: T[],
  context: ColumnSecurityContext
): Promise<T[]> {
  return Promise.all(
    dataArray.map(item => applyColumnSecurity(item, context))
  )
}

/**
 * Build Prisma select clause to exclude hidden columns
 */
export async function buildColumnSelectClause(
  context: ColumnSecurityContext,
  allColumns: string[]
): Promise<Record<string, boolean> | undefined> {
  const rules = await getApplicableColumnRules(context)

  const hiddenColumns = new Set(
    rules
      .filter(r => r.action === ColumnSecurityAction.HIDE)
      .map(r => r.column)
  )

  if (hiddenColumns.size === 0) {
    return undefined // No restrictions
  }

  const select: Record<string, boolean> = {}
  for (const column of allColumns) {
    if (!hiddenColumns.has(column)) {
      select[column] = true
    }
  }

  return select
}

/**
 * Mask a value based on masking type and config
 */
export function maskValue(
  value: any,
  maskingType: MaskingType,
  config?: MaskingConfig
): any {
  if (value === null || value === undefined) {
    return value
  }

  const stringValue = String(value)

  switch (maskingType) {
    case MaskingType.FULL:
      return '***'

    case MaskingType.PARTIAL:
      const showFirst = config?.showFirst || 3
      const showLast = config?.showLast || 4
      const maskChar = config?.maskChar || '*'

      if (stringValue.length <= showFirst + showLast) {
        // Value too short, just mask all
        return maskChar.repeat(stringValue.length)
      }

      const first = stringValue.substring(0, showFirst)
      const last = stringValue.substring(stringValue.length - showLast)
      const middle = maskChar.repeat(stringValue.length - showFirst - showLast)

      return `${first}${middle}${last}`

    case MaskingType.HASH:
      // Simple hash (in production, use a proper hashing library)
      let hash = 0
      for (let i = 0; i < stringValue.length; i++) {
        const char = stringValue.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32-bit integer
      }
      return `hash_${Math.abs(hash).toString(16)}`

    case MaskingType.REDACT:
      // Redact sensitive patterns (e.g., email, phone, SSN)
      let redacted = stringValue
      
      // Email
      redacted = redacted.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***@***.***')
      
      // Phone (US format)
      redacted = redacted.replace(/\d{3}-\d{3}-\d{4}/g, '***-***-****')
      redacted = redacted.replace(/\(\d{3}\)\s*\d{3}-\d{4}/g, '(***) ***-****')
      
      // SSN
      redacted = redacted.replace(/\d{3}-\d{2}-\d{4}/g, '***-**-****')
      
      return redacted

    case MaskingType.CUSTOM:
      if (config?.customMask) {
        return config.customMask(value)
      }
      return '***'

    default:
      return '***'
  }
}

/**
 * Check if a column should be hidden
 */
export async function isColumnHidden(
  column: string,
  context: ColumnSecurityContext
): Promise<boolean> {
  const rules = await getApplicableColumnRules(context)
  return rules.some(
    r => r.column === column && r.action === ColumnSecurityAction.HIDE
  )
}

/**
 * Check if a column should be read-only
 */
export async function isColumnReadOnly(
  column: string,
  context: ColumnSecurityContext
): Promise<boolean> {
  const rules = await getApplicableColumnRules(context)
  return rules.some(
    r => r.column === column && r.action === ColumnSecurityAction.READ_ONLY
  )
}


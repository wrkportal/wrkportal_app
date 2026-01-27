/**
 * Phase 4: Multi-Level Access Control - Permission Checker
 * 
 * This library provides utilities for checking permissions at multiple levels:
 * - Organization-level permissions
 * - Function-level permissions
 * - Role-based permissions
 * - Permission inheritance
 */

import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface PermissionCheckOptions {
  userId: string
  tenantId: string
  orgUnitId?: string | null
  role: UserRole
  resource?: string
  action?: string
  function?: string
  resourceId?: string
}

export interface PermissionResult {
  allowed: boolean
  reason?: string
  source?: 'role' | 'user' | 'org_unit' | 'inherited' | 'function'
}

/**
 * Check if user has permission for a resource and action
 */
export async function checkResourcePermission(
  options: PermissionCheckOptions
): Promise<PermissionResult> {
  const { userId, tenantId, orgUnitId, role, resource, action } = options

  if (!resource || !action) {
    return { allowed: false, reason: 'Resource and action are required' }
  }

  // Check if OrganizationPermission model exists in Prisma client
  if (!prisma.organizationPermission) {
    // Fall back to default role permissions
    const defaultRolePermissions = getDefaultRolePermissions(role)
    if (defaultRolePermissions[resource]?.includes(action) || defaultRolePermissions['*']?.includes(action)) {
      return {
        allowed: true,
        source: 'role',
      }
    }
    return {
      allowed: false,
      reason: `User does not have ${action} permission on ${resource}`,
    }
  }

  // Check user-specific permissions first (most specific)
  let userPermission = null
  try {
    userPermission = await prisma.organizationPermission.findFirst({
      where: {
        tenantId,
        userId,
        resource,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
  } catch (error: any) {
    // If table doesn't exist, fall back to default role permissions
    if (error.code === 'P2001' || 
        error.code === 'P2021' || 
        error.code === 'P2022' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('Unknown model') ||
        error.message?.includes('column')) {
      console.warn('OrganizationPermission table not found, using default role permissions')
      const defaultRolePermissions = getDefaultRolePermissions(role)
      if (defaultRolePermissions[resource]?.includes(action) || defaultRolePermissions['*']?.includes(action)) {
        return {
          allowed: true,
          source: 'role',
        }
      }
      return {
        allowed: false,
        reason: `User does not have ${action} permission on ${resource}`,
      }
    }
    throw error
  }

  if (userPermission && userPermission.actions.includes(action)) {
    return {
      allowed: true,
      source: 'user',
    }
  }

  // Check org unit permissions
  if (orgUnitId && prisma.organizationPermission) {
    let orgPermission = null
    try {
      orgPermission = await prisma.organizationPermission.findFirst({
        where: {
          tenantId,
          orgUnitId,
          resource,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })
    } catch (error: any) {
      // If table doesn't exist, skip org unit check
      if (error.code === 'P2001' || 
          error.code === 'P2021' || 
          error.code === 'P2022' || 
          error.message?.includes('does not exist') || 
          error.message?.includes('Unknown model') ||
          error.message?.includes('column')) {
        console.warn('OrganizationPermission table not found, skipping org unit check')
      } else {
        throw error
      }
    }

    if (orgPermission && orgPermission.actions.includes(action)) {
      return {
        allowed: true,
        source: 'org_unit',
      }
    }

    // Check inherited permissions from parent org units
    const inheritedPermission = await checkInheritedPermissions(
      tenantId,
      orgUnitId,
      resource,
      action
    )

    if (inheritedPermission.allowed) {
      return {
        allowed: true,
        source: 'inherited',
      }
    }
  }

  // Check role-based permissions
  let rolePermission = null
  try {
    // Always try to query, even if model might not exist in database
    if (prisma.organizationPermission) {
      rolePermission = await prisma.organizationPermission.findFirst({
        where: {
          tenantId,
          role,
          userId: null,
          orgUnitId: null,
          resource,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })
    }
  } catch (error: any) {
    // If table doesn't exist, fall back to default role permissions
    if (error.code === 'P2001' || 
        error.code === 'P2021' || 
        error.code === 'P2022' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('Unknown model') ||
        error.message?.includes('column')) {
      console.warn('OrganizationPermission table not found, using default role permissions')
      const defaultRolePermissions = getDefaultRolePermissions(role)
      if (defaultRolePermissions[resource]?.includes(action) || defaultRolePermissions['*']?.includes(action)) {
        return {
          allowed: true,
          source: 'role',
        }
      }
      return {
        allowed: false,
        reason: `User does not have ${action} permission on ${resource}`,
      }
    }
    throw error
  }

  if (rolePermission && rolePermission.actions.includes(action)) {
    return {
      allowed: true,
      source: 'role',
    }
  }

  // Default: check role-based permissions from authStore (fallback)
  const defaultRolePermissions = getDefaultRolePermissions(role)
  
  // Check wildcard permissions first (most permissive)
  if (defaultRolePermissions['*']?.includes(action)) {
    return {
      allowed: true,
      source: 'role',
    }
  }
  
  // Then check specific resource permissions
  if (defaultRolePermissions[resource]?.includes(action)) {
    return {
      allowed: true,
      source: 'role',
    }
  }

  return {
    allowed: false,
    reason: `User does not have ${action} permission on ${resource}`,
  }
}

/**
 * Check if user has permission for a specific function
 */
export async function checkFunctionPermission(
  options: PermissionCheckOptions
): Promise<PermissionResult> {
  const { userId, tenantId, orgUnitId, role, function: func } = options

  if (!func) {
    return { allowed: false, reason: 'Function is required' }
  }

  // Check if FunctionPermission model exists
  if (!prisma.functionPermission) {
    return {
      allowed: false,
      reason: `Function ${func} is not allowed`,
      source: 'function',
    }
  }

  // Check user-specific function permissions
  let userFunctionPerm = null
  try {
    userFunctionPerm = await prisma.functionPermission.findFirst({
      where: {
        tenantId,
        userId,
        function: func,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
  } catch (error: any) {
    // If table doesn't exist, deny by default
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      console.warn('FunctionPermission table not found, denying function access')
      return {
        allowed: false,
        reason: `Function ${func} is not allowed`,
        source: 'function',
      }
    }
    throw error
  }

  if (userFunctionPerm) {
    return {
      allowed: userFunctionPerm.allowed,
      source: userFunctionPerm.allowed ? 'user' : undefined,
      reason: userFunctionPerm.allowed ? undefined : 'Function permission denied',
    }
  }

  // Check org unit function permissions
  if (orgUnitId && prisma.functionPermission) {
    let orgFunctionPerm = null
    try {
      orgFunctionPerm = await prisma.functionPermission.findFirst({
        where: {
          tenantId,
          orgUnitId,
          function: func,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })
    } catch (error: any) {
      // If table doesn't exist, skip org unit check
      if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
        console.warn('FunctionPermission table not found, skipping org unit check')
      } else {
        throw error
      }
    }

    if (orgFunctionPerm) {
      return {
        allowed: orgFunctionPerm.allowed,
        source: orgFunctionPerm.allowed ? 'org_unit' : undefined,
        reason: orgFunctionPerm.allowed ? undefined : 'Org unit function permission denied',
      }
    }
  }

  // Check role-based function permissions
  let roleFunctionPerm = null
  if (prisma.functionPermission) {
    try {
      roleFunctionPerm = await prisma.functionPermission.findFirst({
        where: {
          tenantId,
          role,
          userId: null,
          orgUnitId: null,
          function: func,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      })
    } catch (error: any) {
      // If table doesn't exist, deny by default
      if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
        console.warn('FunctionPermission table not found, denying function access')
        return {
          allowed: false,
          reason: `Function ${func} is not allowed`,
          source: 'function',
        }
      }
      throw error
    }
  }

  if (roleFunctionPerm) {
    return {
      allowed: roleFunctionPerm.allowed,
      source: roleFunctionPerm.allowed ? 'role' : undefined,
      reason: roleFunctionPerm.allowed ? undefined : 'Role function permission denied',
    }
  }

  // Default: deny if no explicit permission found
  return {
    allowed: false,
    reason: `Function ${func} is not allowed`,
    source: 'function',
  }
}

/**
 * Check inherited permissions from parent org units
 */
async function checkInheritedPermissions(
  tenantId: string,
  orgUnitId: string,
  resource: string,
  action: string
): Promise<PermissionResult> {
  if (!prisma.organizationPermission) {
    return { allowed: false }
  }

  // Get parent org units recursively
  const orgUnit = await prisma.orgUnit.findUnique({
    where: { id: orgUnitId },
    include: {
      parent: true,
    },
  })

  if (!orgUnit || !orgUnit.parentId) {
    return { allowed: false }
  }

  // Check parent permission
  const parentPermission = await prisma.organizationPermission.findFirst({
    where: {
      tenantId,
      orgUnitId: orgUnit.parentId,
      resource,
      inheritance: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  })

  if (parentPermission && parentPermission.actions.includes(action)) {
    return {
      allowed: true,
      source: 'inherited',
    }
  }

  // Recursively check grandparent
  return checkInheritedPermissions(tenantId, orgUnit.parentId, resource, action)
}

/**
 * Get default role permissions (fallback to authStore logic)
 */
function getDefaultRolePermissions(
  role: UserRole
): Record<string, string[]> {
  const defaultPermissions: Record<UserRole, Record<string, string[]>> = {
    TENANT_SUPER_ADMIN: {
      '*': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE'],
      integrations: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'CONFIGURE'],
      transformations: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      templates: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    },
    ORG_ADMIN: {
      users: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      teams: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      projects: ['READ', 'CREATE', 'UPDATE'],
      settings: ['READ', 'CONFIGURE'],
      integrations: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'CONFIGURE'],
      grids: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      transformations: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      templates: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    },
    PMO_LEAD: {
      portfolios: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
      programs: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'],
      projects: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
      reports: ['READ', 'CREATE', 'EXPORT'],
      gates: ['READ', 'APPROVE'],
    },
    PROJECT_MANAGER: {
      projects: ['READ', 'CREATE', 'UPDATE'],
      tasks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      risks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      issues: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      changes: ['READ', 'CREATE', 'UPDATE'],
      resources: ['READ'],
      reports: ['READ', 'CREATE', 'EXPORT'],
    },
    TEAM_MEMBER: {
      projects: ['READ'],
      tasks: ['READ', 'UPDATE'],
      timesheets: ['READ', 'CREATE', 'UPDATE'],
      comments: ['READ', 'CREATE'],
    },
    EXECUTIVE: {
      portfolios: ['READ'],
      programs: ['READ'],
      projects: ['READ'],
      reports: ['READ', 'EXPORT'],
      dashboards: ['READ'],
      changes: ['APPROVE'],
    },
    RESOURCE_MANAGER: {
      resources: ['READ', 'CREATE', 'UPDATE'],
      bookings: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
      capacity: ['READ', 'CONFIGURE'],
      skills: ['READ', 'UPDATE'],
    },
    FINANCE_CONTROLLER: {
      budgets: ['READ', 'CREATE', 'UPDATE', 'APPROVE'],
      costs: ['READ', 'CREATE', 'UPDATE'],
      timesheets: ['READ', 'APPROVE'],
      rates: ['READ', 'CONFIGURE'],
      invoices: ['READ', 'CREATE', 'EXPORT'],
    },
    CLIENT_STAKEHOLDER: {
      projects: ['READ'],
      reports: ['READ'],
      changes: ['APPROVE'],
      comments: ['READ', 'CREATE'],
    },
    COMPLIANCE_AUDITOR: {
      'audit-logs': ['READ', 'EXPORT'],
      reports: ['READ', 'EXPORT'],
      '*': ['READ'],
    },
    INTEGRATION_ADMIN: {
      integrations: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'CONFIGURE'],
      webhooks: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      'api-keys': ['READ', 'CREATE', 'DELETE'],
    },
    PLATFORM_OWNER: {
      '*': ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE'],
      integrations: ['READ', 'CREATE', 'UPDATE', 'DELETE', 'CONFIGURE'],
      transformations: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
      templates: ['READ', 'CREATE', 'UPDATE', 'DELETE'],
    },
  }

  return defaultPermissions[role] || {}
}

/**
 * Log access attempt to audit log
 */
export async function logAccessAttempt(
  userId: string,
  tenantId: string,
  resource: string,
  action: string,
  result: 'GRANTED' | 'DENIED' | 'ERROR',
  options?: {
    resourceId?: string
    reason?: string
    ipAddress?: string
    userAgent?: string
    metadata?: Record<string, any>
    permissionCheck?: Record<string, any>
  }
) {
  try {
    // Check if AccessAuditLog table exists before trying to log
    if (!prisma.accessAuditLog) {
      return
    }
    await prisma.accessAuditLog.create({
      data: {
        userId,
        tenantId,
        resource,
        resourceId: options?.resourceId,
        action,
        result,
        reason: options?.reason,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        metadata: options?.metadata || {},
        permissionCheck: options?.permissionCheck || {},
      },
    })
  } catch (error: any) {
    // Silently fail if table doesn't exist or other logging errors
    if (error.code === 'P2001' || error.message?.includes('does not exist') || error.message?.includes('Unknown model')) {
      // Table doesn't exist yet, skip logging
      return
    }
    console.error('Failed to log access attempt:', error)
    // Don't throw - logging failure shouldn't break the request
  }
}


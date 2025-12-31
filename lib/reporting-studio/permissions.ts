// Permission checking utilities for Reporting Studio

import { PermissionLevel } from '@/types/reporting-studio'
import { User, OrgUnit, UserRole } from '@prisma/client'

export interface PermissionCheckOptions {
  userId?: string
  orgUnitId?: string | null
  role?: UserRole | string
  tenantId: string
}

/**
 * Check if a user has permission to perform an action
 */
export function hasPermission(
  userPermission: PermissionLevel,
  requiredPermission: PermissionLevel
): boolean {
  const permissionHierarchy: Record<PermissionLevel, number> = {
    NONE: 0,
    VIEW: 1,
    EDIT: 2,
    DELETE: 3,
    ADMIN: 4,
  }

  return permissionHierarchy[userPermission] >= permissionHierarchy[requiredPermission]
}

/**
 * Get the highest permission level from multiple permissions
 */
export function getHighestPermission(permissions: PermissionLevel[]): PermissionLevel {
  const hierarchy: Record<PermissionLevel, number> = {
    NONE: 0,
    VIEW: 1,
    EDIT: 2,
    DELETE: 3,
    ADMIN: 4,
  }

  return permissions.reduce((highest, current) => {
    return hierarchy[current] > hierarchy[highest] ? current : highest
  }, 'NONE' as PermissionLevel)
}

/**
 * Check if user has required permission based on their role
 */
export function checkRolePermission(
  userRole: UserRole | string,
  requiredPermission: PermissionLevel
): boolean {
  // Super admins and org admins have full access
  if (userRole === 'TENANT_SUPER_ADMIN' || userRole === 'ORG_ADMIN') {
    return true
  }

  // For other roles, check based on permission level
  // This is a simplified check - in production, you'd have a role-permission mapping
  return requiredPermission !== 'ADMIN'
}

/**
 * Build permission check query conditions
 */
export function buildPermissionQuery(options: PermissionCheckOptions) {
  const conditions: any[] = []

  // User-specific permission
  if (options.userId) {
    conditions.push({
      user: { id: options.userId },
    })
  }

  // Org unit permission
  if (options.orgUnitId) {
    conditions.push({
      orgUnit: { id: options.orgUnitId },
    })
  }

  // Role-based permission
  if (options.role) {
    conditions.push({
      role: options.role,
    })
  }

  return {
    OR: conditions.length > 0 ? conditions : [{ permission: { not: 'NONE' } }],
  }
}

/**
 * Get effective permission for a user on an entity
 * This checks user, org unit, and role-based permissions
 */
export async function getEffectivePermission(
  entityId: string,
  entityType: 'dataset' | 'visualization' | 'dashboard' | 'report',
  options: PermissionCheckOptions
): Promise<PermissionLevel> {
  // This would query the database to find all matching permissions
  // and return the highest permission level
  // For now, returning a placeholder - actual implementation would query Prisma

  // TODO: Implement actual database query based on entityType
  // const permissions = await prisma[`reporting${entityType}Permission`].findMany({
  //   where: {
  //     [`${entityType}Id`]: entityId,
  //     tenantId: options.tenantId,
  //     ...buildPermissionQuery(options),
  //   },
  // })

  // const permissionLevels = permissions.map(p => p.permission)
  // return getHighestPermission(permissionLevels)

  // Default to VIEW for now
  return 'VIEW'
}

/**
 * Check if user can view an entity
 */
export async function canView(
  entityId: string,
  entityType: 'dataset' | 'visualization' | 'dashboard' | 'report',
  options: PermissionCheckOptions
): Promise<boolean> {
  const permission = await getEffectivePermission(entityId, entityType, options)
  return hasPermission(permission, 'VIEW')
}

/**
 * Check if user can edit an entity
 */
export async function canEdit(
  entityId: string,
  entityType: 'dataset' | 'visualization' | 'dashboard' | 'report',
  options: PermissionCheckOptions
): Promise<boolean> {
  const permission = await getEffectivePermission(entityId, entityType, options)
  return hasPermission(permission, 'EDIT')
}

/**
 * Check if user can delete an entity
 */
export async function canDelete(
  entityId: string,
  entityType: 'dataset' | 'visualization' | 'dashboard' | 'report',
  options: PermissionCheckOptions
): Promise<boolean> {
  const permission = await getEffectivePermission(entityId, entityType, options)
  return hasPermission(permission, 'DELETE')
}

/**
 * Check if user is admin for an entity
 */
export async function isAdmin(
  entityId: string,
  entityType: 'dataset' | 'visualization' | 'dashboard' | 'report',
  options: PermissionCheckOptions
): Promise<boolean> {
  const permission = await getEffectivePermission(entityId, entityType, options)
  return hasPermission(permission, 'ADMIN')
}


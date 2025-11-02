import { prisma } from '@/lib/prisma'
import { AuditAction, AuditEntity } from '@prisma/client'

interface AuditLogData {
  tenantId: string
  userId: string
  action: AuditAction
  entity: AuditEntity
  entityId?: string
  entityName?: string
  changes?: any
  ipAddress?: string
  userAgent?: string
  metadata?: any
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        entityName: data.entityName,
        changes: data.changes || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata || null,
      },
    })
  } catch (error) {
    // Log error but don't throw - audit logging should not break main functionality
    console.error('[Audit Log] Failed to create audit log:', error)
  }
}

/**
 * Log user creation
 */
export async function logUserCreated(params: {
  tenantId: string
  userId: string // Who created
  createdUserId: string // Who was created
  createdUserEmail: string
  createdUserName: string
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'CREATE',
    entity: 'USER',
    entityId: params.createdUserId,
    entityName: `${params.createdUserName} (${params.createdUserEmail})`,
    changes: {
      email: params.createdUserEmail,
      name: params.createdUserName,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log user update
 */
export async function logUserUpdated(params: {
  tenantId: string
  userId: string // Who updated
  updatedUserId: string // Who was updated
  updatedUserEmail: string
  changes: any // Before/after values
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'UPDATE',
    entity: 'USER',
    entityId: params.updatedUserId,
    entityName: params.updatedUserEmail,
    changes: params.changes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log user deletion
 */
export async function logUserDeleted(params: {
  tenantId: string
  userId: string // Who deleted
  deletedUserId: string // Who was deleted
  deletedUserEmail: string
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'DELETE',
    entity: 'USER',
    entityId: params.deletedUserId,
    entityName: params.deletedUserEmail,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log project creation
 */
export async function logProjectCreated(params: {
  tenantId: string
  userId: string
  projectId: string
  projectName: string
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'CREATE',
    entity: 'PROJECT',
    entityId: params.projectId,
    entityName: params.projectName,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log project update
 */
export async function logProjectUpdated(params: {
  tenantId: string
  userId: string
  projectId: string
  projectName: string
  changes: any
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'UPDATE',
    entity: 'PROJECT',
    entityId: params.projectId,
    entityName: params.projectName,
    changes: params.changes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log task creation
 */
export async function logTaskCreated(params: {
  tenantId: string
  userId: string
  taskId: string
  taskTitle: string
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'CREATE',
    entity: 'TASK',
    entityId: params.taskId,
    entityName: params.taskTitle,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log SSO configuration change
 */
export async function logSSOConfigChanged(params: {
  tenantId: string
  userId: string
  changes: any
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'SSO_CONFIG_CHANGE',
    entity: 'SSO_SETTINGS',
    changes: params.changes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log retention configuration change
 */
export async function logRetentionConfigChanged(params: {
  tenantId: string
  userId: string
  changes: any
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'RETENTION_CONFIG_CHANGE',
    entity: 'RETENTION_SETTINGS',
    changes: params.changes,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log data cleanup
 */
export async function logDataCleanup(params: {
  tenantId: string
  userId: string
  metadata: any // Cleanup results
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'DATA_CLEANUP',
    entity: 'TENANT',
    metadata: params.metadata,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log login
 */
export async function logLogin(params: {
  tenantId: string
  userId: string
  ipAddress?: string
  userAgent?: string
}) {
  await createAuditLog({
    tenantId: params.tenantId,
    userId: params.userId,
    action: 'LOGIN',
    entity: 'USER',
    entityId: params.userId,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log failed login
 */
export async function logLoginFailed(params: {
  tenantId: string
  email: string
  ipAddress?: string
  userAgent?: string
}) {
  // For failed logins, we might not have a userId yet
  // We'll use a system user ID or create a special entry
  await createAuditLog({
    tenantId: params.tenantId,
    userId: 'system', // Special ID for system events
    action: 'LOGIN_FAILED',
    entity: 'USER',
    entityName: params.email,
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Extract IP address from request
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIp || undefined
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}


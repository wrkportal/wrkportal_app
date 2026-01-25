/**
 * Data Loss Prevention (DLP) Service
 * 
 * Prevents unauthorized data exports and monitors sensitive data access
 */

import { prisma } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

// AuditEntity enum values (may not be exported from Prisma Client)
// Using string literals that match the Prisma enum
type AuditEntityType = 
  | 'USER'
  | 'PROJECT'
  | 'TASK'
  | 'PROGRAM'
  | 'INITIATIVE'
  | 'GOAL'
  | 'OKR'
  | 'RISK'
  | 'ISSUE'
  | 'APPROVAL'
  | 'REPORT'
  | 'NOTIFICATION'
  | 'ORG_UNIT'
  | 'TENANT'
  | 'SSO_SETTINGS'
  | 'RETENTION_SETTINGS'
  | 'TUTORIAL'
  | 'COLLABORATION'

const AuditEntity: Record<string, AuditEntityType> = {
  USER: 'USER',
  PROJECT: 'PROJECT',
  TASK: 'TASK',
  PROGRAM: 'PROGRAM',
  INITIATIVE: 'INITIATIVE',
  GOAL: 'GOAL',
  OKR: 'OKR',
  RISK: 'RISK',
  ISSUE: 'ISSUE',
  APPROVAL: 'APPROVAL',
  REPORT: 'REPORT',
  NOTIFICATION: 'NOTIFICATION',
  ORG_UNIT: 'ORG_UNIT',
  TENANT: 'TENANT',
  SSO_SETTINGS: 'SSO_SETTINGS',
  RETENTION_SETTINGS: 'RETENTION_SETTINGS',
  TUTORIAL: 'TUTORIAL',
  COLLABORATION: 'COLLABORATION',
}

export interface DLPConfig {
  enabled: boolean
  maxExportRows?: number
  requireApprovalForExports?: boolean
  blockSensitiveFields?: boolean
  allowedExportFormats?: string[]
  requireWatermark?: boolean
}

export interface ExportRequest {
  userId: string
  tenantId: string
  resourceType: string
  format: string
  rowCount: number
  fields?: string[]
  filters?: any
}

/**
 * Check if export is allowed based on DLP rules
 */
export async function checkExportAllowed(
  request: ExportRequest
): Promise<{ allowed: boolean; reason?: string; requiresApproval?: boolean }> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: request.tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' }
  }
  
  const settings = (tenant.settings as any) || {}
  const dlpConfig: DLPConfig = settings.security?.dlp || {
    enabled: false,
    maxExportRows: 10000,
    requireApprovalForExports: false,
    blockSensitiveFields: true,
    allowedExportFormats: ['csv', 'xlsx', 'pdf'],
    requireWatermark: true
  }
  
  // If DLP is disabled, allow export
  if (!dlpConfig.enabled) {
    return { allowed: true }
  }
  
  // Check export format
  if (dlpConfig.allowedExportFormats && 
      !dlpConfig.allowedExportFormats.includes(request.format.toLowerCase())) {
    return {
      allowed: false,
      reason: `Export format ${request.format} is not allowed. Allowed formats: ${dlpConfig.allowedExportFormats.join(', ')}`
    }
  }
  
  // Check row count limit
  if (dlpConfig.maxExportRows && request.rowCount > dlpConfig.maxExportRows) {
    return {
      allowed: false,
      reason: `Export exceeds maximum allowed rows (${dlpConfig.maxExportRows}). Requested: ${request.rowCount}`
    }
  }
  
  // Check if approval is required
  if (dlpConfig.requireApprovalForExports) {
    return {
      allowed: true,
      requiresApproval: true
    }
  }
  
  // Check user permissions
  const user = await prisma.user.findUnique({
    where: { id: request.userId },
    select: { role: true }
  })
  
  // Admins can always export
  if (user?.role === 'TENANT_SUPER_ADMIN' || user?.role === 'ORG_ADMIN') {
    return { allowed: true }
  }
  
  // Check if sensitive fields are being exported
  if (dlpConfig.blockSensitiveFields && request.fields) {
    const sensitiveFields = ['ssn', 'taxId', 'bankAccount', 'creditCard', 'passportNumber']
    const hasSensitiveFields = request.fields.some(field => 
      sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive.toLowerCase()))
    )
    
    if (hasSensitiveFields) {
      return {
        allowed: false,
        reason: 'Export contains sensitive fields that are not allowed'
      }
    }
  }
  
  return { allowed: true }
}

/**
 * Map resource type string to AuditEntity enum
 */
function mapResourceTypeToAuditEntity(resourceType: string): AuditEntityType {
  const upperResourceType = resourceType.toUpperCase()
  // Map common resource types to AuditEntity enum values
  const entityMap: Record<string, AuditEntityType> = {
    'USER': AuditEntity.USER,
    'PROJECT': AuditEntity.PROJECT,
    'TASK': AuditEntity.TASK,
    'PROGRAM': AuditEntity.PROGRAM,
    'INITIATIVE': AuditEntity.INITIATIVE,
    'GOAL': AuditEntity.GOAL,
    'OKR': AuditEntity.OKR,
    'RISK': AuditEntity.RISK,
    'ISSUE': AuditEntity.ISSUE,
    'APPROVAL': AuditEntity.APPROVAL,
    'REPORT': AuditEntity.REPORT,
    'NOTIFICATION': AuditEntity.NOTIFICATION,
    'ORG_UNIT': AuditEntity.ORG_UNIT,
    'TENANT': AuditEntity.TENANT,
    'SSO_SETTINGS': AuditEntity.SSO_SETTINGS,
    'RETENTION_SETTINGS': AuditEntity.RETENTION_SETTINGS,
    'TUTORIAL': AuditEntity.TUTORIAL,
    'COLLABORATION': AuditEntity.COLLABORATION,
  }
  // Return mapped entity or default to REPORT for exports
  const mappedEntity = entityMap[upperResourceType]
  return mappedEntity ?? AuditEntity.REPORT
}

/**
 * Log export activity for audit
 */
export async function logExportActivity(
  request: ExportRequest,
  approved: boolean,
  approvedBy?: string
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: request.tenantId,
        userId: request.userId,
        action: AuditAction.EXPORT,
        entity: mapResourceTypeToAuditEntity(request.resourceType) as any,
        entityId: `export_${Date.now()}`,
        entityName: `Export ${request.resourceType} (${request.format})`,
        changes: JSON.stringify({
          format: request.format,
          rowCount: request.rowCount,
          fields: request.fields,
          filters: request.filters,
          approved,
          approvedBy
        }),
        ipAddress: 'N/A' // Will be set by middleware
      }
    })
  } catch (error) {
    console.error('Failed to log export activity:', error)
    // Don't throw - logging failure shouldn't block export
  }
}

/**
 * Add watermark to exported data
 */
export function addWatermark(data: any[], userId: string, tenantId: string): any[] {
  // Add metadata row at the beginning
  const watermark = {
    _watermark: `Exported by user ${userId} from tenant ${tenantId} on ${new Date().toISOString()}`,
    _exportedAt: new Date().toISOString(),
    _exportedBy: userId,
    _tenantId: tenantId
  }
  
  return [watermark, ...data]
}

/**
 * Sanitize sensitive fields from export data
 */
export function sanitizeExportData(
  data: any[],
  sensitiveFields: string[]
): any[] {
  return data.map(row => {
    const sanitized = { ...row }
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '***REDACTED***'
      }
    }
    return sanitized
  })
}

/**
 * Get DLP configuration for tenant
 */
export async function getDLPConfig(tenantId: string): Promise<DLPConfig> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }
  
  const settings = (tenant.settings as any) || {}
  return settings.security?.dlp || {
    enabled: false,
    maxExportRows: 10000,
    requireApprovalForExports: false,
    blockSensitiveFields: true,
    allowedExportFormats: ['csv', 'xlsx', 'pdf'],
    requireWatermark: true
  }
}

/**
 * Update DLP configuration for tenant
 */
export async function updateDLPConfig(
  tenantId: string,
  config: Partial<DLPConfig>
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true }
  })
  
  if (!tenant) {
    throw new Error('Tenant not found')
  }
  
  const settings = (tenant.settings as any) || {}
  if (!settings.security) {
    settings.security = {}
  }
  
  settings.security.dlp = {
    ...(settings.security.dlp || {}),
    ...config
  }
  
  await prisma.tenant.update({
    where: { id: tenantId },
    data: { settings }
  })
}


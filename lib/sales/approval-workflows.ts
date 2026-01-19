/**
 * Approval Workflow Service
 * 
 * Manages multi-level approval workflows for quotes, discounts, contracts, etc.
 */

import { prisma } from '@/lib/prisma'

export interface ApprovalLevel {
  level: number
  approverType: 'USER' | 'ROLE' | 'MANAGER' | 'CUSTOM'
  approverIds?: string[] // User IDs or role names
  requireAll: boolean // If multiple approvers, require all or any
  timeoutDays?: number // Auto-approve/reject after days
  escalationUserId?: string // Escalate to if timeout
}

export interface ApprovalWorkflowConfig {
  name: string
  description?: string
  entityType: 'QUOTE' | 'DISCOUNT' | 'CONTRACT' | 'ORDER' | 'CUSTOM'
  triggerConditions?: any
  approvalLevels: ApprovalLevel[]
}

/**
 * Create an approval workflow
 */
export async function createApprovalWorkflow(
  tenantId: string,
  config: ApprovalWorkflowConfig,
  createdById: string
): Promise<string> {
  const workflow = await prisma.salesApprovalWorkflow.create({
    data: {
      tenantId,
      name: config.name,
      description: config.description || null,
      entityType: config.entityType as any,
      triggerConditions: config.triggerConditions || {},
      approvalLevels: config.approvalLevels as any,
      isActive: true,
      createdById,
    },
  })

  return workflow.id
}

/**
 * Request approval for an entity
 */
export async function requestApproval(
  tenantId: string,
  workflowId: string,
  entityType: 'QUOTE' | 'DISCOUNT' | 'CONTRACT' | 'ORDER' | 'CUSTOM',
  entityId: string,
  requestedById: string,
  metadata?: any,
  expiresInDays?: number
): Promise<string> {
  const workflow = await prisma.salesApprovalWorkflow.findUnique({
    where: { id: workflowId },
  })

  if (!workflow || !workflow.isActive) {
    throw new Error('Workflow not found or inactive')
  }

  // Check if approval already pending
  const existing = await prisma.salesApprovalRequest.findFirst({
    where: {
      tenantId,
      entityType: entityType as any,
      entityId,
      status: 'PENDING',
    },
  })

  if (existing) {
    return existing.id // Return existing request
  }

  const approvalLevels = workflow.approvalLevels as any as ApprovalLevel[]
  const firstLevel = approvalLevels[0]

  if (!firstLevel) {
    throw new Error('Workflow has no approval levels')
  }

  // Calculate expiration date
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : firstLevel.timeoutDays
    ? new Date(Date.now() + firstLevel.timeoutDays * 24 * 60 * 60 * 1000)
    : null

  // Create approval request
  const request = await prisma.salesApprovalRequest.create({
    data: {
      tenantId,
      workflowId,
      entityType: entityType as any,
      entityId,
      currentLevel: 0,
      status: 'PENDING',
      requestedById,
      expiresAt,
      metadata: metadata || {},
    },
  })

  // Create approval records for first level
  await createApprovalRecords(request.id, firstLevel, tenantId)

  return request.id
}

/**
 * Create approval records for a level
 */
async function createApprovalRecords(
  requestId: string,
  level: ApprovalLevel,
  tenantId: string
): Promise<void> {
  if (level.approverType === 'USER' && level.approverIds) {
    // Create approval for each user
    for (const userId of level.approverIds) {
      await prisma.salesApproval.create({
        data: {
          requestId,
          level: level.level,
          approverId: userId,
          status: 'PENDING',
        },
      })
    }
  } else if (level.approverType === 'ROLE' && level.approverIds) {
    // Find users with the role
    const users = await prisma.user.findMany({
      where: {
        tenantId,
        role: level.approverIds[0] as any, // Assuming first ID is role name
      },
    })

    for (const user of users) {
      await prisma.salesApproval.create({
        data: {
          requestId,
          level: level.level,
          approverId: user.id,
          status: 'PENDING',
        },
      })
    }
  } else if (level.approverType === 'MANAGER') {
    // Get manager from request metadata or entity
    // This would need to be implemented based on your org structure
    // For now, placeholder
    console.warn('Manager approval not yet implemented')
  }
}

/**
 * Approve or reject an approval request
 */
export async function processApproval(
  approvalId: string,
  approverId: string,
  decision: 'APPROVED' | 'REJECTED',
  comments?: string
): Promise<void> {
  const approval = await prisma.salesApproval.findUnique({
    where: { id: approvalId },
    include: {
      request: {
        include: {
          workflow: true,
          approvals: true,
        },
      },
    },
  })

  if (!approval) {
    throw new Error('Approval not found')
  }

  if (approval.approverId !== approverId) {
    throw new Error('Not authorized to approve this request')
  }

  if (approval.status !== 'PENDING') {
    throw new Error('Approval already processed')
  }

  // Update approval
  await prisma.salesApproval.update({
    where: { id: approvalId },
    data: {
      status: decision as any,
      comments: comments || null,
      approvedAt: new Date(),
    },
  })

  const request = approval.request
  const workflow = request.workflow
  const approvalLevels = workflow.approvalLevels as any as ApprovalLevel[]
  const currentLevelConfig = approvalLevels[request.currentLevel]

  if (!currentLevelConfig) {
    return
  }

  // Check if level is complete
  const levelApprovals = request.approvals.filter(a => a.level === request.currentLevel)
  const pendingApprovals = levelApprovals.filter(a => a.status === 'PENDING')
  const approvedCount = levelApprovals.filter(a => a.status === 'APPROVED').length

  if (decision === 'REJECTED') {
    // Reject entire request
    await prisma.salesApprovalRequest.update({
      where: { id: request.id },
      data: {
        status: 'REJECTED',
        completedAt: new Date(),
      },
    })
    return
  }

  // Check if level requires all approvers
  const levelComplete = currentLevelConfig.requireAll
    ? pendingApprovals.length === 0 && approvedCount === levelApprovals.length
    : approvedCount > 0

  if (levelComplete) {
    // Move to next level or complete
    const nextLevel = request.currentLevel + 1
    const nextLevelConfig = approvalLevels[nextLevel]

    if (nextLevelConfig) {
      // Move to next level
      await prisma.salesApprovalRequest.update({
        where: { id: request.id },
        data: {
          currentLevel: nextLevel,
        },
      })

      // Create approval records for next level
      await createApprovalRecords(request.id, nextLevelConfig, request.tenantId)

      // Update expiration if needed
      if (nextLevelConfig.timeoutDays) {
        const expiresAt = new Date(Date.now() + nextLevelConfig.timeoutDays * 24 * 60 * 60 * 1000)
        await prisma.salesApprovalRequest.update({
          where: { id: request.id },
          data: { expiresAt },
        })
      }
    } else {
      // All levels approved
      await prisma.salesApprovalRequest.update({
        where: { id: request.id },
        data: {
          status: 'APPROVED',
          completedAt: new Date(),
        },
      })
    }
  }
}

/**
 * Get approval requests for an entity
 */
export async function getEntityApprovalRequests(
  tenantId: string,
  entityType: 'QUOTE' | 'DISCOUNT' | 'CONTRACT' | 'ORDER' | 'CUSTOM',
  entityId: string
) {
  return await prisma.salesApprovalRequest.findMany({
    where: {
      tenantId,
      entityType: entityType as any,
      entityId,
    },
    include: {
      workflow: {
        select: {
          name: true,
          description: true,
        },
      },
      requestedBy: {
        select: {
          name: true,
          email: true,
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          level: 'asc',
        },
      },
    },
    orderBy: {
      requestedAt: 'desc',
    },
  })
}

/**
 * Get pending approvals for a user
 */
export async function getPendingApprovalsForUser(
  userId: string,
  tenantId: string
) {
  return await prisma.salesApproval.findMany({
    where: {
      approverId: userId,
      status: 'PENDING',
      request: {
        tenantId,
        status: 'PENDING',
      },
    },
    include: {
      request: {
        include: {
          workflow: {
            select: {
              name: true,
            },
          },
          requestedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Process expired approval requests
 */
export async function processExpiredApprovals(): Promise<void> {
  const now = new Date()
  const expiredRequests = await prisma.salesApprovalRequest.findMany({
    where: {
      status: 'PENDING',
      expiresAt: {
        lte: now,
      },
    },
    include: {
      workflow: true,
    },
  })

  for (const request of expiredRequests) {
    const workflow = request.workflow
    const approvalLevels = workflow.approvalLevels as any as ApprovalLevel[]
    const currentLevelConfig = approvalLevels[request.currentLevel]

    if (currentLevelConfig?.escalationUserId) {
      // Escalate to escalation user
      await createApprovalRecords(request.id, {
        ...currentLevelConfig,
        approverIds: [currentLevelConfig.escalationUserId!],
      }, request.tenantId)
    } else {
      // Auto-reject expired requests
      await prisma.salesApprovalRequest.update({
        where: { id: request.id },
        data: {
          status: 'EXPIRED',
          completedAt: new Date(),
        },
      })
    }
  }
}


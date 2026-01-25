import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'COMPLIANCE_AUDITOR']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Fetch audit logs for this tenant
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit to last 100 logs
    })

    // Format logs for frontend
    type AuditLogWithUser = Prisma.AuditLogGetPayload<{
      include: {
        user: {
          select: {
            firstName: true
            lastName: true
            email: true
          }
        }
      }
    }>
    
    const formattedLogs = (auditLogs as AuditLogWithUser[]).map((log: AuditLogWithUser) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      user: `${log.user.firstName} ${log.user.lastName}`,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId || '',
      changes: log.entityName || JSON.stringify(log.changes),
      ipAddress: log.ipAddress || 'N/A',
    }))

    return NextResponse.json({
      logs: formattedLogs,
      totalCount: formattedLogs.length,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}


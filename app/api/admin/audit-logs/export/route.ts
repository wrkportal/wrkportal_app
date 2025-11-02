import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin permissions
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'COMPLIANCE_AUDITOR']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')
    const entity = searchParams.get('entity')

    // Build where clause
    const where: any = {
      tenantId: session.user.tenantId,
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) }
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) }
    }

    if (action && action !== 'all') {
      where.action = action
    }

    if (entity && entity !== 'all') {
      where.entity = entity
    }

    // Fetch audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
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
    })

    // Convert to CSV
    const csvHeader = 'Timestamp,User,User Email,Action,Entity,Entity ID,Entity Name,IP Address,Changes\n'
    
    const csvRows = auditLogs.map((log) => {
      const timestamp = log.createdAt.toISOString()
      const userName = `${log.user.firstName} ${log.user.lastName}`
      const userEmail = log.user.email
      const action = log.action
      const entity = log.entity
      const entityId = log.entityId || ''
      const entityName = log.entityName || ''
      const ipAddress = log.ipAddress || ''
      const changes = log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : ''

      return `"${timestamp}","${userName}","${userEmail}","${action}","${entity}","${entityId}","${entityName}","${ipAddress}","${changes}"`
    }).join('\n')

    const csv = csvHeader + csvRows

    // Get tenant info for filename
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { name: true },
    })

    const filename = `audit-logs-${tenant?.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`

    // Return CSV file
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return NextResponse.json({ error: 'Failed to export audit logs' }, { status: 500 })
  }
}


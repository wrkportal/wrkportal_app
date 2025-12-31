/**
 * Phase 4: Access Audit Logs API
 * 
 * Query access audit logs for security and compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// GET /api/permissions/audit-logs - Get access audit logs
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'audit-logs', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')
        const resource = searchParams.get('resource')
        const resourceId = searchParams.get('resourceId')
        const action = searchParams.get('action')
        const result = searchParams.get('result') as 'GRANTED' | 'DENIED' | 'ERROR' | null
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (userId) where.userId = userId
        if (resource) where.resource = resource
        if (resourceId) where.resourceId = resourceId
        if (action) where.action = action
        if (result) where.result = result
        if (startDate || endDate) {
          where.createdAt = {}
          if (startDate) where.createdAt.gte = new Date(startDate)
          if (endDate) where.createdAt.lte = new Date(endDate)
        }

        const [logs, total] = await Promise.all([
          prisma.accessAuditLog.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: limit,
            skip: offset,
          }),
          prisma.accessAuditLog.count({ where }),
        ])

        return NextResponse.json({
          logs,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        })
      } catch (error: any) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json(
          { error: 'Failed to fetch audit logs', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


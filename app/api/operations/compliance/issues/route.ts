import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsComplianceIssue model
function getOperationsComplianceIssue() {
  return (prisma as any).operationsComplianceIssue as any
}

const createIssueSchema = z.object({
  type: z.enum(['PROCESS_VIOLATION', 'DOCUMENTATION', 'TRAINING', 'SAFETY', 'REGULATORY', 'OTHER']),
  description: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().optional(),
})

// GET - Get compliance issues
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const severity = searchParams.get('severity')
        const status = searchParams.get('status')
        const assignedToId = searchParams.get('assignedToId')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (type) {
          where.type = type
        }
        if (severity) {
          where.severity = severity
        }
        if (status) {
          where.status = status
        }
        if (assignedToId) {
          where.assignedToId = assignedToId
        }

        const operationsComplianceIssue = getOperationsComplianceIssue()
        if (!operationsComplianceIssue) {
          return NextResponse.json(
            { error: 'Operations compliance issue model not available', issues: [], stats: { total: 0, open: 0, inProgress: 0, resolved: 0, highSeverity: 0 }, pagination: { page, limit, total: 0, totalPages: 0 } },
            { status: 503 }
          )
        }

        const [issues, total] = await Promise.all([
          (operationsComplianceIssue as any).findMany({
            where,
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  department: true,
                },
              },
            },
            orderBy: [
              { severity: 'desc' },
              { reportedDate: 'desc' },
            ],
            skip,
            take: limit,
          }),
          (operationsComplianceIssue as any).count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await (operationsComplianceIssue as any).count({
            where: { tenantId: userInfo.tenantId },
          }),
          open: await (operationsComplianceIssue as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'OPEN',
            },
          }),
          inProgress: await (operationsComplianceIssue as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'IN_PROGRESS',
            },
          }),
          resolved: await (operationsComplianceIssue as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'RESOLVED',
            },
          }),
          highSeverity: await (operationsComplianceIssue as any).count({
            where: {
              tenantId: userInfo.tenantId,
              severity: { in: ['HIGH', 'CRITICAL'] },
            },
          }),
        }

        return NextResponse.json({
          issues,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching compliance issues:', error)
        return NextResponse.json(
          { error: 'Failed to fetch compliance issues' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create compliance issue
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createIssueSchema.parse(body)

        const operationsComplianceIssue = getOperationsComplianceIssue()
        if (!operationsComplianceIssue) {
          return NextResponse.json(
            { error: 'Operations compliance issue model not available' },
            { status: 503 }
          )
        }

        const issue = await (operationsComplianceIssue as any).create({
          data: {
            type: validatedData.type,
            description: validatedData.description,
            severity: validatedData.severity || 'MEDIUM',
            status: 'OPEN',
            reportedDate: new Date(),
            assignedToId: validatedData.assignedToId,
            tenantId: userInfo.tenantId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        })

        return NextResponse.json(issue, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating compliance issue:', error)
        return NextResponse.json(
          { error: 'Failed to create compliance issue' },
          { status: 500 }
        )
      }
    }
  )
}


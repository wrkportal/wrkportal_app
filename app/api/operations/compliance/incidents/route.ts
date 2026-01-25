import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsIncident model
function getOperationsIncident() {
  return (prisma as any).operationsIncident as any
}

const createIncidentSchema = z.object({
  type: z.enum(['SAFETY', 'QUALITY', 'SECURITY', 'OPERATIONAL', 'ENVIRONMENTAL', 'OTHER']),
  description: z.string().min(1),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
})

// GET - Get incidents
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

        const operationsIncident = getOperationsIncident()
        if (!operationsIncident) {
          return NextResponse.json(
            { error: 'Operations incident model not available', incidents: [], stats: { total: 0, open: 0, investigating: 0, resolved: 0, highSeverity: 0 }, pagination: { page, limit, total: 0, totalPages: 0 } },
            { status: 503 }
          )
        }

        const [incidents, total] = await Promise.all([
          (operationsIncident as any).findMany({
            where,
            include: {
              reportedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              reportedDate: 'desc',
            },
            skip,
            take: limit,
          }),
          (operationsIncident as any).count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await (operationsIncident as any).count({
            where: { tenantId: userInfo.tenantId },
          }),
          open: await (operationsIncident as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'OPEN',
            },
          }),
          investigating: await (operationsIncident as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'INVESTIGATING',
            },
          }),
          resolved: await (operationsIncident as any).count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'RESOLVED',
            },
          }),
          highSeverity: await (operationsIncident as any).count({
            where: {
              tenantId: userInfo.tenantId,
              severity: { in: ['HIGH', 'CRITICAL'] },
            },
          }),
        }

        return NextResponse.json({
          incidents,
          stats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching incidents:', error)
        return NextResponse.json(
          { error: 'Failed to fetch incidents' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create incident
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createIncidentSchema.parse(body)

        const operationsIncident = getOperationsIncident()
        if (!operationsIncident) {
          return NextResponse.json(
            { error: 'Operations incident model not available' },
            { status: 503 }
          )
        }

        const incident = await (operationsIncident as any).create({
          data: {
            type: validatedData.type,
            description: validatedData.description,
            severity: validatedData.severity || 'MEDIUM',
            status: 'OPEN',
            reportedDate: new Date(),
            reportedById: userInfo.userId,
            tenantId: userInfo.tenantId,
          },
          include: {
            reportedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json(incident, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating incident:', error)
        return NextResponse.json(
          { error: 'Failed to create incident' },
          { status: 500 }
        )
      }
    }
  )
}


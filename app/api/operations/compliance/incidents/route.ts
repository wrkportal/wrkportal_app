import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

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

        const [incidents, total] = await Promise.all([
          prisma.operationsIncident.findMany({
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
          prisma.operationsIncident.count({ where }),
        ])

        // Calculate stats
        const stats = {
          total: await prisma.operationsIncident.count({
            where: { tenantId: userInfo.tenantId },
          }),
          open: await prisma.operationsIncident.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'OPEN',
            },
          }),
          investigating: await prisma.operationsIncident.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'INVESTIGATING',
            },
          }),
          resolved: await prisma.operationsIncident.count({
            where: {
              tenantId: userInfo.tenantId,
              status: 'RESOLVED',
            },
          }),
          highSeverity: await prisma.operationsIncident.count({
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

        const incident = await prisma.operationsIncident.create({
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


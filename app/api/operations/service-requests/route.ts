import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createServiceRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  requestedById: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  location: z.string().optional(),
  dueDate: z.string().optional(),
  slaTarget: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
})

// GET - List service requests
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const category = searchParams.get('category')
        const assignedToId = searchParams.get('assignedToId')
        const requestedById = searchParams.get('requestedById')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
        const skip = (page - 1) * limit

        const where: any = {
          tenantId: userInfo.tenantId,
        }

        if (status) {
          where.status = status
        }
        if (priority) {
          where.priority = priority
        }
        if (category) {
          where.category = category
        }
        if (assignedToId) {
          where.assignedToId = assignedToId
        }
        if (requestedById) {
          where.requestedById = requestedById
        }
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { requestNumber: { contains: search, mode: 'insensitive' } },
          ]
        }

        const [requests, total] = await Promise.all([
          prisma.operationsServiceRequest.findMany({
            where,
            include: {
              requestedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
              createdBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'desc',
            },
            skip,
            take: limit,
          }),
          prisma.operationsServiceRequest.count({ where }),
        ])

        return NextResponse.json({
          requests,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        })
      } catch (error) {
        console.error('Error fetching service requests:', error)
        return NextResponse.json(
          { error: 'Failed to fetch service requests' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create service request
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createServiceRequestSchema.parse(body)

        // Generate request number
        const count = await prisma.operationsServiceRequest.count({
          where: { tenantId: userInfo.tenantId },
        })
        const requestNumber = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`

        const serviceRequest = await prisma.operationsServiceRequest.create({
          data: {
            ...validatedData,
            tenantId: userInfo.tenantId,
            requestNumber,
            requestedById: validatedData.requestedById || userInfo.userId,
            createdById: userInfo.userId,
            assignedToId: validatedData.assignedToId || null,
            vendorId: validatedData.vendorId || null,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            cost: validatedData.cost ? validatedData.cost : undefined,
          },
          include: {
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ request: serviceRequest }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating service request:', error)
        return NextResponse.json(
          { error: 'Failed to create service request', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


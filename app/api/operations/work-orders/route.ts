import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

// Helper function to safely access operationsWorkOrder model
function getOperationsWorkOrder() {
  return (prisma as any).operationsWorkOrder as any
}

const createWorkOrderSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().optional(),
  requestedById: z.string().optional(),
  assetId: z.string().optional(),
  location: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedCost: z.number().optional(),
  estimatedHours: z.number().optional(),
  notes: z.string().optional(),
})

const updateWorkOrderSchema = createWorkOrderSchema.partial()

// GET - List work orders
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const assignedToId = searchParams.get('assignedToId')
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
        if (assignedToId) {
          where.assignedToId = assignedToId
        }
        if (search) {
          where.OR = [
            { title: { contains: search, mode: 'insensitive' } },
            { workOrderNumber: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }

        const operationsWorkOrder = getOperationsWorkOrder()
        if (!operationsWorkOrder) {
          return NextResponse.json(
            { error: 'Operations work order model not available' },
            { status: 503 }
          )
        }

        const [workOrders, total] = await Promise.all([
          (operationsWorkOrder as any).findMany({
            where,
            include: {
              assignedTo: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              requestedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              asset: {
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
          (operationsWorkOrder as any).count({ where }),
        ])

        return NextResponse.json({
          workOrders,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        })
      } catch (error) {
        console.error('Error fetching work orders:', error)
        return NextResponse.json(
          { error: 'Failed to fetch work orders' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create work order
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = createWorkOrderSchema.parse(body)

        // Generate work order number
        const operationsWorkOrder = getOperationsWorkOrder()
        if (!operationsWorkOrder) {
          return NextResponse.json(
            { error: 'Operations work order model not available' },
            { status: 503 }
          )
        }

        const count = await (operationsWorkOrder as any).count({
          where: { tenantId: userInfo.tenantId },
        })
        const workOrderNumber = `WO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

        const workOrder = await (operationsWorkOrder as any).create({
          data: {
            workOrderNumber,
            title: validatedData.title,
            description: validatedData.description,
            status: validatedData.status || 'OPEN',
            priority: validatedData.priority || 'MEDIUM',
            assignedToId: validatedData.assignedToId,
            requestedById: validatedData.requestedById || userInfo.userId,
            assetId: validatedData.assetId,
            location: validatedData.location,
            scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null,
            estimatedCost: validatedData.estimatedCost,
            estimatedHours: validatedData.estimatedHours,
            notes: validatedData.notes,
            tenantId: userInfo.tenantId,
            createdById: userInfo.userId,
          },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            requestedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            asset: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        })

        return NextResponse.json(workOrder, { status: 201 })
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating work order:', error)
        return NextResponse.json(
          { error: 'Failed to create work order' },
          { status: 500 }
        )
      }
    }
  )
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateWorkOrderSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['OPEN', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedToId: z.string().optional().nullable(),
  requestedById: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
  location: z.string().optional(),
  scheduledDate: z.string().optional().nullable(),
  completedDate: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  actualCost: z.number().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  actualHours: z.number().optional().nullable(),
  notes: z.string().optional(),
})

// GET - Get work order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const workOrder = await prisma.operationsWorkOrder.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
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
                category: true,
                status: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            inventoryItems: {
              include: {
                item: {
                  select: {
                    id: true,
                    itemName: true,
                    quantity: true,
                  },
                },
              },
            },
          },
        })

        if (!workOrder) {
          return NextResponse.json(
            { error: 'Work order not found' },
            { status: 404 }
          )
        }

        return NextResponse.json(workOrder)
      } catch (error) {
        console.error('Error fetching work order:', error)
        return NextResponse.json(
          { error: 'Failed to fetch work order' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update work order
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = updateWorkOrderSchema.parse(body)

        // Check if work order exists
        const existing = await prisma.operationsWorkOrder.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Work order not found' },
            { status: 404 }
          )
        }

        // Prepare update data
        const updateData: any = {}
        if (validatedData.title !== undefined) updateData.title = validatedData.title
        if (validatedData.description !== undefined) updateData.description = validatedData.description
        if (validatedData.status !== undefined) updateData.status = validatedData.status
        if (validatedData.priority !== undefined) updateData.priority = validatedData.priority
        if (validatedData.assignedToId !== undefined) updateData.assignedToId = validatedData.assignedToId
        if (validatedData.requestedById !== undefined) updateData.requestedById = validatedData.requestedById
        if (validatedData.assetId !== undefined) updateData.assetId = validatedData.assetId
        if (validatedData.location !== undefined) updateData.location = validatedData.location
        if (validatedData.scheduledDate !== undefined) {
          updateData.scheduledDate = validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : null
        }
        if (validatedData.completedDate !== undefined) {
          updateData.completedDate = validatedData.completedDate ? new Date(validatedData.completedDate) : null
        }
        if (validatedData.estimatedCost !== undefined) updateData.estimatedCost = validatedData.estimatedCost
        if (validatedData.actualCost !== undefined) updateData.actualCost = validatedData.actualCost
        if (validatedData.estimatedHours !== undefined) updateData.estimatedHours = validatedData.estimatedHours
        if (validatedData.actualHours !== undefined) updateData.actualHours = validatedData.actualHours
        if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

        // Auto-set completed date if status is COMPLETED
        if (validatedData.status === 'COMPLETED' && !updateData.completedDate) {
          updateData.completedDate = new Date()
        }

        const workOrder = await prisma.operationsWorkOrder.update({
          where: { id: params.id },
          data: updateData,
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

        return NextResponse.json(workOrder)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating work order:', error)
        return NextResponse.json(
          { error: 'Failed to update work order' },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete work order
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const workOrder = await prisma.operationsWorkOrder.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!workOrder) {
          return NextResponse.json(
            { error: 'Work order not found' },
            { status: 404 }
          )
        }

        await prisma.operationsWorkOrder.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Work order deleted successfully' })
      } catch (error) {
        console.error('Error deleting work order:', error)
        return NextResponse.json(
          { error: 'Failed to delete work order' },
          { status: 500 }
        )
      }
    }
  )
}


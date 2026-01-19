import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateServiceRequestSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'PENDING_APPROVAL', 'RESOLVED', 'CLOSED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  location: z.string().optional(),
  dueDate: z.string().optional(),
  resolution: z.string().optional(),
  slaTarget: z.number().optional(),
  slaActual: z.number().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
})

// GET - Get service request by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'READ' },
    async (request, userInfo) => {
      try {
        const serviceRequest = await prisma.operationsServiceRequest.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
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
                category: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        if (!serviceRequest) {
          return NextResponse.json(
            { error: 'Service request not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ request: serviceRequest })
      } catch (error) {
        console.error('Error fetching service request:', error)
        return NextResponse.json(
          { error: 'Failed to fetch service request' },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH - Update service request
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
        const validatedData = updateServiceRequestSchema.parse(body)

        const serviceRequest = await prisma.operationsServiceRequest.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!serviceRequest) {
          return NextResponse.json(
            { error: 'Service request not found' },
            { status: 404 }
          )
        }

        // Calculate SLA actual if status is being changed to RESOLVED or CLOSED
        let slaActual = validatedData.slaActual
        if (
          (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') &&
          !validatedData.slaActual &&
          serviceRequest.requestedDate
        ) {
          const resolvedDate = new Date()
          const hours = (resolvedDate.getTime() - new Date(serviceRequest.requestedDate).getTime()) / (1000 * 60 * 60)
          slaActual = Math.round(hours)
        }

        const updateData: any = {
          ...validatedData,
          updatedById: userInfo.userId,
          dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
          cost: validatedData.cost !== undefined ? validatedData.cost : undefined,
          slaActual,
        }

        // Set resolved date if status is RESOLVED or CLOSED
        if (
          (validatedData.status === 'RESOLVED' || validatedData.status === 'CLOSED') &&
          !serviceRequest.resolvedDate
        ) {
          updateData.resolvedDate = new Date()
        }

        const updatedRequest = await prisma.operationsServiceRequest.update({
          where: { id: params.id },
          data: updateData,
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
            updatedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({ request: updatedRequest })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating service request:', error)
        return NextResponse.json(
          { error: 'Failed to update service request', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete service request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const serviceRequest = await prisma.operationsServiceRequest.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
          },
        })

        if (!serviceRequest) {
          return NextResponse.json(
            { error: 'Service request not found' },
            { status: 404 }
          )
        }

        await prisma.operationsServiceRequest.delete({
          where: { id: params.id },
        })

        return NextResponse.json({ message: 'Service request deleted successfully' })
      } catch (error) {
        console.error('Error deleting service request:', error)
        return NextResponse.json(
          { error: 'Failed to delete service request' },
          { status: 500 }
        )
      }
    }
  )
}


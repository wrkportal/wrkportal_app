import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const assignWorkOrderSchema = z.object({
  assignedToId: z.string().min(1),
})

// POST - Assign work order to user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    req,
    { resource: 'operations', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const validatedData = assignWorkOrderSchema.parse(body)

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

        // Verify assigned user exists and belongs to tenant
        const assignedUser = await prisma.user.findFirst({
          where: {
            id: validatedData.assignedToId,
            tenantId: userInfo.tenantId,
          },
        })

        if (!assignedUser) {
          return NextResponse.json(
            { error: 'Assigned user not found' },
            { status: 404 }
          )
        }

        const updated = await prisma.operationsWorkOrder.update({
          where: { id: params.id },
          data: {
            assignedToId: validatedData.assignedToId,
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

        return NextResponse.json(updated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid input', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error assigning work order:', error)
        return NextResponse.json(
          { error: 'Failed to assign work order' },
          { status: 500 }
        )
      }
    }
  )
}


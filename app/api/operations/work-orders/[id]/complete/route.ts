import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const completeWorkOrderSchema = z.object({
  actualCost: z.number().optional(),
  actualHours: z.number().optional(),
  notes: z.string().optional(),
})

// POST - Mark work order as complete
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
        const validatedData = completeWorkOrderSchema.parse(body)

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

        const updated = await prisma.operationsWorkOrder.update({
          where: { id: params.id },
          data: {
            status: 'COMPLETED',
            completedDate: new Date(),
            actualCost: validatedData.actualCost,
            actualHours: validatedData.actualHours,
            notes: validatedData.notes ? `${workOrder.notes || ''}\n${validatedData.notes}`.trim() : workOrder.notes,
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
        console.error('Error completing work order:', error)
        return NextResponse.json(
          { error: 'Failed to complete work order' },
          { status: 500 }
        )
      }
    }
  )
}


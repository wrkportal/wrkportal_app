import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const approveCostSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
})

// POST /api/finance/costs/[id]/approve - Approve/Reject cost
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Finance, Admin can approve
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'EXECUTIVE']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const cost = await prisma.costActual.findFirst({
      where: {
        id: params.id,
        budget: {
          tenantId: (session.user as any).tenantId,
        },
      },
    })

    if (!cost) {
      return NextResponse.json({ error: 'Cost not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = approveCostSchema.parse(body)

    if (data.action === 'approve') {
      const updatedCost = await prisma.costActual.update({
        where: { id: params.id },
        data: {
          approvedBy: (session.user as any).id,
          approvedAt: new Date(),
        },
        include: {
          budget: {
            select: { id: true, name: true },
          },
          category: {
            select: { id: true, name: true },
          },
          approvedByUser: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      return NextResponse.json({ cost: updatedCost })
    } else {
      // Reject - delete the cost entry
      await prisma.costActual.delete({
        where: { id: params.id },
      })

      return NextResponse.json({ message: 'Cost rejected and deleted' })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error approving cost:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: error.message },
      { status: 500 }
    )
  }
}


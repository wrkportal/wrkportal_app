import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCostSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  costType: z.enum(['DIRECT', 'INDIRECT', 'FIXED', 'VARIABLE']).optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  costCenter: z.string().optional(),
})

// GET /api/finance/costs/[id] - Get cost details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cost = await prisma.costActual.findFirst({
      where: {
        id: params.id,
        budget: {
          tenantId: (session.user as any).tenantId,
        },
      },
      include: {
        budget: {
          select: { id: true, name: true, totalAmount: true, status: true },
        },
        category: {
          select: { id: true, name: true, allocatedAmount: true, spentAmount: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
        task: {
          select: { id: true, title: true },
        },
        invoice: {
          select: { id: true, invoiceNumber: true, totalAmount: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!cost) {
      return NextResponse.json({ error: 'Cost not found' }, { status: 404 })
    }

    return NextResponse.json({ cost })
  } catch (error: any) {
    console.error('Error fetching cost:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cost', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/costs/[id] - Update cost
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER']
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
      include: {
        budget: true,
      },
    })

    if (!cost) {
      return NextResponse.json({ error: 'Cost not found' }, { status: 404 })
    }

    // Check if budget is locked
    if (cost.budget.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cannot modify costs in a locked budget' },
        { status: 400 }
      )
    }

    // Only creator or finance/admin can edit
    if (cost.createdById !== (session.user as any).id && 
        userRole !== 'FINANCE_CONTROLLER' && 
        userRole !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions to edit this cost' }, { status: 403 })
    }

    const body = await request.json()
    const data = updateCostSchema.parse(body)

    // If amount changed, update category spent amount
    if (data.amount !== undefined && data.amount !== Number(cost.amount)) {
      const oldAmount = Number(cost.amount)
      const newAmount = data.amount
      const difference = newAmount - oldAmount

      if (cost.budgetCategoryId) {
        await prisma.budgetCategory.update({
          where: { id: cost.budgetCategoryId },
          data: {
            spentAmount: {
              increment: difference,
            },
          },
        })
      }
    }

    const updatedCost = await prisma.costActual.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ cost: updatedCost })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating cost:', error)
    return NextResponse.json(
      { error: 'Failed to update cost', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/costs/[id] - Delete cost
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN']
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
      include: {
        budget: true,
      },
    })

    if (!cost) {
      return NextResponse.json({ error: 'Cost not found' }, { status: 404 })
    }

    // Check if budget is locked
    if (cost.budget.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cannot delete costs from a locked budget' },
        { status: 400 }
      )
    }

    // Update category spent amount before deleting
    if (cost.budgetCategoryId) {
      await prisma.budgetCategory.update({
        where: { id: cost.budgetCategoryId },
        data: {
          spentAmount: {
            decrement: Number(cost.amount),
          },
        },
      })
    }

    await prisma.costActual.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Cost deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting cost:', error)
    return NextResponse.json(
      { error: 'Failed to delete cost', details: error.message },
      { status: 500 }
    )
  }
}


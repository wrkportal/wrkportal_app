import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const updateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  totalAmount: z.number().positive().optional(),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'LOCKED', 'ARCHIVED']).optional(),
  startDate: z.string().transform((str) => new Date(str)).optional(),
  endDate: z.string().transform((str) => new Date(str)).optional(),
})

// GET /api/finance/budgets/[id] - Get budget details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    type BudgetWithIncludes = Prisma.BudgetGetPayload<{
      include: {
        project: {
          select: {
            id: true
            name: true
            code: true
          }
        }
        program: {
          select: {
            id: true
            name: true
            code: true
          }
        }
        createdBy: {
          select: {
            id: true
            name: true
            email: true
          }
        }
        approvedByUser: {
          select: {
            id: true
            name: true
            email: true
          }
        }
        categories: {
          include: {
            lineItems: true
            actuals: true
            subCategories: {
              include: {
                subCategories: true
              }
            }
          }
        }
        lineItems: true
        forecasts: true
        actuals: {
          include: {
            category: true
            project: {
              select: {
                id: true
                name: true
                code: true
              }
            }
            createdBy: {
              select: {
                id: true
                name: true
                email: true
              }
            }
          }
        }
        approvals: {
          include: {
            approver: {
              select: {
                id: true
                name: true
                email: true
              }
            }
          }
        }
      }
    }>

    type CostActual = BudgetWithIncludes['actuals'][0]

    const budget = (await prisma.budget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        program: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
        categories: {
          where: { parentCategoryId: null },
          include: {
            lineItems: true,
            actuals: {
              take: 10,
              orderBy: { date: 'desc' },
            },
            subCategories: {
              include: {
                subCategories: true,
              },
            },
          },
        },
        lineItems: true,
        forecasts: {
          orderBy: { generatedAt: 'desc' },
          take: 5,
        },
        actuals: {
          orderBy: { date: 'desc' },
          take: 50,
          include: {
            category: true,
            project: {
              select: { id: true, name: true, code: true },
            },
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    })) as BudgetWithIncludes | null

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Calculate totals
    const totalSpent = budget.actuals.reduce((sum: number, cost: CostActual) => sum + Number(cost.amount), 0)
    const totalCommitted = budget.actuals
      .filter((c: CostActual) => !c.approvedAt)
      .reduce((sum: number, cost: CostActual) => sum + Number(cost.amount), 0)
    const totalAmount = Number(budget.totalAmount)
    const variance = totalAmount - totalSpent

    return NextResponse.json({
      budget: {
        ...budget,
        totalAmount,
        spentAmount: totalSpent,
        committedAmount: totalCommitted,
        variance,
        utilizationPercent: totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/budgets/[id] - Update budget
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Allow finance controllers, admins, project managers, and platform owner
    const userRole = (session.user as any).role
    const allowedRoles = ['PLATFORM_OWNER', 'FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER', 'PMO_LEAD']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions', 
        details: `Your role (${userRole}) does not have permission to update budgets. Required roles: ${allowedRoles.join(', ')}` 
      }, { status: 403 })
    }

    const budget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Check if budget is locked
    if (budget.status === 'LOCKED') {
      return NextResponse.json({ error: 'Budget is locked and cannot be modified' }, { status: 400 })
    }

    const body = await request.json()
    const data = updateBudgetSchema.parse(body)

    const updatedBudget = await prisma.budget.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        categories: true,
        project: {
          select: { id: true, name: true, code: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ budget: updatedBudget })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/budgets/[id] - Delete budget
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Allow finance controllers, admins, project managers, and platform owner
    const userRole = (session.user as any).role
    const allowedRoles = ['PLATFORM_OWNER', 'FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER', 'PMO_LEAD']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions', 
        details: `Your role (${userRole}) does not have permission to update budgets. Required roles: ${allowedRoles.join(', ')}` 
      }, { status: 403 })
    }

    const budget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Only allow deletion of DRAFT budgets
    if (budget.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only DRAFT budgets can be deleted' },
        { status: 400 }
      )
    }

    await prisma.budget.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Budget deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting budget:', error)
    return NextResponse.json(
      { error: 'Failed to delete budget', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const approveBudgetSchema = z.object({
  action: z.enum(['approve', 'reject']),
  comments: z.string().optional(),
  level: z.number().int().min(1).optional(),
})

// POST /api/finance/budgets/[id]/approve - Approve/Reject budget
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - Finance, Admin, or Executive can approve
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'EXECUTIVE', 'PMO_LEAD']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    type BudgetWithApprovals = Prisma.BudgetGetPayload<{
      include: {
        approvals: true
      }
    }>

    type BudgetApproval = BudgetWithApprovals['approvals'][0]

    const budget = (await prisma.budget.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
      include: {
        approvals: {
          orderBy: { level: 'asc' },
        },
      },
    })) as BudgetWithApprovals | null

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = approveBudgetSchema.parse(body)

    // Determine approval level
    const approvalLevel = data.level || (budget.approvals.length > 0 
      ? Math.max(...budget.approvals.map((a: BudgetApproval) => a.level)) + 1 
      : 1)

    if (data.action === 'approve') {
      // Create or update approval record
      await prisma.budgetApproval.upsert({
        where: {
          id: budget.approvals.find((a: BudgetApproval) => a.approverId === (session.user as any).id && a.level === approvalLevel)?.id || '',
        },
        create: {
          budgetId: budget.id,
          approverId: (session.user as any).id,
          level: approvalLevel,
          status: 'APPROVED',
          comments: data.comments,
          approvedAt: new Date(),
        },
        update: {
          status: 'APPROVED',
          comments: data.comments,
          approvedAt: new Date(),
        },
      })

      // Check if all required approvals are complete
      // For now, if this is level 1 or the only approval, mark budget as approved
      // In a real system, you'd have configurable approval workflows
      type BudgetApprovalModel = Prisma.BudgetApprovalGetPayload<{}>

      const allApprovals = await prisma.budgetApproval.findMany({
        where: { budgetId: budget.id },
      })

      const allApproved = allApprovals.every((a: BudgetApprovalModel) => a.status === 'APPROVED')
      
      if (allApproved || approvalLevel === 1) {
        await prisma.budget.update({
          where: { id: budget.id },
          data: {
            status: 'APPROVED',
            approvedBy: (session.user as any).id,
            approvedAt: new Date(),
          },
        })
      } else {
        // Still pending more approvals
        await prisma.budget.update({
          where: { id: budget.id },
          data: {
            status: 'PENDING_APPROVAL',
          },
        })
      }
    } else {
      // Reject
      await prisma.budgetApproval.upsert({
        where: {
          id: budget.approvals.find((a: BudgetApproval) => a.approverId === (session.user as any).id && a.level === approvalLevel)?.id || '',
        },
        create: {
          budgetId: budget.id,
          approverId: (session.user as any).id,
          level: approvalLevel,
          status: 'REJECTED',
          comments: data.comments,
        },
        update: {
          status: 'REJECTED',
          comments: data.comments,
        },
      })

      await prisma.budget.update({
        where: { id: budget.id },
        data: {
          status: 'DRAFT',
        },
      })
    }

    const updatedBudget = await prisma.budget.findUnique({
      where: { id: budget.id },
      include: {
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { level: 'asc' },
        },
      },
    })

    return NextResponse.json({ budget: updatedBudget })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error approving budget:', error)
    return NextResponse.json(
      { error: 'Failed to process approval', details: error.message },
      { status: 500 }
    )
  }
}


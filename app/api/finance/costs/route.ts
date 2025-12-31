import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Cost creation schema
const createCostSchema = z.object({
  budgetId: z.string(),
  budgetCategoryId: z.string().optional(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  costCenter: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  costType: z.enum(['DIRECT', 'INDIRECT', 'FIXED', 'VARIABLE']).default('DIRECT'),
  source: z.enum(['MANUAL', 'TIMESHEET', 'INVOICE', 'FILE_UPLOAD', 'AI_EXTRACTED']).default('MANUAL'),
  sourceId: z.string().optional(),
  invoiceId: z.string().optional(),
  date: z.string().transform((str) => new Date(str)),
  requiresApproval: z.boolean().optional(),
})

// GET /api/finance/costs - List costs
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const budgetId = searchParams.get('budgetId')
    const projectId = searchParams.get('projectId')
    const costType = searchParams.get('costType')
    const source = searchParams.get('source')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const approved = searchParams.get('approved')

    const where: any = {
      budget: {
        tenantId: (session.user as any).tenantId,
      },
    }

    if (budgetId) where.budgetId = budgetId
    if (projectId) where.projectId = projectId
    if (costType) where.costType = costType
    if (source) where.source = source
    if (startDate) where.date = { gte: new Date(startDate) }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) }
    }
    if (approved === 'true') {
      where.approvedAt = { not: null }
    } else if (approved === 'false') {
      where.approvedAt = null
    }

    const costs = await prisma.costActual.findMany({
      where,
      include: {
        budget: {
          select: { id: true, name: true, totalAmount: true },
        },
        category: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
        task: {
          select: { id: true, title: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 100,
    })

    // Calculate totals
    const totalAmount = costs.reduce((sum, cost) => sum + Number(cost.amount), 0)
    const approvedAmount = costs
      .filter((c) => c.approvedAt)
      .reduce((sum, cost) => sum + Number(cost.amount), 0)
    const pendingAmount = costs
      .filter((c) => !c.approvedAt)
      .reduce((sum, cost) => sum + Number(cost.amount), 0)

    return NextResponse.json({
      costs,
      summary: {
        totalAmount,
        approvedAmount,
        pendingAmount,
        count: costs.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching costs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch costs', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/costs - Create cost entry
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const data = createCostSchema.parse(body)

    // Verify budget exists and belongs to tenant
    const budget = await prisma.budget.findFirst({
      where: {
        id: data.budgetId,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!budget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 })
    }

    // Check if budget is locked
    if (budget.status === 'LOCKED') {
      return NextResponse.json(
        { error: 'Cannot add costs to a locked budget' },
        { status: 400 }
      )
    }

    // Check if amount exceeds budget (warning, not error)
    const existingCosts = await prisma.costActual.findMany({
      where: { budgetId: data.budgetId },
    })
    const totalSpent = existingCosts.reduce((sum, c) => sum + Number(c.amount), 0)
    const budgetTotal = Number(budget.totalAmount)

    // Auto-approve if amount is below threshold (e.g., $1000)
    const approvalThreshold = 1000
    const requiresApproval = data.requiresApproval ?? (data.amount > approvalThreshold)

    // Create cost
    const cost = await prisma.costActual.create({
      data: {
        budgetId: data.budgetId,
        budgetCategoryId: data.budgetCategoryId,
        projectId: data.projectId,
        taskId: data.taskId,
        costCenter: data.costCenter,
        name: data.name,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        costType: data.costType,
        source: data.source,
        sourceId: data.sourceId,
        invoiceId: data.invoiceId,
        date: data.date,
        createdById: (session.user as any).id,
        // Auto-approve if below threshold
        approvedBy: requiresApproval ? null : (session.user as any).id,
        approvedAt: requiresApproval ? null : new Date(),
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

    // Update budget category spent amount
    if (data.budgetCategoryId) {
      await prisma.budgetCategory.update({
        where: { id: data.budgetCategoryId },
        data: {
          spentAmount: {
            increment: data.amount,
          },
        },
      })
    }

    // Check for budget alerts (if exceeds thresholds)
    const newTotalSpent = totalSpent + data.amount
    const utilizationPercent = (newTotalSpent / budgetTotal) * 100

    return NextResponse.json({
      cost,
      warnings: {
        budgetExceeded: newTotalSpent > budgetTotal,
        utilizationPercent,
        thresholdAlerts: [
          utilizationPercent >= 90 ? 'Budget 90% utilized' : null,
          utilizationPercent >= 100 ? 'Budget exceeded!' : null,
        ].filter(Boolean),
      },
    }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating cost:', error)
    return NextResponse.json(
      { error: 'Failed to create cost', details: error.message },
      { status: 500 }
    )
  }
}


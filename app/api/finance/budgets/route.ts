import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Budget creation schema
const subSubCategorySchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  allocatedAmount: z.number().min(0),
})

const subCategorySchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  allocatedAmount: z.number().min(0),
  subSubCategories: z.array(subSubCategorySchema).optional(),
})

const categorySchema = z.object({
  name: z.string(),
  code: z.string().optional(),
  allocatedAmount: z.number().min(0), // Changed from positive() to min(0) to allow 0
  percentage: z.number().min(0).max(100).optional(),
  subCategories: z.array(subCategorySchema).optional(),
})

const createBudgetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
  programId: z.string().optional(),
  portfolioId: z.string().optional(),
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalQuarter: z.number().int().min(1).max(4).optional(),
  totalAmount: z.number().positive(),
  currency: z.string().default('USD'),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  categories: z.array(categorySchema).optional(),
  monthlyData: z.record(z.any()).optional(), // Allow monthly data to be passed
})

// GET /api/finance/budgets - List budgets
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const programId = searchParams.get('programId')
    const status = searchParams.get('status')
    const fiscalYear = searchParams.get('fiscalYear')

    const where: any = {
      tenantId: (session.user as any).tenantId,
    }

    if (projectId) where.projectId = projectId
    if (programId) where.programId = programId
    if (status) where.status = status
    if (fiscalYear) where.fiscalYear = parseInt(fiscalYear)

    type BudgetWithSelected = Prisma.BudgetGetPayload<{
      select: {
        id: true
        name: true
        description: true
        totalAmount: true
        currency: true
        fiscalYear: true
        fiscalQuarter: true
        startDate: true
        endDate: true
        status: true
        createdAt: true
        updatedAt: true
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
          select: {
            id: true
            name: true
            code: true
            allocatedAmount: true
            spentAmount: true
            committedAmount: true
            percentage: true
          }
        }
        _count: {
          select: {
            actuals: true
            forecasts: true
          }
        }
      }
    }>

    type CostActual = Prisma.CostActualGetPayload<{}>

    const budgets = await prisma.budget.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        totalAmount: true,
        currency: true,
        fiscalYear: true,
        fiscalQuarter: true,
        startDate: true,
        endDate: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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
          select: {
            id: true,
            name: true,
            code: true,
            allocatedAmount: true,
            spentAmount: true,
            committedAmount: true,
            percentage: true,
          },
        },
        _count: {
          select: {
            actuals: true,
            forecasts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate spent, committed, variance for each budget
    const budgetsWithCalculations = await Promise.all(
      budgets.map(async (budget: BudgetWithSelected) => {
        const actuals: CostActual[] = await prisma.costActual.findMany({
          where: { budgetId: budget.id },
        })

        const totalSpent = actuals.reduce((sum: number, cost: CostActual) => sum + Number(cost.amount), 0)
        const totalCommitted = actuals
          .filter((c: CostActual) => c.approvedAt && !c.approvedAt) // Pending approvals
          .reduce((sum: number, cost: CostActual) => sum + Number(cost.amount), 0)

        const totalAmount = Number(budget.totalAmount)
        const variance = totalAmount - totalSpent

        return {
          ...budget,
          totalAmount: totalAmount,
          spentAmount: totalSpent,
          committedAmount: totalCommitted,
          variance: variance,
          utilizationPercent: totalAmount > 0 ? (totalSpent / totalAmount) * 100 : 0,
        }
      })
    )

    return NextResponse.json({ budgets: budgetsWithCalculations })
  } catch (error: any) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budgets', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/budgets - Create budget
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check finance role permission - Allow finance controllers, admins, project managers, and platform owner
    const userRole = (session.user as any).role
    const allowedRoles = ['PLATFORM_OWNER', 'FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER', 'PMO_LEAD']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions', 
        details: `Your role (${userRole}) does not have permission to create budgets. Required roles: ${allowedRoles.join(', ')}` 
      }, { status: 403 })
    }

    const body = await request.json()
    const data = createBudgetSchema.parse(body)

    // Validate dates
    if (data.endDate <= data.startDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
    }

    // Calculate category percentages if not provided
    const categories = data.categories?.map((cat) => ({
      ...cat,
      percentage: cat.allocatedAmount > 0 ? (cat.percentage ?? (cat.allocatedAmount / data.totalAmount) * 100) : 0,
    })) || []

    // Validate category totals (only if categories exist)
    if (categories.length > 0) {
      const categoryTotal = categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0)
      if (Math.abs(categoryTotal - data.totalAmount) > 0.01) {
        return NextResponse.json(
          { error: 'Category allocations must equal total budget amount', details: `Category total: ${categoryTotal}, Budget total: ${data.totalAmount}` },
          { status: 400 }
        )
      }
    }

    // Create budget first
    const budget = await prisma.budget.create({
      data: {
        tenantId: (session.user as any).tenantId,
        name: data.name,
        description: data.description,
        projectId: data.projectId || null,
        programId: data.programId || null,
        portfolioId: data.portfolioId || null,
        fiscalYear: data.fiscalYear,
        fiscalQuarter: data.fiscalQuarter || null,
        totalAmount: data.totalAmount,
        currency: data.currency,
        startDate: data.startDate,
        endDate: data.endDate,
        status: 'DRAFT',
        createdById: (session.user as any).id,
      },
    })

    // Create categories separately if any exist
    if (categories.length > 0) {
      try {
        for (const cat of categories) {
          // Create top-level category
          const category = await prisma.budgetCategory.create({
            data: {
              budgetId: budget.id,
              name: cat.name,
              code: cat.code || null,
              allocatedAmount: Number(cat.allocatedAmount),
              percentage: Number(cat.percentage || 0),
            },
          })

          // Create sub-categories if any
          if (cat.subCategories && cat.subCategories.length > 0) {
            for (const subCat of cat.subCategories) {
              const subCategory = await prisma.budgetCategory.create({
                data: {
                  budgetId: budget.id,
                  name: subCat.name,
                  code: subCat.code || null,
                  allocatedAmount: Number(subCat.allocatedAmount || 0),
                  percentage: Number(cat.allocatedAmount > 0 ? ((subCat.allocatedAmount || 0) / cat.allocatedAmount) * 100 : 0),
                },
              })

              // Create sub-sub-categories if any
              if (subCat.subSubCategories && subCat.subSubCategories.length > 0) {
                for (const subSubCat of subCat.subSubCategories) {
                  await prisma.budgetCategory.create({
                    data: {
                      budgetId: budget.id,
                      name: subSubCat.name,
                      code: subSubCat.code || null,
                      allocatedAmount: Number(subSubCat.allocatedAmount || 0),
                      percentage: Number((subCat.allocatedAmount || 0) > 0 ? ((subSubCat.allocatedAmount || 0) / (subCat.allocatedAmount || 1)) * 100 : 0),
                    },
                  })
                }
              }
            }
          }
        }
      } catch (categoryError: any) {
        console.error('Error creating categories:', categoryError)
        console.error('Category error details:', {
          code: categoryError.code,
          meta: categoryError.meta,
          message: categoryError.message,
        })
        // Continue even if categories fail - budget is already created
      }
    }

    // Fetch the budget with all relations
    try {
      const budgetWithRelations = await prisma.budget.findUnique({
        where: { id: budget.id },
        include: {
          categories: true,
          project: {
            select: { id: true, name: true, code: true },
          },
          program: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, name: true, email: true },
          },
        },
      })

      return NextResponse.json({ budget: budgetWithRelations }, { status: 201 })
    } catch (fetchError: any) {
      console.error('Error fetching budget with relations:', fetchError)
      // Return the budget even if relations fail
      return NextResponse.json({ budget }, { status: 201 })
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating budget:', error)
    console.error('Error stack:', error.stack)
    console.error('Error code:', error.code)
    console.error('Error meta:', error.meta)
    return NextResponse.json(
      { 
        error: 'Failed to create budget', 
        details: error.message,
        code: error.code,
        meta: error.meta
      },
      { status: 500 }
    )
  }
}


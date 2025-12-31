import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createPricingModelSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  pricingType: z.enum(['FIXED_PRICE', 'TIME_MATERIALS', 'COST_PLUS', 'HYBRID']),
  baseAmount: z.number().nonnegative().optional(),
  markupPercentage: z.number().min(0).max(100).optional(),
  currency: z.string().default('USD'),
  lineItems: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().nonnegative().optional(),
      unitPrice: z.number().nonnegative(),
      totalPrice: z.number().nonnegative(),
      category: z.string().optional(),
    })
  ).optional(),
})

// GET /api/finance/pricing-models - List pricing models
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')

    const where: any = {
      tenantId: (session.user as any).tenantId,
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status

    const pricingModels = await prisma.pricingModel.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        lineItems: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ pricingModels })
  } catch (error: any) {
    console.error('Error fetching pricing models:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pricing models', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/pricing-models - Create pricing model
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
    const data = createPricingModelSchema.parse(body)

    // Verify project if provided
    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          tenantId: (session.user as any).tenantId,
        },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    // Create pricing model
    const pricingModel = await prisma.pricingModel.create({
      data: {
        tenantId: (session.user as any).tenantId,
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        pricingType: data.pricingType,
        baseAmount: data.baseAmount,
        markupPercentage: data.markupPercentage,
        currency: data.currency,
        createdBy: {
          connect: { id: (session.user as any).id },
        },
        lineItems: data.lineItems ? {
          create: data.lineItems.map((item) => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            category: item.category,
          })),
        } : undefined,
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        lineItems: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ pricingModel }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating pricing model:', error)
    return NextResponse.json(
      { error: 'Failed to create pricing model', details: error.message },
      { status: 500 }
    )
  }
}


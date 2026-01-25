import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const lineItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  quantity: z.number().nonnegative().optional(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  category: z.string().optional(),
})

const createPricingModelSchema = z.object({
  projectId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  pricingType: z.enum(['FIXED_PRICE', 'TIME_MATERIALS', 'COST_PLUS', 'HYBRID']),
  baseAmount: z.number().nonnegative().optional(),
  markupPercentage: z.number().min(0).max(100).optional(),
  currency: z.string().default('USD'),
  lineItems: z.array(lineItemSchema).optional(),
})

type LineItem = z.infer<typeof lineItemSchema>

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
    const pricingModelData: Prisma.PricingModelUncheckedCreateInput = {
      tenantId: (session.user as any).tenantId,
      name: data.name,
      pricingType: data.pricingType,
      currency: data.currency,
      createdById: (session.user as any).id,
    }

    // Conditionally add optional fields
    if (data.projectId) {
      pricingModelData.projectId = data.projectId
    }
    if (data.description) pricingModelData.description = data.description
    if (data.baseAmount !== undefined) pricingModelData.baseAmount = data.baseAmount
    if (data.markupPercentage !== undefined) pricingModelData.markupPercentage = data.markupPercentage
    if (data.lineItems && data.lineItems.length > 0) {
      const lineItems: LineItem[] = data.lineItems
      pricingModelData.lineItems = {
        create: lineItems.map((item: LineItem) => {
          const lineItemData: Prisma.PricingLineItemCreateWithoutPricingModelInput = {
            name: item.name,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          }
          if (item.description) lineItemData.description = item.description
          if (item.quantity !== undefined) lineItemData.quantity = item.quantity
          if (item.category) lineItemData.category = item.category
          return lineItemData
        }),
      } as any
    }

    const pricingModel = await prisma.pricingModel.create({
      data: pricingModelData,
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


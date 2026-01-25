import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createRateCardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)),
  expiryDate: z.string().transform((str) => new Date(str)).optional(),
  currency: z.string().default('USD'),
  items: z.array(
    z.object({
      role: z.string().min(1),
      region: z.string().optional(),
      costRate: z.number().positive(),
      billableRate: z.number().positive(),
      currency: z.string().default('USD'),
      effectiveDate: z.string().transform((str) => new Date(str)),
      expiryDate: z.string().transform((str) => new Date(str)).optional(),
      notes: z.string().optional(),
    })
  ).min(1),
})

// GET /api/finance/rate-cards - List rate cards
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const active = searchParams.get('active') === 'true'

    const where: any = {
      tenantId: (session.user as any).tenantId,
    }

    if (active) {
      const today = new Date()
      where.effectiveDate = { lte: today }
      where.OR = [
        { expiryDate: null },
        { expiryDate: { gte: today } },
      ]
    }

    const rateCards = await prisma.rateCard.findMany({
      where,
      include: {
        rates: {
          orderBy: [{ role: 'asc' }, { region: 'asc' }],
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        effectiveDate: 'desc',
      },
    })

    return NextResponse.json({ rateCards })
  } catch (error: any) {
    console.error('Error fetching rate cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate cards', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/rate-cards - Create rate card
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const data = createRateCardSchema.parse(body)

    // Create rate card with items
    const rateCardData: Prisma.RateCardUncheckedCreateInput = {
      tenantId: (session.user as any).tenantId,
      name: data.name,
      effectiveDate: data.effectiveDate,
      currency: data.currency,
      createdById: (session.user as any).id,
    }

    // Conditionally add optional fields
    if (data.description) rateCardData.description = data.description
    if (data.expiryDate) rateCardData.expiryDate = data.expiryDate

    // Add rates
    rateCardData.rates = {
      create: data.items.map((item) => {
        const rateData: Prisma.RateCardItemCreateWithoutRateCardInput = {
          role: item.role,
          costRate: item.costRate,
          billableRate: item.billableRate,
          currency: item.currency,
          effectiveDate: item.effectiveDate,
        }
        if (item.region) rateData.region = item.region
        if (item.expiryDate) rateData.expiryDate = item.expiryDate
        if (item.notes) rateData.notes = item.notes
        return rateData
      }),
    } as any

    const rateCard = await prisma.rateCard.create({
      data: rateCardData as any,
      include: {
        rates: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ rateCard }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating rate card:', error)
    return NextResponse.json(
      { error: 'Failed to create rate card', details: error.message },
      { status: 500 }
    )
  }
}


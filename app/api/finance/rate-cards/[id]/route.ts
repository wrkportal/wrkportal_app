import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRateCardSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  effectiveDate: z.string().transform((str) => new Date(str)).optional(),
  expiryDate: z.string().transform((str) => new Date(str)).optional().nullable(),
  currency: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string().optional(),
      role: z.string().min(1),
      region: z.string().optional(),
      costRate: z.number().positive(),
      billableRate: z.number().positive(),
      currency: z.string().default('USD'),
      effectiveDate: z.string().transform((str) => new Date(str)),
      expiryDate: z.string().transform((str) => new Date(str)).optional(),
      notes: z.string().optional(),
    })
  ).optional(),
})

// GET /api/finance/rate-cards/[id] - Get rate card
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateCard = await prisma.rateCard.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
      include: {
        rates: {
          orderBy: [{ role: 'asc' }, { region: 'asc' }],
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card not found' }, { status: 404 })
    }

    return NextResponse.json({ rateCard })
  } catch (error: any) {
    console.error('Error fetching rate card:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rate card', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/rate-cards/[id] - Update rate card
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
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const rateCard = await prisma.rateCard.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = updateRateCardSchema.parse(body)

    // Update rate card
    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.effectiveDate !== undefined) updateData.effectiveDate = data.effectiveDate
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate
    if (data.currency !== undefined) updateData.currency = data.currency

    // Handle items update
    if (data.items !== undefined) {
      // Delete existing rates
      await prisma.rateCardItem.deleteMany({
        where: { rateCardId: params.id },
      })

      // Create new rates
      updateData.rates = {
        create: data.items.map((item) => ({
          role: item.role,
          region: item.region,
          costRate: item.costRate,
          billableRate: item.billableRate,
          currency: item.currency,
          effectiveDate: item.effectiveDate,
          expiryDate: item.expiryDate,
          notes: item.notes,
        })),
      }
    }

    const updated = await prisma.rateCard.update({
      where: { id: params.id },
      data: updateData,
      include: {
        rates: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ rateCard: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating rate card:', error)
    return NextResponse.json(
      { error: 'Failed to update rate card', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/rate-cards/[id] - Delete rate card
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

    const rateCard = await prisma.rateCard.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!rateCard) {
      return NextResponse.json({ error: 'Rate card not found' }, { status: 404 })
    }

    await prisma.rateCard.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Rate card deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting rate card:', error)
    return NextResponse.json(
      { error: 'Failed to delete rate card', details: error.message },
      { status: 500 }
    )
  }
}


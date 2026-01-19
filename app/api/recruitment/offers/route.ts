import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const offerSchema = z.object({
  candidateName: z.string().min(1),
  jobTitle: z.string().min(1),
  offerAmount: z.string().min(1),
  status: z
    .enum(['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'])
    .default('PENDING'),
  notes: z.string().optional().nullable(),
})

// GET /api/recruitment/offers - List all offers
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // For now, return empty array since we don't have a RecruitmentOffer model
    // TODO: Create RecruitmentOffer model and query from database
    const offers: any[] = []

    return NextResponse.json({ offers })
  } catch (error: any) {
    console.error('Error fetching offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/offers - Create a new offer
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = offerSchema.parse(body)

    // For now, return success with generated ID
    // TODO: Create RecruitmentOffer model and save to database
    const newOffer = {
      id: `offer-${Date.now()}`,
      ...validatedData,
      extendedDate: new Date().toISOString(),
      responseDate: null,
    }

    return NextResponse.json({ offer: newOffer }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating offer:', error)
    return NextResponse.json(
      { error: 'Failed to create offer', details: error.message },
      { status: 500 }
    )
  }
}

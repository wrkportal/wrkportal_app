import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating a check-in
const createCheckInSchema = z.object({
  value: z.number(),
  confidence: z.number().int().min(1).max(10),
  narrative: z.string().optional(),
})

// POST /api/okrs/[id]/key-results/[krId]/check-in - Create a check-in
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; krId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCheckInSchema.parse(body)

    // Create check-in and update key result
    const [checkIn, keyResult] = await prisma.$transaction([
      // Create check-in
      prisma.kRCheckIn.create({
        data: {
          keyResultId: params.krId,
          value: validatedData.value,
          confidence: validatedData.confidence,
          narrative: validatedData.narrative,
          createdById: session.user.id,
        },
      }),
      // Update key result current value and confidence
      prisma.keyResult.update({
        where: { id: params.krId },
        data: {
          currentValue: validatedData.value,
          confidence: validatedData.confidence,
        },
      }),
    ])

    return NextResponse.json({ checkIn, keyResult }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating check-in:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const interviewSchema = z.object({
  candidateId: z.string().min(1),
  candidateName: z.string().min(1),
  jobTitle: z.string().min(1),
  interviewer: z.string().min(1),
  type: z.enum(['PHONE', 'VIDEO', 'ONSITE', 'PANEL']),
  status: z
    .enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
    .default('SCHEDULED'),
  scheduledDate: z.string(),
  duration: z.number().min(15).max(480),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/recruitment/interviews - List all interviews
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // For now, return empty array since we don't have a RecruitmentInterview model
    // TODO: Create RecruitmentInterview model and query from database
    const interviews: any[] = []

    return NextResponse.json({ interviews })
  } catch (error: any) {
    console.error('Error fetching interviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch interviews', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/interviews - Create a new interview
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = interviewSchema.parse(body)

    // For now, return success with generated ID
    // TODO: Create RecruitmentInterview model and save to database
    const newInterview = {
      id: `interview-${Date.now()}`,
      ...validatedData,
    }

    return NextResponse.json({ interview: newInterview }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating interview:', error)
    return NextResponse.json(
      { error: 'Failed to create interview', details: error.message },
      { status: 500 }
    )
  }
}

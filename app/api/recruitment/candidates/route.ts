import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const candidateSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  linkedin: z.string().url().optional().nullable(),
  position: z.string().optional().nullable(),
  status: z
    .enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'])
    .default('APPLIED'),
  source: z
    .enum(['LINKEDIN', 'WEBSITE', 'REFERRAL', 'JOB_BOARD', 'RECRUITER'])
    .default('WEBSITE'),
  experience: z.number().optional().nullable(),
  rating: z.enum(['HIGH', 'AVERAGE', 'LOW']).default('AVERAGE'),
  resume: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

// GET /api/recruitment/candidates - List all candidates
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // For now, use User model as candidates (with metadata)
    // TODO: Create dedicated RecruitmentCandidate model
    const where: any = { tenantId }
    if (status && status !== 'all') {
      // Would filter by recruitment status if we had a RecruitmentCandidate model
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform users to candidate format
    const candidates = users.map((u) => ({
      id: u.id,
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email,
      phone: u.phone,
      linkedin: null,
      position: null,
      status: 'APPLIED' as const,
      source: 'WEBSITE' as const,
      experience: null,
      rating: 'AVERAGE' as const,
      resume: null,
      notes: null,
      createdAt: u.createdAt.toISOString(),
    }))

    return NextResponse.json({ candidates })
  } catch (error: any) {
    console.error('Error fetching candidates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch candidates', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/candidates - Create a new candidate
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = candidateSchema.parse(body)

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Candidate with this email already exists' },
        { status: 400 }
      )
    }

    // Create user as candidate
    // TODO: Create dedicated RecruitmentCandidate model instead
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        tenantId,
        role: 'TEAM_MEMBER', // Default role
        status: 'ACTIVE',
      },
    })

    const candidate = {
      id: newUser.id,
      ...validatedData,
      createdAt: newUser.createdAt.toISOString(),
    }

    return NextResponse.json({ candidate }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating candidate:', error)
    return NextResponse.json(
      { error: 'Failed to create candidate', details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const onboardingSchema = z.object({
  employeeName: z.string().min(1),
  jobTitle: z.string().min(1),
  startDate: z.string(),
})

// GET /api/recruitment/onboarding - List all onboarding processes
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // For now, return empty array since we don't have a RecruitmentOnboarding model
    // TODO: Create RecruitmentOnboarding model and query from database
    const onboardings: any[] = []

    return NextResponse.json({ onboardings })
  } catch (error: any) {
    console.error('Error fetching onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to fetch onboarding', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/onboarding - Create a new onboarding process
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const validatedData = onboardingSchema.parse(body)

    // For now, return success with generated ID
    // TODO: Create RecruitmentOnboarding model and save to database
    const defaultTasks = [
      {
        id: '1',
        title: 'Complete paperwork',
        status: 'PENDING',
        dueDate: null,
      },
      { id: '2', title: 'IT setup', status: 'PENDING', dueDate: null },
      {
        id: '3',
        title: 'Orientation session',
        status: 'PENDING',
        dueDate: null,
      },
      { id: '4', title: 'Team introduction', status: 'PENDING', dueDate: null },
    ]

    const newOnboarding = {
      id: `onboarding-${Date.now()}`,
      ...validatedData,
      status: 'PENDING',
      progress: 0,
      tasks: defaultTasks,
    }

    return NextResponse.json({ onboarding: newOnboarding }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating onboarding:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding', details: error.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for creating a goal
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  level: z
    .enum(['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL'])
    .default('TEAM'),
  quarter: z.string(),
  year: z.number().int().min(2020).max(2100),
  ownerId: z.string(),
  status: z
    .enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'])
    .default('ACTIVE'),
  keyResults: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        startValue: z.number(),
        targetValue: z.number(),
        currentValue: z.number(),
        unit: z.string(),
        weight: z.number().int().min(0).max(100).default(25),
        confidence: z.number().int().min(1).max(10).default(5),
      })
    )
    .optional(),
})

// GET /api/okrs - Fetch all goals for the current tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if Goal model exists
    if (!prisma.goal) {
      console.warn('Goal model not available, returning empty array')
      return NextResponse.json({ goals: [] }, { status: 200 })
    }

    // Fetch goals with key results
    const goals = await prisma.goal.findMany({
      where: {
        tenantId: user.tenantId,
      },
      include: {
        keyResults: {
          include: {
            checkIns: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1, // Only get latest check-in
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ goals }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching goals:', error)
    
    // Handle database model not found errors gracefully
    if (error.code === 'P2001' || 
        error.code === 'P2021' || // Table does not exist
        error.code === 'P2022' || // Column does not exist
        error.message?.includes('does not exist') || 
        error.message?.includes('Unknown model') ||
        error.message?.includes('Goal')) {
      console.warn('Goal model not available, returning empty array')
      return NextResponse.json({ goals: [] }, { status: 200 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/okrs - Create a new goal
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { tenantId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = createGoalSchema.parse(body)

    // Create goal with key results
    const goal = await prisma.goal.create({
      data: {
        tenantId: user.tenantId,
        title: validatedData.title,
        description: validatedData.description,
        level: validatedData.level,
        quarter: validatedData.quarter,
        year: validatedData.year,
        ownerId: validatedData.ownerId,
        status: validatedData.status,
        keyResults: {
          create:
            validatedData.keyResults?.map((kr) => ({
              title: kr.title,
              description: kr.description,
              startValue: kr.startValue,
              targetValue: kr.targetValue,
              currentValue: kr.currentValue,
              unit: kr.unit,
              weight: kr.weight,
              confidence: kr.confidence,
            })) || [],
        },
      },
      include: {
        keyResults: true,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

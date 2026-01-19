import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/recruitment/candidates/[id]/timeline - Get candidate timeline/activity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const candidateId = params.id

    // Verify candidate belongs to tenant
    const candidate = await prisma.user.findFirst({
      where: {
        id: candidateId,
        tenantId,
      },
      select: { id: true },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Get all activities related to this candidate
    // This includes: status changes, interviews, offers, notes, emails, etc.
    const activities = await prisma.activityFeed.findMany({
      where: {
        tenantId,
        resourceType: 'CANDIDATE',
        resourceId: candidateId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Transform activities to timeline format
    const timeline = activities.map((activity) => ({
      id: activity.id,
      type: activity.action || 'ACTIVITY',
      title: activity.action || 'Activity',
      description: activity.description || '',
      actor: activity.user
        ? {
            id: activity.user.id,
            name: `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email,
            email: activity.user.email,
            avatar: activity.user.avatar,
          }
        : null,
      metadata: activity.metadata || {},
      createdAt: activity.createdAt.toISOString(),
    }))

    // Add candidate creation as first activity
    const candidateUser = await prisma.user.findUnique({
      where: { id: candidateId },
      select: {
        createdAt: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    })

    if (candidateUser) {
      timeline.unshift({
        id: `created-${candidateId}`,
        type: 'CANDIDATE_CREATED',
        title: 'Candidate Added',
        description: `${candidateUser.firstName || ''} ${candidateUser.lastName || ''}`.trim() || candidateUser.email + ' was added to the pipeline',
        actor: null,
        metadata: {},
        createdAt: candidateUser.createdAt.toISOString(),
      })
    }

    // Sort by date (newest first)
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      timeline,
      total: timeline.length,
    })
  } catch (error: any) {
    console.error('Error fetching candidate timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/recruitment/candidates/[id]/timeline - Add activity to candidate timeline
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const userId = (session.user as any).id
    const candidateId = params.id

    const body = await request.json()
    const activitySchema = z.object({
      type: z.string(),
      title: z.string(),
      description: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })

    const validatedData = activitySchema.parse(body)

    // Verify candidate belongs to tenant
    const candidate = await prisma.user.findFirst({
      where: {
        id: candidateId,
        tenantId,
      },
      select: { id: true },
    })

    if (!candidate) {
      return NextResponse.json(
        { error: 'Candidate not found' },
        { status: 404 }
      )
    }

    // Create activity
    const activity = await prisma.activityFeed.create({
      data: {
        tenantId,
        userId,
        resourceType: 'CANDIDATE',
        resourceId: candidateId,
        action: validatedData.type as any,
        description: validatedData.description || validatedData.title || '',
        metadata: validatedData.metadata || {},
        mentions: [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json({
      activity: {
        id: activity.id,
        type: activity.action,
        title: activity.action,
        description: activity.description,
        actor: activity.user
          ? {
              id: activity.user.id,
              name: `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email,
              email: activity.user.email,
              avatar: activity.user.avatar,
            }
          : null,
        metadata: activity.metadata,
        createdAt: activity.createdAt.toISOString(),
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Error creating activity:', error)
    return NextResponse.json(
      { error: 'Failed to create activity', details: error.message },
      { status: 500 }
    )
  }
}


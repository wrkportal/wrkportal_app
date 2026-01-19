/**
 * API Routes for Call Management
 * POST /api/calls - Create a new call
 * GET /api/calls - List calls for the current user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createCallSchema = z.object({
  type: z.enum(['ONE_ON_ONE', 'GROUP', 'SCHEDULED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  participantIds: z.array(z.string()).optional(),
})

// POST - Create a new call
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createCallSchema.parse(body)

    // Generate unique room ID
    const roomId = `room-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // Filter out the creator from participantIds to avoid duplicate
    const participantIds = (validatedData.participantIds || []).filter(
      (userId) => userId !== session.user.id
    )

    // Create call
    const call = await prisma.call.create({
      data: {
        tenantId: session.user.tenantId,
        roomId,
        type: validatedData.type || 'ONE_ON_ONE',
        status: 'INITIATED',
        title: validatedData.title,
        description: validatedData.description,
        scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null,
        createdById: session.user.id,
        participants: {
          create: [
            // Add creator as host
            {
              userId: session.user.id,
              role: 'HOST',
            },
            // Add other participants if provided (excluding creator)
            ...participantIds.map((userId) => ({
              userId,
              role: 'PARTICIPANT' as const,
            })),
          ],
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ call }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating call:', error)
    
    // Return more detailed error for debugging (remove in production if needed)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    console.error('Error details:', errorDetails)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        // Only include details in development
        ...(process.env.NODE_ENV === 'development' && { details: errorDetails })
      },
      { status: 500 }
    )
  }
}

// GET - List calls for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {
      tenantId: session.user.tenantId,
      participants: {
        some: {
          userId: session.user.id,
        },
      },
    }

    if (status) {
      where.status = status
    }

    // Fetch calls
    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        skip: offset,
      }),
      prisma.call.count({ where }),
    ])

    return NextResponse.json(
      {
        calls,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching calls:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

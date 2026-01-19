/**
 * API Routes for Call Management
 * GET /api/calls/[id] - Get call details
 * PATCH /api/calls/[id] - Update call (start, end, update status)
 * DELETE /api/calls/[id] - Cancel/delete a call
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCallSchema = z.object({
  status: z.enum(['INITIATED', 'RINGING', 'ACTIVE', 'ENDED', 'CANCELLED']).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
})

// GET - Get call details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Fetch call
    const call = await prisma.call.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        participants: {
          some: {
            userId: session.user.id,
          },
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
        recordings: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    return NextResponse.json({ call }, { status: 200 })
  } catch (error) {
    console.error('Error fetching call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update call
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const validatedData = updateCallSchema.parse(body)

    // Check if user is a participant
    const call = await prisma.call.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        participants: {
          some: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}

    if (validatedData.status) {
      updateData.status = validatedData.status

      // Set startedAt when call becomes active
      if (validatedData.status === 'ACTIVE' && !call.startedAt) {
        updateData.startedAt = new Date()
      }

      // Set endedAt and calculate duration when call ends
      if (validatedData.status === 'ENDED' && !call.endedAt) {
        updateData.endedAt = new Date()
        if (call.startedAt) {
          const duration = Math.floor(
            (new Date().getTime() - call.startedAt.getTime()) / 1000
          )
          updateData.duration = duration
        }
      }
    }

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }

    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }

    // Update call
    const updatedCall = await prisma.call.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ call: updatedCall }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Cancel/delete a call
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is the creator or a participant
    const call = await prisma.call.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        OR: [
          { createdById: session.user.id },
          {
            participants: {
              some: {
                userId: session.user.id,
              },
            },
          },
        ],
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    // Update status to CANCELLED instead of deleting (soft delete)
    const updatedCall = await prisma.call.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    })

    return NextResponse.json({ call: updatedCall }, { status: 200 })
  } catch (error) {
    console.error('Error cancelling call:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * API Routes for Call Participants
 * POST /api/calls/[id]/participants - Add participant to call
 * PATCH /api/calls/[id]/participants - Update participant status (mute, video, etc.)
 * DELETE /api/calls/[id]/participants - Remove participant from call
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const addParticipantSchema = z.object({
  userId: z.string(),
  role: z.enum(['HOST', 'PARTICIPANT', 'MODERATOR']).optional(),
})

const updateParticipantSchema = z.object({
  isMuted: z.boolean().optional(),
  isVideoOn: z.boolean().optional(),
  isScreenSharing: z.boolean().optional(),
  role: z.enum(['HOST', 'PARTICIPANT', 'MODERATOR']).optional(),
})

// POST - Add participant to call
export async function POST(
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
    const validatedData = addParticipantSchema.parse(body)

    // Verify call exists and user has access
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

    // Check if participant already exists
    const existingParticipant = await prisma.callParticipant.findUnique({
      where: {
        callId_userId: {
          callId: id,
          userId: validatedData.userId,
        },
      },
    })

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Participant already in call' },
        { status: 400 }
      )
    }

    // Add participant
    const participant = await prisma.callParticipant.create({
      data: {
        callId: id,
        userId: validatedData.userId,
        role: validatedData.role || 'PARTICIPANT',
      },
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
    })

    return NextResponse.json({ participant }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update participant status
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
    const validatedData = updateParticipantSchema.parse(body)

    // Find participant (update own status)
    const participant = await prisma.callParticipant.findUnique({
      where: {
        callId_userId: {
          callId: id,
          userId: session.user.id,
        },
      },
      include: {
        call: {
          select: {
            tenantId: true,
          },
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Verify tenant access
    if (participant.call.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build update data
    const updateData: any = {}

    if (validatedData.isMuted !== undefined) {
      updateData.isMuted = validatedData.isMuted
    }

    if (validatedData.isVideoOn !== undefined) {
      updateData.isVideoOn = validatedData.isVideoOn
    }

    if (validatedData.isScreenSharing !== undefined) {
      updateData.isScreenSharing = validatedData.isScreenSharing
    }

    if (validatedData.role !== undefined) {
      updateData.role = validatedData.role
    }

    // Update participant
    const updatedParticipant = await prisma.callParticipant.update({
      where: {
        callId_userId: {
          callId: id,
          userId: session.user.id,
        },
      },
      data: updateData,
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
    })

    return NextResponse.json({ participant: updatedParticipant }, { status: 200 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove participant from call (leave call)
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

    // Find participant
    const participant = await prisma.callParticipant.findUnique({
      where: {
        callId_userId: {
          callId: id,
          userId: session.user.id,
        },
      },
      include: {
        call: {
          select: {
            tenantId: true,
            status: true,
          },
        },
      },
    })

    if (!participant) {
      return NextResponse.json(
        { error: 'Participant not found' },
        { status: 404 }
      )
    }

    // Verify tenant access
    if (participant.call.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update leftAt timestamp instead of deleting
    await prisma.callParticipant.update({
      where: {
        callId_userId: {
          callId: id,
          userId: session.user.id,
        },
      },
      data: {
        leftAt: new Date(),
      },
    })

    // If call becomes empty or only has one participant left, end the call
    const remainingParticipants = await prisma.callParticipant.count({
      where: {
        callId: id,
        leftAt: null,
      },
    })

    if (remainingParticipants <= 1 && participant.call.status === 'ACTIVE') {
      await prisma.call.update({
        where: { id },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error removing participant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

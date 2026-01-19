/**
 * API Routes for Call Recordings
 * POST /api/calls/[id]/recordings - Save recording metadata
 * GET /api/calls/[id]/recordings - List recordings for a call
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const createRecordingSchema = z.object({
  fileUrl: z.string(),
  fileSize: z.number(),
  duration: z.number(),
  format: z.string(),
})

// POST - Save recording metadata
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
    const validatedData = createRecordingSchema.parse(body)

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

    // Create recording record
    const recording = await prisma.callRecording.create({
      data: {
        callId: id,
        fileUrl: validatedData.fileUrl,
        fileSize: validatedData.fileSize,
        duration: validatedData.duration,
        format: validatedData.format,
        recordedBy: session.user.id,
      },
    })

    return NextResponse.json({ recording }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating recording:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List recordings for a call
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

    // Fetch recordings
    const recordings = await prisma.callRecording.findMany({
      where: {
        callId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ recordings }, { status: 200 })
  } catch (error) {
    console.error('Error fetching recordings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

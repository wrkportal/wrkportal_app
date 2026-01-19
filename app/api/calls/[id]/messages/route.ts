/**
 * API Routes for Call Chat Messages
 * GET /api/calls/[id]/messages - Get messages for a call
 * POST /api/calls/[id]/messages - Send a message in a call
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(2000),
})

// GET - Get messages for a call
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

    // Fetch messages (we'll use a simple JSON field in Call model for now)
    // In production, you might want a separate CallMessage model
    // For now, we'll return empty array as messages will be stored in call.description or a JSON field
    // This is a placeholder - you can extend the Call model to have a messages JSON field
    
    return NextResponse.json({ messages: [] }, { status: 200 })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Send a message in a call
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
    const validatedData = createMessageSchema.parse(body)

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

    // For now, we'll return a simple message object
    // In production, you'd want to store this in a database
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      callId: id,
      userId: session.user.id,
      userName: session.user.name || `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email,
      content: validatedData.content,
      createdAt: new Date().toISOString(),
    }

    // In a real implementation, you'd save this to a CallMessage table
    // For now, we'll just return it (you can use WebSockets or Server-Sent Events for real-time)

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

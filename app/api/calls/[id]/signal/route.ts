import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { signalingStore } from '@/lib/webrtc/signaling-store'
import { SignalingMessage } from '@/lib/webrtc/signaling'

// POST /api/calls/[id]/signal - Send signaling message (SDP offer/answer, ICE candidate)
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
    const { type, targetUserId, sdp, candidate } = body

    // Verify user is a participant
    const participant = await prisma.callParticipant.findFirst({
      where: {
        callId: id,
        userId: session.user.id
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this call' }, { status: 403 })
    }

    // Store signaling message
    const signalMessage: SignalingMessage = {
      type,
      fromUserId: session.user.id,
      targetUserId,
      sdp,
      candidate,
      callId: id,
    }

    const signalId = signalingStore.store(id, signalMessage)

    return NextResponse.json({ 
      success: true,
      signalId 
    })
  } catch (error) {
    console.error('Error sending signal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/calls/[id]/signal - Get pending signaling messages
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
    const { searchParams } = new URL(req.url)
    const since = searchParams.get('since') // Timestamp to get messages since

    // Verify user is a participant
    const participant = await prisma.callParticipant.findFirst({
      where: {
        callId: id,
        userId: session.user.id
      }
    })

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this call' }, { status: 403 })
    }

    // Get signals since the specified timestamp
    const sinceTimestamp = since ? parseInt(since) : Date.now() - 5000 // Default: last 5 seconds
    const signals = signalingStore.getSince(id, sinceTimestamp, session.user.id)

    return NextResponse.json({ signals })
  } catch (error) {
    console.error('Error getting signals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

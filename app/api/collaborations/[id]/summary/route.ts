import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/collaborations/[id]/summary - Get notes and summary
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

    // Verify user is a member
    const member = await prisma.collaborationMember.findFirst({
      where: {
        collaborationId: id,
        userId: session.user.id
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this collaboration' }, { status: 403 })
    }

    const collaboration = await prisma.collaboration.findUnique({
      where: { id },
      select: {
        notes: true,
        summary: true,
        summaryGeneratedAt: true
      }
    })

    if (!collaboration) {
      return NextResponse.json({ error: 'Collaboration not found' }, { status: 404 })
    }

    return NextResponse.json({
      notes: collaboration.notes || '',
      summary: collaboration.summary || null,
      summaryGeneratedAt: collaboration.summaryGeneratedAt
    })
  } catch (error) {
    console.error('Error fetching summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/collaborations/[id]/summary - Save notes
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
    const { notes } = body

    // Verify user is a member
    const member = await prisma.collaborationMember.findFirst({
      where: {
        collaborationId: id,
        userId: session.user.id
      }
    })

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this collaboration' }, { status: 403 })
    }

    // Update notes
    await prisma.collaboration.update({
      where: { id },
      data: {
        notes: notes || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving notes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

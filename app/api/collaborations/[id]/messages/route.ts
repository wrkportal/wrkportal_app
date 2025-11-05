import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/collaborations/[id]/messages - Get messages for a collaboration
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify user is a member of this collaboration
    const collaboration = await prisma.collaboration.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!collaboration) {
      return NextResponse.json({ error: 'Collaboration not found or access denied' }, { status: 404 })
    }

    // Fetch messages
    const messages = await prisma.collaborationMessage.findMany({
      where: {
        collaborationId: id,
        isDeleted: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/collaborations/[id]/messages - Create a new message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await req.json()
    const { content, mentions, replyToId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user is a member of this collaboration
    const collaboration = await prisma.collaboration.findFirst({
      where: {
        id,
        members: {
          some: {
            userId: session.user.id
          }
        }
      }
    })

    if (!collaboration) {
      return NextResponse.json({ error: 'Collaboration not found or access denied' }, { status: 404 })
    }

    // Create message
    const message = await prisma.collaborationMessage.create({
      data: {
        collaborationId: id,
        userId: session.user.id,
        content: content.trim(),
        mentions: mentions || [],
        parentId: replyToId || null
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true
          }
        },
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    })

    // Update collaboration updatedAt
    await prisma.collaboration.update({
      where: { id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

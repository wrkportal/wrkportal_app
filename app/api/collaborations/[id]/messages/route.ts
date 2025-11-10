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

    // Process reactions to include user details
    const allUserIds = new Set<string>()
    messages.forEach((msg: any) => {
      if (msg.reactions) {
        Object.values(msg.reactions).forEach((userIds: any) => {
          if (Array.isArray(userIds)) {
            userIds.forEach((id: string) => allUserIds.add(id))
          }
        })
      }
    })

    const users = await prisma.user.findMany({
      where: {
        id: { in: Array.from(allUserIds) },
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
      },
    })

    const userMap = new Map(users.map((u) => [u.id, u]))

    // Format messages with reactions
    const formattedMessages = messages.map((msg: any) => {
      if (msg.reactions && typeof msg.reactions === 'object') {
        const formattedReactions = Object.entries(msg.reactions).map(([emoji, userIds]) => ({
          emoji,
          users: (userIds as string[]).map((id) => userMap.get(id)!).filter(Boolean),
        }))
        return {
          ...msg,
          reactions: formattedReactions,
        }
      }
      return msg
    })

    return NextResponse.json({ messages: formattedMessages })
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

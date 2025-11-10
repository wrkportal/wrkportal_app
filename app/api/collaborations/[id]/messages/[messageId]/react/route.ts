import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { emoji } = await request.json()
    const messageId = params.messageId
    const collaborationId = params.id

    if (!emoji) {
      return NextResponse.json(
        { success: false, error: 'Emoji is required' },
        { status: 400 }
      )
    }

    // Get the message to verify access
    const message = await prisma.collaborationMessage.findUnique({
      where: { id: messageId },
      include: {
        collaboration: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    })

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user is a member of the collaboration
    if (message.collaboration.members.length === 0) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this collaboration' },
        { status: 403 }
      )
    }

    // Get existing reactions
    const reactions = (message.reactions as any) || {}
    const userId = session.user.id

    // Toggle reaction: if user already reacted with this emoji, remove it; otherwise add it
    if (reactions[emoji]) {
      const users = reactions[emoji] as string[]
      if (users.includes(userId)) {
        // Remove user's reaction
        reactions[emoji] = users.filter((id: string) => id !== userId)
        // Remove emoji if no users left
        if (reactions[emoji].length === 0) {
          delete reactions[emoji]
        }
      } else {
        // Add user's reaction
        reactions[emoji].push(userId)
      }
    } else {
      // Create new reaction
      reactions[emoji] = [userId]
    }

    // Update the message with new reactions
    const updatedMessage = await prisma.collaborationMessage.update({
      where: { id: messageId },
      data: {
        reactions: reactions,
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
        parent: {
          select: {
            id: true,
            content: true,
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    // Fetch user details for reactions
    const allUserIds = new Set<string>()
    Object.values(reactions).forEach((userIds: any) => {
      userIds.forEach((id: string) => allUserIds.add(id))
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

    // Format reactions with user details
    const formattedReactions = Object.entries(reactions).map(([emoji, userIds]) => ({
      emoji,
      users: (userIds as string[]).map((id) => userMap.get(id)!).filter(Boolean),
    }))

    return NextResponse.json({
      success: true,
      message: {
        ...updatedMessage,
        reactions: formattedReactions,
      },
    })
  } catch (error) {
    console.error('Error adding reaction:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add reaction' },
      { status: 500 }
    )
  }
}


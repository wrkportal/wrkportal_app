/**
 * Phase 4.3: Mentions System
 * 
 * Handles @mentions in comments and activity feeds
 */

import { prisma } from '@/lib/prisma'

export interface CreateMentionsParams {
  tenantId: string
  resourceType: string
  resourceId: string
  commentId?: string
  mentionedById: string
  mentionedUserIds: string[]
  context?: string
}

/**
 * Extract user IDs from @mention patterns in text
 * Format: @userId or @userEmail
 */
export function extractMentions(text: string): string[] {
  const mentionPattern = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|@([a-zA-Z0-9-]+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionPattern.exec(text)) !== null) {
    const mention = match[1] || match[2]
    if (mention && !mentions.includes(mention)) {
      mentions.push(mention)
    }
  }

  return mentions
}

/**
 * Resolve mentions (email or userId) to user IDs
 */
export async function resolveMentionIds(
  tenantId: string,
  mentions: string[]
): Promise<string[]> {
  if (mentions.length === 0) return []

  const userIds: string[] = []

  for (const mention of mentions) {
    // If it looks like an email, find user by email
    if (mention.includes('@')) {
      const user = await prisma.user.findFirst({
        where: {
          tenantId,
          email: mention,
        },
        select: { id: true },
      })
      if (user) {
        userIds.push(user.id)
      }
    } else {
      // Assume it's already a userId
      const user = await prisma.user.findFirst({
        where: {
          tenantId,
          id: mention,
        },
        select: { id: true },
      })
      if (user) {
        userIds.push(user.id)
      }
    }
  }

  return userIds
}

/**
 * Create mention records
 */
export async function createMentions(params: CreateMentionsParams): Promise<void> {
  const { tenantId, resourceType, resourceId, commentId, mentionedById, mentionedUserIds, context } = params

  if (mentionedUserIds.length === 0) return

  // Resolve mentions to actual user IDs if they're emails
  const resolvedUserIds = await resolveMentionIds(tenantId, mentionedUserIds)

  if (resolvedUserIds.length === 0) return

  // Create mention records
  await Promise.all(
    resolvedUserIds.map(userId =>
      prisma.mention.create({
        data: {
          tenantId,
          resourceType,
          resourceId,
          commentId: commentId || null,
          mentionedById,
          mentionedUserId: userId,
          context: context || null,
        },
      })
    )
  )
}

/**
 * Get unread mentions for a user
 */
export async function getUnreadMentions(userId: string, tenantId: string) {
  return prisma.mention.findMany({
    where: {
      mentionedUserId: userId,
      tenantId,
      isRead: false,
    },
    include: {
      mentionedBy: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          resourceType: true,
          resourceId: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  })
}

/**
 * Mark mentions as read
 */
export async function markMentionsAsRead(mentionIds: string[]): Promise<void> {
  await prisma.mention.updateMany({
    where: {
      id: { in: mentionIds },
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  })
}


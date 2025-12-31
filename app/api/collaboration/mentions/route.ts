/**
 * Phase 4.3: Mentions API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { getUnreadMentions, markMentionsAsRead } from '@/lib/collaboration/mentions'

// GET /api/collaboration/mentions - Get mentions for current user
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const unreadOnly = searchParams.get('unreadOnly') === 'true'

        const mentions = await getUnreadMentions(userInfo.userId, userInfo.tenantId)

        return NextResponse.json({ mentions })
      } catch (error: any) {
        console.error('Error fetching mentions:', error)
        return NextResponse.json(
          { error: 'Failed to fetch mentions', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/collaboration/mentions/mark-read - Mark mentions as read
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const { mentionIds } = body

        if (!Array.isArray(mentionIds) || mentionIds.length === 0) {
          return NextResponse.json(
            { error: 'mentionIds array is required' },
            { status: 400 }
          )
        }

        // Verify mentions belong to current user
        const mentions = await prisma.mention.findMany({
          where: {
            id: { in: mentionIds },
            mentionedUserId: userInfo.userId,
            tenantId: userInfo.tenantId,
          },
        })

        if (mentions.length !== mentionIds.length) {
          return NextResponse.json(
            { error: 'Some mentions not found or access denied' },
            { status: 403 }
          )
        }

        await markMentionsAsRead(mentionIds)

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error marking mentions as read:', error)
        return NextResponse.json(
          { error: 'Failed to mark mentions as read', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


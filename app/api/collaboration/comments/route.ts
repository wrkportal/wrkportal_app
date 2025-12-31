/**
 * Phase 4.3: Comments API
 * 
 * CRUD operations for resource comments
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { createActivityFeed } from '@/lib/collaboration/activity-feed'
import { extractMentions, createMentions } from '@/lib/collaboration/mentions'

const createCommentSchema = z.object({
  resourceType: z.string(),
  resourceId: z.string(),
  content: z.string().min(1),
  parentId: z.string().optional().nullable(),
  mentions: z.array(z.string()).optional().default([]),
})

// GET /api/collaboration/comments - Get comments for a resource
export async function GET(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'READ' },
    async (req, userInfo) => {
      try {
        const { searchParams } = new URL(req.url)
        const resourceType = searchParams.get('resourceType')
        const resourceId = searchParams.get('resourceId')

        if (!resourceType || !resourceId) {
          return NextResponse.json(
            { error: 'resourceType and resourceId are required' },
            { status: 400 }
          )
        }

        const comments = await prisma.comment.findMany({
          where: {
            tenantId: userInfo.tenantId,
            resourceType,
            resourceId,
            isDeleted: false,
            parentId: null, // Only get top-level comments
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            replies: {
              where: { isDeleted: false },
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: [
            { isPinned: 'desc' },
            { createdAt: 'desc' },
          ],
        })

        return NextResponse.json({ comments })
      } catch (error: any) {
        console.error('Error fetching comments:', error)
        return NextResponse.json(
          { error: 'Failed to fetch comments', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// POST /api/collaboration/comments - Create comment
export async function POST(request: NextRequest) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'CREATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = createCommentSchema.parse(body)

        // Extract mentions from content if not provided
        const mentions = data.mentions.length > 0 
          ? data.mentions 
          : extractMentions(data.content)

        const comment = await prisma.comment.create({
          data: {
            tenantId: userInfo.tenantId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            userId: userInfo.userId,
            content: data.content,
            mentions,
            parentId: data.parentId || null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        })

        // Create mentions
        if (mentions.length > 0) {
          await createMentions({
            tenantId: userInfo.tenantId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            commentId: comment.id,
            mentionedById: userInfo.userId,
            mentionedUserIds: mentions,
            context: data.content.substring(0, 100),
          })
        }

        // Create activity feed entry
        await createActivityFeed({
          tenantId: userInfo.tenantId,
          userId: userInfo.userId,
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          action: 'COMMENTED',
          description: `${userInfo.userId} commented on ${data.resourceType} ${data.resourceId}`,
          mentions,
        })

        return NextResponse.json({ comment }, { status: 201 })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error creating comment:', error)
        return NextResponse.json(
          { error: 'Failed to create comment', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


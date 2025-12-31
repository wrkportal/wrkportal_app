/**
 * Phase 4.3: Comment Management (Individual)
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'
import { extractMentions, createMentions } from '@/lib/collaboration/mentions'

const updateCommentSchema = z.object({
  content: z.string().min(1).optional(),
  isPinned: z.boolean().optional(),
})

// GET /api/collaboration/comments/[id] - Get comment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'READ' },
    async (req, userInfo) => {
      try {
        const comment = await prisma.comment.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
            isDeleted: false,
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
          },
        })

        if (!comment) {
          return NextResponse.json(
            { error: 'Comment not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({ comment })
      } catch (error: any) {
        console.error('Error fetching comment:', error)
        return NextResponse.json(
          { error: 'Failed to fetch comment', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// PATCH /api/collaboration/comments/[id] - Update comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'UPDATE' },
    async (req, userInfo) => {
      try {
        const body = await request.json()
        const data = updateCommentSchema.parse(body)

        const existing = await prisma.comment.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
            userId: userInfo.userId, // Only owner can update
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Comment not found or access denied' },
            { status: 404 }
          )
        }

        const updateData: any = { isEdited: true }
        if (data.content !== undefined) {
          updateData.content = data.content
          // Update mentions if content changed
          const mentions = extractMentions(data.content)
          updateData.mentions = mentions
          
          if (mentions.length > 0) {
            await createMentions({
              tenantId: userInfo.tenantId,
              resourceType: existing.resourceType,
              resourceId: existing.resourceId,
              commentId: existing.id,
              mentionedById: userInfo.userId,
              mentionedUserIds: mentions,
              context: data.content.substring(0, 100),
            })
          }
        }
        if (data.isPinned !== undefined) {
          updateData.isPinned = data.isPinned
        }

        const comment = await prisma.comment.update({
          where: { id: params.id },
          data: updateData,
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

        return NextResponse.json({ comment })
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Validation error', details: error.errors },
            { status: 400 }
          )
        }
        console.error('Error updating comment:', error)
        return NextResponse.json(
          { error: 'Failed to update comment', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE /api/collaboration/comments/[id] - Delete comment (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermissionCheck(
    request,
    { resource: 'collaboration', action: 'DELETE' },
    async (req, userInfo) => {
      try {
        const existing = await prisma.comment.findFirst({
          where: {
            id: params.id,
            tenantId: userInfo.tenantId,
            userId: userInfo.userId, // Only owner can delete
          },
        })

        if (!existing) {
          return NextResponse.json(
            { error: 'Comment not found or access denied' },
            { status: 404 }
          )
        }

        // Soft delete
        await prisma.comment.update({
          where: { id: params.id },
          data: { isDeleted: true },
        })

        return NextResponse.json({ success: true })
      } catch (error: any) {
        console.error('Error deleting comment:', error)
        return NextResponse.json(
          { error: 'Failed to delete comment', details: error.message },
          { status: 500 }
        )
      }
    }
  )
}


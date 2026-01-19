import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const updateTicketSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['TO_DO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  category: z.string().optional(),
  assigneeId: z.string().nullable().optional(),
})

// GET - Get single ticket
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { id } = await params

        const ticket = await prisma.task.findFirst({
          where: {
            id,
            tenantId: userInfo.tenantId,
            deletedAt: null,
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        })

        if (!ticket) {
          return NextResponse.json(
            { error: 'Ticket not found' },
            { status: 404 }
          )
        }

        return NextResponse.json({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description || '',
          priority: ticket.priority || 'MEDIUM',
          status: ticket.status,
          category: ticket.category || '',
          requester: ticket.createdBy?.name || 'Unknown',
          requesterId: ticket.createdById,
          assignee: ticket.assignee?.name || null,
          assigneeId: ticket.assigneeId,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          resolvedAt: ticket.status === 'DONE' ? ticket.updatedAt.toISOString() : null,
          projectId: ticket.projectId,
          projectName: ticket.project?.name,
        })
      } catch (error) {
        console.error('Error fetching ticket:', error)
        return NextResponse.json(
          { error: 'Failed to fetch ticket' },
          { status: 500 }
        )
      }
    }
  )
}

// PUT - Update ticket
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'UPDATE' },
    async (request, userInfo) => {
      try {
        const { id } = await params
        const body = await request.json()
        const data = updateTicketSchema.parse(body)

        const ticket = await prisma.task.update({
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
          data: {
            ...(data.title && { title: data.title }),
            ...(data.description !== undefined && { description: data.description }),
            ...(data.priority && { priority: data.priority }),
            ...(data.status && { status: data.status }),
            ...(data.category !== undefined && { category: data.category }),
            ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
          },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        })

        return NextResponse.json({
          id: ticket.id,
          title: ticket.title,
          description: ticket.description || '',
          priority: ticket.priority || 'MEDIUM',
          status: ticket.status,
          category: ticket.category || '',
          requester: ticket.createdBy?.name || 'Unknown',
          requesterId: ticket.createdById,
          assignee: ticket.assignee?.name || null,
          assigneeId: ticket.assigneeId,
          createdAt: ticket.createdAt.toISOString(),
          updatedAt: ticket.updatedAt.toISOString(),
          resolvedAt: ticket.status === 'DONE' ? ticket.updatedAt.toISOString() : null,
        })
      } catch (error) {
        console.error('Error updating ticket:', error)
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.errors },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to update ticket' },
          { status: 500 }
        )
      }
    }
  )
}

// DELETE - Delete ticket
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'DELETE' },
    async (request, userInfo) => {
      try {
        const { id } = await params

        await prisma.task.update({
          where: {
            id,
            tenantId: userInfo.tenantId,
          },
          data: {
            deletedAt: new Date(),
            deletedById: userInfo.userId,
          },
        })

        return NextResponse.json({ success: true })
      } catch (error) {
        console.error('Error deleting ticket:', error)
        return NextResponse.json(
          { error: 'Failed to delete ticket' },
          { status: 500 }
        )
      }
    }
  )
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { withPermissionCheck } from '@/lib/permissions/permission-middleware'

const createTicketSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
})

// GET - List IT tickets
export async function GET(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'READ' },
    async (request, userInfo) => {
      try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const priority = searchParams.get('priority')
        const category = searchParams.get('category')
        const search = searchParams.get('search')

        const where: any = {
          tenantId: userInfo.tenantId,
          deletedAt: null,
          // Filter for IT-related tasks or projects with IT_SUPPORT workflow
          OR: [
            { project: { workflowType: 'IT_SUPPORT' } },
            { project: null }, // Include standalone tasks that might be IT tickets
          ],
        }

        if (status && status !== 'all') {
          where.status = status
        }

        if (priority && priority !== 'all') {
          where.priority = priority
        }

        if (search) {
          where.OR = [
            ...(where.OR || []),
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ]
        }

        const tickets = await prisma.task.findMany({
          where,
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
          orderBy: {
            createdAt: 'desc',
          },
        })

        // Transform to ticket format
        const formattedTickets = tickets.map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'MEDIUM',
          status: task.status,
          category: task.category || '',
          requester: task.createdBy?.name || 'Unknown',
          requesterId: task.createdById,
          assignee: task.assignee?.name || null,
          assigneeId: task.assigneeId,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
          resolvedAt: task.status === 'DONE' ? task.updatedAt.toISOString() : null,
          projectId: task.projectId,
          projectName: task.project?.name,
        }))

        // Calculate stats
        const stats = {
          total: formattedTickets.length,
          open: formattedTickets.filter(t => t.status === 'TO_DO' || t.status === 'IN_PROGRESS').length,
          inProgress: formattedTickets.filter(t => t.status === 'IN_PROGRESS').length,
          resolved: formattedTickets.filter(t => t.status === 'DONE').length,
        }

        return NextResponse.json({
          tickets: formattedTickets,
          stats,
        })
      } catch (error) {
        console.error('Error fetching IT tickets:', error)
        return NextResponse.json(
          { error: 'Failed to fetch tickets' },
          { status: 500 }
        )
      }
    }
  )
}

// POST - Create new IT ticket
export async function POST(req: NextRequest) {
  return withPermissionCheck(
    req,
    { resource: 'it', action: 'CREATE' },
    async (request, userInfo) => {
      try {
        const body = await request.json()
        const data = createTicketSchema.parse(body)

        // Create task as IT ticket
        const ticket = await prisma.task.create({
          data: {
            tenantId: userInfo.tenantId,
            title: data.title,
            description: data.description || '',
            priority: data.priority,
            status: 'TO_DO',
            category: data.category || 'IT Support',
            createdById: userInfo.userId,
            assigneeId: data.assigneeId,
            projectId: data.projectId,
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
          resolvedAt: null,
        })
      } catch (error) {
        console.error('Error creating IT ticket:', error)
        if (error instanceof z.ZodError) {
          return NextResponse.json(
            { error: 'Invalid request data', details: error.errors },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Failed to create ticket' },
          { status: 500 }
        )
      }
    }
  )
}


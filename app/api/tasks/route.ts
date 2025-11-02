import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  status: z.enum([
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'BLOCKED',
    'DONE',
    'CANCELLED',
  ]),
  dueDate: z.string().optional(),
  estimatedHours: z.number().optional(),
  frequency: z.string().optional(),
  referencePoint: z.string().optional(),
})

// GET - Fetch tasks (org-wide for admins, or user's tasks)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const overdue = searchParams.get('overdue') === 'true'
    const assigneeId = searchParams.get('assigneeId')

    // Build where clause
    const whereClause: any = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    }

    // Check if user is admin - admins can see all tasks, others only their own
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD', 'PROJECT_MANAGER'].includes(session.user.role)
    
    if (!isAdmin) {
      // Non-admins only see their own tasks
      whereClause.assigneeId = session.user.id
    } else if (assigneeId) {
      // Admins can filter by specific assignee
      whereClause.assigneeId = assigneeId
    }

    if (projectId) {
      whereClause.projectId = projectId
    }

    if (status) {
      whereClause.status = status
    }

    if (overdue) {
      whereClause.dueDate = {
        lt: new Date(),
      }
      // Don't include completed/cancelled tasks in overdue
      whereClause.status = {
        notIn: ['DONE', 'CANCELLED'],
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return NextResponse.json({ 
      tasks,
      totalCount: tasks.length,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update task
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { taskId, ...updateData } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Verify task exists and user has access
    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: session.user.tenantId,
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json({ task })
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new task
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createTaskSchema.parse(body)

    // Handle "Not a Project" tasks
    const isNotAProject = validatedData.projectId === 'NOT_A_PROJECT'

    // Determine assignee - default to creator if not specified or empty
    const assigneeId = validatedData.assigneeId && validatedData.assigneeId.trim() !== '' 
      ? validatedData.assigneeId 
      : session.user.id

    console.log('[Task Creation] Received assigneeId:', validatedData.assigneeId)
    console.log('[Task Creation] Using assigneeId:', assigneeId)
    console.log('[Task Creation] Session user ID:', session.user.id)
    console.log('[Task Creation] Session user tenantId:', session.user.tenantId)

    // Verify the assignee exists in the database
    const assigneeExists = await prisma.user.findUnique({
      where: { 
        id: assigneeId,
        tenantId: session.user.tenantId // Ensure they're in the same tenant
      }
    })

    if (!assigneeExists) {
      return NextResponse.json(
        { error: 'Assignee not found or not in your organization' },
        { status: 400 }
      )
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: validatedData.title,
        description: validatedData.description || '',
        projectId: isNotAProject ? null : validatedData.projectId,
        assigneeId: assigneeId,
        priority: validatedData.priority,
        status: validatedData.status,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedHours: validatedData.estimatedHours,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        // Store frequency and reference point in tags or custom field
        // For now, we'll add them to description if "Not a Project"
        tags:
          isNotAProject && validatedData.frequency
            ? [
                `frequency:${validatedData.frequency}`,
                `reference:${validatedData.referencePoint}`,
              ]
            : [],
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    })

    // Notify resource managers if TEAM_MEMBER assigns to another TEAM_MEMBER
    if (
      task.createdBy.role === 'TEAM_MEMBER' &&
      validatedData.assigneeId &&
      validatedData.assigneeId !== session.user.id
    ) {
      // Fetch assignee details to check role
      const assignee = await prisma.user.findUnique({
        where: { id: validatedData.assigneeId },
        select: { role: true, firstName: true, lastName: true },
      })

      if (assignee && assignee.role === 'TEAM_MEMBER') {
        // Both are TEAM_MEMBERS - notify resource managers
        // TODO: Implement notification system
        // 1. Find resource managers for both users (creator and assignee)
        // 2. Create notifications for them
        // 3. Optionally send email notifications

        console.log(
          `[NOTIFICATION] TEAM_MEMBER ${task.createdBy.firstName} ${task.createdBy.lastName} assigned task "${task.title}" to TEAM_MEMBER ${assignee.firstName} ${assignee.lastName}. Resource managers should be notified.`
        )

        // Placeholder for future notification implementation:
        // await notifyResourceManagers({
        //   taskId: task.id,
        //   taskTitle: task.title,
        //   creatorId: session.user.id,
        //   assigneeId: validatedData.assigneeId,
        //   tenantId: session.user.tenantId,
        // })
      }
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string().optional(),
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
  sourceType: z.string().optional(),
  sourceId: z.string().optional(),
  parentId: z.string().optional(),
})

// GET - Fetch tasks (org-wide for admins, or user's tasks)
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Helper to safely query Prisma models that might not exist
    const safeQuery = async <T>(
      queryFn: () => Promise<T>,
      defaultValue: T
    ): Promise<T> => {
      try {
        return await queryFn()
      } catch (error: any) {
        // Check if it's a Prisma error about missing model
        if (
          error?.code === 'P2001' ||
          error?.message?.includes('does not exist') ||
          error?.message?.includes('Unknown model') ||
          error?.message?.includes('model does not exist')
        ) {
          console.warn('Prisma model not found, using default value:', error.message)
          return defaultValue
        }
        throw error
      }
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const overdue = searchParams.get('overdue') === 'true'
    const assigneeId = searchParams.get('assigneeId')
    const includeCreated = searchParams.get('includeCreated') === 'true' // New parameter

    // Build where clause
    const whereClause: any = {
      tenantId: session.user.tenantId,
      deletedAt: null,
    }

    // Check if user is admin - admins can see all tasks, others only their own
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PMO_LEAD', 'PROJECT_MANAGER'].includes(session.user.role)
    
    if (!isAdmin) {
      // Non-admins see tasks assigned to them, or tasks they created if includeCreated is true
      if (includeCreated) {
        whereClause.OR = [
          { assigneeId: session.user.id },
          { createdById: session.user.id }
        ]
      } else {
        whereClause.assigneeId = session.user.id
      }
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

    const tasks = await safeQuery(
      () => prisma.task.findMany({
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
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
      }),
      [] as any[]
    )

    // Extract dependencyId from tags for each task
    const tasksWithDependencies = tasks.map((task) => {
      let dependencyId: string | undefined = undefined
      try {
        const dependencyTag = task.tags?.find((tag: any) => typeof tag === 'string' && tag.startsWith('dependency:'))
        if (dependencyTag && typeof dependencyTag === 'string') {
          dependencyId = String(dependencyTag).replace('dependency:', '')
        }
      } catch (err) {
        // Silently ignore dependency extraction errors for individual tasks
        console.error('Error extracting dependency from task tags:', err)
      }
      
      return {
        ...task,
        dependencyId: dependencyId,
        predecessorId: dependencyId,
      }
    })

    return NextResponse.json({ 
      tasks: tasksWithDependencies,
      totalCount: tasksWithDependencies.length,
      success: true,
    })
  } catch (error: any) {
    console.error('Error fetching tasks:', error)
    const errorMessage = error?.message || 'Internal server error'
    const errorDetails = process.env.NODE_ENV === 'development' 
      ? { message: errorMessage, stack: error?.stack } 
      : { message: errorMessage }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch tasks',
        message: errorMessage,
        details: errorDetails,
      },
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

    // Handle dependencyId/predecessorId by storing in tags (temporary solution)
    // TODO: Add proper dependencyId field to Task schema
    let tags: string[] = Array.isArray(updateData.tags) 
      ? updateData.tags.filter((t: any) => typeof t === 'string')
      : (Array.isArray(existingTask.tags) 
          ? existingTask.tags.filter((t: any) => typeof t === 'string')
          : [])
    const dependencyId = updateData.dependencyId || updateData.predecessorId
    
    if (dependencyId !== undefined) {
      // Remove old dependency tag
      tags = tags.filter((tag: string) => typeof tag === 'string' && !tag.startsWith('dependency:'))
      if (dependencyId && typeof dependencyId === 'string') {
        tags.push(`dependency:${dependencyId}`)
      }
    }
    
    // Remove dependencyId and predecessorId from updateData since they don't exist in schema
    const { dependencyId: _, predecessorId: __, ...dataToUpdate } = updateData

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...dataToUpdate,
        tags: tags,
        dueDate: dataToUpdate.dueDate ? new Date(dataToUpdate.dueDate) : undefined,
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
    
    // Add dependencyId to the response for frontend use
    try {
      const tagsArray = Array.isArray(task.tags) ? task.tags : []
      const dependencyTag = tagsArray.find((tag: any) => typeof tag === 'string' && tag.startsWith('dependency:'))
      if (dependencyTag && typeof dependencyTag === 'string') {
        const normalizedDependencyId: string = `${dependencyTag}`.replace('dependency:', '')
        ;(task as any).dependencyId = normalizedDependencyId
        ;(task as any).predecessorId = normalizedDependencyId
      }
    } catch (err) {
      // Silently ignore dependency extraction errors
      console.error('Error extracting dependency from tags:', err)
    }

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

    // Handle "Not a Project" tasks or no project
    const isNotAProject = validatedData.projectId === 'NOT_A_PROJECT'
    const hasNoProject = !validatedData.projectId || validatedData.projectId.trim() === ''

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
        projectId: (isNotAProject || hasNoProject) ? null : validatedData.projectId,
        assigneeId: assigneeId,
        priority: validatedData.priority,
        status: validatedData.status,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        estimatedHours: validatedData.estimatedHours,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        sourceType: validatedData.sourceType,
        sourceId: validatedData.sourceId,
        parentId: validatedData.parentId || null,
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

/**
 * AI Task Assignment Recommendation API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { recommendTaskAssignment } from '@/lib/ai/services/task-assignment'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    // Fetch actual task from database
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Fetch available users from the same tenant
    const users = await prisma.user.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        skills: true,
      },
    })

    // Calculate actual workload from tasks assigned to each user
    const userWorkloads = await Promise.all(
      users.map(async (user) => {
        const activeTasks = await prisma.task.count({
          where: {
            assigneeId: user.id,
            tenantId: session.user.tenantId,
            status: {
              notIn: ['DONE', 'CANCELLED'],
            },
          },
        })
        
        // Estimate workload: each task = ~8 hours, capacity = 40 hours/week
        const currentHours = activeTasks * 8
        const capacity = 40

        return {
          userId: user.id,
          currentHours,
          capacity,
        }
      })
    )

    const recommendations = await recommendTaskAssignment({
      task: {
        id: task.id,
        projectId: task.projectId || '',
        title: task.title,
        description: task.description || '',
        status: task.status as any,
        priority: task.priority as any,
        reporterId: task.createdById,
        estimatedHours: task.estimatedHours || 0,
        tags: task.tags || [],
        checklist: [],
        dependencies: [],
        attachments: [],
        comments: [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
      availableUsers: users,
      userWorkloads,
    })

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Task assignment error:', error)
    return NextResponse.json(
      { error: 'Failed to recommend task assignment' },
      { status: 500 }
    )
  }
}


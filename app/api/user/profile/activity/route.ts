import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const activities: Array<{
      id: string
      action: string
      entityType: string
      entityName: string
      timestamp: string
      sortDate: Date
    }> = []

    // Get recently completed tasks
    const completedTasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: 'DONE',
        completedAt: { not: null },
        deletedAt: null,
      },
      orderBy: {
        completedAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        title: true,
        completedAt: true,
      },
    })

    completedTasks.forEach((task) => {
      if (task.completedAt) {
        activities.push({
          id: `task-${task.id}`,
          action: 'Completed task',
          entityType: 'task',
          entityName: task.title,
          timestamp: formatDistanceToNow(task.completedAt, { addSuffix: true }),
          sortDate: task.completedAt,
        })
      }
    })

    // Get recently updated projects (where user is manager)
    const updatedProjects = await prisma.project.findMany({
      where: {
        managerId: userId,
        deletedAt: null,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 3,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        createdAt: true,
      },
    })

    updatedProjects.forEach((project) => {
      // Only show as "updated" if it was actually modified (not just created)
      const isUpdate = project.updatedAt.getTime() > project.createdAt.getTime() + 5000 // 5 second buffer
      if (isUpdate) {
        activities.push({
          id: `project-${project.id}`,
          action: 'Updated project',
          entityType: 'project',
          entityName: project.name,
          timestamp: formatDistanceToNow(project.updatedAt, { addSuffix: true }),
          sortDate: project.updatedAt,
        })
      }
    })

    // Get recent timesheets
    const recentTimesheets = await prisma.timesheet.findMany({
      where: {
        userId,
      },
      orderBy: {
        date: 'desc',
      },
      take: 3,
      select: {
        id: true,
        hours: true,
        date: true,
        project: {
          select: {
            name: true,
          },
        },
      },
    })

    recentTimesheets.forEach((timesheet) => {
      activities.push({
        id: `timesheet-${timesheet.id}`,
        action: 'Logged timesheet',
        entityType: 'timesheet',
        entityName: `${timesheet.hours}h on ${timesheet.project.name}`,
        timestamp: formatDistanceToNow(timesheet.date, { addSuffix: true }),
        sortDate: timesheet.date,
      })
    })

    // Get recently created goals (where user is owner)
    const recentGoals = await prisma.goal.findMany({
      where: {
        ownerId: userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2,
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    })

    recentGoals.forEach((goal) => {
      activities.push({
        id: `goal-${goal.id}`,
        action: 'Created goal',
        entityType: 'goal',
        entityName: goal.title,
        timestamp: formatDistanceToNow(goal.createdAt, { addSuffix: true }),
        sortDate: goal.createdAt,
      })
    })

    // Sort all activities by date (most recent first) and take top 10
    const sortedActivities = activities
      .sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime())
      .slice(0, 10)
      .map(({ sortDate, ...rest }) => rest) // Remove sortDate from final output

    return NextResponse.json({
      activities: sortedActivities,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent activity' },
      { status: 500 }
    )
  }
}



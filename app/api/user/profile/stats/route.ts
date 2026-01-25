import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const now = new Date()
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Count active projects (where user is member or manager)
    const activeProjects = await prisma.project.count({
      where: {
        AND: [
          {
            OR: [
              { managerId: userId },
              { teamMembers: { some: { userId } } },
            ],
          },
          {
            status: {
              in: ['PLANNED', 'IN_PROGRESS'],
            },
          },
          {
            deletedAt: null,
          },
        ],
      },
    })

    // Count projects where user is the manager
    const projectsAsLead = await prisma.project.count({
      where: {
        managerId: userId,
        status: {
          in: ['PLANNED', 'IN_PROGRESS'],
        },
        deletedAt: null,
      },
    })

    // Count completed tasks this quarter
    const tasksCompleted = await prisma.task.count({
      where: {
        assigneeId: userId,
        status: 'DONE',
        completedAt: {
          gte: startOfQuarter,
        },
        deletedAt: null,
      },
    })

    // Calculate hours logged this month
    const timesheets = await prisma.timesheet.aggregate({
      where: {
        userId,
        date: {
          gte: startOfMonth,
        },
      },
      _sum: {
        hours: true,
      },
    })

    const hoursLogged = Math.round(timesheets._sum.hours || 0)

    return NextResponse.json({
      activeProjects,
      projectsAsLead,
      tasksCompleted,
      hoursLogged,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching profile stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile stats' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Fetch time tracking logs for a task or user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const userId = searchParams.get('userId') || session.user.id
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = {
      userId: userId,
    }

    if (taskId) {
      whereClause.taskId = taskId
    }

    if (startDate) {
      whereClause.date = {
        ...whereClause.date,
        gte: new Date(startDate),
      }
    }

    if (endDate) {
      whereClause.date = {
        ...whereClause.date,
        lte: new Date(endDate),
      }
    }

    const timeLogs = await prisma.timeTracking.findMany({
      where: whereClause,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            project: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    type TimeLogWithRelations = Prisma.TimeTrackingGetPayload<{
      include: {
        task: {
          select: {
            id: true
            title: true
            project: {
              select: {
                id: true
                name: true
                code: true
              }
            }
          }
        }
        user: {
          select: {
            id: true
            firstName: true
            lastName: true
            email: true
          }
        }
      }
    }>

    // Calculate total duration and group by date
    const groupedByDate: { [key: string]: any } = {}
    let totalDuration = 0

    timeLogs.forEach((log: TimeLogWithRelations) => {
      const dateKey = log.date.toISOString().split('T')[0]
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          logs: [],
          totalDuration: 0,
        }
      }
      groupedByDate[dateKey].logs.push(log)
      if (log.duration) {
        groupedByDate[dateKey].totalDuration += log.duration
        totalDuration += log.duration
      }
    })

    return NextResponse.json({
      timeLogs,
      groupedByDate: Object.values(groupedByDate),
      totalDuration,
      success: true,
    })
  } catch (error) {
    console.error('Error fetching time logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time logs' },
      { status: 500 }
    )
  }
}

// POST - Start a new time tracking session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, notes } = body

    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    // Check if there's already an active timer for this user
    const activeTimer = await prisma.timeTracking.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
    })

    if (activeTimer) {
      return NextResponse.json(
        { error: 'You already have an active timer running', activeTimer },
        { status: 400 }
      )
    }

    const now = new Date()
    const timeLog = await prisma.timeTracking.create({
      data: {
        taskId,
        userId: session.user.id,
        startTime: now,
        date: now,
        notes: notes || null,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      timeLog,
      success: true,
      message: 'Timer started successfully',
    })
  } catch (error) {
    console.error('Error starting timer:', error)
    return NextResponse.json(
      { error: 'Failed to start timer' },
      { status: 500 }
    )
  }
}

// PATCH - Stop an active time tracking session
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { timeLogId, notes } = body

    if (!timeLogId) {
      return NextResponse.json(
        { error: 'timeLogId is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingLog = await prisma.timeTracking.findUnique({
      where: { id: timeLogId },
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 })
    }

    if (existingLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (existingLog.endTime) {
      return NextResponse.json(
        { error: 'Timer already stopped' },
        { status: 400 }
      )
    }

    const endTime = new Date()
    const duration = Math.floor(
      (endTime.getTime() - existingLog.startTime.getTime()) / 1000
    )

    const updatedLog = await prisma.timeTracking.update({
      where: { id: timeLogId },
      data: {
        endTime,
        duration,
        notes: notes || existingLog.notes,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    return NextResponse.json({
      timeLog: updatedLog,
      success: true,
      message: 'Timer stopped successfully',
      duration,
    })
  } catch (error) {
    console.error('Error stopping timer:', error)
    return NextResponse.json({ error: 'Failed to stop timer' }, { status: 500 })
  }
}

// DELETE - Delete a time log
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeLogId = searchParams.get('timeLogId')

    if (!timeLogId) {
      return NextResponse.json(
        { error: 'timeLogId is required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingLog = await prisma.timeTracking.findUnique({
      where: { id: timeLogId },
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'Time log not found' }, { status: 404 })
    }

    if (existingLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.timeTracking.delete({
      where: { id: timeLogId },
    })

    return NextResponse.json({
      success: true,
      message: 'Time log deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting time log:', error)
    return NextResponse.json(
      { error: 'Failed to delete time log' },
      { status: 500 }
    )
  }
}

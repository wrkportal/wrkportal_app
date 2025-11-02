import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET - Check if user has an active timer
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeTimer = await prisma.timeTracking.findFirst({
      where: {
        userId: session.user.id,
        endTime: null,
      },
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
      },
      orderBy: {
        startTime: 'desc',
      },
    })

    return NextResponse.json({
      activeTimer,
      hasActiveTimer: !!activeTimer,
      success: true,
    })
  } catch (error) {
    console.error('Error checking active timer:', error)
    return NextResponse.json(
      { error: 'Failed to check active timer' },
      { status: 500 }
    )
  }
}

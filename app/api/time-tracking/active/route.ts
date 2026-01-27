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

    // Check if TimeTracking model exists
    if (!prisma.timeTracking) {
      console.warn('TimeTracking model not available')
      return NextResponse.json({
        activeTimer: null,
        hasActiveTimer: false,
        success: true,
      })
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
  } catch (error: any) {
    console.error('Error checking active timer:', error)
    
    // Handle database model not found errors gracefully
    if (error.code === 'P2001' || 
        error.message?.includes('does not exist') || 
        error.message?.includes('Unknown model') ||
        error.message?.includes('TimeTracking')) {
      console.warn('TimeTracking model not available')
      return NextResponse.json({
        activeTimer: null,
        hasActiveTimer: false,
        success: true,
      })
    }
    
    return NextResponse.json(
      { error: 'Failed to check active timer' },
      { status: 500 }
    )
  }
}

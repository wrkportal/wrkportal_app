import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/notifications/count - Get unread notification count
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const count = await prisma.notification.count({
        where: {
          userId: session.user.id,
          read: false,
        },
      })

      return NextResponse.json({ count })
    } catch (dbError: any) {
      // Handle case where Notification table might not exist yet
      // This can happen during initial setup or if migrations haven't run
      if (dbError.code === 'P2001' || dbError.message?.includes('does not exist')) {
        console.warn('Notification table not found, returning 0 count')
        return NextResponse.json({ count: 0 })
      }
      throw dbError
    }
  } catch (error) {
    console.error('Error fetching notification count:', error)
    // Return 0 instead of 500 to prevent UI errors
    // The notification system might not be fully set up yet
    return NextResponse.json({ count: 0 })
  }
}


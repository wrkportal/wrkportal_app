import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// DELETE /api/notifications/clear-all - Delete all notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete all user's read notifications
    const result = await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
        read: true, // Only delete read notifications for safety
      },
    })

    return NextResponse.json({ count: result.count })
  } catch (error) {
    console.error('Error clearing notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


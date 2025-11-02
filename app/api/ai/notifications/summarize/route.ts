import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { summarizeNotifications } from '@/lib/ai/services/notification-summarizer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { notifications } = body

    if (!notifications) {
      return NextResponse.json(
        { error: 'Notifications are required' },
        { status: 400 }
      )
    }

    const summary = await summarizeNotifications(notifications)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Notification summarization error:', error)
    return NextResponse.json(
      { error: 'Failed to summarize notifications' },
      { status: 500 }
    )
  }
}

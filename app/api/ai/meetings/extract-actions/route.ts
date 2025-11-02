import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { extractActionItems } from '@/lib/ai/services/meeting-analyzer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { meetingTitle, meetingDate, attendees, notes } = body

    if (!notes) {
      return NextResponse.json(
        { error: 'Meeting notes are required' },
        { status: 400 }
      )
    }

    const result = await extractActionItems({
      meetingTitle: meetingTitle || 'Meeting',
      meetingDate: meetingDate || new Date().toISOString(),
      attendees: attendees || '',
      notes,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Meeting analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to extract action items' },
      { status: 500 }
    )
  }
}


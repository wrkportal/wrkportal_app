/**
 * AI Meeting Notes Analyzer API
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeMeetingNotes } from '@/lib/ai/services/meeting-analyzer'

export async function POST(request: NextRequest) {
  try {
    const { meetingNotes, meetingTitle, meetingDate, participants } = await request.json()

    if (!meetingNotes || !meetingTitle) {
      return NextResponse.json(
        { error: 'Meeting notes and title are required' },
        { status: 400 }
      )
    }

    const analysis = await analyzeMeetingNotes(
      meetingNotes,
      meetingTitle,
      meetingDate ? new Date(meetingDate) : new Date(),
      participants || []
    )

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Meeting analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze meeting notes' },
      { status: 500 }
    )
  }
}


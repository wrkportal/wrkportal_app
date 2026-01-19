/**
 * Smart Replies API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  generateSmartReplies,
} from '@/lib/sales/smart-replies'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      subject,
      body: emailBody,
      from,
      to,
      threadHistory,
      opportunityId,
      leadId,
      accountId,
      tone,
      length,
      count,
    } = body

    if (!subject || !emailBody || !from || !to) {
      return NextResponse.json(
        { error: 'Subject, body, from, and to are required' },
        { status: 400 }
      )
    }

    const replies = await generateSmartReplies(
      {
        subject,
        body: emailBody,
        from,
        to,
        threadHistory,
        opportunityId,
        leadId,
        accountId,
      },
      {
        tone,
        length,
        count,
      }
    )

    return NextResponse.json({ replies })
  } catch (error: any) {
    console.error('Error generating smart replies:', error)
    return NextResponse.json(
      { error: 'Failed to generate smart replies', details: error.message },
      { status: 500 }
    )
  }
}


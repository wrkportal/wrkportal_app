/**
 * AI Project Charter Generator API
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateProjectCharter } from '@/lib/ai/services/charter-generator'

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()

    if (!input.projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      )
    }

    const charter = await generateProjectCharter(input)

    return NextResponse.json({ charter })
  } catch (error) {
    console.error('Charter generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate project charter' },
      { status: 500 }
    )
  }
}


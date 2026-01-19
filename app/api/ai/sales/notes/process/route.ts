import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { processNote } from '@/lib/ai/services/sales/smart-notes'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { noteContent, context } = await request.json()

    if (!noteContent) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 })
    }

    const processed = await processNote(noteContent, context)

    return NextResponse.json(processed)
  } catch (error: any) {
    console.error('Error processing note:', error)
    return NextResponse.json(
      { error: 'Failed to process note', details: error.message },
      { status: 500 }
    )
  }
}


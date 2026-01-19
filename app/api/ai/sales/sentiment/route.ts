import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeSentiment } from '@/lib/ai/services/sales/sentiment-analyzer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, context } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const sentiment = await analyzeSentiment(text, context)

    return NextResponse.json(sentiment)
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error)
    return NextResponse.json(
      { error: 'Failed to analyze sentiment', details: error.message },
      { status: 500 }
    )
  }
}


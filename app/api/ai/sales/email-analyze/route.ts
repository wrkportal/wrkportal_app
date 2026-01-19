import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeEmail } from '@/lib/ai/services/sales/email-intelligence'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { emailContent, metadata } = await request.json()

    if (!emailContent) {
      return NextResponse.json({ error: 'Email content is required' }, { status: 400 })
    }

    const analysis = await analyzeEmail(emailContent, metadata)

    return NextResponse.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing email:', error)
    return NextResponse.json(
      { error: 'Failed to analyze email', details: error.message },
      { status: 500 }
    )
  }
}


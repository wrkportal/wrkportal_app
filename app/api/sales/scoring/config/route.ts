import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { LeadScoringEngine } from '@/lib/sales/lead-scoring'
import type { LeadScoringConfig } from '@/lib/sales/lead-scoring'

/**
 * Lead Scoring Configuration API
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await LeadScoringEngine.getScoringConfig(session.user.tenantId!)

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Error fetching scoring config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scoring config', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const config = body as LeadScoringConfig

    await LeadScoringEngine.updateScoringConfig(session.user.tenantId!, config)

    return NextResponse.json({
      success: true,
      message: 'Scoring configuration updated',
    })
  } catch (error: any) {
    console.error('Error updating scoring config:', error)
    return NextResponse.json(
      { error: 'Failed to update scoring config', details: error.message },
      { status: 500 }
    )
  }
}


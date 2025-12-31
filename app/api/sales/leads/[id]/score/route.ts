import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { LeadScoringEngine } from '@/lib/sales/lead-scoring'

/**
 * Recalculate lead score
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const score = await LeadScoringEngine.calculateScore(
      params.id,
      session.user.tenantId!
    )

    return NextResponse.json({
      success: true,
      score,
    })
  } catch (error: any) {
    console.error('Error calculating lead score:', error)
    return NextResponse.json(
      { error: 'Failed to calculate score', details: error.message },
      { status: 500 }
    )
  }
}


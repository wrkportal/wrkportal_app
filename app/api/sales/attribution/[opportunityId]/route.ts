/**
 * Attribution Analysis API - Single Opportunity
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  analyzeOpportunityAttribution,
} from '@/lib/sales/attribution-analysis'

export async function GET(
  request: NextRequest,
  { params }: { params: { opportunityId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await analyzeOpportunityAttribution(
      params.opportunityId,
      session.user.tenantId
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error analyzing opportunity attribution:', error)
    return NextResponse.json(
      { error: 'Failed to analyze attribution', details: error.message },
      { status: 500 }
    )
  }
}


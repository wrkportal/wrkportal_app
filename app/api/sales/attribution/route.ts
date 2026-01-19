/**
 * Attribution Analysis API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  analyzeAttribution,
  getAttributionSummary,
} from '@/lib/sales/attribution-analysis'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const summary = searchParams.get('summary') === 'true'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const ownerId = searchParams.get('ownerId')
    const stage = searchParams.get('stage')

    if (summary) {
      const result = await getAttributionSummary(
        session.user.tenantId,
        {
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        }
      )
      return NextResponse.json(result)
    }

    const results = await analyzeAttribution(
      session.user.tenantId,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ownerId: ownerId || undefined,
        stage: stage || undefined,
      }
    )

    return NextResponse.json(results)
  } catch (error: any) {
    console.error('Error analyzing attribution:', error)
    return NextResponse.json(
      { error: 'Failed to analyze attribution', details: error.message },
      { status: 500 }
    )
  }
}


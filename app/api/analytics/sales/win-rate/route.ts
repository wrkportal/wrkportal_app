import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeWinRates } from '@/lib/analytics/sales/win-rate-analysis'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const analysis = await analyzeWinRates(
      session.user.tenantId,
      startDate,
      endDate
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing win rates:', error)
    return NextResponse.json(
      { error: 'Failed to analyze win rates' },
      { status: 500 }
    )
  }
}


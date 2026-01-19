import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeTimeToClose } from '@/lib/analytics/sales/time-to-close'

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

    const analysis = await analyzeTimeToClose(
      session.user.tenantId,
      startDate,
      endDate
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing time to close:', error)
    return NextResponse.json(
      { error: 'Failed to analyze time to close' },
      { status: 500 }
    )
  }
}


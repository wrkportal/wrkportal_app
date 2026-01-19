import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeRepPerformance, compareTeamPerformance } from '@/lib/analytics/sales/rep-performance'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const repId = searchParams.get('repId')
    const repIds = searchParams.get('repIds')?.split(',')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    if (repIds && repIds.length > 0) {
      // Team comparison
      const comparison = await compareTeamPerformance(
        session.user.tenantId,
        repIds,
        startDate,
        endDate
      )
      return NextResponse.json(comparison)
    } else if (repId) {
      // Individual rep
      const performance = await analyzeRepPerformance(
        session.user.tenantId,
        repId,
        startDate,
        endDate
      )
      return NextResponse.json(performance)
    } else {
      return NextResponse.json(
        { error: 'repId or repIds parameter is required' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error analyzing rep performance:', error)
    return NextResponse.json(
      { error: 'Failed to analyze rep performance' },
      { status: 500 }
    )
  }
}


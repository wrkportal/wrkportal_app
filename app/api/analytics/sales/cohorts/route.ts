import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { analyzeCohorts } from '@/lib/analytics/sales/cohort-analysis'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const cohortType = (searchParams.get('cohortType') as 'month' | 'quarter' | 'year') || 'month'
    const metric = (searchParams.get('metric') as 'revenue' | 'customers' | 'orders') || 'revenue'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    const analysis = await analyzeCohorts(
      session.user.tenantId,
      cohortType,
      metric,
      startDate,
      endDate
    )

    return NextResponse.json(analysis)
  } catch (error) {
    console.error('Error analyzing cohorts:', error)
    return NextResponse.json(
      { error: 'Failed to analyze cohorts' },
      { status: 500 }
    )
  }
}


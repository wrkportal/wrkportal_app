import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { forecast, type TimeSeriesData, type ForecastOptions } from '@/lib/reporting-studio/predictive-analytics/forecasting'

/**
 * POST /api/reporting-studio/predictive/forecast
 * Generate time series forecast
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { data, options } = body

    if (!data || !Array.isArray(data) || data.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 data points are required' },
        { status: 400 }
      )
    }

    if (!options || !options.method || !options.periods) {
      return NextResponse.json(
        { error: 'Forecast options (method, periods) are required' },
        { status: 400 }
      )
    }

    // Validate and convert data
    const timeSeriesData: TimeSeriesData[] = data.map((point: any) => ({
      date: point.date || point.timestamp || new Date().toISOString(),
      value: typeof point.value === 'number' ? point.value : parseFloat(point.value),
    }))

    // Generate forecast
    const forecastOptions: ForecastOptions = {
      method: options.method,
      periods: options.periods,
      confidenceInterval: options.confidenceInterval || 0.95,
      seasonality: options.seasonality,
    }

    const forecastResult = forecast(timeSeriesData, forecastOptions)

    return NextResponse.json({
      forecast: forecastResult,
      historical: timeSeriesData,
      method: options.method,
      periods: options.periods,
    })
  } catch (error: any) {
    console.error('Error generating forecast:', error)
    return NextResponse.json(
      { error: 'Failed to generate forecast', details: error.message },
      { status: 500 }
    )
  }
}


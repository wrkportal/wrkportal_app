import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  linearRegression,
  polynomialRegression,
  logisticRegression,
  type RegressionDataPoint,
} from '@/lib/reporting-studio/predictive-analytics/regression'

/**
 * POST /api/reporting-studio/predictive/regression
 * Perform regression analysis
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
    const { data, type = 'linear' } = body

    if (!data || !Array.isArray(data) || data.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 data points are required' },
        { status: 400 }
      )
    }

    // Convert data
    const regressionData: RegressionDataPoint[] = data.map((point: any) => ({
      x: typeof point.x === 'number' ? point.x : parseFloat(point.x),
      y: typeof point.y === 'number' ? point.y : parseFloat(point.y),
    }))

    // Perform regression
    let result
    switch (type) {
      case 'linear':
        result = linearRegression(regressionData)
        break
      case 'polynomial':
        result = polynomialRegression(regressionData)
        break
      case 'logistic':
        result = logisticRegression(regressionData)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid regression type. Must be linear, polynomial, or logistic' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing regression:', error)
    return NextResponse.json(
      { error: 'Failed to perform regression', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  correlationMatrix,
  zScoreNormalize,
  percentile,
  interquartileRange,
  detectOutliers,
  covariance,
  coefficientOfVariation,
  standardError,
  tTest,
  chiSquareTest,
} from '@/lib/reporting-studio/advanced-analytics/statistical-functions'

/**
 * POST /api/reporting-studio/analytics/statistical
 * Perform advanced statistical analysis
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
    const { function: func, data, options = {} } = body

    if (!func || !data) {
      return NextResponse.json(
        { error: 'Function name and data are required' },
        { status: 400 }
      )
    }

    let result: any

    switch (func) {
      case 'correlation_matrix':
        if (!Array.isArray(data) || !Array.isArray(data[0])) {
          throw new Error('Data must be a 2D array')
        }
        result = correlationMatrix(data)
        break

      case 'z_score_normalize':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        result = zScoreNormalize(data)
        break

      case 'percentile':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        if (typeof options.percentile !== 'number') {
          throw new Error('Percentile value (0-100) is required')
        }
        result = percentile(data, options.percentile)
        break

      case 'interquartile_range':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        result = interquartileRange(data)
        break

      case 'detect_outliers':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        result = detectOutliers(data)
        break

      case 'covariance':
        if (!Array.isArray(data.x) || !Array.isArray(data.y)) {
          throw new Error('Data must have x and y arrays')
        }
        result = covariance(data.x, data.y)
        break

      case 'coefficient_of_variation':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        result = coefficientOfVariation(data)
        break

      case 'standard_error':
        if (!Array.isArray(data) || !data.every((v: any) => typeof v === 'number')) {
          throw new Error('Data must be an array of numbers')
        }
        result = standardError(data)
        break

      case 't_test':
        if (!Array.isArray(data.sample1) || !Array.isArray(data.sample2)) {
          throw new Error('Data must have sample1 and sample2 arrays')
        }
        result = tTest(data.sample1, data.sample2)
        break

      case 'chi_square_test':
        if (!Array.isArray(data.observed) || !Array.isArray(data.observed[0])) {
          throw new Error('Data must have observed 2D array')
        }
        result = chiSquareTest(
          data.observed,
          data.expected
        )
        break

      default:
        return NextResponse.json(
          { error: `Unknown function: ${func}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      function: func,
      result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error performing statistical analysis:', error)
    return NextResponse.json(
      { error: 'Failed to perform statistical analysis', details: error.message },
      { status: 500 }
    )
  }
}


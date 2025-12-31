import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  knnClassifier,
  decisionTreeClassifier,
  naiveBayesClassifier,
  type ClassificationDataPoint,
} from '@/lib/reporting-studio/predictive-analytics/classification'

/**
 * POST /api/reporting-studio/predictive/classify
 * Train and test classification model
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
    const { trainingData, testData, model = 'knn', k = 3 } = body

    if (!trainingData || !Array.isArray(trainingData) || trainingData.length === 0) {
      return NextResponse.json(
        { error: 'Training data is required' },
        { status: 400 }
      )
    }

    if (!testData || !Array.isArray(testData) || testData.length === 0) {
      return NextResponse.json(
        { error: 'Test data is required' },
        { status: 400 }
      )
    }

    // Convert data
    const train: ClassificationDataPoint[] = trainingData.map((point: any) => ({
      features: Array.isArray(point.features) ? point.features.map((f: any) => parseFloat(f)) : [],
      label: point.label,
    }))

    const test: ClassificationDataPoint[] = testData.map((point: any) => ({
      features: Array.isArray(point.features) ? point.features.map((f: any) => parseFloat(f)) : [],
      label: point.label,
    }))

    // Train and test model
    let result
    switch (model) {
      case 'knn':
        result = knnClassifier(train, test, k)
        break
      case 'decision_tree':
        result = decisionTreeClassifier(train, test)
        break
      case 'naive_bayes':
        result = naiveBayesClassifier(train, test)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid model type. Must be knn, decision_tree, or naive_bayes' },
          { status: 400 }
        )
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing classification:', error)
    return NextResponse.json(
      { error: 'Failed to perform classification', details: error.message },
      { status: 500 }
    )
  }
}


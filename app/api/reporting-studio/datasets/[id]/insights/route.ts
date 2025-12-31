import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

/**
 * GET /api/reporting-studio/datasets/[id]/insights
 * Get stored insights for a dataset
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if dataset exists
    const dataset = await prisma.reportingDataset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // Fetch stored insights for this dataset
    const storedInsights = await prisma.reportingInsight.findMany({
      where: {
        datasetId: params.id,
        tenantId: user.tenantId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        userActions: {
          where: {
            userId: user.id,
          },
          select: {
            actionType: true,
            createdAt: true,
          },
        },
      },
    })

    // Convert to API format
    const insights = storedInsights.map(insight => ({
      id: insight.id,
      type: insight.insightType.toLowerCase(),
      title: insight.title,
      description: insight.description,
      severity: insight.severity.toLowerCase(),
      confidence: insight.confidence,
      actionable: insight.actionable,
      recommendation: insight.recommendation,
      data: insight.data,
      metadata: insight.metadata,
      columnName: insight.columnName,
      columnNames: insight.columnNames,
      generatedBy: insight.generatedBy,
      createdAt: insight.createdAt.toISOString(),
      userActions: insight.userActions.map(a => ({
        type: a.actionType.toLowerCase(),
        createdAt: a.createdAt.toISOString(),
      })),
      isDismissed: insight.userActions.some(a => a.actionType === 'DISMISSED'),
      isFavorited: insight.userActions.some(a => a.actionType === 'FAVORITED'),
    }))

    return NextResponse.json({
      insights,
      count: insights.length,
      datasetId: params.id,
    })
  } catch (error: any) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights', details: error.message },
      { status: 500 }
    )
  }
}


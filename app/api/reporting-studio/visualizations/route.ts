import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { CreateVisualizationRequest } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/visualizations
 * List all visualizations for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || String(REPORTING_STUDIO_CONFIG.DEFAULT_PAGE_SIZE)),
      REPORTING_STUDIO_CONFIG.MAX_PAGE_SIZE
    )
    const type = searchParams.get('type')
    const datasetId = searchParams.get('dataset_id')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (type) {
      where.type = type
    }

    if (datasetId) {
      where.datasetId = datasetId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [visualizations, total] = await Promise.all([
      prisma.reportingVisualization.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          dataset: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              dashboardWidgets: true,
            },
          },
        },
      }),
      prisma.reportingVisualization.count({ where }),
    ])

    return NextResponse.json({
      items: visualizations,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error: any) {
    console.error('Error fetching visualizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualizations', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reporting-studio/visualizations
 * Create a new visualization
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body: CreateVisualizationRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.type || !body.datasetId || !body.config) {
      return NextResponse.json(
        { error: 'Name, type, datasetId, and config are required' },
        { status: 400 }
      )
    }

    // Validate dataset exists
    const dataset = await prisma.reportingDataset.findFirst({
      where: {
        id: body.datasetId,
        tenantId: user.tenantId,
      },
    })

    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      )
    }

    // TODO: Validate visualization config based on type
    // TODO: Validate filters against dataset schema

    const visualization = await prisma.reportingVisualization.create({
      data: {
        tenantId: user.tenantId,
        name: body.name,
        description: body.description,
        type: body.type,
        datasetId: body.datasetId,
        config: body.config,
        query: body.query,
        filters: body.filters || undefined,
        xAxis: body.xAxis,
        yAxis: body.yAxis,
        series: body.series || undefined,
        styling: body.styling || undefined,
        width: body.width || REPORTING_STUDIO_CONFIG.DEFAULT_CHART_WIDTH,
        height: body.height || REPORTING_STUDIO_CONFIG.DEFAULT_CHART_HEIGHT,
        isPublic: body.isPublic || false,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dataset: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'VISUALIZATION',
        entityId: visualization.id,
        action: 'CREATE',
      },
    })

    return NextResponse.json(visualization, { status: 201 })
  } catch (error: any) {
    console.error('Error creating visualization:', error)
    return NextResponse.json(
      { error: 'Failed to create visualization', details: error.message },
      { status: 500 }
    )
  }
}


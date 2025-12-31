import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { CreateDatasetRequest } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/datasets
 * List all datasets for the authenticated user's tenant
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
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [datasets, total] = await Promise.all([
      prisma.reportingDataset.findMany({
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
          dataSource: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
          _count: {
            select: {
              visualizations: true,
            },
          },
        },
      }),
      prisma.reportingDataset.count({ where }),
    ])

    return NextResponse.json({
      items: datasets,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error: any) {
    console.error('Error fetching datasets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch datasets', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reporting-studio/datasets
 * Create a new dataset
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

    const body: CreateDatasetRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Validate data source exists if provided
    if (body.dataSourceId) {
      const dataSource = await prisma.reportingDataSource.findFirst({
        where: {
          id: body.dataSourceId,
          tenantId: user.tenantId,
        },
      })

      if (!dataSource) {
        return NextResponse.json(
          { error: 'Data source not found' },
          { status: 404 }
        )
      }
    }

    // Validate file exists if provided
    if (body.fileId) {
      const file = await prisma.reportingFile.findFirst({
        where: {
          id: body.fileId,
          tenantId: user.tenantId,
        },
      })

      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
    }

    // Validate refresh schedule format if provided
    if (body.refreshSchedule) {
      // TODO: Validate cron expression format
    }

    const dataset = await prisma.reportingDataset.create({
      data: {
        tenantId: user.tenantId,
        name: body.name,
        description: body.description,
        type: body.type,
        dataSourceId: body.dataSourceId,
        fileId: body.fileId,
        query: body.query,
        transformationConfig: body.transformationConfig || undefined,
        refreshSchedule: body.refreshSchedule,
        status: 'ACTIVE',
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
        dataSource: {
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
        entityType: 'DATASET',
        entityId: dataset.id,
        action: 'CREATE',
      },
    })

    return NextResponse.json(dataset, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dataset:', error)
    return NextResponse.json(
      { error: 'Failed to create dataset', details: error.message },
      { status: 500 }
    )
  }
}


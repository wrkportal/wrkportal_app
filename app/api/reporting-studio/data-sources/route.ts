import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { CreateDataSourceRequest, DataSourceType } from '@/types/reporting-studio'
import { encryptJSON } from '@/lib/reporting-studio/encryption'

/**
 * GET /api/reporting-studio/data-sources
 * List all data sources for the authenticated user's tenant
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
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const status = searchParams.get('status')
    const type = searchParams.get('type') as DataSourceType | null

    const where: any = {
      tenantId: user.tenantId,
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [dataSources, total] = await Promise.all([
      prisma.reportingDataSource.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              datasets: true,
              tables: true,
            },
          },
        },
      }),
      prisma.reportingDataSource.count({ where }),
    ])

    return NextResponse.json({
      items: dataSources,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error: any) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data sources', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reporting-studio/data-sources
 * Create a new data source
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

    const body: CreateDataSourceRequest = await request.json()

    // Encrypt connection config (especially passwords)
    const encryptedConfig = encryptJSON(body.connectionConfig)

    const dataSource = await prisma.reportingDataSource.create({
      data: {
        tenantId: user.tenantId,
        name: body.name,
        description: body.description,
        type: body.type,
        provider: body.provider,
        connectionConfig: encryptedConfig,
        status: 'ACTIVE',
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
      },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DATASOURCE',
        entityId: dataSource.id,
        action: 'CREATE',
      },
    })

    return NextResponse.json(dataSource, { status: 201 })
  } catch (error: any) {
    console.error('Error creating data source:', error)
    return NextResponse.json(
      { error: 'Failed to create data source', details: error.message },
      { status: 500 }
    )
  }
}


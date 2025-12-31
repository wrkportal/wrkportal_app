import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { CreateDashboardRequest } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/dashboards
 * List all dashboards for the authenticated user's tenant
 */
export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = Math.min(
      parseInt(searchParams.get('pageSize') || String(REPORTING_STUDIO_CONFIG.DEFAULT_PAGE_SIZE)),
      REPORTING_STUDIO_CONFIG.MAX_PAGE_SIZE
    )
    const search = searchParams.get('search')

    const where: any = {
      tenantId: user.tenantId,
      deletedAt: null,
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [dashboards, total] = await Promise.all([
      prisma.reportingDashboard.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          createdByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          updatedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              widgets: true,
              datasets: true,
              reports: true,
            },
          },
        },
      }),
      prisma.reportingDashboard.count({ where }),
    ])

    return NextResponse.json({
      items: dashboards,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    })
  } catch (error: any) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reporting-studio/dashboards
 * Create a new dashboard
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

    const body: CreateDashboardRequest = await request.json()

    // Validate required fields
    if (!body.name || !body.configuration) {
      return NextResponse.json(
        { error: 'Name and configuration are required' },
        { status: 400 }
      )
    }

    // Validate widget count
    if (body.configuration.widgets && body.configuration.widgets.length > REPORTING_STUDIO_CONFIG.MAX_WIDGETS_PER_DASHBOARD) {
      return NextResponse.json(
        { error: `Maximum ${REPORTING_STUDIO_CONFIG.MAX_WIDGETS_PER_DASHBOARD} widgets allowed per dashboard` },
        { status: 400 }
      )
    }

    // TODO: Validate widgets and datasets exist
    // TODO: Validate dashboard configuration structure

    const dashboard = await prisma.reportingDashboard.create({
      data: {
        tenantId: user.tenantId,
        name: body.name,
        description: body.description,
        configuration: body.configuration,
        createdBy: user.id,
        updatedBy: user.id,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedByUser: {
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
        entityType: 'DASHBOARD',
        entityId: dashboard.id,
        action: 'CREATE',
      },
    })

    return NextResponse.json(dashboard, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard', details: error.message },
      { status: 500 }
    )
  }
}


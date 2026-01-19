import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: List dashboards
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const functionalArea = request.nextUrl.searchParams.get('functionalArea')
    const tenantId = session.user.tenantId

    if (!functionalArea) {
      return NextResponse.json(
        { error: 'functionalArea is required' },
        { status: 400 }
      )
    }

    const where: any = {
      functionalArea,
      OR: [
        { createdById: session.user.id },
        { isPublic: true },
        {
          sharedWith: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    }

    const dashboards = await prisma.dashboard.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        visualizations: {
          include: {
            visualization: {
              include: {
                query: {
                  include: {
                    dataSource: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            visualizations: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ dashboards })
  } catch (error: any) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboards', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create dashboard
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      functionalArea,
      layout,
      autoRefresh,
      refreshInterval,
      tags,
      isDefault,
    } = body

    if (!name || !functionalArea) {
      return NextResponse.json(
        { error: 'Name and functionalArea are required' },
        { status: 400 }
      )
    }

    // If setting as default, unset other defaults for this functional area
    if (isDefault) {
      await prisma.dashboard.updateMany({
        where: {
          functionalArea,
          createdById: session.user.id,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        functionalArea,
        layout: layout || { columns: 12, rowHeight: 80, items: [] },
        autoRefresh: autoRefresh || false,
        refreshInterval: refreshInterval || null,
        tags: tags || [],
        isDefault: isDefault || false,
        createdById: session.user.id,
        tenantId: session.user.tenantId,
      },
    })

    return NextResponse.json({ dashboard }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to create dashboard', details: error.message },
      { status: 500 }
    )
  }
}

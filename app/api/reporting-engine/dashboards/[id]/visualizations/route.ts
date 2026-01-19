import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST: Add visualization to dashboard
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dashboardId } = await params
    const body = await request.json()
    const { visualizationId, position, order, customConfig, pageId } = body

    if (!visualizationId) {
      return NextResponse.json(
        { error: 'visualizationId is required' },
        { status: 400 }
      )
    }

    // Check dashboard access
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const share = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId,
        userId: session.user.id,
        permission: { in: ['EDIT', 'ADMIN'] },
      },
    })

    if (dashboard.createdById !== session.user.id && !share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if visualization exists
    const visualization = await prisma.visualization.findUnique({
      where: { id: visualizationId },
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // Check if already added
    const existing = await prisma.dashboardVisualization.findUnique({
      where: {
        dashboardId_visualizationId: {
          dashboardId,
          visualizationId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Visualization already added to dashboard' },
        { status: 400 }
      )
    }

    // Add visualization to dashboard
    // Store pageId in position object or customConfig if needed
    const positionData = position || { x: 0, y: 0, w: visualization.defaultWidth, h: visualization.defaultHeight }
    const customConfigData = customConfig || {}
    if (pageId) {
      // Store pageId in customConfig for easy access
      customConfigData.pageId = pageId
    }
    
    const dashboardViz = await prisma.dashboardVisualization.create({
      data: {
        dashboardId,
        visualizationId,
        position: positionData,
        order: order || 0,
        customConfig: Object.keys(customConfigData).length > 0 ? customConfigData : null,
      },
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
    })

    return NextResponse.json({ dashboardVisualization: dashboardViz }, { status: 201 })
  } catch (error: any) {
    console.error('Error adding visualization to dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to add visualization', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Remove visualization from dashboard
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dashboardId } = await params
    const body = await request.json().catch(() => ({}))
    const visualizationId = body.visualizationId || request.nextUrl.searchParams.get('visualizationId')

    if (!visualizationId) {
      return NextResponse.json(
        { error: 'visualizationId is required' },
        { status: 400 }
      )
    }

    // Check dashboard access
    const dashboard = await prisma.dashboard.findUnique({
      where: { id: dashboardId },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const share = await prisma.dashboardShare.findFirst({
      where: {
        dashboardId,
        userId: session.user.id,
        permission: { in: ['EDIT', 'ADMIN'] },
      },
    })

    if (dashboard.createdById !== session.user.id && !share) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.dashboardVisualization.delete({
      where: {
        dashboardId_visualizationId: {
          dashboardId,
          visualizationId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing visualization from dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to remove visualization', details: error.message },
      { status: 500 }
    )
  }
}

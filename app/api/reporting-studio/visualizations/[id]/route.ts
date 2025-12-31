import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

/**
 * GET /api/reporting-studio/visualizations/[id]
 * Get a specific visualization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const visualization = await prisma.reportingVisualization.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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
            status: true,
          },
        },
        _count: {
          select: {
            dashboardWidgets: true,
          },
        },
      },
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // TODO: Check permissions

    return NextResponse.json(visualization)
  } catch (error: any) {
    console.error('Error fetching visualization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualization', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reporting-studio/visualizations/[id]
 * Update a visualization
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json()

    // Check if visualization exists
    const existing = await prisma.reportingVisualization.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // TODO: Check edit permissions

    const updateData: any = {
      updatedById: user.id,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.config !== undefined) updateData.config = body.config
    if (body.query !== undefined) updateData.query = body.query
    if (body.filters !== undefined) updateData.filters = body.filters
    if (body.xAxis !== undefined) updateData.xAxis = body.xAxis
    if (body.yAxis !== undefined) updateData.yAxis = body.yAxis
    if (body.series !== undefined) updateData.series = body.series
    if (body.styling !== undefined) updateData.styling = body.styling
    if (body.width !== undefined) updateData.width = body.width
    if (body.height !== undefined) updateData.height = body.height
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    const visualization = await prisma.reportingVisualization.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        updatedBy: {
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
        action: 'UPDATE',
      },
    })

    return NextResponse.json(visualization)
  } catch (error: any) {
    console.error('Error updating visualization:', error)
    return NextResponse.json(
      { error: 'Failed to update visualization', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reporting-studio/visualizations/[id]
 * Delete a visualization
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Check if visualization exists
    const existing = await prisma.reportingVisualization.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            dashboardWidgets: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // TODO: Check delete permissions

    // Check if visualization is in use by dashboards
    if (existing._count.dashboardWidgets > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete visualization that is used in dashboards',
          inUse: {
            dashboards: existing._count.dashboardWidgets,
          },
        },
        { status: 400 }
      )
    }

    await prisma.reportingVisualization.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'VISUALIZATION',
        entityId: params.id,
        action: 'DELETE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting visualization:', error)
    return NextResponse.json(
      { error: 'Failed to delete visualization', details: error.message },
      { status: 500 }
    )
  }
}


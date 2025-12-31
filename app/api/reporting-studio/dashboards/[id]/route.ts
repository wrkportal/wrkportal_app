import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * GET /api/reporting-studio/dashboards/[id]
 * Get a specific dashboard with all widgets and datasets
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

    const dashboard = await prisma.reportingDashboard.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
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
        widgets: {
          include: {
            visualization: {
              include: {
                dataset: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
        datasets: {
          include: {
            dataset: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // TODO: Check permissions

    return NextResponse.json(dashboard)
  } catch (error: any) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reporting-studio/dashboards/[id]
 * Update a dashboard
 */
export async function PATCH(
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

    const body = await request.json()

    // Check if dashboard exists
    const existing = await prisma.reportingDashboard.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // TODO: Check edit permissions

    const updateData: any = {
      updatedBy: user.id,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.configuration !== undefined) {
      // Validate widget count
      if (body.configuration.widgets && body.configuration.widgets.length > REPORTING_STUDIO_CONFIG.MAX_WIDGETS_PER_DASHBOARD) {
        return NextResponse.json(
          { error: `Maximum ${REPORTING_STUDIO_CONFIG.MAX_WIDGETS_PER_DASHBOARD} widgets allowed per dashboard` },
          { status: 400 }
        )
      }
      updateData.configuration = body.configuration
    }

    const dashboard = await prisma.reportingDashboard.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'UPDATE',
      },
    })

    return NextResponse.json(dashboard)
  } catch (error: any) {
    console.error('Error updating dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to update dashboard', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reporting-studio/dashboards/[id]
 * Soft delete a dashboard
 */
export async function DELETE(
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

    // Check if dashboard exists
    const existing = await prisma.reportingDashboard.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    // TODO: Check delete permissions

    // Soft delete
    await prisma.reportingDashboard.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        updatedBy: user.id,
      },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DASHBOARD',
        entityId: params.id,
        action: 'DELETE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to delete dashboard', details: error.message },
      { status: 500 }
    )
  }
}


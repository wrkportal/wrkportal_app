import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { DatasetStatus } from '@/types/reporting-studio'

/**
 * GET /api/reporting-studio/datasets/[id]
 * Get a specific dataset
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

    const dataset = await prisma.reportingDataset.findFirst({
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
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        _count: {
          select: {
            visualizations: true,
            dashboards: true,
          },
        },
      },
    })

    if (!dataset) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // TODO: Check permissions (user, org unit, role-based)

    return NextResponse.json(dataset)
  } catch (error: any) {
    console.error('Error fetching dataset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dataset', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reporting-studio/datasets/[id]
 * Update a dataset
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

    // Check if dataset exists
    const existing = await prisma.reportingDataset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // TODO: Check edit permissions

    const updateData: any = {
      updatedById: user.id,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.query !== undefined) updateData.query = body.query
    if (body.transformationConfig !== undefined) updateData.transformationConfig = body.transformationConfig
    if (body.refreshSchedule !== undefined) updateData.refreshSchedule = body.refreshSchedule
    if (body.status !== undefined) updateData.status = body.status
    if (body.isPublic !== undefined) updateData.isPublic = body.isPublic

    const dataset = await prisma.reportingDataset.update({
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
      },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DATASET',
        entityId: dataset.id,
        action: 'UPDATE',
      },
    })

    return NextResponse.json(dataset)
  } catch (error: any) {
    console.error('Error updating dataset:', error)
    return NextResponse.json(
      { error: 'Failed to update dataset', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reporting-studio/datasets/[id]
 * Delete a dataset
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

    // Check if dataset exists
    const existing = await prisma.reportingDataset.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            visualizations: true,
            dashboards: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
    }

    // TODO: Check delete permissions

    // Check if dataset is in use
    if (existing._count.visualizations > 0 || existing._count.dashboards > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete dataset that is in use by visualizations or dashboards',
          inUse: {
            visualizations: existing._count.visualizations,
            dashboards: existing._count.dashboards,
          },
        },
        { status: 400 }
      )
    }

    await prisma.reportingDataset.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DATASET',
        entityId: params.id,
        action: 'DELETE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting dataset:', error)
    return NextResponse.json(
      { error: 'Failed to delete dataset', details: error.message },
      { status: 500 }
    )
  }
}


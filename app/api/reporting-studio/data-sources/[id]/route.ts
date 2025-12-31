import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { UpdateDataSourceRequest } from '@/types/reporting-studio'
import { encryptJSON } from '@/lib/reporting-studio/encryption'

/**
 * GET /api/reporting-studio/data-sources/[id]
 * Get a specific data source
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

    const dataSource = await prisma.reportingDataSource.findFirst({
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
        _count: {
          select: {
            datasets: true,
            tables: true,
          },
        },
      },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // TODO: Decrypt connection config (remove password before sending)
    // For security, we should not send the full connection config
    const { connectionConfig, ...safeDataSource } = dataSource

    return NextResponse.json({
      ...safeDataSource,
      hasConnection: !!connectionConfig,
    })
  } catch (error: any) {
    console.error('Error fetching data source:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data source', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/reporting-studio/data-sources/[id]
 * Update a data source
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

    const body: UpdateDataSourceRequest = await request.json()

    // Check if data source exists and user has permission
    const existing = await prisma.reportingDataSource.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Encrypt connection config if provided
    const updateData: any = {
      updatedById: user.id,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.connectionConfig) {
      updateData.connectionConfig = encryptJSON(body.connectionConfig)
    }
    if (body.status) updateData.status = body.status

    const dataSource = await prisma.reportingDataSource.update({
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
        entityType: 'DATASOURCE',
        entityId: dataSource.id,
        action: 'UPDATE',
      },
    })

    return NextResponse.json(dataSource)
  } catch (error: any) {
    console.error('Error updating data source:', error)
    return NextResponse.json(
      { error: 'Failed to update data source', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reporting-studio/data-sources/[id]
 * Delete a data source
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

    // Check if data source exists
    const existing = await prisma.reportingDataSource.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        _count: {
          select: {
            datasets: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Check if data source is in use
    if (existing._count.datasets > 0) {
      return NextResponse.json(
        { error: 'Cannot delete data source that is in use by datasets' },
        { status: 400 }
      )
    }

    await prisma.reportingDataSource.delete({
      where: { id: params.id },
    })

    // Log activity
    await prisma.reportingActivity.create({
      data: {
        tenantId: user.tenantId,
        userId: user.id,
        entityType: 'DATASOURCE',
        entityId: params.id,
        action: 'DELETE',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting data source:', error)
    return NextResponse.json(
      { error: 'Failed to delete data source', details: error.message },
      { status: 500 }
    )
  }
}


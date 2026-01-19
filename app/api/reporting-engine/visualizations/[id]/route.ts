import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: Get visualization
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const visualization = await prisma.visualization.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        query: {
          include: {
            dataSource: {
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

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    // Check access
    if (
      visualization.tenantId !== session.user.tenantId &&
      !visualization.isPublic &&
      visualization.createdById !== session.user.id
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ visualization })
  } catch (error: any) {
    console.error('Error fetching visualization:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualization', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update visualization
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const visualization = await prisma.visualization.findUnique({
      where: { id },
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    if (visualization.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get existing visualization to preserve config
    const existing = await prisma.visualization.findUnique({
      where: { id },
      select: { config: true },
    })

    // Merge axis configuration into config if provided
    const existingConfig = existing?.config as any || {}
    const fullConfig = {
      ...existingConfig,
      ...(body.config || {}),
      ...(body.xAxis && { xAxis: body.xAxis }),
      ...(body.yAxis && { yAxis: body.yAxis }),
      ...(body.groupBy && { groupBy: body.groupBy }),
    }

    const updated = await prisma.visualization.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        config: fullConfig,
        ...(body.defaultWidth !== undefined && { defaultWidth: body.defaultWidth }),
        ...(body.defaultHeight !== undefined && { defaultHeight: body.defaultHeight }),
        ...(body.tags !== undefined && { tags: body.tags }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.queryId && { queryId: body.queryId }),
      },
    })

    return NextResponse.json({ visualization: updated })
  } catch (error: any) {
    console.error('Error updating visualization:', error)
    return NextResponse.json(
      { error: 'Failed to update visualization', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete visualization
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const visualization = await prisma.visualization.findUnique({
      where: { id },
    })

    if (!visualization) {
      return NextResponse.json({ error: 'Visualization not found' }, { status: 404 })
    }

    if (visualization.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.visualization.delete({
      where: { id },
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

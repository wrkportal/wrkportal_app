import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { existsSync } from 'fs'

// GET: Get data source details
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

    // Check access
    const access = await prisma.dataSourceAccess.findFirst({
      where: {
        dataSourceId: id,
        OR: [
          { userId: session.user.id },
          { userRole: session.user.role },
        ],
      },
    })

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Check tenant access
    if (dataSource.tenantId && dataSource.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // If no explicit access rules and same tenant, allow
    if (!access && dataSource.tenantId === session.user.tenantId) {
      // Allow access
    } else if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ dataSource })
  } catch (error: any) {
    console.error('Error fetching data source:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data source', details: error.message },
      { status: 500 }
    )
  }
}

// PUT: Update data source
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

    // Check write access
    const access = await prisma.dataSourceAccess.findFirst({
      where: {
        dataSourceId: id,
        userId: session.user.id,
        permission: 'WRITE',
      },
    })

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    if (!access && dataSource.createdById !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update data source
    const updated = await prisma.dataSource.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        connection: body.connection,
        schema: body.schema,
        functionalArea: body.functionalArea,
        syncFrequency: body.syncFrequency,
      },
    })

    return NextResponse.json({ dataSource: updated })
  } catch (error: any) {
    console.error('Error updating data source:', error)
    return NextResponse.json(
      { error: 'Failed to update data source', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE: Delete data source
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

    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Check tenant access first
    if (dataSource.tenantId && dataSource.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user can delete: creator, admin, or has WRITE access
    const hasWriteAccess = await prisma.dataSourceAccess.findFirst({
      where: {
        dataSourceId: id,
        userId: session.user.id,
        permission: 'WRITE',
      },
    })

    const isCreator = dataSource.createdById === session.user.id
    const isAdmin = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN'].includes(session.user.role || '')
    const hasAccess = isCreator || isAdmin || hasWriteAccess

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get related queries first
    const relatedQueries = await prisma.query.findMany({
      where: { dataSourceId: id },
      select: { id: true },
    })

    const queryIds = relatedQueries.map(q => q.id)
    const relatedQueriesCount = queryIds.length

    // Delete related visualizations first (they depend on queries)
    const relatedVisualizations = await prisma.visualization.findMany({
      where: {
        queryId: { in: queryIds },
      },
      select: { id: true },
    })

    const visualizationIds = relatedVisualizations.map(v => v.id)
    const relatedVisualizationsCount = visualizationIds.length

    // Delete dashboard visualizations first (they reference visualizations)
    if (visualizationIds.length > 0) {
      await prisma.dashboardVisualization.deleteMany({
        where: { visualizationId: { in: visualizationIds } },
      })
    }

    // Delete visualizations next
    if (visualizationIds.length > 0) {
      await prisma.visualization.deleteMany({
        where: { id: { in: visualizationIds } },
      })
    }

    // Delete queries next
    if (queryIds.length > 0) {
      await prisma.query.deleteMany({
        where: { id: { in: queryIds } },
      })
    }

    // Delete data source access records
    await prisma.dataSourceAccess.deleteMany({
      where: { dataSourceId: id },
    })

    // Delete the file from filesystem if it exists
    if (dataSource.type === 'FILE') {
      const connection = dataSource.connection as any
      const filePath = connection?.filePath
      
      if (filePath && existsSync(filePath)) {
        try {
          await unlink(filePath)
          console.log(`Deleted file: ${filePath}`)
        } catch (error: any) {
          console.error(`Error deleting file ${filePath}:`, error)
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // Finally, delete the data source from database
    await prisma.dataSource.delete({
      where: { id },
    })

    return NextResponse.json({ 
      success: true,
      deletedQueries: relatedQueriesCount,
      deletedVisualizations: relatedVisualizationsCount,
    })
  } catch (error: any) {
    console.error('Error deleting data source:', error)
    return NextResponse.json(
      { error: 'Failed to delete data source', details: error.message },
      { status: 500 }
    )
  }
}

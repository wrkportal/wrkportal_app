import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: List visualizations
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const functionalArea = request.nextUrl.searchParams.get('functionalArea')
    const tenantId = session.user.tenantId

    const where: any = {
      AND: [
        {
          OR: [
            { tenantId: tenantId },
            { tenantId: null }, // Global visualizations
            { isPublic: true }, // Public visualizations
          ],
        },
        {
          OR: [
            { createdById: session.user.id },
            { isPublic: true },
          ],
        },
      ],
    }

    if (functionalArea) {
      where.functionalArea = {
        in: [functionalArea, 'CROSS_FUNCTIONAL'],
      }
    }

    const visualizations = await prisma.visualization.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ visualizations })
  } catch (error: any) {
    console.error('Error fetching visualizations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch visualizations', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create visualization
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
      type,
      functionalArea,
      queryId,
      config,
      defaultWidth,
      defaultHeight,
      tags,
      xAxis,
      yAxis,
      groupBy,
    } = body

    // Text charts don't require queryId
    if (!name || !type || !functionalArea) {
      return NextResponse.json(
        { error: 'Name, type, and functionalArea are required' },
        { status: 400 }
      )
    }

    // Only require queryId for non-text visualizations
    if (type !== 'text' && !queryId) {
      return NextResponse.json(
        { error: 'QueryId is required for this visualization type' },
        { status: 400 }
      )
    }

    // For text charts, create or get a system query if queryId is not provided
    let finalQueryId = queryId
    if (type === 'text' && !queryId) {
      // Find or create a system query for text charts
      const systemQuery = await prisma.query.findFirst({
        where: {
          name: '__SYSTEM_TEXT_CHART_QUERY__',
          createdById: session.user.id,
        },
      })

      if (systemQuery) {
        finalQueryId = systemQuery.id
      } else {
        // Create a minimal system query for text charts
        // We need a data source - find or create a minimal one
        const systemDataSource = await prisma.dataSource.findFirst({
          where: {
            name: '__SYSTEM_TEXT_CHART_SOURCE__',
            tenant: session.user.tenantId ? {
              id: session.user.tenantId
            } : null,
          },
        })

        let dataSourceId
        if (systemDataSource) {
          dataSourceId = systemDataSource.id
        } else {
          // Create a minimal system data source
          const newDataSource = await prisma.dataSource.create({
            data: {
              name: '__SYSTEM_TEXT_CHART_SOURCE__',
              type: 'FILE',
              tenant: session.user.tenantId ? {
                connect: { id: session.user.tenantId }
              } : undefined,
              connection: {}, // Empty connection for system data source
            },
          })
          dataSourceId = newDataSource.id
        }

        // Create system query
        const newSystemQuery = await prisma.query.create({
          data: {
            name: '__SYSTEM_TEXT_CHART_QUERY__',
            dataSource: {
              connect: { id: dataSourceId }
            },
            sql: 'SELECT 1 as id',
            createdBy: {
              connect: { id: session.user.id }
            },
          },
        })
        finalQueryId = newSystemQuery.id
      }
    }

    // Verify query exists and user has access (only for non-text visualizations)
    let query = null
    if (finalQueryId) {
      query = await prisma.query.findUnique({
        where: { id: finalQueryId },
      })

      if (!query) {
        return NextResponse.json({ error: 'Query not found' }, { status: 404 })
      }

      // Allow access if user created the query OR it's a system query OR has access to the data source
      const isSystemQuery = query.name === '__SYSTEM_TEXT_CHART_QUERY__'
      const hasQueryAccess = query.createdById === session.user.id || isSystemQuery
      
      if (!hasQueryAccess) {
        // Check if user has access via data source
        const dataSource = await prisma.dataSource.findUnique({
          where: { id: query.dataSourceId },
          include: {
            accessibleBy: {
              where: {
                OR: [
                  { userId: session.user.id },
                  { userRole: session.user.role },
                ],
              },
            },
          },
        })
        
        if (!dataSource || dataSource.accessibleBy.length === 0) {
          // Check tenant access
          if (dataSource?.tenantId !== session.user.tenantId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
          }
        }
      }
    }

    // Merge axis configuration into config
    const fullConfig = {
      ...(config || {}),
      xAxis: xAxis || config?.xAxis,
      yAxis: yAxis || config?.yAxis,
      groupBy: groupBy || config?.groupBy,
    }

    // Build include object conditionally
    const includeQuery = finalQueryId ? {
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
    } : {}

    // For text charts without queryId, try to create without it first
    // If the database still has a NOT NULL constraint, we'll get an error
    const visualizationData: any = {
      name,
      description: description || null,
      type,
      functionalArea,
      config: fullConfig,
      defaultWidth: defaultWidth || 6,
      defaultHeight: defaultHeight || 4,
      tags: tags || [],
      createdById: session.user.id,
      tenantId: session.user.tenantId,
    }

    // Use finalQueryId (which may be a system query for text charts)
    visualizationData.queryId = finalQueryId

    const visualization = await prisma.visualization.create({
      data: visualizationData,
      include: includeQuery,
    })

    return NextResponse.json({ visualization }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating visualization:', error)
    return NextResponse.json(
      { error: 'Failed to create visualization', details: error.message },
      { status: 500 }
    )
  }
}

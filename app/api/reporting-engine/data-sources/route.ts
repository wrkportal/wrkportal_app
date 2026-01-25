import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: List available data sources
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const functionalArea = request.nextUrl.searchParams.get('functionalArea')
    const tenantId = session.user.tenantId

    // Build where clause
    const where: any = {
      OR: [
        { tenantId: tenantId },
        { tenantId: null }, // Global data sources
      ],
    }

    if (functionalArea) {
      // Add functional area filter using AND with existing OR
      where.AND = [
        {
          OR: [
            { functionalArea: functionalArea },
            { functionalArea: 'CROSS_FUNCTIONAL' },
            { functionalArea: null },
          ],
        },
      ]
    }

    // Get data sources user has access to
    const dataSources = await prisma.dataSource.findMany({
      where,
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
      orderBy: {
        name: 'asc',
      },
    })

    // Filter to only include data sources user can access
    const accessibleDataSources = dataSources.filter((ds: any) => {
      // If no access rules, allow access (tenant-level)
      if (ds.accessibleBy.length === 0 && ds.tenantId === tenantId) {
        return true
      }
      // If has access rules, check if user has access
      return ds.accessibleBy.length > 0
    })

    return NextResponse.json({ dataSources: accessibleDataSources })
  } catch (error: any) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data sources', details: error.message },
      { status: 500 }
    )
  }
}

// POST: Create new data source
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, type, connection, schema, functionalArea } = body

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    // Create data source
    const dataSource = await prisma.dataSource.create({
      data: {
        name,
        description,
        type,
        connection: connection || {},
        schema: schema || null,
        functionalArea: functionalArea || null,
        tenantId: session.user.tenantId,
      },
    })

    // Grant creator access
    await prisma.dataSourceAccess.create({
      data: {
        dataSourceId: dataSource.id,
        userId: session.user.id,
        permission: 'WRITE',
      },
    })

    return NextResponse.json({ dataSource }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating data source:', error)
    return NextResponse.json(
      { error: 'Failed to create data source', details: error.message },
      { status: 500 }
    )
  }
}

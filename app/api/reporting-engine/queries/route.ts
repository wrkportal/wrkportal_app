import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST: Create a new query
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, dataSourceId, queryBuilder } = body

    if (!name || !dataSourceId) {
      return NextResponse.json(
        { error: 'Name and dataSourceId are required' },
        { status: 400 }
      )
    }

    // Verify data source exists and user has access
    const dataSource = await prisma.dataSource.findUnique({
      where: { id: dataSourceId },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Check access
    if (dataSource.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create query
    const query = await prisma.query.create({
      data: {
        name,
        description: description || `Query for ${dataSource.name}`,
        dataSourceId,
        queryBuilder: queryBuilder || {
          select: ['*'],
          from: dataSourceId,
        },
        createdById: session.user.id,
      },
    })

    return NextResponse.json({ query }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating query:', error)
    return NextResponse.json(
      { error: 'Failed to create query', details: error.message },
      { status: 500 }
    )
  }
}

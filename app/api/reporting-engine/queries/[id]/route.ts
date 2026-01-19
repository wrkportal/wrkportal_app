import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET: Get query details
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

    const query = await prisma.query.findUnique({
      where: { id },
      include: {
        dataSource: {
          select: {
            id: true,
            name: true,
            type: true,
            schema: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 })
    }

    // Check access
    if (query.createdById !== session.user.id) {
      // Check data source access
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

      if (!dataSource || (dataSource.tenantId !== session.user.tenantId && dataSource.accessibleBy.length === 0)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json({ query })
  } catch (error: any) {
    console.error('Error fetching query:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query', details: error.message },
      { status: 500 }
    )
  }
}

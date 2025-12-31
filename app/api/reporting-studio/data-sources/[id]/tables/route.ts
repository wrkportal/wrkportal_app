import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { listDatabaseTables } from '@/lib/reporting-studio/database-connections'

/**
 * GET /api/reporting-studio/data-sources/[id]/tables
 * List tables and views from a database data source
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

    // Find the data source
    const dataSource = await prisma.reportingDataSource.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    // Only list tables for database connections
    if (dataSource.type !== 'DATABASE') {
      return NextResponse.json({
        error: 'Tables can only be listed for database connections',
      }, { status: 400 })
    }

    if (!dataSource.provider) {
      return NextResponse.json({
        error: 'Data source provider is required',
      }, { status: 400 })
    }

    // Decrypt connection config
    const connectionConfig = decryptJSON(dataSource.connectionConfig as any)

    // List tables
    const tables = await listDatabaseTables(dataSource.provider, connectionConfig as any)

    return NextResponse.json({ tables })
  } catch (error: any) {
    console.error('Error listing database tables:', error)
    return NextResponse.json(
      {
        error: 'Failed to list database tables',
        details: error.message,
      },
      { status: 500 }
    )
  }
}


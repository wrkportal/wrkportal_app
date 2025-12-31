import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { executeDatabaseQuery } from '@/lib/reporting-studio/database-connections'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'

/**
 * POST /api/reporting-studio/data-sources/[id]/query
 * Execute a query on a database data source
 */
export async function POST(
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

    // Only execute queries on database connections
    if (dataSource.type !== 'DATABASE') {
      return NextResponse.json({
        error: 'Queries can only be executed on database connections',
      }, { status: 400 })
    }

    if (!dataSource.provider) {
      return NextResponse.json({
        error: 'Data source provider is required',
      }, { status: 400 })
    }

    const body = await request.json()
    const { query, limit } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        error: 'Query is required and must be a string',
      }, { status: 400 })
    }

    // Validate query (basic safety checks)
    const queryUpper = query.toUpperCase().trim()
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE']
    
    for (const keyword of dangerousKeywords) {
      if (queryUpper.startsWith(keyword)) {
        return NextResponse.json({
          error: `Queries starting with ${keyword} are not allowed for safety reasons`,
        }, { status: 400 })
      }
    }

    // Decrypt connection config
    const connectionConfig = decryptJSON(dataSource.connectionConfig as any)

    // Apply limit (safety measure)
    const queryLimit = Math.min(
      limit || REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS,
      REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS
    )

    // Execute query
    const startTime = Date.now()
    const result = await executeDatabaseQuery(
      dataSource.provider,
      connectionConfig as any,
      query,
      queryLimit
    )
    const executionTime = Date.now() - startTime

    // Log query execution
    try {
      await prisma.reportingQueryLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          dataSourceId: dataSource.id,
          query: query.substring(0, 1000), // Limit query length in log
          rowCount: result.rowCount,
          executionTime,
          status: 'SUCCESS',
        },
      })
    } catch (logError) {
      // Logging errors should not fail the query
      console.error('Error logging query:', logError)
    }

    return NextResponse.json({
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime,
    })
  } catch (error: any) {
    console.error('Error executing query:', error)

    // Log failed query
    try {
      const session = await getServerSession(authOptions)
      const user = await prisma.user.findUnique({
        where: { email: session?.user?.email || '' },
      })

      if (user) {
        const dataSource = await prisma.reportingDataSource.findFirst({
          where: { id: params.id, tenantId: user.tenantId },
        })

        if (dataSource) {
          const body = await request.json().catch(() => ({}))
          await prisma.reportingQueryLog.create({
            data: {
              tenantId: user.tenantId,
              userId: user.id,
              dataSourceId: dataSource.id,
              query: body.query?.substring(0, 1000) || '',
              rowCount: 0,
              executionTime: 0,
              status: 'ERROR',
              errorMessage: error.message?.substring(0, 500),
            },
          })
        }
      }
    } catch (logError) {
      // Ignore logging errors
    }

    return NextResponse.json(
      {
        error: 'Failed to execute query',
        details: error.message,
      },
      { status: 500 }
    )
  }
}


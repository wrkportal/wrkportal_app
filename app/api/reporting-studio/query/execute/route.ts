import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { executeDatabaseQuery } from '@/lib/reporting-studio/database-connections'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { optimizeQuery, analyzeQueryPerformance } from '@/lib/reporting-studio/query-optimizer'
import { REPORTING_STUDIO_CONFIG } from '@/lib/reporting-studio/constants'
import { secureQueryForTenant, validateTenantFilter } from '@/lib/reporting-studio/tenant-filter-injector'

interface ExecuteQueryRequest {
  dataSourceId: string
  query: string
  optimize?: boolean
}

/**
 * POST /api/reporting-studio/query/execute
 * Execute a SQL query against a data source
 */
export async function POST(request: NextRequest) {
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

    const body: ExecuteQueryRequest = await request.json()

    if (!body.dataSourceId || !body.query) {
      return NextResponse.json(
        { error: 'dataSourceId and query are required' },
        { status: 400 }
      )
    }

    // Find the data source
    const dataSource = await prisma.reportingDataSource.findFirst({
      where: {
        id: body.dataSourceId,
        tenantId: user.tenantId,
        type: 'DATABASE',
      },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    if (!dataSource.provider) {
      return NextResponse.json(
        { error: 'Data source provider is required' },
        { status: 400 }
      )
    }

    // Validate query (basic safety checks)
    const queryUpper = body.query.toUpperCase().trim()
    const dangerousKeywords = ['DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE']
    
    for (const keyword of dangerousKeywords) {
      if (queryUpper.startsWith(keyword)) {
        return NextResponse.json(
          { error: `Queries starting with ${keyword} are not allowed for safety reasons` },
          { status: 400 }
        )
      }
    }

    // CRITICAL: Secure query with tenant filter before execution
    if (!user.tenantId) {
      return NextResponse.json(
        { error: 'User tenant ID is required for query execution' },
        { status: 400 }
      )
    }

    // Validate and inject tenant filter if missing
    const validation = validateTenantFilter(body.query, user.tenantId)
    if (!validation.valid) {
      console.warn('Query missing tenant filter, securing automatically:', validation.message)
    }
    
    // Secure the query (injects tenant filter if missing)
    let securedQuery = secureQueryForTenant(body.query, user.tenantId)

    // Optimize query if requested (after securing)
    let finalQuery = securedQuery
    let optimizationPlan = null
    if (body.optimize) {
      optimizationPlan = optimizeQuery(securedQuery, {
        // Optional context for optimization
      })
      finalQuery = optimizationPlan.optimizedQuery
      
      // Re-validate tenant filter after optimization
      const postOptimizationValidation = validateTenantFilter(finalQuery, user.tenantId)
      if (!postOptimizationValidation.valid) {
        // Re-secure if optimization removed tenant filter
        finalQuery = secureQueryForTenant(finalQuery, user.tenantId)
      }
    }

    // Decrypt connection config
    const connectionConfig = decryptJSON(dataSource.connectionConfig as any)

    // Execute query
    const startTime = Date.now()
    const result = await executeDatabaseQuery(
      dataSource.provider,
      connectionConfig as any,
      finalQuery,
      REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS
    )
    const executionTime = Date.now() - startTime

    // Analyze performance
    const performance = analyzeQueryPerformance(
      {
        executionTime,
        rowsScanned: result.rowCount,
        rowsReturned: result.rowCount,
        cacheHit: false,
      },
      optimizationPlan || { estimatedRows: result.rowCount, estimatedCost: 1, optimizedQuery: finalQuery }
    )

    // Log query execution
    try {
      await prisma.reportingQueryLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          dataSourceId: dataSource.id,
          query: finalQuery.substring(0, 1000), // Limit query length
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
      performance,
      optimizationPlan: optimizationPlan ? {
        estimatedRows: optimizationPlan.estimatedRows,
        estimatedCost: optimizationPlan.estimatedCost,
        warnings: optimizationPlan.warnings,
      } : undefined,
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
        const body = await request.json().catch(() => ({}))
        const dataSource = await prisma.reportingDataSource.findFirst({
          where: { id: body.dataSourceId, tenantId: user.tenantId },
        })

        if (dataSource) {
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

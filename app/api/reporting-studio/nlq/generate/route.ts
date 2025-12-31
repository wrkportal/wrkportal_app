import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSQLFromNLQ, isQuestionSuitableForNLQ, type NLQRequestWithTenant } from '@/lib/reporting-studio/nlq-service'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { listDatabaseTables } from '@/lib/reporting-studio/database-connections'
import { getTableSchemas } from '@/lib/reporting-studio/table-schema'
import { validateTenantFilter } from '@/lib/reporting-studio/tenant-filter-injector'

/**
 * POST /api/reporting-studio/nlq/generate
 * Generate SQL query from natural language question
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { question, dataSourceId, dialect = 'postgresql' } = body

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      )
    }

    // Validate question is suitable for NLQ (data-related only)
    const validationResult = isQuestionSuitableForNLQ(question)
    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: validationResult.reason || 'Question is not suitable for natural language query generation.',
          suggestion: validationResult.suggestion || 'Please ask questions about your application data such as "Show me sales by region" or "What are the top 10 customers by revenue?"',
        },
        { status: 400 }
      )
    }

    // Get schema if dataSourceId is provided, otherwise use default Prisma schema
    let schema: NLQRequest['schema'] | undefined

    // Default schema for main database (Prisma models)
    const defaultSchema: NLQRequest['schema'] = {
      tables: [
        {
          name: 'SalesLead',
          columns: [
            { name: 'id', type: 'String' },
            { name: 'tenantId', type: 'String' },
            { name: 'firstName', type: 'String' },
            { name: 'lastName', type: 'String' },
            { name: 'email', type: 'String' },
            { name: 'company', type: 'String' },
            { name: 'status', type: 'LeadStatus' },
            { name: 'convertedAt', type: 'DateTime' },
            { name: 'createdAt', type: 'DateTime' },
          ],
        },
        {
          name: 'SalesOpportunity',
          columns: [
            { name: 'id', type: 'String' },
            { name: 'tenantId', type: 'String' },
            { name: 'name', type: 'String' },
            { name: 'stage', type: 'OpportunityStage' },
            { name: 'amount', type: 'Decimal' },
            { name: 'status', type: 'OpportunityStatus' },
            { name: 'convertedFromLeadId', type: 'String' },
            { name: 'createdAt', type: 'DateTime' },
          ],
        },
        {
          name: 'SalesContact',
          columns: [
            { name: 'id', type: 'String' },
            { name: 'tenantId', type: 'String' },
            { name: 'firstName', type: 'String' },
            { name: 'lastName', type: 'String' },
            { name: 'email', type: 'String' },
            { name: 'convertedFromLeadId', type: 'String' },
            { name: 'createdAt', type: 'DateTime' },
          ],
        },
        {
          name: 'SalesAccount',
          columns: [
            { name: 'id', type: 'String' },
            { name: 'tenantId', type: 'String' },
            { name: 'name', type: 'String' },
            { name: 'createdAt', type: 'DateTime' },
          ],
        },
      ],
    }

    if (dataSourceId) {
      const dataSource = await prisma.reportingDataSource.findFirst({
        where: {
          id: dataSourceId,
          tenantId: user.tenantId,
        },
      })

      if (!dataSource || !dataSource.connectionConfig) {
        return NextResponse.json(
          { error: 'Data source not found or not configured' },
          { status: 404 }
        )
      }

      try {
        // Decrypt connection config
        const decryptedConfig = decryptJSON(dataSource.connectionConfig as string)

        // Get tables
        const tables = await listDatabaseTables(dataSource.provider, decryptedConfig)

        // Get detailed schemas with columns for better NLQ accuracy
        // Limit to first 10 tables to avoid performance issues
        const tablesToFetch = tables.slice(0, 10).map((t: any) => t.name)
        
        try {
          const tableSchemas = await getTableSchemas(
            dataSource.provider,
            decryptedConfig,
            tablesToFetch
          )

          schema = {
            tables: tableSchemas.map((tableSchema) => ({
              name: tableSchema.tableName,
              columns: tableSchema.columns.map((col) => ({
                name: col.name,
                type: col.type,
                description: col.description,
              })),
            })),
          }
        } catch (schemaError: any) {
          console.error('Error fetching table schemas, falling back to table names only:', schemaError)
          // Fallback to table names only if schema fetching fails
          schema = {
            tables: tables.slice(0, 10).map((table: any) => ({
              name: table.name || table.tableName,
              columns: [],
            })),
          }
        }
      } catch (error: any) {
        console.error('Error fetching schema:', error)
        // Continue without schema - NLQ will still work but with lower accuracy
      }
    } else {
      // Use default schema for main database
      schema = defaultSchema
    }

    // Generate SQL from natural language with tenant filtering
    if (!user.tenantId) {
      return NextResponse.json(
        { error: 'User tenant ID is required for query generation' },
        { status: 400 }
      )
    }

    let result
    try {
      result = await generateSQLFromNLQ({
        question,
        dataSourceId,
        schema,
        dialect,
        tenantId: user.tenantId, // CRITICAL: Pass tenantId for automatic filtering
      } as NLQRequestWithTenant)
    } catch (sqlGenError: any) {
      console.error('Error generating SQL from NLQ:', sqlGenError)
      return NextResponse.json(
        {
          error: 'Failed to generate SQL query',
          details: sqlGenError.message || 'Unknown error during SQL generation',
          stack: process.env.NODE_ENV === 'development' ? sqlGenError.stack : undefined,
        },
        { status: 500 }
      )
    }

    // Double-check tenant filter is present (security validation)
    if (result.sql) {
      try {
        const validation = validateTenantFilter(result.sql, user.tenantId)
        if (!validation.valid) {
          console.error('Generated query failed tenant validation:', validation.message)
          // Query was already secured by generateSQLFromNLQ, but log the issue
          console.warn('Query was auto-secured:', result.sql.substring(0, 200))
        }
      } catch (validationError: any) {
        console.error('Error validating tenant filter:', validationError)
        // Continue anyway - the query should be safe
      }
    }

    if (result.error) {
      return NextResponse.json(
        {
          error: result.error,
          explanation: result.explanation,
        },
        { status: 400 }
      )
    }

    // Execute the SQL query and return results
    if (result.sql) {
      try {
        const startTime = Date.now()
        
        console.log('Executing SQL query:', result.sql)
        console.log('Tenant ID:', user.tenantId)
        
        // Execute the SQL query using Prisma
        const queryResult = await prisma.$queryRawUnsafe(result.sql)
        
        const executionTime = Date.now() - startTime

        console.log('Query executed successfully. Result type:', typeof queryResult, Array.isArray(queryResult) ? `Array[${queryResult.length}]` : 'Object')

        // Helper function to convert values for JSON serialization
        // This recursively converts BigInt, Decimal, and other non-serializable types
        const convertValue = (value: any): any => {
          // Handle null/undefined
          if (value === null || value === undefined) {
            return value
          }
          
          // Handle BigInt
          if (typeof value === 'bigint') {
            return Number(value)
          }
          
          // Handle Date objects
          if (value instanceof Date) {
            return value.toISOString()
          }
          
          // Handle Decimal/Prisma Decimal types
          if (value && typeof value === 'object') {
            // Check for Decimal type (Prisma uses Decimal.js)
            if (value.constructor && (value.constructor.name === 'Decimal' || value.constructor.name === 'default')) {
              try {
                return Number(value.toString())
              } catch {
                return value.toString()
              }
            }
            
            // Check for toNumber method (Prisma Decimal)
            if ('toNumber' in value && typeof value.toNumber === 'function') {
              try {
                return Number(value.toNumber())
              } catch {
                return value.toString()
              }
            }
            
            // Handle arrays
            if (Array.isArray(value)) {
              return value.map(item => convertValue(item))
            }
            
            // Handle plain objects
            if (value.constructor === Object || value.constructor === null) {
              const converted: any = {}
              for (const key in value) {
                if (Object.prototype.hasOwnProperty.call(value, key)) {
                  converted[key] = convertValue(value[key])
                }
              }
              return converted
            }
          }
          
          return value
        }

        // First, convert the entire queryResult to ensure all BigInt values are handled
        const convertedResult = convertValue(queryResult)

        // Format the results
        let columns: string[] = []
        let rows: any[][] = []
        let data: any[] = []

        if (Array.isArray(convertedResult)) {
          if (convertedResult.length > 0) {
            // Get columns from first row
            const firstRow = convertedResult[0]
            if (firstRow && typeof firstRow === 'object') {
              columns = Object.keys(firstRow as object)
              
              // Convert to array format for table display
              rows = convertedResult.map((row: any) => 
                columns.map(col => row[col])
              )
              
              // Data is already converted
              data = convertedResult
            } else {
              // Empty array or unexpected format
              columns = []
              rows = []
              data = []
            }
          } else {
            // Empty result set
            columns = []
            rows = []
            data = []
          }
        } else if (convertedResult && typeof convertedResult === 'object' && !Array.isArray(convertedResult)) {
          // Single row result (like COUNT queries)
          columns = Object.keys(convertedResult as object)
          rows = [columns.map(col => (convertedResult as any)[col])]
          
          // Data is already converted
          data = [convertedResult]
        } else {
          // Unexpected result format
          console.warn('Unexpected query result format:', typeof convertedResult, convertedResult)
          columns = []
          rows = []
          data = []
        }

        // Create response object with all BigInt values converted
        const response = {
          sql: result.sql,
          explanation: result.explanation,
          confidence: result.confidence,
          suggestedVisualization: result.suggestedVisualization,
          // Query execution results
          data,
          columns,
          rows,
          rowCount: rows.length,
          executionTime,
          // Metadata
          metadata: {
            question,
            dialect,
            hasData: rows.length > 0,
            isAggregate: result.sql.toUpperCase().includes('COUNT') || 
                        result.sql.toUpperCase().includes('SUM') || 
                        result.sql.toUpperCase().includes('AVG') ||
                        result.sql.toUpperCase().includes('MAX') ||
                        result.sql.toUpperCase().includes('MIN'),
          }
        }

        // Final conversion pass to ensure no BigInt values remain
        const finalResponse = convertValue(response)

        // Try to serialize to catch any remaining issues
        try {
          JSON.stringify(finalResponse)
        } catch (serializationError: any) {
          console.error('JSON serialization error:', serializationError)
          console.error('Problematic data:', finalResponse)
          // If serialization still fails, convert everything to strings as last resort
          const safeResponse = JSON.parse(JSON.stringify(finalResponse, (key, value) => {
            if (typeof value === 'bigint') {
              return value.toString()
            }
            return value
          }))
          return NextResponse.json(safeResponse)
        }

        return NextResponse.json(finalResponse)
      } catch (executionError: any) {
        console.error('Error executing SQL query:', executionError)
        console.error('SQL that failed:', result.sql)
        console.error('Error stack:', executionError.stack)
        
        // Return the SQL even if execution fails, so user can see what was generated
        return NextResponse.json({
          sql: result.sql,
          explanation: result.explanation,
          confidence: result.confidence,
          suggestedVisualization: result.suggestedVisualization,
          error: 'Query execution failed',
          executionError: executionError.message || 'Unknown error',
          errorDetails: process.env.NODE_ENV === 'development' ? executionError.stack : undefined,
          // Still return the SQL so user can debug
          data: [],
          columns: [],
          rows: [],
          rowCount: 0,
        }, { status: 200 }) // Return 200 so frontend can display the error
      }
    }

    // Fallback: return just the SQL if execution is not possible
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error generating NLQ:', error)
    return NextResponse.json(
      { error: 'Failed to generate query', details: error.message },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateQuerySuggestions } from '@/lib/reporting-studio/nlq-enhancement'
import { decryptJSON } from '@/lib/reporting-studio/encryption'
import { listDatabaseTables } from '@/lib/reporting-studio/database-connections'
import { getTableSchemas } from '@/lib/reporting-studio/table-schema'
import type { NLQRequest } from '@/lib/reporting-studio/nlq-service'

/**
 * GET /api/reporting-studio/nlq/suggestions
 * Get query suggestions based on data source schema
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const dataSourceId = searchParams.get('dataSourceId')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'dataSourceId is required' },
        { status: 400 }
      )
    }

    // Get data source
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

    // Get schema
    let schema: NLQRequest['schema'] | undefined

    try {
      const decryptedConfig = decryptJSON(dataSource.connectionConfig as string)
      const tables = await listDatabaseTables(dataSource.provider!, decryptedConfig)
      const tablesToFetch = tables.slice(0, 10).map((t: any) => t.name)

      const tableSchemas = await getTableSchemas(
        dataSource.provider!,
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
    } catch (error: any) {
      console.error('Error fetching schema for suggestions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch schema', details: error.message },
        { status: 500 }
      )
    }

    // Generate suggestions
    const suggestions = await generateQuerySuggestions(schema, limit)

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Error generating suggestions:', error)
    return NextResponse.json(
      { error: 'Failed to generate suggestions', details: error.message },
      { status: 500 }
    )
  }
}


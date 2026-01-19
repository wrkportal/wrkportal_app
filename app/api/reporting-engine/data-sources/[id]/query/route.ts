import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'
import { readFile } from 'fs/promises'
import { join } from 'path'

// POST: Execute query on file-based data source
export async function POST(
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
    const { select, where, groupBy, orderBy, limit = 1000, offset = 0 } = body

    // Get data source
    const dataSource = await prisma.dataSource.findUnique({
      where: { id },
    })

    if (!dataSource) {
      return NextResponse.json({ error: 'Data source not found' }, { status: 404 })
    }

    if (dataSource.type !== 'FILE') {
      return NextResponse.json(
        { error: 'This endpoint is only for file-based data sources' },
        { status: 400 }
      )
    }

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

    if (!access && dataSource.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Read file
    const connection = dataSource.connection as any
    const filePath = connection.filePath
    const fileExtension = connection.fileExtension

    let data: any[] = []
    let columns: string[] = []

    try {
      if (fileExtension === 'csv') {
        const fileContent = await readFile(filePath, 'utf-8')
        const lines = fileContent.split('\n').filter(line => line.trim())
        if (lines.length > 0) {
          columns = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
            const row: any = {}
            columns.forEach((col, idx) => {
              row[col] = values[idx] || null
            })
            data.push(row)
          }
        }
      } else {
        // Excel
        const buffer = await readFile(filePath)
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        data = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: null }) as any[]
        if (data.length > 0) {
          columns = Object.keys(data[0])
        }
      }
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to read file', details: error.message },
        { status: 500 }
      )
    }

    // Apply filters
    if (where) {
      // Simple where clause evaluation (for production, use a proper query engine)
      data = data.filter((row) => {
        // This is a simplified filter - in production, parse the where clause properly
        try {
          // For now, just return all rows if where clause is provided
          // In production, implement proper filtering
          return true
        } catch {
          return false
        }
      })
    }

    // Apply groupBy
    // NOTE: For visualization queries, we should NOT apply groupBy here
    // because the chart renderer needs all raw rows to perform accurate counting/aggregation
    // The visualization renderer will handle grouping and aggregation based on X-axis and Y-axis config
    // Only skip groupBy if it's a visualization query (indicated by allowGroupBy: false)
    if (groupBy && groupBy.length > 0 && body.allowGroupBy !== false) {
      const grouped = new Map<string, any[]>()
      data.forEach((row) => {
        const key = groupBy.map((col: string) => row[col]).join('|')
        if (!grouped.has(key)) {
          grouped.set(key, [])
        }
        grouped.get(key)!.push(row)
      })
      // Convert to aggregated data (simplified)
      data = Array.from(grouped.entries()).map(([key, rows]) => {
        const result: any = {}
        groupBy.forEach((col: string) => {
          result[col] = rows[0][col]
        })
        return result
      })
    } else if (groupBy && groupBy.length > 0) {
      console.log('Skipping groupBy in query to preserve all rows for accurate aggregation')
    }

    // Apply select
    if (select && Array.isArray(select) && select.length > 0 && select[0] !== '*') {
      data = data.map((row) => {
        const result: any = {}
        select.forEach((col: string) => {
          result[col] = row[col]
        })
        return result
      })
      columns = select
    }

    // Apply orderBy
    if (orderBy) {
      const [field, direction] = orderBy.split(' ')
      data.sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        if (direction === 'DESC') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0
        }
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
      })
    }

    // Apply pagination
    const totalRows = data.length
    const paginatedData = data.slice(offset, offset + limit)

    // Convert to rows format
    const rows = paginatedData.map((row) => {
      return columns.map((col) => row[col] ?? null)
    })

    return NextResponse.json({
      columns,
      rows,
      rowCount: totalRows,
      executionTime: 0,
      cached: false,
    })
  } catch (error: any) {
    console.error('Error querying file data source:', error)
    return NextResponse.json(
      { error: 'Failed to query data source', details: error.message },
      { status: 500 }
    )
  }
}

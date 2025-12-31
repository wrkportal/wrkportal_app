// Data Source Abstraction Layer - Unified interface for different data sources

import { DataSourceType, DataSourceProvider, DatasetType } from '@/types/reporting-studio'
import { ColumnDefinition } from '@/types/reporting-studio'
import { executeDatabaseQuery, listDatabaseTables } from './database-connections'
import { parseFile, ParsedFileData } from './file-parser'
import { decryptJSON } from './encryption'
import { readFile } from 'fs/promises'
import { get } from '@vercel/blob'

export interface AbstractedDataSource {
  id: string
  name: string
  type: DataSourceType
  provider?: DataSourceProvider
}

export interface DataFetchOptions {
  limit?: number
  offset?: number
  columns?: string[]
  filters?: FilterCondition[]
  orderBy?: OrderByClause[]
}

export interface FilterCondition {
  column: string
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'notIn'
  value: any
}

export interface OrderByClause {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface FetchResult {
  columns: string[]
  rows: any[]
  rowCount: number
  totalCount?: number
}

const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Abstract data fetching - unified interface for files, databases, APIs
 */
export async function fetchData(
  source: AbstractedDataSource,
  sourceConfig: any,
  options: DataFetchOptions = {}
): Promise<FetchResult> {
  switch (source.type) {
    case 'FILE':
      return await fetchFromFile(sourceConfig, options)
    case 'DATABASE':
      return await fetchFromDatabase(source, sourceConfig, options)
    case 'API':
      return await fetchFromAPI(sourceConfig, options)
    default:
      throw new Error(`Unsupported data source type: ${source.type}`)
  }
}

/**
 * Fetch data from uploaded file
 */
async function fetchFromFile(
  fileConfig: { filePath: string; fileName: string; type?: string },
  options: DataFetchOptions
): Promise<FetchResult> {
  try {
    // Read file
    let buffer: Buffer
    if (isDevelopment) {
      buffer = await readFile(fileConfig.filePath)
    } else {
      // Production: Read from Vercel Blob
      const blob = await get(fileConfig.filePath)
      const arrayBuffer = await blob.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    }

    // Parse file
    const parsedData = await parseFile(buffer, fileConfig.fileName, {
      limit: options.limit,
      detectSchema: false, // Faster without schema detection
    })

    // Apply filters if provided
    let rows = parsedData.rows
    if (options.filters && options.filters.length > 0) {
      rows = applyFilters(rows, options.filters)
    }

    // Apply column selection
    if (options.columns && options.columns.length > 0) {
      rows = rows.map((row) => {
        const filtered: any = {}
        options.columns!.forEach((col) => {
          if (row[col] !== undefined) {
            filtered[col] = row[col]
          }
        })
        return filtered
      })
      // Update columns
      parsedData.columns = parsedData.columns.filter((col) =>
        options.columns!.includes(col.columnName)
      )
    }

    // Apply ordering
    if (options.orderBy && options.orderBy.length > 0) {
      rows = applyOrderBy(rows, options.orderBy)
    }

    // Apply offset
    if (options.offset) {
      rows = rows.slice(options.offset)
    }

    // Apply limit
    if (options.limit) {
      rows = rows.slice(0, options.limit)
    }

    return {
      columns: parsedData.columns.map((col) => col.columnName),
      rows,
      rowCount: rows.length,
      totalCount: parsedData.rowCount,
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch data from file: ${error.message}`)
  }
}

/**
 * Fetch data from database
 */
async function fetchFromDatabase(
  source: AbstractedDataSource,
  connectionConfig: any,
  options: DataFetchOptions
): Promise<FetchResult> {
  try {
    if (!source.provider) {
      throw new Error('Database provider is required')
    }

    // Build query
    const query = buildSQLQuery(
      options.columns || ['*'],
      options.filters || [],
      options.orderBy || [],
      options.limit,
      options.offset
    )

    // Execute query
    const result = await executeDatabaseQuery(
      source.provider,
      connectionConfig,
      query,
      options.limit
    )

    return {
      columns: result.columns,
      rows: result.rows,
      rowCount: result.rowCount,
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch data from database: ${error.message}`)
  }
}

/**
 * Fetch data from API
 */
async function fetchFromAPI(
  apiConfig: { url: string; headers?: Record<string, string>; method?: string },
  options: DataFetchOptions
): Promise<FetchResult> {
  try {
    const response = await fetch(apiConfig.url, {
      method: apiConfig.method || 'GET',
      headers: apiConfig.headers || {},
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Convert to rows format
    let rows = Array.isArray(data) ? data : [data]

    // Apply filters
    if (options.filters && options.filters.length > 0) {
      rows = applyFilters(rows, options.filters)
    }

    // Apply column selection
    if (options.columns && options.columns.length > 0) {
      rows = rows.map((row) => {
        const filtered: any = {}
        options.columns!.forEach((col) => {
          if (row[col] !== undefined) {
            filtered[col] = row[col]
          }
        })
        return filtered
      })
    }

    // Apply ordering
    if (options.orderBy && options.orderBy.length > 0) {
      rows = applyOrderBy(rows, options.orderBy)
    }

    // Apply offset
    if (options.offset) {
      rows = rows.slice(options.offset)
    }

    // Apply limit
    if (options.limit) {
      rows = rows.slice(0, options.limit)
    }

    // Extract columns from first row
    const columns = rows.length > 0 ? Object.keys(rows[0]) : []

    return {
      columns,
      rows,
      rowCount: rows.length,
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch data from API: ${error.message}`)
  }
}

/**
 * Build SQL query from options
 */
function buildSQLQuery(
  columns: string[],
  filters: FilterCondition[],
  orderBy: OrderByClause[],
  limit?: number,
  offset?: number
): string {
  let query = `SELECT ${columns.join(', ')} FROM dataset`

  // Apply WHERE clause
  if (filters.length > 0) {
    const conditions = filters.map((filter) => {
      switch (filter.operator) {
        case 'equals':
          return `${filter.column} = '${escapeSQL(filter.value)}'`
        case 'notEquals':
          return `${filter.column} != '${escapeSQL(filter.value)}'`
        case 'contains':
          return `${filter.column} LIKE '%${escapeSQL(filter.value)}%'`
        case 'startsWith':
          return `${filter.column} LIKE '${escapeSQL(filter.value)}%'`
        case 'endsWith':
          return `${filter.column} LIKE '%${escapeSQL(filter.value)}'`
        case 'greaterThan':
          return `${filter.column} > ${filter.value}`
        case 'lessThan':
          return `${filter.column} < ${filter.value}`
        case 'between':
          return `${filter.column} BETWEEN ${filter.value[0]} AND ${filter.value[1]}`
        case 'in':
          const values = Array.isArray(filter.value) ? filter.value.map((v: any) => `'${escapeSQL(v)}'`).join(', ') : `'${escapeSQL(filter.value)}'`
          return `${filter.column} IN (${values})`
        default:
          return ''
      }
    }).filter((c) => c)
    query += ` WHERE ${conditions.join(' AND ')}`
  }

  // Apply ORDER BY
  if (orderBy.length > 0) {
    const orderClauses = orderBy.map((o) => `${o.column} ${o.direction}`).join(', ')
    query += ` ORDER BY ${orderClauses}`
  }

  // Apply LIMIT and OFFSET
  if (limit) {
    query += ` LIMIT ${limit}`
  }
  if (offset) {
    query += ` OFFSET ${offset}`
  }

  return query
}

/**
 * Apply filters to in-memory data
 */
function applyFilters(rows: any[], filters: FilterCondition[]): any[] {
  return rows.filter((row) => {
    return filters.every((filter) => {
      const value = row[filter.column]
      switch (filter.operator) {
        case 'equals':
          return value === filter.value
        case 'notEquals':
          return value !== filter.value
        case 'contains':
          return String(value).toLowerCase().includes(String(filter.value).toLowerCase())
        case 'startsWith':
          return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase())
        case 'endsWith':
          return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase())
        case 'greaterThan':
          return Number(value) > Number(filter.value)
        case 'lessThan':
          return Number(value) < Number(filter.value)
        case 'between':
          return Number(value) >= Number(filter.value[0]) && Number(value) <= Number(filter.value[1])
        case 'in':
          return Array.isArray(filter.value) ? filter.value.includes(value) : value === filter.value
        case 'notIn':
          return Array.isArray(filter.value) ? !filter.value.includes(value) : value !== filter.value
        default:
          return true
      }
    })
  })
}

/**
 * Apply ordering to in-memory data
 */
function applyOrderBy(rows: any[], orderBy: OrderByClause[]): any[] {
  return [...rows].sort((a, b) => {
    for (const clause of orderBy) {
      const aVal = a[clause.column]
      const bVal = b[clause.column]

      let comparison = 0
      if (aVal < bVal) comparison = -1
      else if (aVal > bVal) comparison = 1

      if (comparison !== 0) {
        return clause.direction === 'ASC' ? comparison : -comparison
      }
    }
    return 0
  })
}

/**
 * Escape SQL string values
 */
function escapeSQL(value: any): string {
  return String(value).replace(/'/g, "''")
}

/**
 * Get schema from data source
 */
export async function getDataSourceSchema(
  source: AbstractedDataSource,
  sourceConfig: any
): Promise<ColumnDefinition[]> {
  switch (source.type) {
    case 'FILE':
      // For files, we already have schema from parsing
      return sourceConfig.schema || []
    case 'DATABASE':
      // For databases, we'd need to query information_schema
      // This is a simplified version
      return []
    default:
      return []
  }
}


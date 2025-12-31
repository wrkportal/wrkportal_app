/**
 * Advanced Query Engine
 * Handles query parsing, optimization, and execution on large datasets
 */

import { prisma } from '@/lib/prisma'
// DuckDB is optional - will fallback to PostgreSQL if not available
let DuckDB: any = null
try {
  DuckDB = require('duckdb')
} catch (error) {
  // DuckDB not available, will use PostgreSQL
}

export interface Query {
  select: string[] | '*'
  from: string | Query // Support subqueries
  where?: string
  groupBy?: string[]
  orderBy?: string
  having?: string
  limit?: number
  offset?: number
  joins?: Join[]
}

export interface Join {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  on: { left: string; right: string }
}

export interface QueryResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  executionTime: number
  cached: boolean
}

export interface QueryOptions {
  limit?: number
  offset?: number
  cache?: boolean
  cacheTTL?: number
  timeout?: number
}

export class QueryEngine {
  private db: DuckDB.Database | null = null
  private connection: DuckDB.Connection | null = null

  constructor() {
    // Initialize DuckDB connection (optional)
    if (DuckDB) {
      try {
        this.db = new DuckDB.Database(':memory:')
        this.connection = this.db.connect()
      } catch (error) {
        console.warn('DuckDB not available, falling back to PostgreSQL')
      }
    } else {
      console.warn('DuckDB module not installed, using PostgreSQL only')
    }
  }

  /**
   * Execute a query
   */
  async execute(
    query: Query,
    tenantId: string,
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    const startTime = Date.now()
    const {
      limit = 1000,
      offset = 0,
      cache = true,
      timeout = 30000
    } = options

    try {
      // Build SQL from query object
      const sql = this.buildSQL(query, tenantId, limit, offset)

      // Execute query
      const results = await this.executeSQL(sql, tenantId, timeout)

      const executionTime = Date.now() - startTime

      return {
        columns: results.columns,
        rows: results.rows,
        rowCount: results.rowCount,
        executionTime,
        cached: false
      }
    } catch (error: any) {
      throw new Error(`Query execution failed: ${error.message}`)
    }
  }

  /**
   * Build SQL from query object
   */
  private buildSQL(
    query: Query,
    tenantId: string,
    limit: number,
    offset: number
  ): string {
    let sql = 'SELECT '

    // SELECT clause
    if (query.select === '*') {
      sql += '*'
    } else {
      sql += query.select.join(', ')
    }

    // FROM clause
    sql += ` FROM ${query.from}`

    // Add tenant filter
    sql += ` WHERE tenant_id = '${tenantId}'`

    // WHERE clause
    if (query.where) {
      sql += ` AND (${query.where})`
    }

    // JOINs
    if (query.joins) {
      for (const join of query.joins) {
        sql += ` ${join.type} JOIN ${join.table} ON ${join.on.left} = ${join.on.right}`
      }
    }

    // GROUP BY
    if (query.groupBy && query.groupBy.length > 0) {
      sql += ` GROUP BY ${query.groupBy.join(', ')}`
    }

    // HAVING
    if (query.having) {
      sql += ` HAVING ${query.having}`
    }

    // ORDER BY
    if (query.orderBy) {
      sql += ` ORDER BY ${query.orderBy}`
    }

    // LIMIT and OFFSET
    sql += ` LIMIT ${limit} OFFSET ${offset}`

    return sql
  }

  /**
   * Execute SQL query
   */
  private async executeSQL(
    sql: string,
    tenantId: string,
    timeout: number
  ): Promise<{ columns: string[]; rows: any[][]; rowCount: number }> {
    // Try DuckDB first (faster for analytics)
    if (this.connection) {
      try {
        return await this.executeDuckDB(sql)
      } catch (error) {
        console.warn('DuckDB execution failed, falling back to PostgreSQL:', error)
      }
    }

    // Fallback to PostgreSQL
    return await this.executePostgreSQL(sql, tenantId)
  }

  /**
   * Execute query using DuckDB
   */
  private async executeDuckDB(sql: string): Promise<{
    columns: string[]
    rows: any[][]
    rowCount: number
  }> {
    return new Promise((resolve, reject) => {
      if (!this.connection) {
        reject(new Error('DuckDB connection not available'))
        return
      }

      this.connection.all(sql, (err: Error | null, rows: any[]) => {
        if (err) {
          reject(err)
          return
        }

        if (rows.length === 0) {
          resolve({
            columns: [],
            rows: [],
            rowCount: 0
          })
          return
        }

        const columns = Object.keys(rows[0])
        const rowData = rows.map(row => columns.map(col => row[col]))

        resolve({
          columns,
          rows: rowData,
          rowCount: rows.length
        })
      })
    })
  }

  /**
   * Execute query using PostgreSQL
   */
  private async executePostgreSQL(
    sql: string,
    tenantId: string
  ): Promise<{
    columns: string[]
    rows: any[][]
    rowCount: number
  }> {
    // Use Prisma's raw query
    const result = await prisma.$queryRawUnsafe(sql)

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return {
        columns: [],
        rows: [],
        rowCount: 0
      }
    }

    const rows = Array.isArray(result) ? result : [result]
    const columns = Object.keys(rows[0] as object)
    const rowData = rows.map(row => columns.map(col => (row as any)[col]))

    return {
      columns,
      rows: rowData,
      rowCount: rows.length
    }
  }

  /**
   * Optimize query
   */
  optimize(query: Query): Query {
    // TODO: Implement query optimization
    // - Index usage
    // - Join reordering
    // - Predicate pushdown
    // - Column pruning
    return query
  }

  /**
   * Validate query
   */
  validate(query: Query): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!query.select) {
      errors.push('SELECT clause is required')
    }

    if (!query.from) {
      errors.push('FROM clause is required')
    }

    if (query.limit && query.limit < 0) {
      errors.push('LIMIT must be non-negative')
    }

    if (query.offset && query.offset < 0) {
      errors.push('OFFSET must be non-negative')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Close connections
   */
  close() {
    if (this.connection) {
      this.connection.close()
    }
    if (this.db) {
      this.db.close()
    }
  }
}

// Singleton instance
let queryEngineInstance: QueryEngine | null = null

export function getQueryEngine(): QueryEngine {
  if (!queryEngineInstance) {
    queryEngineInstance = new QueryEngine()
  }
  return queryEngineInstance
}


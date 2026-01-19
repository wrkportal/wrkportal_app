/**
 * Advanced Query Engine
 * Handles query parsing, optimization, and execution on large datasets
 */

import { prisma } from '@/lib/prisma'
import { buildRLSFilter, type RLSEvaluationContext } from '@/lib/security/rls-engine'
// DuckDB is optional - will fallback to PostgreSQL if not available
// Use dynamic import to avoid static analysis issues with Turbopack
let DuckDB: any = null

async function initializeDuckDB() {
  if (typeof window !== 'undefined') return // Only in Node.js
  if (DuckDB !== null) return // Already initialized
  
  try {
    const duckdbModule = await import('duckdb').catch(() => null)
    DuckDB = duckdbModule?.default ?? duckdbModule ?? null
  } catch (error) {
    // DuckDB not available, will use PostgreSQL
    DuckDB = null
  }
}

// Initialize on first use (lazy initialization)
let duckdbInitPromise: Promise<void> | null = null
function ensureDuckDBInitialized() {
  if (!duckdbInitPromise) {
    duckdbInitPromise = initializeDuckDB()
  }
  return duckdbInitPromise
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
  userId?: string
  userRole?: string
  orgUnitId?: string
}

export class QueryEngine {
  private db: DuckDB.Database | null = null
  private connection: DuckDB.Connection | null = null
  private duckdbInitialized = false

  constructor() {
    // DuckDB will be initialized lazily on first use
  }

  private async ensureDuckDB() {
    if (this.duckdbInitialized) return
    await ensureDuckDBInitialized()
    this.duckdbInitialized = true
    
    if (DuckDB) {
      try {
        this.db = new DuckDB.Database(':memory:')
        this.connection = this.db.connect()
      } catch (error) {
        console.warn('DuckDB not available, falling back to PostgreSQL')
      }
    }
  }

  /**
   * Execute a query with security filters
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
      timeout = 30000,
      userId,
      userRole,
      orgUnitId,
    } = options

    try {
      // Build SQL from query object with security filters
      const sql = await this.buildSQLWithSecurity(
        query,
        tenantId,
        limit,
        offset,
        { userId, userRole, orgUnitId, tenantId }
      )

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
   * Build SQL with security filters
   */
  private async buildSQLWithSecurity(
    query: Query,
    tenantId: string,
    limit: number,
    offset: number,
    context: { userId?: string; userRole?: string; orgUnitId?: string; tenantId: string }
  ): Promise<string> {
    // Get RLS filters if user context provided
    let rlsWhereClause = ''
    if (context.userId && context.userRole) {
      try {
        const rlsContext: RLSEvaluationContext = {
          userId: context.userId,
          tenantId: context.tenantId,
          orgUnitId: context.orgUnitId || null,
          role: context.userRole as any,
          action: 'READ',
          resource: typeof query.from === 'string' ? query.from : 'unknown',
        }
        
        const rlsFilter = await buildRLSFilter(rlsContext)
        if (rlsFilter.where && Object.keys(rlsFilter.where).length > 0) {
          // Convert Prisma where clause to SQL WHERE clause
          rlsWhereClause = this.convertPrismaWhereToSQL(rlsFilter.where)
        }
      } catch (error) {
        console.warn('Failed to build RLS filter:', error)
      }
    }

    return this.buildSQL(query, tenantId, limit, offset, rlsWhereClause)
  }

  /**
   * Convert Prisma where clause to SQL WHERE clause (simplified)
   */
  private convertPrismaWhereToSQL(where: any): string {
    // This is a simplified converter - in production, you'd need a full converter
    if (where.OR && Array.isArray(where.OR)) {
      const conditions = where.OR.map((cond: any) => this.convertPrismaWhereToSQL(cond))
      return `(${conditions.join(' OR ')})`
    }
    
    if (where.AND && Array.isArray(where.AND)) {
      const conditions = where.AND.map((cond: any) => this.convertPrismaWhereToSQL(cond))
      return `(${conditions.join(' AND ')})`
    }

    // Simple field comparisons
    for (const [key, value] of Object.entries(where)) {
      if (typeof value === 'object' && value !== null) {
        if (value.equals !== undefined) {
          return `${key} = '${value.equals}'`
        }
        if (value.in && Array.isArray(value.in)) {
          return `${key} IN (${value.in.map((v: any) => `'${v}'`).join(', ')})`
        }
      } else {
        return `${key} = '${value}'`
      }
    }

    return ''
  }

  /**
   * Build SQL from query object
   */
  private buildSQL(
    query: Query,
    tenantId: string,
    limit: number,
    offset: number,
    rlsWhereClause?: string
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

    // Add RLS filters
    if (rlsWhereClause) {
      sql += ` AND (${rlsWhereClause})`
    }

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
    // Try DuckDB first (faster for analytics) - initialize if needed
    await this.ensureDuckDB()
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


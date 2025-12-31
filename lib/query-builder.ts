/**
 * Query Builder
 * 
 * Builds SQL queries from DataFlow formulas and executes them
 */

import { DataFlowParser } from './formula-parser'
import { desktopAPI } from './desktop-api'

export interface QueryOptions {
  table: string
  formula: string
  groupBy?: string[]
  where?: string
  orderBy?: string
  limit?: number
}

export class QueryBuilder {
  private parser: DataFlowParser
  
  constructor() {
    this.parser = new DataFlowParser()
  }
  
  /**
   * Execute DataFlow formula and return results
   */
  async executeFormula(options: QueryOptions): Promise<any[]> {
    const { table, formula, groupBy, where, orderBy, limit } = options
    
    // Parse formula to SQL
    const { sql: sqlExpression, isAggregate } = this.parser.parse(formula)
    
    // Build SELECT clause
    let selectClause = ''
    if (groupBy && groupBy.length > 0) {
      selectClause = `${groupBy.join(', ')}, ${sqlExpression} as result`
    } else {
      selectClause = `${sqlExpression} as result`
    }
    
    // Build FROM clause
    let fromClause = `FROM ${table}`
    
    // Build WHERE clause
    let whereClause = ''
    if (where) {
      whereClause = `WHERE ${where}`
    }
    
    // Build GROUP BY clause
    let groupByClause = ''
    if (groupBy && groupBy.length > 0) {
      groupByClause = `GROUP BY ${groupBy.join(', ')}`
    } else if (isAggregate) {
      // Aggregate without group by - single result
      // No GROUP BY needed
    }
    
    // Build ORDER BY clause
    let orderByClause = ''
    if (orderBy) {
      orderByClause = `ORDER BY ${orderBy}`
    }
    
    // Build LIMIT clause
    let limitClause = ''
    if (limit) {
      limitClause = `LIMIT ${limit}`
    }
    
    // Combine into full query
    const query = [
      `SELECT ${selectClause}`,
      fromClause,
      whereClause,
      groupByClause,
      orderByClause,
      limitClause
    ].filter(Boolean).join(' ')
    
    console.log('📊 Executing query:', query)
    
    // Execute query (works offline with local DuckDB)
    const result = await desktopAPI.query(query)
    
    return result
  }
  
  /**
   * Execute multiple formulas (for calculated fields)
   */
  async executeFormulas(
    table: string,
    formulas: Array<{ name: string; formula: string }>,
    groupBy?: string[]
  ): Promise<any[]> {
    // Build SELECT with all formulas
    const selectParts: string[] = []
    
    if (groupBy && groupBy.length > 0) {
      selectParts.push(...groupBy)
    }
    
    for (const { name, formula } of formulas) {
      const { sql } = this.parser.parse(formula)
      selectParts.push(`${sql} as ${name}`)
    }
    
    const query = [
      `SELECT ${selectParts.join(', ')}`,
      `FROM ${table}`,
      groupBy && groupBy.length > 0 ? `GROUP BY ${groupBy.join(', ')}` : ''
    ].filter(Boolean).join(' ')
    
    console.log('📊 Executing multi-formula query:', query)
    
    return await desktopAPI.query(query)
  }
  
  /**
   * Check if formula is aggregate
   */
  isAggregate(formula: string): boolean {
    return this.parser.hasAggregateFunctions(formula)
  }
}

// Export singleton instance
export const queryBuilder = new QueryBuilder()


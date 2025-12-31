// Query building utilities for Reporting Studio

import { FilterConfig, QueryRequest } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from './constants'

/**
 * Validate SQL query syntax (basic validation)
 */
export function validateSQLQuery(query: string): { valid: boolean; error?: string } {
  const trimmed = query.trim().toUpperCase()

  // Only allow SELECT queries for now
  if (!trimmed.startsWith('SELECT')) {
    return {
      valid: false,
      error: 'Only SELECT queries are allowed',
    }
  }

  // Check for dangerous operations
  const dangerousPatterns = [
    /\b(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      return {
        valid: false,
        error: 'Query contains prohibited operations',
      }
    }
  }

  return { valid: true }
}

/**
 * Apply filters to a query
 */
export function applyFilters(query: string, filters: FilterConfig[]): string {
  if (!filters || filters.length === 0) {
    return query
  }

  // Build WHERE clause from filters
  const whereClauses = filters.map((filter) => {
    return buildFilterClause(filter)
  })

  const whereClause = whereClauses.join(' AND ')

  // Add WHERE clause to query
  if (query.toUpperCase().includes('WHERE')) {
    return `${query} AND ${whereClause}`
  } else {
    return `${query} WHERE ${whereClause}`
  }
}

/**
 * Build a SQL filter clause from a filter config
 */
function buildFilterClause(filter: FilterConfig): string {
  const { field, operator, value } = filter

  switch (operator) {
    case 'equals':
      return `${field} = ${escapeValue(value)}`
    case 'notEquals':
      return `${field} != ${escapeValue(value)}`
    case 'contains':
      return `${field} LIKE '%${escapeString(value)}%'`
    case 'startsWith':
      return `${field} LIKE '${escapeString(value)}%'`
    case 'endsWith':
      return `${field} LIKE '%${escapeString(value)}'`
    case 'greaterThan':
      return `${field} > ${escapeValue(value)}`
    case 'lessThan':
      return `${field} < ${escapeValue(value)}`
    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return `${field} BETWEEN ${escapeValue(value[0])} AND ${escapeValue(value[1])}`
      }
      throw new Error('Between operator requires array with 2 values')
    case 'in':
      if (Array.isArray(value)) {
        const values = value.map((v) => escapeValue(v)).join(', ')
        return `${field} IN (${values})`
      }
      throw new Error('In operator requires array')
    case 'notIn':
      if (Array.isArray(value)) {
        const values = value.map((v) => escapeValue(v)).join(', ')
        return `${field} NOT IN (${values})`
      }
      throw new Error('NotIn operator requires array')
    default:
      throw new Error(`Unknown filter operator: ${operator}`)
  }
}

/**
 * Escape a value for SQL (basic implementation)
 */
function escapeValue(value: any): string {
  if (typeof value === 'string') {
    return `'${escapeString(value)}'`
  }
  if (typeof value === 'number') {
    return String(value)
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`
  }
  if (value === null || value === undefined) {
    return 'NULL'
  }
  return `'${String(value)}'`
}

/**
 * Escape a string for SQL (basic implementation - use parameterized queries in production)
 */
function escapeString(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

/**
 * Apply limit to query
 */
export function applyLimit(query: string, limit: number = REPORTING_STUDIO_CONFIG.DEFAULT_QUERY_ROWS): string {
  const maxLimit = Math.min(limit, REPORTING_STUDIO_CONFIG.MAX_QUERY_ROWS)
  
  if (query.toUpperCase().includes('LIMIT')) {
    // Replace existing LIMIT
    return query.replace(/\s+LIMIT\s+\d+/i, ` LIMIT ${maxLimit}`)
  }
  
  return `${query} LIMIT ${maxLimit}`
}

/**
 * Build a query from request
 */
export function buildQuery(request: QueryRequest): { query: string; parameters?: Record<string, any> } {
  let query = request.query

  if (!query) {
    throw new Error('Query is required')
  }

  // Validate query
  const validation = validateSQLQuery(query)
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid query')
  }

  // Apply parameters if provided
  if (request.parameters) {
    query = applyParameters(query, request.parameters)
  }

  // Apply limit
  query = applyLimit(query)

  return { query }
}

/**
 * Apply parameters to query (basic string replacement - use parameterized queries in production)
 */
function applyParameters(query: string, parameters: Record<string, any>): string {
  let result = query

  for (const [key, value] of Object.entries(parameters)) {
    const placeholder = `:${key}`
    const escapedValue = escapeValue(value)
    result = result.replace(new RegExp(placeholder, 'g'), escapedValue)
  }

  return result
}

/**
 * Generate query hash for caching
 */
export function generateQueryHash(query: string, parameters?: Record<string, any>): string {
  const crypto = require('crypto')
  const data = JSON.stringify({ query, parameters })
  return crypto.createHash('sha256').update(data).digest('hex')
}


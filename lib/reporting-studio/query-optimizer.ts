// Query Optimization Framework for Reporting Studio

export interface QueryPlan {
  optimizedQuery: string
  estimatedRows: number
  estimatedCost: number
  indexes?: string[]
  warnings?: string[]
}

export interface QueryStatistics {
  executionTime: number
  rowsScanned: number
  rowsReturned: number
  cacheHit: boolean
}

/**
 * Optimize a SQL query
 * This is a basic optimizer - can be enhanced with cost-based optimization
 */
export function optimizeQuery(query: string, context?: {
  availableIndexes?: string[]
  tableRowCount?: number
  commonFilters?: string[]
}): QueryPlan {
  const plan: QueryPlan = {
    optimizedQuery: query,
    estimatedRows: 0,
    estimatedCost: 1,
  }

  // Basic optimizations
  let optimized = query.trim()

  // Remove unnecessary whitespace
  optimized = optimized.replace(/\s+/g, ' ')

  // Convert to uppercase for SQL keywords (standardization)
  optimized = optimized.replace(/\b(SELECT|FROM|WHERE|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AND|OR|GROUP BY|ORDER BY|HAVING|LIMIT|OFFSET)\b/gi, (match) => match.toUpperCase())

  // Add LIMIT if not present and context suggests it
  if (context?.tableRowCount && context.tableRowCount > 10000) {
    if (!/LIMIT\s+\d+/i.test(optimized)) {
      optimized += ' LIMIT 1000'
      plan.warnings = plan.warnings || []
      plan.warnings.push('Added LIMIT 1000 for performance (large table detected)')
    }
  }

  // Estimate rows (very basic)
  if (context?.tableRowCount) {
    // Simple heuristic: assume filters reduce by 10% each
    const filterCount = (optimized.match(/WHERE/gi) || []).length + (optimized.match(/AND/gi) || []).length
    plan.estimatedRows = Math.max(1, Math.floor(context.tableRowCount * Math.pow(0.9, filterCount)))
  } else {
    plan.estimatedRows = 1000 // Default estimate
  }

  // Estimate cost (1 = cheapest, higher = more expensive)
  plan.estimatedCost = 1
  if (optimized.match(/JOIN/gi)) {
    plan.estimatedCost += 2 // Joins are expensive
  }
  if (optimized.match(/GROUP BY/gi)) {
    plan.estimatedCost += 1 // Grouping adds cost
  }
  if (optimized.match(/ORDER BY/gi)) {
    plan.estimatedCost += 0.5 // Sorting adds some cost
  }

  // Check for available indexes
  if (context?.availableIndexes) {
    const usedColumns = extractColumnNames(optimized)
    const usedIndexes = context.availableIndexes.filter((idx) =>
      usedColumns.some((col) => idx.toLowerCase().includes(col.toLowerCase()))
    )
    if (usedIndexes.length > 0) {
      plan.indexes = usedIndexes
      plan.estimatedCost *= 0.5 // Indexes reduce cost
    }
  }

  plan.optimizedQuery = optimized
  return plan
}

/**
 * Extract column names from SQL query
 */
function extractColumnNames(query: string): string[] {
  const columns: string[] = []

  // Extract from SELECT clause
  const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i)
  if (selectMatch) {
    const selectClause = selectMatch[1]
    // Simple extraction - split by comma
    selectClause.split(',').forEach((col) => {
      const trimmed = col.trim()
      // Remove aliases
      const colName = trimmed.split(/\s+AS\s+/i)[0].trim()
      if (colName !== '*') {
        columns.push(colName.split('.')[colName.split('.').length - 1]) // Get last part after dot
      }
    })
  }

  // Extract from WHERE clause
  const whereMatch = query.match(/WHERE\s+(.*?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+LIMIT|$)/i)
  if (whereMatch) {
    const whereClause = whereMatch[1]
    // Extract column names before operators
    const colMatches = whereClause.match(/\b[\w]+\s*[=<>!]+/g)
    if (colMatches) {
      colMatches.forEach((match) => {
        const colName = match.replace(/\s*[=<>!]+.*$/, '').trim()
        if (!columns.includes(colName)) {
          columns.push(colName)
        }
      })
    }
  }

  return columns
}

/**
 * Analyze query performance
 */
export function analyzeQueryPerformance(
  statistics: QueryStatistics,
  plan: QueryPlan
): {
  performance: 'excellent' | 'good' | 'fair' | 'poor'
  recommendations: string[]
} {
  const recommendations: string[] = []

  // Check execution time
  if (statistics.executionTime > 5000) {
    recommendations.push('Query execution time is high (>5s). Consider adding indexes or optimizing the query.')
  } else if (statistics.executionTime > 2000) {
    recommendations.push('Query execution time is moderate (>2s). Consider adding filters to reduce data scanned.')
  }

  // Check row scanning efficiency
  if (statistics.rowsScanned > 0) {
    const efficiency = statistics.rowsReturned / statistics.rowsScanned
    if (efficiency < 0.1) {
      recommendations.push(`Only ${(efficiency * 100).toFixed(1)}% of scanned rows were returned. Consider adding more selective filters.`)
    }
  }

  // Check cache hit
  if (!statistics.cacheHit && statistics.executionTime > 1000) {
    recommendations.push('Query was not cached. Consider enabling query caching for repeated queries.')
  }

  // Determine performance rating
  let performance: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
  if (statistics.executionTime < 500 && statistics.rowsReturned < 1000) {
    performance = 'excellent'
  } else if (statistics.executionTime > 3000 || (statistics.rowsScanned > 0 && statistics.rowsReturned / statistics.rowsScanned < 0.05)) {
    performance = 'poor'
  } else if (statistics.executionTime > 1000 || recommendations.length > 1) {
    performance = 'fair'
  }

  return {
    performance,
    recommendations,
  }
}

/**
 * Suggest query optimizations
 */
export function suggestOptimizations(
  query: string,
  statistics?: QueryStatistics
): string[] {
  const suggestions: string[] = []

  // Check for SELECT *
  if (query.match(/SELECT\s+\*/i)) {
    suggestions.push("Avoid SELECT *. Specify only the columns you need to reduce data transfer.")
  }

  // Check for missing WHERE clause on large tables
  if (!query.match(/WHERE/i) && !query.match(/JOIN/i)) {
    suggestions.push("Consider adding a WHERE clause to filter data before processing.")
  }

  // Check for multiple JOINs
  const joinCount = (query.match(/\bJOIN\b/gi) || []).length
  if (joinCount > 3) {
    suggestions.push(`Query has ${joinCount} joins. Consider denormalizing data or using materialized views.`)
  }

  // Check for ORDER BY without LIMIT
  if (query.match(/ORDER\s+BY/i) && !query.match(/LIMIT/i)) {
    suggestions.push("Adding LIMIT to ORDER BY queries can improve performance.")
  }

  // Check for LIKE with leading wildcard
  if (query.match(/LIKE\s+['"]%[^%]/i)) {
    suggestions.push("LIKE queries with leading wildcards (%term) cannot use indexes. Consider full-text search.")
  }

  return suggestions
}


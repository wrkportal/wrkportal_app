// SQL Query Builder for Reporting Studio

export interface QueryBuilderConfig {
  select: string[]
  from: string
  joins?: JoinConfig[]
  where?: FilterCondition[]
  groupBy?: string[]
  having?: FilterCondition[]
  orderBy?: OrderByConfig[]
  limit?: number
  offset?: number
}

export interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
  table: string
  leftKey: string
  rightKey: string
}

export interface FilterCondition {
  column: string
  operator: 'equals' | 'notEquals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'between' | 'in' | 'notIn' | 'isNull' | 'isNotNull'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface OrderByConfig {
  column: string
  direction: 'ASC' | 'DESC'
}

export interface AggregationConfig {
  column: string
  function: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'DISTINCT'
  alias?: string
}

/**
 * Build SQL query from query builder configuration
 */
export function buildSQLQuery(config: QueryBuilderConfig, dialect: 'postgresql' | 'mysql' | 'sqlserver' = 'postgresql'): string {
  let sql = ''

  // SELECT clause
  sql += 'SELECT '
  if (config.select.length === 0) {
    sql += '*'
  } else {
    sql += config.select.join(', ')
  }

  // FROM clause
  sql += ` FROM ${escapeIdentifier(config.from, dialect)}`

  // JOINs
  if (config.joins && config.joins.length > 0) {
    config.joins.forEach((join) => {
      sql += ` ${join.type} JOIN ${escapeIdentifier(join.table, dialect)}`
      sql += ` ON ${escapeIdentifier(join.leftKey, dialect)} = ${escapeIdentifier(join.rightKey, dialect)}`
    })
  }

  // WHERE clause
  if (config.where && config.where.length > 0) {
    const whereConditions = config.where.map((filter, index) => {
      const condition = buildFilterCondition(filter, dialect)
      if (index > 0 && filter.logicalOperator) {
        return ` ${filter.logicalOperator} ${condition}`
      }
      return condition
    }).join('')
    sql += ` WHERE${whereConditions}`
  }

  // GROUP BY
  if (config.groupBy && config.groupBy.length > 0) {
    sql += ` GROUP BY ${config.groupBy.map(col => escapeIdentifier(col, dialect)).join(', ')}`
  }

  // HAVING
  if (config.having && config.having.length > 0) {
    const havingConditions = config.having.map((filter, index) => {
      const condition = buildFilterCondition(filter, dialect)
      if (index > 0 && filter.logicalOperator) {
        return ` ${filter.logicalOperator} ${condition}`
      }
      return condition
    }).join('')
    sql += ` HAVING${havingConditions}`
  }

  // ORDER BY
  if (config.orderBy && config.orderBy.length > 0) {
    const orderClauses = config.orderBy.map((order) => 
      `${escapeIdentifier(order.column, dialect)} ${order.direction}`
    ).join(', ')
    sql += ` ORDER BY ${orderClauses}`
  }

  // LIMIT and OFFSET
  if (config.limit) {
    if (dialect === 'sqlserver') {
      sql += ` OFFSET ${config.offset || 0} ROWS FETCH NEXT ${config.limit} ROWS ONLY`
    } else {
      sql += ` LIMIT ${config.limit}`
      if (config.offset) {
        sql += ` OFFSET ${config.offset}`
      }
    }
  } else if (config.offset) {
    if (dialect === 'sqlserver') {
      sql += ` OFFSET ${config.offset} ROWS`
    } else {
      sql += ` OFFSET ${config.offset}`
    }
  }

  return sql
}

/**
 * Build filter condition SQL
 */
function buildFilterCondition(filter: FilterCondition, dialect: 'postgresql' | 'mysql' | 'sqlserver'): string {
  const column = escapeIdentifier(filter.column, dialect)
  
  switch (filter.operator) {
    case 'equals':
      return `${column} = ${escapeValue(filter.value)}`
    case 'notEquals':
      return `${column} != ${escapeValue(filter.value)}`
    case 'contains':
      if (dialect === 'sqlserver') {
        return `${column} LIKE '%${escapeSQLString(filter.value)}%'`
      }
      return `${column} LIKE '%${escapeSQLString(filter.value)}%'`
    case 'startsWith':
      return `${column} LIKE '${escapeSQLString(filter.value)}%'`
    case 'endsWith':
      return `${column} LIKE '%${escapeSQLString(filter.value)}'`
    case 'greaterThan':
      return `${column} > ${escapeValue(filter.value)}`
    case 'lessThan':
      return `${column} < ${escapeValue(filter.value)}`
    case 'greaterThanOrEqual':
      return `${column} >= ${escapeValue(filter.value)}`
    case 'lessThanOrEqual':
      return `${column} <= ${escapeValue(filter.value)}`
    case 'between':
      if (Array.isArray(filter.value) && filter.value.length === 2) {
        return `${column} BETWEEN ${escapeValue(filter.value[0])} AND ${escapeValue(filter.value[1])}`
      }
      throw new Error('BETWEEN operator requires array of 2 values')
    case 'in':
      const inValues = Array.isArray(filter.value) 
        ? filter.value.map(v => escapeValue(v)).join(', ')
        : escapeValue(filter.value)
      return `${column} IN (${inValues})`
    case 'notIn':
      const notInValues = Array.isArray(filter.value)
        ? filter.value.map(v => escapeValue(v)).join(', ')
        : escapeValue(filter.value)
      return `${column} NOT IN (${notInValues})`
    case 'isNull':
      return `${column} IS NULL`
    case 'isNotNull':
      return `${column} IS NOT NULL`
    default:
      throw new Error(`Unsupported operator: ${filter.operator}`)
  }
}

/**
 * Escape SQL identifier (table/column names)
 */
function escapeIdentifier(identifier: string, dialect: 'postgresql' | 'mysql' | 'sqlserver'): string {
  // Remove any existing quotes
  const cleaned = identifier.replace(/["`\[\]]/g, '')
  
  // Check if it contains a dot (schema.table or table.column)
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.')
    return parts.map(part => escapeIdentifierPart(part, dialect)).join('.')
  }
  
  return escapeIdentifierPart(cleaned, dialect)
}

/**
 * Escape identifier part
 */
function escapeIdentifierPart(part: string, dialect: 'postgresql' | 'mysql' | 'sqlserver'): string {
  switch (dialect) {
    case 'postgresql':
      return `"${part}"`
    case 'mysql':
      return `\`${part}\``
    case 'sqlserver':
      return `[${part}]`
    default:
      return part
  }
}

/**
 * Escape SQL value (strings, numbers, etc.)
 */
function escapeValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL'
  }
  
  if (typeof value === 'number') {
    return String(value)
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE'
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`
  }
  
  // String value
  return `'${escapeSQLString(String(value))}'`
}

/**
 * Escape SQL string (prevent SQL injection)
 */
function escapeSQLString(str: string): string {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

/**
 * Validate query builder configuration
 */
export function validateQueryConfig(config: QueryBuilderConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.from || config.from.trim() === '') {
    errors.push('FROM table is required')
  }

  if (config.select.length === 0) {
    errors.push('At least one SELECT column is required')
  }

  if (config.joins) {
    config.joins.forEach((join, index) => {
      if (!join.table || join.table.trim() === '') {
        errors.push(`Join ${index + 1}: Table is required`)
      }
      if (!join.leftKey || join.leftKey.trim() === '') {
        errors.push(`Join ${index + 1}: Left key is required`)
      }
      if (!join.rightKey || join.rightKey.trim() === '') {
        errors.push(`Join ${index + 1}: Right key is required`)
      }
    })
  }

  if (config.limit !== undefined && config.limit < 0) {
    errors.push('LIMIT must be non-negative')
  }

  if (config.offset !== undefined && config.offset < 0) {
    errors.push('OFFSET must be non-negative')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Parse SQL query to query builder configuration
 */
export function parseSQLQuery(sql: string): QueryBuilderConfig {
  // This is a basic parser - in production, use a proper SQL parser library
  const config: QueryBuilderConfig = {
    select: ['*'],
    from: '',
  }

  // Very basic parsing - this is a simplified version
  const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i)
  if (selectMatch) {
    config.select = selectMatch[1]
      .split(',')
      .map((col) => col.trim())
      .filter(Boolean)
  }

  const fromMatch = sql.match(/FROM\s+(\w+)/i)
  if (fromMatch) {
    config.from = fromMatch[1]
  }

  const limitMatch = sql.match(/LIMIT\s+(\d+)/i)
  if (limitMatch) {
    config.limit = parseInt(limitMatch[1])
  }

  const offsetMatch = sql.match(/OFFSET\s+(\d+)/i)
  if (offsetMatch) {
    config.offset = parseInt(offsetMatch[1])
  }

  return config
}


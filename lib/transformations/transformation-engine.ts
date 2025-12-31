/**
 * Phase 5.4: Data Transformation Engine
 * 
 * Executes transformation operators on data
 */

export type TransformationOperator = 
  | 'READ_DATASET' | 'READ_CSV' | 'READ_JSON' | 'READ_API'
  | 'FILTER' | 'WHERE' | 'DISTINCT'
  | 'SELECT_COLUMNS' | 'RENAME_COLUMNS' | 'ADD_COLUMN' | 'REMOVE_COLUMNS' | 'SORT' | 'LIMIT' | 'OFFSET'
  | 'GROUP_BY' | 'AGGREGATE' | 'PIVOT' | 'UNPIVOT'
  | 'INNER_JOIN' | 'LEFT_JOIN' | 'RIGHT_JOIN' | 'FULL_JOIN' | 'UNION'
  | 'CALCULATE' | 'FORMAT_DATE' | 'PARSE_NUMBER' | 'CONCATENATE'
  | 'FILL_NULLS' | 'REMOVE_DUPLICATES' | 'VALIDATE_DATA' | 'CLEAN_DATA'
  | 'WRITE_DATASET' | 'EXPORT_CSV' | 'EXPORT_JSON'

export interface TransformationConfig {
  [key: string]: any
}

export interface TransformationResult {
  data: any[]
  schema: { name: string; type: string }[]
  rowCount: number
  error?: string
}

/**
 * Execute a transformation operator on input data
 */
export function executeTransformation(
  operator: TransformationOperator,
  inputData: any[],
  config: TransformationConfig
): TransformationResult {
  try {
    let result: any[] = [...inputData]
    let schema: { name: string; type: string }[] = []

    switch (operator) {
      case 'FILTER':
      case 'WHERE':
        result = filterData(result, config)
        break
      
      case 'DISTINCT':
        result = getDistinct(result, config.columns || [])
        break
      
      case 'SELECT_COLUMNS':
        result = selectColumns(result, config.columns || [])
        break
      
      case 'RENAME_COLUMNS':
        result = renameColumns(result, config.mappings || {})
        break
      
      case 'ADD_COLUMN':
        result = addColumn(result, config)
        break
      
      case 'REMOVE_COLUMNS':
        result = removeColumns(result, config.columns || [])
        break
      
      case 'SORT':
        result = sortData(result, config)
        break
      
      case 'LIMIT':
        result = limitData(result, config.count || 100)
        break
      
      case 'OFFSET':
        result = offsetData(result, config.count || 0)
        break
      
      case 'GROUP_BY':
        result = groupBy(result, config)
        break
      
      case 'AGGREGATE':
        result = aggregate(result, config)
        break
      
      case 'FILL_NULLS':
        result = fillNulls(result, config)
        break
      
      case 'REMOVE_DUPLICATES':
        result = removeDuplicates(result, config.columns || [])
        break
      
      case 'CALCULATE':
        result = calculate(result, config)
        break
      
      case 'FORMAT_DATE':
        result = formatDate(result, config)
        break
      
      case 'PARSE_NUMBER':
        result = parseNumber(result, config)
        break
      
      case 'CONCATENATE':
        result = concatenate(result, config)
        break
      
      default:
        throw new Error(`Unsupported operator: ${operator}`)
    }

    // Infer schema from result
    if (result.length > 0) {
      schema = inferSchema(result[0])
    }

    return {
      data: result,
      schema,
      rowCount: result.length,
    }
  } catch (error) {
    return {
      data: [],
      schema: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Helper functions

function filterData(data: any[], config: TransformationConfig): any[] {
  const { condition, column, operator, value } = config
  
  if (condition) {
    // Support JavaScript-like conditions
    return data.filter(row => {
      try {
        // Simple condition evaluation (in production, use a proper expression parser)
        return eval(`row.${condition}`)
      } catch {
        return false
      }
    })
  }
  
  if (column && operator && value !== undefined) {
    return data.filter(row => {
      const cellValue = row[column]
      switch (operator) {
        case 'equals':
        case '==':
          return cellValue == value
        case 'not_equals':
        case '!=':
          return cellValue != value
        case 'greater_than':
        case '>':
          return Number(cellValue) > Number(value)
        case 'less_than':
        case '<':
          return Number(cellValue) < Number(value)
        case 'contains':
          return String(cellValue).includes(String(value))
        case 'starts_with':
          return String(cellValue).startsWith(String(value))
        case 'ends_with':
          return String(cellValue).endsWith(String(value))
        default:
          return true
      }
    })
  }
  
  return data
}

function getDistinct(data: any[], columns: string[]): any[] {
  if (columns.length === 0) {
    // Distinct on all columns
    const seen = new Set<string>()
    return data.filter(row => {
      const key = JSON.stringify(row)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }
  
  // Distinct on specific columns
  const seen = new Set<string>()
  return data.filter(row => {
    const key = columns.map(col => row[col]).join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function selectColumns(data: any[], columns: string[]): any[] {
  return data.map(row => {
    const selected: any = {}
    columns.forEach(col => {
      if (col in row) {
        selected[col] = row[col]
      }
    })
    return selected
  })
}

function renameColumns(data: any[], mappings: Record<string, string>): any[] {
  return data.map(row => {
    const renamed: any = {}
    Object.keys(row).forEach(key => {
      const newKey = mappings[key] || key
      renamed[newKey] = row[key]
    })
    return renamed
  })
}

function addColumn(data: any[], config: TransformationConfig): any[] {
  const { column, expression, defaultValue } = config
  
  if (!column) return data
  
  return data.map(row => {
    if (expression) {
      try {
        // Simple expression evaluation (in production, use a proper expression parser)
        const newValue = eval(expression.replace(/\{(\w+)\}/g, 'row.$1'))
        return { ...row, [column]: newValue }
      } catch {
        return { ...row, [column]: defaultValue ?? null }
      }
    }
    return { ...row, [column]: defaultValue ?? null }
  })
}

function removeColumns(data: any[], columns: string[]): any[] {
  return data.map(row => {
    const filtered: any = {}
    Object.keys(row).forEach(key => {
      if (!columns.includes(key)) {
        filtered[key] = row[key]
      }
    })
    return filtered
  })
}

function sortData(data: any[], config: TransformationConfig): any[] {
  const { column, direction = 'asc' } = config
  
  if (!column) return data
  
  return [...data].sort((a, b) => {
    const aVal = a[column]
    const bVal = b[column]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    if (direction === 'desc') {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
    }
    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
  })
}

function limitData(data: any[], count: number): any[] {
  return data.slice(0, count)
}

function offsetData(data: any[], count: number): any[] {
  return data.slice(count)
}

function groupBy(data: any[], config: TransformationConfig): any[] {
  const { columns, aggregations } = config
  
  if (!columns || columns.length === 0) return data
  
  const groups = new Map<string, any[]>()
  
  data.forEach(row => {
    const key = columns.map(col => row[col]).join('|')
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(row)
  })
  
  return Array.from(groups.entries()).map(([key, rows]) => {
    const result: any = {}
    columns.forEach((col: string) => {
      result[col] = rows[0][col]
    })
    
    if (aggregations) {
      aggregations.forEach((agg: any) => {
        const { column, function: fn, alias } = agg
        let value: any
        
        switch (fn) {
          case 'sum':
            value = rows.reduce((sum, r) => sum + (Number(r[column]) || 0), 0)
            break
          case 'avg':
          case 'average':
            value = rows.reduce((sum, r) => sum + (Number(r[column]) || 0), 0) / rows.length
            break
          case 'count':
            value = rows.length
            break
          case 'min':
            value = Math.min(...rows.map(r => Number(r[column]) || 0))
            break
          case 'max':
            value = Math.max(...rows.map(r => Number(r[column]) || 0))
            break
          default:
            value = null
        }
        
        result[alias || `${fn}_${column}`] = value
      })
    }
    
    return result
  })
}

function aggregate(data: any[], config: TransformationConfig): any[] {
  // Similar to groupBy but for single aggregation
  return groupBy(data, config)
}

function fillNulls(data: any[], config: TransformationConfig): any[] {
  const { columns, value = null, strategy = 'constant' } = config
  
  return data.map(row => {
    const filled = { ...row }
    
    if (columns && columns.length > 0) {
      columns.forEach((col: string) => {
        if (filled[col] === null || filled[col] === undefined) {
          if (strategy === 'constant') {
            filled[col] = value
          } else if (strategy === 'forward_fill') {
            // Use previous value (would need row index in real implementation)
            filled[col] = value
          }
        }
      })
    } else {
      // Fill all nulls
      Object.keys(filled).forEach(key => {
        if (filled[key] === null || filled[key] === undefined) {
          filled[key] = value
        }
      })
    }
    
    return filled
  })
}

function removeDuplicates(data: any[], columns: string[]): any[] {
  return getDistinct(data, columns)
}

function calculate(data: any[], config: TransformationConfig): any[] {
  const { column, expression } = config
  
  if (!column || !expression) return data
  
  return data.map(row => {
    try {
      // Simple expression evaluation
      const newValue = eval(expression.replace(/\{(\w+)\}/g, 'row.$1'))
      return { ...row, [column]: newValue }
    } catch {
      return row
    }
  })
}

function formatDate(data: any[], config: TransformationConfig): any[] {
  const { column, format } = config
  
  if (!column) return data
  
  return data.map(row => {
    if (row[column]) {
      try {
        const date = new Date(row[column])
        if (format) {
          // Simple date formatting (in production, use a proper date library)
          return { ...row, [column]: date.toISOString().split('T')[0] }
        }
        return { ...row, [column]: date.toISOString() }
      } catch {
        return row
      }
    }
    return row
  })
}

function parseNumber(data: any[], config: TransformationConfig): any[] {
  const { column } = config
  
  if (!column) return data
  
  return data.map(row => {
    if (row[column]) {
      const num = Number(row[column])
      return { ...row, [column]: isNaN(num) ? row[column] : num }
    }
    return row
  })
}

function concatenate(data: any[], config: TransformationConfig): any[] {
  const { columns, separator = '', outputColumn } = config
  
  if (!columns || columns.length === 0 || !outputColumn) return data
  
  return data.map(row => {
    const values = columns.map((col: string) => row[col] || '')
    return { ...row, [outputColumn]: values.join(separator) }
  })
}

function inferSchema(row: any): { name: string; type: string }[] {
  return Object.keys(row).map(key => ({
    name: key,
    type: inferType(row[key]),
  }))
}

function inferType(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  if (value instanceof Date) return 'date'
  if (typeof value === 'string') {
    // Try to detect date strings
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'date'
    // Try to detect number strings
    if (!isNaN(Number(value)) && value.trim() !== '') return 'number'
    return 'string'
  }
  return 'unknown'
}


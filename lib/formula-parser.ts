/**
 * DataFlow Formula Parser
 * 
 * Custom formula language (different from Power BI's DAX)
 * Converts DataFlow formulas to SQL for DuckDB execution
 */

export interface DataFlowFunction {
  name: string
  syntax: string
  description: string
  example: string
  implementation: (args: string[]) => string // Returns SQL expression
  isAggregate?: boolean // True if this is an aggregate function
}

// DataFlow Functions (Your Custom Language)
export const DATAFLOW_FUNCTIONS: DataFlowFunction[] = [
  {
    name: 'TOTAL',
    syntax: 'TOTAL(column)',
    description: 'Sum of all values in column',
    example: 'TOTAL(amount)',
    implementation: (args) => `SUM(${args[0]})`,
    isAggregate: true
  },
  {
    name: 'MEAN',
    syntax: 'MEAN(column)',
    description: 'Average of values',
    example: 'MEAN(price)',
    implementation: (args) => `AVG(${args[0]})`,
    isAggregate: true
  },
  {
    name: 'COUNT',
    syntax: 'COUNT(column)',
    description: 'Count of non-null values',
    example: 'COUNT(id)',
    implementation: (args) => `COUNT(${args[0]})`,
    isAggregate: true
  },
  {
    name: 'MAXIMUM',
    syntax: 'MAXIMUM(column)',
    description: 'Maximum value',
    example: 'MAXIMUM(price)',
    implementation: (args) => `MAX(${args[0]})`,
    isAggregate: true
  },
  {
    name: 'MINIMUM',
    syntax: 'MINIMUM(column)',
    description: 'Minimum value',
    example: 'MINIMUM(price)',
    implementation: (args) => `MIN(${args[0]})`,
    isAggregate: true
  },
  {
    name: 'ADD',
    syntax: 'ADD(column1, column2, ...)',
    description: 'Add multiple columns',
    example: 'ADD(price, tax)',
    implementation: (args) => args.map(col => col.trim()).join(' + ')
  },
  {
    name: 'SUBTRACT',
    syntax: 'SUBTRACT(column1, column2)',
    description: 'Subtract column2 from column1',
    example: 'SUBTRACT(revenue, cost)',
    implementation: (args) => `${args[0].trim()} - ${args[1].trim()}`
  },
  {
    name: 'MULTIPLY',
    syntax: 'MULTIPLY(column1, column2, ...)',
    description: 'Multiply columns',
    example: 'MULTIPLY(quantity, price)',
    implementation: (args) => args.map(col => col.trim()).join(' * ')
  },
  {
    name: 'DIVIDE',
    syntax: 'DIVIDE(column1, column2)',
    description: 'Divide column1 by column2',
    example: 'DIVIDE(profit, revenue)',
    implementation: (args) => {
      const num = args[0].trim()
      const den = args[1].trim()
      return `(${num} * 1.0) / NULLIF(${den}, 0)`
    }
  },
  {
    name: 'PERCENT_OF',
    syntax: 'PERCENT_OF(value, total)',
    description: 'Calculate percentage (value/total * 100)',
    example: 'PERCENT_OF(profit, revenue)',
    implementation: (args) => {
      const value = args[0].trim()
      const total = args[1].trim()
      return `(${value} * 100.0) / NULLIF(${total}, 0)`
    }
  },
  {
    name: 'GROWTH',
    syntax: 'GROWTH(current, previous)',
    description: 'Calculate growth percentage',
    example: 'GROWTH(current_sales, previous_sales)',
    implementation: (args) => {
      const current = args[0].trim()
      const previous = args[1].trim()
      return `((${current} - ${previous}) * 100.0) / NULLIF(${previous}, 0)`
    }
  },
  {
    name: 'IF_SUM',
    syntax: 'IF_SUM(condition, column)',
    description: 'Sum if condition is true',
    example: 'IF_SUM(category = "A", amount)',
    implementation: (args) => {
      const condition = args[0].trim()
      const column = args[1].trim()
      return `SUM(CASE WHEN ${condition} THEN ${column} ELSE 0 END)`
    },
    isAggregate: true
  },
  {
    name: 'IF_MEAN',
    syntax: 'IF_MEAN(condition, column)',
    description: 'Average if condition is true',
    example: 'IF_MEAN(status = "active", price)',
    implementation: (args) => {
      const condition = args[0].trim()
      const column = args[1].trim()
      return `AVG(CASE WHEN ${condition} THEN ${column} ELSE NULL END)`
    },
    isAggregate: true
  },
  {
    name: 'PERIOD_TOTAL',
    syntax: 'PERIOD_TOTAL(column, period)',
    description: 'Total for specific time period (year, month, quarter)',
    example: 'PERIOD_TOTAL(amount, "year")',
    implementation: (args) => {
      const column = args[0].trim()
      const period = args[1].trim().replace(/['"]/g, '')
      return `SUM(CASE WHEN date_trunc('${period}', date_column) = date_trunc('${period}', CURRENT_DATE) THEN ${column} ELSE 0 END)`
    },
    isAggregate: true
  },
  {
    name: 'ROUND',
    syntax: 'ROUND(column, decimals)',
    description: 'Round to specified decimal places',
    example: 'ROUND(price, 2)',
    implementation: (args) => {
      const column = args[0].trim()
      const decimals = args[1].trim()
      return `ROUND(${column}, ${decimals})`
    }
  },
  {
    name: 'CONCAT',
    syntax: 'CONCAT(column1, column2, ...)',
    description: 'Combine text columns',
    example: 'CONCAT(first_name, " ", last_name)',
    implementation: (args) => {
      return args.map(arg => {
        const trimmed = arg.trim()
        // If it's a quoted string, keep it as is
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          return trimmed.slice(1, -1)
        }
        // Otherwise, it's a column reference
        return trimmed
      }).join(' || ')
    }
  },
  {
    name: 'UPPER',
    syntax: 'UPPER(column)',
    description: 'Convert text to uppercase',
    example: 'UPPER(name)',
    implementation: (args) => `UPPER(${args[0].trim()})`
  },
  {
    name: 'LOWER',
    syntax: 'LOWER(column)',
    description: 'Convert text to lowercase',
    example: 'LOWER(email)',
    implementation: (args) => `LOWER(${args[0].trim()})`
  },
  {
    name: 'IF',
    syntax: 'IF(condition, trueValue, falseValue)',
    description: 'Conditional logic',
    example: 'IF(amount > 1000, "High", "Low")',
    implementation: (args) => {
      const condition = args[0].trim()
      const trueValue = args[1].trim()
      const falseValue = args[2].trim()
      return `CASE WHEN ${condition} THEN ${trueValue} ELSE ${falseValue} END`
    }
  }
]

/**
 * DataFlow Formula Parser
 * Converts DataFlow syntax to SQL
 */
export class DataFlowParser {
  private functions: Map<string, DataFlowFunction>
  
  constructor() {
    this.functions = new Map(
      DATAFLOW_FUNCTIONS.map(f => [f.name.toUpperCase(), f])
    )
  }
  
  /**
   * Parse DataFlow formula to SQL expression
   */
  parse(formula: string): { sql: string; isAggregate: boolean } {
    formula = formula.trim()
    
    // Check if it's a function call
    const functionMatch = formula.match(/^(\w+)\((.*)\)$/)
    
    if (!functionMatch) {
      // Simple column reference or expression
      return { sql: formula, isAggregate: false }
    }
    
    const [, functionName, argsString] = functionMatch
    const func = this.functions.get(functionName.toUpperCase())
    
    if (!func) {
      throw new Error(`Unknown function: ${functionName}. Available: ${Array.from(this.functions.keys()).join(', ')}`)
    }
    
    // Parse arguments
    const args = this.parseArguments(argsString)
    
    // Generate SQL
    const sql = func.implementation(args)
    
    return {
      sql,
      isAggregate: func.isAggregate || false
    }
  }
  
  /**
   * Parse function arguments
   */
  private parseArguments(argsString: string): string[] {
    const args: string[] = []
    let current = ''
    let depth = 0
    let inQuotes = false
    let quoteChar = ''
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i]
      
      // Handle quotes
      if ((char === '"' || char === "'") && (i === 0 || argsString[i - 1] !== '\\')) {
        if (!inQuotes) {
          inQuotes = true
          quoteChar = char
          current += char
        } else if (char === quoteChar) {
          inQuotes = false
          quoteChar = ''
          current += char
        } else {
          current += char
        }
        continue
      }
      
      // Handle parentheses (for nested functions)
      if (!inQuotes) {
        if (char === '(') depth++
        else if (char === ')') depth--
        else if (char === ',' && depth === 0) {
          args.push(current.trim())
          current = ''
          continue
        }
      }
      
      current += char
    }
    
    if (current.trim()) {
      args.push(current.trim())
    }
    
    return args
  }
  
  /**
   * Check if formula contains aggregate functions
   */
  hasAggregateFunctions(formula: string): boolean {
    try {
      const result = this.parse(formula)
      return result.isAggregate
    } catch {
      return false
    }
  }
  
  /**
   * Get all available functions
   */
  getFunctions(): DataFlowFunction[] {
    return DATAFLOW_FUNCTIONS
  }
  
  /**
   * Get function by name
   */
  getFunction(name: string): DataFlowFunction | undefined {
    return this.functions.get(name.toUpperCase())
  }
}

// Export singleton instance
export const dataFlowParser = new DataFlowParser()


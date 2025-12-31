/**
 * Function Registry
 * Manages built-in and custom functions for the reporting engine
 */

export interface FunctionDefinition {
  name: string
  syntax: string
  description: string
  execute: (...args: any[]) => any
  returnType: 'number' | 'string' | 'boolean' | 'date' | 'any'
  parameters: ParameterDefinition[]
  category?: string
  examples?: string[]
}

export interface ParameterDefinition {
  name: string
  type: 'number' | 'string' | 'boolean' | 'date' | 'any'
  required: boolean
  description?: string
}

export class FunctionRegistry {
  private functions: Map<string, FunctionDefinition> = new Map()
  private customFunctions: Map<string, FunctionDefinition> = new Map()

  constructor() {
    this.registerBuiltInFunctions()
  }

  /**
   * Register a function
   */
  register(functionDef: FunctionDefinition, isCustom: boolean = false): void {
    const registry = isCustom ? this.customFunctions : this.functions

    if (registry.has(functionDef.name)) {
      throw new Error(`Function ${functionDef.name} already exists`)
    }

    registry.set(functionDef.name, functionDef)
  }

  /**
   * Get a function by name
   */
  get(name: string): FunctionDefinition | undefined {
    return this.customFunctions.get(name) || this.functions.get(name)
  }

  /**
   * Get all functions
   */
  getAll(): FunctionDefinition[] {
    return [
      ...Array.from(this.functions.values()),
      ...Array.from(this.customFunctions.values())
    ]
  }

  /**
   * Get functions by category
   */
  getByCategory(category: string): FunctionDefinition[] {
    return this.getAll().filter(fn => fn.category === category)
  }

  /**
   * Execute a function
   */
  execute(name: string, args: any[]): any {
    const func = this.get(name)
    if (!func) {
      throw new Error(`Function ${name} not found`)
    }

    // Validate parameters
    this.validateParameters(func, args)

    // Execute function
    try {
      return func.execute(...args)
    } catch (error: any) {
      throw new Error(`Error executing ${name}: ${error.message}`)
    }
  }

  /**
   * Validate function parameters
   */
  private validateParameters(func: FunctionDefinition, args: any[]): void {
    const requiredParams = func.parameters.filter(p => p.required)

    if (args.length < requiredParams.length) {
      throw new Error(
        `Function ${func.name} requires at least ${requiredParams.length} parameters, got ${args.length}`
      )
    }

    // Type checking
    for (let i = 0; i < Math.min(args.length, func.parameters.length); i++) {
      const param = func.parameters[i]
      const arg = args[i]

      if (param.type !== 'any' && !this.isType(arg, param.type)) {
        throw new Error(
          `Parameter ${param.name} expects ${param.type}, got ${typeof arg}`
        )
      }
    }
  }

  /**
   * Check if value matches type
   */
  private isType(value: any, type: string): boolean {
    switch (type) {
      case 'number':
        return typeof value === 'number' && !isNaN(value)
      case 'string':
        return typeof value === 'string'
      case 'boolean':
        return typeof value === 'boolean'
      case 'date':
        return value instanceof Date || !isNaN(Date.parse(value))
      case 'any':
        return true
      default:
        return false
    }
  }

  /**
   * Register built-in functions
   */
  private registerBuiltInFunctions(): void {
    // Mathematical functions
    this.register({
      name: 'SUM',
      syntax: 'SUM(column)',
      description: 'Sum of values in a column',
      execute: (...args: number[]) => args.reduce((a, b) => a + b, 0),
      returnType: 'number',
      parameters: [
        { name: 'values', type: 'number', required: true, description: 'Numbers to sum' }
      ],
      category: 'mathematical'
    })

    this.register({
      name: 'AVG',
      syntax: 'AVG(column)',
      description: 'Average of values in a column',
      execute: (...args: number[]) => {
        const sum = args.reduce((a, b) => a + b, 0)
        return sum / args.length
      },
      returnType: 'number',
      parameters: [
        { name: 'values', type: 'number', required: true, description: 'Numbers to average' }
      ],
      category: 'mathematical'
    })

    this.register({
      name: 'COUNT',
      syntax: 'COUNT(column)',
      description: 'Count of non-null values',
      execute: (...args: any[]) => args.filter(v => v != null).length,
      returnType: 'number',
      parameters: [
        { name: 'values', type: 'any', required: true, description: 'Values to count' }
      ],
      category: 'mathematical'
    })

    this.register({
      name: 'MIN',
      syntax: 'MIN(column)',
      description: 'Minimum value',
      execute: (...args: number[]) => Math.min(...args),
      returnType: 'number',
      parameters: [
        { name: 'values', type: 'number', required: true, description: 'Numbers to compare' }
      ],
      category: 'mathematical'
    })

    this.register({
      name: 'MAX',
      syntax: 'MAX(column)',
      description: 'Maximum value',
      execute: (...args: number[]) => Math.max(...args),
      returnType: 'number',
      parameters: [
        { name: 'values', type: 'number', required: true, description: 'Numbers to compare' }
      ],
      category: 'mathematical'
    })

    // String functions
    this.register({
      name: 'CONCAT',
      syntax: 'CONCAT(str1, str2, ...)',
      description: 'Concatenate strings',
      execute: (...args: string[]) => args.join(''),
      returnType: 'string',
      parameters: [
        { name: 'strings', type: 'string', required: true, description: 'Strings to concatenate' }
      ],
      category: 'string'
    })

    this.register({
      name: 'UPPER',
      syntax: 'UPPER(str)',
      description: 'Convert string to uppercase',
      execute: (str: string) => str.toUpperCase(),
      returnType: 'string',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert' }
      ],
      category: 'string'
    })

    this.register({
      name: 'LOWER',
      syntax: 'LOWER(str)',
      description: 'Convert string to lowercase',
      execute: (str: string) => str.toLowerCase(),
      returnType: 'string',
      parameters: [
        { name: 'str', type: 'string', required: true, description: 'String to convert' }
      ],
      category: 'string'
    })

    // Conditional functions
    this.register({
      name: 'IF',
      syntax: 'IF(condition, trueValue, falseValue)',
      description: 'Conditional logic',
      execute: (condition: boolean, trueValue: any, falseValue: any) =>
        condition ? trueValue : falseValue,
      returnType: 'any',
      parameters: [
        { name: 'condition', type: 'boolean', required: true, description: 'Condition to evaluate' },
        { name: 'trueValue', type: 'any', required: true, description: 'Value if true' },
        { name: 'falseValue', type: 'any', required: true, description: 'Value if false' }
      ],
      category: 'conditional'
    })

    // Date functions
    this.register({
      name: 'YEAR',
      syntax: 'YEAR(date)',
      description: 'Extract year from date',
      execute: (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date)
        return d.getFullYear()
      },
      returnType: 'number',
      parameters: [
        { name: 'date', type: 'date', required: true, description: 'Date value' }
      ],
      category: 'date'
    })

    this.register({
      name: 'MONTH',
      syntax: 'MONTH(date)',
      description: 'Extract month from date',
      execute: (date: Date | string) => {
        const d = date instanceof Date ? date : new Date(date)
        return d.getMonth() + 1
      },
      returnType: 'number',
      parameters: [
        { name: 'date', type: 'date', required: true, description: 'Date value' }
      ],
      category: 'date'
    })

    this.register({
      name: 'DATEDIFF',
      syntax: 'DATEDIFF(date1, date2)',
      description: 'Difference in days between two dates',
      execute: (date1: Date | string, date2: Date | string) => {
        const d1 = date1 instanceof Date ? date1 : new Date(date1)
        const d2 = date2 instanceof Date ? date2 : new Date(date2)
        return Math.abs((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24))
      },
      returnType: 'number',
      parameters: [
        { name: 'date1', type: 'date', required: true, description: 'First date' },
        { name: 'date2', type: 'date', required: true, description: 'Second date' }
      ],
      category: 'date'
    })
  }

  /**
   * Remove a custom function
   */
  remove(name: string): boolean {
    return this.customFunctions.delete(name)
  }

  /**
   * Clear all custom functions
   */
  clearCustom(): void {
    this.customFunctions.clear()
  }
}

// Singleton instance
let functionRegistryInstance: FunctionRegistry | null = null

export function getFunctionRegistry(): FunctionRegistry {
  if (!functionRegistryInstance) {
    functionRegistryInstance = new FunctionRegistry()
  }
  return functionRegistryInstance
}
















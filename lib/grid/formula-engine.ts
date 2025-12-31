/**
 * Phase 5.3: Excel-like Grid Editor - Formula Engine
 * 
 * Formula parsing and evaluation engine supporting Excel-like functions
 */

export interface CellReference {
  row: number
  column: number
}

export interface FormulaContext {
  getCellValue: (row: number, column: number) => string | number | null
  getCellRange: (startRow: number, startCol: number, endRow: number, endCol: number) => (string | number | null)[]
}

/**
 * Parse cell reference (e.g., "A1", "B2", "AA10")
 */
export function parseCellReference(ref: string): CellReference | null {
  const match = ref.match(/^([A-Z]+)(\d+)$/i)
  if (!match) return null

  const colStr = match[1].toUpperCase()
  let column = 0
  for (let i = 0; i < colStr.length; i++) {
    column = column * 26 + (colStr.charCodeAt(i) - 64)
  }
  column -= 1 // Convert to 0-based

  const row = parseInt(match[2]) - 1 // Convert to 0-based

  return { row, column }
}

/**
 * Convert cell coordinates to reference string (e.g., 0,0 -> "A1")
 */
export function cellReferenceToString(row: number, column: number): string {
  let colStr = ''
  column += 1 // Convert from 0-based to 1-based
  while (column > 0) {
    column -= 1
    colStr = String.fromCharCode(65 + (column % 26)) + colStr
    column = Math.floor(column / 26)
  }
  return `${colStr}${row + 1}`
}

/**
 * Parse cell range (e.g., "A1:B10")
 */
export function parseCellRange(range: string): { start: CellReference; end: CellReference } | null {
  const parts = range.split(':')
  if (parts.length !== 2) return null

  const start = parseCellReference(parts[0])
  const end = parseCellReference(parts[1])

  if (!start || !end) return null

  return { start, end }
}

/**
 * Get all cell references in a range
 */
export function getCellsInRange(startRow: number, startCol: number, endRow: number, endCol: number): CellReference[] {
  const cells: CellReference[] = []
  const minRow = Math.min(startRow, endRow)
  const maxRow = Math.max(startRow, endRow)
  const minCol = Math.min(startCol, endCol)
  const maxCol = Math.max(startCol, endCol)

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ row, column: col })
    }
  }

  return cells
}

/**
 * Extract dependencies from formula (cell references)
 */
export function extractDependencies(formula: string): string[] {
  // Remove the leading = if present
  const formulaText = formula.startsWith('=') ? formula.slice(1) : formula

  // Match cell references (A1, B2, AA10, etc.) and ranges (A1:B10)
  const cellRefRegex = /([A-Z]+\d+)(?::([A-Z]+\d+))?/gi
  const dependencies: Set<string> = new Set()

  let match
  while ((match = cellRefRegex.exec(formulaText)) !== null) {
    const startRef = match[1]
    const endRef = match[2]

    if (endRef) {
      // It's a range - extract all cells in range
      const range = parseCellRange(`${startRef}:${endRef}`)
      if (range) {
        const cells = getCellsInRange(
          range.start.row,
          range.start.column,
          range.end.row,
          range.end.column
        )
        cells.forEach(cell => {
          dependencies.add(cellReferenceToString(cell.row, cell.column))
        })
      }
    } else {
      // Single cell reference
      dependencies.add(startRef.toUpperCase())
    }
  }

  return Array.from(dependencies)
}

/**
 * Evaluate a formula
 */
export function evaluateFormula(
  formula: string,
  context: FormulaContext,
  currentRow: number,
  currentCol: number
): string | number | null {
  if (!formula.startsWith('=')) {
    // Not a formula, return as-is
    return formula
  }

  const formulaText = formula.slice(1).trim()
  const upperFormula = formulaText.toUpperCase()

  try {
    // Handle basic arithmetic
    if (/^[A-Z]+\d+[\+\-\*\/][A-Z]+\d+/.test(upperFormula)) {
      return evaluateArithmetic(formulaText, context)
    }

    // Handle functions
    if (upperFormula.startsWith('SUM(')) {
      return evaluateSUM(formulaText, context)
    }
    if (upperFormula.startsWith('AVERAGE(') || upperFormula.startsWith('AVG(')) {
      return evaluateAVERAGE(formulaText, context)
    }
    if (upperFormula.startsWith('COUNT(')) {
      return evaluateCOUNT(formulaText, context)
    }
    if (upperFormula.startsWith('MAX(')) {
      return evaluateMAX(formulaText, context)
    }
    if (upperFormula.startsWith('MIN(')) {
      return evaluateMIN(formulaText, context)
    }
    if (upperFormula.startsWith('IF(')) {
      return evaluateIF(formulaText, context)
    }
    if (upperFormula.startsWith('CONCATENATE(') || upperFormula.startsWith('CONCAT(')) {
      return evaluateCONCATENATE(formulaText, context)
    }
    if (upperFormula.startsWith('NOW()')) {
      return new Date().toISOString()
    }
    if (upperFormula.startsWith('TODAY()')) {
      return new Date().toISOString().split('T')[0]
    }

    // Default: try to evaluate as arithmetic expression
    return evaluateArithmetic(formulaText, context)
  } catch (error) {
    console.error('Formula evaluation error:', error)
    return `#ERROR: ${error instanceof Error ? error.message : 'Invalid formula'}`
  }
}

/**
 * Evaluate arithmetic expressions
 */
function evaluateArithmetic(formula: string, context: FormulaContext): number {
  // Replace cell references with their values
  let expression = formula
  const cellRefRegex = /([A-Z]+\d+)/gi

  expression = expression.replace(cellRefRegex, (match) => {
    const ref = parseCellReference(match)
    if (!ref) return '0'
    const value = context.getCellValue(ref.row, ref.column)
    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
    return String(numValue)
  })

  // Evaluate the expression safely
  try {
    // Remove any non-numeric, non-operator characters for safety
    const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '')
    // eslint-disable-next-line no-eval
    return eval(safeExpression)
  } catch {
    throw new Error('Invalid arithmetic expression')
  }
}

/**
 * SUM(range) - Sum values in range
 */
function evaluateSUM(formula: string, context: FormulaContext): number {
  const range = extractRangeFromFunction(formula, 'SUM')
  if (!range) throw new Error('Invalid SUM range')

  const values = context.getCellRange(range.start.row, range.start.column, range.end.row, range.end.column)
  return values.reduce((sum, val) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0
    return sum + num
  }, 0)
}

/**
 * AVERAGE(range) - Average values in range
 */
function evaluateAVERAGE(formula: string, context: FormulaContext): number {
  const range = extractRangeFromFunction(formula, ['AVERAGE', 'AVG'])
  if (!range) throw new Error('Invalid AVERAGE range')

  const values = context.getCellRange(range.start.row, range.start.column, range.end.row, range.end.column)
  const numbers = values
    .map(val => typeof val === 'number' ? val : parseFloat(String(val)))
    .filter(num => !isNaN(num))

  if (numbers.length === 0) return 0
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
}

/**
 * COUNT(range) - Count non-empty cells
 */
function evaluateCOUNT(formula: string, context: FormulaContext): number {
  const range = extractRangeFromFunction(formula, 'COUNT')
  if (!range) throw new Error('Invalid COUNT range')

  const values = context.getCellRange(range.start.row, range.start.column, range.end.row, range.end.column)
  return values.filter(val => val !== null && val !== '' && val !== undefined).length
}

/**
 * MAX(range) - Maximum value in range
 */
function evaluateMAX(formula: string, context: FormulaContext): number {
  const range = extractRangeFromFunction(formula, 'MAX')
  if (!range) throw new Error('Invalid MAX range')

  const values = context.getCellRange(range.start.row, range.start.column, range.end.row, range.end.column)
  const numbers = values
    .map(val => typeof val === 'number' ? val : parseFloat(String(val)))
    .filter(num => !isNaN(num))

  return numbers.length > 0 ? Math.max(...numbers) : 0
}

/**
 * MIN(range) - Minimum value in range
 */
function evaluateMIN(formula: string, context: FormulaContext): number {
  const range = extractRangeFromFunction(formula, 'MIN')
  if (!range) throw new Error('Invalid MIN range')

  const values = context.getCellRange(range.start.row, range.start.column, range.end.row, range.end.column)
  const numbers = values
    .map(val => typeof val === 'number' ? val : parseFloat(String(val)))
    .filter(num => !isNaN(num))

  return numbers.length > 0 ? Math.min(...numbers) : 0
}

/**
 * IF(condition, trueValue, falseValue) - Conditional
 */
function evaluateIF(formula: string, context: FormulaContext): any {
  const match = formula.match(/^IF\s*\(\s*(.+?)\s*,\s*(.+?)\s*,\s*(.+?)\s*\)$/i)
  if (!match) throw new Error('Invalid IF formula')

  const condition = match[1].trim()
  const trueValue = match[2].trim()
  const falseValue = match[3].trim()

  // Simple condition evaluation (supports basic comparisons)
  const conditionResult = evaluateCondition(condition, context)
  return conditionResult ? evaluateValue(trueValue, context) : evaluateValue(falseValue, context)
}

/**
 * CONCATENATE(...) - Concatenate strings
 */
function evaluateCONCATENATE(formula: string, context: FormulaContext): string {
  const match = formula.match(/^CONCAT(ENATE)?\s*\((.*?)\)$/i)
  if (!match) throw new Error('Invalid CONCATENATE formula')

  const args = match[2].split(',').map(arg => arg.trim())
  return args
    .map(arg => {
      // Check if it's a cell reference
      const ref = parseCellReference(arg)
      if (ref) {
        const value = context.getCellValue(ref.row, ref.column)
        return String(value ?? '')
      }
      // Otherwise treat as string literal (remove quotes if present)
      return arg.replace(/^["']|["']$/g, '')
    })
    .join('')
}

/**
 * Extract range from function call
 */
function extractRangeFromFunction(
  formula: string,
  functionName: string | string[]
): { start: CellReference; end: CellReference } | null {
  const names = Array.isArray(functionName) ? functionName : [functionName]
  const upperFormula = formula.toUpperCase()

  for (const name of names) {
    const regex = new RegExp(`^${name}\\s*\\((.*?)\\)$`, 'i')
    const match = upperFormula.match(regex)
    if (match) {
      const arg = match[1].trim()
      return parseCellRange(arg)
    }
  }

  return null
}

/**
 * Evaluate condition (supports basic comparisons)
 */
function evaluateCondition(condition: string, context: FormulaContext): boolean {
  // Replace cell references
  let expr = condition
  const cellRefRegex = /([A-Z]+\d+)/gi

  expr = expr.replace(cellRefRegex, (match) => {
    const ref = parseCellReference(match)
    if (!ref) return '0'
    const value = context.getCellValue(ref.row, ref.column)
    const numValue = typeof value === 'number' ? value : parseFloat(String(value)) || 0
    return String(numValue)
  })

  // Evaluate comparisons
  if (expr.includes('>=')) {
    const [left, right] = expr.split('>=').map(e => parseFloat(e.trim()) || 0)
    return left >= right
  }
  if (expr.includes('<=')) {
    const [left, right] = expr.split('<=').map(e => parseFloat(e.trim()) || 0)
    return left <= right
  }
  if (expr.includes('<>') || expr.includes('!=')) {
    const [left, right] = expr.split(/[<>!]=?/).map(e => parseFloat(e.trim()) || 0)
    return left !== right
  }
  if (expr.includes('>')) {
    const [left, right] = expr.split('>').map(e => parseFloat(e.trim()) || 0)
    return left > right
  }
  if (expr.includes('<')) {
    const [left, right] = expr.split('<').map(e => parseFloat(e.trim()) || 0)
    return left < right
  }
  if (expr.includes('=')) {
    const [left, right] = expr.split('=').map(e => parseFloat(e.trim()) || 0)
    return left === right
  }

  return Boolean(parseFloat(expr) || 0)
}

/**
 * Evaluate value (could be cell reference, number, or string)
 */
function evaluateValue(value: string, context: FormulaContext): any {
  const trimmed = value.trim()

  // Check if it's a cell reference
  const ref = parseCellReference(trimmed)
  if (ref) {
    return context.getCellValue(ref.row, ref.column)
  }

  // Check if it's a number
  const num = parseFloat(trimmed)
  if (!isNaN(num)) {
    return num
  }

  // Check if it's a string literal (with quotes)
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}


// File parsing utilities for Reporting Studio

import * as XLSX from 'xlsx'
import { parse as csvParse } from 'csv-parse/sync'
import { ColumnDefinition } from '@/types/reporting-studio'
import { REPORTING_STUDIO_CONFIG } from './constants'

export interface ParsedFileData {
  rows: any[]
  columns: ColumnDefinition[]
  rowCount: number
  columnCount: number
  sampleData?: any[]
}

export interface ParseOptions {
  limit?: number // Limit rows for preview/analysis
  detectSchema?: boolean // Auto-detect column types
}

/**
 * Detect data type from sample values
 */
function detectDataType(values: any[]): string {
  if (!values || values.length === 0) return 'string'

  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')

  if (nonNullValues.length === 0) return 'string'

  // Check if all are numbers
  const allNumbers = nonNullValues.every(v => {
    const num = Number(v)
    return !isNaN(num) && isFinite(num)
  })

  if (allNumbers) {
    // Check if integers
    const allIntegers = nonNullValues.every(v => Number.isInteger(Number(v)))
    return allIntegers ? 'integer' : 'decimal'
  }

  // Check if dates
  const datePattern = /^\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4}/
  const allDates = nonNullValues.every(v => {
    if (typeof v === 'string') {
      const parsed = new Date(v)
      return !isNaN(parsed.getTime()) || datePattern.test(v)
    }
    return v instanceof Date
  })

  if (allDates) return 'date'

  // Check if booleans
  const booleanValues = ['true', 'false', 'yes', 'no', '1', '0', 'y', 'n']
  const allBooleans = nonNullValues.every(v => 
    booleanValues.includes(String(v).toLowerCase())
  )

  if (allBooleans) return 'boolean'

  return 'string'
}

/**
 * Generate sample values for a column
 */
function getSampleValues(values: any[], maxSamples: number = 5): any[] {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  return nonNullValues.slice(0, maxSamples)
}

/**
 * Parse CSV file
 */
export async function parseCSV(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedFileData> {
  try {
    const content = buffer.toString('utf-8')
    const records = csvParse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
      relax_column_count: true,
    })

    const rowCount = records.length
    const limitedRows = options.limit ? records.slice(0, options.limit) : records

    // Detect columns
    const columnNames = Object.keys(records[0] || {})
    const columns: ColumnDefinition[] = columnNames.map((colName) => {
      const values = records.map(row => row[colName])
      const sampleValues = getSampleValues(values, 5)

      return {
        columnName: colName,
        dataType: options.detectSchema !== false ? detectDataType(values) : 'string',
        isNullable: values.some(v => v === null || v === undefined || v === ''),
        isPrimaryKey: false,
        description: undefined,
        sampleValues: sampleValues.length > 0 ? sampleValues : undefined,
      }
    })

    return {
      rows: limitedRows,
      columns,
      rowCount,
      columnCount: columnNames.length,
      sampleData: limitedRows.slice(0, 10), // First 10 rows for preview
    }
  } catch (error: any) {
    throw new Error(`Failed to parse CSV: ${error.message}`)
  }
}

/**
 * Parse Excel file (.xlsx, .xls)
 */
export async function parseExcel(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedFileData> {
  try {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false,
    })

    // Use first sheet
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]

    // Convert to JSON
    const records = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
      blankrows: false,
    })

    const rowCount = records.length
    const limitedRows = options.limit ? records.slice(0, options.limit) : records

    // Detect columns
    const columnNames = Object.keys(records[0] || {})
    const columns: ColumnDefinition[] = columnNames.map((colName) => {
      const values = records.map((row: any) => row[colName])
      const sampleValues = getSampleValues(values, 5)

      return {
        columnName: colName,
        dataType: options.detectSchema !== false ? detectDataType(values) : 'string',
        isNullable: values.some(v => v === null || v === undefined || v === ''),
        isPrimaryKey: false,
        description: undefined,
        sampleValues: sampleValues.length > 0 ? sampleValues : undefined,
      }
    })

    return {
      rows: limitedRows,
      columns,
      rowCount,
      columnCount: columnNames.length,
      sampleData: limitedRows.slice(0, 10), // First 10 rows for preview
    }
  } catch (error: any) {
    throw new Error(`Failed to parse Excel: ${error.message}`)
  }
}

/**
 * Parse JSON file
 */
export async function parseJSON(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedFileData> {
  try {
    const content = buffer.toString('utf-8')
    let data: any

    try {
      data = JSON.parse(content)
    } catch (parseError) {
      // Try parsing as JSONL (JSON Lines)
      const lines = content.split('\n').filter(line => line.trim())
      data = lines.map(line => JSON.parse(line))
    }

    // Ensure it's an array
    if (!Array.isArray(data)) {
      // If single object, wrap in array
      if (typeof data === 'object') {
        data = [data]
      } else {
        throw new Error('JSON must be an array of objects or a single object')
      }
    }

    const rowCount = data.length
    const limitedRows = options.limit ? data.slice(0, options.limit) : data

    // Detect columns from first row
    const firstRow = data[0] || {}
    const columnNames = Object.keys(firstRow)

    const columns: ColumnDefinition[] = columnNames.map((colName) => {
      const values = data.map((row: any) => row[colName])
      const sampleValues = getSampleValues(values, 5)

      return {
        columnName: colName,
        dataType: options.detectSchema !== false ? detectDataType(values) : 'string',
        isNullable: values.some(v => v === null || v === undefined),
        isPrimaryKey: false,
        description: undefined,
        sampleValues: sampleValues.length > 0 ? sampleValues : undefined,
      }
    })

    return {
      rows: limitedRows,
      columns,
      rowCount,
      columnCount: columnNames.length,
      sampleData: limitedRows.slice(0, 10), // First 10 rows for preview
    }
  } catch (error: any) {
    throw new Error(`Failed to parse JSON: ${error.message}`)
  }
}

/**
 * Parse Parquet file (placeholder - requires parquetjs library)
 */
export async function parseParquet(
  buffer: Buffer,
  options: ParseOptions = {}
): Promise<ParsedFileData> {
  // TODO: Implement Parquet parsing when parquetjs is installed
  // For now, throw error suggesting installation
  throw new Error(
    'Parquet parsing not yet implemented. Install parquetjs: npm install parquetjs'
  )

  // Future implementation:
  // const reader = await ParquetReader.openBuffer(buffer)
  // const cursor = reader.getCursor()
  // const rows = []
  // while (await cursor.hasNext()) {
  //   rows.push(await cursor.next())
  // }
  // ... detect schema from parquet metadata
}

/**
 * Parse file based on extension
 */
export async function parseFile(
  buffer: Buffer,
  fileName: string,
  options: ParseOptions = {}
): Promise<ParsedFileData> {
  const extension = fileName.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'csv':
      return parseCSV(buffer, options)
    case 'xlsx':
    case 'xls':
      return parseExcel(buffer, options)
    case 'json':
      return parseJSON(buffer, options)
    case 'parquet':
      return parseParquet(buffer, options)
    default:
      throw new Error(`Unsupported file type: ${extension}`)
  }
}

/**
 * Get file metadata without parsing full file (for large files)
 */
export async function getFileMetadata(
  buffer: Buffer,
  fileName: string
): Promise<{ rowCount: number; columnCount: number; columns: string[] }> {
  const extension = fileName.split('.').pop()?.toLowerCase()

  try {
    switch (extension) {
      case 'csv': {
        const content = buffer.toString('utf-8')
        const lines = content.split('\n').filter(line => line.trim())
        const headers = lines[0]?.split(',').map(h => h.trim()) || []
        return {
          rowCount: Math.max(0, lines.length - 1),
          columnCount: headers.length,
          columns: headers,
        }
      }
      case 'xlsx':
      case 'xls': {
        const workbook = XLSX.read(buffer, { type: 'buffer', sheetRows: 1 })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const headers = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })[0] as string[]
        // Full row count requires reading the whole file, so estimate
        const estimatedRows = Math.floor(buffer.length / 100) // Rough estimate
        return {
          rowCount: estimatedRows,
          columnCount: headers?.length || 0,
          columns: headers || [],
        }
      }
      case 'json': {
        const content = buffer.toString('utf-8')
        const data = JSON.parse(content)
        const arrayData = Array.isArray(data) ? data : [data]
        const columns = Object.keys(arrayData[0] || {})
        return {
          rowCount: arrayData.length,
          columnCount: columns.length,
          columns,
        }
      }
      default:
        throw new Error(`Unsupported file type: ${extension}`)
    }
  } catch (error: any) {
    throw new Error(`Failed to get file metadata: ${error.message}`)
  }
}


// Schema detection utilities for Reporting Studio

import { ColumnDefinition } from '@/types/reporting-studio'
import { ParsedFileData } from './file-parser'

export interface DetectedSchema {
  columns: ColumnDefinition[]
  primaryKeys?: string[]
  relationships?: SchemaRelationship[]
  dataQuality?: DataQualityMetrics
}

export interface SchemaRelationship {
  fromColumn: string
  toColumn: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  confidence: number
}

export interface DataQualityMetrics {
  completeness: number // Percentage of non-null values
  uniqueness: number // Percentage of unique values
  validity: number // Percentage of valid values
  consistency: number // Consistency score
}

/**
 * Detect primary keys from data
 */
export function detectPrimaryKeys(
  columns: ColumnDefinition[],
  rows: any[]
): string[] {
  const candidates: { column: string; score: number }[] = []

  for (const column of columns) {
    if (column.isPrimaryKey) {
      candidates.push({ column: column.columnName, score: 1.0 })
      continue
    }

    const values = rows.map(row => row[column.columnName])
    const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''))

    // Check uniqueness
    const uniqueness = uniqueValues.size / rows.length
    if (uniqueness < 0.95) continue // Must be at least 95% unique

    // Check non-null
    const nonNullCount = values.filter(v => v !== null && v !== undefined && v !== '').length
    const completeness = nonNullCount / rows.length
    if (completeness < 0.95) continue // Must be at least 95% non-null

    // Prefer integer/string types
    const typeScore = ['integer', 'string'].includes(column.dataType) ? 1.0 : 0.5

    // Check naming patterns (id, _id, pk, key)
    const namePatterns = ['id', '_id', 'pk', 'key', 'uuid', 'guid']
    const nameScore = namePatterns.some(pattern => 
      column.columnName.toLowerCase().includes(pattern)
    ) ? 1.0 : 0.5

    const score = uniqueness * completeness * typeScore * nameScore
    candidates.push({ column: column.columnName, score })
  }

  // Sort by score and return top candidates
  candidates.sort((a, b) => b.score - a.score)
  return candidates.filter(c => c.score > 0.9).map(c => c.column)
}

/**
 * Detect relationships between columns
 */
export function detectRelationships(
  columns: ColumnDefinition[],
  rows: any[]
): SchemaRelationship[] {
  const relationships: SchemaRelationship[] = []

  for (let i = 0; i < columns.length; i++) {
    for (let j = i + 1; j < columns.length; j++) {
      const col1 = columns[i]
      const col2 = columns[j]

      // Check for foreign key patterns
      const fkPatterns = [
        { from: col1.columnName, to: col2.columnName },
        { from: col2.columnName, to: col1.columnName },
      ]

      for (const pattern of fkPatterns) {
        // Check if values in "from" column appear in "to" column
        const fromValues = new Set(
          rows.map(row => row[pattern.from]).filter(v => v !== null && v !== undefined)
        )
        const toValues = new Set(
          rows.map(row => row[pattern.to]).filter(v => v !== null && v !== undefined)
        )

        // Check overlap
        const intersection = new Set([...fromValues].filter(v => toValues.has(v)))
        const overlap = intersection.size / Math.max(fromValues.size, 1)

        if (overlap > 0.8) {
          relationships.push({
            fromColumn: pattern.from,
            toColumn: pattern.to,
            type: 'many-to-many', // Simplified - would need more analysis
            confidence: overlap,
          })
        }
      }
    }
  }

  return relationships
}

/**
 * Calculate data quality metrics
 */
export function calculateDataQuality(
  columns: ColumnDefinition[],
  rows: any[]
): DataQualityMetrics {
  let totalCompleteness = 0
  let totalUniqueness = 0
  let totalValidity = 0

  for (const column of columns) {
    const values = rows.map(row => row[column.columnName])
    
    // Completeness (non-null percentage)
    const nonNullCount = values.filter(v => v !== null && v !== undefined && v !== '').length
    const completeness = nonNullCount / rows.length
    totalCompleteness += completeness

    // Uniqueness
    const uniqueValues = new Set(values.filter(v => v !== null && v !== undefined && v !== ''))
    const uniqueness = uniqueValues.size / Math.max(nonNullCount, 1)
    totalUniqueness += uniqueness

    // Validity (basic check - can be enhanced)
    let validCount = 0
    for (const value of values) {
      if (value === null || value === undefined || value === '') {
        validCount++
      } else {
        // Basic validation based on type
        if (column.dataType === 'integer' || column.dataType === 'decimal') {
          if (!isNaN(Number(value))) validCount++
        } else if (column.dataType === 'date') {
          if (!isNaN(new Date(value).getTime())) validCount++
        } else {
          validCount++
        }
      }
    }
    const validity = validCount / rows.length
    totalValidity += validity
  }

  return {
    completeness: totalCompleteness / columns.length,
    uniqueness: totalUniqueness / columns.length,
    validity: totalValidity / columns.length,
    consistency: (totalCompleteness + totalUniqueness + totalValidity) / (3 * columns.length),
  }
}

/**
 * Detect schema from parsed file data
 */
export function detectSchema(parsedData: ParsedFileData): DetectedSchema {
  const primaryKeys = detectPrimaryKeys(parsedData.columns, parsedData.rows)
  const relationships = detectRelationships(parsedData.columns, parsedData.rows)
  const dataQuality = calculateDataQuality(parsedData.columns, parsedData.rows)

  // Mark primary keys
  const columns = parsedData.columns.map(col => ({
    ...col,
    isPrimaryKey: primaryKeys.includes(col.columnName),
  }))

  return {
    columns,
    primaryKeys: primaryKeys.length > 0 ? primaryKeys : undefined,
    relationships: relationships.length > 0 ? relationships : undefined,
    dataQuality,
  }
}

/**
 * Suggest column descriptions based on data patterns
 */
export function suggestColumnDescriptions(
  columns: ColumnDefinition[],
  rows: any[]
): Record<string, string> {
  const suggestions: Record<string, string> = {}

  for (const column of columns) {
    const values = rows.map(row => row[column.columnName]).filter(v => v !== null && v !== undefined)
    const sampleValue = values[0]

    // Pattern matching for common fields
    const nameLower = column.columnName.toLowerCase()

    if (nameLower.includes('email')) {
      suggestions[column.columnName] = 'Email address'
    } else if (nameLower.includes('phone')) {
      suggestions[column.columnName] = 'Phone number'
    } else if (nameLower.includes('date') || nameLower.includes('time')) {
      suggestions[column.columnName] = 'Date or timestamp'
    } else if (nameLower.includes('amount') || nameLower.includes('price') || nameLower.includes('cost')) {
      suggestions[column.columnName] = 'Monetary amount'
    } else if (nameLower.includes('name')) {
      suggestions[column.columnName] = 'Name'
    } else if (nameLower.includes('id')) {
      suggestions[column.columnName] = 'Identifier'
    } else if (nameLower.includes('status')) {
      suggestions[column.columnName] = 'Status value'
    } else if (nameLower.includes('description')) {
      suggestions[column.columnName] = 'Description or notes'
    } else {
      suggestions[column.columnName] = `${column.dataType} column`
    }
  }

  return suggestions
}


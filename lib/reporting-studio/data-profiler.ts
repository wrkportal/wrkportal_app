// Data Profiling Engine for Reporting Studio

import { ColumnDefinition } from '@/types/reporting-studio'

export interface DataProfile {
  columnProfiles: ColumnProfile[]
  overallQuality: QualityScore
  rowCount: number
  duplicateRows: number
  completeness: number
  uniqueness: number
  validity: number
  consistency: number
}

export interface ColumnProfile {
  columnName: string
  dataType: string
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  uniquePercentage: number
  duplicateCount: number
  min?: number | string
  max?: number | string
  mean?: number
  median?: number
  mode?: any
  standardDeviation?: number
  distinctValues: any[]
  sampleValues: any[]
  qualityScore: number
  issues: QualityIssue[]
}

export interface QualityScore {
  overall: number
  completeness: number
  uniqueness: number
  validity: number
  consistency: number
  issues: QualityIssue[]
}

export interface QualityIssue {
  type: 'missing' | 'duplicate' | 'invalid' | 'inconsistent' | 'outlier'
  severity: 'low' | 'medium' | 'high'
  column?: string
  message: string
  count?: number
  percentage?: number
}

/**
 * Profile a dataset
 */
export function profileData(
  rows: any[],
  columns: ColumnDefinition[]
): DataProfile {
  if (rows.length === 0) {
    return {
      columnProfiles: [],
      overallQuality: {
        overall: 0,
        completeness: 0,
        uniqueness: 0,
        validity: 0,
        consistency: 0,
        issues: [],
      },
      rowCount: 0,
      duplicateRows: 0,
      completeness: 0,
      uniqueness: 0,
      validity: 0,
      consistency: 0,
    }
  }

  // Profile each column
  const columnProfiles = columns.map((col) => profileColumn(rows, col))

  // Calculate overall metrics
  const duplicateRows = countDuplicateRows(rows)
  const completeness = calculateCompleteness(columnProfiles)
  const uniqueness = calculateUniqueness(columnProfiles)
  const validity = calculateValidity(columnProfiles)
  const consistency = calculateConsistency(columnProfiles)

  // Collect all issues
  const allIssues: QualityIssue[] = []
  columnProfiles.forEach((profile) => {
    allIssues.push(...profile.issues)
  })

  // Add duplicate row issue
  if (duplicateRows > 0) {
    allIssues.push({
      type: 'duplicate',
      severity: duplicateRows / rows.length > 0.1 ? 'high' : 'medium',
      message: `${duplicateRows} duplicate rows found`,
      count: duplicateRows,
      percentage: (duplicateRows / rows.length) * 100,
    })
  }

  // Calculate overall quality score
  const overallQuality: QualityScore = {
    overall: (completeness + uniqueness + validity + consistency) / 4,
    completeness,
    uniqueness,
    validity,
    consistency,
    issues: allIssues.filter((issue) => issue.severity === 'high' || issue.severity === 'medium'),
  }

  return {
    columnProfiles,
    overallQuality,
    rowCount: rows.length,
    duplicateRows,
    completeness,
    uniqueness,
    validity,
    consistency,
  }
}

/**
 * Profile a single column
 */
function profileColumn(rows: any[], column: ColumnDefinition): ColumnProfile {
  const values = rows.map((row) => row[column.columnName])
  const nonNullValues = values.filter((v) => v !== null && v !== undefined && v !== '')
  const nullCount = values.length - nonNullValues.length
  const nullPercentage = (nullCount / values.length) * 100

  // Unique values
  const uniqueValues = new Set(nonNullValues)
  const uniqueCount = uniqueValues.size
  const uniquePercentage = nonNullValues.length > 0 ? (uniqueCount / nonNullValues.length) * 100 : 0
  const duplicateCount = nonNullValues.length - uniqueCount

  // Statistical measures (for numeric columns)
  let min: number | string | undefined
  let max: number | string | undefined
  let mean: number | undefined
  let median: number | undefined
  let mode: any
  let standardDeviation: number | undefined

  if (column.dataType === 'integer' || column.dataType === 'decimal') {
    const numericValues = nonNullValues
      .map((v) => Number(v))
      .filter((v) => !isNaN(v) && isFinite(v))

    if (numericValues.length > 0) {
      numericValues.sort((a, b) => a - b)
      min = numericValues[0]
      max = numericValues[numericValues.length - 1]
      mean = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
      median = numericValues[Math.floor(numericValues.length / 2)]

      // Mode (most frequent value)
      const frequency: Record<number, number> = {}
      numericValues.forEach((val) => {
        frequency[val] = (frequency[val] || 0) + 1
      })
      const maxFreq = Math.max(...Object.values(frequency))
      mode = Object.keys(frequency).find((key) => frequency[Number(key)] === maxFreq)

      // Standard deviation
      const variance = numericValues.reduce((sum, val) => sum + Math.pow(val - mean!, 2), 0) / numericValues.length
      standardDeviation = Math.sqrt(variance)
    }
  } else {
    // For non-numeric, find min/max by string comparison
    if (nonNullValues.length > 0) {
      const sorted = [...nonNullValues].sort()
      min = sorted[0]
      max = sorted[sorted.length - 1]

      // Mode for non-numeric
      const frequency: Record<string, number> = {}
      nonNullValues.forEach((val) => {
        const key = String(val)
        frequency[key] = (frequency[key] || 0) + 1
      })
      const maxFreq = Math.max(...Object.values(frequency))
      mode = Object.keys(frequency).find((key) => frequency[key] === maxFreq)
    }
  }

  // Sample values (first 5 unique values)
  const distinctValues = Array.from(uniqueValues).slice(0, 10)
  const sampleValues = nonNullValues.slice(0, 5)

  // Detect quality issues
  const issues: QualityIssue[] = []

  // Missing values
  if (nullPercentage > 50) {
    issues.push({
      type: 'missing',
      severity: 'high',
      column: column.columnName,
      message: `${nullPercentage.toFixed(1)}% of values are missing`,
      count: nullCount,
      percentage: nullPercentage,
    })
  } else if (nullPercentage > 20) {
    issues.push({
      type: 'missing',
      severity: 'medium',
      column: column.columnName,
      message: `${nullPercentage.toFixed(1)}% of values are missing`,
      count: nullCount,
      percentage: nullPercentage,
    })
  }

  // Duplicate values
  if (uniquePercentage < 50 && nonNullValues.length > 10) {
    issues.push({
      type: 'duplicate',
      severity: uniquePercentage < 20 ? 'high' : 'medium',
      column: column.columnName,
      message: `Only ${uniquePercentage.toFixed(1)}% of values are unique`,
      count: duplicateCount,
      percentage: 100 - uniquePercentage,
    })
  }

  // Invalid values (type mismatches)
  if (column.dataType === 'integer' || column.dataType === 'decimal') {
    const invalidCount = nonNullValues.filter((v) => {
      const num = Number(v)
      return isNaN(num) || !isFinite(num)
    }).length

    if (invalidCount > 0) {
      const invalidPercentage = (invalidCount / nonNullValues.length) * 100
      issues.push({
        type: 'invalid',
        severity: invalidPercentage > 20 ? 'high' : 'medium',
        column: column.columnName,
        message: `${invalidCount} invalid numeric values found`,
        count: invalidCount,
        percentage: invalidPercentage,
      })
    }
  }

  // Outliers (for numeric columns)
  if ((column.dataType === 'integer' || column.dataType === 'decimal') && mean !== undefined && standardDeviation !== undefined) {
    const outliers = nonNullValues.filter((v) => {
      const num = Number(v)
      if (isNaN(num)) return false
      const zScore = Math.abs((num - mean!) / standardDeviation!)
      return zScore > 3 // More than 3 standard deviations
    })

    if (outliers.length > 0 && outliers.length / nonNullValues.length > 0.05) {
      issues.push({
        type: 'outlier',
        severity: 'low',
        column: column.columnName,
        message: `${outliers.length} potential outliers detected`,
        count: outliers.length,
        percentage: (outliers.length / nonNullValues.length) * 100,
      })
    }
  }

  // Calculate quality score for this column
  let qualityScore = 100
  qualityScore -= nullPercentage * 0.5 // Penalize missing values
  qualityScore -= (100 - uniquePercentage) * 0.3 // Penalize duplicates
  issues.forEach((issue) => {
    if (issue.severity === 'high') qualityScore -= 10
    else if (issue.severity === 'medium') qualityScore -= 5
    else qualityScore -= 2
  })
  qualityScore = Math.max(0, Math.min(100, qualityScore))

  return {
    columnName: column.columnName,
    dataType: column.dataType,
    nullCount,
    nullPercentage,
    uniqueCount,
    uniquePercentage,
    duplicateCount,
    min,
    max,
    mean,
    median,
    mode,
    standardDeviation,
    distinctValues,
    sampleValues,
    qualityScore,
    issues,
  }
}

/**
 * Count duplicate rows
 */
function countDuplicateRows(rows: any[]): number {
  const seen = new Set<string>()
  let duplicates = 0

  rows.forEach((row) => {
    const key = JSON.stringify(row)
    if (seen.has(key)) {
      duplicates++
    } else {
      seen.add(key)
    }
  })

  return duplicates
}

/**
 * Calculate overall completeness
 */
function calculateCompleteness(profiles: ColumnProfile[]): number {
  if (profiles.length === 0) return 0
  const avgNullPercentage = profiles.reduce((sum, p) => sum + p.nullPercentage, 0) / profiles.length
  return 100 - avgNullPercentage
}

/**
 * Calculate overall uniqueness
 */
function calculateUniqueness(profiles: ColumnProfile[]): number {
  if (profiles.length === 0) return 0
  const avgUniquePercentage = profiles.reduce((sum, p) => sum + p.uniquePercentage, 0) / profiles.length
  return avgUniquePercentage
}

/**
 * Calculate overall validity
 */
function calculateValidity(profiles: ColumnProfile[]): number {
  if (profiles.length === 0) return 0
  const invalidIssues = profiles.flatMap((p) => p.issues.filter((i) => i.type === 'invalid'))
  if (invalidIssues.length === 0) return 100

  const avgInvalidPercentage = invalidIssues.reduce((sum, i) => sum + (i.percentage || 0), 0) / invalidIssues.length
  return 100 - avgInvalidPercentage
}

/**
 * Calculate overall consistency
 */
function calculateConsistency(profiles: ColumnProfile[]): number {
  if (profiles.length === 0) return 0
  const inconsistentIssues = profiles.flatMap((p) => p.issues.filter((i) => i.type === 'inconsistent'))
  if (inconsistentIssues.length === 0) return 100

  // Consistency is based on lack of inconsistencies
  return Math.max(0, 100 - inconsistentIssues.length * 10)
}

/**
 * Generate data quality report
 */
export function generateQualityReport(profile: DataProfile): {
  summary: string
  recommendations: string[]
  criticalIssues: QualityIssue[]
} {
  const recommendations: string[] = []
  const criticalIssues = profile.overallQuality.issues.filter((i) => i.severity === 'high')

  // Generate summary
  let summary = `Data Quality Score: ${profile.overallQuality.overall.toFixed(1)}/100\n\n`
  summary += `Completeness: ${profile.completeness.toFixed(1)}%\n`
  summary += `Uniqueness: ${profile.uniqueness.toFixed(1)}%\n`
  summary += `Validity: ${profile.validity.toFixed(1)}%\n`
  summary += `Consistency: ${profile.consistency.toFixed(1)}%\n\n`
  summary += `Total Rows: ${profile.rowCount.toLocaleString()}\n`
  summary += `Duplicate Rows: ${profile.duplicateRows.toLocaleString()}\n`
  summary += `Issues Found: ${profile.overallQuality.issues.length}`

  // Generate recommendations
  if (profile.completeness < 80) {
    recommendations.push('High percentage of missing values. Consider data collection improvements or imputation strategies.')
  }

  if (profile.duplicateRows > profile.rowCount * 0.1) {
    recommendations.push('Significant duplicate rows detected. Consider deduplication before analysis.')
  }

  const highNullColumns = profile.columnProfiles.filter((p) => p.nullPercentage > 50)
  if (highNullColumns.length > 0) {
    recommendations.push(`${highNullColumns.length} column(s) have >50% missing values. Review data collection process.`)
  }

  const lowUniquenessColumns = profile.columnProfiles.filter((p) => p.uniquePercentage < 20 && p.nullCount < p.uniqueCount)
  if (lowUniquenessColumns.length > 0) {
    recommendations.push(`${lowUniquenessColumns.length} column(s) have low uniqueness. Consider if these should be categorical fields.`)
  }

  if (criticalIssues.length > 0) {
    recommendations.push(`${criticalIssues.length} critical issue(s) require immediate attention.`)
  }

  return {
    summary,
    recommendations,
    criticalIssues,
  }
}


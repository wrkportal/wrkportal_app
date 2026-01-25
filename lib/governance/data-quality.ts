/**
 * Phase 4.4: Data Quality Monitoring
 * 
 * Track and evaluate data quality metrics
 */

import { prisma } from '@/lib/prisma'
import { QualityMetricType, QualityStatus } from '@prisma/client'

export interface EvaluateQualityParams {
  tenantId: string
  resourceType: string
  resourceId: string
  data: any[] // Sample data for evaluation
  schema?: Record<string, any> // Schema definition
}

/**
 * Evaluate data quality for a resource
 */
export async function evaluateDataQuality(params: EvaluateQualityParams) {
  const { tenantId, resourceType, resourceId, data, schema } = params

  if (!data || data.length === 0) {
    return {
      completeness: { value: 0, status: QualityStatus.FAIL },
      accuracy: { value: 0, status: QualityStatus.FAIL },
      consistency: { value: 0, status: QualityStatus.FAIL },
    }
  }

  const metrics: any[] = []

  // Evaluate completeness (percentage of non-null values)
  const completeness = evaluateCompleteness(data)
  metrics.push({
    tenantId,
    resourceType,
    resourceId,
    metricType: QualityMetricType.COMPLETENESS,
    metricValue: completeness.score,
    threshold: 0.9, // 90% threshold
    status: completeness.score >= 0.9 ? QualityStatus.PASS : completeness.score >= 0.7 ? QualityStatus.WARNING : QualityStatus.FAIL,
    details: completeness.details,
  })

  // Evaluate validity (format, range checks)
  if (schema) {
    const validity = evaluateValidity(data, schema)
    metrics.push({
      tenantId,
      resourceType,
      resourceId,
      metricType: QualityMetricType.VALIDITY,
      metricValue: validity.score,
      threshold: 0.95, // 95% threshold
      status: validity.score >= 0.95 ? QualityStatus.PASS : validity.score >= 0.8 ? QualityStatus.WARNING : QualityStatus.FAIL,
      details: validity.details,
    })
  }

  // Evaluate uniqueness
  const uniqueness = evaluateUniqueness(data)
  metrics.push({
    tenantId,
    resourceType,
    resourceId,
    metricType: QualityMetricType.UNIQUENESS,
    metricValue: uniqueness.score,
    threshold: 1.0, // 100% unique (no duplicates)
    status: uniqueness.score >= 1.0 ? QualityStatus.PASS : uniqueness.score >= 0.95 ? QualityStatus.WARNING : QualityStatus.FAIL,
    details: uniqueness.details,
  })

  // Save metrics
  await prisma.dataQualityMetric.createMany({
    data: metrics,
  })

  return {
    completeness,
    validity: schema ? evaluateValidity(data, schema) : null,
    uniqueness,
  }
}

/**
 * Evaluate completeness
 */
function evaluateCompleteness(data: any[]): { score: number; details: any } {
  if (data.length === 0) {
    return { score: 0, details: { totalRows: 0, nullCount: 0 } }
  }

  const columns = Object.keys(data[0])
  const columnCompleteness: Record<string, number> = {}
  let totalCells = 0
  let nullCells = 0

  for (const column of columns) {
    let columnNulls = 0
    for (const row of data) {
      totalCells++
      if (row[column] === null || row[column] === undefined || row[column] === '') {
        nullCells++
        columnNulls++
      }
    }
    columnCompleteness[column] = 1 - (columnNulls / data.length)
  }

  const overallScore = 1 - (nullCells / totalCells)

  return {
    score: overallScore,
    details: {
      totalRows: data.length,
      totalCells,
      nullCells,
      columnCompleteness,
    },
  }
}

/**
 * Evaluate validity
 */
function evaluateValidity(data: any[], schema: Record<string, any>): { score: number; details: any } {
  if (data.length === 0) {
    return { score: 0, details: { totalRows: 0, invalidCount: 0 } }
  }

  const columns = Object.keys(schema)
  const columnValidity: Record<string, { valid: number; invalid: number }> = {}
  let totalCells = 0
  let invalidCells = 0

  for (const column of columns) {
    const columnSchema = schema[column]
    columnValidity[column] = { valid: 0, invalid: 0 }

    for (const row of data) {
      totalCells++
      const value = row[column]
      
      // Skip null values (handled by completeness)
      if (value === null || value === undefined) {
        continue
      }

      // Type validation
      let isValid = true
      if (columnSchema.type === 'number' && isNaN(Number(value))) {
        isValid = false
      } else if (columnSchema.type === 'date' && isNaN(Date.parse(value))) {
        isValid = false
      } else if (columnSchema.type === 'boolean' && !['true', 'false', true, false].includes(value)) {
        isValid = false
      }

      // Range validation
      if (isValid && columnSchema.min !== undefined && Number(value) < columnSchema.min) {
        isValid = false
      }
      if (isValid && columnSchema.max !== undefined && Number(value) > columnSchema.max) {
        isValid = false
      }

      // Format validation (regex)
      if (isValid && columnSchema.pattern) {
        const regex = new RegExp(columnSchema.pattern)
        if (!regex.test(String(value))) {
          isValid = false
        }
      }

      if (isValid) {
        columnValidity[column].valid++
      } else {
        columnValidity[column].invalid++
        invalidCells++
      }
    }
  }

  const overallScore = 1 - (invalidCells / totalCells)

  return {
    score: overallScore,
    details: {
      totalRows: data.length,
      totalCells,
      invalidCells,
      columnValidity,
    },
  }
}

/**
 * Evaluate uniqueness
 */
function evaluateUniqueness(data: any[]): { score: number; details: any } {
  if (data.length === 0) {
    return { score: 0, details: { totalRows: 0, uniqueRows: 0, duplicateRows: 0 } }
  }

  const seen = new Set<string>()
  let duplicateRows = 0

  for (const row of data) {
    const key = JSON.stringify(row)
    if (seen.has(key)) {
      duplicateRows++
    } else {
      seen.add(key)
    }
  }

  const uniqueRows = data.length - duplicateRows
  const score = uniqueRows / data.length

  return {
    score,
    details: {
      totalRows: data.length,
      uniqueRows,
      duplicateRows,
    },
  }
}

/**
 * Get quality metrics for a resource
 */
export async function getQualityMetrics(
  resourceType: string,
  resourceId: string,
  tenantId: string,
  limit: number = 50
) {
  return prisma.dataQualityMetric.findMany({
    where: {
      tenantId,
      resourceType,
      resourceId,
    },
    orderBy: {
      evaluatedAt: 'desc',
    },
    take: limit,
  })
}

/**
 * Get quality summary for a resource
 */
export async function getQualitySummary(
  resourceType: string,
  resourceId: string,
  tenantId: string
) {
  const metrics = await prisma.dataQualityMetric.findMany({
    where: {
      tenantId,
      resourceType,
      resourceId,
    },
    orderBy: {
      evaluatedAt: 'desc',
    },
    take: 10, // Get latest metrics for each type
  })

  // Group by metric type and get latest
  const latestMetrics: Record<string, any> = {}
  for (const metric of metrics) {
    if (!latestMetrics[metric.metricType] || 
        new Date(metric.evaluatedAt) > new Date(latestMetrics[metric.metricType].evaluatedAt)) {
      latestMetrics[metric.metricType] = metric
    }
  }

  // Calculate overall quality score
  const scores = Object.values(latestMetrics).map((m: any) => m.metricValue)
  const overallScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0

  // Determine overall status
  let hasFail = false
  let hasWarning = false
  for (const metric of Object.values(latestMetrics)) {
    const status = String((metric as any).status)
    if (status === 'FAIL') hasFail = true
    if (status === 'WARNING') hasWarning = true
  }
  const overallStatus: QualityStatus = hasFail 
    ? QualityStatus.FAIL
    : hasWarning 
    ? QualityStatus.WARNING
    : QualityStatus.PASS

  return {
    overallScore,
    overallStatus,
    metrics: latestMetrics,
    lastEvaluated: metrics.length > 0 ? metrics[0].evaluatedAt : null,
  }
}


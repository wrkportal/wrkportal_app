// Advanced Statistical Functions for Reporting Studio
// Comprehensive statistical analysis library

export interface StatisticalResult {
  function: string
  result: number | number[]
  description: string
}

/**
 * Calculate correlation matrix for multiple variables
 */
export function correlationMatrix(data: number[][]): number[][] {
  const n = data.length
  const m = data[0].length
  const matrix: number[][] = []

  for (let i = 0; i < m; i++) {
    matrix[i] = []
    for (let j = 0; j < m; j++) {
      if (i === j) {
        matrix[i][j] = 1
      } else {
        const colI = data.map(row => row[i])
        const colJ = data.map(row => row[j])
        matrix[i][j] = calculateCorrelation(colI, colJ)
      }
    }
  }

  return matrix
}

/**
 * Calculate correlation between two arrays
 */
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have same length')
  }

  const n = x.length
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX
    const diffY = y[i] - meanY
    numerator += diffX * diffY
    sumSqX += diffX * diffX
    sumSqY += diffY * diffY
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)
  return denominator === 0 ? 0 : numerator / denominator
}

/**
 * Calculate z-score normalization
 */
export function zScoreNormalize(data: number[]): number[] {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  )

  if (stdDev === 0) return data.map(() => 0)

  return data.map(val => (val - mean) / stdDev)
}

/**
 * Calculate percentile
 */
export function percentile(data: number[], p: number): number {
  const sorted = [...data].sort((a, b) => a - b)
  const index = (p / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Calculate interquartile range (IQR)
 */
export function interquartileRange(data: number[]): number {
  const q1 = percentile(data, 25)
  const q3 = percentile(data, 75)
  return q3 - q1
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliers(data: number[]): number[] {
  const q1 = percentile(data, 25)
  const q3 = percentile(data, 75)
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  return data.filter(val => val < lowerBound || val > upperBound)
}

/**
 * Calculate covariance
 */
export function covariance(x: number[], y: number[]): number {
  if (x.length !== y.length) {
    throw new Error('Arrays must have same length')
  }

  const n = x.length
  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  return x.reduce((sum, val, i) => sum + (val - meanX) * (y[i] - meanY), 0) / n
}

/**
 * Calculate coefficient of variation
 */
export function coefficientOfVariation(data: number[]): number {
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  )

  return mean === 0 ? 0 : stdDev / mean
}

/**
 * Calculate standard error of the mean
 */
export function standardError(data: number[]): number {
  const stdDev = Math.sqrt(
    data.reduce((sum, val) => {
      const mean = data.reduce((s, v) => s + v, 0) / data.length
      return sum + Math.pow(val - mean, 2)
    }, 0) / data.length
  )

  return stdDev / Math.sqrt(data.length)
}

/**
 * Perform t-test (two-sample)
 */
export function tTest(sample1: number[], sample2: number[]): {
  tStatistic: number
  pValue: number
  degreesOfFreedom: number
} {
  const n1 = sample1.length
  const n2 = sample2.length

  const mean1 = sample1.reduce((sum, val) => sum + val, 0) / n1
  const mean2 = sample2.reduce((sum, val) => sum + val, 0) / n2

  const var1 = sample1.reduce((sum, val) => sum + Math.pow(val - mean1, 2), 0) / (n1 - 1)
  const var2 = sample2.reduce((sum, val) => sum + Math.pow(val - mean2, 2), 0) / (n2 - 1)

  const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
  const standardError = pooledStd * Math.sqrt(1 / n1 + 1 / n2)

  const tStatistic = (mean1 - mean2) / standardError
  const degreesOfFreedom = n1 + n2 - 2

  // Approximate p-value (simplified - in production use proper t-distribution)
  const pValue = 2 * (1 - normalCDF(Math.abs(tStatistic)))

  return {
    tStatistic,
    pValue,
    degreesOfFreedom,
  }
}

/**
 * Normal CDF approximation
 */
function normalCDF(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)))
}

/**
 * Error function approximation
 */
function erf(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * Calculate chi-square test
 */
export function chiSquareTest(observed: number[][], expected?: number[][]): {
  chiSquare: number
  pValue: number
  degreesOfFreedom: number
} {
  const rows = observed.length
  const cols = observed[0].length

  // Calculate expected frequencies if not provided
  if (!expected) {
    const rowSums = observed.map(row => row.reduce((sum, val) => sum + val, 0))
    const colSums = Array(cols).fill(0).map((_, j) =>
      observed.reduce((sum, row) => sum + row[j], 0)
    )
    const total = rowSums.reduce((sum, val) => sum + val, 0)

    expected = observed.map((row, i) =>
      row.map((_, j) => (rowSums[i] * colSums[j]) / total)
    )
  }

  let chiSquare = 0
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (expected[i][j] > 0) {
        chiSquare += Math.pow(observed[i][j] - expected[i][j], 2) / expected[i][j]
      }
    }
  }

  const degreesOfFreedom = (rows - 1) * (cols - 1)
  // Simplified p-value calculation
  const pValue = 1 - normalCDF(Math.sqrt(chiSquare))

  return {
    chiSquare,
    pValue,
    degreesOfFreedom,
  }
}


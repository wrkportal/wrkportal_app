// Statistical Analysis Engine for Auto-Insights
// Provides statistical functions for data analysis

export interface StatisticalMetrics {
  count: number
  mean: number | null
  median: number | null
  mode: number | null
  min: number | null
  max: number | null
  range: number | null
  standardDeviation: number | null
  variance: number | null
  quartiles: {
    q1: number | null
    q2: number | null
    q3: number | null
  }
  skewness: number | null
  kurtosis: number | null
}

export interface DistributionAnalysis {
  isNormal: boolean
  distributionType: 'normal' | 'skewed' | 'uniform' | 'bimodal' | 'unknown'
  outliers: number[]
  outlierIndices: number[]
}

/**
 * Calculate statistical metrics for a numeric array
 */
export function calculateStatisticalMetrics(values: number[]): StatisticalMetrics {
  const numericValues = values.filter((v) => typeof v === 'number' && !isNaN(v))
  
  if (numericValues.length === 0) {
    return {
      count: 0,
      mean: null,
      median: null,
      mode: null,
      min: null,
      max: null,
      range: null,
      standardDeviation: null,
      variance: null,
      quartiles: { q1: null, q2: null, q3: null },
      skewness: null,
      kurtosis: null,
    }
  }

  const sorted = [...numericValues].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((a, b) => a + b, 0)
  const mean = sum / count

  // Median
  const median = count % 2 === 0
    ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
    : sorted[Math.floor(count / 2)]

  // Mode (most frequent value)
  const frequency: Record<number, number> = {}
  sorted.forEach((v) => {
    frequency[v] = (frequency[v] || 0) + 1
  })
  const mode = Object.keys(frequency).reduce((a, b) =>
    frequency[parseFloat(a)] > frequency[parseFloat(b)] ? a : b
  )

  // Min/Max
  const min = sorted[0]
  const max = sorted[count - 1]
  const range = max - min

  // Variance and Standard Deviation
  const variance =
    sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count
  const standardDeviation = Math.sqrt(variance)

  // Quartiles
  const q1 = calculatePercentile(sorted, 25)
  const q2 = median
  const q3 = calculatePercentile(sorted, 75)

  // Skewness
  const skewness = calculateSkewness(sorted, mean, standardDeviation)

  // Kurtosis
  const kurtosis = calculateKurtosis(sorted, mean, standardDeviation)

  return {
    count,
    mean,
    median,
    mode: parseFloat(mode),
    min,
    max,
    range,
    standardDeviation,
    variance,
    quartiles: { q1, q2, q3 },
    skewness,
    kurtosis,
  }
}

/**
 * Calculate percentile
 */
function calculatePercentile(sorted: number[], percentile: number): number {
  const index = (percentile / 100) * (sorted.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Calculate skewness
 */
function calculateSkewness(
  values: number[],
  mean: number,
  stdDev: number
): number | null {
  if (stdDev === 0 || values.length < 3) return null

  const n = values.length
  const skewness =
    (n / ((n - 1) * (n - 2))) *
    values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0)

  return skewness
}

/**
 * Calculate kurtosis
 */
function calculateKurtosis(
  values: number[],
  mean: number,
  stdDev: number
): number | null {
  if (stdDev === 0 || values.length < 4) return null

  const n = values.length
  const kurtosis =
    ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) *
      values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) -
    (3 * (n - 1) * (n - 1)) / ((n - 2) * (n - 3)))

  return kurtosis
}

/**
 * Analyze distribution
 */
export function analyzeDistribution(
  values: number[],
  metrics: StatisticalMetrics
): DistributionAnalysis {
  const numericValues = values.filter((v) => typeof v === 'number' && !isNaN(v))
  
  if (numericValues.length === 0 || !metrics.standardDeviation || metrics.standardDeviation === 0) {
    return {
      isNormal: false,
      distributionType: 'unknown',
      outliers: [],
      outlierIndices: [],
    }
  }

  // Detect outliers using IQR method
  const { q1, q3 } = metrics.quartiles
  if (q1 === null || q3 === null) {
    return {
      isNormal: false,
      distributionType: 'unknown',
      outliers: [],
      outlierIndices: [],
    }
  }

  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers: number[] = []
  const outlierIndices: number[] = []

  numericValues.forEach((val, index) => {
    if (val < lowerBound || val > upperBound) {
      outliers.push(val)
      outlierIndices.push(index)
    }
  })

  // Determine distribution type
  let distributionType: DistributionAnalysis['distributionType'] = 'unknown'
  
  if (metrics.skewness !== null) {
    const absSkewness = Math.abs(metrics.skewness)
    if (absSkewness < 0.5) {
      distributionType = 'normal'
    } else if (absSkewness < 1) {
      distributionType = 'skewed'
    } else {
      distributionType = 'skewed'
    }
  }

  // Check for normal distribution (simplified)
  const isNormal =
    metrics.skewness !== null &&
    Math.abs(metrics.skewness) < 0.5 &&
    metrics.kurtosis !== null &&
    Math.abs(metrics.kurtosis) < 0.5

  return {
    isNormal,
    distributionType,
    outliers,
    outlierIndices,
  }
}

/**
 * Calculate correlation between two numeric arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length === 0) return null

  const n = x.length
  const xMean = x.reduce((a, b) => a + b, 0) / n
  const yMean = y.reduce((a, b) => a + b, 0) / n

  let numerator = 0
  let xSumSq = 0
  let ySumSq = 0

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - xMean
    const yDiff = y[i] - yMean
    numerator += xDiff * yDiff
    xSumSq += xDiff * xDiff
    ySumSq += yDiff * yDiff
  }

  const denominator = Math.sqrt(xSumSq * ySumSq)
  if (denominator === 0) return null

  return numerator / denominator
}


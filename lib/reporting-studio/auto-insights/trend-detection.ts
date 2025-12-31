// Trend Detection Engine for Auto-Insights
// Detects trends, patterns, and changes in time-series data

export interface TrendAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile' | 'unknown'
  trendStrength: number // 0-1, how strong the trend is
  changeRate: number | null // Average change per period
  volatility: number // Standard deviation of changes
  hasSeasonality: boolean
  seasonalityPeriod?: number
  changePoints: ChangePoint[]
  forecast?: {
    nextValue: number
    confidence: number
  }
}

export interface ChangePoint {
  index: number
  timestamp?: string | number
  value: number
  changeType: 'increase' | 'decrease' | 'spike' | 'drop'
  magnitude: number
  significance: number // 0-1
}

/**
 * Analyze trends in time-series data
 */
export function detectTrends(
  values: number[],
  timestamps?: (string | number)[]
): TrendAnalysis {
  if (values.length < 2) {
    return {
      trend: 'unknown',
      trendStrength: 0,
      changeRate: null,
      volatility: 0,
      hasSeasonality: false,
      changePoints: [],
    }
  }

  // Calculate changes
  const changes: number[] = []
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1])
  }

  // Calculate change rate (average change)
  const changeRate = changes.reduce((a, b) => a + b, 0) / changes.length

  // Calculate volatility (std dev of changes)
  const changeMean = changeRate
  const variance =
    changes.reduce((sum, val) => sum + Math.pow(val - changeMean, 2), 0) /
    changes.length
  const volatility = Math.sqrt(variance)

  // Determine trend
  let trend: TrendAnalysis['trend'] = 'stable'
  let trendStrength = 0

  if (Math.abs(changeRate) < volatility * 0.1) {
    trend = 'stable'
    trendStrength = 0.1
  } else if (changeRate > 0) {
    trend = 'increasing'
    trendStrength = Math.min(1, Math.abs(changeRate) / (volatility || 1))
  } else {
    trend = 'decreasing'
    trendStrength = Math.min(1, Math.abs(changeRate) / (volatility || 1))
  }

  // High volatility indicates volatile trend
  if (volatility > Math.abs(changeRate) * 2) {
    trend = 'volatile'
    trendStrength = Math.min(1, volatility / (Math.abs(changeRate) || 1))
  }

  // Detect change points
  const changePoints = detectChangePoints(values, timestamps)

  // Detect seasonality (simplified)
  const seasonality = detectSeasonality(values)

  // Simple forecast (linear extrapolation)
  const forecast = values.length >= 2
    ? {
        nextValue: values[values.length - 1] + changeRate,
        confidence: Math.max(0, 1 - volatility / (Math.abs(changeRate) || 1)),
      }
    : undefined

  return {
    trend,
    trendStrength,
    changeRate,
    volatility,
    hasSeasonality: seasonality.hasSeasonality,
    seasonalityPeriod: seasonality.period,
    changePoints,
    forecast,
  }
}

/**
 * Detect change points in time series
 */
function detectChangePoints(
  values: number[],
  timestamps?: (string | number)[]
): ChangePoint[] {
  const changePoints: ChangePoint[] = []

  if (values.length < 3) return changePoints

  // Calculate rolling mean and std dev
  const windowSize = Math.min(5, Math.floor(values.length / 3))
  const means: number[] = []
  const stdDevs: number[] = []

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize)
    const end = Math.min(values.length, i + windowSize + 1)
    const window = values.slice(start, end)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      window.length
    means.push(mean)
    stdDevs.push(Math.sqrt(variance))
  }

  // Detect significant changes
  for (let i = 1; i < values.length - 1; i++) {
    const prevValue = values[i - 1]
    const currValue = values[i]
    const nextValue = values[i + 1]
    const mean = means[i]
    const stdDev = stdDevs[i]

    if (stdDev === 0) continue

    const change = currValue - prevValue
    const zScore = Math.abs(change) / stdDev

    // Significant change point
    if (zScore > 2) {
      let changeType: ChangePoint['changeType'] = 'increase'
      if (change < 0) {
        changeType = Math.abs(change) > stdDev * 3 ? 'drop' : 'decrease'
      } else {
        changeType = change > stdDev * 3 ? 'spike' : 'increase'
      }

      changePoints.push({
        index: i,
        timestamp: timestamps?.[i],
        value: currValue,
        changeType,
        magnitude: Math.abs(change),
        significance: Math.min(1, zScore / 3),
      })
    }
  }

  return changePoints
}

/**
 * Detect seasonality (simplified)
 */
function detectSeasonality(values: number[]): {
  hasSeasonality: boolean
  period?: number
} {
  if (values.length < 12) {
    return { hasSeasonality: false }
  }

  // Try different periods
  const periods = [3, 4, 6, 7, 12]
  let bestPeriod = 0
  let bestScore = 0

  for (const period of periods) {
    if (values.length < period * 2) continue

    // Calculate autocorrelation
    let score = 0
    for (let i = 0; i < values.length - period; i++) {
      const diff = Math.abs(values[i] - values[i + period])
      score += 1 / (1 + diff)
    }
    score = score / (values.length - period)

    if (score > bestScore) {
      bestScore = score
      bestPeriod = period
    }
  }

  return {
    hasSeasonality: bestScore > 0.6 && bestPeriod > 0,
    period: bestPeriod > 0 ? bestPeriod : undefined,
  }
}

/**
 * Calculate growth rate
 */
export function calculateGrowthRate(
  values: number[],
  periods: number = 1
): number | null {
  if (values.length < periods + 1) return null

  const startValue = values[0]
  const endValue = values[values.length - 1]

  if (startValue === 0) return null

  return ((endValue - startValue) / startValue) * 100
}

/**
 * Detect anomalies in time series
 */
export function detectTimeSeriesAnomalies(
  values: number[],
  timestamps?: (string | number)[]
): Array<{
  index: number
  timestamp?: string | number
  value: number
  anomalyType: 'spike' | 'drop' | 'outlier'
  severity: number // 0-1
}> {
  if (values.length < 3) return []

  const anomalies: Array<{
    index: number
    timestamp?: string | number
    value: number
    anomalyType: 'spike' | 'drop' | 'outlier'
    severity: number
  }> = []

  // Calculate rolling statistics
  const windowSize = Math.min(5, Math.floor(values.length / 3))
  const means: number[] = []
  const stdDevs: number[] = []

  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - windowSize)
    const end = Math.min(values.length, i + windowSize + 1)
    const window = values.slice(start, end)
    const mean = window.reduce((a, b) => a + b, 0) / window.length
    const variance =
      window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      window.length
    means.push(mean)
    stdDevs.push(Math.sqrt(variance))
  }

  // Detect anomalies
  for (let i = 0; i < values.length; i++) {
    const value = values[i]
    const mean = means[i]
    const stdDev = stdDevs[i]

    if (stdDev === 0) continue

    const zScore = Math.abs(value - mean) / stdDev

    if (zScore > 2) {
      const anomalyType: 'spike' | 'drop' | 'outlier' =
        value > mean ? 'spike' : 'drop'
      const severity = Math.min(1, zScore / 4)

      anomalies.push({
        index: i,
        timestamp: timestamps?.[i],
        value,
        anomalyType,
        severity,
      })
    }
  }

  return anomalies
}


// Time Series Forecasting for Predictive Analytics
// Implements various forecasting methods

export interface TimeSeriesData {
  date: Date | string
  value: number
}

export interface ForecastResult {
  date: Date | string
  forecast: number
  lowerBound?: number
  upperBound?: number
  confidence?: number
}

export interface ForecastOptions {
  method: 'linear' | 'exponential' | 'moving_average' | 'seasonal'
  periods: number // Number of future periods to forecast
  confidenceInterval?: number // 0-1, default 0.95
  seasonality?: number // For seasonal methods
}

/**
 * Linear regression forecasting
 */
export function linearForecast(
  data: TimeSeriesData[],
  options: ForecastOptions
): ForecastResult[] {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting')
  }

  // Convert dates to numeric values
  const numericData = data.map((point, index) => ({
    x: index,
    y: point.value,
    date: typeof point.date === 'string' ? new Date(point.date) : point.date,
  }))

  // Calculate linear regression
  const n = numericData.length
  const sumX = numericData.reduce((sum, p) => sum + p.x, 0)
  const sumY = numericData.reduce((sum, p) => sum + p.y, 0)
  const sumXY = numericData.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = numericData.reduce((sum, p) => sum + p.x * p.x, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate R-squared for confidence
  const meanY = sumY / n
  const ssRes = numericData.reduce((sum, p) => {
    const predicted = slope * p.x + intercept
    return sum + Math.pow(p.y - predicted, 2)
  }, 0)
  const ssTot = numericData.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
  const rSquared = 1 - ssRes / ssTot

  // Calculate standard error
  const stdError = Math.sqrt(ssRes / (n - 2))

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const lastDate = numericData[numericData.length - 1].date
  const confidenceInterval = options.confidenceInterval || 0.95
  const tValue = 1.96 // Approximate for 95% confidence (can be improved)

  for (let i = 1; i <= options.periods; i++) {
    const x = n + i - 1
    const forecast = slope * x + intercept
    const margin = tValue * stdError * Math.sqrt(1 + 1 / n + Math.pow(x - sumX / n, 2) / (sumX2 - sumX * sumX / n))

    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    forecasts.push({
      date: forecastDate,
      forecast,
      lowerBound: forecast - margin,
      upperBound: forecast + margin,
      confidence: Math.max(0, Math.min(1, rSquared)),
    })
  }

  return forecasts
}

/**
 * Exponential smoothing forecasting
 */
export function exponentialSmoothingForecast(
  data: TimeSeriesData[],
  options: ForecastOptions
): ForecastResult[] {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting')
  }

  const alpha = 0.3 // Smoothing parameter (can be optimized)
  const values = data.map(d => d.value)

  // Calculate exponential smoothing
  let smoothed = values[0]
  const smoothedValues = [smoothed]

  for (let i = 1; i < values.length; i++) {
    smoothed = alpha * values[i] + (1 - alpha) * smoothed
    smoothedValues.push(smoothed)
  }

  // Calculate trend (if enough data)
  let trend = 0
  if (values.length >= 2) {
    trend = (smoothedValues[smoothedValues.length - 1] - smoothedValues[smoothedValues.length - 2])
  }

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const lastDate = typeof data[data.length - 1].date === 'string'
    ? new Date(data[data.length - 1].date)
    : data[data.length - 1].date

  // Calculate variance for confidence intervals
  const variance = values.reduce((sum, val, idx) => {
    if (idx > 0) {
      return sum + Math.pow(val - smoothedValues[idx], 2)
    }
    return sum
  }, 0) / (values.length - 1)
  const stdDev = Math.sqrt(variance)

  for (let i = 1; i <= options.periods; i++) {
    const forecast = smoothed + trend * i
    const margin = 1.96 * stdDev * Math.sqrt(i) // 95% confidence interval

    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    forecasts.push({
      date: forecastDate,
      forecast,
      lowerBound: forecast - margin,
      upperBound: forecast + margin,
      confidence: Math.max(0.5, 1 - (i * 0.05)), // Confidence decreases with distance
    })
  }

  return forecasts
}

/**
 * Moving average forecasting
 */
export function movingAverageForecast(
  data: TimeSeriesData[],
  options: ForecastOptions
): ForecastResult[] {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for forecasting')
  }

  const windowSize = Math.min(5, Math.floor(data.length / 2))
  const values = data.map(d => d.value)

  // Calculate moving average
  const movingAverages: number[] = []
  for (let i = windowSize - 1; i < values.length; i++) {
    const window = values.slice(i - windowSize + 1, i + 1)
    const avg = window.reduce((sum, val) => sum + val, 0) / window.length
    movingAverages.push(avg)
  }

  // Use last moving average as base forecast
  const lastMA = movingAverages[movingAverages.length - 1]
  const trend = movingAverages.length > 1
    ? movingAverages[movingAverages.length - 1] - movingAverages[movingAverages.length - 2]
    : 0

  // Calculate variance
  const variance = values.reduce((sum, val) => sum + Math.pow(val - lastMA, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const lastDate = typeof data[data.length - 1].date === 'string'
    ? new Date(data[data.length - 1].date)
    : data[data.length - 1].date

  for (let i = 1; i <= options.periods; i++) {
    const forecast = lastMA + trend * i
    const margin = 1.96 * stdDev

    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    forecasts.push({
      date: forecastDate,
      forecast,
      lowerBound: forecast - margin,
      upperBound: forecast + margin,
      confidence: Math.max(0.6, 1 - (i * 0.03)),
    })
  }

  return forecasts
}

/**
 * Seasonal forecasting (simple seasonal decomposition)
 */
export function seasonalForecast(
  data: TimeSeriesData[],
  options: ForecastOptions
): ForecastResult[] {
  if (data.length < (options.seasonality || 2) * 2) {
    throw new Error('Need at least 2 seasonal cycles for seasonal forecasting')
  }

  const seasonality = options.seasonality || 12 // Default to monthly seasonality
  const values = data.map(d => d.value)

  // Calculate seasonal indices
  const seasonalIndices: number[] = []
  for (let i = 0; i < seasonality; i++) {
    const seasonalValues: number[] = []
    for (let j = i; j < values.length; j += seasonality) {
      seasonalValues.push(values[j])
    }
    if (seasonalValues.length > 0) {
      const avg = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length
      seasonalIndices.push(avg)
    } else {
      seasonalIndices.push(1)
    }
  }

  // Normalize seasonal indices
  const avgSeasonal = seasonalIndices.reduce((sum, val) => sum + val, 0) / seasonalIndices.length
  const normalizedIndices = seasonalIndices.map(idx => idx / avgSeasonal)

  // Calculate trend using linear regression
  const n = values.length
  const sumX = values.reduce((sum, _, idx) => sum + idx, 0)
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, idx) => sum + idx * val, 0)
  const sumX2 = values.reduce((sum, _, idx) => sum + idx * idx, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  const baseValue = intercept + slope * (n - 1)

  // Generate forecasts
  const forecasts: ForecastResult[] = []
  const lastDate = typeof data[data.length - 1].date === 'string'
    ? new Date(data[data.length - 1].date)
    : data[data.length - 1].date

  // Calculate variance
  const variance = values.reduce((sum, val) => sum + Math.pow(val - baseValue, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  for (let i = 1; i <= options.periods; i++) {
    const seasonalIndex = normalizedIndices[(n + i - 1) % seasonality]
    const trendValue = baseValue + slope * i
    const forecast = trendValue * seasonalIndex
    const margin = 1.96 * stdDev

    const forecastDate = new Date(lastDate)
    forecastDate.setDate(forecastDate.getDate() + i)

    forecasts.push({
      date: forecastDate,
      forecast,
      lowerBound: forecast - margin,
      upperBound: forecast + margin,
      confidence: Math.max(0.7, 1 - (i * 0.02)),
    })
  }

  return forecasts
}

/**
 * Main forecasting function
 */
export function forecast(
  data: TimeSeriesData[],
  options: ForecastOptions
): ForecastResult[] {
  switch (options.method) {
    case 'linear':
      return linearForecast(data, options)
    case 'exponential':
      return exponentialSmoothingForecast(data, options)
    case 'moving_average':
      return movingAverageForecast(data, options)
    case 'seasonal':
      return seasonalForecast(data, options)
    default:
      return linearForecast(data, options)
  }
}


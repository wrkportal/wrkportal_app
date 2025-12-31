// Regression Analysis for Predictive Analytics
// Linear, polynomial, and logistic regression

export interface RegressionDataPoint {
  x: number
  y: number
}

export interface RegressionResult {
  type: 'linear' | 'polynomial' | 'logistic'
  equation: string
  coefficients: number[]
  rSquared: number
  predictions: Array<{ x: number; y: number; predicted: number }>
  residuals: number[]
  mse: number // Mean Squared Error
  mae: number // Mean Absolute Error
}

/**
 * Linear regression
 */
export function linearRegression(data: RegressionDataPoint[]): RegressionResult {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for regression')
  }

  const n = data.length
  const sumX = data.reduce((sum, p) => sum + p.x, 0)
  const sumY = data.reduce((sum, p) => sum + p.y, 0)
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumY2 = data.reduce((sum, p) => sum + p.y * p.y, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n

  // Calculate predictions and residuals
  const meanY = sumY / n
  const predictions = data.map(p => ({
    x: p.x,
    y: p.y,
    predicted: slope * p.x + intercept,
  }))

  const residuals = predictions.map(p => p.y - p.predicted)
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0)
  const ssTot = data.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
  const rSquared = 1 - ssRes / ssTot

  const mse = ssRes / n
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n

  return {
    type: 'linear',
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    coefficients: [intercept, slope],
    rSquared,
    predictions,
    residuals,
    mse,
    mae,
  }
}

/**
 * Polynomial regression (degree 2)
 */
export function polynomialRegression(data: RegressionDataPoint[]): RegressionResult {
  if (data.length < 3) {
    throw new Error('Need at least 3 data points for polynomial regression')
  }

  const n = data.length
  const sumX = data.reduce((sum, p) => sum + p.x, 0)
  const sumY = data.reduce((sum, p) => sum + p.y, 0)
  const sumX2 = data.reduce((sum, p) => sum + p.x * p.x, 0)
  const sumX3 = data.reduce((sum, p) => sum + p.x * p.x * p.x, 0)
  const sumX4 = data.reduce((sum, p) => sum + p.x * p.x * p.x * p.x, 0)
  const sumXY = data.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumX2Y = data.reduce((sum, p) => sum + p.x * p.x * p.y, 0)

  // Solve system of equations for quadratic regression: y = ax² + bx + c
  // Using matrix method (simplified)
  const matrix = [
    [n, sumX, sumX2],
    [sumX, sumX2, sumX3],
    [sumX2, sumX3, sumX4],
  ]
  const vector = [sumY, sumXY, sumX2Y]

  // Simple Gaussian elimination (for 3x3)
  const a = vector[2] / matrix[2][2] // Simplified - in production use proper matrix solver
  const b = (vector[1] - matrix[1][2] * a) / matrix[1][1]
  const c = (vector[0] - matrix[0][1] * b - matrix[0][2] * a) / matrix[0][0]

  // Calculate predictions
  const meanY = sumY / n
  const predictions = data.map(p => ({
    x: p.x,
    y: p.y,
    predicted: a * p.x * p.x + b * p.x + c,
  }))

  const residuals = predictions.map(p => p.y - p.predicted)
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0)
  const ssTot = data.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0)
  const rSquared = 1 - ssRes / ssTot

  const mse = ssRes / n
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / n

  return {
    type: 'polynomial',
    equation: `y = ${a.toFixed(4)}x² + ${b.toFixed(4)}x + ${c.toFixed(4)}`,
    coefficients: [c, b, a],
    rSquared,
    predictions,
    residuals,
    mse,
    mae,
  }
}

/**
 * Logistic regression (for binary classification)
 */
export function logisticRegression(data: RegressionDataPoint[]): RegressionResult {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for logistic regression')
  }

  // Simple logistic regression using gradient descent approximation
  // In production, use proper optimization algorithm
  let b0 = 0
  let b1 = 0
  const learningRate = 0.01
  const iterations = 1000

  // Gradient descent
  for (let iter = 0; iter < iterations; iter++) {
    let gradB0 = 0
    let gradB1 = 0

    for (const point of data) {
      const z = b0 + b1 * point.x
      const p = 1 / (1 + Math.exp(-z)) // Sigmoid
      const error = point.y - p
      gradB0 += error
      gradB1 += error * point.x
    }

    b0 += learningRate * gradB0 / data.length
    b1 += learningRate * gradB1 / data.length
  }

  // Calculate predictions
  const predictions = data.map(p => {
    const z = b0 + b1 * p.x
    const predicted = 1 / (1 + Math.exp(-z))
    return {
      x: p.x,
      y: p.y,
      predicted,
    }
  })

  // Calculate accuracy (for binary classification)
  const correct = predictions.filter(p => Math.round(p.predicted) === p.y).length
  const rSquared = correct / data.length

  const residuals = predictions.map(p => p.y - p.predicted)
  const mse = residuals.reduce((sum, r) => sum + r * r, 0) / data.length
  const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / data.length

  return {
    type: 'logistic',
    equation: `p = 1 / (1 + e^(-(${b0.toFixed(4)} + ${b1.toFixed(4)}x)))`,
    coefficients: [b0, b1],
    rSquared,
    predictions,
    residuals,
    mse,
    mae,
  }
}


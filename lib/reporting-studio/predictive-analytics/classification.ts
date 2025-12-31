// Classification Models for Predictive Analytics
// K-Nearest Neighbors, Decision Tree, Naive Bayes

export interface ClassificationDataPoint {
  features: number[]
  label: number | string
}

export interface ClassificationResult {
  model: 'knn' | 'decision_tree' | 'naive_bayes'
  accuracy: number
  predictions: Array<{
    features: number[]
    actualLabel: number | string
    predictedLabel: number | string
    confidence: number
  }>
  confusionMatrix?: {
    labels: (number | string)[]
    matrix: number[][]
  }
  featureImportance?: Record<string, number>
}

/**
 * K-Nearest Neighbors Classifier
 */
export function knnClassifier(
  trainingData: ClassificationDataPoint[],
  testData: ClassificationDataPoint[],
  k: number = 3
): ClassificationResult {
  if (trainingData.length < k) {
    throw new Error(`Need at least ${k} training samples for KNN`)
  }

  // Euclidean distance
  const distance = (a: number[], b: number[]): number => {
    if (a.length !== b.length) {
      throw new Error('Feature vectors must have same length')
    }
    return Math.sqrt(
      a.reduce((sum, val, idx) => sum + Math.pow(val - b[idx], 2), 0)
    )
  }

  const predictions = testData.map(testPoint => {
    // Find k nearest neighbors
    const distances = trainingData.map(trainPoint => ({
      distance: distance(testPoint.features, trainPoint.features),
      label: trainPoint.label,
    }))

    distances.sort((a, b) => a.distance - b.distance)
    const kNearest = distances.slice(0, k)

    // Vote for label
    const labelCounts: Record<string, number> = {}
    kNearest.forEach(neighbor => {
      const label = String(neighbor.label)
      labelCounts[label] = (labelCounts[label] || 0) + 1
    })

    const predictedLabel = Object.entries(labelCounts).reduce((a, b) =>
      labelCounts[a[0]] > labelCounts[b[0]] ? a : b
    )[0]

    const confidence = labelCounts[predictedLabel] / k

    return {
      features: testPoint.features,
      actualLabel: testPoint.label,
      predictedLabel,
      confidence,
    }
  })

  const accuracy = predictions.filter(p => String(p.actualLabel) === String(p.predictedLabel)).length / predictions.length

  return {
    model: 'knn',
    accuracy,
    predictions,
  }
}

/**
 * Simple Decision Tree Classifier (ID3-like)
 */
export function decisionTreeClassifier(
  trainingData: ClassificationDataPoint[],
  testData: ClassificationDataPoint[]
): ClassificationResult {
  if (trainingData.length === 0) {
    throw new Error('Need training data for decision tree')
  }

  // Simple decision tree: use first feature for split
  // In production, use proper ID3 or CART algorithm
  const featureIndex = 0
  const featureValues = trainingData.map(d => d.features[featureIndex])
  const threshold = featureValues.reduce((sum, val) => sum + val, 0) / featureValues.length

  // Split data
  const left = trainingData.filter(d => d.features[featureIndex] <= threshold)
  const right = trainingData.filter(d => d.features[featureIndex] > threshold)

  // Get majority label for each split
  const getMajorityLabel = (data: ClassificationDataPoint[]): string => {
    const labelCounts: Record<string, number> = {}
    data.forEach(d => {
      const label = String(d.label)
      labelCounts[label] = (labelCounts[label] || 0) + 1
    })
    return Object.entries(labelCounts).reduce((a, b) =>
      labelCounts[a[0]] > labelCounts[b[0]] ? a : b
    )[0]
  }

  const leftLabel = left.length > 0 ? getMajorityLabel(left) : getMajorityLabel(trainingData)
  const rightLabel = right.length > 0 ? getMajorityLabel(right) : getMajorityLabel(trainingData)

  // Make predictions
  const predictions = testData.map(testPoint => {
    const predictedLabel = testPoint.features[featureIndex] <= threshold ? leftLabel : rightLabel
    const confidence = 0.7 // Simplified confidence

    return {
      features: testPoint.features,
      actualLabel: testPoint.label,
      predictedLabel,
      confidence,
    }
  })

  const accuracy = predictions.filter(p => String(p.actualLabel) === String(p.predictedLabel)).length / predictions.length

  return {
    model: 'decision_tree',
    accuracy,
    predictions,
    featureImportance: {
      [`feature_${featureIndex}`]: 1.0,
    },
  }
}

/**
 * Naive Bayes Classifier
 */
export function naiveBayesClassifier(
  trainingData: ClassificationDataPoint[],
  testData: ClassificationDataPoint[]
): ClassificationResult {
  if (trainingData.length === 0) {
    throw new Error('Need training data for Naive Bayes')
  }

  // Calculate class priors
  const labelCounts: Record<string, number> = {}
  trainingData.forEach(d => {
    const label = String(d.label)
    labelCounts[label] = (labelCounts[label] || 0) + 1
  })

  const total = trainingData.length
  const priors: Record<string, number> = {}
  Object.keys(labelCounts).forEach(label => {
    priors[label] = labelCounts[label] / total
  })

  // Calculate feature means and variances per class
  const classStats: Record<string, { means: number[]; variances: number[] }> = {}
  const numFeatures = trainingData[0].features.length

  Object.keys(priors).forEach(label => {
    const classData = trainingData.filter(d => String(d.label) === label)
    const means: number[] = []
    const variances: number[] = []

    for (let i = 0; i < numFeatures; i++) {
      const values = classData.map(d => d.features[i])
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length

      means.push(mean)
      variances.push(variance || 0.01) // Avoid division by zero
    }

    classStats[label] = { means, variances }
  })

  // Gaussian probability density function
  const gaussianPDF = (x: number, mean: number, variance: number): number => {
    const stdDev = Math.sqrt(variance)
    if (stdDev === 0) return x === mean ? 1 : 0
    return (1 / (stdDev * Math.sqrt(2 * Math.PI))) *
      Math.exp(-0.5 * Math.pow((x - mean) / stdDev, 2))
  }

  // Make predictions
  const predictions = testData.map(testPoint => {
    const scores: Record<string, number> = {}

    Object.keys(priors).forEach(label => {
      let score = Math.log(priors[label]) // Use log to avoid underflow

      for (let i = 0; i < numFeatures; i++) {
        const { means, variances } = classStats[label]
        const prob = gaussianPDF(testPoint.features[i], means[i], variances[i])
        score += Math.log(prob + 1e-10) // Add small value to avoid log(0)
      }

      scores[label] = score
    })

    const predictedLabel = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    )[0]

    // Normalize scores for confidence
    const expScores = Object.values(scores).map(s => Math.exp(s))
    const sumExpScores = expScores.reduce((sum, s) => sum + s, 0)
    const confidence = Math.exp(scores[predictedLabel]) / sumExpScores

    return {
      features: testPoint.features,
      actualLabel: testPoint.label,
      predictedLabel,
      confidence,
    }
  })

  const accuracy = predictions.filter(p => String(p.actualLabel) === String(p.predictedLabel)).length / predictions.length

  return {
    model: 'naive_bayes',
    accuracy,
    predictions,
  }
}


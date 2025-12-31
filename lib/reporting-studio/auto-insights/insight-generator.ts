// Insight Generator for Auto-Insights
// Generates natural language insights from analysis results

import { StatisticalMetrics } from './statistical-analysis'
import { TrendAnalysis } from './trend-detection'

export interface Insight {
  id: string
  type: 'statistical' | 'trend' | 'anomaly' | 'correlation' | 'pattern'
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  confidence: number // 0-1
  actionable: boolean
  recommendation?: string
  data: {
    metric?: string
    value?: number
    change?: number
    period?: string
  }
  metadata?: Record<string, any>
}

/**
 * Generate insights from statistical analysis
 */
export function generateStatisticalInsights(
  columnName: string,
  metrics: StatisticalMetrics,
  distribution: any
): Insight[] {
  const insights: Insight[] = []

  // High variance insight
  if (metrics.variance && metrics.mean && metrics.variance > metrics.mean * 2) {
    insights.push({
      id: `high-variance-${columnName}`,
      type: 'statistical',
      title: `High Variability in ${columnName}`,
      description: `The ${columnName} column shows high variability (variance: ${metrics.variance.toFixed(2)}), indicating inconsistent data patterns.`,
      severity: 'warning',
      confidence: 0.8,
      actionable: true,
      recommendation: 'Consider investigating the causes of high variability or applying data normalization.',
      data: {
        metric: 'variance',
        value: metrics.variance,
      },
    })
  }

  // Outliers insight
  if (distribution.outliers && distribution.outliers.length > 0) {
    insights.push({
      id: `outliers-${columnName}`,
      type: 'anomaly',
      title: `${distribution.outliers.length} Outliers Detected in ${columnName}`,
      description: `Found ${distribution.outliers.length} outlier values that deviate significantly from the norm.`,
      severity: distribution.outliers.length > metrics.count * 0.1 ? 'warning' : 'info',
      confidence: 0.9,
      actionable: true,
      recommendation: 'Review outliers to determine if they are data errors or legitimate extreme values.',
      data: {
        metric: 'outliers',
        value: distribution.outliers.length,
      },
    })
  }

  // Skewness insight
  if (metrics.skewness !== null && Math.abs(metrics.skewness) > 1) {
    const direction = metrics.skewness > 0 ? 'right' : 'left'
    insights.push({
      id: `skewness-${columnName}`,
      type: 'statistical',
      title: `Skewed Distribution in ${columnName}`,
      description: `The ${columnName} data is ${direction}-skewed (skewness: ${metrics.skewness.toFixed(2)}), indicating an asymmetric distribution.`,
      severity: 'info',
      confidence: 0.85,
      actionable: false,
      data: {
        metric: 'skewness',
        value: metrics.skewness,
      },
    })
  }

  return insights
}

/**
 * Generate insights from trend analysis
 */
export function generateTrendInsights(
  columnName: string,
  trend: TrendAnalysis
): Insight[] {
  const insights: Insight[] = []

  // Strong trend insight
  if (trend.trendStrength > 0.7) {
    const direction = trend.trend === 'increasing' ? 'increasing' : 'decreasing'
    insights.push({
      id: `trend-${columnName}`,
      type: 'trend',
      title: `Strong ${direction.charAt(0).toUpperCase() + direction.slice(1)} Trend in ${columnName}`,
      description: `${columnName} shows a strong ${direction} trend with ${(trend.trendStrength * 100).toFixed(0)}% confidence.`,
      severity: trend.trend === 'decreasing' ? 'warning' : 'info',
      confidence: trend.trendStrength,
      actionable: true,
      recommendation:
        trend.trend === 'decreasing'
          ? 'Investigate the cause of the declining trend and consider corrective actions.'
          : 'This positive trend may indicate successful initiatives or natural growth.',
      data: {
        metric: 'trend',
        change: trend.changeRate || undefined,
      },
    })
  }

  // Volatility insight
  if (trend.volatility > Math.abs(trend.changeRate || 0) * 2) {
    insights.push({
      id: `volatility-${columnName}`,
      type: 'trend',
      title: `High Volatility in ${columnName}`,
      description: `${columnName} exhibits high volatility, making it difficult to predict future values.`,
      severity: 'warning',
      confidence: 0.8,
      actionable: true,
      recommendation: 'Consider smoothing techniques or investigate the causes of volatility.',
      data: {
        metric: 'volatility',
        value: trend.volatility,
      },
    })
  }

  // Change points insight
  if (trend.changePoints.length > 0) {
    const significantChanges = trend.changePoints.filter((cp) => cp.significance > 0.7)
    if (significantChanges.length > 0) {
      insights.push({
        id: `change-points-${columnName}`,
        type: 'pattern',
        title: `${significantChanges.length} Significant Change Points Detected`,
        description: `Found ${significantChanges.length} significant change points in ${columnName}, indicating shifts in the data pattern.`,
        severity: 'warning',
        confidence: 0.85,
        actionable: true,
        recommendation: 'Review the periods around change points to identify what caused the shifts.',
        data: {
          metric: 'change_points',
          value: significantChanges.length,
        },
        metadata: {
          changePoints: significantChanges,
        },
      })
    }
  }

  // Seasonality insight
  if (trend.hasSeasonality && trend.seasonalityPeriod) {
    insights.push({
      id: `seasonality-${columnName}`,
      type: 'pattern',
      title: `Seasonal Pattern Detected in ${columnName}`,
      description: `${columnName} shows a seasonal pattern with a period of ${trend.seasonalityPeriod} time units.`,
      severity: 'info',
      confidence: 0.75,
      actionable: true,
      recommendation: 'Use this seasonal pattern to improve forecasting accuracy.',
      data: {
        metric: 'seasonality',
        period: `${trend.seasonalityPeriod} periods`,
      },
    })
  }

  return insights
}

/**
 * Generate correlation insights
 */
export function generateCorrelationInsights(
  column1: string,
  column2: string,
  correlation: number
): Insight[] {
  const insights: Insight[] = []

  if (correlation === null || isNaN(correlation)) return insights

  const absCorrelation = Math.abs(correlation)

  if (absCorrelation > 0.7) {
    const direction = correlation > 0 ? 'positive' : 'negative'
    insights.push({
      id: `correlation-${column1}-${column2}`,
      type: 'correlation',
      title: `Strong ${direction.charAt(0).toUpperCase() + direction.slice(1)} Correlation`,
      description: `${column1} and ${column2} show a strong ${direction} correlation (${correlation.toFixed(2)}).`,
      severity: 'info',
      confidence: absCorrelation,
      actionable: true,
      recommendation:
        direction === 'positive'
          ? 'These variables move together. Changes in one may predict changes in the other.'
          : 'These variables move in opposite directions. Consider the inverse relationship in your analysis.',
      data: {
        metric: 'correlation',
        value: correlation,
      },
    })
  } else if (absCorrelation < 0.3) {
    insights.push({
      id: `no-correlation-${column1}-${column2}`,
      type: 'correlation',
      title: `Weak Correlation Between ${column1} and ${column2}`,
      description: `${column1} and ${column2} show little to no correlation (${correlation.toFixed(2)}).`,
      severity: 'info',
      confidence: 1 - absCorrelation,
      actionable: false,
      data: {
        metric: 'correlation',
        value: correlation,
      },
    })
  }

  return insights
}

/**
 * Generate summary insight
 */
export function generateSummaryInsight(insights: Insight[]): Insight | null {
  if (insights.length === 0) return null

  const criticalCount = insights.filter((i) => i.severity === 'critical').length
  const warningCount = insights.filter((i) => i.severity === 'warning').length

  let severity: Insight['severity'] = 'info'
  if (criticalCount > 0) severity = 'critical'
  else if (warningCount > 0) severity = 'warning'

  return {
    id: 'summary',
    type: 'statistical',
    title: `Analysis Summary: ${insights.length} Insights Found`,
    description: `Found ${insights.length} insights including ${criticalCount} critical, ${warningCount} warnings, and ${insights.length - criticalCount - warningCount} informational insights.`,
    severity,
    confidence: 0.9,
    actionable: true,
    recommendation: 'Review all insights to understand your data better and identify actionable items.',
    data: {
      metric: 'total_insights',
      value: insights.length,
    },
  }
}


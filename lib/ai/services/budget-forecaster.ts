/**
 * AI Budget Forecasting Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { BudgetForecast, ThresholdAlert, CostOptimization } from '@/types/ai'
import { Budget, Project } from '@/types'

interface BudgetForecastContext {
  budget: Budget
  project: Project
  historicalSpend: { date: Date; amount: number }[]
  remainingDays: number
}

export async function forecastBudget(
  context: BudgetForecastContext
): Promise<BudgetForecast> {
  const spendRate = context.budget.spentToDate / Math.max(1, 365 - context.remainingDays)
  const projectedSpend = context.budget.spentToDate + (spendRate * context.remainingDays)
  
  const historicalData = context.historicalSpend
    .map(h => `${h.date.toLocaleDateString()}: $${h.amount.toLocaleString()}`)
    .join('\n')

  const forecastContext = `
Budget Forecasting Analysis:

**Project:** ${context.project.name}
**Progress:** ${context.project.progress}%
**Days Remaining:** ${context.remainingDays}

**Budget Details:**
- Total Budget: $${context.budget.totalBudget.toLocaleString()}
- Spent to Date: $${context.budget.spentToDate.toLocaleString()}
- Committed: $${context.budget.committed.toLocaleString()}
- Current Forecast: $${context.budget.forecast.toLocaleString()}
- Variance: $${context.budget.variance.toLocaleString()}

**Spending Trend:**
- Current Burn Rate: $${spendRate.toFixed(2)}/day
- Simple Projection: $${projectedSpend.toLocaleString()}

${historicalData ? `**Historical Spend:**\n${historicalData}` : ''}

**Budget by Category:**
${context.budget.categories.map(c => 
  `- ${c.name}: Allocated $${c.allocated.toLocaleString()}, Spent $${c.spent.toLocaleString()} (${((c.spent / c.allocated) * 100).toFixed(1)}%)`
).join('\n')}

Provide a detailed budget forecast with confidence intervals, threshold alerts, and optimization recommendations.
`

  const schema = `{
  "forecastedFinalCost": number,
  "variance": number,
  "variancePercentage": number,
  "confidence": number (0-100),
  "confidenceInterval": {
    "low": number,
    "high": number
  },
  "thresholdAlerts": [{
    "threshold": number,
    "predictedDate": "ISO date string",
    "daysUntil": number,
    "severity": "WARNING | CRITICAL"
  }],
  "costOptimizations": [{
    "category": "string",
    "description": "string",
    "potentialSavings": number,
    "effort": "LOW | MEDIUM | HIGH",
    "impact": "string"
  }],
  "assumptions": ["string"]
}`

  const result = await extractStructuredData<any>(forecastContext, schema, PROMPTS.BUDGET_FORECASTER)

  return {
    projectId: context.project.id,
    currentSpend: context.budget.spentToDate,
    forecastedFinalCost: result.forecastedFinalCost,
    variance: result.variance,
    variancePercentage: result.variancePercentage,
    confidence: result.confidence,
    confidenceInterval: result.confidenceInterval,
    thresholdAlerts: result.thresholdAlerts.map((alert: any) => ({
      threshold: alert.threshold,
      predictedDate: new Date(alert.predictedDate),
      daysUntil: alert.daysUntil,
      severity: alert.severity,
    })),
    costOptimizations: result.costOptimizations,
    assumptions: result.assumptions,
    generatedAt: new Date(),
  }
}

/**
 * Calculate burn rate
 */
export function calculateBurnRate(
  historicalSpend: { date: Date; amount: number }[]
): { dailyRate: number; weeklyRate: number; trend: 'INCREASING' | 'STABLE' | 'DECREASING' } {
  if (historicalSpend.length < 2) {
    return { dailyRate: 0, weeklyRate: 0, trend: 'STABLE' }
  }

  const sortedSpend = [...historicalSpend].sort((a, b) => a.date.getTime() - b.date.getTime())
  const totalSpend = sortedSpend[sortedSpend.length - 1].amount - sortedSpend[0].amount
  const daysDiff = Math.max(1, 
    (sortedSpend[sortedSpend.length - 1].date.getTime() - sortedSpend[0].date.getTime()) / (1000 * 60 * 60 * 24)
  )

  const dailyRate = totalSpend / daysDiff
  const weeklyRate = dailyRate * 7

  // Analyze trend
  const midpoint = Math.floor(sortedSpend.length / 2)
  const firstHalfRate = (sortedSpend[midpoint].amount - sortedSpend[0].amount) / midpoint
  const secondHalfRate = (sortedSpend[sortedSpend.length - 1].amount - sortedSpend[midpoint].amount) / 
    (sortedSpend.length - midpoint)

  let trend: 'INCREASING' | 'STABLE' | 'DECREASING'
  if (secondHalfRate > firstHalfRate * 1.1) trend = 'INCREASING'
  else if (secondHalfRate < firstHalfRate * 0.9) trend = 'DECREASING'
  else trend = 'STABLE'

  return { dailyRate, weeklyRate, trend }
}


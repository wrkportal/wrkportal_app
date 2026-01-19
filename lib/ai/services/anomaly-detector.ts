/**
 * Anomaly Detection Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { Anomaly, AnomalyDetectionResult } from '@/types/ai'

interface ProjectMetrics {
  projectId: string
  period: { start: Date; end: Date }
  metrics: {
    dailyTaskCreation: { date: Date; count: number }[]
    dailyTaskCompletion: { date: Date; count: number }[]
    dailyBudgetSpend: { date: Date; amount: number }[]
    dailyTimeLogged: { date: Date; hours: number }[]
    teamVelocity: { week: string; points: number }[]
  }
}

export async function detectAnomalies(data: ProjectMetrics): Promise<AnomalyDetectionResult> {
  // Calculate statistical baselines
  const taskCreationAvg = calculateAverage(data.metrics.dailyTaskCreation.map(d => d.count))
  const taskCreationStd = calculateStdDev(data.metrics.dailyTaskCreation.map(d => d.count))
  
  const taskCompletionAvg = calculateAverage(data.metrics.dailyTaskCompletion.map(d => d.count))
  const taskCompletionStd = calculateStdDev(data.metrics.dailyTaskCompletion.map(d => d.count))
  
  const budgetSpendAvg = calculateAverage(data.metrics.dailyBudgetSpend.map(d => d.amount))
  const budgetSpendStd = calculateStdDev(data.metrics.dailyBudgetSpend.map(d => d.amount))
  
  const timeLoggedAvg = calculateAverage(data.metrics.dailyTimeLogged.map(d => d.hours))
  const timeLoggedStd = calculateStdDev(data.metrics.dailyTimeLogged.map(d => d.hours))

  const metricsContext = `
Anomaly Detection Analysis:

**Project Metrics Summary:**

**Task Creation:**
- Average: ${taskCreationAvg.toFixed(1)} tasks/day
- Std Dev: ${taskCreationStd.toFixed(1)}
- Recent Data: ${data.metrics.dailyTaskCreation.slice(-7).map(d => `${d.date.toLocaleDateString()}: ${d.count}`).join(', ')}

**Task Completion:**
- Average: ${taskCompletionAvg.toFixed(1)} tasks/day
- Std Dev: ${taskCompletionStd.toFixed(1)}
- Recent Data: ${data.metrics.dailyTaskCompletion.slice(-7).map(d => `${d.date.toLocaleDateString()}: ${d.count}`).join(', ')}

**Budget Spend:**
- Average: $${budgetSpendAvg.toFixed(2)}/day
- Std Dev: $${budgetSpendStd.toFixed(2)}
- Recent Data: ${data.metrics.dailyBudgetSpend.slice(-7).map(d => `${d.date.toLocaleDateString()}: $${d.amount}`).join(', ')}

**Time Logged:**
- Average: ${timeLoggedAvg.toFixed(1)} hours/day
- Std Dev: ${timeLoggedStd.toFixed(1)}
- Recent Data: ${data.metrics.dailyTimeLogged.slice(-7).map(d => `${d.date.toLocaleDateString()}: ${d.hours}h`).join(', ')}

**Team Velocity:**
${data.metrics.teamVelocity.map(v => `- Week ${v.week}: ${v.points} points`).join('\n')}

Identify any anomalies, unusual patterns, or concerning trends. Consider:
- Values outside 2 standard deviations
- Sudden spikes or drops
- Trend breaks
- Velocity changes
- Unusual patterns
`

  const schema = `{
  "anomalies": [{
    "type": "TASK | TIME | BUDGET | RESOURCE | VELOCITY | OTHER",
    "severity": "CRITICAL | HIGH | MEDIUM | LOW",
    "title": "string",
    "description": "string",
    "actualValue": number,
    "expectedRange": {"min": number, "max": number},
    "possibleCauses": ["string"],
    "recommendations": ["string"]
  }],
  "summary": "string"
}`

  const result = await extractStructuredData<any>(metricsContext, schema, PROMPTS.ANOMALY_DETECTOR)

  const anomalies: Anomaly[] = result.anomalies.map((anom: any) => ({
    id: `anomaly-${Date.now()}-${Math.random()}`,
    type: anom.type,
    severity: anom.severity,
    title: anom.title,
    description: anom.description,
    dataPoints: [], // Would include actual data points in production
    expectedRange: anom.expectedRange,
    actualValue: anom.actualValue,
    possibleCauses: anom.possibleCauses,
    recommendations: anom.recommendations,
    detectedAt: new Date(),
    status: 'NEW',
  }))

  return {
    projectId: data.projectId,
    period: data.period,
    anomalies,
    summary: result.summary,
    analyzedAt: new Date(),
  }
}

/**
 * Statistical helpers
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, val) => sum + val, 0) / values.length
}

function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0
  const avg = calculateAverage(values)
  const squareDiffs = values.map(val => Math.pow(val - avg, 2))
  return Math.sqrt(calculateAverage(squareDiffs))
}

/**
 * Detect outliers using Z-score
 */
export function detectOutliers(
  values: number[],
  threshold: number = 2
): { index: number; value: number; zScore: number }[] {
  const avg = calculateAverage(values)
  const std = calculateStdDev(values)
  
  if (std === 0) return []

  return values
    .map((value, index) => ({
      index,
      value,
      zScore: Math.abs((value - avg) / std),
    }))
    .filter(item => item.zScore > threshold)
}


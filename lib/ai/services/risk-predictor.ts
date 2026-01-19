/**
 * AI Risk Prediction Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { RiskPrediction, RiskAnalysisResult } from '@/types/ai'
import { Project, Task, Budget } from '@/types'

interface ProjectRiskData {
  project: Project
  tasks: Task[]
  budget: Budget
  teamSize: number
  completedTasksPercentage: number
  daysUntilDeadline: number
}

export async function analyzeProjectRisks(
  data: ProjectRiskData
): Promise<RiskAnalysisResult> {
  const projectSummary = `
Project Analysis for Risk Prediction:

**Project:** ${data.project.name}
**Status:** ${data.project.status}
**Progress:** ${data.project.progress}%
**Budget:** $${data.budget.totalBudget.toLocaleString()} (Spent: $${data.budget.spentToDate.toLocaleString()}, ${((data.budget.spentToDate / data.budget.totalBudget) * 100).toFixed(1)}%)
**Timeline:** ${data.daysUntilDeadline} days until deadline
**Team Size:** ${data.teamSize} members
**Task Completion:** ${data.completedTasksPercentage.toFixed(1)}%

**Task Breakdown:**
- Total Tasks: ${data.tasks.length}
- Completed: ${data.tasks.filter(t => t.status === 'DONE').length}
- In Progress: ${data.tasks.filter(t => t.status === 'IN_PROGRESS').length}
- Blocked: ${data.tasks.filter(t => t.status === 'BLOCKED').length}
- Overdue: ${data.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length}

**Budget Health:**
- Total Budget: $${data.budget.totalBudget.toLocaleString()}
- Spent to Date: $${data.budget.spentToDate.toLocaleString()}
- Committed: $${data.budget.committed.toLocaleString()}
- Forecast: $${data.budget.forecast.toLocaleString()}
- Variance: $${data.budget.variance.toLocaleString()}

Analyze this project data and identify all significant risks.
`

  const schema = `{
  "overallRiskLevel": "CRITICAL | HIGH | MEDIUM | LOW",
  "riskScore": number (0-100),
  "predictions": [{
    "riskType": "BUDGET | SCHEDULE | RESOURCE | QUALITY | SCOPE | TECHNICAL",
    "title": "string",
    "description": "string",
    "severity": "CRITICAL | HIGH | MEDIUM | LOW",
    "probability": number (1-5),
    "impact": number (1-5),
    "indicators": ["string"],
    "rootCauses": ["string"],
    "recommendations": ["string"],
    "confidence": number (0-100)
  }],
  "summary": "string"
}`

  const result = await extractStructuredData<any>(projectSummary, schema, PROMPTS.RISK_ANALYZER)

  const predictions: RiskPrediction[] = result.predictions.map((pred: any) => ({
    id: `risk-${Date.now()}-${Math.random()}`,
    projectId: data.project.id,
    riskType: pred.riskType,
    title: pred.title,
    description: pred.description,
    severity: pred.severity,
    probability: pred.probability,
    impact: pred.impact,
    riskScore: pred.probability * pred.impact,
    indicators: pred.indicators,
    rootCauses: pred.rootCauses,
    recommendations: pred.recommendations,
    predictedBy: 'AI',
    confidence: pred.confidence,
    detectedAt: new Date(),
    status: 'NEW',
  }))

  return {
    projectId: data.project.id,
    overallRiskLevel: result.overallRiskLevel,
    riskScore: result.riskScore,
    predictions,
    summary: result.summary,
    analyzedAt: new Date(),
  }
}

/**
 * Analyze specific risk area
 */
export async function analyzeBudgetRisk(budget: Budget, projectProgress: number): Promise<string> {
  const budgetContext = `
Budget Analysis Request:

Total Budget: $${budget.totalBudget}
Spent to Date: $${budget.spentToDate}
Project Progress: ${projectProgress}%
Burn Rate: ${((budget.spentToDate / budget.totalBudget) * 100).toFixed(1)}%

Expected Spend at this Progress: ${projectProgress}%
Actual Spend: ${((budget.spentToDate / budget.totalBudget) * 100).toFixed(1)}%
Variance: ${(((budget.spentToDate / budget.totalBudget) * 100) - projectProgress).toFixed(1)}%

Provide a detailed risk assessment of the budget situation.
`

  const response = await extractStructuredData<{ analysis: string; riskLevel: string }>(
    budgetContext,
    '{"analysis": "string", "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL"}',
    PROMPTS.RISK_ANALYZER
  )

  return response.analysis
}


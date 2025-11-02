/**
 * AI Status Report Generator
 */

import { extractStructuredData } from '../openai-service'
import { PROMPTS } from '../prompts'
import { AIStatusReport } from '@/types/ai'
import { Project, Task, Risk, Issue } from '@/types'

interface StatusReportData {
  project: Project
  tasks: Task[]
  risks: Risk[]
  issues: Issue[]
  periodStart: Date
  periodEnd: Date
  budgetData?: {
    totalBudget: number
    spentToDate: number
    variance: number
  }
}

export async function generateStatusReport(
  data: StatusReportData
): Promise<AIStatusReport> {
  const completedTasks = data.tasks.filter(t => 
    t.status === 'DONE' && 
    t.completedAt && 
    new Date(t.completedAt) >= data.periodStart &&
    new Date(t.completedAt) <= data.periodEnd
  )

  const activeTasks = data.tasks.filter(t => 
    t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW'
  )

  const blockedTasks = data.tasks.filter(t => t.status === 'BLOCKED')

  const openIssues = data.issues.filter(i => i.status === 'OPEN' || i.status === 'IN_PROGRESS')
  const criticalIssues = openIssues.filter(i => i.severity === 'CRITICAL')

  const activeRisks = data.risks.filter(r => r.status !== 'CLOSED')
  const highRisks = activeRisks.filter(r => r.level === 'CRITICAL' || r.level === 'HIGH')

  const reportContext = `
Generate a status report for the following project:

**Project:** ${data.project.name}
**Report Period:** ${data.periodStart.toLocaleDateString()} - ${data.periodEnd.toLocaleDateString()}
**Current Status:** ${data.project.status}
**Overall Progress:** ${data.project.progress}%
**RAG Status:** ${data.project.ragStatus}

**Accomplishments This Period:**
${completedTasks.length > 0 ? completedTasks.map(t => `- ${t.title}`).join('\n') : '- No tasks completed this period'}

**Active Work:**
- ${activeTasks.length} tasks in progress
- ${blockedTasks.length} tasks blocked

**Issues:**
- Total Open Issues: ${openIssues.length}
- Critical Issues: ${criticalIssues.length}
${criticalIssues.length > 0 ? criticalIssues.map(i => `  - ${i.title}`).join('\n') : ''}

**Risks:**
- Total Active Risks: ${activeRisks.length}
- High/Critical Risks: ${highRisks.length}
${highRisks.length > 0 ? highRisks.map(r => `  - ${r.title} (${r.level})`).join('\n') : ''}

${data.budgetData ? `**Budget:**
- Total Budget: $${data.budgetData.totalBudget.toLocaleString()}
- Spent to Date: $${data.budgetData.spentToDate.toLocaleString()}
- Variance: $${data.budgetData.variance.toLocaleString()}` : ''}

**Upcoming Milestones:**
${data.tasks
  .filter(t => t.dueDate && new Date(t.dueDate) > data.periodEnd)
  .slice(0, 5)
  .map(t => `- ${t.title} (Due: ${new Date(t.dueDate!).toLocaleDateString()})`)
  .join('\n')}

Generate a comprehensive executive status report.
`

  const schema = `{
  "executiveSummary": "string (2-3 sentences)",
  "overallHealth": "GREEN | AMBER | RED",
  "healthJustification": "string",
  "accomplishments": ["string"],
  "issues": ["string"],
  "upcomingMilestones": [{"name": "string", "date": "ISO date", "status": "string"}],
  "budgetStatus": {
    "summary": "string",
    "variance": number,
    "concerns": ["string"]
  },
  "resourceStatus": {
    "summary": "string",
    "concerns": ["string"]
  },
  "risks": [{"title": "string", "severity": "string", "mitigation": "string"}],
  "decisionsNeeded": ["string"],
  "nextSteps": ["string"]
}`

  const result = await extractStructuredData<any>(reportContext, schema, PROMPTS.STATUS_REPORT)

  return {
    id: `report-${Date.now()}`,
    projectId: data.project.id,
    reportPeriod: {
      startDate: data.periodStart,
      endDate: data.periodEnd,
    },
    executiveSummary: result.executiveSummary,
    overallHealth: result.overallHealth,
    healthJustification: result.healthJustification,
    accomplishments: result.accomplishments,
    issues: result.issues,
    upcomingMilestones: result.upcomingMilestones.map((m: any) => ({
      name: m.name,
      date: new Date(m.date),
      status: m.status,
    })),
    budgetStatus: result.budgetStatus,
    resourceStatus: result.resourceStatus,
    risks: result.risks,
    decisionsNeeded: result.decisionsNeeded,
    nextSteps: result.nextSteps,
    generatedAt: new Date(),
    generatedBy: 'AI',
  }
}

/**
 * Generate quick executive summary
 */
export async function generateExecutiveSummary(project: Project): Promise<string> {
  const prompt = `Generate a 2-3 sentence executive summary for this project:
  
Project: ${project.name}
Status: ${project.status}
Progress: ${project.progress}%
RAG: ${project.ragStatus}

Be concise and highlight the most important information for executives.`

  const result = await extractStructuredData<{ summary: string }>(
    prompt,
    '{"summary": "string"}',
    PROMPTS.STATUS_REPORT
  )

  return result.summary
}


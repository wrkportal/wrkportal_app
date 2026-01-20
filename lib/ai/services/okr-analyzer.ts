/**
 * Smart OKR Analysis Service
 */

import { extractStructuredData } from '../ai-service'
import { PROMPTS } from '../prompts'
import { OKRAnalysis } from '@/types/ai'
import { Goal, KeyResult } from '@/types'

interface OKRContext {
  goal: Goal
  keyResults: KeyResult[]
  daysRemaining: number
  linkedTasksCompleted: number
  linkedTasksTotal: number
}

export async function analyzeOKR(context: OKRContext): Promise<OKRAnalysis> {
  const krProgress = context.keyResults.map(kr => {
    const progress = ((kr.currentValue - kr.startValue) / (kr.targetValue - kr.startValue)) * 100
    return {
      title: kr.title,
      progress: Math.min(100, Math.max(0, progress)),
      confidence: kr.confidence,
      currentValue: kr.currentValue,
      targetValue: kr.targetValue,
      weight: kr.weight,
    }
  })

  const weightedProgress = krProgress.reduce((sum, kr) => sum + (kr.progress * kr.weight / 100), 0)
  const avgConfidence = krProgress.reduce((sum, kr) => sum + kr.confidence, 0) / krProgress.length

  const taskCompletionRate = context.linkedTasksTotal > 0 
    ? (context.linkedTasksCompleted / context.linkedTasksTotal) * 100 
    : 0

  const okrContext = `
OKR Progress Analysis:

**Objective:** ${context.goal.title}
**Description:** ${context.goal.description || 'N/A'}
**Time Period:** ${context.goal.quarter}
**Days Remaining:** ${context.daysRemaining}
**Status:** ${context.goal.status}

**Key Results:**
${krProgress.map((kr, idx) => `
${idx + 1}. ${kr.title}
   - Current: ${kr.currentValue} / Target: ${kr.targetValue}
   - Progress: ${kr.progress.toFixed(1)}%
   - Confidence: ${kr.confidence}/10
   - Weight: ${kr.weight}%
`).join('\n')}

**Overall Progress:** ${weightedProgress.toFixed(1)}%
**Average Confidence:** ${avgConfidence.toFixed(1)}/10

**Linked Tasks:**
- Completed: ${context.linkedTasksCompleted} / ${context.linkedTasksTotal}
- Completion Rate: ${taskCompletionRate.toFixed(1)}%

Analyze this OKR's trajectory and provide recommendations.
`

  const schema = `{
  "currentProgress": number,
  "predictedProgress": number,
  "onTrack": boolean,
  "riskLevel": "LOW | MEDIUM | HIGH",
  "confidenceScore": number (0-100),
  "velocity": number,
  "recommendations": ["string"],
  "blockers": ["string"],
  "dependencies": ["string"]
}`

  const result = await extractStructuredData<any>(okrContext, schema, PROMPTS.OKR_ANALYZER)

  return {
    goalId: context.goal.id,
    currentProgress: result.currentProgress,
    predictedProgress: result.predictedProgress,
    onTrack: result.onTrack,
    riskLevel: result.riskLevel,
    confidenceScore: result.confidenceScore,
    velocity: result.velocity,
    recommendations: result.recommendations,
    blockers: result.blockers,
    dependencies: result.dependencies,
    analyzedAt: new Date(),
  }
}

/**
 * Calculate OKR health score
 */
export function calculateOKRHealth(
  progress: number,
  confidence: number,
  daysRemaining: number,
  totalDays: number
): { score: number; status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' } {
  const expectedProgress = ((totalDays - daysRemaining) / totalDays) * 100
  const progressDelta = progress - expectedProgress
  
  // Health score calculation
  let score = 50 // Base score
  
  // Progress factor (up to 40 points)
  if (progressDelta >= 10) score += 40
  else if (progressDelta >= 0) score += 30
  else if (progressDelta >= -10) score += 20
  else score += 10
  
  // Confidence factor (up to 30 points)
  score += (confidence / 10) * 30
  
  // Time pressure factor
  const timeRemaining = daysRemaining / totalDays
  if (timeRemaining < 0.2 && progress < 80) score -= 20
  else if (timeRemaining < 0.5 && progress < 50) score -= 10

  score = Math.max(0, Math.min(100, score))

  let status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  if (score >= 70) status = 'ON_TRACK'
  else if (score >= 40) status = 'AT_RISK'
  else status = 'OFF_TRACK'

  return { score, status }
}

/**
 * Analyze OKR Progress (wrapper for analyzeOKR with simplified interface)
 */
export async function analyzeOKRProgress(data: {
  objectiveName: string
  objectiveDescription?: string
  keyResults: string
  currentMetrics?: string
  timeframe?: string
}): Promise<any> {
  // This is a simplified version - in production, you'd want to fetch full OKR data
  const mockGoal: Goal = {
    id: 'temp',
    title: data.objectiveName,
    description: data.objectiveDescription || '',
    quarter: data.timeframe || 'Q1',
    year: new Date().getFullYear(),
    status: 'ACTIVE',
    tenantId: '',
    ownerId: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    startDate: new Date(),
    endDate: new Date(),
  }

  const mockKeyResults: KeyResult[] = data.keyResults.split('\n').map((kr, idx) => ({
    id: `kr-${idx}`,
    goalId: 'temp',
    title: kr.split(':')[0] || `KR ${idx + 1}`,
    description: '',
    startValue: 0,
    currentValue: 0,
    targetValue: 100,
    unit: '',
    weight: 100,
    confidence: 5,
    status: 'IN_PROGRESS',
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

  return analyzeOKR({
    goal: mockGoal,
    keyResults: mockKeyResults,
    daysRemaining: 90,
    linkedTasksCompleted: 0,
    linkedTasksTotal: 0,
  })
}

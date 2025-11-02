import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOKRsForAI } from '@/lib/ai/data-access'
import { analyzeOKRProgress } from '@/lib/ai/services/okr-analyzer'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      goalId, 
      objectiveName, 
      objectiveDescription, 
      keyResults, 
      currentMetrics, 
      timeframe 
    } = body

    let analysis

    // If goalId provided, fetch real OKR data
    if (goalId) {
      const goals = await getOKRsForAI(session.user.tenantId, goalId)

      if (!goals || goals.length === 0) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
      }

      const goal = goals[0]

      // Format key results with current progress
      const keyResultsList = goal.keyResults.map(kr => {
        const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / 
                         (Number(kr.targetValue) - Number(kr.startValue))) * 100
        return `${kr.title}: ${kr.currentValue}${kr.unit} / ${kr.targetValue}${kr.unit} (${progress.toFixed(0)}% complete, Confidence: ${kr.confidence}/10)`
      }).join('\n')

      // Compile check-in history
      const recentUpdates = goal.keyResults.flatMap(kr => 
        kr.checkIns.map(ci => 
          `${kr.title}: ${ci.value}${kr.unit} (Confidence: ${ci.confidence}/10) - ${ci.narrative || 'No notes'}`
        )
      ).slice(0, 10).join('\n')

      analysis = await analyzeOKRProgress({
        objectiveName: goal.title,
        objectiveDescription: goal.description || '',
        keyResults: keyResultsList,
        currentMetrics: recentUpdates,
        timeframe: `Q${goal.quarter} ${goal.year}`,
      })
    } else {
      // Use manually provided data
      if (!objectiveName || !keyResults) {
        return NextResponse.json(
          { error: 'Objective name and key results are required' },
          { status: 400 }
        )
      }

      analysis = await analyzeOKRProgress({
        objectiveName,
        objectiveDescription: objectiveDescription || '',
        keyResults,
        currentMetrics: currentMetrics || '',
        timeframe: timeframe || '',
      })
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('OKR analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze OKRs' },
      { status: 500 }
    )
  }
}


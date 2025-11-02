/**
 * AI OKR Analysis API
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeOKR } from '@/lib/ai/services/okr-analyzer'

export async function POST(request: NextRequest) {
  try {
    const { goalId } = await request.json()

    if (!goalId) {
      return NextResponse.json(
        { error: 'Goal ID is required' },
        { status: 400 }
      )
    }

    // In production, fetch from database
    // For now, using mock data
    const mockGoal = {
      id: goalId,
      tenantId: 'tenant-1',
      level: 'TEAM' as const,
      title: 'Increase Customer Satisfaction',
      description: 'Improve NPS score and reduce churn',
      ownerId: 'user-1',
      quarter: 'Q1 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      status: 'ACTIVE' as const,
      keyResults: [],
      alignedGoals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const mockKeyResults = [
      {
        id: 'kr-1',
        goalId,
        title: 'Increase NPS from 40 to 60',
        type: 'NUMBER' as const,
        startValue: 40,
        targetValue: 60,
        currentValue: 52,
        weight: 50,
        confidence: 7,
        linkedInitiatives: [],
        checkIns: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'kr-2',
        goalId,
        title: 'Reduce churn from 8% to 5%',
        type: 'PERCENTAGE' as const,
        startValue: 8,
        targetValue: 5,
        currentValue: 6.5,
        unit: '%',
        weight: 50,
        confidence: 6,
        linkedInitiatives: [],
        checkIns: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const daysRemaining = Math.ceil(
      (mockGoal.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const analysis = await analyzeOKR({
      goal: mockGoal,
      keyResults: mockKeyResults,
      daysRemaining,
      linkedTasksCompleted: 12,
      linkedTasksTotal: 20,
    })

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('OKR analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze OKR' },
      { status: 500 }
    )
  }
}


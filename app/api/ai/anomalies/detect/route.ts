/**
 * AI Anomaly Detection API
 */

import { NextRequest, NextResponse } from 'next/server'
import { detectAnomalies } from '@/lib/ai/services/anomaly-detector'

export async function POST(request: NextRequest) {
  try {
    const { projectId, periodDays = 30 } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Generate mock metrics data - in production, fetch from database
    const endDate = new Date()
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

    const mockMetrics = {
      projectId,
      period: { start: startDate, end: endDate },
      metrics: {
        dailyTaskCreation: Array.from({ length: periodDays }, (_, i) => ({
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 10) + 2,
        })),
        dailyTaskCompletion: Array.from({ length: periodDays }, (_, i) => ({
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          count: Math.floor(Math.random() * 8) + 1,
        })),
        dailyBudgetSpend: Array.from({ length: periodDays }, (_, i) => ({
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          amount: Math.random() * 1000 + 500,
        })),
        dailyTimeLogged: Array.from({ length: periodDays }, (_, i) => ({
          date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
          hours: Math.random() * 40 + 20,
        })),
        teamVelocity: Array.from({ length: Math.floor(periodDays / 7) }, (_, i) => ({
          week: `W${i + 1}`,
          points: Math.floor(Math.random() * 30) + 20,
        })),
      },
    }

    const result = await detectAnomalies(mockMetrics)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}


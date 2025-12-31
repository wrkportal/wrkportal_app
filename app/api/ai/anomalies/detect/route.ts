/**
 * AI Anomaly Detection API
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { detectAnomalies } from '@/lib/ai/services/anomaly-detector'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, periodDays = 30 } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Verify project exists and user has access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        tenantId: session.user.tenantId,
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const endDate = new Date()
    const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)

    // Fetch real task data from database
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        createdAt: true,
        status: true,
        dueDate: true,
        storyPoints: true,
      },
    })

    // Aggregate daily task creation
    const dailyTaskCreationMap = new Map<string, number>()
    tasks.forEach(task => {
      const dateKey = task.createdAt.toISOString().split('T')[0]
      dailyTaskCreationMap.set(dateKey, (dailyTaskCreationMap.get(dateKey) || 0) + 1)
    })

    // Aggregate daily task completion
    const dailyTaskCompletionMap = new Map<string, number>()
    tasks.filter(t => t.status === 'DONE').forEach(task => {
      const dateKey = task.createdAt.toISOString().split('T')[0]
      dailyTaskCompletionMap.set(dateKey, (dailyTaskCompletionMap.get(dateKey) || 0) + 1)
    })

    // Build metrics arrays
    const dailyTaskCreation = Array.from({ length: periodDays }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      return {
        date,
        count: dailyTaskCreationMap.get(dateKey) || 0,
      }
    })

    const dailyTaskCompletion = Array.from({ length: periodDays }, (_, i) => {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateKey = date.toISOString().split('T')[0]
      return {
        date,
        count: dailyTaskCompletionMap.get(dateKey) || 0,
      }
    })

    // TODO: Fetch actual budget spend and time logged from Timesheet/Budget tables when available
    const dailyBudgetSpend = Array.from({ length: periodDays }, (_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
      amount: 0, // Placeholder until budget tracking is implemented
    }))

    const dailyTimeLogged = Array.from({ length: periodDays }, (_, i) => ({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
      hours: 0, // Placeholder until timesheet tracking is implemented
    }))

    // Calculate team velocity (story points per week)
    const weeks = Math.floor(periodDays / 7)
    const teamVelocity = Array.from({ length: weeks }, (_, i) => {
      const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
      const weekTasks = tasks.filter(t => 
        t.status === 'DONE' && 
        t.createdAt >= weekStart && 
        t.createdAt < weekEnd
      )
      const points = weekTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0)
      return {
        week: `W${i + 1}`,
        points,
      }
    })

    const metrics = {
      projectId,
      period: { start: startDate, end: endDate },
      metrics: {
        dailyTaskCreation,
        dailyTaskCompletion,
        dailyBudgetSpend,
        dailyTimeLogged,
        teamVelocity,
      },
    }

    const result = await detectAnomalies(metrics)

    return NextResponse.json({ result })
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}


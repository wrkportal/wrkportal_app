/**
 * AI Risk Analysis API
 */

import { NextRequest, NextResponse } from 'next/server'
import { analyzeProjectRisks } from '@/lib/ai/services/risk-predictor'

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Fetch project data (in production, get from database)
    const projectResponse = await fetch(`${request.nextUrl.origin}/api/projects/${projectId}`)
    const projectData = await projectResponse.json()

    const tasksResponse = await fetch(`${request.nextUrl.origin}/api/tasks?projectId=${projectId}`)
    const tasksData = await tasksResponse.json()

    // Calculate days until deadline
    const daysUntilDeadline = Math.ceil(
      (new Date(projectData.project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    const completedTasks = tasksData.tasks.filter((t: any) => t.status === 'DONE').length
    const completedPercentage = (completedTasks / tasksData.tasks.length) * 100

    const riskAnalysis = await analyzeProjectRisks({
      project: projectData.project,
      tasks: tasksData.tasks,
      budget: projectData.project.budget,
      teamSize: projectData.project.teamMembers?.length || 0,
      completedTasksPercentage: completedPercentage,
      daysUntilDeadline,
    })

    return NextResponse.json({ analysis: riskAnalysis })
  } catch (error) {
    console.error('Risk analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project risks' },
      { status: 500 }
    )
  }
}


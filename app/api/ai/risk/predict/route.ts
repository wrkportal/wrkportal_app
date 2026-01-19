import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getRisksForAI, getProjectDataForAI } from '@/lib/ai/data-access'
import { generateRiskPrediction } from '@/lib/ai/services'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, projectName, projectDescription, budget, duration, teamSize, complexity } = body

    let risks

    // If projectId provided, fetch real data
    if (projectId) {
      const projectData = await getRisksForAI(projectId, session.user.tenantId)
      
      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Use real project data for AI analysis
      risks = await generateRiskPrediction({
        projectName: projectData.name,
        projectDescription: projectData.description || '',
        budget: typeof projectData.budget === 'object' && projectData.budget !== null 
          ? (projectData.budget as any).totalBudget 
          : undefined,
        duration: `${projectData.startDate.toLocaleDateString()} to ${projectData.endDate.toLocaleDateString()}`,
        teamSize: projectData.teamMembers.length,
        complexity: complexity || 'medium',
        existingRisks: projectData.risks,
        currentIssues: projectData.issues,
        projectProgress: projectData.progress,
        projectStatus: projectData.status,
        taskData: projectData.tasks,
      })
    } else {
      // Use manually provided data
      if (!projectName || !projectDescription) {
        return NextResponse.json(
          { error: 'Project name and description are required' },
          { status: 400 }
        )
      }

      risks = await generateRiskPrediction({
        projectName,
        projectDescription,
        budget,
        duration,
        teamSize,
        complexity: complexity || 'medium',
      })
    }

    return NextResponse.json({ risks })
  } catch (error) {
    console.error('Risk prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to predict risks' },
      { status: 500 }
    )
  }
}


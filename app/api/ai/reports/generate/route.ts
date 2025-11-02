import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProjectHistoryForReport } from '@/lib/ai/data-access'
import { generateStatusReport } from '@/lib/ai/services/status-report-generator'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      projectId, 
      projectName, 
      reportingPeriod, 
      accomplishments, 
      challenges, 
      upcomingWork, 
      teamMembers 
    } = body

    let report

    // If projectId provided, fetch real data
    if (projectId) {
      // Calculate period dates (e.g., last 7 days, last month)
      const periodEnd = new Date()
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - 30) // Default to last 30 days

      const projectData = await getProjectHistoryForReport(
        projectId,
        session.user.tenantId,
        periodStart,
        periodEnd
      )

      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Compile accomplishments from completed tasks
      const completedTasks = projectData.tasks.filter(t => t.status === 'DONE')
      const accomplishmentsList = completedTasks.map(t => 
        `Completed: ${t.title}${t.assignee ? ` (${t.assignee.name || t.assignee.firstName + ' ' + t.assignee.lastName})` : ''}`
      )

      // Identify challenges from issues and risks
      const challengesList = [
        ...projectData.issues.map(i => `Issue: ${i.title}`),
        ...projectData.risks.filter(r => r.status === 'ACTIVE').map(r => `Risk: ${r.title}`),
      ]

      // Upcoming work from pending tasks
      const upcomingTasks = projectData.tasks.filter(t => 
        t.status === 'TODO' || t.status === 'IN_PROGRESS'
      )
      const upcomingList = upcomingTasks.slice(0, 10).map(t => t.title)

      report = await generateStatusReport({
        projectName: projectData.name,
        reportingPeriod: `${periodStart.toLocaleDateString()} - ${periodEnd.toLocaleDateString()}`,
        accomplishments: accomplishmentsList.join('\n'),
        challenges: challengesList.join('\n'),
        upcomingWork: upcomingList.join('\n'),
        teamMembers: projectData.manager ? `PM: ${projectData.manager.name || projectData.manager.firstName + ' ' + projectData.manager.lastName}` : '',
        projectProgress: projectData.progress,
        budgetData: projectData.budget,
      })
    } else {
      // Use manually provided data
      if (!projectName) {
        return NextResponse.json(
          { error: 'Project name is required' },
          { status: 400 }
        )
      }

      report = await generateStatusReport({
        projectName,
        reportingPeriod: reportingPeriod || 'Current Period',
        accomplishments: accomplishments || '',
        challenges: challenges || '',
        upcomingWork: upcomingWork || '',
        teamMembers: teamMembers || '',
      })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Status report generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate status report' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProjectActivityForAI } from '@/lib/ai/data-access'
import { detectAnomalies } from '@/lib/ai/services/anomaly-detector'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, projectName, dataType, recentActivity, baselineMetrics, timeRange } = body

    let result

    // If projectId provided, fetch real project activity
    if (projectId) {
      const daysBack = 30 // Default lookback period
      const projectData = await getProjectActivityForAI(
        projectId,
        session.user.tenantId,
        daysBack
      )

      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      // Compile recent activity
      const taskActivity = `Tasks: ${projectData.tasks.length} updated in last ${daysBack} days\n` +
        `- Completed: ${projectData.tasks.filter(t => t.status === 'DONE').length}\n` +
        `- In Progress: ${projectData.tasks.filter(t => t.status === 'IN_PROGRESS').length}\n` +
        `- Blocked: ${projectData.tasks.filter(t => t.status === 'BLOCKED').length}`

      // Calculate daily time entries
      const timesheetsByDate = new Map<string, number>()
      projectData.timesheets.forEach(ts => {
        const date = ts.date.toISOString().split('T')[0]
        const current = timesheetsByDate.get(date) || 0
        timesheetsByDate.set(date, current + Number(ts.hours))
      })

      const avgDailyHours = timesheetsByDate.size > 0
        ? Array.from(timesheetsByDate.values()).reduce((a, b) => a + b, 0) / timesheetsByDate.size
        : 0

      const recentData = `${taskActivity}\n\n` +
        `Time tracking: ${projectData.timesheets.length} entries, avg ${avgDailyHours.toFixed(1)} hours/day\n` +
        `New risks: ${projectData.risks.length}\n` +
        `New issues: ${projectData.issues.length}\n` +
        `Change requests: ${projectData.changeRequests.length}`

      // Budget baseline
      const budget = projectData.budget as any
      const baseline = budget ? 
        `Normal weekly budget usage: $${(Number(budget.totalBudget) / 52).toFixed(0)}\n` +
        `Current spend rate: $${(Number(budget.spentToDate) / Math.max(1, projectData.tasks.filter(t => t.completedAt).length)).toFixed(0)} per completed task` :
        ''

      result = await detectAnomalies({
        projectName: projectData.name,
        dataType: dataType || 'general',
        recentActivity: recentData,
        baselineMetrics: baseline,
        timeRange: `Last ${daysBack} days`,
      })
    } else {
      // Use manually provided data
      if (!recentActivity) {
        return NextResponse.json(
          { error: 'Recent activity data is required' },
          { status: 400 }
        )
      }

      result = await detectAnomalies({
        projectName: projectName || 'Project',
        dataType: dataType || 'general',
        recentActivity,
        baselineMetrics: baselineMetrics || '',
        timeRange: timeRange || '',
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Anomaly detection error:', error)
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    )
  }
}


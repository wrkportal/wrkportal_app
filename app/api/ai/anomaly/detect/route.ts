import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getProjectActivityForAI } from '@/lib/ai/data-access'
import { detectAnomalies } from '@/lib/ai/services/anomaly-detector'
import { Prisma } from '@prisma/client'

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
      type TaskWithSelectedFields = Prisma.TaskGetPayload<{
        select: {
          id: true
          title: true
          status: true
          priority: true
          completedAt: true
          createdAt: true
          updatedAt: true
        }
      }>
      
      const taskActivity = `Tasks: ${projectData.tasks.length} updated in last ${daysBack} days\n` +
        `- Completed: ${projectData.tasks.filter((t: TaskWithSelectedFields) => t.status === 'DONE').length}\n` +
        `- In Progress: ${projectData.tasks.filter((t: TaskWithSelectedFields) => t.status === 'IN_PROGRESS').length}\n` +
        `- Blocked: ${projectData.tasks.filter((t: TaskWithSelectedFields) => t.status === 'BLOCKED').length}`

      // Calculate daily time entries
      type TimesheetWithSelectedFields = Prisma.TimesheetGetPayload<{
        select: {
          date: true
          hours: true
          userId: true
        }
      }>
      
      const timesheetsByDate = new Map<string, number>()
      projectData.timesheets.forEach((ts: TimesheetWithSelectedFields) => {
        const date = ts.date.toISOString().split('T')[0]
        const current = timesheetsByDate.get(date) || 0
        timesheetsByDate.set(date, current + Number(ts.hours))
      })

      const avgDailyHours = timesheetsByDate.size > 0
        ? Array.from(timesheetsByDate.values()).reduce((a: number, b: number) => a + b, 0) / timesheetsByDate.size
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
        `Current spend rate: $${(Number(budget.spentToDate) / Math.max(1, projectData.tasks.filter((t: TaskWithSelectedFields) => t.completedAt).length)).toFixed(0)} per completed task` :
        ''

      // Transform data to match ProjectMetrics interface
      const endDate = new Date()
      const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000)
      
      // Create daily metrics arrays from the task data
      const dailyTaskCreation = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        const count = projectData.tasks.filter((t: TaskWithSelectedFields) => 
          t.createdAt.toISOString().split('T')[0] === dateKey
        ).length
        return { date, count }
      })

      const dailyTaskCompletion = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        const count = projectData.tasks.filter((t: TaskWithSelectedFields) => 
          t.status === 'DONE' && t.completedAt && t.completedAt.toISOString().split('T')[0] === dateKey
        ).length
        return { date, count }
      })

      const dailyTimeLogged = Array.from({ length: daysBack }, (_, i) => {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        const dateKey = date.toISOString().split('T')[0]
        const hours = projectData.timesheets
          .filter((ts: TimesheetWithSelectedFields) => ts.date.toISOString().split('T')[0] === dateKey)
          .reduce((sum: number, ts: TimesheetWithSelectedFields) => sum + Number(ts.hours), 0)
        return { date, hours }
      })

      const weeks = Math.floor(daysBack / 7)
      const teamVelocity = Array.from({ length: weeks }, (_, i) => {
        const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        const weekTasks = projectData.tasks.filter((t: TaskWithSelectedFields) => 
          t.status === 'DONE' && 
          t.completedAt && 
          t.completedAt >= weekStart && 
          t.completedAt < weekEnd
        )
        // Use storyPoints if available, otherwise count tasks
        const points = weekTasks.reduce((sum: number, t: TaskWithSelectedFields) => sum + ((t as any).storyPoints || 1), 0)
        return {
          week: `W${i + 1}`,
          points,
        }
      })

      result = await detectAnomalies({
        projectId: projectId,
        period: { start: startDate, end: endDate },
        metrics: {
          dailyTaskCreation,
          dailyTaskCompletion,
          dailyBudgetSpend: Array.from({ length: daysBack }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            amount: 0, // Placeholder until budget tracking is implemented
          })),
          dailyTimeLogged,
          teamVelocity,
        },
      })
    } else {
      // Use manually provided data - create placeholder metrics
      if (!recentActivity) {
        return NextResponse.json(
          { error: 'Recent activity data is required' },
          { status: 400 }
        )
      }

      // Create placeholder metrics for manual data
      const endDate = new Date()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default 30 days
      
      result = await detectAnomalies({
        projectId: projectId || 'manual-project',
        period: { start: startDate, end: endDate },
        metrics: {
          dailyTaskCreation: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            count: 0,
          })),
          dailyTaskCompletion: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            count: 0,
          })),
          dailyBudgetSpend: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            amount: 0,
          })),
          dailyTimeLogged: Array.from({ length: 30 }, (_, i) => ({
            date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000),
            hours: 0,
          })),
          teamVelocity: Array.from({ length: 4 }, (_, i) => ({
            week: `W${i + 1}`,
            points: 0,
          })),
        },
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


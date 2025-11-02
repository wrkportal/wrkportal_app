import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getBudgetDataForAI } from '@/lib/ai/data-access'
import { forecastBudget } from '@/lib/ai/services/budget-forecaster'

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
      totalBudget, 
      currentSpend, 
      spendHistory, 
      projectDuration, 
      completionPercentage 
    } = body

    let forecast

    // If projectId provided, fetch real data
    if (projectId) {
      const projectData = await getBudgetDataForAI(projectId, session.user.tenantId)

      if (!projectData) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }

      const budget = projectData.budget as any
      const totalBudgetValue = budget?.totalBudget || budget?.total || 0
      const spentValue = budget?.spentToDate || budget?.spent || 0

      // Calculate spend history from timesheets
      const monthlySpend = new Map<string, number>()
      projectData.timesheets.forEach(ts => {
        const month = ts.date.toISOString().slice(0, 7) // YYYY-MM
        const current = monthlySpend.get(month) || 0
        monthlySpend.set(month, current + Number(ts.hours) * 100) // Assuming $100/hour rate
      })

      const spendHistoryStr = Array.from(monthlySpend.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => `${month}: $${amount.toFixed(0)}`)
        .join('\n')

      forecast = await forecastBudget({
        projectName: projectData.name,
        totalBudget: totalBudgetValue,
        currentSpend: spentValue,
        spendHistory: spendHistoryStr,
        projectDuration: `${projectData.startDate.toLocaleDateString()} to ${projectData.endDate.toLocaleDateString()}`,
        completionPercentage: projectData.progress,
        changeRequests: projectData.changeRequests,
      })
    } else {
      // Use manually provided data
      if (!totalBudget || !currentSpend) {
        return NextResponse.json(
          { error: 'Total budget and current spend are required' },
          { status: 400 }
        )
      }

      forecast = await forecastBudget({
        projectName: projectName || 'Project',
        totalBudget,
        currentSpend,
        spendHistory: spendHistory || '',
        projectDuration: projectDuration || '',
        completionPercentage: completionPercentage || 0,
      })
    }

    return NextResponse.json({ forecast })
  } catch (error) {
    console.error('Budget forecast error:', error)
    return NextResponse.json(
      { error: 'Failed to generate budget forecast' },
      { status: 500 }
    )
  }
}

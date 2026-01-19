import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/expenses - Get expenses data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'MTD'
    const projectId = searchParams.get('projectId')
    const costType = searchParams.get('costType')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Calculate date range
    let startDate: Date
    let endDate: Date = new Date()
    
    const today = new Date()
    if (period === 'MTD') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    } else if (period === 'QTD') {
      const quarter = Math.floor(today.getMonth() / 3)
      startDate = new Date(today.getFullYear(), quarter * 3, 1)
    } else if (period === 'YTD') {
      startDate = new Date(today.getFullYear(), 0, 1)
    } else if (fromDate && toDate) {
      startDate = new Date(fromDate)
      endDate = new Date(toDate)
    } else {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    }

    const where: any = {
      tenantId,
      approvedAt: { not: null },
      date: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (projectId) where.projectId = projectId
    if (costType) where.costType = costType

    // Get expenses
    const expenses = await prisma.costActual.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        budget: {
          select: { id: true, name: true },
        },
        category: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Expenses by category/type
    const expensesByType = expenses.reduce((acc: any, exp) => {
      const type = exp.costType || 'OTHER'
      if (!acc[type]) {
        acc[type] = { type, amount: 0, count: 0 }
      }
      acc[type].amount += Number(exp.amount)
      acc[type].count += 1
      return acc
    }, {})

    // Expenses by project
    const expensesByProject = expenses.reduce((acc: any, exp) => {
      const projectName = exp.project?.name || 'No Project'
      if (!acc[projectName]) {
        acc[projectName] = {
          projectId: exp.project?.id,
          projectName,
          amount: 0,
          count: 0,
        }
      }
      acc[projectName].amount += Number(exp.amount)
      acc[projectName].count += 1
      return acc
    }, {})

    // Expenses by month
    const expensesByMonth = expenses.reduce((acc: any, exp) => {
      const month = new Date(exp.date).toISOString().substring(0, 7)
      if (!acc[month]) {
        acc[month] = { month, amount: 0, count: 0 }
      }
      acc[month].amount += Number(exp.amount)
      acc[month].count += 1
      return acc
    }, {})

    // Compare with previous period
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)
    previousStartDate.setMonth(previousStartDate.getMonth() - 1)
    previousEndDate.setDate(0)

    const previousExpenses = await prisma.costActual.findMany({
      where: {
        tenantId,
        approvedAt: { not: null },
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        ...(projectId ? { projectId } : {}),
        ...(costType ? { costType } : {}),
      },
    })

    const previousTotal = previousExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const expenseGrowth = previousTotal > 0 
      ? ((totalExpenses - previousTotal) / previousTotal) * 100 
      : 0

    return NextResponse.json({
      totalExpenses,
      expenseGrowth,
      expenseCount: expenses.length,
      expensesByType: Object.values(expensesByType),
      expensesByProject: Object.values(expensesByProject),
      expensesByMonth: Object.values(expensesByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      expenses: expenses.map(exp => ({
        id: exp.id,
        name: exp.name,
        description: exp.description,
        amount: Number(exp.amount),
        currency: exp.currency,
        costType: exp.costType,
        date: exp.date,
        project: exp.project,
        budget: exp.budget,
        category: exp.category,
        createdBy: exp.createdBy,
      })),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period,
      },
    })
  } catch (error: any) {
    console.error('Error fetching expenses data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses data', details: error.message },
      { status: 500 }
    )
  }
}


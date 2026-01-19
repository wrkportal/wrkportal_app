import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/profitability - Get profitability analysis
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

    // Get revenue
    const revenueWhere: any = {
      tenantId,
      status: 'PAID',
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    }
    if (projectId) revenueWhere.projectId = projectId

    const invoices = await prisma.invoice.findMany({
      where: revenueWhere,
      include: {
        payments: true,
        project: {
          select: { id: true, name: true },
        },
      },
    })

    const totalRevenue = invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    // Get expenses
    const expensesWhere: any = {
      tenantId,
      approvedAt: { not: null },
      date: {
        gte: startDate,
        lte: endDate,
      },
    }
    if (projectId) expensesWhere.projectId = projectId

    const expenses = await prisma.costActual.findMany({
      where: expensesWhere,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    })

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)

    // Calculate profitability metrics
    const grossProfit = totalRevenue - totalExpenses
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
    const netProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    // Profitability by project
    const projectProfitability: any = {}
    
    invoices.forEach(inv => {
      const projectName = inv.project?.name || 'No Project'
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      const revenue = paid || Number(inv.totalAmount)
      
      if (!projectProfitability[projectName]) {
        projectProfitability[projectName] = {
          projectId: inv.project?.id,
          projectName,
          revenue: 0,
          expenses: 0,
        }
      }
      projectProfitability[projectName].revenue += revenue
    })

    expenses.forEach(exp => {
      const projectName = exp.project?.name || 'No Project'
      if (!projectProfitability[projectName]) {
        projectProfitability[projectName] = {
          projectId: exp.project?.id,
          projectName,
          revenue: 0,
          expenses: 0,
        }
      }
      projectProfitability[projectName].expenses += Number(exp.amount)
    })

    const profitabilityByProject = Object.values(projectProfitability).map((proj: any) => ({
      ...proj,
      profit: proj.revenue - proj.expenses,
      margin: proj.revenue > 0 ? ((proj.revenue - proj.expenses) / proj.revenue) * 100 : 0,
    }))

    // Monthly profitability trend
    const monthlyData: any = {}
    const allDates = new Set<string>()
    
    invoices.forEach(inv => {
      const month = new Date(inv.invoiceDate).toISOString().substring(0, 7)
      allDates.add(month)
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, expenses: 0 }
      }
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      monthlyData[month].revenue += paid || Number(inv.totalAmount)
    })

    expenses.forEach(exp => {
      const month = new Date(exp.date).toISOString().substring(0, 7)
      allDates.add(month)
      if (!monthlyData[month]) {
        monthlyData[month] = { month, revenue: 0, expenses: 0 }
      }
      monthlyData[month].expenses += Number(exp.amount)
    })

    const monthlyTrend = Array.from(allDates)
      .sort()
      .map(month => ({
        month,
        revenue: monthlyData[month]?.revenue || 0,
        expenses: monthlyData[month]?.expenses || 0,
        profit: (monthlyData[month]?.revenue || 0) - (monthlyData[month]?.expenses || 0),
        margin: (monthlyData[month]?.revenue || 0) > 0
          ? (((monthlyData[month]?.revenue || 0) - (monthlyData[month]?.expenses || 0)) / (monthlyData[month]?.revenue || 1)) * 100
          : 0,
      }))

    // Compare with previous period
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)
    previousStartDate.setMonth(previousStartDate.getMonth() - 1)
    previousEndDate.setDate(0)

    const previousInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        invoiceDate: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        ...(projectId ? { projectId } : {}),
      },
      include: { payments: true },
    })

    const previousExpenses = await prisma.costActual.findMany({
      where: {
        tenantId,
        approvedAt: { not: null },
        date: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        ...(projectId ? { projectId } : {}),
      },
    })

    const previousRevenue = previousInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    const previousTotalExpenses = previousExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const previousProfit = previousRevenue - previousTotalExpenses

    const profitGrowth = previousProfit !== 0 
      ? ((grossProfit - previousProfit) / Math.abs(previousProfit)) * 100 
      : 0

    return NextResponse.json({
      totalRevenue,
      totalExpenses,
      grossProfit,
      grossMargin,
      netProfitMargin,
      profitGrowth,
      profitabilityByProject,
      monthlyTrend,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period,
      },
    })
  } catch (error: any) {
    console.error('Error fetching profitability data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profitability data', details: error.message },
      { status: 500 }
    )
  }
}


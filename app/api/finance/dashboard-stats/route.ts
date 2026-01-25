import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/finance/dashboard-stats - Get finance dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'MTD' // MTD, QTD, YTD, Custom
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    // Calculate date range based on period
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

    // Get revenue (from paid invoices)
    type InvoiceWithSelected = Prisma.InvoiceGetPayload<{
      select: {
        totalAmount: true
        paid: true
      }
    }>

    const paidInvoices: InvoiceWithSelected[] = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
        invoiceDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        totalAmount: true,
        paid: true,
      },
    })
    const revenue = paidInvoices.reduce((sum: number, inv: InvoiceWithSelected) => sum + Number(inv.paid || inv.totalAmount), 0)

    // Get expenses (from approved cost actuals)
    type CostActualWithSelected = Prisma.CostActualGetPayload<{
      select: {
        amount: true
      }
    }>

    const expenses: CostActualWithSelected[] = await prisma.costActual.findMany({
      where: {
        project: {
          tenantId,
        },
        approvedAt: { not: null },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
      },
    })
    const totalExpenses = expenses.reduce((sum: number, exp: CostActualWithSelected) => sum + Number(exp.amount), 0)

    // Get cash on hand (total paid - total expenses)
    const allPaidInvoices: InvoiceWithSelected[] = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: 'PAID',
      },
      select: {
        paid: true,
        totalAmount: true,
      },
    })
    const allExpenses: CostActualWithSelected[] = await prisma.costActual.findMany({
      where: {
        project: {
          tenantId,
        },
        approvedAt: { not: null },
      },
      select: {
        amount: true,
      },
    })
    const totalPaid = allPaidInvoices.reduce((sum: number, inv: InvoiceWithSelected) => sum + Number(inv.paid || inv.totalAmount), 0)
    const totalExpensesAll = allExpenses.reduce((sum: number, exp: CostActualWithSelected) => sum + Number(exp.amount), 0)
    const cashOnHand = totalPaid - totalExpensesAll

    // Get outstanding receivables (invoices not fully paid)
    type InvoiceWithPayments = Prisma.InvoiceGetPayload<{
      include: {
        payments: true
      }
    }>

    type Payment = InvoiceWithPayments['payments'][0]

    const outstandingInvoices: InvoiceWithPayments[] = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['PAID', 'CANCELLED'] },
      },
      include: {
        payments: true,
      },
    })
    const outstandingReceivables = outstandingInvoices.reduce((sum: number, inv: InvoiceWithPayments) => {
      const paid = inv.payments.reduce((pSum: number, p: Payment) => pSum + Number(p.amount), 0)
      const balance = Number(inv.totalAmount) - paid
      return sum + (balance > 0 ? balance : 0)
    }, 0)

    // Get recent invoices for dashboard
    type InvoiceWithProjectAndPayments = Prisma.InvoiceGetPayload<{
      include: {
        project: {
          select: {
            id: true
            name: true
          }
        }
        payments: true
      }
    }>

    const recentInvoices: InvoiceWithProjectAndPayments[] = await prisma.invoice.findMany({
      where: {
        tenantId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        payments: true,
      },
      orderBy: {
        dueDate: 'asc',
      },
      take: 5,
    })

    const invoicesForDashboard = recentInvoices.map((inv: InvoiceWithProjectAndPayments) => {
      const paid = inv.payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0)
      const balance = Number(inv.totalAmount) - paid
      const isOverdue = new Date(inv.dueDate) < new Date() && balance > 0 && inv.status !== 'PAID'
      
      return {
        company: inv.clientName,
        amount: formatCurrency(Number(inv.totalAmount)),
        status: isOverdue ? 'Overdue' : inv.status === 'PAID' ? 'Paid' : 'Pending',
        due: isOverdue 
          ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : inv.status === 'PAID' 
            ? `Paid on ${new Date(inv.payments[0]?.paymentDate || inv.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
            : new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })

    // Get expense breakdown by category
    const expenseCategories = await prisma.costActual.groupBy({
      by: ['costType'],
      where: {
        project: {
          tenantId,
        },
        approvedAt: { not: null },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    type ExpenseCategoryGroupBy = {
      costType: string | null
      _sum: {
        amount: number | null
      }
    }

    const expensesBreakdown = expenseCategories.map((cat: ExpenseCategoryGroupBy) => {
      const amount = Number(cat._sum.amount || 0)
      const trend = 'Stable' // Could be calculated by comparing with previous period
      
      return {
        category: cat.costType || 'Other',
        amount: formatCurrency(amount),
        trend,
      }
    })

    // Get forecast data (from Forecast model)
    type ForecastWithSelected = Prisma.ForecastGetPayload<{
      select: {
        forecastedAmount: true
        confidence: true
        validUntil: true
        name: true
      }
    }>

    const forecasts: ForecastWithSelected[] = await prisma.forecast.findMany({
      where: {
        budget: {
          tenantId,
        },
        generatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        forecastedAmount: true,
        confidence: true,
        validUntil: true,
        name: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: 3,
    })

    const forecastData = forecasts.map((f: ForecastWithSelected) => {
      const amount = Number(f.forecastedAmount)
      const daysUntil = f.validUntil ? Math.ceil((new Date(f.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 30
      
      return {
        label: f.name || `Next ${daysUntil} Days`,
        value: `${amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : amount >= 1000 ? `${(amount / 1000).toFixed(1)}K` : amount.toFixed(0)} revenue`,
        risk: f.confidence >= 80 ? 'Low' : f.confidence >= 60 ? 'Medium' : 'High',
      }
    })

    // Format currency
    const formatCurrency = (amount: number) => {
      if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
      if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
      return `₹${amount.toFixed(0)}`
    }

    return NextResponse.json({
      stats: [
        { label: 'Revenue (MTD)', value: formatCurrency(revenue) },
        { label: 'Expenses (MTD)', value: formatCurrency(totalExpenses) },
        { label: 'Cash on Hand', value: formatCurrency(cashOnHand) },
        { label: 'Outstanding Receivables', value: formatCurrency(outstandingReceivables) },
      ],
      invoices: invoicesForDashboard,
      expenses: expensesBreakdown,
      forecast: forecastData,
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats', details: error.message },
      { status: 500 }
    )
  }
}


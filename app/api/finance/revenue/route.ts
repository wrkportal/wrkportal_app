import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/revenue - Get revenue data
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

    const where: any = {
      tenantId,
      status: 'PAID',
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
    }

    if (projectId) where.projectId = projectId

    // Get revenue by invoices
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        lineItems: true,
      },
      orderBy: {
        invoiceDate: 'desc',
      },
    })

    // Calculate totals
    const totalRevenue = invoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    // Revenue by project
    const revenueByProject = invoices.reduce((acc: any, inv) => {
      const projectName = inv.project?.name || 'No Project'
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      const amount = paid || Number(inv.totalAmount)
      
      if (!acc[projectName]) {
        acc[projectName] = {
          projectId: inv.project?.id,
          projectName,
          amount: 0,
          invoiceCount: 0,
        }
      }
      acc[projectName].amount += amount
      acc[projectName].invoiceCount += 1
      return acc
    }, {})

    // Revenue by month
    const revenueByMonth = invoices.reduce((acc: any, inv) => {
      const month = new Date(inv.invoiceDate).toISOString().substring(0, 7) // YYYY-MM
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      const amount = paid || Number(inv.totalAmount)
      
      if (!acc[month]) {
        acc[month] = { month, amount: 0, invoiceCount: 0 }
      }
      acc[month].amount += amount
      acc[month].invoiceCount += 1
      return acc
    }, {})

    // Revenue trends (compare with previous period)
    const previousStartDate = new Date(startDate)
    const previousEndDate = new Date(startDate)
    previousStartDate.setMonth(previousStartDate.getMonth() - 1)
    previousEndDate.setDate(0) // Last day of previous month

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
      include: {
        payments: true,
      },
    })

    const previousRevenue = previousInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((pSum, p) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    return NextResponse.json({
      totalRevenue,
      revenueGrowth,
      invoiceCount: invoices.length,
      revenueByProject: Object.values(revenueByProject),
      revenueByMonth: Object.values(revenueByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        project: inv.project,
        invoiceDate: inv.invoiceDate,
        totalAmount: Number(inv.totalAmount),
        paid: inv.payments.reduce((sum, p) => sum + Number(p.amount), 0),
        status: inv.status,
      })),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        type: period,
      },
    })
  } catch (error: any) {
    console.error('Error fetching revenue data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue data', details: error.message },
      { status: 500 }
    )
  }
}


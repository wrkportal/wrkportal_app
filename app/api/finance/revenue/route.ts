import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

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

    // Define types
    type InvoiceWithIncludes = Prisma.InvoiceGetPayload<{
      include: {
        project: {
          select: { id: true; name: true; code: true }
        }
        payments: true
        lineItems: true
      }
    }>
    type Payment = InvoiceWithIncludes['payments'][0]
    type PreviousInvoiceWithPayments = Prisma.InvoiceGetPayload<{
      include: { payments: true }
    }>
    type PreviousPayment = PreviousInvoiceWithPayments['payments'][0]

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

    const typedInvoices: InvoiceWithIncludes[] = invoices as InvoiceWithIncludes[]

    // Calculate totals
    const totalRevenue = typedInvoices.reduce((sum: number, inv: InvoiceWithIncludes) => {
      const paid = inv.payments.reduce((pSum: number, p: Payment) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    // Revenue by project
    const revenueByProject = typedInvoices.reduce((acc: any, inv: InvoiceWithIncludes) => {
      const projectName = inv.project?.name || 'No Project'
      const paid = inv.payments.reduce((pSum: number, p: Payment) => pSum + Number(p.amount), 0)
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
    const revenueByMonth = typedInvoices.reduce((acc: any, inv: InvoiceWithIncludes) => {
      const month = new Date(inv.invoiceDate).toISOString().substring(0, 7) // YYYY-MM
      const paid = inv.payments.reduce((pSum: number, p: Payment) => pSum + Number(p.amount), 0)
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

    const typedPreviousInvoices: PreviousInvoiceWithPayments[] = previousInvoices as PreviousInvoiceWithPayments[]

    const previousRevenue = typedPreviousInvoices.reduce((sum: number, inv: PreviousInvoiceWithPayments) => {
      const paid = inv.payments.reduce((pSum: number, p: PreviousPayment) => pSum + Number(p.amount), 0)
      return sum + (paid || Number(inv.totalAmount))
    }, 0)

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    return NextResponse.json({
      totalRevenue,
      revenueGrowth,
      invoiceCount: typedInvoices.length,
      revenueByProject: Object.values(revenueByProject),
      revenueByMonth: Object.values(revenueByMonth).sort((a: any, b: any) => a.month.localeCompare(b.month)),
      invoices: typedInvoices.map((inv: InvoiceWithIncludes) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.clientName,
        project: inv.project,
        invoiceDate: inv.invoiceDate,
        totalAmount: Number(inv.totalAmount),
        paid: inv.payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0),
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


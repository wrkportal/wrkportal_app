import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/finance/ar-ap - Get Accounts Receivable and Payable data
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all' // 'ar', 'ap', 'all'

    // Accounts Receivable (AR) - Unpaid invoices
    let accountsReceivable: any[] = []
    if (type === 'all' || type === 'ar') {
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          tenantId,
          status: { notIn: ['PAID', 'CANCELLED'] },
        },
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
          dueDate: 'asc',
        },
      })

      accountsReceivable = unpaidInvoices.map(inv => {
        const paid = inv.payments.reduce((sum, p) => sum + Number(p.amount), 0)
        const balance = Number(inv.totalAmount) - paid
        const isOverdue = new Date(inv.dueDate) < new Date() && balance > 0
        
        return {
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.clientName,
          clientEmail: inv.clientEmail,
          project: inv.project,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate,
          totalAmount: Number(inv.totalAmount),
          paid,
          balance,
          isOverdue,
          status: inv.status,
          daysOverdue: isOverdue 
            ? Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        }
      })
    }

    // Accounts Payable (AP) - Unpaid expenses/costs
    let accountsPayable: any[] = []
    if (type === 'all' || type === 'ap') {
      // Get expenses that haven't been paid (linked to invoices that are unpaid)
      const unpaidExpenses = await prisma.costActual.findMany({
        where: {
          tenantId,
          approvedAt: { not: null },
          invoiceId: null, // Expenses not linked to invoices
        },
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
          budget: {
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

      accountsPayable = unpaidExpenses.map(exp => {
        const daysSince = Math.floor((Date.now() - new Date(exp.date).getTime()) / (1000 * 60 * 60 * 24))
        const isOverdue = daysSince > 30 // Consider overdue if more than 30 days old
        
        return {
          id: exp.id,
          name: exp.name,
          description: exp.description,
          vendor: exp.costCenter || 'Internal',
          project: exp.project,
          date: exp.date,
          amount: Number(exp.amount),
          currency: exp.currency,
          costType: exp.costType,
          isOverdue,
          daysSince,
        }
      })
    }

    // Calculate totals
    const totalAR = accountsReceivable.reduce((sum, ar) => sum + ar.balance, 0)
    const totalAP = accountsPayable.reduce((sum, ap) => sum + ap.amount, 0)
    const overdueAR = accountsReceivable.filter(ar => ar.isOverdue).reduce((sum, ar) => sum + ar.balance, 0)
    const overdueAP = accountsPayable.filter(ap => ap.isOverdue).reduce((sum, ap) => sum + ap.amount, 0)

    // AR aging analysis
    const arAging = {
      current: accountsReceivable.filter(ar => !ar.isOverdue).reduce((sum, ar) => sum + ar.balance, 0),
      days1_30: accountsReceivable.filter(ar => ar.daysOverdue >= 1 && ar.daysOverdue <= 30).reduce((sum, ar) => sum + ar.balance, 0),
      days31_60: accountsReceivable.filter(ar => ar.daysOverdue >= 31 && ar.daysOverdue <= 60).reduce((sum, ar) => sum + ar.balance, 0),
      days61_90: accountsReceivable.filter(ar => ar.daysOverdue >= 61 && ar.daysOverdue <= 90).reduce((sum, ar) => sum + ar.balance, 0),
      daysOver90: accountsReceivable.filter(ar => ar.daysOverdue > 90).reduce((sum, ar) => sum + ar.balance, 0),
    }

    return NextResponse.json({
      accountsReceivable: {
        total: totalAR,
        overdue: overdueAR,
        count: accountsReceivable.length,
        overdueCount: accountsReceivable.filter(ar => ar.isOverdue).length,
        items: accountsReceivable,
        aging: arAging,
      },
      accountsPayable: {
        total: totalAP,
        overdue: overdueAP,
        count: accountsPayable.length,
        overdueCount: accountsPayable.filter(ap => ap.isOverdue).length,
        items: accountsPayable,
      },
      netWorkingCapital: totalAR - totalAP,
    })
  } catch (error: any) {
    console.error('Error fetching AR/AP data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch AR/AP data', details: error.message },
      { status: 500 }
    )
  }
}


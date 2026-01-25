import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  paymentDate: z.string().transform((str) => new Date(str)),
  paymentMethod: z.enum(['WIRE', 'CHECK', 'CREDIT_CARD', 'ACH', 'OTHER']).default('WIRE'),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
})

// GET /api/finance/invoices/[id]/payments - List payments for invoice
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const payments = await prisma.invoicePayment.findMany({
      where: { invoiceId: params.id },
      orderBy: { paymentDate: 'desc' },
    })

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/invoices/[id]/payments - Record payment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    type InvoiceWithPayments = Prisma.InvoiceGetPayload<{
      include: {
        payments: true
      }
    }>

    type Payment = InvoiceWithPayments['payments'][0]

    const invoice: InvoiceWithPayments | null = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
      include: {
        payments: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const body = await request.json()
    const data = createPaymentSchema.parse(body)

    // Calculate total paid
    const totalPaid = invoice.payments.reduce((sum: number, p: Payment) => sum + Number(p.amount), 0)
    const newTotalPaid = totalPaid + data.amount
    const invoiceTotal = Number(invoice.totalAmount)

    // Check if payment exceeds invoice total
    if (newTotalPaid > invoiceTotal) {
      return NextResponse.json(
        { error: `Payment amount exceeds invoice total. Remaining balance: $${(invoiceTotal - totalPaid).toFixed(2)}` },
        { status: 400 }
      )
    }

    // Create payment
    const payment = await prisma.invoicePayment.create({
      data: {
        invoiceId: params.id,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        paymentReference: data.referenceNumber,
        notes: data.notes,
        createdById: (session.user as any).id,
      },
    })

    // Update invoice status
    let newStatus = invoice.status
    if (newTotalPaid >= invoiceTotal) {
      newStatus = 'PAID'
    } else if (newTotalPaid > 0) {
      newStatus = 'PARTIALLY_PAID'
    }

    await prisma.invoice.update({
      where: { id: params.id },
      data: { status: newStatus },
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error recording payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment', details: error.message },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createInvoiceSchema = z.object({
  projectId: z.string().optional(),
  quoteId: z.string().optional(),
  salesQuoteId: z.string().optional(),
  salesOrderId: z.string().optional(),
  invoiceNumber: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  invoiceDate: z.string().transform((str) => new Date(str)),
  dueDate: z.string().transform((str) => new Date(str)),
  currency: z.string().default('USD'),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(
    z.object({
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(100).default(0),
      amount: z.number().nonnegative(),
    })
  ).min(1),
})

// GET /api/finance/invoices - List invoices
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: any = {
      tenantId: (session.user as any).tenantId,
    }

    if (projectId) where.projectId = projectId
    if (status) where.status = status
    if (fromDate || toDate) {
      where.invoiceDate = {}
      if (fromDate) where.invoiceDate.gte = new Date(fromDate)
      if (toDate) where.invoiceDate.lte = new Date(toDate)
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        quote: {
          select: { id: true, quoteNumber: true },
        },
        lineItems: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        invoiceDate: 'desc',
      },
      take: 100,
    })

    // Calculate totals and payment status (schema already has these fields, but calculate for consistency)
    const invoicesWithTotals = invoices.map((invoice) => {
      const subtotal = Number(invoice.subtotal)
      const tax = Number(invoice.taxAmount)
      const total = Number(invoice.totalAmount)
      const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
      const balance = total - paid

      return {
        ...invoice,
        subtotal,
        tax,
        total,
        paid,
        balance,
      }
    })

    return NextResponse.json({ invoices: invoicesWithTotals })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/finance/invoices - Create invoice
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions
    const userRole = (session.user as any).role
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const data = createInvoiceSchema.parse(body)

    // Verify project if provided
    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          tenantId: (session.user as any).tenantId,
        },
      })
      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    // Verify quote if provided
    if (data.quoteId) {
      const quote = await prisma.quote.findFirst({
        where: {
          id: data.quoteId,
          tenantId: (session.user as any).tenantId,
        },
      })
      if (!quote) {
        return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      }
    }

    // Calculate totals
    const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const tax = data.lineItems.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0)
    const total = subtotal + tax

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: (session.user as any).tenantId,
        projectId: data.projectId,
        quoteId: data.quoteId,
        invoiceNumber: data.invoiceNumber,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientAddress: data.clientAddress,
        subject: data.subject,
        description: data.description,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        currency: data.currency,
        status: data.status,
        subtotal,
        taxAmount: tax,
        taxRate: data.lineItems[0]?.taxRate || 0,
        totalAmount: total,
        notes: data.notes,
        terms: data.terms,
        createdBy: {
          connect: { id: (session.user as any).id },
        },
        lineItems: {
          create: data.lineItems.map((item) => ({
            name: item.description,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.amount,
          })),
        },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        quote: {
          select: { id: true, quoteNumber: true },
        },
        salesQuote: {
          select: { id: true, quoteNumber: true, name: true },
        },
        salesOrder: {
          select: { id: true, orderNumber: true, name: true },
        },
        lineItems: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    )
  }
}


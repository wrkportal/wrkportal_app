import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  invoiceDate: z.string().transform((str) => new Date(str)).optional(),
  dueDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(['DRAFT', 'SENT', 'VIEWED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  lineItems: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1),
      quantity: z.number().positive(),
      unitPrice: z.number().nonnegative(),
      taxRate: z.number().min(0).max(100).default(0),
      amount: z.number().nonnegative(),
    })
  ).optional(),
})

// GET /api/finance/invoices/[id] - Get invoice
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
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const subtotal = Number(invoice.subtotal)
    const tax = Number(invoice.taxAmount)
    const total = Number(invoice.totalAmount)
    const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const balance = total - paid

    return NextResponse.json({
      invoice: {
        ...invoice,
        subtotal,
        tax,
        total,
        paid,
        balance,
      },
    })
  } catch (error: any) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoice', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/invoices/[id] - Update invoice
export async function PATCH(
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
    const allowedRoles = ['FINANCE_CONTROLLER', 'ORG_ADMIN', 'TENANT_SUPER_ADMIN', 'PROJECT_MANAGER']
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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

    // Prevent editing paid invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot edit paid invoice' }, { status: 400 })
    }

    const body = await request.json()
    const data = updateInvoiceSchema.parse(body)

    // Update invoice
    const updateData: any = {}
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber
    if (data.clientName !== undefined) updateData.clientName = data.clientName
    if (data.clientEmail !== undefined) updateData.clientEmail = data.clientEmail
    if (data.clientAddress !== undefined) updateData.clientAddress = data.clientAddress
    if (data.subject !== undefined) updateData.subject = data.subject
    if (data.description !== undefined) updateData.description = data.description
    if (data.invoiceDate !== undefined) updateData.invoiceDate = data.invoiceDate
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.terms !== undefined) updateData.terms = data.terms

    // Handle line items update
    if (data.lineItems !== undefined) {
      // Delete existing line items
      await prisma.invoiceLineItem.deleteMany({
        where: { invoiceId: params.id },
      })

      // Calculate new totals
      const subtotal = data.lineItems.reduce((sum, item) => sum + item.amount, 0)
      const tax = data.lineItems.reduce((sum, item) => sum + (item.amount * item.taxRate) / 100, 0)
      const total = subtotal + tax

      updateData.subtotal = subtotal
      updateData.taxAmount = tax
      updateData.taxRate = data.lineItems[0]?.taxRate || 0
      updateData.totalAmount = total

      // Create new line items
      updateData.lineItems = {
        create: data.lineItems.map((item) => ({
          name: item.description,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.amount,
        })),
      }
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        quote: {
          select: { id: true, quoteNumber: true },
        },
        lineItems: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({ invoice: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error updating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to update invoice', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/invoices/[id] - Delete invoice
export async function DELETE(
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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: (session.user as any).tenantId,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Prevent deleting paid invoices
    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Cannot delete paid invoice' }, { status: 400 })
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json(
      { error: 'Failed to delete invoice', details: error.message },
      { status: 500 }
    )
  }
}


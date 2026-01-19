import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/sales/quotes/[id]/invoice - Generate invoice from sales quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the sales quote
    const quote = await prisma.salesQuote.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Generate invoice number (format: INV-YYYYMMDD-XXXX)
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const count = await prisma.invoice.count({
      where: {
        tenantId: session.user.tenantId!,
        invoiceNumber: {
          startsWith: `INV-${dateStr}-`,
        },
      },
    })
    const invoiceNumber = `INV-${dateStr}-${String(count + 1).padStart(4, '0')}`

    // Get client info from account or quote
    const clientName = quote.account?.name || 'Client'
    const clientEmail = quote.account?.email || null

    // Calculate dates
    const invoiceDate = new Date()
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30) // Default 30 days payment terms

    // Create invoice from quote
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId!,
        salesQuoteId: quote.id,
        invoiceNumber,
        clientName,
        clientEmail,
        subject: `Invoice for ${quote.name}`,
        description: quote.description || null,
        invoiceDate,
        dueDate,
        currency: quote.currency,
        status: 'DRAFT',
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        taxRate: quote.taxRate,
        discount: quote.discount,
        totalAmount: quote.totalAmount,
        terms: quote.terms || null,
        notes: quote.notes || null,
        createdById: session.user.id,
        lineItems: {
          create: quote.lineItems.map((item) => ({
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        lineItems: true,
        salesQuote: {
          select: {
            id: true,
            quoteNumber: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice from quote:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    )
  }
}


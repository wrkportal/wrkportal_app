import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// POST /api/sales/orders/[id]/invoice - Generate invoice from sales order
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the sales order
    const order = await prisma.salesOrder.findFirst({
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

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
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

    // Get client info from account or order
    const clientName = order.account?.name || 'Client'
    const clientEmail = order.account?.email || null

    // Calculate dates
    const invoiceDate = new Date()
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + 30) // Default 30 days payment terms

    // Create invoice from order
    const invoice = await prisma.invoice.create({
      data: {
        tenantId: session.user.tenantId!,
        invoiceNumber,
        clientName,
        clientEmail,
        subject: `Invoice for ${order.name}`,
        description: order.description || null,
        invoiceDate,
        dueDate,
        currency: order.currency,
        status: 'DRAFT',
        subtotal: order.subtotal,
        taxAmount: order.taxAmount,
        taxRate: order.taxRate,
        discount: order.discount,
        totalAmount: order.totalAmount,
        terms: order.paymentTerms || null,
        notes: order.notes || null,
        createdById: session.user.id,
        lineItems: {
          create: order.lineItems.map((item: any) => ({
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
    console.error('Error creating invoice from order:', error)
    return NextResponse.json(
      { error: 'Failed to create invoice', details: error.message },
      { status: 500 }
    )
  }
}


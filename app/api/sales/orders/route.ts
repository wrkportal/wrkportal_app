import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const accountId = searchParams.get('accountId')
    const opportunityId = searchParams.get('opportunityId')
    const quoteId = searchParams.get('quoteId')

    const where: any = {
      tenantId: session.user.tenantId!,
    }

    if (status) {
      where.status = status
    }
    if (accountId) {
      where.accountId = accountId
    }
    if (opportunityId) {
      where.opportunityId = opportunityId
    }
    if (quoteId) {
      where.quoteId = quoteId
    }

    const orders = await prisma.salesOrder.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        opportunity: {
          select: {
            id: true,
            name: true,
            amount: true,
          },
        },
        quote: {
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
        lineItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderDate: 'desc',
      },
    })

    return NextResponse.json(orders)
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      accountId,
      opportunityId,
      quoteId,
      name,
      description,
      orderDate,
      requestedShipDate,
      lineItems,
      taxRate,
      shippingAmount,
      discount,
      paymentTerms,
      shippingAddress,
      billingAddress,
      notes,
    } = body

    // Generate order number
    const orderCount = await prisma.salesOrder.count({
      where: { tenantId: session.user.tenantId! },
    })
    const orderNumber = `ORD-${Date.now()}-${orderCount + 1}`

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
      0
    )
    const discountAmount = parseFloat(discount || 0)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = (afterDiscount * parseFloat(taxRate || 0)) / 100
    const shipping = parseFloat(shippingAmount || 0)
    const totalAmount = afterDiscount + taxAmount + shipping

    const order = await prisma.salesOrder.create({
      data: {
        tenantId: session.user.tenantId!,
        accountId: accountId || null,
        opportunityId: opportunityId || null,
        quoteId: quoteId || null,
        orderNumber,
        name,
        description: description || null,
        status: 'DRAFT',
        orderDate: new Date(orderDate),
        requestedShipDate: requestedShipDate ? new Date(requestedShipDate) : null,
        subtotal,
        taxRate: parseFloat(taxRate || 0),
        taxAmount,
        shippingAmount: shipping,
        discount: discountAmount,
        totalAmount,
        currency: 'USD',
        paymentTerms: paymentTerms || null,
        shippingAddress: shippingAddress || null,
        billingAddress: billingAddress || null,
        notes: notes || null,
        createdById: session.user.id,
      },
    })

    // Create line items
    if (lineItems && lineItems.length > 0) {
      await Promise.all(
        lineItems.map((item: any, index: number) =>
          prisma.salesOrderLineItem.create({
            data: {
              orderId: order.id,
              productId: item.productId || null,
              name: item.name,
              description: item.description || null,
              quantity: parseFloat(item.quantity || 1),
              unitPrice: parseFloat(item.unitPrice || 0),
              discount: parseFloat(item.discount || 0),
              totalPrice: parseFloat(item.totalPrice || 0),
              sortOrder: index,
            },
          })
        )
      )
    }

    const fullOrder = await prisma.salesOrder.findUnique({
      where: { id: order.id },
      include: {
        account: true,
        opportunity: true,
        quote: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!fullOrder) {
      return NextResponse.json(
        { error: 'Failed to retrieve created order' },
        { status: 500 }
      )
    }

    // Automatically capture activity for order creation
    await AutoActivityCapture.capture({
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      type: 'ORDER_CREATED',
      data: {
        orderId: fullOrder.id,
        order: fullOrder,
      },
    })

    return NextResponse.json(fullOrder, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}


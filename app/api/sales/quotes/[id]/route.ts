import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
        opportunity: {
          select: {
            id: true,
            name: true,
          },
        },
        lineItems: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json(quote)
  } catch (error: any) {
    console.error('Error fetching quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      status,
      validUntil,
      accountId,
      opportunityId,
      lineItems,
      taxRate,
      discount,
      discountType,
      terms,
      notes,
      requiresApproval,
    } = body

    const quote = await prisma.salesQuote.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Calculate totals if lineItems are provided
    let updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (status) updateData.status = status
    if (validUntil) updateData.validUntil = new Date(validUntil)
    if (accountId !== undefined) updateData.accountId = accountId || null
    if (opportunityId !== undefined) updateData.opportunityId = opportunityId || null
    if (taxRate !== undefined) updateData.taxRate = parseFloat(taxRate)
    if (discount !== undefined) updateData.discount = parseFloat(discount)
    if (discountType) updateData.discountType = discountType
    if (terms !== undefined) updateData.terms = terms
    if (notes !== undefined) updateData.notes = notes
    if (requiresApproval !== undefined) updateData.requiresApproval = requiresApproval

    if (lineItems && Array.isArray(lineItems)) {
      // Recalculate totals
      const subtotal = lineItems.reduce(
        (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
        0
      )
      const discountAmount =
        (discountType || quote.discountType) === 'PERCENTAGE'
          ? (subtotal * parseFloat(discount || quote.discount.toString())) / 100
          : parseFloat(discount !== undefined ? discount : quote.discount.toString())
      const afterDiscount = subtotal - discountAmount
      const taxRateValue = parseFloat(taxRate !== undefined ? taxRate : quote.taxRate.toString())
      const taxAmount = (afterDiscount * taxRateValue) / 100
      const totalAmount = afterDiscount + taxAmount

      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.totalAmount = totalAmount

      // Update line items (delete old and create new)
      await prisma.salesQuoteLineItem.deleteMany({
        where: { quoteId: params.id },
      })

      await Promise.all(
        lineItems.map((item: any, index: number) =>
          prisma.salesQuoteLineItem.create({
            data: {
              quoteId: params.id,
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
    } else if (taxRate !== undefined || discount !== undefined || discountType) {
      // Recalculate totals with existing line items
      const existingItems = await prisma.salesQuoteLineItem.findMany({
        where: { quoteId: params.id },
      })
      const subtotal = existingItems.reduce(
        (sum, item) => sum + parseFloat(item.totalPrice.toString()),
        0
      )
      const discountAmount =
        (discountType || quote.discountType) === 'PERCENTAGE'
          ? (subtotal * parseFloat(discount !== undefined ? discount : quote.discount.toString())) / 100
          : parseFloat(discount !== undefined ? discount : quote.discount.toString())
      const afterDiscount = subtotal - discountAmount
      const taxRateValue = parseFloat(taxRate !== undefined ? taxRate : quote.taxRate.toString())
      const taxAmount = (afterDiscount * taxRateValue) / 100
      const totalAmount = afterDiscount + taxAmount

      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.totalAmount = totalAmount
    }

    const updatedQuote = await prisma.salesQuote.update({
      where: { id: params.id },
      data: updateData,
      include: {
        account: true,
        opportunity: true,
        lineItems: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedQuote)
  } catch (error: any) {
    console.error('Error updating quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote', details: error.message },
      { status: 500 }
    )
  }
}


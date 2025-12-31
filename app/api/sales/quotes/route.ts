import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

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

    const quotes = await prisma.salesQuote.findMany({
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        lineItems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(quotes)
  } catch (error: any) {
    console.error('Error fetching quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error.message },
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

    // Check if Prisma client has the salesQuote model
    if (!prisma.salesQuote) {
      console.error('Prisma client missing salesQuote model. Please run: npx prisma generate')
      return NextResponse.json(
        { 
          error: 'Database model not available. Please restart the development server after running: npx prisma generate',
          details: 'The SalesQuote model is not available in the Prisma client'
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const {
      accountId,
      opportunityId,
      name,
      description,
      validUntil,
      lineItems,
      taxRate,
      discount,
      discountType,
      terms,
      notes,
    } = body

    // Generate quote number
    let quoteCount = 0
    try {
      quoteCount = await prisma.salesQuote.count({
        where: { tenantId: session.user.tenantId! },
      })
    } catch (error: any) {
      // If model doesn't exist yet, start with 0
      console.warn('Error counting quotes, starting from 0:', error.message)
      quoteCount = 0
    }
    const quoteNumber = `QT-${Date.now()}-${quoteCount + 1}`

    // Calculate totals
    const subtotal = lineItems.reduce(
      (sum: number, item: any) => sum + parseFloat(item.totalPrice || 0),
      0
    )
    const discountAmount =
      discountType === 'PERCENTAGE'
        ? (subtotal * parseFloat(discount || 0)) / 100
        : parseFloat(discount || 0)
    const afterDiscount = subtotal - discountAmount
    const taxAmount = (afterDiscount * parseFloat(taxRate || 0)) / 100
    const totalAmount = afterDiscount + taxAmount

    const quote = await prisma.salesQuote.create({
      data: {
        tenantId: session.user.tenantId!,
        accountId: accountId || null,
        opportunityId: opportunityId || null,
        quoteNumber,
        name,
        description: description || null,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : null,
        subtotal,
        taxRate: parseFloat(taxRate || 0),
        taxAmount,
        discount: discountAmount,
        discountType: discountType || 'AMOUNT',
        totalAmount,
        currency: 'USD',
        terms: terms || null,
        notes: notes || null,
        createdById: session.user.id,
      },
    })

    // Create line items
    if (lineItems && lineItems.length > 0) {
      await Promise.all(
        lineItems.map((item: any, index: number) =>
          prisma.salesQuoteLineItem.create({
            data: {
              quoteId: quote.id,
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

    const fullQuote = await prisma.salesQuote.findUnique({
      where: { id: quote.id },
      include: {
        account: true,
        opportunity: true,
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

    return NextResponse.json(fullQuote, { status: 201 })
  } catch (error: any) {
    console.error('Error creating quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote', details: error.message },
      { status: 500 }
    )
  }
}


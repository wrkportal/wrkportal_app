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
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Get all versions (parent and children)
    const parentQuoteId = quote.parentQuoteId || quote.id

    const versions = await prisma.salesQuote.findMany({
      where: {
        OR: [
          { id: parentQuoteId },
          { parentQuoteId: parentQuoteId },
        ],
        tenantId: session.user.tenantId!,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        lineItems: true,
      },
      orderBy: {
        versionNumber: 'asc',
      },
    })

    return NextResponse.json(versions)
  } catch (error: any) {
    console.error('Error fetching quote versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
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
        lineItems: true,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Determine parent quote ID
    const parentQuoteId = quote.parentQuoteId || quote.id

    // Get latest version number
    const latestVersion = await prisma.salesQuote.findFirst({
      where: {
        OR: [
          { id: parentQuoteId },
          { parentQuoteId: parentQuoteId },
        ],
        tenantId: session.user.tenantId!,
      },
      orderBy: {
        versionNumber: 'desc',
      },
    })

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1

    // Generate new quote number
    const quoteCount = await prisma.salesQuote.count({
      where: { tenantId: session.user.tenantId! },
    })
    const newQuoteNumber = `QT-${Date.now()}-${quoteCount + 1}`

    // Create new version
    const newVersion = await prisma.salesQuote.create({
      data: {
        tenantId: quote.tenantId,
        accountId: quote.accountId,
        opportunityId: quote.opportunityId,
        quoteNumber: newQuoteNumber,
        name: quote.name,
        description: quote.description,
        status: 'DRAFT',
        validUntil: quote.validUntil,
        subtotal: quote.subtotal,
        taxAmount: quote.taxAmount,
        taxRate: quote.taxRate,
        discount: quote.discount,
        discountType: quote.discountType,
        totalAmount: quote.totalAmount,
        currency: quote.currency,
        terms: quote.terms,
        notes: quote.notes,
        versionNumber: newVersionNumber,
        parentQuoteId: parentQuoteId,
        createdById: session.user.id,
      },
    })

    // Copy line items
    await Promise.all(
      quote.lineItems.map((item) =>
        prisma.salesQuoteLineItem.create({
          data: {
            quoteId: newVersion.id,
            productId: item.productId,
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount,
            totalPrice: item.totalPrice,
            sortOrder: item.sortOrder,
          },
        })
      )
    )

    const fullVersion = await prisma.salesQuote.findUnique({
      where: { id: newVersion.id },
      include: {
        lineItems: true,
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(fullVersion, { status: 201 })
  } catch (error: any) {
    console.error('Error creating quote version:', error)
    return NextResponse.json(
      { error: 'Failed to create version', details: error.message },
      { status: 500 }
    )
  }
}


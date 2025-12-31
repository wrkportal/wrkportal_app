import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { templateName, description, isDefault } = body

    if (!templateName) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
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

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.salesQuoteTemplate.updateMany({
        where: {
          tenantId: session.user.tenantId!,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      })
    }

    // Create template data from quote
    const templateData = {
      lineItems: quote.lineItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      taxRate: quote.taxRate,
      discount: quote.discount,
      discountType: quote.discountType,
      terms: quote.terms,
    }

    const template = await prisma.salesQuoteTemplate.create({
      data: {
        tenantId: session.user.tenantId!,
        name: templateName,
        description: description || null,
        templateData,
        isDefault: isDefault || false,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    console.error('Error saving quote as template:', error)
    return NextResponse.json(
      { error: 'Failed to save template', details: error.message },
      { status: 500 }
    )
  }
}


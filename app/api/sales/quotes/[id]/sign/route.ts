import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { AutoActivityCapture } from '@/lib/sales/auto-activity-capture'

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
    const { signatureData, signedByName, signedByEmail } = body

    if (!signatureData || !signedByName) {
      return NextResponse.json(
        { error: 'Signature data and name are required' },
        { status: 400 }
      )
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

    // Update quote with signature
    const updatedQuote = await prisma.salesQuote.update({
      where: { id: params.id },
      data: {
        signatureData,
        signedByName,
        signedByEmail: signedByEmail || null,
        signedAt: new Date(),
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
    })

    // Automatically capture activity
    await AutoActivityCapture.capture({
      tenantId: session.user.tenantId!,
      userId: session.user.id,
      type: 'QUOTE_ACCEPTED',
      data: {
        quoteId: quote.id,
        quote: updatedQuote,
      },
    })

    return NextResponse.json(updatedQuote)
  } catch (error: any) {
    console.error('Error signing quote:', error)
    return NextResponse.json(
      { error: 'Failed to sign quote', details: error.message },
      { status: 500 }
    )
  }
}


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
    const { approvalNotes } = body

    const quote = await prisma.salesQuote.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId!,
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Update quote with approval
    const updatedQuote = await prisma.salesQuote.update({
      where: { id: params.id },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        approvalNotes: approvalNotes || null,
      },
      include: {
        approvedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(updatedQuote)
  } catch (error: any) {
    console.error('Error approving quote:', error)
    return NextResponse.json(
      { error: 'Failed to approve quote', details: error.message },
      { status: 500 }
    )
  }
}


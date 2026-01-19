import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const comments = await prisma.contractLegalComment.findMany({
      where: {
        contractId: params.contractId,
        contract: {
          quoteId: params.id,
          tenantId: session.user.tenantId!,
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(comments)
  } catch (error: any) {
    console.error('Error fetching contract comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract comments', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { commentType, content, clauseReference } = body

    const comment = await prisma.contractLegalComment.create({
      data: {
        contractId: params.contractId,
        commentType: commentType || 'INTERNAL',
        content,
        clauseReference: clauseReference || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error: any) {
    console.error('Error creating contract comment:', error)
    return NextResponse.json(
      { error: 'Failed to create contract comment', details: error.message },
      { status: 500 }
    )
  }
}


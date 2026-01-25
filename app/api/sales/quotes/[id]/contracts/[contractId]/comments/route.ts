import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const getContractLegalComment = () => (prisma as any).contractLegalComment

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractLegalComment = getContractLegalComment()
    if (!contractLegalComment) {
      return NextResponse.json({ error: 'Contract comments are unavailable' }, { status: 503 })
    }

    const comments = await (contractLegalComment as any).findMany({
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

    const contractLegalComment = getContractLegalComment()
    if (!contractLegalComment) {
      return NextResponse.json({ error: 'Contract comments are unavailable' }, { status: 503 })
    }

    const comment = await (contractLegalComment as any).create({
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


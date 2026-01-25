import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const getContractOpenItem = () => (prisma as any).contractOpenItem

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractOpenItem = getContractOpenItem()
    if (!contractOpenItem) {
      return NextResponse.json({ error: 'Contract open items are unavailable' }, { status: 503 })
    }

    const openItems = await (contractOpenItem as any).findMany({
      where: {
        contractId: params.contractId,
        contract: {
          quoteId: params.id,
          tenantId: session.user.tenantId!,
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    })

    return NextResponse.json(openItems)
  } catch (error: any) {
    console.error('Error fetching open items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch open items', details: error.message },
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
    const { item, description, ownerId, dueDate } = body

    const contractOpenItem = getContractOpenItem()
    if (!contractOpenItem) {
      return NextResponse.json({ error: 'Contract open items are unavailable' }, { status: 503 })
    }

    const openItem = await (contractOpenItem as any).create({
      data: {
        contractId: params.contractId,
        item,
        description: description || null,
        ownerId: ownerId || session.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'OPEN',
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(openItem)
  } catch (error: any) {
    console.error('Error creating open item:', error)
    return NextResponse.json(
      { error: 'Failed to create open item', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
    }

    const body = await request.json()
    const { status, description, ownerId, dueDate } = body

    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (description !== undefined) updateData.description = description
    if (ownerId !== undefined) updateData.ownerId = ownerId
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const contractOpenItem = getContractOpenItem()
    if (!contractOpenItem) {
      return NextResponse.json({ error: 'Contract open items are unavailable' }, { status: 503 })
    }

    const openItem = await (contractOpenItem as any).update({
      where: { id: itemId },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json(openItem)
  } catch (error: any) {
    console.error('Error updating open item:', error)
    return NextResponse.json(
      { error: 'Failed to update open item', details: error.message },
      { status: 500 }
    )
  }
}


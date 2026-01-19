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

    const contract = await prisma.salesContract.findFirst({
      where: {
        id: params.contractId,
        quoteId: params.id,
        tenantId: session.user.tenantId!,
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        riskFlags: {
          orderBy: [
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        legalComments: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        clauses: {
          orderBy: { createdAt: 'asc' },
        },
        openItems: {
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: [
            { status: 'asc' },
            { dueDate: 'asc' },
          ],
        },
      },
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    return NextResponse.json(contract)
  } catch (error: any) {
    console.error('Error fetching contract:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract', details: error.message },
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

    const body = await request.json()
    const { name, status, predictedTimeline } = body

    const contract = await prisma.salesContract.update({
      where: { id: params.contractId },
      data: {
        ...(name && { name }),
        ...(status && { status }),
        ...(predictedTimeline !== undefined && { predictedTimeline }),
      },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        riskFlags: true,
        legalComments: true,
        clauses: true,
        openItems: true,
      },
    })

    return NextResponse.json(contract)
  } catch (error: any) {
    console.error('Error updating contract:', error)
    return NextResponse.json(
      { error: 'Failed to update contract', details: error.message },
      { status: 500 }
    )
  }
}


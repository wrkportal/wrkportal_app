import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const getSalesContract = () => (prisma as any).salesContract

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesContract = getSalesContract()
    if (!salesContract) {
      return NextResponse.json({ error: 'Contracts are unavailable' }, { status: 503 })
    }

    const contracts = await (salesContract as any).findMany({
      where: {
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
          where: { resolved: false },
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
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          include: {
            owner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { dueDate: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(contracts)
  } catch (error: any) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts', details: error.message },
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

    const body = await request.json()
    const { name, type, opportunityId } = body

    // Generate contract number
    const salesContract = getSalesContract()
    if (!salesContract) {
      return NextResponse.json({ error: 'Contracts are unavailable' }, { status: 503 })
    }

    const contractCount = await (salesContract as any).count({
      where: { tenantId: session.user.tenantId! },
    })
    const contractNumber = `CONTRACT-${String(contractCount + 1).padStart(6, '0')}`

    const contract = await (salesContract as any).create({
      data: {
        tenantId: session.user.tenantId!,
        quoteId: params.id,
        opportunityId: opportunityId || null,
        contractNumber,
        name: name || `Contract for Quote ${params.id}`,
        type: type || 'SOW',
        status: 'DRAFT',
      },
      include: {
        versions: true,
        riskFlags: true,
        legalComments: true,
        clauses: true,
        openItems: true,
      },
    })

    return NextResponse.json(contract)
  } catch (error: any) {
    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Failed to create contract', details: error.message },
      { status: 500 }
    )
  }
}


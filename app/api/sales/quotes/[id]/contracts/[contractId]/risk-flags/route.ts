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

    const riskFlags = await prisma.contractRiskFlag.findMany({
      where: {
        contractId: params.contractId,
        contract: {
          quoteId: params.id,
          tenantId: session.user.tenantId!,
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(riskFlags)
  } catch (error: any) {
    console.error('Error fetching risk flags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch risk flags', details: error.message },
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
    const { riskType, severity, description, clauseReference } = body

    const riskFlag = await prisma.contractRiskFlag.create({
      data: {
        contractId: params.contractId,
        riskType,
        severity: severity || 'MEDIUM',
        description,
        clauseReference: clauseReference || null,
      },
    })

    return NextResponse.json(riskFlag)
  } catch (error: any) {
    console.error('Error creating risk flag:', error)
    return NextResponse.json(
      { error: 'Failed to create risk flag', details: error.message },
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
    const flagId = searchParams.get('flagId')
    if (!flagId) {
      return NextResponse.json({ error: 'flagId is required' }, { status: 400 })
    }

    const body = await request.json()
    const { resolved } = body

    const riskFlag = await prisma.contractRiskFlag.update({
      where: { id: flagId },
      data: {
        resolved: resolved !== undefined ? resolved : false,
        resolvedAt: resolved ? new Date() : null,
        resolvedBy: resolved ? session.user.id : null,
      },
    })

    return NextResponse.json(riskFlag)
  } catch (error: any) {
    console.error('Error updating risk flag:', error)
    return NextResponse.json(
      { error: 'Failed to update risk flag', details: error.message },
      { status: 500 }
    )
  }
}


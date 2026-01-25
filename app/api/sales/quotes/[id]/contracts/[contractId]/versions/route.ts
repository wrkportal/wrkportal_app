import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const getContractVersion = () => (prisma as any).contractVersion
const getSalesContract = () => (prisma as any).salesContract

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; contractId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contractVersion = getContractVersion()
    if (!contractVersion) {
      return NextResponse.json({ error: 'Contract versions are unavailable' }, { status: 503 })
    }

    const versions = await (contractVersion as any).findMany({
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
      orderBy: { versionNumber: 'desc' },
    })

    return NextResponse.json(versions)
  } catch (error: any) {
    console.error('Error fetching contract versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract versions', details: error.message },
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
    const { documentUrl, redlineUrl, changeSummary } = body

    // Get the latest version number
    const contractVersion = getContractVersion()
    if (!contractVersion) {
      return NextResponse.json({ error: 'Contract versions are unavailable' }, { status: 503 })
    }

    const latestVersion = await (contractVersion as any).findFirst({
      where: { contractId: params.contractId },
      orderBy: { versionNumber: 'desc' },
    })

    const versionNumber = (latestVersion?.versionNumber || 0) + 1

    const version = await (contractVersion as any).create({
      data: {
        contractId: params.contractId,
        versionNumber,
        documentUrl: documentUrl || null,
        redlineUrl: redlineUrl || null,
        changeSummary: changeSummary || null,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Update contract's current version
    const salesContract = getSalesContract()
    if (!salesContract) {
      return NextResponse.json({ error: 'Contracts are unavailable' }, { status: 503 })
    }

    await (salesContract as any).update({
      where: { id: params.contractId },
      data: { currentVersionId: version.id },
    })

    return NextResponse.json(version)
  } catch (error: any) {
    console.error('Error creating contract version:', error)
    return NextResponse.json(
      { error: 'Failed to create contract version', details: error.message },
      { status: 500 }
    )
  }
}


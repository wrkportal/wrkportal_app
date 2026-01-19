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

    const versions = await prisma.contractVersion.findMany({
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
    const latestVersion = await prisma.contractVersion.findFirst({
      where: { contractId: params.contractId },
      orderBy: { versionNumber: 'desc' },
    })

    const versionNumber = (latestVersion?.versionNumber || 0) + 1

    const version = await prisma.contractVersion.create({
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
    await prisma.salesContract.update({
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


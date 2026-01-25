import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { IntegrationManager } from '@/lib/integrations/integration-manager'
import { prisma } from '@/lib/prisma'

const getSalesIntegration = () => (prisma as any).salesIntegration

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
    }

    const integration = await (salesIntegration as any).findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        syncLogs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 20,
        },
      },
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    return NextResponse.json(integration)
  } catch (error: any) {
    console.error('Error fetching integration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integration' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status, settings, syncDirection, syncFrequency } = body

    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
    }

    const integration = await (salesIntegration as any).findUnique({
      where: { id: params.id },
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (settings) updateData.settings = settings
    if (syncDirection) updateData.syncDirection = syncDirection
    if (syncFrequency) updateData.syncFrequency = syncFrequency

    const updated = await (salesIntegration as any).update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating integration:', error)
    return NextResponse.json(
      { error: 'Failed to update integration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const salesIntegration = getSalesIntegration()
    if (!salesIntegration) {
      return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
    }

    const integration = await (salesIntegration as any).findUnique({
      where: { id: params.id },
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    await (salesIntegration as any).delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Failed to delete integration' },
      { status: 500 }
    )
  }
}


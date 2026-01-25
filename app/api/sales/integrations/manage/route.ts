import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { IntegrationManager } from '@/lib/integrations/integration-manager'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await IntegrationManager.getTenantIntegrations(session.user.tenantId)

    return NextResponse.json({ integrations })
  } catch (error: any) {
    console.error('Error fetching integrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { provider, type, name, credentials, settings, syncDirection, syncFrequency } = body

    if (!provider || !type || !name || !credentials) {
      return NextResponse.json(
        { error: 'provider, type, name, and credentials are required' },
        { status: 400 }
      )
    }

    const integrationId = await IntegrationManager.createIntegration(
      session.user.tenantId,
      provider,
      type,
      name,
      credentials,
      settings || {},
      session.user.id
    )

    // Update sync settings if provided
    if (syncDirection || syncFrequency) {
      const { prisma } = await import('@/lib/prisma')
      const salesIntegration = (prisma as any).salesIntegration
      if (!salesIntegration) {
        return NextResponse.json({ error: 'Integrations are unavailable' }, { status: 503 })
      }
      await salesIntegration.update({
        where: { id: integrationId },
        data: {
          syncDirection: syncDirection ? (syncDirection as any) : undefined,
          syncFrequency: syncFrequency ? (syncFrequency as any) : undefined,
        },
      })
    }

    return NextResponse.json({ id: integrationId, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating integration:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create integration' },
      { status: 500 }
    )
  }
}


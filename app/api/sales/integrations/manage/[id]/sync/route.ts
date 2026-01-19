import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { IntegrationManager } from '@/lib/integrations/integration-manager'

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
    const { direction } = body

    await IntegrationManager.syncIntegration(params.id, direction)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error syncing integration:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync integration' },
      { status: 500 }
    )
  }
}


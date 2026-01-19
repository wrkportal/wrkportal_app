import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { enrichLead, enrichAccount } from '@/lib/sales/data-enrichment'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { entityType, entityId, provider } = body

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      )
    }

    let enrichmentData = null

    switch (entityType) {
      case 'lead':
        enrichmentData = await enrichLead(entityId, session.user.tenantId, provider)
        break
      case 'account':
        enrichmentData = await enrichAccount(entityId, session.user.tenantId, provider)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid entityType. Must be lead or account' },
          { status: 400 }
        )
    }

    if (!enrichmentData) {
      return NextResponse.json(
        { error: 'No enrichment data found or provider not configured' },
        { status: 404 }
      )
    }

    return NextResponse.json({ enrichmentData, success: true })
  } catch (error: any) {
    console.error('Error enriching data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to enrich data' },
      { status: 500 }
    )
  }
}


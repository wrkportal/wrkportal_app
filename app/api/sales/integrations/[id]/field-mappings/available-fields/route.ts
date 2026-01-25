/**
 * Available Fields API
 * 
 * Get available fields for field mapping
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getAvailableFields, getTargetFields } from '@/lib/integrations/field-mapping'

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
    })

    if (!integration || integration.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const direction = (searchParams.get('direction') || 'FROM_EXTERNAL') as 'FROM_EXTERNAL' | 'TO_EXTERNAL'
    const entityType = searchParams.get('entityType') as 'lead' | 'contact' | 'opportunity' | 'account' | null

    const sourceFields = getAvailableFields(integration.provider, direction)
    const targetFields = entityType ? getTargetFields(entityType) : []

    return NextResponse.json({
      sourceFields,
      targetFields,
      provider: integration.provider,
      entityType: entityType || null,
    })
  } catch (error: any) {
    console.error('Error fetching available fields:', error)
    return NextResponse.json(
      { error: 'Failed to fetch available fields' },
      { status: 500 }
    )
  }
}


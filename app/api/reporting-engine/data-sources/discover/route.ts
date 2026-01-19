import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createDataSourcesFromDiscovery } from '@/lib/reporting-engine/data-source-discovery'

// POST: Discover and create data sources from Prisma models
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can trigger discovery
    if (session.user.role !== 'TENANT_SUPER_ADMIN' && session.user.role !== 'ORG_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const created = await createDataSourcesFromDiscovery(
      session.user.tenantId!,
      session.user.id
    )

    return NextResponse.json({
      success: true,
      message: `Created ${created} data sources`,
      count: created,
    })
  } catch (error: any) {
    console.error('Error discovering data sources:', error)
    return NextResponse.json(
      { error: 'Failed to discover data sources', details: error.message },
      { status: 500 }
    )
  }
}

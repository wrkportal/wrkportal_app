/**
 * Sync Statistics API
 * 
 * Returns statistics about integration syncs for monitoring
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSyncStatistics } from '@/lib/integrations/scheduled-sync'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getSyncStatistics(session.user.tenantId)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching sync statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sync statistics' },
      { status: 500 }
    )
  }
}


/**
 * Automation Limits API
 * 
 * Returns current automation count, limits, and remaining capacity for the user's tier.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getAutomationLimitInfo, getUserTier } from '@/lib/utils/tier-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limitInfo = await getAutomationLimitInfo(session.user.id)
    const tier = await getUserTier(session.user.id)

    return NextResponse.json({
      tier,
      limitInfo,
      message: tier === 'free' && !limitInfo.canCreate
        ? 'Free tier allows 10 automations per month. Upgrade to Starter or higher to increase your automation limits.'
        : null,
    })
  } catch (error: any) {
    console.error('Error getting automation limits:', error)
    return NextResponse.json(
      { error: 'Failed to get automation limits', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Cron Job Endpoint for Follow-Up Automation
 * 
 * This endpoint should be called by a cron job (Vercel Cron or external)
 * to process due follow-ups
 */

import { NextRequest, NextResponse } from 'next/server'
import { processDueFollowUps } from '@/lib/sales/follow-up-automation'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Process due follow-ups
    await processDueFollowUps()

    return NextResponse.json({
      success: true,
      message: 'Follow-up automation processed successfully',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Follow-up automation cron error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process follow-ups',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}


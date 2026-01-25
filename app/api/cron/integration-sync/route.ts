/**
 * Cron Job API Endpoint for Scheduled Integration Syncs
 * 
 * This endpoint is called by Vercel Cron Jobs or external cron services
 * to trigger automatic integration syncing
 */

import { NextRequest, NextResponse } from 'next/server'
import { processScheduledSyncs } from '@/lib/integrations/scheduled-sync'

export const maxDuration = 300 // 5 minutes for Vercel

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Process all scheduled syncs
    const results = await processScheduledSyncs()

    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalRecordsSynced: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      results: results.map(r => ({
        integration: r.integrationName,
        success: r.success,
        recordsSynced: r.recordsProcessed,
        duration: `${r.duration}ms`,
        errors: r.errors.length > 0 ? r.errors : undefined,
      })),
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
    })
  } catch (error) {
    console.error('Error processing scheduled syncs:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support POST for flexibility
export async function POST(request: NextRequest) {
  return GET(request)
}


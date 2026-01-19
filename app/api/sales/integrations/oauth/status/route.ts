/**
 * OAuth Status API
 * 
 * Check OAuth connection status
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')

    if (!state) {
      return NextResponse.json(
        { error: 'State is required' },
        { status: 400 }
      )
    }

    // In production, check Redis/database for OAuth state
    // For now, return a simple status check
    // This should check if the callback has been processed

    // Placeholder implementation
    // In production, you would:
    // 1. Store OAuth state in Redis with expiration
    // 2. Check if callback has been processed
    // 3. Return integration ID if completed

    return NextResponse.json({
      status: 'pending', // 'pending', 'completed', 'error'
      integrationId: null,
      error: null,
    })
  } catch (error: any) {
    console.error('Error checking OAuth status:', error)
    return NextResponse.json(
      { error: 'Failed to check OAuth status' },
      { status: 500 }
    )
  }
}


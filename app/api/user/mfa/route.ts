/**
 * MFA API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import {
  generateMFASecret,
  enableMFA,
  disableMFA,
  getMFAStatus,
  regenerateBackupCodes,
} from '@/lib/auth/mfa'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await getMFAStatus(session.user.id)
    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error getting MFA status:', error)
    return NextResponse.json(
      { error: 'Failed to get MFA status', details: error.message },
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
    const { action, token } = body

    switch (action) {
      case 'generate':
        const result = await generateMFASecret(session.user.id)
        return NextResponse.json(result)
      
      case 'enable':
        if (!token) {
          return NextResponse.json(
            { error: 'Token is required to enable MFA' },
            { status: 400 }
          )
        }
        const enabled = await enableMFA(session.user.id, token)
        if (!enabled) {
          return NextResponse.json(
            { error: 'Invalid token. Please verify your authenticator app.' },
            { status: 400 }
          )
        }
        return NextResponse.json({ success: true, message: 'MFA enabled successfully' })
      
      case 'disable':
        await disableMFA(session.user.id)
        return NextResponse.json({ success: true, message: 'MFA disabled successfully' })
      
      case 'regenerate-backup-codes':
        const codes = await regenerateBackupCodes(session.user.id)
        return NextResponse.json({ backupCodes: codes })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('Error processing MFA request:', error)
    return NextResponse.json(
      { error: 'Failed to process MFA request', details: error.message },
      { status: 500 }
    )
  }
}


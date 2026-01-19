import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getDLPConfig, updateDLPConfig, checkExportAllowed, logExportActivity } from '@/lib/security/data-loss-prevention'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const config = await getDLPConfig(session.user.tenantId)
    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching DLP config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch DLP config' },
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

    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const config = await request.json()
    await updateDLPConfig(session.user.tenantId, config)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating DLP config:', error)
    return NextResponse.json(
      { error: 'Failed to update DLP config' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { exportPersonalData, createGDPRRequest } from '@/lib/security/gdpr-compliance'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'COMPLIANCE_AUDITOR']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Create GDPR request record
    await createGDPRRequest({
      type: 'access',
      email,
      tenantId: session.user.tenantId,
      requestedBy: session.user.id,
      verified: true // Admin request is auto-verified
    })

    // Export data
    const data = await exportPersonalData(email, session.user.tenantId)

    return NextResponse.json({
      success: true,
      data,
      exportedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error exporting GDPR data:', error)
    return NextResponse.json(
      { error: 'Failed to export GDPR data' },
      { status: 500 }
    )
  }
}


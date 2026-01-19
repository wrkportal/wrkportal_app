import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { deletePersonalData, createGDPRRequest } from '@/lib/security/gdpr-compliance'

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
    const { email, confirm } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (confirm !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation required. Send confirm: "DELETE"' },
        { status: 400 }
      )
    }

    // Create GDPR request record
    await createGDPRRequest({
      type: 'deletion',
      email,
      tenantId: session.user.tenantId,
      requestedBy: session.user.id,
      verified: true // Admin request is auto-verified
    })

    // Delete data
    const result = await deletePersonalData(email, session.user.tenantId)

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      errors: result.errors,
      deletedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting GDPR data:', error)
    return NextResponse.json(
      { error: 'Failed to delete GDPR data' },
      { status: 500 }
    )
  }
}


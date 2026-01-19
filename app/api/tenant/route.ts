import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/tenant - Get current user's tenant information
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        logo: true,
        domainVerified: true,
        verificationMethod: true,
        verifiedAt: true,
        autoJoinEnabled: true,
        plan: true,
        status: true,
        ssoEnabled: true,
        ssoProvider: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            projects: true,
          },
        },
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({ tenant })
  } catch (error) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/tenant - Update tenant settings (like autoJoinEnabled)
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can update tenant settings
    const allowedRoles = ['TENANT_SUPER_ADMIN', 'ORG_ADMIN', 'PLATFORM_OWNER']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { autoJoinEnabled } = body

    // Validate input
    if (typeof autoJoinEnabled !== 'boolean') {
      return NextResponse.json(
        { error: 'autoJoinEnabled must be a boolean' },
        { status: 400 }
      )
    }

    // Update tenant
    const updatedTenant = await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data: {
        autoJoinEnabled,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        autoJoinEnabled: true,
        domainVerified: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Auto-join ${autoJoinEnabled ? 'enabled' : 'disabled'} successfully`,
      tenant: updatedTenant,
    })
  } catch (error) {
    console.error('Error updating tenant settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
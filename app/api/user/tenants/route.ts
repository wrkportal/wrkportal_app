import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/tenants
 * Get all tenants the current user has access to
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's primary tenant (from User.tenantId)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        tenantId: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
            type: true,
            logo: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get additional tenants from UserTenantAccess (if table exists)
    let additionalTenants: any[] = []
    try {
      const userTenantAccesses = await (prisma as any).userTenantAccess.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              domain: true,
              type: true,
              logo: true,
            },
          },
        },
        orderBy: {
          joinedAt: 'desc',
        },
      })

      additionalTenants = userTenantAccesses.map((access: any) => ({
        id: access.tenant.id,
        name: access.tenant.name,
        domain: access.tenant.domain,
        type: access.tenant.type,
        logo: access.tenant.logo,
        role: access.role,
        groupRole: access.groupRole,
        joinedAt: access.joinedAt,
        isActive: access.isActive,
      }))
    } catch (error: any) {
      // UserTenantAccess table might not exist yet
      if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
        console.warn('Could not fetch additional tenants:', error.message)
      }
    }

    // Combine primary tenant with additional tenants
    const allTenants = [
      {
        id: user.tenant.id,
        name: user.tenant.name,
        domain: user.tenant.domain,
        type: user.tenant.type,
        logo: user.tenant.logo,
        isPrimary: true,
        isActive: true,
      },
      ...additionalTenants.filter((t) => t.id !== user.tenantId), // Remove duplicates
    ]

    return NextResponse.json({
      tenants: allTenants,
      activeTenantId: session.user.tenantId || user.tenantId,
    })
  } catch (error: any) {
    console.error('Error fetching user tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/tenants/switch
 * Switch active tenant for the current user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this tenant
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        tenantId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if tenantId is user's primary tenant
    if (user.tenantId === tenantId) {
      // User is switching to their primary tenant - update session
      return NextResponse.json({
        success: true,
        tenantId,
        message: 'Switched to primary workspace',
      })
    }

    // Check if user has access via UserTenantAccess
    let hasAccess = false
    try {
      const access = await (prisma as any).userTenantAccess.findUnique({
        where: {
          userId_tenantId: {
            userId: session.user.id,
            tenantId,
          },
        },
      })

      hasAccess = !!access
    } catch (error: any) {
      // UserTenantAccess table might not exist
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Multi-tenant access not available. Please contact support.' },
          { status: 503 }
        )
      }
      throw error
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    // Update session via NextAuth update
    // Note: This requires calling update() from client side
    return NextResponse.json({
      success: true,
      tenantId,
      message: 'Workspace switched successfully',
      // Client should call session.update({ tenantId }) after this
    })
  } catch (error: any) {
    console.error('Error switching tenant:', error)
    return NextResponse.json(
      { error: 'Failed to switch workspace' },
      { status: 500 }
    )
  }
}

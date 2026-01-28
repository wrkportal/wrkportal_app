import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/tenants/switch
 * Debug endpoint to check if route is accessible
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Tenant switch endpoint is accessible',
    method: 'GET',
    timestamp: new Date().toISOString(),
  })
}

/**
 * POST /api/user/tenants/switch
 * Switch active tenant for the current user
 */
export async function POST(req: NextRequest) {
  console.log('[TenantSwitch] POST request received')
  try {
    const session = await auth()

    if (!session?.user?.id) {
      console.log('[TenantSwitch] Unauthorized - no session or user ID')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      console.error('[TenantSwitch] Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { tenantId } = body

    if (!tenantId) {
      console.log('[TenantSwitch] Missing tenantId in request')
      return NextResponse.json(
        { error: 'Tenant ID is required' },
        { status: 400 }
      )
    }

    console.log('[TenantSwitch] Switching tenant:', {
      userId: session.user.id,
      tenantId,
    })

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
      // Try to access UserTenantAccess model
      // Note: Prisma client uses camelCase for model names
      const access = await (prisma as any).userTenantAccess.findUnique({
        where: {
          userId_tenantId: {
            userId: session.user.id,
            tenantId,
          },
        },
      })

      hasAccess = !!access
      console.log('[TenantSwitch] UserTenantAccess check:', {
        hasAccess,
        accessId: access?.id,
      })
    } catch (error: any) {
      console.error('[TenantSwitch] Error checking UserTenantAccess:', {
        code: error.code,
        message: error.message,
        name: error.name,
      })
      
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
      console.log('[TenantSwitch] Access denied - user does not have access to tenant')
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 }
      )
    }

    console.log('[TenantSwitch] Access granted, returning success')
    // Update session via NextAuth update
    // Note: This requires calling update() from client side
    return NextResponse.json({
      success: true,
      tenantId,
      message: 'Workspace switched successfully',
      // Client should call session.update({ tenantId }) after this
    })
  } catch (error: any) {
    console.error('[TenantSwitch] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    })
    return NextResponse.json(
      { error: 'Failed to switch workspace', details: error.message },
      { status: 500 }
    )
  }
}

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

    // Helper function to remove "Organization" suffix from tenant names
    const cleanTenantName = (name: string): string => {
      return name.replace(/\s*'s\s+Organization\s*$/i, '').trim()
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
        name: cleanTenantName(access.tenant.name),
        domain: access.tenant.domain,
        type: access.tenant.type,
        logo: access.tenant.logo,
        role: access.role,
        groupRole: access.groupRole,
        joinedAt: access.joinedAt,
        isActive: access.isActive,
      }))
      
      console.log('[UserTenants] Found UserTenantAccess records:', {
        userId: session.user.id,
        count: userTenantAccesses.length,
        tenants: additionalTenants.map(t => ({ id: t.id, name: t.name })),
        rawRecords: userTenantAccesses.map((uta: any) => ({
          userId: uta.userId,
          tenantId: uta.tenantId,
          tenantName: uta.tenant?.name,
          role: uta.role,
          invitationId: uta.invitationId,
          isActive: uta.isActive,
        })),
      })
    } catch (error: any) {
      // UserTenantAccess table might not exist yet
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn('[UserTenants] UserTenantAccess table does not exist yet')
      } else {
        console.error('[UserTenants] Error fetching additional tenants:', error.message)
      }
    }

    // Get active tenant access info (for current tenant)
    const activeTenantId = session.user.tenantId || user.tenantId
    let activeTenantAccess: any = null
    
    try {
      // Always check for UserTenantAccess record for the active tenant
      // This handles both cases:
      // 1. User accessing a different tenant via UserTenantAccess
      // 2. User accessing their primary tenant but was invited (has UserTenantAccess record)
      const access = await (prisma as any).userTenantAccess.findUnique({
        where: {
          userId_tenantId: {
            userId: session.user.id,
            tenantId: activeTenantId,
          },
        },
        select: {
          id: true,
          role: true,
          groupRole: true,
          allowedSections: true,
          invitationId: true,
          isActive: true,
        },
      })
      
      if (access) {
        activeTenantAccess = access
        console.log('[UserTenants] Found activeTenantAccess for active tenant:', {
          tenantId: activeTenantId,
          invitationId: access.invitationId,
          hasAllowedSections: !!access.allowedSections,
        })
      } else {
        // If no UserTenantAccess found for active tenant, check if it's in additionalTenants
        // This handles the case where user's primary tenant is different from invited tenant
        const matchingAccess = additionalTenants.find((t: any) => t.id === activeTenantId)
        if (matchingAccess) {
          // Find the UserTenantAccess record for this tenant
          const accessRecord = await (prisma as any).userTenantAccess.findUnique({
            where: {
              userId_tenantId: {
                userId: session.user.id,
                tenantId: activeTenantId,
              },
            },
            select: {
              id: true,
              role: true,
              groupRole: true,
              allowedSections: true,
              invitationId: true,
              isActive: true,
            },
          })
          activeTenantAccess = accessRecord
        }
      }
    } catch (error: any) {
      // UserTenantAccess table might not exist
      if (error.code !== 'P2021' && !error.message?.includes('does not exist')) {
        console.error('[UserTenants] Error fetching active tenant access:', error.message)
      }
    }

    // Combine primary tenant with additional tenants
    // Include all tenants from UserTenantAccess, even if they match the primary tenant
    // This allows users to see all workspaces they have access to
    const allTenantsMap = new Map<string, any>()
    
    // Add primary tenant first
    allTenantsMap.set(user.tenant.id, {
      id: user.tenant.id,
      name: cleanTenantName(user.tenant.name),
      domain: user.tenant.domain,
      type: user.tenant.type,
      logo: user.tenant.logo,
      isPrimary: true,
      isActive: true,
      role: user.role || undefined,
    })
    
    // Add all additional tenants from UserTenantAccess
    // Don't filter by primary tenant - include all to show all workspaces
    additionalTenants.forEach((tenant) => {
      if (!allTenantsMap.has(tenant.id)) {
        allTenantsMap.set(tenant.id, {
          ...tenant,
          name: cleanTenantName(tenant.name),
          isPrimary: tenant.id === user.tenantId,
        })
      }
    })
    
    const allTenants = Array.from(allTenantsMap.values())

    console.log('[UserTenants] Returning tenants:', {
      totalCount: allTenants.length,
      primaryTenant: { id: user.tenant.id, name: user.tenant.name },
      primaryTenantId: user.tenantId,
      additionalCount: additionalTenants.length,
      activeTenantId: session.user.tenantId || user.tenantId,
      hasActiveTenantAccess: !!activeTenantAccess,
      tenantIds: allTenants.map(t => ({ id: t.id, name: t.name, isPrimary: t.isPrimary })),
      allTenantsMapSize: allTenantsMap.size,
      debug: {
        primaryTenantInMap: allTenantsMap.has(user.tenant.id),
        additionalTenantsIds: additionalTenants.map(t => t.id),
      },
    })

    return NextResponse.json({
      tenants: allTenants,
      activeTenantId: session.user.tenantId || user.tenantId,
      activeTenantAccess: activeTenantAccess, // Include active tenant access info
    })
  } catch (error: any) {
    console.error('Error fetching user tenants:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tenants' },
      { status: 500 }
    )
  }
}


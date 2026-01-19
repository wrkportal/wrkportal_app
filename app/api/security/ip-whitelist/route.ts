import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  addIPWhitelistRule,
  removeIPWhitelistRule,
  setIPWhitelistEnabled,
  isIPWhitelisted
} from '@/lib/security/ip-whitelist'

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

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: { settings: true }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const settings = (tenant.settings as any) || {}
    const security = settings.security || {}
    
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     '0.0.0.0'

    const { allowed } = await isIPWhitelisted(clientIP, session.user.tenantId)

    return NextResponse.json({
      enabled: security.ipWhitelistEnabled || false,
      rules: security.ipWhitelistRules || [],
      currentIP: clientIP,
      currentIPAllowed: allowed
    })
  } catch (error) {
    console.error('Error fetching IP whitelist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IP whitelist' },
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

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'add':
        await addIPWhitelistRule(session.user.tenantId, {
          name: data.name,
          ipAddress: data.ipAddress,
          ipRange: data.ipRange,
          isActive: data.isActive !== false
        })
        break

      case 'remove':
        await removeIPWhitelistRule(session.user.tenantId, data.ruleId)
        break

      case 'enable':
        await setIPWhitelistEnabled(session.user.tenantId, data.enabled)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating IP whitelist:', error)
    return NextResponse.json(
      { error: 'Failed to update IP whitelist' },
      { status: 500 }
    )
  }
}


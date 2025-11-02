import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only super admin can query arbitrary tenants; org admin can only query own tenant
    const isSuperAdmin = session.user.role === 'TENANT_SUPER_ADMIN'
    const isOrgAdmin = session.user.role === 'ORG_ADMIN'

    if (!isSuperAdmin && !(isOrgAdmin && session.user.tenantId === params.tenantId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || undefined

    const users = await prisma.user.findMany({
      where: {
        tenantId: params.tenantId,
        ...(status ? { status } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        name: true,
        role: true,
        status: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return NextResponse.json({
      tenantId: params.tenantId,
      totalUsers: users.length,
      users,
      success: true,
    })
  } catch (error) {
    console.error('Admin tenant users fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}



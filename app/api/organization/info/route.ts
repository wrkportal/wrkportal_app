import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        name: true,
        domain: true,
        plan: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    return NextResponse.json({ organization: tenant })
  } catch (error) {
    console.error('Fetch org info error:', error)
    return NextResponse.json({ error: 'Failed to fetch organization info' }, { status: 500 })
  }
}



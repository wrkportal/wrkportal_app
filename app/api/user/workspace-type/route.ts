import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user with tenant information
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { tenant: true },
    })

    if (!user || !user.tenant) {
      return NextResponse.json(
        { success: false, error: 'User or tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      type: user.tenant.type,
      tenantName: user.tenant.name,
    })
  } catch (error) {
    console.error('Error fetching workspace type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspace type' },
      { status: 500 }
    )
  }
}


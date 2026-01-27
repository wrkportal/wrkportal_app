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
      select: {
        id: true,
        tenantId: true,
      },
    })

    if (!user || !user.tenantId) {
      return NextResponse.json(
        { success: false, error: 'User or tenant not found' },
        { status: 404 }
      )
    }

    // Get tenant separately to handle potential relation issues
    let tenant
    try {
      tenant = await prisma.tenant.findUnique({
        where: { id: user.tenantId },
        select: {
          id: true,
          name: true,
          type: true,
        },
      })
    } catch (error: any) {
      // If tenant relation fails, try to infer type from user data
      console.warn('Could not fetch tenant, using default type:', error)
      return NextResponse.json({
        success: true,
        type: 'ORGANIZATION', // Default to organization
        tenantName: 'Organization',
      })
    }

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      type: tenant.type,
      tenantName: tenant.name,
    })
  } catch (error) {
    console.error('Error fetching workspace type:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch workspace type' },
      { status: 500 }
    )
  }
}


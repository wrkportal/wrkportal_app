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
      // Handle P2021 (table doesn't exist) and P2022 (column doesn't exist) errors
      if (error.code === 'P2021' || error.code === 'P2022' || 
          error.message?.includes('does not exist') ||
          error.message?.includes('column')) {
        console.warn('Could not fetch tenant, using default type:', error.message)
        return NextResponse.json({
          success: true,
          type: 'ORGANIZATION', // Default to organization
          tenantName: 'Organization',
        })
      }
      throw error
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


import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch full user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        tenantId: true,
        avatar: true,
        timezone: true,
        locale: true,
        landingPage: true,
        primaryWorkflowType: true,
        phone: true,
        location: true,
        department: true,
        assistantName: true,
        voiceSampleUrl: true,
        status: true,
        lastLogin: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Log user data for debugging
    console.log('[API /user/me] Returning user data:', {
      email: user.email,
      primaryWorkflowType: user.primaryWorkflowType,
      primaryWorkflowTypeType: typeof user.primaryWorkflowType,
      landingPage: user.landingPage,
      role: user.role,
      hasPrimaryWorkflowType: !!user.primaryWorkflowType
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

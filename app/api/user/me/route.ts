import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // If user.id is missing but we have email, try to find/create user by email
    // This handles cases where OAuth sign-in succeeded but user creation failed
    let user = null
    
    if (session.user.id) {
      // Normal case: user ID exists, query by ID
      user = await prisma.user.findUnique({
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
    } else if (session.user.email) {
      // Fallback: user ID missing, try to find/create by email
      console.warn('[API /user/me] User ID missing, attempting to find/create by email:', session.user.email)
      
      const emailLower = session.user.email.toLowerCase()
      
      // Try to find existing user
      user = await prisma.user.findUnique({
        where: { email: emailLower },
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
      
      // If user doesn't exist, try to create (idempotent upsert)
      if (!user) {
        try {
          const domain = emailLower.split('@')[1]
          
          // Get or create tenant
          let tenant = await prisma.tenant.findFirst({
            where: { domain },
            select: { id: true },
          })
          
          if (!tenant) {
            tenant = await prisma.tenant.create({
              data: {
                name: `${session.user.name || emailLower}'s Organization`,
                domain: domain,
              },
            })
          }
          
          // Create user
          user = await prisma.user.create({
            data: {
              email: emailLower,
              name: session.user.name || emailLower,
              firstName: '',
              lastName: '',
              image: session.user.image || undefined,
              tenantId: tenant.id,
              role: 'ORG_ADMIN',
              emailVerified: new Date(),
            },
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
          
          console.log('[API /user/me] ✅ User created successfully:', emailLower)
        } catch (createError: any) {
          console.error('[API /user/me] Failed to create user:', createError.message)
          // If creation fails, return error - user needs to retry
          return NextResponse.json(
            { error: 'User account creation failed. Please try signing in again.' },
            { status: 500 }
          )
        }
      }
    }

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

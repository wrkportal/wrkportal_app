import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// Helper to retry database operations (handles Neon cold starts)
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      const isConnectionError =
        error?.code === 'P1001' ||
        error?.code === 'P1017' ||
        error?.message?.includes('connection') ||
        error?.message?.includes('timeout')
      
      if (isConnectionError && i < retries - 1) {
        console.warn(`[API /user/me] DB connection error (attempt ${i + 1}/${retries}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw new Error('Operation failed after retries')
}

export async function GET(req: NextRequest) {
  console.log('[ME] called')
  let session: any = null
  
  try {
    session = await auth()
    console.log('[ME] session:', session?.user?.email, 'hasId:', !!session?.user?.id)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 🔥 FIX #1: Handle missing user gracefully (non-fatal)
    // 🔥 FIX #2: Add retry logic for Neon cold starts
    // 🔥 FIX #3: Handle tenant creation delays
    
    let user = null
    
    console.log('[ME] querying user...', {
      hasId: !!session.user.id,
      hasEmail: !!session.user.email,
      userId: session.user.id,
      userEmail: session.user.email,
    })
    
    if (session.user.id) {
      // Normal case: user ID exists, query by ID with retry
      try {
        user = await withRetry(() =>
          prisma.user.findUnique({
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
        )
        console.log('[ME] user result (by ID):', user ? 'found' : 'not found')
      } catch (queryError: any) {
        console.error('[ME] Query by ID failed:', queryError.message)
        // Fall through to email-based lookup
      }
    }
    
    // If user not found by ID, try by email (handles OAuth sign-in where user creation failed)
    if (!user && session.user.email) {
      const emailLower = session.user.email.toLowerCase()
      console.log('[ME] User not found by ID, trying by email:', emailLower)
      
      try {
        // Try to find existing user by email with retry
        user = await withRetry(() =>
          prisma.user.findUnique({
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
        )
        console.log('[ME] user result (by email):', user ? 'found' : 'not found')
      } catch (queryError: any) {
        console.error('[ME] Query by email failed:', queryError.message)
      }
      
      // If user still doesn't exist, try to create (idempotent)
      if (!user) {
        console.log('[ME] User not found, attempting to create...')
        try {
          const domain = emailLower.split('@')[1]
          
          // Get or create tenant with retry
          let tenant = null
          try {
            tenant = await withRetry(() =>
              prisma.tenant.findFirst({
                where: { domain },
                select: { id: true, name: true },
              })
            )
            
            if (!tenant) {
              console.log('[ME] Tenant not found, creating...')
              tenant = await withRetry(() =>
                prisma.tenant.create({
                  data: {
                    name: `${session.user.name || emailLower}'s Organization`,
                    domain: domain,
                  },
                  select: { id: true, name: true },
                })
              )
              console.log('[ME] ✅ Tenant created:', tenant.id)
            }
          } catch (tenantError: any) {
            console.error('[ME] Tenant creation failed:', tenantError.message)
            // If tenant creation fails, return non-fatal response
            return NextResponse.json(
              {
                status: 'USER_NOT_PROVISIONED',
                message: 'Account is being set up. Please refresh in a moment.',
                email: emailLower,
              },
              { status: 200 }
            )
          }
          
          // Create user with retry
          if (tenant) {
            user = await withRetry(() =>
              prisma.user.create({
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
            )
            console.log('[ME] ✅ User created successfully:', emailLower)
          }
        } catch (createError: any) {
          console.error('[ME] User creation failed:', createError.message)
          // Return non-fatal response - user can retry
          return NextResponse.json(
            {
              status: 'USER_NOT_PROVISIONED',
              message: 'Account is being set up. Please refresh in a moment.',
              email: emailLower,
            },
            { status: 200 }
          )
        }
      }
    }

    // 🔥 CRITICAL: Never return 500/404 - always return 200 with status
    if (!user) {
      console.warn('[ME] User not found after all attempts')
      return NextResponse.json(
        {
          status: 'USER_NOT_PROVISIONED',
          message: 'Account is being set up. Please refresh in a moment.',
          email: session.user.email,
        },
        { status: 200 }
      )
    }

    // Log user data for debugging
    console.log('[ME] Returning user data:', {
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      hasPrimaryWorkflowType: !!user.primaryWorkflowType,
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('[ME] Unexpected error:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      name: error.name,
      session: {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
      },
    })
    
    // 🔥 CRITICAL: Never return 500 - always return 200 with status
    return NextResponse.json(
      {
        status: 'ERROR',
        message: 'Unable to fetch user data. Please try again.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 200 }
    )
  }
}

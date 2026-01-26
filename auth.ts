import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          // Note: The application name shown in the OAuth prompt is configured
          // in Google Cloud Console > APIs & Services > OAuth consent screen
          // Update the "App name" there to change what users see (e.g., "wrkportal.com")
        },
      },
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        // Check if email is verified
        console.log('🔍 Login check - email verification status:', {
          email: user.email,
          emailVerified: user.emailVerified,
          isVerified: !!user.emailVerified,
        })
        
        if (!user.emailVerified) {
          console.warn('⚠️ Login blocked - email not verified for:', user.email)
          throw new Error('EMAIL_NOT_VERIFIED')
        }
        
        console.log('✅ Email verified, allowing login for:', user.email)

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: user.tenantId,
          emailVerified: user.emailVerified,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && profile) {
        console.log('[OAuth] ========== START OAuth signIn callback ==========')
        
        // SECURITY: Verify that Google OAuth authentication was successful
        if (!account.access_token) {
          console.error('[OAuth] ❌ SECURITY: No access_token - OAuth authentication failed')
          return false
        }
        
        if (!account.id_token) {
          console.error('[OAuth] ❌ SECURITY: No id_token - OAuth authentication failed')
          return false
        }
        
        const email = user.email || profile.email
        if (!email) {
          console.error('[OAuth] ❌ STEP 0: No email provided')
          return false
        }

        // SECURITY: Verify email is verified by Google
        const emailVerified = profile.email_verified !== false && profile.email_verified !== undefined
        if (!emailVerified) {
          console.error('[OAuth] ❌ SECURITY: Email not verified by Google')
          return false
        }

        const emailLower = email.toLowerCase()
        const domain = emailLower.split('@')[1]
        
        // Check if this is a signup flow - detect from callbackUrl
        // The signup page sets callbackUrl with ?signup=success parameter
        // This prevents unauthorized user creation via OAuth
        const callbackUrl = (account as any).callbackUrl || ''
        const isSignupFlow = callbackUrl.includes('signup=success') || false
        
        console.log('[OAuth] STEP 0: Email received:', emailLower)
        console.log('[OAuth] STEP 0: Email verified by Google:', emailVerified)
        console.log('[OAuth] STEP 0: Domain extracted:', domain)
        console.log('[OAuth] STEP 0: Callback URL:', callbackUrl)
        console.log('[OAuth] STEP 0: Is signup flow:', isSignupFlow)
        console.log('[OAuth] STEP 0: DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'MISSING')

        // Simple retry helper
        const withRetry = async <T>(
          operation: () => Promise<T>,
          operationName: string,
          retries = 3,
          delay = 1000
        ): Promise<T> => {
          for (let i = 0; i < retries; i++) {
            try {
              console.log(`[OAuth] ${operationName} - Attempt ${i + 1}/${retries}`)
              const result = await operation()
              console.log(`[OAuth] ${operationName} - ✅ Success`)
              return result
            } catch (error: any) {
              const isConnectionError =
                error?.code === 'P1001' ||
                error?.code === 'P1017' ||
                error?.message?.includes('connection') ||
                error?.message?.includes('timeout')
              
              console.error(`[OAuth] ${operationName} - ❌ Error (attempt ${i + 1}):`, {
                message: error.message,
                code: error.code,
                isConnectionError,
              })
              
              if (isConnectionError && i < retries - 1) {
                const waitTime = delay * (i + 1)
                console.log(`[OAuth] ${operationName} - Waiting ${waitTime}ms before retry...`)
                await new Promise(resolve => setTimeout(resolve, waitTime))
                continue
              }
              throw error
            }
          }
          throw new Error(`${operationName} failed after ${retries} retries`)
        }

        try {
          // STEP 1: Test database connection first
          console.log('[OAuth] STEP 1: Testing database connection...')
          await withRetry(
            () => prisma.$queryRaw`SELECT 1 as test`,
            'Database Connection Test',
            3,
            1000
          )

          // STEP 2: Get or create tenant
          console.log('[OAuth] STEP 2: Getting or creating tenant...')
          let tenant = await withRetry(
            () => prisma.tenant.findFirst({
              where: { domain },
              select: { id: true, name: true },
            }),
            'Find Tenant',
            3,
            1000
          )

          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (!tenant) {
            console.log('[OAuth] STEP 2.1: Tenant not found, creating new tenant...')
            try {
              // Use raw SQL to create tenant, avoiding Prisma's schema validation
              // This works around missing columns like ssoEnabled that may not exist in DB yet
              tenant = await withRetry(
                async () => {
                  const tenantName = `${profile.name || email}'s Organization`
                  // Generate a simple unique ID (Prisma uses cuid() but we'll use timestamp-based)
                  const tenantId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`
                  
                  // Insert using raw SQL, only including fields that definitely exist
                  // Only insert fields that definitely exist (id, name, domain)
                  await prisma.$executeRaw`
                    INSERT INTO "Tenant" (id, name, domain, "createdAt", "updatedAt")
                    VALUES (${tenantId}, ${tenantName}, ${domain}, NOW(), NOW())
                    ON CONFLICT (domain) DO NOTHING
                  `
                  
                  // Fetch the created tenant (or existing if conflict)
                  const created = await prisma.tenant.findFirst({
                    where: { domain },
                    select: { id: true, name: true },
                  })
                  
                  if (!created) {
                    throw new Error('Failed to create or find tenant after insert')
                  }
                  
                  return created
                },
                'Create Tenant',
                3,
                1000
              )
              userRole = 'ORG_ADMIN'
              console.log(`[OAuth] STEP 2.1: ✅ Tenant created: ${tenant.id} - ${tenant.name}`)
            } catch (tenantError: any) {
              console.error('[OAuth] STEP 2.1: ❌ Tenant creation failed, checking for race condition...')
              // Race condition: another request might have created it
              tenant = await withRetry(
                () => prisma.tenant.findFirst({
                  where: { domain },
                  select: { id: true, name: true },
                }),
                'Find Tenant (Race Condition Check)',
                2,
                500
              )
              if (!tenant) {
                console.error('[OAuth] STEP 2.1: ❌ Tenant not found after creation failure')
                console.error('[OAuth] Tenant error details:', {
                  message: tenantError.message,
                  code: tenantError.code,
                  stack: tenantError.stack,
                })
                return false
              }
              console.log('[OAuth] STEP 2.1: ✅ Tenant found (race condition):', tenant.id)
            }
          } else {
            console.log(`[OAuth] STEP 2: ✅ Tenant found: ${tenant.id} - ${tenant.name}`)
          }

          // STEP 3: Check if user exists
          console.log('[OAuth] STEP 3: Checking if user exists...')
          const existingUser = await withRetry(
            () => prisma.user.findUnique({
              where: { email: emailLower },
            }),
            'Find User',
            3,
            1000
          )

          let updatedUser

          if (!existingUser) {
            // User doesn't exist - allow creation if this is a signup flow
            // Otherwise, require manual signup first
            if (!isSignupFlow) {
              console.error('[OAuth] STEP 3: ❌ User does not exist - signup required')
              console.error('[OAuth] Security: Preventing auto-signup via OAuth from login page. User must sign up first.')
              return false
            }
            
            // This is a signup flow - create the user
            console.log('[OAuth] STEP 3: ✅ User does not exist - creating new user (signup flow)')
            
            // Get or create tenant (same logic as signup API)
            let tenant = await withRetry(
              () => prisma.tenant.findFirst({
                where: { domain },
                select: { id: true, name: true },
              }),
              'Find Tenant',
              3,
              1000
            )

            let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

            if (!tenant) {
              // Create new tenant for signup
              const tenantName = `${profile.name || email}'s Organization`
              tenant = await withRetry(
                async () => {
                  const tenantId = `cl${Date.now()}${Math.random().toString(36).substring(2, 11)}`
                  await prisma.$executeRaw`
                    INSERT INTO "Tenant" (id, name, domain, "createdAt", "updatedAt")
                    VALUES (${tenantId}, ${tenantName}, ${domain}, NOW(), NOW())
                    ON CONFLICT (domain) DO NOTHING
                  `
                  const created = await prisma.tenant.findFirst({
                    where: { domain },
                    select: { id: true, name: true },
                  })
                  if (!created) throw new Error('Failed to create tenant')
                  return created
                },
                'Create Tenant',
                3,
                1000
              )
              userRole = 'ORG_ADMIN'
            }

            // Create the user
            updatedUser = await withRetry(
              () => prisma.user.create({
                data: {
                  email: emailLower,
                  name: profile.name || email,
                  firstName: (profile as any).given_name || profile.name?.split(' ')[0] || '',
                  lastName: (profile as any).family_name || profile.name?.split(' ')[1] || '',
                  image: (profile as any).picture || user.image,
                  tenantId: tenant.id,
                  role: userRole,
                  emailVerified: new Date(), // Google OAuth emails are pre-verified
                },
              }),
              'Create User',
              3,
              1000
            )
            console.log(`[OAuth] STEP 3: ✅ User created: ${updatedUser.id}`)
          } else {
            // STEP 3.1: Update existing user with latest profile info
            console.log('[OAuth] STEP 3.1: Updating existing user...')
            updatedUser = await withRetry(
              () => prisma.user.update({
                where: { email: emailLower },
                data: {
                  name: profile.name || email,
                  firstName: (profile as any).given_name || profile.name?.split(' ')[0] || existingUser.firstName,
                  lastName: (profile as any).family_name || profile.name?.split(' ')[1] || existingUser.lastName,
                  image: (profile as any).picture || user.image || existingUser.image,
                  emailVerified: existingUser.emailVerified || new Date(),
                },
              }),
              'Update User',
              3,
              1000
            )
            console.log(`[OAuth] STEP 3.1: ✅ User updated: ${updatedUser.id}`)
          }

          // STEP 4: Verify user exists
          console.log('[OAuth] STEP 4: Verifying user exists in database...')
          const verifyUser = await prisma.user.findUnique({
            where: { id: updatedUser.id },
            select: { id: true, email: true, tenantId: true },
          })

          if (!verifyUser) {
            console.error('[OAuth] STEP 4: ❌ Verification failed - user not found after update')
            return false
          }
          console.log(`[OAuth] STEP 4: ✅ Verification passed: ${verifyUser.id}`)

          console.log('[OAuth] ========== SUCCESS - All steps completed ==========')
          console.log('[OAuth] Final user data:', {
            id: updatedUser.id,
            email: updatedUser.email,
            tenantId: updatedUser.tenantId,
            role: updatedUser.role,
          })

          return true
        } catch (error: any) {
          console.error('[OAuth] ========== FAILED - Error in signIn callback ==========')
          console.error('[OAuth] Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            email: emailLower,
            domain: domain,
            stack: error.stack,
          })
          
          // Specific error handling
          if (error.code === 'P2021') {
            console.error('[OAuth] ❌ P2021: Table does not exist - run migrations!')
          } else if (error.code === 'P1001' || error.code === 'P1017') {
            console.error('[OAuth] ❌ P1001/P1017: Database connection failed')
          } else if (error.code === 'P2002') {
            console.error('[OAuth] ❌ P2002: Unique constraint violation')
          }
          
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        // For OAuth, user MUST exist in DB (verified in signIn callback)
        // Security: Only allow sign-in if user exists in database
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              email: true,
              role: true,
              tenantId: true,
              emailVerified: true,
            },
          })

          if (dbUser) {
            // User exists - set token data
            token.id = dbUser.id
            token.email = dbUser.email
            token.role = dbUser.role
            token.tenantId = dbUser.tenantId
            token.emailVerified = dbUser.emailVerified
          } else {
            // Security: User should have been verified in signIn callback
            // If not found, this is an error state - prevent authentication
            console.error('[JWT] ❌ User not found in DB - signup required:', user.email)
            // Don't set token.id - this will cause API routes to return 401
            // This ensures security: no access without valid DB user
          }
        } else {
          // For credentials, user data is already complete
          token.id = user.id!
          token.email = user.email!
          token.role = (user as any).role
          token.tenantId = (user as any).tenantId
          token.emailVerified = (user as any).emailVerified
        }
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
  },
})

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
          prompt: 'select_account',
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
        
        const email = user.email!
        if (!email) {
          console.error('[OAuth] ❌ STEP 0: No email provided')
          return false
        }

        const emailLower = email.toLowerCase()
        const domain = emailLower.split('@')[1]
        
        console.log('[OAuth] STEP 0: Email received:', emailLower)
        console.log('[OAuth] STEP 0: Domain extracted:', domain)
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
                  const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`
                  const tenantName = `${profile.name || email}'s Organization`
                  
                  // Insert using raw SQL to avoid Prisma schema validation
                  await prisma.$executeRaw`
                    INSERT INTO "Tenant" (id, name, domain, "createdAt", "updatedAt")
                    VALUES (${tenantId}, ${tenantName}, ${domain}, NOW(), NOW())
                    ON CONFLICT (domain) DO NOTHING
                  `
                  
                  // Fetch the created tenant
                  const created = await prisma.tenant.findFirst({
                    where: { domain },
                    select: { id: true, name: true },
                  })
                  
                  if (!created) {
                    // If domain conflict, try to find existing
                    return await prisma.tenant.findFirst({
                      where: { domain },
                      select: { id: true, name: true },
                    })
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

          // STEP 3: Create or update user
          console.log('[OAuth] STEP 3: Creating/updating user...')
          const upsertedUser = await withRetry(
            () => prisma.user.upsert({
              where: { email: emailLower },
              update: {
                name: profile.name || email,
                firstName: (profile as any).given_name || profile.name?.split(' ')[0] || undefined,
                lastName: (profile as any).family_name || profile.name?.split(' ')[1] || undefined,
                image: (profile as any).picture || user.image || undefined,
                emailVerified: new Date(),
              },
              create: {
                email: emailLower,
                name: profile.name || email,
                firstName: (profile as any).given_name || profile.name?.split(' ')[0] || '',
                lastName: (profile as any).family_name || profile.name?.split(' ')[1] || '',
                image: (profile as any).picture || user.image,
                tenantId: tenant.id,
                role: userRole,
                emailVerified: new Date(),
              },
            }),
            'Upsert User',
            3,
            1000
          )
          console.log(`[OAuth] STEP 3: ✅ User upserted: ${upsertedUser.id}`)

          // STEP 4: Verify user exists
          console.log('[OAuth] STEP 4: Verifying user exists in database...')
          const verifyUser = await prisma.user.findUnique({
            where: { id: upsertedUser.id },
            select: { id: true, email: true, tenantId: true },
          })

          if (!verifyUser) {
            console.error('[OAuth] STEP 4: ❌ Verification failed - user not found after creation')
            return false
          }
          console.log(`[OAuth] STEP 4: ✅ Verification passed: ${verifyUser.id}`)

          console.log('[OAuth] ========== SUCCESS - All steps completed ==========')
          console.log('[OAuth] Final user data:', {
            id: upsertedUser.id,
            email: upsertedUser.email,
            tenantId: upsertedUser.tenantId,
            role: upsertedUser.role,
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
        // For OAuth, user MUST exist in DB (created in signIn callback)
        // Security: Only allow sign-in if user exists in database
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: {
              id: true,
              email: true,
              role: true,
              tenantId: true,
            },
          })

          if (dbUser) {
            // User exists - set token data
            token.id = dbUser.id
            token.email = dbUser.email
            token.role = dbUser.role
            token.tenantId = dbUser.tenantId
          } else {
            // Security: User should have been created in signIn callback
            // If not found, this is an error state
            console.error('[JWT] ❌ User not found in DB - should have been created in signIn callback:', user.email)
            // Don't set token.id - this will cause API routes to return 401
            // This ensures security: no access without valid DB user
          }
        } else {
          // For credentials, user data is already complete
          token.id = user.id!
          token.email = user.email!
          token.role = (user as any).role
          token.tenantId = (user as any).tenantId
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

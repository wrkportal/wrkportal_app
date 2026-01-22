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
        const email = user.email!
        if (!email) {
          console.error('[OAuth] No email provided in user object')
          return false // Security: Deny if no email
        }

        const emailLower = email.toLowerCase()
        const domain = emailLower.split('@')[1]

        // Retry helper for Neon cold starts
        const withRetry = async <T>(
          operation: () => Promise<T>,
          retries = 3,
          delay = 1000
        ): Promise<T> => {
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
                console.warn(`[OAuth] DB connection error (attempt ${i + 1}/${retries}), retrying...`)
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
                continue
              }
              throw error
            }
          }
          throw new Error('Operation failed after retries')
        }

        try {
          // Step 1: Get or create tenant (with retry for cold starts)
          let tenant = await withRetry(() =>
            prisma.tenant.findFirst({
              where: { domain },
              select: { id: true, name: true },
            })
          )

          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (!tenant) {
            // Create tenant with retry
            try {
              tenant = await withRetry(() =>
                prisma.tenant.create({
                  data: {
                    name: `${profile.name || email}'s Organization`,
                    domain: domain,
                  },
                  select: { id: true, name: true },
                })
              )
              userRole = 'ORG_ADMIN'
              console.log(`[OAuth] ✅ Created tenant: ${tenant.name}`)
            } catch (tenantError: any) {
              // Race condition: another request might have created it
              tenant = await withRetry(() =>
                prisma.tenant.findFirst({
                  where: { domain },
                  select: { id: true, name: true },
                })
              )
              if (!tenant) {
                console.error('[OAuth] ❌ Failed to create or find tenant:', tenantError.message)
                return false // Security: Deny sign-in if tenant creation fails
              }
            }
          }

          // Step 2: Create or update user (with retry for cold starts)
          // This is the SINGLE source of truth for user creation
          const upsertedUser = await withRetry(() =>
            prisma.user.upsert({
              where: { email: emailLower },
              update: {
                // Update existing user
                name: profile.name || email,
                firstName: (profile as any).given_name || profile.name?.split(' ')[0] || undefined,
                lastName: (profile as any).family_name || profile.name?.split(' ')[1] || undefined,
                image: (profile as any).picture || user.image || undefined,
                emailVerified: new Date(),
              },
              create: {
                // Create new user
                email: emailLower,
                name: profile.name || email,
                firstName: (profile as any).given_name || profile.name?.split(' ')[0] || '',
                lastName: (profile as any).family_name || profile.name?.split(' ')[1] || '',
                image: (profile as any).picture || user.image,
                tenantId: tenant.id,
                role: userRole,
                emailVerified: new Date(),
              },
            })
          )

          // Step 3: Verify user was created (security check)
          const verifyUser = await prisma.user.findUnique({
            where: { id: upsertedUser.id },
            select: { id: true, email: true, tenantId: true },
          })

          if (!verifyUser) {
            console.error('[OAuth] ❌ User creation verification failed')
            return false // Security: Deny if verification fails
          }

          console.log(`[OAuth] ✅ User created/updated successfully:`, {
            id: upsertedUser.id,
            email: upsertedUser.email,
            tenantId: upsertedUser.tenantId,
            role: upsertedUser.role,
          })

          return true // Allow sign-in only if user exists in DB
        } catch (error: any) {
          // Detailed error logging for debugging
          console.error('[OAuth] ❌ Error in signIn callback:', {
            error: error.message,
            code: error.code,
            name: error.name,
            email: emailLower,
            domain: domain,
            stack: error.stack,
            // Database connection info
            databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
          })
          
          // Log specific error types for better debugging
          if (error.code === 'P2021') {
            console.error('[OAuth] ❌ Table does not exist - migrations may not be applied')
          } else if (error.code === 'P1001' || error.code === 'P1017') {
            console.error('[OAuth] ❌ Database connection failed - may be Neon cold start (retries exhausted)')
          } else if (error.code === 'P2002') {
            console.error('[OAuth] ❌ Unique constraint violation - user may already exist (upsert should handle this)')
          } else if (error.message?.includes('timeout')) {
            console.error('[OAuth] ❌ Database operation timed out - Neon may be cold')
          }
          
          // Security: Deny sign-in if user creation fails
          // This ensures user always exists in DB before allowing access
          // User will see "AccessDenied" error and can try again
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

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
          return false
        }

        try {
          const domain = email.split('@')[1]
          const emailLower = email.toLowerCase()

          // Get or create tenant for this domain (idempotent)
          let tenant = await prisma.tenant.findFirst({
            where: { domain },
            select: { id: true, name: true },
          })

          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (!tenant) {
            // Create new organization, user becomes ORG_ADMIN
            try {
              tenant = await prisma.tenant.create({
                data: {
                  name: `${profile.name || email}'s Organization`,
                  domain: domain,
                },
              })
              userRole = 'ORG_ADMIN'
              console.log(`[OAuth] Created new tenant: ${tenant.name}`)
            } catch (tenantError: any) {
              // If tenant creation fails, try to find it again (race condition)
              tenant = await prisma.tenant.findFirst({
                where: { domain },
                select: { id: true, name: true },
              })
              if (!tenant) {
                console.error('[OAuth] Failed to create or find tenant:', tenantError.message)
                // Still allow sign-in, tenant creation can happen later
                console.log('[OAuth] ⚠️ Allowing sign-in despite tenant creation error')
                return true
              }
            }
          }

          // Use upsert to make user creation idempotent (eliminates race conditions)
          if (tenant) {
            try {
              const upsertedUser = await prisma.user.upsert({
                where: { email: emailLower },
                update: {
                  // Update user info if they already exist
                  name: profile.name || email,
                  firstName: (profile as any).given_name || profile.name?.split(' ')[0] || undefined,
                  lastName: (profile as any).family_name || profile.name?.split(' ')[1] || undefined,
                  image: (profile as any).picture || user.image || undefined,
                  emailVerified: new Date(), // Mark as verified on OAuth login
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
              })
              console.log(`[OAuth] ✅ User upserted:`, {
                id: upsertedUser.id,
                email: upsertedUser.email,
                name: upsertedUser.name,
                tenantId: upsertedUser.tenantId,
                role: upsertedUser.role,
                createdAt: upsertedUser.createdAt,
                // Log database connection info (masked)
                databaseUrl: process.env.DATABASE_URL 
                  ? `${process.env.DATABASE_URL.split('@')[0]}@***` 
                  : 'NOT SET',
              })
              
              // Verify user was actually created
              const verifyUser = await prisma.user.findUnique({
                where: { id: upsertedUser.id },
                select: { id: true, email: true },
              })
              console.log(`[OAuth] Verification query:`, verifyUser ? '✅ User found in DB' : '❌ User NOT found in DB')
            } catch (userError: any) {
              console.error('[OAuth] Error upserting user:', {
                error: userError.message,
                code: userError.code,
                email: emailLower,
              })
              // Still allow sign-in - user creation can be retried later
              console.log('[OAuth] ⚠️ Allowing sign-in despite user creation error')
              return true
            }
          }

          return true
        } catch (error: any) {
          console.error('[OAuth] Error in signIn callback:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            name: error.name,
            email: user.email,
            databaseUrl: process.env.DATABASE_URL ? 'SET' : 'MISSING',
          })
          
          // 🔥 FIX #1: NEVER deny OAuth sign-in on DB errors
          // OAuth should authenticate identity, DB logic should run after login, not block it
          // Google has already authenticated the user, so we trust that identity
          console.error('[OAuth] ⚠️ OAuth error occurred, but allowing sign-in to avoid lockout')
          console.error('[OAuth] ⚠️ User will be created/updated on next successful DB operation')
          
          // Log specific error details for debugging
          if (error.code === 'P2021') {
            console.error('[OAuth] P2021: Table does not exist - check migrations and Prisma Client generation')
          } else if (error.code === 'P1001' || error.code === 'P1017') {
            console.error('[OAuth] Database connection error - may be Neon cold start')
          } else if (error.code === 'P2002') {
            console.error('[OAuth] Unique constraint violation - likely race condition (upsert should handle this)')
          }
          
          // Always allow sign-in - OAuth has authenticated the user
          return true
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        // For OAuth, fetch full user data from database
        if (user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
            })

            if (dbUser) {
              token.id = dbUser.id
              token.email = dbUser.email
              token.role = dbUser.role
              token.tenantId = dbUser.tenantId
            } else {
              // 🔥 FIX #3: JWT callback must tolerate missing DB rows
              // User might not exist yet due to DB errors during signIn callback
              // Attempt to create user now (idempotent upsert)
              console.warn('[JWT] User not found in DB, attempting to create:', user.email)
              try {
                const emailLower = user.email!.toLowerCase()
                const domain = emailLower.split('@')[1]
                
                // Get or create tenant
                let tenant = await prisma.tenant.findFirst({
                  where: { domain },
                  select: { id: true },
                })
                
                if (!tenant) {
                  tenant = await prisma.tenant.create({
                    data: {
                      name: `${user.name || emailLower}'s Organization`,
                      domain: domain,
                    },
                  })
                }
                
                // Upsert user (idempotent)
                const createdUser = await prisma.user.upsert({
                  where: { email: emailLower },
                  update: {
                    emailVerified: new Date(),
                  },
                  create: {
                    email: emailLower,
                    name: user.name || emailLower,
                    firstName: (user as any).firstName || '',
                    lastName: (user as any).lastName || '',
                    image: user.image,
                    tenantId: tenant.id,
                    role: 'ORG_ADMIN', // First user becomes admin
                    emailVerified: new Date(),
                  },
                })
                
                token.id = createdUser.id
                token.email = createdUser.email
                token.role = createdUser.role
                token.tenantId = createdUser.tenantId
                console.log('[JWT] ✅ User created successfully:', emailLower)
              } catch (createError: any) {
                // If creation fails, log but don't block - user will be created on next API call
                console.error('[JWT] Failed to create user, will retry on next request:', createError.message)
                token.email = user.email
                token.name = user.name
                // token.id remains undefined - API routes will handle this
              }
            }
          } catch (error: any) {
            // Database error - use OAuth-provided data as fallback
            console.error('[JWT] Error fetching user from DB, using OAuth data:', error.message)
            token.email = user.email
            token.name = user.name
          }
        } else {
          // For credentials, user data is already complete
          // These values are guaranteed by the credentials authorize function
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

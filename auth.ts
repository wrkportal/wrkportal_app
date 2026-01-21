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
        try {
          const email = user.email!
          if (!email) {
            console.error('[OAuth] No email provided in user object')
            return false
          }

          const domain = email.split('@')[1]

          // Check if user already exists
          let existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { tenant: true },
          })

          if (existingUser) {
            // User exists, allow sign in
            console.log(`[OAuth] Existing user found: ${email}, allowing sign in`)
            return true
          }

          // User doesn't exist, create new user with tenant
          // Check if organization for this domain already exists
          let tenant = await prisma.tenant.findFirst({
            where: { domain },
          })

          let userRole: 'ORG_ADMIN' | 'TEAM_MEMBER' = 'TEAM_MEMBER'

          if (!tenant) {
            // Create new organization, user becomes ORG_ADMIN
            tenant = await prisma.tenant.create({
              data: {
                name: `${profile.name}'s Organization`,
                domain: domain,
              },
            })
            userRole = 'ORG_ADMIN'
          }

          // Create the user
          await prisma.user.create({
            data: {
              email: email.toLowerCase(),
              name: profile.name || email,
              firstName: (profile as any).given_name || profile.name?.split(' ')[0] || '',
              lastName: (profile as any).family_name || profile.name?.split(' ')[1] || '',
              image: (profile as any).picture || user.image,
              tenantId: tenant.id,
              role: userRole,
              emailVerified: new Date(),
            },
          })

          console.log(`[OAuth] Created new user: ${email} with role: ${userRole}`)
          return true
        } catch (error: any) {
          console.error('[OAuth] Error in signIn callback:', {
            error: error.message,
            stack: error.stack,
            code: error.code,
            name: error.name,
          })
          // Don't block sign-in for existing users if there's a database error
          // Try to check if user exists one more time
          try {
            const email = user.email!
            const existingUser = await prisma.user.findUnique({
              where: { email: email.toLowerCase() },
            })
            if (existingUser) {
              console.log('[OAuth] User exists despite error, allowing sign in')
              return true
            }
          } catch (checkError) {
            console.error('[OAuth] Error checking existing user:', checkError)
          }
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        // For OAuth, fetch full user data from database
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.email = dbUser.email
            token.role = dbUser.role
            token.tenantId = dbUser.tenantId
          }
        } else {
          // For credentials, user data is already complete
          token.id = user.id
          token.email = user.email
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

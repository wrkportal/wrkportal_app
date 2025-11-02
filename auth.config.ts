import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authConfig = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === 'google' && profile) {
        try {
          const email = user.email!
          const domain = email.split('@')[1]

          // Check if user already exists
          let existingUser = await prisma.user.findUnique({
            where: { email },
            include: { tenant: true },
          })

          if (existingUser) {
            // User exists, allow sign in
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
              email: email,
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
        } catch (error) {
          console.error('[OAuth] Error creating user:', error)
          return false
        }
      }

      return true
    },
    async jwt({ token, user, trigger, session, account }) {
      // Initial sign in
      if (user) {
        // Fetch full user data from database
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.email = dbUser.email
          token.role = dbUser.role
          token.tenantId = dbUser.tenantId
        }
      }

      // Update session
      if (trigger === 'update' && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string
      }
      return session
    },
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAuthPage =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/signup') ||
        nextUrl.pathname.startsWith('/forgot-password') ||
        nextUrl.pathname.startsWith('/reset-password')

      const isPublicPage =
        nextUrl.pathname === '/' ||
        nextUrl.pathname.startsWith('/landing')

      if (isOnAuthPage) {
        if (isLoggedIn) {
          // Redirect to landing page if already logged in (except for password reset)
          if (
            nextUrl.pathname.startsWith('/forgot-password') ||
            nextUrl.pathname.startsWith('/reset-password')
          ) {
            return true // Allow logged-in users to access password reset pages
          }
          return Response.redirect(new URL('/my-work', nextUrl))
        }
        return true // Allow access to auth pages
      }

      // Allow access to public pages without authentication
      if (isPublicPage) {
        return true
      }

      // Require authentication for all other pages
      if (!isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl))
      }

      return true
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account', // Shows account picker every time
          access_type: 'offline',
          response_type: 'code',
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          firstName: profile.given_name,
          lastName: profile.family_name,
        }
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
        }
      },
    }),
  ],
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig

import type { NextAuthConfig } from 'next-auth'

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
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - user data comes from the database
      if (user) {
        token.id = user.id
        token.email = user.email
        token.role = (user as any).role
        token.tenantId = (user as any).tenantId
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
  debug: process.env.NODE_ENV === 'development',
} satisfies NextAuthConfig

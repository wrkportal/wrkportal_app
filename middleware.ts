import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthPage =
    nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/signup') ||
    nextUrl.pathname.startsWith('/forgot-password') ||
    nextUrl.pathname.startsWith('/reset-password')

  const isPublicPage =
    nextUrl.pathname === '/' || 
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/landing')

  if (isAuthPage && isLoggedIn) {
    // Redirect logged-in users away from auth pages
    return Response.redirect(new URL('/my-work', nextUrl))
  }

  if (!isLoggedIn && !isAuthPage && !isPublicPage) {
    // Redirect unauthenticated users to login
    return Response.redirect(new URL('/login', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

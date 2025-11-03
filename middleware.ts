import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simplified middleware without heavy dependencies
export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/landing',
    '/privacy',
    '/terms',
    '/security',
    '/api/auth',
  ]

  const { pathname } = request.nextUrl

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow root path
  if (pathname === '/') {
    return NextResponse.next()
  }

  // For all other paths, let the page handle authentication
  // (Pages will check session and redirect if needed)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
}

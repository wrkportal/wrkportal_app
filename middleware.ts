import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { applySecurityHeaders } from '@/lib/security/security-headers'
import { checkRateLimit, getRateLimitIdentifier, rateLimitPresets } from '@/lib/security/rate-limit'

// Simplified middleware without heavy dependencies
export function middleware(request: NextRequest) {
  // Public paths that don't require authentication
  const publicPaths = [
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/landing',
    '/privacy',
    '/terms',
    '/security',
    '/api/auth',
    '/onboarding',
  ]

  const { pathname } = request.nextUrl

  // Apply rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const identifier = getRateLimitIdentifier(request, { useIP: true })
    
    // Stricter rate limiting for auth endpoints
    const preset = pathname.startsWith('/api/auth') ? 'auth' : 'api'
    const rateLimitResult = checkRateLimit(identifier, preset)
    
    if (!rateLimitResult.allowed && rateLimitResult.error) {
      // Apply security headers to rate limit response
      return applySecurityHeaders(rateLimitResult.error)
    }
  }

  // Create response
  let response = NextResponse.next()

  // Apply security headers to all responses
  response = applySecurityHeaders(response)

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return response
  }

  // Allow root path
  if (pathname === '/') {
    return response
  }

  // For all other paths, let the page handle authentication
  // (Pages will check session and redirect if needed)
  return response
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

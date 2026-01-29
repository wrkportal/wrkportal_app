/**
 * Security Headers Middleware
 * Adds security headers to responses
 */

import { NextResponse } from 'next/server'

export interface SecurityHeaders {
  'Content-Security-Policy'?: string
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'X-XSS-Protection'?: string
  'Strict-Transport-Security'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
}

/**
 * Default security headers
 */
export const defaultSecurityHeaders: SecurityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'geolocation=(), microphone=(self), camera=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: Response | NextResponse,
  customHeaders?: Partial<SecurityHeaders>
): Response | NextResponse {
  // Merge custom headers with defaults
  const securityHeaders = { ...defaultSecurityHeaders, ...customHeaders }

  // Apply all security headers
  for (const [key, value] of Object.entries(securityHeaders)) {
    if (value) {
      response.headers.set(key, value)
    }
  }

  // Return the same response type (NextResponse or Response)
  return response
}

/**
 * Create security headers middleware for Next.js API routes
 */
export function withSecurityHeaders(
  handler: (req: Request) => Promise<Response>,
  customHeaders?: Partial<SecurityHeaders>
) {
  return async (req: Request): Promise<Response> => {
    const response = await handler(req)
    return applySecurityHeaders(response, customHeaders)
  }
}


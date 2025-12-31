/**
 * Rate Limiting Utility
 * Prevents abuse and DoS attacks
 */

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  /**
   * Check if request should be rate limited
   */
  check(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const key = identifier

    // Get or create entry
    let entry = this.store[key]

    // Reset if window has passed
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      }
    }

    // Increment count
    entry.count++

    // Save entry
    this.store[key] = entry

    const allowed = entry.count <= maxRequests
    const remaining = Math.max(0, maxRequests - entry.count)

    return {
      allowed,
      remaining,
      resetAt: entry.resetAt,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    for (const key in this.store) {
      if (this.store[key].resetAt < now) {
        delete this.store[key]
      }
    }
  }

  /**
   * Clear all entries
   */
  clear() {
    this.store = {}
  }

  /**
   * Stop cleanup interval
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter()

/**
 * Rate limit configuration presets
 */
export const rateLimitPresets = {
  // Strict: 10 requests per minute
  strict: { maxRequests: 10, windowMs: 60000 },
  // Standard: 100 requests per minute
  standard: { maxRequests: 100, windowMs: 60000 },
  // Lenient: 1000 requests per minute
  lenient: { maxRequests: 1000, windowMs: 60000 },
  // API: 60 requests per minute
  api: { maxRequests: 60, windowMs: 60000 },
  // Auth: 5 requests per minute (login attempts)
  auth: { maxRequests: 5, windowMs: 60000 },
}

/**
 * Get rate limit identifier from request
 */
export function getRateLimitIdentifier(
  request: Request,
  options?: { useIP?: boolean; useUserId?: boolean; userId?: string }
): string {
  const { useIP = true, useUserId = false, userId } = options || {}

  const identifiers: string[] = []

  if (useIP) {
    // Get IP from request headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const ip = forwardedFor?.split(',')[0] || realIP || 'unknown'
    identifiers.push(`ip:${ip}`)
  }

  if (useUserId && userId) {
    identifiers.push(`user:${userId}`)
  }

  return identifiers.join('|')
}

/**
 * Check rate limit and return response if exceeded
 */
export function checkRateLimit(
  identifier: string,
  preset: keyof typeof rateLimitPresets = 'standard'
): { allowed: boolean; headers?: Headers; error?: Response } {
  const config = rateLimitPresets[preset]
  const result = rateLimiter.check(identifier, config.maxRequests, config.windowMs)

  const headers = new Headers()
  headers.set('X-RateLimit-Limit', config.maxRequests.toString())
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString())

  if (!result.allowed) {
    const error = new Response(
      JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again after ${new Date(result.resetAt).toISOString()}`,
      }),
      {
        status: 429,
        headers: {
          ...Object.fromEntries(headers.entries()),
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        },
      }
    )
    return { allowed: false, headers, error }
  }

  return { allowed: true, headers }
}


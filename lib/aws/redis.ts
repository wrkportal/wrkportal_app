/**
 * AWS ElastiCache Redis Client
 *
 * Shared Redis instance with AuditPro — uses 'wrkportal:' key prefix
 * for data isolation. Used for:
 * - Session storage
 * - Rate limiting
 * - Cache (hot data, permissions, dashboard data)
 * - Pub/sub (future: real-time notifications)
 */

import Redis from 'ioredis'

const KEY_PREFIX = 'wrkportal:'

let redisClient: Redis | null = null

function getRedisClient(): Redis {
  if (redisClient) return redisClient

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  redisClient = new Redis(redisUrl, {
    keyPrefix: KEY_PREFIX,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null // Stop retrying after 3 attempts
      return Math.min(times * 200, 2000) // Exponential backoff, max 2s
    },
    lazyConnect: true,
  })

  redisClient.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message)
  })

  redisClient.on('connect', () => {
    console.log('[Redis] Connected to ElastiCache')
  })

  return redisClient
}

export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const client = getRedisClient()
    return (client as any)[prop]
  },
})

/**
 * Cache helper — get or set with TTL
 */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const client = getRedisClient()

  try {
    const cached = await client.get(key)
    if (cached) return JSON.parse(cached) as T
  } catch {
    // Cache miss or error — fetch fresh data
  }

  const data = await fetchFn()

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(data))
  } catch {
    // Cache write failure — non-fatal
  }

  return data
}

/**
 * Invalidate cache by pattern
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const client = getRedisClient()
  try {
    // Note: KEYS with prefix — ioredis adds the keyPrefix automatically
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      // Strip prefix since ioredis adds it back on del
      const strippedKeys = keys.map((k) => k.replace(KEY_PREFIX, ''))
      await client.del(...strippedKeys)
    }
  } catch {
    // Non-fatal
  }
}

/**
 * Rate limiter using Redis
 */
export async function checkRateLimit(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const client = getRedisClient()
  const key = `ratelimit:${identifier}`
  const now = Math.floor(Date.now() / 1000)
  const windowStart = now - windowSeconds

  try {
    const pipeline = client.pipeline()
    // Remove old entries outside the window
    pipeline.zremrangebyscore(key, 0, windowStart)
    // Add current request
    pipeline.zadd(key, now.toString(), `${now}:${Math.random()}`)
    // Count requests in window
    pipeline.zcard(key)
    // Set TTL on the key
    pipeline.expire(key, windowSeconds)

    const results = await pipeline.exec()
    const count = (results?.[2]?.[1] as number) || 0

    return {
      allowed: count <= maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetAt: now + windowSeconds,
    }
  } catch {
    // If Redis fails, allow the request (fail-open)
    return { allowed: true, remaining: maxRequests, resetAt: now + windowSeconds }
  }
}

/**
 * Health check for Redis
 */
export async function checkRedisHealth(): Promise<{
  healthy: boolean
  latencyMs: number
  error?: string
}> {
  const start = Date.now()
  try {
    const client = getRedisClient()
    await client.ping()
    return { healthy: true, latencyMs: Date.now() - start }
  } catch (error: any) {
    return { healthy: false, latencyMs: Date.now() - start, error: error.message }
  }
}

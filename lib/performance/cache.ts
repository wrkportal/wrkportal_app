/**
 * Caching Layer
 * Provides in-memory caching for frequently accessed data
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
  createdAt: number
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set value in cache
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data: value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now(),
    }

    this.cache.set(key, entry)
  }

  /**
   * Delete value from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    for (const entry of this.cache.values()) {
      if (entry.expiresAt > now) {
        validEntries++
      } else {
        expiredEntries++
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        keysToDelete.push(key)
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key)
    }
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

// Global cache instance
const cacheManager = new CacheManager()

/**
 * Cache key generators
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  tenant: (tenantId: string) => `tenant:${tenantId}`,
  schedule: (scheduleId: string) => `schedule:${scheduleId}`,
  schedules: (tenantId: string) => `schedules:${tenantId}`,
  report: (reportId: string) => `report:${reportId}`,
  dashboard: (dashboardId: string) => `dashboard:${dashboardId}`,
  dataset: (datasetId: string) => `dataset:${datasetId}`,
}

/**
 * Cache TTL presets (in milliseconds)
 */
export const cacheTTL = {
  short: 60 * 1000, // 1 minute
  medium: 5 * 60 * 1000, // 5 minutes
  long: 30 * 60 * 1000, // 30 minutes
  veryLong: 60 * 60 * 1000, // 1 hour
}

/**
 * Get value from cache or execute function
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = cacheTTL.medium
): Promise<T> {
  // Try to get from cache
  const cached = cacheManager.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const data = await fetcher()

  // Store in cache
  cacheManager.set(key, data, ttlMs)

  return data
}

/**
 * Invalidate cache by key or pattern
 */
export function invalidateCache(keyOrPattern: string): void {
  if (keyOrPattern.includes('*')) {
    // Pattern matching - delete all matching keys
    const pattern = keyOrPattern.replace(/\*/g, '.*')
    const regex = new RegExp(`^${pattern}$`)

    for (const key of cacheManager['cache'].keys()) {
      if (regex.test(key)) {
        cacheManager.delete(key)
      }
    }
  } else {
    // Exact match
    cacheManager.delete(keyOrPattern)
  }
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cacheManager.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cacheManager.getStats()
}

// Export cache manager for advanced usage
export { cacheManager }


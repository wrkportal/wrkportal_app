// Data Caching Layer for Reporting Studio
// Note: This is an in-memory cache implementation. For production, consider Redis.

interface CacheEntry<T> {
  data: T
  expiresAt: number
  key: string
}

class InMemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes default

  /**
   * Get cached data
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
   * Set cached data
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    this.cache.set(key, {
      data,
      expiresAt,
      key,
    })
  }

  /**
   * Delete cached data
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
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    keys: string[]
  } {
    this.clearExpired()
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }

  /**
   * Generate cache key from parameters
   */
  generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${JSON.stringify(params[key])}`)
      .join('&')
    return `${prefix}:${sortedParams}`
  }
}

// Singleton instance
const cache = new InMemoryCache()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.clearExpired()
  }, 5 * 60 * 1000)
}

/**
 * Get data from cache or execute function and cache result
 */
export async function getOrSetCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch data
  const data = await fetcher()

  // Cache it
  cache.set(key, data, ttl)

  return data
}

/**
 * Invalidate cache by key pattern
 */
export function invalidateCache(pattern: string): void {
  const stats = cache.getStats()
  stats.keys.forEach((key) => {
    if (key.startsWith(pattern)) {
      cache.delete(key)
    }
  })
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Generate cache key for dataset query
 */
export function getDatasetCacheKey(
  datasetId: string,
  options: {
    limit?: number
    offset?: number
    filters?: any[]
    orderBy?: any[]
  }
): string {
  return cache.generateKey(`dataset:${datasetId}`, options)
}

/**
 * Generate cache key for data source query
 */
export function getDataSourceCacheKey(
  dataSourceId: string,
  query: string
): string {
  return cache.generateKey(`datasource:${dataSourceId}`, { query })
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return cache.getStats()
}

export default cache


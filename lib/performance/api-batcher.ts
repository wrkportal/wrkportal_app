/**
 * API Batching Utility
 * Batches multiple API calls to reduce network overhead and improve performance
 */

interface BatchedRequest {
  url: string
  options?: RequestInit
  key: string
}

class APIBatcher {
  private pendingRequests: Map<string, Promise<any>> = new Map()
  private batchQueue: BatchedRequest[] = []
  private batchTimer: NodeJS.Timeout | null = null
  private readonly BATCH_DELAY = 50 // ms

  /**
   * Fetch with automatic deduplication
   * If the same URL is requested multiple times, returns the same promise
   */
  async fetchDeduplicated(url: string, options?: RequestInit): Promise<any> {
    const cacheKey = `${url}:${JSON.stringify(options || {})}`
    
    // Return existing promise if already in flight
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)
    }

    // Create new request
    const promise = fetch(url, options)
      .then(response => response.json())
      .finally(() => {
        // Clean up after request completes
        this.pendingRequests.delete(cacheKey)
      })

    this.pendingRequests.set(cacheKey, promise)
    return promise
  }

  /**
   * Batch multiple API calls together
   */
  async batchRequests(requests: BatchedRequest[]): Promise<Record<string, any>> {
    const results: Record<string, any> = {}
    
    // Execute requests in parallel
    const promises = requests.map(async (request) => {
      try {
        const response = await fetch(request.url, request.options)
        const data = await response.json()
        return { key: request.key, data, error: null }
      } catch (error) {
        return { key: request.key, data: null, error }
      }
    })

    const responses = await Promise.all(promises)
    
    responses.forEach(({ key, data, error }) => {
      results[key] = error ? { error } : data
    })

    return results
  }

  /**
   * Clear all pending requests (useful for cleanup)
   */
  clear() {
    this.pendingRequests.clear()
    if (this.batchTimer) {
      clearTimeout(this.batchTimer)
      this.batchTimer = null
    }
  }
}

// Singleton instance
export const apiBatcher = new APIBatcher()

/**
 * Hook-friendly wrapper for batched API calls
 */
export async function batchAPICalls<T extends Record<string, any>>(
  requests: Array<{ url: string; options?: RequestInit; key: keyof T }>
): Promise<T> {
  const batchedRequests: BatchedRequest[] = requests.map(req => ({
    url: req.url,
    options: req.options,
    key: String(req.key),
  }))
  const result = await apiBatcher.batchRequests(batchedRequests)
  return result as unknown as T
}

/**
 * Debounced fetch - useful for search/autocomplete
 */
export function debounceFetch<T>(
  url: string,
  options: RequestInit,
  delay: number = 300
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(url, options)
        const data = await response.json()
        resolve(data as T)
      } catch (error) {
        reject(error)
      }
    }, delay)

    // Return a cancel function
    return () => clearTimeout(timeoutId)
  })
}

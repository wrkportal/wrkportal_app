/**
 * Performance Monitoring Utilities
 * Track and measure application performance
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number = 1000

  /**
   * Measure execution time of an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      })

      return result
    } catch (error) {
      const duration = performance.now() - start

      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, error: true },
      })

      throw error
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name)
  }

  /**
   * Get statistics for a specific operation
   */
  getStats(name: string) {
    const metrics = this.getMetrics(name)

    if (metrics.length === 0) {
      return null
    }

    const durations = metrics.map((m) => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    // Calculate percentile (p95)
    const sorted = [...durations].sort((a, b) => a - b)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p95 = sorted[p95Index] || 0

    return {
      name,
      count: metrics.length,
      avg,
      min,
      max,
      p95,
      total: sum,
    }
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics = []
  }

  /**
   * Get slow queries (queries taking longer than threshold)
   */
  getSlowQueries(thresholdMs: number = 1000): PerformanceMetric[] {
    return this.metrics.filter((m) => m.duration > thresholdMs)
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMonitor()

/**
 * Measure API route performance
 */
export async function measureApiRoute<T>(
  routeName: string,
  handler: () => Promise<Response>
): Promise<Response> {
  return performanceMonitor.measure(routeName, handler, {
    type: 'api_route',
  })
}

/**
 * Measure database query performance
 */
export async function measureQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure(queryName, query, {
    type: 'database_query',
  })
}

/**
 * Get performance statistics
 */
export function getPerformanceStats(operationName?: string) {
  if (operationName) {
    return performanceMonitor.getStats(operationName)
  }

  // Get stats for all operations
  const allMetrics = performanceMonitor.getAllMetrics()
  const operations = new Set(allMetrics.map((m) => m.name))

  const stats: Record<string, any> = {}
  for (const op of operations) {
    stats[op] = performanceMonitor.getStats(op)
  }

  return stats
}

/**
 * Get slow queries
 */
export function getSlowQueries(thresholdMs: number = 1000) {
  return performanceMonitor.getSlowQueries(thresholdMs)
}

/**
 * Clear performance metrics
 */
export function clearPerformanceMetrics() {
  performanceMonitor.clear()
}

// Export monitor for advanced usage
export { performanceMonitor }


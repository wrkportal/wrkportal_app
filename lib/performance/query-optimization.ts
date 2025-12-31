/**
 * Database Query Optimization Utilities
 * Helps optimize database queries for better performance
 */

import { Prisma } from '@prisma/client'

/**
 * Common select fields for optimized queries
 */
export const optimizedSelects = {
  // Select only necessary fields for lists
  userList: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    tenantId: true,
    createdAt: true,
  },

  // Select only necessary fields for schedule lists
  scheduleList: {
    id: true,
    name: true,
    resourceType: true,
    resourceId: true,
    frequency: true,
    status: true,
    isActive: true,
    nextRunAt: true,
    lastRunAt: true,
    createdAt: true,
    _count: {
      select: {
        deliveries: true,
      },
    },
  },
}

/**
 * Build optimized query with pagination and select
 */
export interface OptimizedQueryOptions {
  skip?: number
  take?: number
  select?: Prisma.UserSelect | Prisma.ReportScheduleSelect | any
  where?: any
  orderBy?: any
  include?: any
}

/**
 * Add index hints for Prisma queries (when using raw queries)
 */
export function getIndexHint(table: string, indexName: string): string {
  return `/*+ USE_INDEX(${table}, ${indexName}) */`
}

/**
 * Build count query (lighter than fetching all records)
 */
export async function getCount<T>(
  model: any,
  where?: any
): Promise<number> {
  if (!model || !model.count) {
    return 0
  }

  try {
    return await model.count({ where })
  } catch (error) {
    console.error('Error getting count:', error)
    return 0
  }
}

/**
 * Optimize query by removing unnecessary includes
 */
export function optimizeQuery<T>(query: any): T {
  // Remove circular references that can cause performance issues
  if (typeof query === 'object' && query !== null) {
    const optimized = { ...query }

    // Remove deeply nested relations if not needed
    if (optimized.include) {
      // Keep only necessary includes
      const necessaryIncludes = ['_count']
      const filteredIncludes: any = {}

      for (const key of necessaryIncludes) {
        if (optimized.include[key]) {
          filteredIncludes[key] = optimized.include[key]
        }
      }

      optimized.include = Object.keys(filteredIncludes).length > 0 ? filteredIncludes : undefined
    }

    return optimized as T
  }

  return query
}

/**
 * Batch query helper for processing large datasets
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = []

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await processor(batch)
    results.push(...batchResults)
  }

  return results
}

/**
 * Debounce database queries to prevent excessive calls
 */
export function debounceQuery<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 300
): T {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingPromise: Promise<any> | null = null
  let pendingResolve: ((value: any) => void) | null = null

  return ((...args: Parameters<T>) => {
    return new Promise<any>((resolve) => {
      // Cancel previous timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      // Store resolve for current call
      pendingResolve = resolve

      // Set new timeout
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args)
          if (pendingResolve) {
            pendingResolve(result)
            pendingResolve = null
          }
        } catch (error) {
          if (pendingResolve) {
            pendingResolve(Promise.reject(error))
            pendingResolve = null
          }
        }
      }, delay)
    })
  }) as T
}


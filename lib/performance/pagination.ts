/**
 * Pagination Utilities
 * Provides consistent pagination for large datasets
 */

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

/**
 * Parse pagination parameters from query string
 */
export function parsePaginationParams(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): PaginationParams {
  const page = Math.max(1, parseInt(getParam(searchParams, 'page', '1'), 10) || 1)
  const limit = Math.min(
    100,
    Math.max(1, parseInt(getParam(searchParams, 'limit', '20'), 10) || 20)
  )
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Get parameter from search params
 */
function getParam(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  key: string,
  defaultValue: string
): string {
  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) || defaultValue
  }

  const value = searchParams[key]
  if (Array.isArray(value)) {
    return value[0] || defaultValue
  }
  return value || defaultValue
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit)

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNextPage: params.page < totalPages,
      hasPreviousPage: params.page > 1,
    },
  }
}

/**
 * Generate pagination metadata for database queries
 */
export function getPaginationMetadata(params: PaginationParams, total: number) {
  const totalPages = Math.ceil(total / params.limit)

  return {
    skip: params.offset,
    take: params.limit,
    page: params.page,
    limit: params.limit,
    total,
    totalPages,
    hasNextPage: params.page < totalPages,
    hasPreviousPage: params.page > 1,
  }
}


// Data Catalog - Unified semantic layer for Reporting Studio

import { DataSourceType, DatasetType, DataSourceProvider } from '@/types/reporting-studio'
import { ColumnDefinition } from '@/types/reporting-studio'

export type CatalogEntryType = 'file' | 'database_table' | 'query' | 'virtual'

export interface CatalogEntry {
  id: string
  name: string
  description?: string
  type: CatalogEntryType
  sourceType: DataSourceType
  provider?: DataSourceProvider
  schema?: ColumnDefinition[]
  rowCount?: number
  lastRefreshed?: Date
  metadata?: Record<string, any>
}

export interface DataSourceMetadata {
  id: string
  name: string
  type: DataSourceType
  provider?: DataSourceProvider
  status: string
  tables?: CatalogEntry[]
}

/**
 * Abstract data source to a unified catalog entry
 */
export function createCatalogEntry(
  source: any,
  type: 'file' | 'database_table' | 'query' | 'virtual'
): CatalogEntry {
  const entry: CatalogEntry = {
    id: source.id,
    name: source.name || source.originalName || source.tableName,
    description: source.description,
    type,
    sourceType: source.type || source.sourceType || 'FILE',
    provider: source.provider,
    rowCount: source.rowCount ? Number(source.rowCount) : undefined,
    lastRefreshed: source.lastRefreshedAt ? new Date(source.lastRefreshedAt) : undefined,
    metadata: {
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
      ...source,
    },
  }

  // Extract schema if available
  if (source.schema) {
    entry.schema = source.schema.columns || source.schema
  }

  return entry
}

/**
 * Search catalog entries by name or description
 */
export function searchCatalog(
  entries: CatalogEntry[],
  query: string
): CatalogEntry[] {
  if (!query.trim()) return entries

  const lowerQuery = query.toLowerCase()
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(lowerQuery) ||
      entry.description?.toLowerCase().includes(lowerQuery) ||
      entry.metadata?.description?.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Filter catalog entries by type
 */
export function filterCatalogByType(
  entries: CatalogEntry[],
  types: CatalogEntryType[]
): CatalogEntry[] {
  return entries.filter((entry) => types.includes(entry.type))
}

/**
 * Filter catalog entries by source type
 */
export function filterCatalogBySourceType(
  entries: CatalogEntry[],
  sourceTypes: DataSourceType[]
): CatalogEntry[] {
  return entries.filter((entry) => sourceTypes.includes(entry.sourceType))
}

/**
 * Get catalog entry by ID
 */
export function getCatalogEntry(
  entries: CatalogEntry[],
  id: string
): CatalogEntry | undefined {
  return entries.find((entry) => entry.id === id)
}

/**
 * Group catalog entries by source type
 */
export function groupCatalogBySourceType(
  entries: CatalogEntry[]
): Record<DataSourceType, CatalogEntry[]> {
  const grouped: Record<string, CatalogEntry[]> = {
    FILE: [],
    DATABASE: [],
    API: [],
    CLOUD: [],
  }

  entries.forEach((entry) => {
    if (grouped[entry.sourceType]) {
      grouped[entry.sourceType].push(entry)
    }
  })

  return grouped as Record<DataSourceType, CatalogEntry[]>
}

/**
 * Get catalog statistics
 */
export function getCatalogStatistics(entries: CatalogEntry[]): {
  total: number
  byType: Record<CatalogEntryType, number>
  bySourceType: Record<DataSourceType, number>
  totalRows: number
} {
  const stats = {
    total: entries.length,
    byType: {
      file: 0,
      database_table: 0,
      query: 0,
      virtual: 0,
    },
    bySourceType: {
      FILE: 0,
      DATABASE: 0,
      API: 0,
      CLOUD: 0,
    },
    totalRows: 0,
  }

  entries.forEach((entry) => {
    stats.byType[entry.type]++
    stats.bySourceType[entry.sourceType]++
    if (entry.rowCount) {
      stats.totalRows += entry.rowCount
    }
  })

  return stats
}


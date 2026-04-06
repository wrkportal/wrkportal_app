'use client'

import * as React from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Column } from "./data-table"

interface VirtualizedDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (item: T) => void
  emptyMessage?: string
  rowHeight?: number
  maxHeight?: number
}

/**
 * High-performance data table with row virtualization.
 * Only renders visible rows — handles 10,000+ rows smoothly.
 * Falls back to regular rendering for < 50 rows (no overhead needed).
 */
export function VirtualizedDataTable<T extends { id: string }>({
  data,
  columns,
  searchable = false,
  searchPlaceholder = "Search...",
  onRowClick,
  emptyMessage = "No data available",
  rowHeight = 52,
  maxHeight = 600,
}: VirtualizedDataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortConfig, setSortConfig] = React.useState<{
    key: string
    direction: "asc" | "desc"
  } | null>(null)

  const parentRef = React.useRef<HTMLDivElement>(null)

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data
    return [...data].sort((a, b) => {
      const column = columns.find((col) => col.key === sortConfig.key)
      if (!column) return 0
      const aValue = column.accessor(a)
      const bValue = column.accessor(b)
      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      const comparison = String(aValue).localeCompare(String(bValue))
      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }, [data, sortConfig, columns])

  const filteredData = React.useMemo(() => {
    if (!searchQuery) return sortedData
    return sortedData.filter((item) =>
      columns.some((column) => {
        const value = column.accessor(item)
        return String(value).toLowerCase().includes(searchQuery.toLowerCase())
      })
    )
  }, [sortedData, searchQuery, columns])

  const useVirtualization = filteredData.length > 50

  const virtualizer = useVirtualizer({
    count: filteredData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  })

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(column.sortable && "cursor-pointer select-none")}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && sortConfig?.key === column.key && (
                      <span>
                        {sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>

        {filteredData.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : useVirtualization ? (
          <div
            ref={parentRef}
            style={{ maxHeight, overflow: "auto" }}
          >
            <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const item = filteredData[virtualRow.index]
                return (
                  <div
                    key={item.id}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className={cn(
                      "flex items-center border-b px-4 hover:bg-muted/50 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <div key={column.key} className="py-3 flex-1" style={{ width: column.width }}>
                        {column.accessor(item)}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <Table>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key}>{column.accessor(item)}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {filteredData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {filteredData.length} of {data.length} items
          </div>
        </div>
      )}
    </div>
  )
}

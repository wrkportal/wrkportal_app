'use client'

import * as React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
    key: string
    header: string
    accessor: (item: T) => React.ReactNode
    sortable?: boolean
    width?: string
}

interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    searchable?: boolean
    searchPlaceholder?: string
    onRowClick?: (item: T) => void
    emptyMessage?: string
}

export function DataTable<T extends { id: string }>({
    data,
    columns,
    searchable = false,
    searchPlaceholder = "Search...",
    onRowClick,
    emptyMessage = "No data available",
}: DataTableProps<T>) {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [sortConfig, setSortConfig] = React.useState<{
        key: string
        direction: "asc" | "desc"
    } | null>(null)

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
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    {emptyMessage}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    onClick={() => onRowClick?.(item)}
                                    className={cn(onRowClick && "cursor-pointer")}
                                >
                                    {columns.map((column) => (
                                        <TableCell key={column.key}>{column.accessor(item)}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
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


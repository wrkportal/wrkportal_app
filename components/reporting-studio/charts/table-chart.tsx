'use client'

import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TableChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function TableChart({ config, data }: TableChartProps) {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
  }

  // Get all unique keys from the data
  const columns = Array.from(
    new Set(data.flatMap(Object.keys))
  ).filter(key => key !== '__typename') // Filter out GraphQL specific fields

  // If series are defined, use those fields
  const displayColumns = config.series && config.series.length > 0
    ? config.series.map(s => s.field)
    : columns

  return (
    <ScrollArea className="h-full w-full">
      <Table>
        <TableHeader>
          <TableRow>
            {displayColumns.map((column) => (
              <TableHead key={column}>
                {config.series?.find(s => s.field === column)?.label || column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {displayColumns.map((column) => {
                const value = row[column]
                let displayValue: React.ReactNode = value

                // Format based on data type
                if (value === null || value === undefined) {
                  displayValue = <span className="text-muted-foreground">—</span>
                } else if (typeof value === 'number') {
                  displayValue = value.toLocaleString()
                } else if (value instanceof Date) {
                  displayValue = value.toLocaleDateString()
                } else {
                  displayValue = String(value)
                }

                return (
                  <TableCell key={column}>
                    {displayValue}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}


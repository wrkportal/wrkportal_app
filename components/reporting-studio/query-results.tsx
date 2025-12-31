'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  Database,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface QueryResultsProps {
  results: {
    columns: string[]
    rows: any[]
    rowCount: number
    executionTime: number
    performance?: {
      performance: 'excellent' | 'good' | 'fair' | 'poor'
      recommendations: string[]
    }
    optimizationPlan?: {
      estimatedRows: number
      estimatedCost: number
      warnings?: string[]
    }
  } | null
  isLoading: boolean
  error: string | null
}

export function QueryResults({ results, isLoading, error }: QueryResultsProps) {
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv')

  const handleExport = () => {
    if (!results) return

    if (exportFormat === 'csv') {
      // Generate CSV
      const headers = results.columns.join(',')
      const rows = results.rows.map((row) =>
        results.columns.map((col) => {
          const value = row[col]
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value ?? ''
        }).join(',')
      )
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `query-results-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Generate JSON
      const json = JSON.stringify(results.rows, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `query-results-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!results) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No query results yet</p>
            <p className="text-sm mt-2">Execute a query to see results here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Query Results</CardTitle>
              <CardDescription>
                {results.rowCount.toLocaleString()} row{results.rowCount !== 1 ? 's' : ''} returned
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'json')}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
              </select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{results.rowCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Rows</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{results.columns.length}</div>
              <div className="text-xs text-muted-foreground">Columns</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                <Clock className="h-4 w-4" />
                {results.executionTime}ms
              </div>
              <div className="text-xs text-muted-foreground">Execution Time</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              {results.performance && (
                <>
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    <Badge
                      className={
                        results.performance.performance === 'excellent'
                          ? 'bg-green-100 text-green-800'
                          : results.performance.performance === 'good'
                          ? 'bg-blue-100 text-blue-800'
                          : results.performance.performance === 'fair'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }
                    >
                      {results.performance.performance}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Performance</div>
                </>
              )}
            </div>
          </div>

          {/* Performance Recommendations */}
          {results.performance && results.performance.recommendations.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Performance Recommendations:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {results.performance.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Optimization Warnings */}
          {results.optimizationPlan && results.optimizationPlan.warnings && results.optimizationPlan.warnings.length > 0 && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Optimization Warnings:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {results.optimizationPlan.warnings.map((warning, idx) => (
                    <li key={idx}>{warning}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent>
          {results.rows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No rows returned</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {results.columns.map((col) => (
                      <TableHead key={col} className="font-semibold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {results.columns.map((col) => (
                        <TableCell key={col} className="max-w-[200px] truncate">
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Download, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface QueryResult {
  columns: string[]
  rows: any[][]
  rowCount: number
  executionTime: number
  cached: boolean
}

export function QueryResults({ result }: { result: QueryResult | null }) {
  if (!result) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          Execute a query to see results
        </CardContent>
      </Card>
    )
  }

  const handleCopyResults = () => {
    // Copy results as CSV
    const csv = [
      result.columns.join(','),
      ...result.rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n')
    
    navigator.clipboard.writeText(csv)
    alert('Results copied to clipboard as CSV')
  }

  const handleDownloadCSV = () => {
    const csv = [
      result.columns.join(','),
      ...result.rows.map(row => row.map(cell => 
        typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell
      ).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `query-results-${Date.now()}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Query Results</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {result.executionTime}ms
            </Badge>
            {result.cached && (
              <Badge variant="secondary">Cached</Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyResults}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCSV}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] w-full">
          <Table>
            <TableHeader>
              <TableRow>
                {result.columns.map((col, idx) => (
                  <TableHead key={idx} className="sticky top-0 bg-background z-10">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={result.columns.length} className="text-center py-8 text-muted-foreground">
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                result.rows.map((row, rowIdx) => (
                  <TableRow key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <TableCell key={cellIdx} className="max-w-[200px]">
                        <div className="truncate" title={String(cell)}>
                          {typeof cell === 'object' && cell !== null 
                            ? JSON.stringify(cell) 
                            : cell === null || cell === undefined
                            ? <span className="text-muted-foreground">null</span>
                            : String(cell)
                          }
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        {result.rows.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing all {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
















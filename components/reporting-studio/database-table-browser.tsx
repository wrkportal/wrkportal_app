'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Database, RefreshCw, Table as TableIcon, Eye } from 'lucide-react'

interface DatabaseTableBrowserProps {
  open: boolean
  onClose: () => void
  dataSourceId: string
}

interface DatabaseTable {
  name: string
  schema?: string
  type: 'table' | 'view'
  rowCount?: number
}

export function DatabaseTableBrowser({
  open,
  onClose,
  dataSourceId,
}: DatabaseTableBrowserProps) {
  const [tables, setTables] = useState<DatabaseTable[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && dataSourceId) {
      fetchTables()
    }
  }, [open, dataSourceId])

  const fetchTables = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reporting-studio/data-sources/${dataSourceId}/tables`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch tables')
      }

      const data = await response.json()
      setTables(data.tables || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load tables')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Database Tables</DialogTitle>
          <DialogDescription>
            Browse tables and views in this database connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refresh Button */}
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchTables} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12 text-destructive">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{error}</p>
            </div>
          )}

          {/* Tables List */}
          {!isLoading && !error && (
            <>
              {tables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TableIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tables found</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] rounded-md border">
                  <div className="p-4">
                    <div className="grid gap-2">
                      {tables.map((table, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <TableIcon className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{table.name}</p>
                                <Badge variant="outline" className="text-xs">
                                  {table.type}
                                </Badge>
                                {table.schema && (
                                  <Badge variant="secondary" className="text-xs">
                                    {table.schema}
                                  </Badge>
                                )}
                              </div>
                              {table.rowCount !== undefined && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {table.rowCount.toLocaleString()} rows
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


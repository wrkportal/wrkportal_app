'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface FilePreviewDialogProps {
  open: boolean
  onClose: () => void
  fileId: string
  fileName: string
}

export function FilePreviewDialog({ open, onClose, fileId, fileName }: FilePreviewDialogProps) {
  const [data, setData] = useState<any[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [limit, setLimit] = useState(100)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && fileId) {
      fetchPreview()
    }
  }, [open, fileId, limit])

  const fetchPreview = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/reporting-studio/files/${fileId}/preview?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to load preview')
      }

      const result = await response.json()
      setData(result.data.rows || [])
      setColumns(result.data.columns?.map((col: any) => col.columnName) || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load preview')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview: {fileName}</DialogTitle>
          <DialogDescription>
            View a sample of your file data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="limit">Rows:</Label>
              <Input
                id="limit"
                type="number"
                min={10}
                max={1000}
                value={limit}
                onChange={(e) => setLimit(Math.min(1000, Math.max(10, parseInt(e.target.value) || 100)))}
                className="w-24"
              />
            </div>
            <Button onClick={fetchPreview} variant="outline" size="sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Refresh
            </Button>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-destructive">
              <p>{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No data available</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="font-semibold">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx}>
                      {columns.map((col) => (
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

          {/* Info */}
          <div className="text-sm text-muted-foreground">
            Showing {data.length} of {limit} rows (limited for performance)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


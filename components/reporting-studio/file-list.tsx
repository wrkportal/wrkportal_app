'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  File,
  Search,
  Eye,
  Trash2,
  Download,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Database,
  Loader2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { FilePreviewDialog } from './file-preview-dialog'
import { SchemaViewerDialog } from './schema-viewer-dialog'

interface ReportingFile {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  rowCount: number | null
  columnCount: number | null
  isMerged: boolean
  uploadedAt: string
}

export function FileList() {
  const [files, setFiles] = useState<ReportingFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFile, setSelectedFile] = useState<ReportingFile | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [schemaOpen, setSchemaOpen] = useState(false)

  useEffect(() => {
    fetchFiles()
  }, [])

  const fetchFiles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/files')
      if (response.ok) {
        const data = await response.json()
        setFiles(data.files || [])
      }
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/reporting-studio/files/${fileId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setFiles(files.filter(f => f.id !== fileId))
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to delete file' }))
        alert(error.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      alert('Failed to delete file')
    }
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['xlsx', 'xls'].includes(ext || '')) {
      return <FileSpreadsheet className="h-5 w-5 text-green-600" />
    }
    if (ext === 'csv') {
      return <FileText className="h-5 w-5 text-blue-600" />
    }
    if (ext === 'json') {
      return <Database className="h-5 w-5 text-purple-600" />
    }
    return <File className="h-5 w-5 text-muted-foreground" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const filteredFiles = files.filter(file =>
    file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                Manage your data files for reporting and analysis
              </CardDescription>
            </div>
            <Button onClick={fetchFiles} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Files Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files found</p>
              {searchQuery && <p className="text-sm mt-2">Try a different search term</p>}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Columns</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.originalName)}
                          <div>
                            <p className="font-medium text-sm">{file.originalName}</p>
                            <p className="text-xs text-muted-foreground">{file.type || 'Unknown'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatFileSize(file.size)}</TableCell>
                      <TableCell>
                        {file.rowCount !== null ? file.rowCount.toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>{file.columnCount || 'N/A'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(file.uploadedAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(file)
                              setPreviewOpen(true)
                            }}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(file)
                              setSchemaOpen(true)
                            }}
                            title="View Schema"
                          >
                            <Database className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(file.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {selectedFile && (
        <>
          <FilePreviewDialog
            open={previewOpen}
            onClose={() => {
              setPreviewOpen(false)
              setSelectedFile(null)
            }}
            fileId={selectedFile.id}
            fileName={selectedFile.originalName}
          />
          <SchemaViewerDialog
            open={schemaOpen}
            onClose={() => {
              setSchemaOpen(false)
              setSelectedFile(null)
            }}
            fileId={selectedFile.id}
            fileName={selectedFile.originalName}
          />
        </>
      )}
    </div>
  )
}


'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (file: any, schema: any) => void
}

interface UploadResult {
  file: any
  schema?: any
  preview?: {
    rows: any[]
    columns: any[]
  }
}

export function FileUploadDialog({ open, onClose, onSuccess }: FileUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allowedTypes = ['.csv', '.xlsx', '.xls', '.json']
  const maxFileSize = 100 * 1024 * 1024 // 100MB

  const validateFile = (file: File): string | null => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(extension)) {
      return `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(0)}MB`
    }
    return null
  }

  const handleFileSelect = (file: File) => {
    const error = validateFile(file)
    if (error) {
      setErrorMessage(error)
      return
    }
    setSelectedFile(file)
    setErrorMessage('')
    setUploadStatus('idle')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file')
      return
    }

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/reporting-studio/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setUploadProgress(100)
      setUploadStatus('processing')

      // Wait a moment to show processing state
      await new Promise(resolve => setTimeout(resolve, 500))

      setUploadResult({
        file: data.file,
        schema: data.schema,
      })
      setUploadStatus('completed')

      if (onSuccess) {
        onSuccess(data.file, data.schema)
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        resetDialog()
        onClose()
      }, 2000)
    } catch (error: any) {
      setUploadStatus('error')
      setErrorMessage(error.message || 'Failed to upload file')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const resetDialog = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadStatus('idle')
    setErrorMessage('')
    setUploadResult(null)
    setIsDragging(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    if (uploadStatus !== 'uploading' && uploadStatus !== 'processing') {
      resetDialog()
      onClose()
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Data File</DialogTitle>
          <DialogDescription>
            Upload CSV, Excel, or JSON files for analysis and reporting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              onChange={handleInputChange}
              className="hidden"
            />
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                uploadStatus === 'completed' && "border-green-500 bg-green-50 dark:bg-green-950"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadStatus === 'completed' ? (
                <div className="space-y-2">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                  <h3 className="font-semibold text-green-700 dark:text-green-400">Upload Successful!</h3>
                  <p className="text-sm text-muted-foreground">
                    File uploaded and schema detected successfully
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Upload File</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop files here or click to browse
                  </p>
                  <Button variant="outline" type="button" onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4">
                    Supported: CSV, Excel (.xlsx, .xls), JSON (max {formatFileSize(maxFileSize)})
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Selected File Info */}
          {selectedFile && uploadStatus !== 'completed' && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <File className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
                </span>
                <span className="text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Upload Result Summary */}
          {uploadResult && uploadStatus === 'completed' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">File uploaded successfully!</p>
                  {uploadResult.schema && (
                    <div className="text-xs text-muted-foreground mt-2">
                      <p>Rows: {uploadResult.file.rowCount?.toLocaleString() || 'N/A'}</p>
                      <p>Columns: {uploadResult.file.columnCount || 'N/A'}</p>
                      {uploadResult.schema.primaryKeys && uploadResult.schema.primaryKeys.length > 0 && (
                        <p>Primary Keys: {uploadResult.schema.primaryKeys.join(', ')}</p>
                      )}
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadStatus === 'completed'}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing...'}
              </>
            ) : (
              'Upload File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface FileUploadDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  uploadType: 'BUDGET' | 'COST' | 'INVOICE' | 'TIMESHEET' | 'RATE_CARD' | 'FORECAST'
  budgetId?: string // Required for COST uploads
}

export function FileUploadDialog({ open, onClose, onSuccess, uploadType, budgetId }: FileUploadDialogProps) {
  const user = useAuthStore((state) => state.user)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [fileId, setFileId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        setErrorMessage('Please select an Excel (.xlsx, .xls) or CSV file')
        return
      }
      setSelectedFile(file)
      setErrorMessage('')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file')
      return
    }

    if (uploadType === 'COST' && !budgetId) {
      setErrorMessage('Please select a budget for cost uploads')
      return
    }

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadProgress(0)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('uploadType', uploadType)
      if (budgetId) {
        formData.append('budgetId', budgetId)
      }

      const response = await fetch('/api/finance/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setFileId(data.file.id)
      setUploadStatus('processing')
      setUploadProgress(50)

      // Poll for processing status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(`/api/finance/files/${data.file.id}`)
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            const file = statusData.file

            if (file.status === 'COMPLETED') {
              clearInterval(pollInterval)
              setUploadStatus('completed')
              setUploadProgress(100)
              setTimeout(() => {
                onSuccess()
                onClose()
                resetDialog()
              }, 2000)
            } else if (file.status === 'FAILED') {
              clearInterval(pollInterval)
              setUploadStatus('error')
              setErrorMessage(file.errorMessage || 'Processing failed')
              setUploadProgress(0)
            } else if (file.status === 'PARTIALLY_PROCESSED') {
              setUploadProgress(75)
            }
          }
        } catch (error) {
          clearInterval(pollInterval)
          setUploadStatus('error')
          setErrorMessage('Error checking upload status')
        }
      }, 2000)

      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(pollInterval)
        if (uploadStatus === 'processing') {
          setUploadStatus('error')
          setErrorMessage('Upload is taking longer than expected. Please check status later.')
        }
      }, 60000)
    } catch (error: any) {
      setUploadStatus('error')
      setErrorMessage(error.message || 'Upload failed')
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
    setFileId(null)
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload {uploadType} File</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import {uploadType.toLowerCase()} data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                id="file"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex items-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2 flex-1">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    {!isUploading && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {uploadType === 'COST' && !budgetId && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Please select a budget in the Costs tab before uploading cost data.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {uploadStatus === 'uploading' ? 'Uploading...' : 'Processing file...'}
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          ) : uploadStatus === 'completed' ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-800">File uploaded and processed successfully!</p>
            </div>
          ) : null}

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">File Format Requirements:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Supported formats: Excel (.xlsx, .xls) or CSV</li>
              <li>First row should contain column headers</li>
              <li>Required columns will be auto-detected</li>
              <li>Download template for reference (coming soon)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
            {uploadStatus === 'completed' ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || uploadStatus === 'processing' || (uploadType === 'COST' && !budgetId)}
          >
            {isUploading || uploadStatus === 'processing' ? (
              'Uploading...'
            ) : uploadStatus === 'completed' ? (
              'Done'
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


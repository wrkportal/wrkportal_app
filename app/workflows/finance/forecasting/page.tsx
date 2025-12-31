'use client'

import React, { useState, useEffect } from 'react'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Calendar, Database, Loader2, Upload, X, Settings, ChevronRight } from 'lucide-react'

interface DatabaseFile {
  id: string
  name: string
  originalName: string
  size: number
  type: string
  rowCount?: number | null
  columnCount?: number | null
  uploadedAt: string
  source?: 'database' | 'session'
  data?: TableData // For session files, store the actual data
}

interface TableData {
  columns: string[]
  rows: any[][]
}

export default function ForecastingPage() {
  const [files, setFiles] = useState<DatabaseFile[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [tableData, setTableData] = useState<TableData | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  
  // File properties/settings
  const [rowHeight, setRowHeight] = useState(40)
  const [columnWidth, setColumnWidth] = useState(120)
  const [mainCategories, setMainCategories] = useState<Record<string, { name: string; color: string }>>({})
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({})
  const [selectedMainCategory, setSelectedMainCategory] = useState<string>('')
  const [newMainCategory, setNewMainCategory] = useState('')
  const [newSubCategory, setNewSubCategory] = useState('')
  const [categoryColumnIndex, setCategoryColumnIndex] = useState<number | null>(null)
  
  useEffect(() => {
    // Load files from both database and sessionStorage
    const loadFiles = async () => {
      try {
        // Load from database
        const dbResponse = await fetch('/api/reporting-studio/files')
        let dbFiles: DatabaseFile[] = []
        if (dbResponse.ok) {
          const dbData = await dbResponse.json()
          dbFiles = (dbData.files || []).map((file: any) => ({
            ...file,
            source: 'database' as const
          }))
        }

        // Load from sessionStorage
        let sessionFiles: DatabaseFile[] = []
        if (typeof window !== 'undefined') {
          const storedFiles = sessionStorage.getItem('forecasting_uploadedFiles')
          if (storedFiles) {
            sessionFiles = JSON.parse(storedFiles)
          }
        }

        // Combine both sources
        setFiles([...dbFiles, ...sessionFiles])
      } catch (error) {
        console.error('Error loading files:', error)
        setFiles([])
      } finally {
        setLoading(false)
      }
    }
    loadFiles()
  }, [])

  // Clear files on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('forecasting_uploadedFiles')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Load file data when a file is selected
  useEffect(() => {
    if (selectedFileId) {
      const loadFileData = async () => {
        setIsLoadingData(true)
        setTableData(null)
        
        try {
          const selectedFile = files.find(f => f.id === selectedFileId)
          if (!selectedFile) return

          // Check if file is in sessionStorage (temporary file) or database
          if (selectedFile.source === 'session' && selectedFile.data) {
            // Load from sessionStorage
            setTableData(selectedFile.data)
          } else if (selectedFile.source === 'database') {
            // Load from API (database file)
            const limit = selectedFile.rowCount && selectedFile.rowCount > 0 
              ? selectedFile.rowCount 
              : 1000

            const response = await fetch(`/api/reporting-studio/preview/${selectedFileId}?limit=${limit}`)
            
            if (response.ok) {
              const data = await response.json()
              setTableData({
                columns: data.columns || [],
                rows: data.rows || []
              })
            } else {
              console.error('Failed to load file data')
            }
          } else {
            console.error('File source not recognized')
          }
        } catch (error) {
          console.error('Error loading file data:', error)
        } finally {
          setIsLoadingData(false)
        }
      }

      loadFileData()
    } else {
      setTableData(null)
    }
  }, [selectedFileId, files])

  // Open sidebar when file is selected
  useEffect(() => {
    if (selectedFileId) {
      setIsSidebarOpen(true)
    }
  }, [selectedFileId])

  // Load saved settings for selected file
  useEffect(() => {
    if (selectedFileId && typeof window !== 'undefined') {
      try {
        const savedSettings = sessionStorage.getItem(`forecasting_settings_${selectedFileId}`)
        if (savedSettings) {
          const settings = JSON.parse(savedSettings)
          setRowHeight(settings.rowHeight || 40)
          setColumnWidth(settings.columnWidth || 120)
          setMainCategories(settings.mainCategories || {})
          setSubCategories(settings.subCategories || {})
          setCategoryColumnIndex(settings.categoryColumnIndex ?? null)
        } else {
          // Reset to defaults
          setRowHeight(40)
          setColumnWidth(120)
          setMainCategories({})
          setSubCategories({})
          setCategoryColumnIndex(null)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }
  }, [selectedFileId])

  // Save settings when they change
  useEffect(() => {
    if (selectedFileId && typeof window !== 'undefined') {
      const settings = {
        rowHeight,
        columnWidth,
        mainCategories,
        subCategories,
        categoryColumnIndex
      }
      sessionStorage.setItem(`forecasting_settings_${selectedFileId}`, JSON.stringify(settings))
    }
  }, [selectedFileId, rowHeight, columnWidth, mainCategories, subCategories, categoryColumnIndex])


  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Read and parse the file
      const fileData = await readAndParseFile(file)
      
      // Create a temporary file object
      const tempFile: DatabaseFile = {
        id: `temp-${Date.now()}`,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        rowCount: fileData.rows.length,
        columnCount: fileData.columns.length,
        uploadedAt: new Date().toISOString(),
        source: 'session',
        data: fileData
      }

      // Add to files list and save to sessionStorage
      const updatedFiles = [...files, tempFile]
      setFiles(updatedFiles)
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('forecasting_uploadedFiles', JSON.stringify(updatedFiles))
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
      // Reset input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Helper function to read and parse file
  const readAndParseFile = (file: File): Promise<TableData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
          
          if (fileExt === '.csv') {
            // Parse CSV
            const lines = text.split('\n').filter(line => line.trim())
            if (lines.length === 0) {
              reject(new Error('File is empty'))
              return
            }
            
            const columns = lines[0].split(',').map(col => col.trim().replace(/^"|"$/g, ''))
            const rows = lines.slice(1).map(line => 
              line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
            )
            
            resolve({ columns, rows })
          } else if (fileExt === '.xlsx' || fileExt === '.xls') {
            // For Excel files, we'd need a library like xlsx
            // For now, show an error
            reject(new Error('Excel files require server-side processing. Please use CSV files.'))
          } else {
            reject(new Error('Unsupported file type. Please upload CSV files.'))
          }
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  // Handle file deletion
  const handleDeleteFile = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId)
    setFiles(updatedFiles)
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('forecasting_uploadedFiles', JSON.stringify(updatedFiles))
    }
    
    // Clear selection if deleted file was selected
    if (selectedFileId === fileId) {
      setSelectedFileId('')
      setTableData(null)
    }
  }

  const selectedFile = files.find(f => f.id === selectedFileId);

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top Bar */}
        <FinanceNavBar />

        {/* Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-8 py-4 lg:py-6 min-w-0">
          <div className="space-y-6 w-full max-w-full min-w-0 overflow-x-hidden">
            {/* File Selector Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Upload File for Forecasting
                </CardTitle>
                <CardDescription>
                  Upload a CSV file to use for forecasting. Files will be cleared when you refresh, navigate away, or log out.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="file-select">Select File</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="file-upload"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={isUploading}
                        className="h-7 text-xs"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        {isUploading ? 'Uploading...' : 'Upload CSV'}
                      </Button>
                    </div>
                  </div>
                  <Select
                    value={selectedFileId}
                    onValueChange={setSelectedFileId}
                    disabled={loading}
                  >
                    <SelectTrigger id="file-select" className="mt-1">
                      <SelectValue placeholder={loading ? "Loading files..." : "Select a file"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loading ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          Loading files...
                        </div>
                      ) : files.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          No files found. Upload a CSV file to get started.
                        </div>
                      ) : (
                        <>
                          {files.filter(f => f.source === 'database').length > 0 && (
                            <>
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Database Files
                              </div>
                              {files.filter(f => f.source === 'database').map((file) => (
                                <SelectItem key={file.id} value={file.id}>
                                  {file.originalName || file.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                          {files.filter(f => f.source === 'session').length > 0 && (
                            <>
                              {files.filter(f => f.source === 'database').length > 0 && (
                                <div className="border-t my-1" />
                              )}
                              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                Uploaded Files (Temporary)
                              </div>
                              {files.filter(f => f.source === 'session').map((file) => (
                                <SelectItem key={file.id} value={file.id}>
                                  {file.originalName || file.name}
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFile && (
                  <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{selectedFile.originalName || selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteFile(selectedFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {selectedFile.rowCount && (
                            <span>{selectedFile.rowCount.toLocaleString()} rows</span>
                          )}
                          {selectedFile.columnCount && (
                            <span>{selectedFile.columnCount} columns</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedFile.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* File Data Display */}
            {selectedFile && (
              <div className="flex gap-4 w-full">
                <Card className={`flex-1 max-w-full overflow-hidden min-w-0 transition-all`}>
                  <CardHeader className="min-w-0">
                    <div className="flex items-center justify-between min-w-0 mb-2">
                      <CardTitle className="flex items-center justify-between min-w-0 flex-1">
                        <span className="truncate pr-2 min-w-0">File Data: {selectedFile.originalName || selectedFile.name}</span>
                        {selectedFile.rowCount && selectedFile.columnCount && (
                          <span className="text-sm font-normal text-muted-foreground shrink-0 ml-2">
                            {selectedFile.rowCount.toLocaleString()} rows × {selectedFile.columnCount} columns
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="ml-2 shrink-0"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {isSidebarOpen ? 'Hide' : 'Show'} Properties
                      </Button>
                    </div>
                    <CardDescription>
                      Preview of the selected file data
                    </CardDescription>
                  </CardHeader>
                <CardContent className="overflow-hidden p-0 w-full max-w-full min-w-0">
                  {isLoadingData ? (
                    <div className="flex items-center justify-center py-12 px-6">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Loading file data...</p>
                      </div>
                    </div>
                  ) : tableData ? (
                    <div className="w-full border rounded-lg min-w-0 overflow-hidden" style={{ maxWidth: '100%' }}>
                      <div 
                        className="overflow-x-auto overflow-y-auto min-w-0" 
                        style={{ 
                          maxHeight: '600px', 
                          width: '100%'
                        }}
                      >
                        <table className="border-collapse bg-background" style={{ width: 'max-content', minWidth: '100%' }}>
                            <thead className="bg-muted sticky top-0 z-10">
                              <tr>
                                {tableData.columns.map((column, idx) => (
                                  <th
                                    key={idx}
                                    className="px-4 py-3 text-left text-sm font-semibold border-b border-r"
                                    style={{ 
                                      minWidth: columnWidth,
                                      width: columnWidth
                                    }}
                                  >
                                    <div className="truncate" title={column} style={{ maxWidth: `${columnWidth - 20}px` }}>
                                      {column}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {tableData.rows.length === 0 ? (
                                <tr>
                                  <td 
                                    colSpan={tableData.columns.length} 
                                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                                  >
                                    No data available
                                  </td>
                                </tr>
                              ) : (
                                tableData.rows.map((row, rowIdx) => {
                                  // Check if this row matches a main category
                                  const rowCategoryValue = categoryColumnIndex !== null 
                                    ? String(row[categoryColumnIndex] || '').trim()
                                    : ''
                                  const matchingCategory = Object.values(mainCategories).find(
                                    cat => cat.name.toLowerCase() === rowCategoryValue.toLowerCase()
                                  )
                                  const rowStyle = {
                                    height: `${rowHeight}px`,
                                    fontWeight: matchingCategory ? ('bold' as const) : ('normal' as const),
                                    backgroundColor: matchingCategory ? matchingCategory.color : 'transparent'
                                  }
                                  
                                  return (
                                    <tr
                                      key={rowIdx}
                                      className={matchingCategory ? 'transition-colors' : 'hover:bg-muted/50 transition-colors'}
                                      style={rowStyle}
                                    >
                                      {row.map((cell, cellIdx) => (
                                        <td
                                          key={cellIdx}
                                          className="px-4 py-2 text-sm border-b border-r"
                                          style={{ 
                                            minWidth: columnWidth,
                                            width: columnWidth
                                          }}
                                        >
                                        <div className="truncate" title={cell !== null && cell !== undefined ? String(cell) : '-'}>
                                          {cell !== null && cell !== undefined ? String(cell) : '-'}
                                        </div>
                                      </td>
                                    ))}
                                  </tr>
                                  )
                                })
                              )}
                            </tbody>
                          </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground px-6">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Properties Sidebar */}
              {isSidebarOpen && (
                <Card className="w-80 shrink-0 border-l">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">File Properties</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsSidebarOpen(false)}
                        className="h-6 w-6"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardDescription>
                      Configure rows, columns, and categories
                    </CardDescription>
                  </CardHeader>
                  <ScrollArea className="h-[calc(100vh-200px)]">
                    <CardContent className="p-4 space-y-6">
                      {/* Row Height */}
                      <div>
                        <Label htmlFor="row-height">Row Height (px)</Label>
                        <Input
                          id="row-height"
                          type="number"
                          min="20"
                          max="100"
                          value={rowHeight}
                          onChange={(e) => setRowHeight(Number(e.target.value) || 40)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Adjust the height of table rows
                        </p>
                      </div>

                      {/* Column Width */}
                      <div>
                        <Label htmlFor="column-width">Column Width (px)</Label>
                        <Input
                          id="column-width"
                          type="number"
                          min="50"
                          max="500"
                          value={columnWidth}
                          onChange={(e) => setColumnWidth(Number(e.target.value) || 120)}
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Adjust the width of all table columns
                        </p>
                      </div>

                      {/* Category Column Selector */}
                      {tableData && tableData.columns.length > 0 && (
                        <div>
                          <Label>Category Column</Label>
                          <Select
                            value={categoryColumnIndex !== null ? String(categoryColumnIndex) : 'none'}
                            onValueChange={(value) => {
                              if (value === 'none') {
                                setCategoryColumnIndex(null)
                              } else {
                                setCategoryColumnIndex(Number(value))
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8 text-xs">
                              <SelectValue placeholder="Select column for categories" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {tableData.columns.map((column, idx) => (
                                <SelectItem key={idx} value={String(idx)}>
                                  {column}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select which column contains category values
                          </p>
                        </div>
                      )}

                      {/* Main Categories */}
                      <div>
                        <Label>Main Categories</Label>
                        <div className="space-y-2 mt-2">
                          <div className="flex gap-2">
                            <Input
                              value={newMainCategory}
                              onChange={(e) => setNewMainCategory(e.target.value)}
                              placeholder="Add main category"
                              className="flex-1 h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newMainCategory.trim()) {
                                  e.preventDefault()
                                  const categoryKey = newMainCategory.trim().toLowerCase()
                                  if (!mainCategories[categoryKey]) {
                                    setMainCategories({
                                      ...mainCategories,
                                      [categoryKey]: {
                                        name: newMainCategory.trim(),
                                        color: '#e0e7ff' // Default light blue
                                      }
                                    })
                                    setNewMainCategory('')
                                  }
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newMainCategory.trim()) {
                                  const categoryKey = newMainCategory.trim().toLowerCase()
                                  if (!mainCategories[categoryKey]) {
                                    setMainCategories({
                                      ...mainCategories,
                                      [categoryKey]: {
                                        name: newMainCategory.trim(),
                                        color: '#e0e7ff' // Default light blue
                                      }
                                    })
                                    setNewMainCategory('')
                                  }
                                }
                              }}
                              className="h-8"
                            >
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(mainCategories).map(([key, category]) => (
                              <div key={key} className="p-2 bg-muted rounded text-sm space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{category.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => {
                                      const newCategories = { ...mainCategories }
                                      delete newCategories[key]
                                      setMainCategories(newCategories)
                                      // Remove subcategories for this main category
                                      const newSubCategories = { ...subCategories }
                                      delete newSubCategories[category.name]
                                      setSubCategories(newSubCategories)
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Label htmlFor={`color-${key}`} className="text-xs">Color:</Label>
                                  <Input
                                    id={`color-${key}`}
                                    type="color"
                                    value={category.color}
                                    onChange={(e) => {
                                      setMainCategories({
                                        ...mainCategories,
                                        [key]: {
                                          ...category,
                                          color: e.target.value
                                        }
                                      })
                                    }}
                                    className="h-6 w-16 p-0 border-0 cursor-pointer"
                                  />
                                  <span className="text-xs text-muted-foreground">{category.color}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Sub Categories */}
                      {Object.keys(mainCategories).length > 0 && (
                        <div>
                          <Label>Sub Categories</Label>
                          <div className="space-y-3 mt-2">
                            <Select
                              value={selectedMainCategory}
                              onValueChange={setSelectedMainCategory}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select main category" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(mainCategories).map((category) => (
                                  <SelectItem key={category.name} value={category.name}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {selectedMainCategory && (
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={newSubCategory}
                                    onChange={(e) => setNewSubCategory(e.target.value)}
                                    placeholder="Add sub category"
                                    className="flex-1 h-8 text-xs"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && newSubCategory.trim()) {
                                        e.preventDefault()
                                        const currentSubs = subCategories[selectedMainCategory] || []
                                        if (!currentSubs.includes(newSubCategory.trim())) {
                                          setSubCategories({
                                            ...subCategories,
                                            [selectedMainCategory]: [...currentSubs, newSubCategory.trim()]
                                          })
                                          setNewSubCategory('')
                                        }
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (newSubCategory.trim()) {
                                        const currentSubs = subCategories[selectedMainCategory] || []
                                        if (!currentSubs.includes(newSubCategory.trim())) {
                                          setSubCategories({
                                            ...subCategories,
                                            [selectedMainCategory]: [...currentSubs, newSubCategory.trim()]
                                          })
                                          setNewSubCategory('')
                                        }
                                      }
                                    }}
                                    className="h-8"
                                  >
                                    <ChevronRight className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  {(subCategories[selectedMainCategory] || []).map((subCat, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                      <span>{subCat}</span>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5"
                                        onClick={() => {
                                          const currentSubs = subCategories[selectedMainCategory] || []
                                          setSubCategories({
                                            ...subCategories,
                                            [selectedMainCategory]: currentSubs.filter((_, i) => i !== idx)
                                          })
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </ScrollArea>
                </Card>
              )}
            </div>
            )}

            {/* Forecasting Overview */}
            {!selectedFile && (
              <Card>
                <CardHeader>
                  <CardTitle>Forecasting Overview</CardTitle>
                </CardHeader>
                <CardContent>
            <p className="text-sm text-muted-foreground">
                    Financial forecasting and projections will be displayed here. Upload a CSV file to begin.
            </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

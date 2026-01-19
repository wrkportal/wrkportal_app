'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  Sparkles, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Table, 
  TrendingUp,
  Activity,
  Map,
  Gauge,
  Type,
  Save,
  X,
  Eye,
  Palette,
  Settings,
  Database,
  Zap,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { FilterBuilder, FilterCondition } from './filter-builder'

interface VisualizationBuilderProps {
  queryId?: string
  functionalArea: string
  visualization?: any // For editing existing visualization
  onSave?: (visualization: any) => void
  onCancel?: () => void
}

const CHART_TYPES = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart3, description: 'Compare values across categories' },
  { value: 'line', label: 'Line Chart', icon: LineChart, description: 'Show trends over time' },
  { value: 'dual-axis', label: 'Dual Axis Chart', icon: TrendingUp, description: 'Combine bar and line charts with two Y-axes' },
  { value: 'pie', label: 'Pie Chart', icon: PieChart, description: 'Show proportions' },
  { value: 'area', label: 'Area Chart', icon: Activity, description: 'Show cumulative values' },
  { value: 'scatter', label: 'Scatter Plot', icon: TrendingUp, description: 'Show correlations' },
  { value: 'table', label: 'Data Table', icon: Table, description: 'Display raw data' },
  { value: 'kpi', label: 'KPI Card', icon: Gauge, description: 'Single metric display' },
  { value: 'heatmap', label: 'Heatmap', icon: Map, description: 'Show density patterns' },
]

export function VisualizationBuilder({ queryId, functionalArea, visualization, onSave, onCancel }: VisualizationBuilderProps) {
  const { toast } = useToast()
  // If editing, start at step 2 (chart type) since data source is already set
  const [step, setStep] = useState(visualization ? 2 : 1)
  const [loading, setLoading] = useState(false)
  const [dataSources, setDataSources] = useState<any[]>([])
  const [selectedDataSource, setSelectedDataSource] = useState<string>('')
  const [queries, setQueries] = useState<any[]>([])
  const [selectedQuery, setSelectedQuery] = useState<string>(queryId || '')
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [availableFields, setAvailableFields] = useState<any[]>([])
  const [selectedDataSourcePreview, setSelectedDataSourcePreview] = useState<any>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [deletingDataSource, setDeletingDataSource] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  
  const [formData, setFormData] = useState(() => ({
    name: visualization?.name || '',
    description: visualization?.description || '',
    type: visualization?.type || 'bar',
    config: {
      colors: visualization?.config?.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      showLegend: visualization?.config?.showLegend !== false,
      showGrid: visualization?.config?.showGrid !== false,
      showLabels: visualization?.config?.showLabels || false,
      textContent: visualization?.config?.textContent || '',
    },
    defaultWidth: visualization?.defaultWidth || 6,
    defaultHeight: visualization?.defaultHeight || 4,
    tags: visualization?.tags || [] as string[],
    // Chart configuration
    xAxis: visualization?.config?.xAxis || visualization?.xAxis || {
      field: '',
      label: '',
      type: 'category', // category, time, value
    },
    yAxis: visualization?.config?.yAxis || visualization?.yAxis || {
      fields: [] as string[],
      aggregation: 'sum', // sum, count, avg, min, max
      label: '',
    },
    // Dual-axis configuration
    dualAxis: visualization?.config?.dualAxis || {
      leftAxis: {
        fields: [] as string[],
        chartType: 'bar' as 'bar' | 'line',
        aggregation: 'sum' as 'sum' | 'count' | 'avg' | 'min' | 'max',
        label: '',
      },
      rightAxis: {
        fields: [] as string[],
        chartType: 'line' as 'bar' | 'line',
        aggregation: 'sum' as 'sum' | 'count' | 'avg' | 'min' | 'max',
        label: '',
      },
    },
    filters: visualization?.config?.filters || [] as FilterCondition[],
  }))

  useEffect(() => {
    fetchDataSources()
    if (queryId) {
      setSelectedQuery(queryId)
    }
    if (visualization) {
      // Load existing visualization data
      if (visualization.queryId) {
        setSelectedQuery(visualization.queryId)
      }
      if (visualization.query?.dataSourceId) {
        setSelectedDataSource(visualization.query.dataSourceId)
        // Load fields
        fetch(`/api/reporting-engine/data-sources/${visualization.query.dataSourceId}`)
          .then(res => res.json())
          .then(data => {
            if (data.dataSource?.schema?.fields) {
              setAvailableFields(data.dataSource.schema.fields)
            }
          })
          .catch(console.error)
      }
    }
  }, [queryId, functionalArea, visualization])

  // Fetch preview data when a data source is selected
  useEffect(() => {
    if (selectedDataSource) {
      // Clear uploaded file state when selecting existing data source
      if (uploadedFile) {
        setUploadedFile(null)
        setSelectedFile(null)
      }
      fetchDataSourcePreview(selectedDataSource)
    } else {
      setSelectedDataSourcePreview(null)
    }
  }, [selectedDataSource])

  const fetchQueries = async (dataSourceId: string) => {
    // This would fetch queries for a specific data source
    // For now, we'll use the queryId from upload response
  }

  const fetchDataSources = async () => {
    try {
      const response = await fetch(`/api/reporting-engine/data-sources?functionalArea=${functionalArea}`)
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.dataSources || [])
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    }
  }

  const handleDeleteDataSource = async (dataSourceId: string) => {
    setDeletingDataSource(dataSourceId)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteDataSource = async () => {
    if (!deletingDataSource) return

    try {
      const response = await fetch(`/api/reporting-engine/data-sources/${deletingDataSource}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete data source')
      }

      const result = await response.json()
      
      // If this was the selected data source, clear it
      if (selectedDataSource === deletingDataSource) {
        setSelectedDataSource('')
        setSelectedDataSourcePreview(null)
        setAvailableFields([])
      }

      // Refresh the data sources list
      await fetchDataSources()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete data source',
        variant: 'destructive',
      })
    } finally {
      setDeleteConfirmOpen(false)
      setDeletingDataSource(null)
    }
  }

  const fetchDataSourcePreview = async (dataSourceId: string) => {
    setLoadingPreview(true)
    try {
      // First, get the data source details to access schema
      const dsResponse = await fetch(`/api/reporting-engine/data-sources/${dataSourceId}`)
      if (!dsResponse.ok) {
        throw new Error('Failed to fetch data source')
      }
      
      const dsData = await dsResponse.json()
      const dataSource = dsData.dataSource

      if (!dataSource || dataSource.type !== 'FILE') {
        setLoadingPreview(false)
        return
      }

      // Get schema fields
      const fields = dataSource.schema?.fields || []
      if (fields.length === 0) {
        setLoadingPreview(false)
        return
      }

      // Check if sampleData is already stored in schema (from upload)
      let sampleData: any[] = []
      const displayFields = fields.slice(0, 10)

      if (dataSource.schema?.sampleData && Array.isArray(dataSource.schema.sampleData) && dataSource.schema.sampleData.length > 0) {
        // Use stored sample data (it's already in object format)
        sampleData = dataSource.schema.sampleData.slice(0, 5)
      } else {
        // Fetch sample data using the query endpoint
        const queryResponse = await fetch(`/api/reporting-engine/data-sources/${dataSourceId}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            select: displayFields.map((f: any) => f.name), // Get first 10 columns
            limit: 5, // Get first 5 rows for preview
            offset: 0,
            allowGroupBy: false,
          }),
        })

        if (!queryResponse.ok) {
          const errorData = await queryResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to fetch preview data')
        }

        const queryData = await queryResponse.json()
        const rows = queryData.rows || []
        const columns = queryData.columns || displayFields.map((f: any) => f.name)

        // Transform rows from array format [[val1, val2], [val1, val2]] to object format [{col1: val1, col2: val2}]
        sampleData = rows.slice(0, 5).map((row: any[]) => {
          const rowObj: any = {}
          columns.forEach((col: string, idx: number) => {
            rowObj[col] = row[idx] ?? null
          })
          return rowObj
        })
      }

      // Transform rows into the same format as uploadedFile
      setSelectedDataSourcePreview({
        schema: {
          fields: displayFields,
          rowCount: dataSource.schema?.rowCount || sampleData.length,
        },
        sampleData,
      })

      // Set available fields for chart configuration
      setAvailableFields(fields)
    } catch (error: any) {
      console.error('Error fetching data source preview:', error)
      toast({
        title: 'Preview Error',
        description: error.message || 'Failed to load preview',
        variant: 'destructive',
      })
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload Excel (.xlsx, .xls) or CSV files only',
          variant: 'destructive',
        })
        // Reset the input
        event.target.value = ''
        return
      }
      console.log('File selected:', file.name, file.size, 'bytes')
      setSelectedFile(file)
    } else {
      console.log('No file selected')
    }
  }

  const handleFileUpload = async () => {
    console.log('handleFileUpload called', { selectedFile, uploading })
    
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload',
        variant: 'destructive',
      })
      return
    }

    if (uploading) {
      console.log('Already uploading, skipping')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      console.log('Creating FormData...')
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', selectedFile.name.replace(/\.[^/.]+$/, ''))
      formData.append('functionalArea', functionalArea)

      console.log('Sending upload request...', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        functionalArea,
      })

      setUploadProgress(30)

      const response = await fetch('/api/reporting-engine/data-sources/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(70)

      console.log('Upload response status:', response.status)

      if (!response.ok) {
        let error
        try {
          error = await response.json()
        } catch (e) {
          // If response is not JSON, get text
          const text = await response.text()
          console.error('Upload error (non-JSON):', text)
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
        }
        
        console.error('Upload error:', error)
        console.error('Error details:', error.details)
        
        const errorMessage = error.message || error.error || `Upload failed: ${response.status} ${response.statusText}`
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('Upload success:', data)

      setUploadProgress(100)
      setUploadedFile(data)

      // Clear selected data source when uploading new file
      if (selectedDataSource) {
        setSelectedDataSource('')
        setSelectedDataSourcePreview(null)
      }

      // Refresh data sources
      await fetchDataSources()

      // Auto-select the uploaded data source and query
      if (data.dataSource?.id) {
        setSelectedDataSource(data.dataSource.id)
      }
      if (data.queryId) {
        setSelectedQuery(data.queryId)
      }
      
      // Set available fields from schema
      if (data.schema?.fields) {
        setAvailableFields(data.schema.fields)
      }

      toast({
        title: 'File Uploaded Successfully',
        description: `${data.schema?.rowCount || 0} rows detected with ${data.schema?.fields?.length || 0} columns`,
      })
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleSave = async () => {
    // Check what's missing and provide specific error messages
    const missingFields: string[] = []
    
    if (!formData.name) {
      missingFields.push('Visualization Name')
    }
    
    if (!selectedQuery && !selectedDataSource) {
      missingFields.push('Data Source')
    }
    
    // KPI charts don't need field configuration
    if (formData.type === 'kpi') {
      // For KPI cards, ensure only one Y-axis field is selected
      if (formData.yAxis.fields.length !== 1) {
        toast({
          title: 'Validation Error',
          description: 'KPI cards require exactly one value field',
          variant: 'destructive',
        })
        return
      }
    } else if (formData.type === 'dual-axis') {
      // Dual-axis charts need X-axis and at least one field on each axis
      if (!formData.xAxis.field) {
        missingFields.push('X-Axis field')
      }
      if (formData.dualAxis.leftAxis.fields.length === 0 && formData.dualAxis.rightAxis.fields.length === 0) {
        missingFields.push('At least one field on left or right axis')
      }
    } else {
      // Other charts need both X and Y axes
      if (!formData.xAxis.field) {
        missingFields.push('X-Axis field')
      }
      if (formData.yAxis.fields.length === 0) {
        missingFields.push('Y-Axis field(s)')
      }
    }
    
    if (missingFields.length > 0) {
      toast({
        title: 'Validation Error',
        description: `Please fill in: ${missingFields.join(', ')}`,
        variant: 'destructive',
      })
      return
    }
    
    // If no query is selected but we have a data source, try to create one
    let finalQueryId = selectedQuery
    if (!finalQueryId && selectedDataSource) {
      console.log('No query selected, creating query from data source...')
      try {
        // Create a query automatically from the data source
        const queryResponse = await fetch('/api/reporting-engine/queries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Query: ${formData.name || 'Visualization'}`,
            description: `Auto-generated query for visualization`,
            dataSourceId: selectedDataSource,
            queryBuilder: {
              select: availableFields.map((f: any) => f.name),
              from: selectedDataSource,
            },
          }),
        })
        
        if (queryResponse.ok) {
          const queryData = await queryResponse.json()
          finalQueryId = queryData.query?.id
          setSelectedQuery(finalQueryId)
          console.log('Auto-created query:', finalQueryId)
        } else {
          const error = await queryResponse.json()
          throw new Error(error.error || 'Failed to create query')
        }
      } catch (error: any) {
        console.error('Error creating query:', error)
        toast({
          title: 'Query Creation Failed',
          description: error.message || 'Failed to create query automatically. Please select a query manually.',
          variant: 'destructive',
        })
        return
      }
    }

    if (!finalQueryId) {
      toast({
        title: 'Query Required',
        description: 'Please select a query or data source',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const url = visualization?.id 
        ? `/api/reporting-engine/visualizations/${visualization.id}`
        : '/api/reporting-engine/visualizations'
      const method = visualization?.id ? 'PUT' : 'POST'
      
      // Prepare config
      const config = {
        ...formData.config,
        ...(formData.type === 'dual-axis' && {
          xAxis: formData.xAxis,
          dualAxis: formData.dualAxis,
        }),
        ...(formData.type !== 'kpi' && formData.type !== 'dual-axis' && {
          xAxis: formData.xAxis,
          yAxis: formData.yAxis,
        }),
        ...(formData.type === 'kpi' && {
          yAxis: formData.yAxis,
        }),
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          functionalArea,
          queryId: finalQueryId,
          config,
          ...(visualization?.id && { id: visualization.id }),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save visualization')
      }

      const data = await response.json()
      
      if (onSave) {
        onSave(data.visualization || visualization)
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create visualization',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedChartType = CHART_TYPES.find(t => t.value === formData.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-2">
        <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create Visualization</CardTitle>
                <CardDescription className="text-white/90">
                  Build beautiful charts and tables from your data
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCancel}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          <Tabs value={step.toString()} onValueChange={(v) => setStep(Number(v))} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="1" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Source
              </TabsTrigger>
              <TabsTrigger value="2" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Chart Type
              </TabsTrigger>
              <TabsTrigger value="3" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Axes
              </TabsTrigger>
              <TabsTrigger value="4" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Customize
              </TabsTrigger>
            </TabsList>

            {/* Step 1: Data Source */}
            <TabsContent value="1" className="space-y-6">
              <div className="space-y-6">
                {/* File Upload Section */}
                <div className="border-2 border-dashed rounded-lg p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload Your Data</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload CSV or Excel files to create visualizations
                    </p>
                    
                    {!uploadedFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <input
                            id="file-upload"
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20"
                            disabled={uploading}
                            onClick={() => {
                              console.log('Choose file button clicked')
                              document.getElementById('file-upload')?.click()
                            }}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            {selectedFile ? selectedFile.name : 'Choose File'}
                          </Button>
                        </div>
                        
                        {selectedFile && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-sm">
                              <FileSpreadsheet className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{selectedFile.name}</span>
                              <Badge variant="secondary">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </Badge>
                            </div>
                            
                            <Button
                              onClick={handleFileUpload}
                              disabled={uploading}
                              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              {uploading ? (
                                <>
                                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload & Create Data Source
                                </>
                              )}
                            </Button>
                            
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-semibold">File Uploaded Successfully!</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Rows:</strong> {uploadedFile.schema?.rowCount || 0}</p>
                          <p><strong>Columns:</strong> {uploadedFile.schema?.fields?.length || 0}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUploadedFile(null)
                            setSelectedFile(null)
                          }}
                        >
                          Upload Another File
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Existing Data Sources */}
                <div>
                  <Label className="text-base font-semibold mb-4 block">
                    Or Select Existing Data Source
                  </Label>
                  {dataSources.length > 0 ? (
                    <Select 
                      value={selectedDataSource} 
                      onValueChange={(value) => {
                        setSelectedDataSource(value)
                      }}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a data source" />
                      </SelectTrigger>
                      <SelectContent>
                        {dataSources.map((ds) => (
                          <SelectItem key={ds.id} value={ds.id}>
                            <div className="flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              <span>{ds.name}</span>
                              {ds.functionalArea && (
                                <Badge variant="secondary" className="ml-2">
                                  {ds.functionalArea}
                                </Badge>
                              )}
                              {ds.type === 'FILE' && (
                                <Badge variant="outline" className="ml-2">
                                  File
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-4 border rounded-lg bg-muted/50 text-center">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No data sources available. Upload a file above to get started.
                      </p>
                    </div>
                  )}

                  {/* Manage Data Sources Section */}
                  {dataSources.length > 0 && (
                    <div className="mt-6">
                      <Label className="text-base font-semibold mb-3 block">
                        Manage Data Sources
                      </Label>
                      <div className="border rounded-lg divide-y">
                        {dataSources.map((ds) => (
                          <div
                            key={ds.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <Database className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="font-medium">{ds.name}</div>
                                {ds.description && (
                                  <div className="text-sm text-muted-foreground">{ds.description}</div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  {ds.functionalArea && (
                                    <Badge variant="secondary" className="text-xs">
                                      {ds.functionalArea}
                                    </Badge>
                                  )}
                                  {ds.type === 'FILE' && (
                                    <Badge variant="outline" className="text-xs">
                                      File
                                    </Badge>
                                  )}
                                  {ds.schema?.rowCount && (
                                    <span className="text-xs text-muted-foreground">
                                      {ds.schema.rowCount} rows
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDataSource(ds.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Query Selection */}
                {selectedDataSource && (
                  <div>
                    <Label className="text-base font-semibold">Select Query</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose an existing query or create a new one
                    </p>
                    <Select value={selectedQuery} onValueChange={setSelectedQuery}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select a query" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Create New Query</span>
                          </div>
                        </SelectItem>
                        {queries.map((q) => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Preview Uploaded Data or Selected Data Source */}
                {((uploadedFile?.sampleData && uploadedFile.sampleData.length > 0) || 
                  (selectedDataSourcePreview?.sampleData && selectedDataSourcePreview.sampleData.length > 0)) && (
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Data Preview</Label>
                    {loadingPreview ? (
                      <div className="border rounded-lg p-6 text-center">
                        <RefreshCw className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Loading preview...</p>
                      </div>
                    ) : (
                      <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto max-h-48">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                {(uploadedFile?.schema?.fields || selectedDataSourcePreview?.schema?.fields || [])
                                  .slice(0, 10)
                                  .map((field: any) => (
                                  <th key={field.name} className="px-3 py-2 text-left font-semibold border-b">
                                    {field.name}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {(uploadedFile?.sampleData || selectedDataSourcePreview?.sampleData || [])
                                .slice(0, 5)
                                .map((row: any, idx: number) => (
                                <tr key={idx} className="border-b hover:bg-muted/50">
                                  {(uploadedFile?.schema?.fields || selectedDataSourcePreview?.schema?.fields || [])
                                    .slice(0, 10)
                                    .map((field: any) => (
                                    <td key={field.name} className="px-3 py-2">
                                      {row[field.name] ?? '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="px-3 py-2 bg-muted text-xs text-muted-foreground text-center">
                          Showing first 5 rows of {(uploadedFile?.schema?.rowCount || selectedDataSourcePreview?.schema?.rowCount || 0)} total rows
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Step 2: Chart Type */}
            <TabsContent value="2" className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">Select Chart Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {CHART_TYPES.map((type) => {
                    const Icon = type.icon
                    const isSelected = formData.type === type.value
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all hover:shadow-lg",
                          isSelected
                            ? "border-purple-600 bg-purple-50 dark:bg-purple-950"
                            : "border-border hover:border-purple-300"
                        )}
                      >
                        <Icon className={cn(
                          "h-8 w-8 mb-2 mx-auto",
                          isSelected ? "text-purple-600" : "text-muted-foreground"
                        )} />
                        <div className="text-sm font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">
                    Visualization Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sales Revenue by Region"
                    className="mt-2 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe what this visualization shows..."
                    className="mt-2 min-h-[100px]"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Step 3: Configure Axes */}
            <TabsContent value="3" className="space-y-6">
              {availableFields.length > 0 ? (
                <div className="space-y-6">
                  {/* X-Axis only for non-KPI charts */}
                  {formData.type !== 'kpi' && (
                    <>
                      <div>
                        <Label className="text-base font-semibold mb-2 block">X-Axis (Categories)</Label>
                        <p className="text-sm text-muted-foreground mb-3">
                          Select the field to display on the horizontal axis
                        </p>
                        <Select
                          value={formData.xAxis.field}
                          onValueChange={(value) => {
                            const field = availableFields.find((f: any) => f.name === value)
                            setFormData({
                              ...formData,
                              xAxis: {
                                ...formData.xAxis,
                                field: value,
                                label: field?.name || value,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select X-axis field" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableFields.map((field: any) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Dual-Axis Configuration */}
                  {formData.type === 'dual-axis' ? (
                    <div className="space-y-6">
                      {/* Left Axis */}
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <Label className="text-base font-semibold mb-3 block">Left Y-Axis</Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Chart Type</Label>
                            <Select
                              value={formData.dualAxis.leftAxis.chartType}
                              onValueChange={(value) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    leftAxis: {
                                      ...formData.dualAxis.leftAxis,
                                      chartType: value as 'bar' | 'line',
                                    },
                                  },
                                })
                              }}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bar">Bar Chart</SelectItem>
                                <SelectItem value="line">Line Chart</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Aggregation</Label>
                            <Select
                              value={formData.dualAxis.leftAxis.aggregation}
                              onValueChange={(value) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    leftAxis: {
                                      ...formData.dualAxis.leftAxis,
                                      aggregation: value as any,
                                    },
                                  },
                                })
                              }}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                                <SelectItem value="avg">Average</SelectItem>
                                <SelectItem value="min">Minimum</SelectItem>
                                <SelectItem value="max">Maximum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Fields</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                              {availableFields
                                .filter((f: any) => f.name !== formData.xAxis.field)
                                .map((field: any) => (
                                  <div key={field.name} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`left-field-${field.name}`}
                                      checked={formData.dualAxis.leftAxis.fields.includes(field.name)}
                                      onChange={(e) => {
                                        const fields = e.target.checked
                                          ? [...formData.dualAxis.leftAxis.fields, field.name]
                                          : formData.dualAxis.leftAxis.fields.filter((f: string) => f !== field.name)
                                        setFormData({
                                          ...formData,
                                          dualAxis: {
                                            ...formData.dualAxis,
                                            leftAxis: {
                                              ...formData.dualAxis.leftAxis,
                                              fields,
                                            },
                                          },
                                        })
                                      }}
                                      className="rounded"
                                    />
                                    <Label
                                      htmlFor={`left-field-${field.name}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {field.name}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Axis Label (Optional)</Label>
                            <Input
                              value={formData.dualAxis.leftAxis.label}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    leftAxis: {
                                      ...formData.dualAxis.leftAxis,
                                      label: e.target.value,
                                    },
                                  },
                                })
                              }}
                              placeholder="Left Y-Axis"
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right Axis */}
                      <div className="p-4 border rounded-lg bg-muted/30">
                        <Label className="text-base font-semibold mb-3 block">Right Y-Axis</Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Chart Type</Label>
                            <Select
                              value={formData.dualAxis.rightAxis.chartType}
                              onValueChange={(value) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    rightAxis: {
                                      ...formData.dualAxis.rightAxis,
                                      chartType: value as 'bar' | 'line',
                                    },
                                  },
                                })
                              }}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="bar">Bar Chart</SelectItem>
                                <SelectItem value="line">Line Chart</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Aggregation</Label>
                            <Select
                              value={formData.dualAxis.rightAxis.aggregation}
                              onValueChange={(value) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    rightAxis: {
                                      ...formData.dualAxis.rightAxis,
                                      aggregation: value as any,
                                    },
                                  },
                                })
                              }}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="sum">Sum</SelectItem>
                                <SelectItem value="count">Count</SelectItem>
                                <SelectItem value="avg">Average</SelectItem>
                                <SelectItem value="min">Minimum</SelectItem>
                                <SelectItem value="max">Maximum</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Fields</Label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3">
                              {availableFields
                                .filter((f: any) => f.name !== formData.xAxis.field)
                                .map((field: any) => (
                                  <div key={field.name} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`right-field-${field.name}`}
                                      checked={formData.dualAxis.rightAxis.fields.includes(field.name)}
                                      onChange={(e) => {
                                        const fields = e.target.checked
                                          ? [...formData.dualAxis.rightAxis.fields, field.name]
                                          : formData.dualAxis.rightAxis.fields.filter((f: string) => f !== field.name)
                                        setFormData({
                                          ...formData,
                                          dualAxis: {
                                            ...formData.dualAxis,
                                            rightAxis: {
                                              ...formData.dualAxis.rightAxis,
                                              fields,
                                            },
                                          },
                                        })
                                      }}
                                      className="rounded"
                                    />
                                    <Label
                                      htmlFor={`right-field-${field.name}`}
                                      className="text-sm cursor-pointer flex-1"
                                    >
                                      {field.name}
                                    </Label>
                                  </div>
                                ))}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Axis Label (Optional)</Label>
                            <Input
                              value={formData.dualAxis.rightAxis.label}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  dualAxis: {
                                    ...formData.dualAxis,
                                    rightAxis: {
                                      ...formData.dualAxis.rightAxis,
                                      label: e.target.value,
                                    },
                                  },
                                })
                              }}
                              placeholder="Right Y-Axis"
                              className="h-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Y-Axis (Values) - for non-dual-axis charts */
                    <div>
                      <Label className="text-base font-semibold mb-2 block">
                        {formData.type === 'kpi' ? 'Value Field' : 'Y-Axis (Values)'}
                      </Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formData.type === 'kpi' 
                          ? 'Select the field to calculate the KPI value'
                          : 'Select the field(s) to display on the vertical axis'}
                      </p>
                      <div className="space-y-3">
                        <Select
                          value={formData.yAxis.aggregation}
                          onValueChange={(value) => {
                            setFormData({
                              ...formData,
                              yAxis: {
                                ...formData.yAxis,
                                aggregation: value as any,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Select aggregation" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sum">Sum</SelectItem>
                            <SelectItem value="count">Count</SelectItem>
                            <SelectItem value="avg">Average</SelectItem>
                            <SelectItem value="min">Minimum</SelectItem>
                            <SelectItem value="max">Maximum</SelectItem>
                          </SelectContent>
                        </Select>

                        <div>
                          <Label className="text-sm font-medium mb-2 block">
                            {formData.type === 'kpi' ? 'Select Value Field' : 'Select Value Field(s)'}
                          </Label>
                          <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                            {availableFields
                              .filter((f: any) => formData.type === 'kpi' || f.name !== formData.xAxis.field)
                              .map((field: any) => (
                                <div key={field.name} className="flex items-center space-x-2">
                                  <input
                                    type={formData.type === 'kpi' ? 'radio' : 'checkbox'}
                                    id={`y-field-${field.name}`}
                                    name={formData.type === 'kpi' ? 'y-field-radio' : undefined}
                                    checked={formData.yAxis.fields.includes(field.name)}
                                    onChange={(e) => {
                                      const fields = formData.type === 'kpi'
                                        ? (e.target.checked ? [field.name] : [])
                                        : (e.target.checked
                                          ? [...formData.yAxis.fields, field.name]
                                          : formData.yAxis.fields.filter((f: string) => f !== field.name))
                                      setFormData({
                                        ...formData,
                                        yAxis: {
                                          ...formData.yAxis,
                                          fields,
                                        },
                                      })
                                    }}
                                    className={formData.type === 'kpi' ? 'rounded-full' : 'rounded'}
                                  />
                                  <Label
                                    htmlFor={`y-field-${field.name}`}
                                    className="text-sm cursor-pointer flex-1"
                                  >
                                    {field.name}
                                  </Label>
                                </div>
                              ))}
                          </div>
                          {formData.yAxis.fields.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formData.type === 'kpi' 
                                ? 'Select a value field for the KPI'
                                : 'Select at least one field for the Y-axis'}
                            </p>
                          )}
                          {formData.type === 'kpi' && formData.yAxis.fields.length > 1 && (
                            <p className="text-xs text-amber-600 mt-2">
                              Only one field can be selected for KPI cards
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Preview Summary */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <Label className="text-sm font-semibold mb-2 block">Configuration Summary</Label>
                    <div className="space-y-1 text-sm">
                      {formData.type !== 'kpi' && (
                        <p>
                          <strong>X-Axis:</strong>{' '}
                          {formData.xAxis.field || <span className="text-muted-foreground">Not selected</span>}
                        </p>
                      )}
                      {formData.type === 'dual-axis' ? (
                        <>
                          <p>
                            <strong>Left Y-Axis ({formData.dualAxis.leftAxis.chartType}):</strong>{' '}
                            {formData.dualAxis.leftAxis.fields.length > 0 ? (
                              `${formData.dualAxis.leftAxis.aggregation.toUpperCase()}(${formData.dualAxis.leftAxis.fields.join(', ')})`
                            ) : (
                              <span className="text-muted-foreground">No fields selected</span>
                            )}
                          </p>
                          <p>
                            <strong>Right Y-Axis ({formData.dualAxis.rightAxis.chartType}):</strong>{' '}
                            {formData.dualAxis.rightAxis.fields.length > 0 ? (
                              `${formData.dualAxis.rightAxis.aggregation.toUpperCase()}(${formData.dualAxis.rightAxis.fields.join(', ')})`
                            ) : (
                              <span className="text-muted-foreground">No fields selected</span>
                            )}
                          </p>
                        </>
                      ) : (
                        <p>
                          <strong>{formData.type === 'kpi' ? 'Value Field' : 'Y-Axis'}:</strong>{' '}
                          {formData.yAxis.fields.length > 0 ? (
                            `${formData.yAxis.aggregation.toUpperCase()}(${formData.yAxis.fields.join(', ')})`
                          ) : (
                            <span className="text-muted-foreground">No fields selected</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please select a data source and query first
                  </p>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Go to Data Source
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Step 4: Customize */}
            <TabsContent value="4" className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-semibold mb-4 block">Layout</Label>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="width">Width (Grid Columns)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.defaultWidth}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          defaultWidth: parseInt(e.target.value) || 6 
                        })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Height (Grid Rows)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.defaultHeight}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          defaultHeight: parseInt(e.target.value) || 4 
                        })}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-semibold mb-4 block">Appearance</Label>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showLegend"
                        checked={formData.config.showLegend}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, showLegend: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="showLegend">Show Legend</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showGrid"
                        checked={formData.config.showGrid}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, showGrid: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="showGrid">Show Grid</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="showLabels"
                        checked={formData.config.showLabels}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: { ...formData.config, showLabels: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <Label htmlFor="showLabels">Show Labels</Label>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-semibold mb-4 block">Preview</Label>
                <Card className="bg-muted/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg">
                      <div className="text-center">
                        {selectedChartType && (
                          <>
                            <selectedChartType.icon className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">{selectedChartType.label}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formData.name || 'Untitled Visualization'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Data Source</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this data source? This action cannot be undone.
                The file will be permanently deleted from the system, and any queries or visualizations
                using this data source will be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteDataSource}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="border-t p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Previous
                </Button>
              )}
              {step < 3 ? (
                <Button onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Create Visualization'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Database,
  RefreshCw,
  Loader2,
  FileStack,
  Sparkles,
  BarChart3,
  Settings,
} from 'lucide-react'
import { InsightsSummaryCard } from '@/components/reporting-studio/insights-summary-card'
import { GenerateInsightsDialog } from '@/components/reporting-studio/generate-insights-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function DatasetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const datasetId = params.id as string

  const [dataset, setDataset] = useState<any>(null)
  const [insights, setInsights] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (datasetId) {
      fetchDataset()
      fetchInsights()
    }
  }, [datasetId])

  const fetchDataset = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}`)
      if (response.ok) {
        const data = await response.json()
        setDataset(data)
      } else {
        setError('Failed to load dataset')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dataset')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}/insights`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      }
    } catch (err: any) {
      console.error('Error fetching insights:', err)
      setInsights([]) // Set empty array on error
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}/refresh`, {
        method: 'POST',
      })
      if (response.ok) {
        await fetchDataset()
      } else {
        alert('Failed to refresh dataset')
      }
    } catch (err) {
      console.error('Error refreshing dataset:', err)
      alert('Failed to refresh dataset')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleInsightsGenerated = (newInsights: any[]) => {
    setInsights(newInsights)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !dataset) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Dataset not found'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/reporting-studio/datasets')} className="mt-4">
          Back to Datasets
        </Button>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'ERROR':
        return 'bg-red-500'
      case 'PROCESSING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Extract column names from schema
  const availableColumns =
    dataset.schema && Array.isArray(dataset.schema)
      ? dataset.schema.map((col: any) => col.name || col.columnName || col)
      : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/reporting-studio/datasets')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <FileStack className="h-8 w-8" />
              {dataset.name}
            </h1>
            <p className="text-muted-foreground mt-2">{dataset.description || 'Dataset details'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href={`/reporting-studio/datasets/${datasetId}/insights`}>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              View Insights
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor(dataset.status)}`} />
        <Badge variant="outline">{dataset.status}</Badge>
        <Badge variant="outline">{dataset.type}</Badge>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">
            <Database className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="insights">
            <Sparkles className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="schema">
            <Settings className="h-4 w-4 mr-2" />
            Schema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Row Count</CardDescription>
                <CardTitle className="text-2xl">
                  {dataset.rowCount?.toLocaleString() || '—'}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Column Count</CardDescription>
                <CardTitle className="text-2xl">{dataset.columnCount || '—'}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Last Refreshed</CardDescription>
                <CardTitle className="text-sm font-normal">
                  {dataset.lastRefreshedAt
                    ? new Date(dataset.lastRefreshedAt).toLocaleString()
                    : 'Never'}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Data Source Info */}
          {dataset.dataSource && (
            <Card>
              <CardHeader>
                <CardTitle>Data Source</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{dataset.dataSource.name}</span>
                  <Badge variant="outline">{dataset.dataSource.type}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Link href={`/reporting-studio/visualizations?dataset=${datasetId}`}>
                  <Button variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Create Visualization
                  </Button>
                </Link>
                <Link href={`/reporting-studio/datasets/${datasetId}/insights`}>
                  <Button variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsSummaryCard
            datasetId={datasetId}
            datasetName={dataset.name}
            insights={insights}
          />
          {insights.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Insights Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Generate automatic insights to discover patterns and trends in your data
                  </p>
                  <GenerateInsightsDialog
                    datasetId={datasetId}
                    datasetName={dataset.name}
                    availableColumns={availableColumns}
                    onInsightsGenerated={handleInsightsGenerated}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schema" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema</CardTitle>
              <CardDescription>Dataset structure and columns</CardDescription>
            </CardHeader>
            <CardContent>
              {availableColumns.length > 0 ? (
                <div className="space-y-2">
                  {availableColumns.map((column: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <span className="font-mono text-sm">{column}</span>
                      <Badge variant="outline">Column</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Schema information not available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


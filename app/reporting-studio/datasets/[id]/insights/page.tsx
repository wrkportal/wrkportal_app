'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { InsightsList } from '@/components/reporting-studio/insights-list'
import { GenerateInsightsDialog } from '@/components/reporting-studio/generate-insights-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, ArrowLeft, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Insight } from '@/lib/reporting-studio/auto-insights/insight-generator'

export default function DatasetInsightsPage() {
  const params = useParams()
  const router = useRouter()
  const datasetId = params.id as string

  const [dataset, setDataset] = useState<any>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (datasetId) {
      fetchDataset()
      fetchInsights()
    }
  }, [datasetId])

  const fetchDataset = async () => {
    try {
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}`)
      if (response.ok) {
        const data = await response.json()
        setDataset(data)
      }
    } catch (err: any) {
      console.error('Error fetching dataset:', err)
    }
  }

  const fetchInsights = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}/insights`)
      if (response.ok) {
        const data = await response.json()
        setInsights(data.insights || [])
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch insights')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights')
      setInsights([]) // Set empty array on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleInsightsGenerated = (newInsights: Insight[]) => {
    setInsights(newInsights)
    fetchInsights() // Refresh the list
  }

  // Extract column names from dataset schema
  const availableColumns =
    dataset?.schema && Array.isArray(dataset.schema)
      ? dataset.schema.map((col: any) => col.name || col.columnName)
      : []

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-purple-600" />
              Auto-Insights
            </h1>
            <p className="text-muted-foreground mt-2">
              {dataset ? `Insights for "${dataset.name}"` : 'Generate automatic insights from your dataset'}
            </p>
          </div>
        </div>
        {dataset && (
          <GenerateInsightsDialog
            datasetId={datasetId}
            datasetName={dataset.name}
            availableColumns={availableColumns}
            onInsightsGenerated={handleInsightsGenerated}
          />
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Insights Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : insights.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Insights Yet</CardTitle>
            <CardDescription>
              Generate automatic insights to discover patterns, trends, and anomalies in your data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dataset && (
              <GenerateInsightsDialog
                datasetId={datasetId}
                datasetName={dataset.name}
                availableColumns={availableColumns}
                onInsightsGenerated={handleInsightsGenerated}
                trigger={
                  <Button size="lg">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights Now
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      ) : (
        <InsightsList insights={insights} onRefresh={fetchInsights} />
      )}
    </div>
  )
}


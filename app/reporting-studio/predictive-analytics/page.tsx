'use client'

import { useState, useEffect } from 'react'
import { PredictiveAnalytics } from '@/components/reporting-studio/predictive-analytics'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, TrendingUp, BarChart3, Sparkles } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function PredictiveAnalyticsPage() {
  const { toast } = useToast()
  const [datasets, setDatasets] = useState<any[]>([])
  const [selectedDataset, setSelectedDataset] = useState<string>('')
  const [datasetData, setDatasetData] = useState<Array<{ date: string; value: number }>>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true)
  const [isLoadingData, setIsLoadingData] = useState(false)

  useEffect(() => {
    fetchDatasets()
  }, [])

  useEffect(() => {
    if (selectedDataset) {
      fetchDatasetData(selectedDataset)
    }
  }, [selectedDataset])

  const fetchDatasets = async () => {
    try {
      setIsLoadingDatasets(true)
      const response = await fetch('/api/reporting-studio/datasets')
      if (response.ok) {
        const data = await response.json()
        setDatasets(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setIsLoadingDatasets(false)
    }
  }

  const fetchDatasetData = async (datasetId: string) => {
    try {
      setIsLoadingData(true)
      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}/data?limit=100`)
      if (response.ok) {
        const data = await response.json()
        
        // Try to find date and numeric columns
        if (data.rows && data.rows.length > 0) {
          const firstRow = data.rows[0]
          const columns = data.columns || Object.keys(firstRow)
          
          // Find date column
          const dateColumn = columns.find((col: string) => 
            /date|time|timestamp|created|updated/i.test(col)
          ) || columns[0]
          
          // Find numeric column
          const numericColumn = columns.find((col: string) => {
            if (col === dateColumn) return false
            const value = firstRow[col]
            return typeof value === 'number' || !isNaN(parseFloat(value))
          }) || columns[1]
          
          // Transform data
          const transformed = data.rows.map((row: any) => ({
            date: row[dateColumn] || new Date().toISOString(),
            value: parseFloat(row[numericColumn]) || 0,
          }))
          
          setDatasetData(transformed)
        } else {
          setDatasetData([])
        }
      }
    } catch (error) {
      console.error('Error fetching dataset data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dataset data',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  // Sample data for testing (if no dataset selected)
  const sampleData: Array<{ date: string; value: number }> = [
    { date: '2024-01-01', value: 100 },
    { date: '2024-02-01', value: 120 },
    { date: '2024-03-01', value: 110 },
    { date: '2024-04-01', value: 130 },
    { date: '2024-05-01', value: 125 },
    { date: '2024-06-01', value: 140 },
    { date: '2024-07-01', value: 135 },
    { date: '2024-08-01', value: 150 },
    { date: '2024-09-01', value: 145 },
    { date: '2024-10-01', value: 160 },
    { date: '2024-11-01', value: 155 },
    { date: '2024-12-01', value: 170 },
  ]

  const dataToUse = selectedDataset && datasetData.length > 0 ? datasetData : sampleData

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Predictive Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Time series forecasting, regression analysis, and classification models
          </p>
        </div>
      </div>

      {/* Dataset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Source</CardTitle>
          <CardDescription>
            Select a dataset or use sample data to test predictive models
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Dataset (Optional)</Label>
              <Select
                value={selectedDataset || "sample"}
                onValueChange={(value) => setSelectedDataset(value === "sample" ? "" : value)}
                disabled={isLoadingDatasets}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingDatasets ? "Loading datasets..." : "Use sample data"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sample">Use Sample Data</SelectItem>
                  {datasets.map((dataset) => (
                    <SelectItem key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDataset && (
              <div className="text-sm text-muted-foreground">
                {isLoadingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading dataset data...
                  </div>
                ) : (
                  <>
                    Loaded {datasetData.length} data points
                    {datasetData.length === 0 && (
                      <span className="text-amber-600 ml-2">
                        (No suitable data found. Using sample data instead.)
                      </span>
                    )}
                  </>
                )}
              </div>
            )}

            {!selectedDataset && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <strong>Using Sample Data:</strong> 12 months of sample time series data.
                Select a dataset above to use your own data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Predictive Analytics Component */}
      <PredictiveAnalytics
        datasetId={selectedDataset || undefined}
        data={dataToUse}
      />

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold">Forecasting</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Predict future values using time series data. Try different methods:
                Linear, Exponential Smoothing, Moving Average, or Seasonal.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Regression</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Analyze relationships between variables. Choose Linear, Polynomial,
                or Logistic regression. View R² scores and error metrics.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Classification</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Train models to classify data. Use KNN, Decision Tree, or Naive Bayes.
                Requires training and test datasets.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2">Example Regression Data Format:</h4>
            <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
              {JSON.stringify([
                { x: 1, y: 2 },
                { x: 2, y: 4 },
                { x: 3, y: 6 },
                { x: 4, y: 8 },
              ], null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


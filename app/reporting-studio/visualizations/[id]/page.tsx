'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChartRenderer } from '@/components/reporting-studio/charts'
import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function VisualizationViewPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [config, setConfig] = useState<ChartConfig | null>(null)
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchVisualization()
    }
  }, [id])

  const fetchVisualization = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch visualization config
      const vizResponse = await fetch(`/api/reporting-studio/visualizations/${id}`)
      if (!vizResponse.ok) {
        throw new Error('Visualization not found')
      }

      const visualization = await vizResponse.json()

      // Convert to ChartConfig format
      const chartConfig: ChartConfig = {
        type: visualization.config.chartType || 'BAR',
        title: visualization.name,
        description: visualization.description,
        series: visualization.config.series || [],
        xAxis: visualization.config.axes?.x,
        yAxis: visualization.config.axes?.y,
        ...visualization.config,
      } as ChartConfig

      setConfig(chartConfig)

      // Fetch visualization data
      const dataResponse = await fetch(`/api/reporting-studio/visualizations/${id}/data`)
      if (dataResponse.ok) {
        const dataResult = await dataResponse.json()
        // Transform data from columns/rows format to object array
        if (dataResult.data && dataResult.data.rows) {
          const transformedData = dataResult.data.rows.map((row: any[]) => {
            const obj: any = {}
            dataResult.data.columns.forEach((col: string, index: number) => {
              obj[col] = row[index]
            })
            return obj
          })
          setData(transformedData)
        } else {
          // If no data, use sample data for demo
          setData(generateSampleData(chartConfig))
        }
      } else {
        // Use sample data if API fails
        setData(generateSampleData(chartConfig))
      }
    } catch (err: any) {
      console.error('Error fetching visualization:', err)
      setError(err.message || 'Failed to load visualization')
      // Still try to show sample data
      if (!config) {
        const sampleConfig: ChartConfig = {
          type: 'BAR',
          series: [{ field: 'value', label: 'Value' }],
          xAxis: { field: 'category' },
        } as ChartConfig
        setConfig(sampleConfig)
        setData(generateSampleData(sampleConfig))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const generateSampleData = (chartConfig: ChartConfig): ChartDataPoint[] => {
    if (chartConfig.type === 'PIE') {
      return [
        { category: 'A', value: 30 },
        { category: 'B', value: 25 },
        { category: 'C', value: 20 },
        { category: 'D', value: 15 },
        { category: 'E', value: 10 },
      ]
    }

    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return categories.map((cat) => {
      const point: any = {}
      if (chartConfig.xAxis?.field) {
        point[chartConfig.xAxis.field] = cat
      }
      chartConfig.series?.forEach((series) => {
        point[series.field] = Math.floor(Math.random() * 100) + 10
      })
      return point
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground">Visualization not found</p>
              <Button onClick={() => router.push('/reporting-studio/visualizations')} className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Visualizations
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/reporting-studio/visualizations')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{config.title || 'Visualization'}</h1>
          {config.description && (
            <p className="text-muted-foreground mt-2">{config.description}</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <ChartRenderer
        config={config}
        data={data}
        isLoading={false}
        error={error}
        showExport={true}
      />
    </div>
  )
}


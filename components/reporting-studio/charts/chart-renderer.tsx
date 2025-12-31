'use client'

import { useMemo, useRef } from 'react'
import { ChartConfig, ChartDataPoint, ChartType } from '@/lib/reporting-studio/chart-types'
import { BarChart } from './bar-chart'
import { LineChart } from './line-chart'
import { AreaChart } from './area-chart'
import { PieChart } from './pie-chart'
import { ScatterChart } from './scatter-chart'
import { ColumnChart } from './column-chart'
import { TableChart } from './table-chart'
import { HeatmapChart } from './heatmap-chart'
import { TreemapChart } from './treemap-chart'
import { WaterfallChart } from './waterfall-chart'
import { BoxplotChart } from './boxplot-chart'
import { SankeyChart } from './sankey-chart'
import { SunburstChart } from './sunburst-chart'
import { GanttChart } from './gantt-chart'
import { MapChoroplethChart } from './map-choropleth-chart'
import { MapPointChart } from './map-point-chart'
import { MapHeatChart } from './map-heat-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertCircle, Download, MoreVertical } from 'lucide-react'
import { exportChart, ExportFormat } from '@/lib/reporting-studio/chart-export'

interface ChartRendererProps {
  config: ChartConfig
  data: ChartDataPoint[]
  isLoading?: boolean
  error?: string | null
  className?: string
  showExport?: boolean
}

export function ChartRenderer({
  config,
  data,
  isLoading = false,
  error = null,
  className = '',
  showExport = true,
}: ChartRendererProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)

  const handleExport = async (format: ExportFormat) => {
    if (!chartContainerRef.current) return

    try {
      const filename = `${config.title || 'chart'}.${format}`
      await exportChart(chartContainerRef.current, filename, {
        format,
        width: config.width,
        height: config.height,
        backgroundColor: config.backgroundColor || '#ffffff',
      })
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export chart')
    }
  }
  const chartComponent = useMemo(() => {
    if (error) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )
    }

    if (isLoading || !data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {isLoading ? 'Loading chart data...' : 'No data available'}
        </div>
      )
    }

    switch (config.type) {
      case ChartType.BAR:
        return <BarChart config={config} data={data} />
      
      case ChartType.COLUMN:
        return <ColumnChart config={config} data={data} />
      
      case ChartType.LINE:
        return <LineChart config={config} data={data} />
      
      case ChartType.AREA:
        return <AreaChart config={config} data={data} />
      
      case ChartType.PIE:
        return <PieChart config={config} data={data} />
      
      case ChartType.SCATTER:
        return <ScatterChart config={config} data={data} />
      
      case ChartType.TABLE:
        return <TableChart config={config} data={data} />
      
      case ChartType.HEATMAP:
        return <HeatmapChart config={config} data={data} />
      
      case ChartType.TREEMAP:
        return <TreemapChart config={config} data={data} />
      
      case ChartType.WATERFALL:
        return <WaterfallChart config={config} data={data} />
      
      case ChartType.BOX_PLOT:
        return <BoxplotChart config={config} data={data} />
      
      case ChartType.SANKEY:
        return <SankeyChart config={config} data={data} />
      
      case ChartType.SUNBURST:
        return <SunburstChart config={config} data={data} />
      
      case ChartType.GANTT:
        return <GanttChart config={config} data={data} />
      
      case ChartType.MAP_CHOROPLETH:
        return <MapChoroplethChart config={config} data={data} />
      
      case ChartType.MAP_POINT:
        return <MapPointChart config={config} data={data} />
      
      case ChartType.MAP_HEAT:
        return <MapHeatChart config={config} data={data} />
      
      default:
        return (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chart type "{config.type}" is not yet supported
            </AlertDescription>
          </Alert>
        )
    }
  }, [config, data, isLoading, error])

  return (
    <Card className={className}>
      {(config.title || showExport) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {config.title && <CardTitle>{config.title}</CardTitle>}
            {showExport && !error && !isLoading && data && data.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('svg')}>
                    Export as SVG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <div
          ref={chartContainerRef}
          style={{
            width: config.width || '100%',
            height: config.height || 400,
            backgroundColor: config.backgroundColor,
          }}
        >
          {chartComponent}
        </div>
        {config.description && (
          <p className="text-sm text-muted-foreground mt-4">{config.description}</p>
        )}
      </CardContent>
    </Card>
  )
}


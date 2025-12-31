'use client'

import {
  ResponsiveContainer,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'
import { useMemo } from 'react'

interface ScatterChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function ScatterChart({ config, data }: ScatterChartProps) {
  const colors = useMemo(() => config.colors || DEFAULT_COLORS, [config.colors])

  if (!config.xAxis?.field || !config.series || config.series.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Invalid chart configuration</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsScatterChart
        margin={config.margin}
      >
        {config.grid?.show !== false && (
          <CartesianGrid
            strokeDasharray={config.grid?.strokeDasharray || '3 3'}
            stroke={config.grid?.strokeColor || '#e5e7eb'}
          />
        )}
        <XAxis
          type="number"
          dataKey={config.xAxis.field}
          label={config.xAxis.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
          domain={config.xAxis.min !== undefined || config.xAxis.max !== undefined 
            ? [config.xAxis.min || 'auto', config.xAxis.max || 'auto'] 
            : undefined}
        />
        <YAxis
          type="number"
          label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
          domain={config.yAxis?.min !== undefined || config.yAxis?.max !== undefined 
            ? [config.yAxis.min || 'auto', config.yAxis.max || 'auto'] 
            : undefined}
        />
        {config.tooltip?.show !== false && <Tooltip cursor={{ strokeDasharray: '3 3' }} />}
        {config.legend?.show !== false && (
          <Legend
            verticalAlign={config.legend?.position === 'top' ? 'top' : config.legend?.position === 'bottom' ? 'bottom' : 'top'}
          />
        )}
        {config.series.map((series, index) => {
          // For scatter charts, we need to map the data properly
          // The x-axis field is already set, so we map y values from the series field
          const scatterData = data.map(d => ({
            x: d[config.xAxis!.field],
            y: d[series.field],
          }))

          return (
            <Scatter
              key={series.field}
              name={series.label || series.field}
              data={scatterData}
              fill={series.color || colors[index % colors.length]}
              isAnimationActive={config.animation !== false}
            />
          )
        })}
      </RechartsScatterChart>
    </ResponsiveContainer>
  )
}


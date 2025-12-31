'use client'

import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  YAxis as YAxisRight,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'
import { useMemo } from 'react'

interface LineChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function LineChart({ config, data }: LineChartProps) {
  const colors = useMemo(() => config.colors || DEFAULT_COLORS, [config.colors])

  if (!config.xAxis?.field || !config.series || config.series.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Invalid chart configuration</div>
  }

  const hasRightAxis = config.series.some(s => s.yAxisId === 'right')

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsLineChart
        data={data}
        margin={config.margin}
      >
        {config.grid?.show !== false && (
          <CartesianGrid
            strokeDasharray={config.grid?.strokeDasharray || '3 3'}
            stroke={config.grid?.strokeColor || '#e5e7eb'}
          />
        )}
        <XAxis
          dataKey={config.xAxis.field}
          label={config.xAxis.label ? { value: config.xAxis.label, position: 'insideBottom', offset: -5 } : undefined}
        />
        <YAxis
          yAxisId="left"
          label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
          domain={config.yAxis?.min !== undefined || config.yAxis?.max !== undefined 
            ? [config.yAxis.min || 'auto', config.yAxis.max || 'auto'] 
            : undefined}
        />
        {hasRightAxis && config.yAxisRight && (
          <YAxisRight
            yAxisId="right"
            orientation="right"
            label={config.yAxisRight.label ? { value: config.yAxisRight.label, angle: 90, position: 'insideRight' } : undefined}
            domain={config.yAxisRight.min !== undefined || config.yAxisRight.max !== undefined 
              ? [config.yAxisRight.min || 'auto', config.yAxisRight.max || 'auto'] 
              : undefined}
          />
        )}
        {config.tooltip?.show !== false && <Tooltip />}
        {config.legend?.show !== false && (
          <Legend
            verticalAlign={config.legend?.position === 'top' ? 'top' : config.legend?.position === 'bottom' ? 'bottom' : 'top'}
          />
        )}
        {config.series.map((series, index) => (
          <Line
            key={series.field}
            yAxisId={series.yAxisId || 'left'}
            type={config.smooth ? 'monotone' : 'linear'}
            dataKey={series.field}
            name={series.label || series.field}
            stroke={series.color || colors[index % colors.length]}
            strokeWidth={series.strokeWidth || config.series?.[0]?.strokeWidth || 2}
            dot={false}
            isAnimationActive={config.animation !== false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}


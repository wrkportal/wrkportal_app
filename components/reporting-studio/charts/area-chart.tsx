'use client'

import {
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'
import { useMemo } from 'react'

interface AreaChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function AreaChart({ config, data }: AreaChartProps) {
  const colors = useMemo(() => config.colors || DEFAULT_COLORS, [config.colors])

  if (!config.xAxis?.field || !config.series || config.series.length === 0) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Invalid chart configuration</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsAreaChart
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
          label={config.yAxis?.label ? { value: config.yAxis.label, angle: -90, position: 'insideLeft' } : undefined}
          domain={config.yAxis?.min !== undefined || config.yAxis?.max !== undefined 
            ? [config.yAxis.min || 'auto', config.yAxis.max || 'auto'] 
            : undefined}
        />
        {config.tooltip?.show !== false && <Tooltip />}
        {config.legend?.show !== false && (
          <Legend
            verticalAlign={config.legend?.position === 'top' ? 'top' : config.legend?.position === 'bottom' ? 'bottom' : 'top'}
          />
        )}
        {config.series.map((series, index) => (
          <Area
            key={series.field}
            type={config.smooth ? 'monotone' : 'linear'}
            dataKey={series.field}
            name={series.label || series.field}
            stroke={series.color || colors[index % colors.length]}
            fill={series.color || colors[index % colors.length]}
            fillOpacity={series.fillOpacity || 0.6}
            stackId={config.stacked ? series.stackId || 'stack' : undefined}
            isAnimationActive={config.animation !== false}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  )
}


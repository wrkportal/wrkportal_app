'use client'

import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartConfig, ChartDataPoint, DEFAULT_COLORS } from '@/lib/reporting-studio/chart-types'
import { useMemo } from 'react'

interface PieChartProps {
  config: ChartConfig
  data: ChartDataPoint[]
}

export function PieChart({ config, data }: PieChartProps) {
  const colors = useMemo(() => config.colors || DEFAULT_COLORS, [config.colors])

  if (!config.categoryField || !config.valueField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Invalid chart configuration: Pie charts require categoryField and valueField</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey={config.valueField}
          nameKey={config.categoryField}
          isAnimationActive={config.animation !== false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
            />
          ))}
        </Pie>
        {config.tooltip?.show !== false && <Tooltip />}
        {config.legend?.show !== false && (
          <Legend
            verticalAlign={config.legend?.position === 'right' ? 'middle' : config.legend?.position === 'left' ? 'middle' : config.legend?.position === 'bottom' ? 'bottom' : 'top'}
            align={config.legend?.position === 'right' ? 'right' : config.legend?.position === 'left' ? 'left' : 'center'}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  )
}


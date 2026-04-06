'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ===== 1. Number Widget =====
interface NumberWidgetProps {
  title: string
  value: string | number
  change?: number // percentage change
  changeLabel?: string
  prefix?: string
  suffix?: string
  className?: string
}

export function NumberWidget({ title, value, change, changeLabel, prefix, suffix, className }: NumberWidgetProps) {
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-3xl font-bold">
          {prefix}{value}{suffix}
        </p>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 mt-1 text-sm',
            isPositive && 'text-green-500',
            isNegative && 'text-red-500',
            !isPositive && !isNegative && 'text-muted-foreground'
          )}>
            {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
            {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
            {changeLabel && <span className="text-muted-foreground text-xs ml-1">{changeLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ===== 2. Progress Ring Widget =====
interface ProgressRingWidgetProps {
  title: string
  value: number // 0-100
  label?: string
  size?: number
  color?: string
  className?: string
}

export function ProgressRingWidget({ title, value, label, size = 120, color = '#3b82f6', className }: ProgressRingWidgetProps) {
  const radius = (size - 12) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <Card className={className}>
      <CardContent className="p-5 flex flex-col items-center">
        <p className="text-sm text-muted-foreground mb-3">{title}</p>
        <div className="relative" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-1000" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <span className="text-2xl font-bold">{value}%</span>
              {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== 3. Comparison Widget =====
interface ComparisonWidgetProps {
  title: string
  current: { label: string; value: number }
  previous: { label: string; value: number }
  unit?: string
  className?: string
}

export function ComparisonWidget({ title, current, previous, unit = '', className }: ComparisonWidgetProps) {
  const maxVal = Math.max(current.value, previous.value)
  const currentWidth = maxVal > 0 ? (current.value / maxVal) * 100 : 0
  const previousWidth = maxVal > 0 ? (previous.value / maxVal) * 100 : 0
  const change = previous.value > 0 ? Math.round(((current.value - previous.value) / previous.value) * 100) : 0

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <span className={cn('text-xs font-medium', change >= 0 ? 'text-green-500' : 'text-red-500')}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span>{current.label}</span>
              <span className="font-medium">{current.value}{unit}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${currentWidth}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">{previous.label}</span>
              <span className="font-medium text-muted-foreground">{previous.value}{unit}</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-muted-foreground/30 rounded-full transition-all" style={{ width: `${previousWidth}%` }} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ===== 4. Funnel Widget =====
interface FunnelStage {
  label: string
  value: number
  color?: string
}

interface FunnelWidgetProps {
  title: string
  stages: FunnelStage[]
  className?: string
}

export function FunnelWidget({ title, stages, className }: FunnelWidgetProps) {
  const maxValue = Math.max(...stages.map((s) => s.value))
  const defaultColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc']

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-4">{title}</p>
        <div className="space-y-2">
          {stages.map((stage, i) => {
            const width = maxValue > 0 ? Math.max(20, (stage.value / maxValue) * 100) : 20
            const color = stage.color || defaultColors[i % defaultColors.length]
            return (
              <div key={stage.label} className="flex items-center gap-3">
                <div className="flex-1">
                  <div
                    className="h-8 rounded-md flex items-center px-3 text-white text-xs font-medium transition-all mx-auto"
                    style={{ width: `${width}%`, backgroundColor: color }}
                  >
                    {stage.value}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right shrink-0">{stage.label}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== 5. Heatmap Widget =====
interface HeatmapWidgetProps {
  title: string
  data: number[][] // 7 rows (days) x N columns (weeks)
  labels?: { rows?: string[]; columns?: string[] }
  className?: string
}

export function HeatmapWidget({ title, data, labels, className }: HeatmapWidgetProps) {
  const maxVal = Math.max(...data.flat())
  const dayLabels = labels?.rows || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const getColor = (val: number) => {
    if (val === 0) return 'bg-muted'
    const intensity = val / maxVal
    if (intensity < 0.25) return 'bg-green-200 dark:bg-green-900'
    if (intensity < 0.5) return 'bg-green-300 dark:bg-green-700'
    if (intensity < 0.75) return 'bg-green-400 dark:bg-green-600'
    return 'bg-green-500 dark:bg-green-500'
  }

  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-3">{title}</p>
        <div className="flex gap-1">
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((day) => (
              <div key={day} className="h-4 flex items-center text-[10px] text-muted-foreground">{day}</div>
            ))}
          </div>
          {data[0]?.map((_, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {data.map((row, rowIdx) => (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={cn('w-4 h-4 rounded-sm', getColor(row[colIdx] || 0))}
                  title={`${dayLabels[rowIdx]}: ${row[colIdx] || 0}`}
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ===== 6. Mini Table Widget =====
interface MiniTableRow {
  rank: number
  label: string
  value: string | number
  badge?: string
}

interface MiniTableWidgetProps {
  title: string
  rows: MiniTableRow[]
  valueLabel?: string
  className?: string
}

export function MiniTableWidget({ title, rows, valueLabel = 'Value', className }: MiniTableWidgetProps) {
  return (
    <Card className={className}>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground mb-3">{title}</p>
        <div className="space-y-2">
          <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-wider">
            <span className="w-6">#</span>
            <span className="flex-1">Name</span>
            <span>{valueLabel}</span>
          </div>
          {rows.slice(0, 5).map((row) => (
            <div key={row.rank} className="flex items-center text-sm py-1">
              <span className="w-6 text-xs text-muted-foreground">{row.rank}</span>
              <span className="flex-1 truncate">{row.label}</span>
              <span className="font-medium">{row.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Comprehensive chart formatting types for Excel-like flexibility
 */

export interface ChartFormatting {
  title?: TitleFormatting
  xAxis?: AxisFormatting
  yAxis?: AxisFormatting
  chartArea?: ChartAreaFormatting
  dataSeries?: DataSeriesFormatting
  legend?: LegendFormatting
  dataLabels?: DataLabelFormatting
  tooltip?: TooltipFormatting
}

export interface TitleFormatting {
  text?: string
  visible: boolean
  font: FontConfig
  color: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export interface AxisFormatting {
  customLabel?: string // Custom label text for the axis
  labelFont: FontConfig
  labelRotation: number // -90 to 90 degrees
  labelPosition: 'inside' | 'outside' | 'center' // Legacy, kept for backward compatibility
  labelOffset?: number // Distance in pixels from the axis (positive = away from chart, negative = towards chart)
  tickMarks: 'none' | 'inside' | 'outside' | 'both'
  gridLines: GridLineConfig
  axisLine: AxisLineConfig
  numberFormat: NumberFormatConfig
  min?: number | 'auto'
  max?: number | 'auto'
  interval?: number | 'auto'
  scaleType?: 'linear' | 'logarithmic' // For Y-axis only
}

export interface ChartAreaFormatting {
  backgroundColor: string
  border: BorderConfig
  padding: PaddingConfig
  plotAreaBackground: string
  width?: number | 'auto' // Chart width in pixels, or 'auto' for 100%
  height?: number | 'auto' // Chart height in pixels, or 'auto' to use default
}

export interface DataSeriesFormatting {
  colors: string[] // Color palette for series
  lineStyle: LineStyleConfig
  markerStyle: MarkerStyleConfig
  fillOpacity: number // 0-1
}

export interface LegendFormatting {
  position: 'top' | 'bottom' | 'left' | 'right' | 'none'
  font: FontConfig
  backgroundColor: string
  border: BorderConfig
  layout: 'horizontal' | 'vertical'
}

export interface DataLabelFormatting {
  visible: boolean
  position: 'center' | 'insideEnd' | 'insideBase' | 'outsideEnd'
  font: FontConfig
  format: 'value' | 'percentage' | 'both'
  decimalPlaces: number
}

export interface TooltipFormatting {
  visible: boolean
  format: string
  backgroundColor: string
  border: BorderConfig
}

export interface FontConfig {
  family: string
  size: number
  weight: 'normal' | 'bold' | 'lighter' | number
  style: 'normal' | 'italic'
  color: string
}

export interface GridLineConfig {
  visible: boolean
  style: 'solid' | 'dashed' | 'dotted'
  color: string
  width: number
}

export interface AxisLineConfig {
  visible: boolean
  color: string
  width: number
}

export interface NumberFormatConfig {
  type: 'auto' | 'number' | 'currency' | 'percentage' | 'date' | 'custom'
  format?: string // For custom format
  decimalPlaces?: number
  currencySymbol?: string
  thousandSeparator?: boolean
}

export interface BorderConfig {
  visible: boolean
  color: string
  width: number
  style: 'solid' | 'dashed' | 'dotted'
}

export interface PaddingConfig {
  top: number
  bottom: number
  left: number
  right: number
}

export interface LineStyleConfig {
  style: 'solid' | 'dashed' | 'dotted' | 'dashDot'
  width: number
}

export interface MarkerStyleConfig {
  type: 'none' | 'circle' | 'square' | 'triangle' | 'diamond'
  size: number
}

/**
 * Default formatting configuration
 */
export const DEFAULT_FORMATTING: ChartFormatting = {
  title: {
    text: '',
    visible: false,
    font: {
      family: 'Inter, sans-serif',
      size: 16,
      weight: 'bold',
      style: 'normal',
      color: '#1f2937',
    },
    position: 'top',
  },
  xAxis: {
    labelFont: {
      family: 'Inter, sans-serif',
      size: 12,
      weight: 'normal',
      style: 'normal',
      color: '#6b7280',
    },
    labelRotation: 0,
    labelPosition: 'outside',
    labelOffset: 0, // Default offset: 0 pixels
    tickMarks: 'outside',
    gridLines: {
      visible: true,
      style: 'solid',
      color: '#e5e7eb',
      width: 1,
    },
    axisLine: {
      visible: true,
      color: '#d1d5db',
      width: 1,
    },
    numberFormat: {
      type: 'auto',
      decimalPlaces: 0,
    },
    min: 'auto',
    max: 'auto',
    interval: 'auto',
  },
  yAxis: {
    labelFont: {
      family: 'Inter, sans-serif',
      size: 12,
      weight: 'normal',
      style: 'normal',
      color: '#6b7280',
    },
    labelRotation: 0,
    labelPosition: 'outside',
    labelOffset: 0, // Default offset: 0 pixels
    tickMarks: 'outside',
    gridLines: {
      visible: true,
      style: 'solid',
      color: '#e5e7eb',
      width: 1,
    },
    axisLine: {
      visible: true,
      color: '#d1d5db',
      width: 1,
    },
    numberFormat: {
      type: 'auto',
      decimalPlaces: 0,
    },
    min: 'auto',
    max: 'auto',
    interval: 'auto',
    scaleType: 'linear',
  },
  chartArea: {
    backgroundColor: 'transparent',
    border: {
      visible: false,
      color: '#d1d5db',
      width: 1,
      style: 'solid',
    },
    padding: {
      top: 20,
      bottom: 20,
      left: 20,
      right: 20,
    },
    plotAreaBackground: 'transparent',
    width: 'auto', // Default to 100% width
    height: 'auto', // Default to use provided height prop
  },
  dataSeries: {
    colors: [
      '#3b82f6', // blue
      '#10b981', // green
      '#f59e0b', // amber
      '#ef4444', // red
      '#8b5cf6', // purple
      '#06b6d4', // cyan
      '#f97316', // orange
      '#84cc16', // lime
    ],
    lineStyle: {
      style: 'solid',
      width: 2,
    },
    markerStyle: {
      type: 'none',
      size: 6,
    },
    fillOpacity: 0.8,
  },
  legend: {
    position: 'top',
    font: {
      family: 'Inter, sans-serif',
      size: 12,
      weight: 'normal',
      style: 'normal',
      color: '#374151',
    },
    backgroundColor: 'transparent',
    border: {
      visible: false,
      color: '#d1d5db',
      width: 1,
      style: 'solid',
    },
    layout: 'horizontal',
  },
  dataLabels: {
    visible: false,
    position: 'center',
    font: {
      family: 'Inter, sans-serif',
      size: 11,
      weight: 'normal',
      style: 'normal',
      color: '#1f2937',
    },
    format: 'value',
    decimalPlaces: 0,
  },
  tooltip: {
    visible: true,
    format: 'default',
    backgroundColor: '#1f2937',
    border: {
      visible: true,
      color: '#374151',
      width: 1,
      style: 'solid',
    },
  },
}

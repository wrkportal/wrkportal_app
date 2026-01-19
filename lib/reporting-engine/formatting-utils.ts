/**
 * Utility functions for applying chart formatting
 */

import type { ChartFormatting, FontConfig, NumberFormatConfig } from '@/types/chart-formatting'

/**
 * Get formatting from visualization config
 */
export function getFormatting(visualization: any): ChartFormatting | null {
  const config = typeof visualization.config === 'string'
    ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
    : (visualization.config || {})
  
  return config.formatting || null
}

/**
 * Apply font styles to a React style object
 */
export function applyFontStyles(font: FontConfig): React.CSSProperties {
  return {
    fontFamily: font.family,
    fontSize: `${font.size}px`,
    fontWeight: font.weight,
    fontStyle: font.style,
    color: font.color,
  }
}

/**
 * Format a number based on NumberFormatConfig
 */
export function formatNumber(value: number, format: NumberFormatConfig): string {
  if (value === null || value === undefined || isNaN(value)) {
    return String(value)
  }

  switch (format.type) {
    case 'auto':
      return value.toLocaleString()
    
    case 'number':
      const decimals = format.decimalPlaces ?? 0
      const formatted = value.toFixed(decimals)
      return format.thousandSeparator 
        ? parseFloat(formatted).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : formatted
    
    case 'currency':
      const currencyDecimals = format.decimalPlaces ?? 2
      const symbol = format.currencySymbol || '$'
      const currencyValue = value.toFixed(currencyDecimals)
      return format.thousandSeparator
        ? `${symbol}${parseFloat(currencyValue).toLocaleString('en-US', { minimumFractionDigits: currencyDecimals, maximumFractionDigits: currencyDecimals })}`
        : `${symbol}${currencyValue}`
    
    case 'percentage':
      const percentDecimals = format.decimalPlaces ?? 0
      return `${(value * 100).toFixed(percentDecimals)}%`
    
    case 'date':
      return new Date(value).toLocaleDateString()
    
    case 'custom':
      if (format.format) {
        // Simple custom format implementation
        // For more complex formats, you might want to use a library like numbro or numeral
        return format.format.replace(/#/g, String(value))
      }
      return String(value)
    
    default:
      return String(value)
  }
}

/**
 * Get stroke dash array for line style
 */
export function getStrokeDashArray(style: 'solid' | 'dashed' | 'dotted' | 'dashDot'): string | undefined {
  switch (style) {
    case 'solid':
      return undefined
    case 'dashed':
      return '5 5'
    case 'dotted':
      return '2 2'
    case 'dashDot':
      return '5 2 2 2'
    default:
      return undefined
  }
}

/**
 * Get marker shape for Recharts
 */
export function getMarkerShape(type: 'none' | 'circle' | 'square' | 'triangle' | 'diamond'): string {
  switch (type) {
    case 'circle':
      return 'circle'
    case 'square':
      return 'square'
    case 'triangle':
      return 'triangle'
    case 'diamond':
      return 'diamond'
    default:
      return 'circle'
  }
}

/**
 * Convert hex color to rgba with opacity
 */
export function hexToRgba(hex: string, opacity: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Chart Types and Configuration for Reporting Studio

export enum ChartType {
  // Standard Charts
  BAR = 'BAR',
  LINE = 'LINE',
  AREA = 'AREA',
  PIE = 'PIE',
  SCATTER = 'SCATTER',
  COLUMN = 'COLUMN',
  COMBO = 'COMBO',
  TABLE = 'TABLE',
  
  // Advanced Charts (for Sprint 2.2)
  SANKEY = 'SANKEY',
  SUNBURST = 'SUNBURST',
  TREEMAP = 'TREEMAP',
  HEATMAP = 'HEATMAP',
  BOX_PLOT = 'BOX_PLOT',
  WATERFALL = 'WATERFALL',
  GANTT = 'GANTT',
  
  // Geospatial Charts (for Sprint 2.3)
  MAP_CHOROPLETH = 'MAP_CHOROPLETH',
  MAP_POINT = 'MAP_POINT',
  MAP_HEAT = 'MAP_HEAT',
}

export interface ChartAxisConfig {
  field: string
  label?: string
  format?: 'number' | 'currency' | 'percent' | 'date' | 'datetime' | 'text'
  min?: number
  max?: number
  ticks?: number
  logScale?: boolean
}

export interface ChartSeriesConfig {
  field: string
  label?: string
  color?: string
  type?: 'line' | 'bar' | 'area' | 'scatter'
  yAxisId?: 'left' | 'right'
  stackId?: string
  strokeWidth?: number
  fillOpacity?: number
}

export interface ChartConfig {
  type: ChartType
  title?: string
  description?: string
  
  // Data binding
  xAxis?: ChartAxisConfig
  yAxis?: ChartAxisConfig
  yAxisRight?: ChartAxisConfig
  series: ChartSeriesConfig[]
  
  // Pie chart specific
  categoryField?: string
  valueField?: string
  
  // Styling
  colors?: string[]
  backgroundColor?: string
  grid?: {
    show?: boolean
    strokeColor?: string
    strokeDasharray?: string
  }
  legend?: {
    show?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip?: {
    show?: boolean
    format?: 'default' | 'custom'
  }
  
  // Layout
  width?: number
  height?: number
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  
  // Advanced options
  stacked?: boolean
  normalized?: boolean
  smooth?: boolean
  animation?: boolean
  
  // Advanced chart specific options
  // Heatmap
  colorScale?: 'linear' | 'log' | 'sequential' | 'diverging'
  
  // Sankey
  nodeWidth?: number
  nodePadding?: number
  
  // Treemap/Sunburst
  padding?: number
  innerRadius?: number // For sunburst
  
  // Box Plot
  showOutliers?: boolean
  showMean?: boolean
  
  // Waterfall
  positiveColor?: string
  negativeColor?: string
  totalColor?: string
  
  // Gantt
  taskHeight?: number
  showDependencies?: boolean
  
  // Geospatial
  mapCenter?: [number, number] // [latitude, longitude]
  mapZoom?: number
  mapStyle?: 'street' | 'satellite' | 'terrain'
  geoJsonUrl?: string
  locationField?: string
  valueField?: string
}

export interface ChartDataPoint {
  [key: string]: any
}

export const DEFAULT_COLORS = [
  '#9333ea', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#14b8a6', // Teal
]

export function getChartDefaultConfig(type: ChartType): Partial<ChartConfig> {
  const baseConfig: Partial<ChartConfig> = {
    colors: DEFAULT_COLORS,
    backgroundColor: '#ffffff',
    grid: {
      show: true,
      strokeColor: '#e5e7eb',
      strokeDasharray: '3 3',
    },
    legend: {
      show: true,
      position: 'top',
    },
    tooltip: {
      show: true,
      format: 'default',
    },
    margin: {
      top: 20,
      right: 30,
      bottom: 20,
      left: 20,
    },
    animation: true,
  }

  switch (type) {
    case ChartType.BAR:
    case ChartType.COLUMN:
      return {
        ...baseConfig,
        stacked: false,
      }
    
    case ChartType.LINE:
      return {
        ...baseConfig,
        smooth: false,
        strokeWidth: 2,
      }
    
    case ChartType.AREA:
      return {
        ...baseConfig,
        stacked: true,
        fillOpacity: 0.6,
      }
    
    case ChartType.PIE:
      return {
        ...baseConfig,
        legend: {
          show: true,
          position: 'right',
        },
      }
    
    case ChartType.SCATTER:
      return {
        ...baseConfig,
        strokeWidth: 1,
      }
    
    case ChartType.HEATMAP:
      return {
        ...baseConfig,
        colorScale: 'sequential',
      }
    
    case ChartType.TREEMAP:
      return {
        ...baseConfig,
        padding: 2,
      }
    
    case ChartType.WATERFALL:
      return {
        ...baseConfig,
        positiveColor: '#10b981',
        negativeColor: '#ef4444',
        totalColor: '#3b82f6',
      }
    
    case ChartType.BOX_PLOT:
      return {
        ...baseConfig,
        showOutliers: true,
        showMean: false,
      }
    
    case ChartType.SANKEY:
      return {
        ...baseConfig,
        nodeWidth: 15,
        nodePadding: 10,
      }
    
    case ChartType.SUNBURST:
      return {
        ...baseConfig,
        innerRadius: 0.3, // Percentage of outer radius
      }
    
    case ChartType.GANTT:
      return {
        ...baseConfig,
        taskHeight: 20,
        showDependencies: false,
      }
    
    case ChartType.MAP_CHOROPLETH:
    case ChartType.MAP_POINT:
    case ChartType.MAP_HEAT:
      return {
        ...baseConfig,
        mapCenter: [39.8283, -98.5795], // Center of USA
        mapZoom: 4,
        mapStyle: 'street',
      }
    
    default:
      return baseConfig
  }
}

export function validateChartConfig(config: ChartConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.type) {
    errors.push('Chart type is required')
  }

  if (!config.series || config.series.length === 0) {
    errors.push('At least one series is required')
  }

  if (config.type === ChartType.PIE) {
    if (!config.categoryField || !config.valueField) {
      errors.push('Pie charts require categoryField and valueField')
    }
  } else {
    if (!config.xAxis?.field) {
      errors.push('X-axis field is required for this chart type')
    }
    if (config.series.some(s => !s.field)) {
      errors.push('All series must have a field specified')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}


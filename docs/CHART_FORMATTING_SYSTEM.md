# Chart Formatting System - Detailed Design

## Overview
A comprehensive chart formatting system that provides Excel-like flexibility for customizing all aspects of charts, including axes, fonts, colors, labels, legends, and more.

## Formatting Categories

### 1. Chart Title
- **Text**: Custom title text
- **Font**: Family, size, weight, style
- **Color**: Text color
- **Position**: Top, bottom, left, right, center
- **Visibility**: Show/hide

### 2. X-Axis Formatting
- **Label Font**: Family, size, weight, color
- **Label Rotation**: 0°, 45°, 90°, -45°, -90°
- **Label Position**: Inside, outside, center
- **Tick Marks**: None, inside, outside, both
- **Grid Lines**: Show/hide, style (solid, dashed, dotted), color, width
- **Axis Line**: Show/hide, color, width
- **Number Format**: Auto, number, currency, percentage, date, custom
- **Min/Max Values**: Auto or custom
- **Interval**: Auto or custom

### 3. Y-Axis Formatting
- **Label Font**: Family, size, weight, color
- **Label Position**: Inside, outside, center
- **Tick Marks**: None, inside, outside, both
- **Grid Lines**: Show/hide, style, color, width
- **Axis Line**: Show/hide, color, width
- **Number Format**: Auto, number, currency, percentage, date, custom
- **Min/Max Values**: Auto or custom
- **Interval**: Auto or custom
- **Scale Type**: Linear, logarithmic

### 4. Chart Area
- **Background Color**: Fill color or transparent
- **Border**: Show/hide, color, width, style
- **Padding**: Top, bottom, left, right
- **Plot Area Background**: Fill color or transparent

### 5. Data Series
- **Colors**: Custom color palette or individual series colors
- **Line Style**: Solid, dashed, dotted, dash-dot (for line/area charts)
- **Line Width**: Thickness
- **Marker Style**: None, circle, square, triangle, diamond (for line/scatter charts)
- **Marker Size**: Size of markers
- **Fill Opacity**: Transparency (for area/bar charts)

### 6. Legend
- **Position**: Top, bottom, left, right, none
- **Font**: Family, size, weight, color
- **Background**: Fill color or transparent
- **Border**: Show/hide, color, width
- **Layout**: Horizontal, vertical

### 7. Data Labels
- **Show/Hide**: Toggle visibility
- **Position**: Center, inside end, inside base, outside end
- **Font**: Family, size, weight, color
- **Format**: Value, percentage, both
- **Decimal Places**: Number of decimal places

### 8. Tooltip
- **Show/Hide**: Toggle visibility
- **Format**: Default, custom format
- **Background**: Color
- **Border**: Color, width

## Implementation Structure

### 1. Formatting Dialog Component
- Tabbed interface for different formatting categories
- Real-time preview
- Reset to defaults option
- Apply/Cancel buttons

### 2. Configuration Schema
```typescript
interface ChartFormatting {
  title?: {
    text?: string
    visible: boolean
    font: FontConfig
    color: string
    position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }
  xAxis?: {
    labelFont: FontConfig
    labelRotation: number
    labelPosition: 'inside' | 'outside' | 'center'
    tickMarks: 'none' | 'inside' | 'outside' | 'both'
    gridLines: GridLineConfig
    axisLine: AxisLineConfig
    numberFormat: NumberFormatConfig
    min?: number
    max?: number
    interval?: number
  }
  yAxis?: {
    labelFont: FontConfig
    labelPosition: 'inside' | 'outside' | 'center'
    tickMarks: 'none' | 'inside' | 'outside' | 'both'
    gridLines: GridLineConfig
    axisLine: AxisLineConfig
    numberFormat: NumberFormatConfig
    min?: number
    max?: number
    interval?: number
    scaleType: 'linear' | 'logarithmic'
  }
  chartArea?: {
    backgroundColor: string
    border: BorderConfig
    padding: PaddingConfig
    plotAreaBackground: string
  }
  dataSeries?: {
    colors: string[]
    lineStyle: LineStyleConfig
    markerStyle: MarkerStyleConfig
    fillOpacity: number
  }
  legend?: {
    position: 'top' | 'bottom' | 'left' | 'right' | 'none'
    font: FontConfig
    backgroundColor: string
    border: BorderConfig
    layout: 'horizontal' | 'vertical'
  }
  dataLabels?: {
    visible: boolean
    position: 'center' | 'insideEnd' | 'insideBase' | 'outsideEnd'
    font: FontConfig
    format: 'value' | 'percentage' | 'both'
    decimalPlaces: number
  }
  tooltip?: {
    visible: boolean
    format: string
    backgroundColor: string
    border: BorderConfig
  }
}

interface FontConfig {
  family: string
  size: number
  weight: 'normal' | 'bold' | 'lighter' | number
  style: 'normal' | 'italic'
  color: string
}

interface GridLineConfig {
  visible: boolean
  style: 'solid' | 'dashed' | 'dotted'
  color: string
  width: number
}

interface AxisLineConfig {
  visible: boolean
  color: string
  width: number
}

interface NumberFormatConfig {
  type: 'auto' | 'number' | 'currency' | 'percentage' | 'date' | 'custom'
  format?: string // For custom format
  decimalPlaces?: number
  currencySymbol?: string
  thousandSeparator?: boolean
}

interface BorderConfig {
  visible: boolean
  color: string
  width: number
  style: 'solid' | 'dashed' | 'dotted'
}

interface PaddingConfig {
  top: number
  bottom: number
  left: number
  right: number
}

interface LineStyleConfig {
  style: 'solid' | 'dashed' | 'dotted' | 'dashDot'
  width: number
}

interface MarkerStyleConfig {
  type: 'none' | 'circle' | 'square' | 'triangle' | 'diamond'
  size: number
}
```

### 3. UI Components Needed
- `ChartFormattingDialog`: Main dialog with tabs
- `FontSelector`: Font family, size, weight, style picker
- `ColorPicker`: Color selection component
- `NumberFormatSelector`: Number format options
- `PositionSelector`: Position options (dropdown/radio)
- `LineStyleSelector`: Line style picker
- `MarkerStyleSelector`: Marker style picker
- `PaddingEditor`: Padding controls
- `PreviewPanel`: Live preview of formatting

### 4. Integration Points
- Add "Format Chart" option to chart's three dots menu
- Store formatting in `visualization.config.formatting`
- Apply formatting in `VisualizationRenderer` component
- Support all chart types (Bar, Line, Area, Pie, Scatter, Table)

## Default Formatting
- Clean, professional defaults
- Consistent with modern data visualization best practices
- Accessible color schemes
- Readable font sizes

## User Experience
1. Click three dots on chart → "Format Chart"
2. Dialog opens with tabbed interface
3. Make changes with real-time preview
4. Click "Apply" to save
5. Changes reflect immediately on chart

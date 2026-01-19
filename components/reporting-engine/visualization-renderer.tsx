'use client'

import { useEffect, useState, useMemo, useRef, useContext } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, AlertCircle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { applyFilters, mergeFilters } from '@/lib/reporting-engine/filter-engine'
import type { FilterCondition } from './filter-builder'
import {
  getFormatting,
  applyFontStyles,
  formatNumber,
  getStrokeDashArray,
  getMarkerShape,
  hexToRgba
} from '@/lib/reporting-engine/formatting-utils'
import type { ChartFormatting } from '@/types/chart-formatting'
import { DEFAULT_FORMATTING } from '@/types/chart-formatting'
import { ExportContext } from './section-dashboard-page'

// Dynamic imports for Recharts
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const ComposedChart = dynamic(() => import('recharts').then(mod => mod.ComposedChart), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })
const ScatterChart = dynamic(() => import('recharts').then(mod => mod.ScatterChart), { ssr: false })

import {
  Bar,
  Line,
  Pie,
  Cell,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Scatter,
  Legend,
} from 'recharts'

interface VisualizationRendererProps {
  visualization: any
  height?: number
  dashboardFilters?: FilterCondition[] // Dashboard-level filters that override chart filters
  topBottomFilter?: { type: 'top' | 'bottom'; n: number; field: string } | null // Top/Bottom N filter
  onDateHierarchyChange?: (visualizationId: string, level: 'year' | 'month' | 'day') => void // Date hierarchy change callback
}

export function VisualizationRenderer({ visualization, height, dashboardFilters = [], topBottomFilter = null, onDateHierarchyChange }: VisualizationRendererProps) {
  // Get export context to determine if we should render at export size
  const exportContext = useContext(ExportContext)
  const exporting = exportContext?.exporting || false

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dataSource, setDataSource] = useState<any>(null)

  // Create stable string representations for comparison using useMemo
  const filtersKey = useMemo(() => {
    const config = typeof visualization?.config === 'string'
      ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
      : (visualization?.config || {})
    return JSON.stringify(config.filters || [])
  }, [visualization?.config])

  const dashboardFiltersKey = useMemo(() =>
    JSON.stringify(dashboardFilters),
    [JSON.stringify(dashboardFilters)]
  )

  const formattingKey = useMemo(() => {
    const formatting = getFormatting(visualization)
    return JSON.stringify(formatting || {})
  }, [visualization?.config])

  const topBottomFilterKey = useMemo(() => {
    return JSON.stringify(topBottomFilter)
  }, [topBottomFilter])

  const sortConfigKey = useMemo(() => {
    const config = typeof visualization?.config === 'string'
      ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
      : (visualization?.config || {})
    return JSON.stringify(config.sort || {})
  }, [visualization?.config])

  useEffect(() => {
    fetchVisualizationData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visualization?.id, filtersKey, dashboardFiltersKey, formattingKey, topBottomFilterKey, sortConfigKey])


  const fetchVisualizationData = async () => {
    if (!visualization?.queryId) {
      setError('No query associated with this visualization')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Get query details
      const queryResponse = await fetch(`/api/reporting-engine/queries/${visualization.queryId}`)
      if (!queryResponse.ok) {
        throw new Error('Failed to fetch query')
      }

      const queryData = await queryResponse.json()
      const query = queryData.query

      if (!query?.dataSourceId) {
        throw new Error('Query has no data source')
      }

      // Check if it's a file-based data source
      const dataSourceResponse = await fetch(`/api/reporting-engine/data-sources/${query.dataSourceId}`)
      if (!dataSourceResponse.ok) {
        throw new Error('Failed to fetch data source')
      }

      const dataSourceData = await dataSourceResponse.json()
      const dataSource = dataSourceData.dataSource
      setDataSource(dataSource) // Store dataSource for date field detection

      let chartData: any[] = []

      if (dataSource.type === 'FILE') {
        // Query file-based data source
        // IMPORTANT: Don't apply groupBy in the query - let the chart renderer handle grouping
        // This ensures we get all raw rows for accurate counting
        const fileQueryResponse = await fetch(`/api/reporting-engine/data-sources/${query.dataSourceId}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            select: ['*'],
            limit: 10000, // Increased limit to handle larger datasets
            allowGroupBy: false, // Disable groupBy to get all raw rows for accurate counting
          }),
        })

        if (!fileQueryResponse.ok) {
          const errorData = await fileQueryResponse.json().catch(() => ({}))
          const errorMessage = errorData.error || 'Failed to query file data'
          const errorDetails = errorData.details ? `: ${errorData.details}` : ''
          throw new Error(`${errorMessage}${errorDetails}`)
        }

        const fileQueryData = await fileQueryResponse.json()
        // console.log('File query data:', {
        //   columns: fileQueryData.columns,
        //   rowCount: fileQueryData.rows?.length,
        //   firstRow: fileQueryData.rows?.[0],
        //   sampleRows: fileQueryData.rows?.slice(0, 3),
        // })

        // Apply filters before transforming
        // Handle config as string or object
        let config = visualization.config
        if (typeof config === 'string') {
          try {
            config = JSON.parse(config)
          } catch (e) {
            console.error('Error parsing config:', e)
            config = {}
          }
        }

        const chartFilters = config?.filters || []
        const mergedFilters = mergeFilters(chartFilters, dashboardFilters)

        // console.log('Filter check:', {
        //   visualizationId: visualization.id,
        //   visualizationName: visualization.name,
        //   configType: typeof visualization.config,
        //   config: visualization.config,
        //   parsedConfig: config,
        //   chartFilters,
        //   dashboardFilters,
        //   mergedFilters,
        // })

        // Convert rows to objects with column names as keys
        const dataObjects = fileQueryData.rows.map((row: any[]) => {
          const obj: any = {}
          fileQueryData.columns.forEach((col: string, idx: number) => {
            obj[col] = row[idx]
          })
          return obj
        })

        // console.log('Applying filters:', {
        //   chartFilters,
        //   dashboardFilters,
        //   mergedFilters,
        //   rowCount: fileQueryData.rows?.length,
        //   availableColumns: fileQueryData.columns,
        //   sampleDataObject: dataObjects[0],
        //   filterFields: mergedFilters.map(f => f.field),
        // })

        const filteredRows = applyFilters(dataObjects, mergedFilters)

        // console.log('Filtered rows:', {
        //   before: fileQueryData.rows?.length,
        //   after: filteredRows.length,
        //   sampleFiltered: filteredRows.slice(0, 3),
        //   filterResults: mergedFilters.map(filter => {
        //     const matchingCount = dataObjects.filter(row => {
        //       const fieldValue = row[filter.field]
        //       if (filter.operator === 'in' && Array.isArray(filter.value)) {
        //         return filter.value.some(v => 
        //           String(v).trim().toLowerCase() === String(fieldValue).trim().toLowerCase()
        //         )
        //       }
        //       return true
        //     }).length
        //     return {
        //       field: filter.field,
        //       operator: filter.operator,
        //       value: filter.value,
        //       matchingRows: matchingCount,
        //     }
        //   }),
        // })

        // Convert back to array format for transformDataForChart
        const filteredRowsArray = filteredRows.map((obj: any) =>
          fileQueryData.columns.map((col: string) => obj[col])
        )

        // Transform data for chart (pass dataSource for schema access)
        chartData = transformDataForChart(filteredRowsArray, fileQueryData.columns, visualization, dataSource)
        // console.log('Transformed chart data:', {
        //   count: chartData.length,
        //   firstItem: chartData[0],
        //   allItems: chartData,
        //   xAxisField: visualization.config?.xAxis?.field,
        //   yAxisFields: visualization.config?.yAxis?.fields,
        //   aggregation: visualization.config?.yAxis?.aggregation,
        // })
      } else {
        // For database tables, we'd use the query engine
        // For now, return empty data
        chartData = []
      }

      // Apply Top/Bottom N filter FIRST (if configured), then apply chart-level sorting
      let filteredData = chartData
      if (topBottomFilter && topBottomFilter.field && topBottomFilter.n > 0 && chartData.length > 0) {
        // Get the field to sort by - check if it exists in the data
        const filterField = topBottomFilter.field
        const firstItem = chartData[0]

        // Check if the field exists in the transformed data
        if (firstItem && filterField in firstItem) {
          // Sort data by the filter field to get top/bottom N
          const topBottomSortedData = [...chartData].sort((a, b) => {
            const aVal = parseFloat(String(a[filterField])) || 0
            const bVal = parseFloat(String(b[filterField])) || 0
            return topBottomFilter.type === 'top' ? bVal - aVal : aVal - bVal
          })

          // Take top/bottom N
          filteredData = topBottomSortedData.slice(0, topBottomFilter.n)
          console.log('Top/Bottom N filter applied:', {
            type: topBottomFilter.type,
            n: topBottomFilter.n,
            field: filterField,
            filteredCount: filteredData.length
          })
        } else {
          // Field might not exist in transformed data - log for debugging
          console.warn(`Top/Bottom N filter field "${filterField}" not found in chart data. Available fields:`, Object.keys(firstItem || {}))
        }
      }

      // Apply chart-level sorting AFTER filtering (if configured)
      let finalData = filteredData
      const config = typeof visualization.config === 'string'
        ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
        : (visualization.config || {})

      const sortConfig = config.sort
      if (sortConfig && sortConfig.field && filteredData.length > 0) {
        const sortField = sortConfig.field
        const firstItem = filteredData[0]

        console.log('Applying sort after filter:', {
          sortConfig,
          sortField,
          firstItemKeys: firstItem ? Object.keys(firstItem) : [],
          dataLength: filteredData.length,
          sampleData: filteredData.slice(0, 3)
        })

        if (firstItem && sortField in firstItem) {
          finalData = [...filteredData].sort((a, b) => {
            const aVal = a[sortField]
            const bVal = b[sortField]

            // Try numeric comparison first
            const aNum = parseFloat(String(aVal))
            const bNum = parseFloat(String(bVal))

            if (!isNaN(aNum) && !isNaN(bNum)) {
              // Numeric comparison
              return sortConfig.order === 'asc' ? aNum - bNum : bNum - aNum
            } else {
              // String comparison
              const aStr = String(aVal || '').toLowerCase()
              const bStr = String(bVal || '').toLowerCase()

              if (sortConfig.order === 'asc') {
                return aStr.localeCompare(bStr)
              } else {
                return bStr.localeCompare(aStr)
              }
            }
          })
          console.log('Sort applied successfully after filter. First few items:', finalData.slice(0, 3))
        } else {
          console.warn('Sort field not found in filtered data:', {
            sortField,
            availableFields: firstItem ? Object.keys(firstItem) : [],
            firstItem
          })
        }
      }

      setData(finalData)
    } catch (err: any) {
      console.error('Error fetching visualization data:', err)
      // Provide more helpful error messages
      let errorMessage = err.message || 'Failed to load chart data'

      // Check for specific error types
      if (errorMessage.includes('Failed to read file')) {
        errorMessage = 'Unable to read the data file. Please check that the file exists and is accessible.'
      } else if (errorMessage.includes('Data source not found')) {
        errorMessage = 'The data source for this chart could not be found. It may have been deleted.'
      } else if (errorMessage.includes('Forbidden') || errorMessage.includes('Unauthorized')) {
        errorMessage = 'You do not have permission to access this data source.'
      } else if (errorMessage.includes('No query associated')) {
        errorMessage = 'This visualization is missing a data query. Please reconfigure it.'
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if a value is a date
  const isDateValue = (value: any): boolean => {
    if (!value) return false
    if (value instanceof Date) return true
    if (typeof value === 'string') {
      // Check if it's a date string (ISO format, common date formats)
      // More comprehensive date patterns: YYYY-MM-DD, MM/DD/YYYY, YYYY/MM/DD, DD-MM-YYYY, etc.
      const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}|^\d{1,2}[-/]\d{1,2}[-/]\d{4}|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      if (dateRegex.test(value.trim())) {
        const parsed = new Date(value)
        return !isNaN(parsed.getTime())
      }
    }
    // Check if it's a number that could be a timestamp (milliseconds or seconds since epoch)
    if (typeof value === 'number' && value > 946684800000 && value < 4102444800000) {
      // Rough range: Jan 1, 2000 to Jan 1, 2100 in milliseconds
      const parsed = new Date(value)
      return !isNaN(parsed.getTime())
    }
    return false
  }

  // Helper function to extract date parts
  const getDatePart = (dateValue: any, level: 'year' | 'month' | 'day'): string => {
    if (!dateValue) return ''
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
      if (isNaN(date.getTime())) return String(dateValue)

      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()

      switch (level) {
        case 'year':
          return `${year}`
        case 'month':
          return `${year}-${String(month).padStart(2, '0')}`
        case 'day':
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        default:
          return String(dateValue)
      }
    } catch (e) {
      // If date parsing fails, return the original value as string
      return String(dateValue)
    }
  }

  // Helper function to format date for display
  const formatDateForDisplay = (dateValue: any, level: 'year' | 'month' | 'day'): string => {
    if (!dateValue) return ''
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
    if (isNaN(date.getTime())) return String(dateValue)

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    switch (level) {
      case 'year':
        return `${year}`
      case 'month':
        return `${monthNames[month - 1]} ${year}`
      case 'day':
        return `${monthNames[month - 1]} ${day}, ${year}`
      default:
        return String(dateValue)
    }
  }

  const transformDataForChart = (rows: any[][], columns: string[], viz: any, dataSource?: any) => {
    if (!rows || rows.length === 0) {
      console.warn('No rows to transform')
      return []
    }

    if (!columns || columns.length === 0) {
      console.warn('No columns available')
      return []
    }

    // Get axis configuration from visualization (from config field)
    const xAxisConfig = viz.config?.xAxis || viz.xAxis
    const yAxisConfig = viz.config?.yAxis || viz.yAxis
    const dualAxisConfig = viz.config?.dualAxis
    const chartType = viz.type || 'bar'
    const xAxisField = xAxisConfig?.field || (chartType !== 'kpi' ? columns[0] : undefined)

    // Check if X-axis field is a date field
    // Be conservative - only mark as date if we're very confident
    let isDateField = false
    let dateHierarchyLevel: 'year' | 'month' | 'day' = 'year'

    // First priority: Check schema column type (most reliable)
    if (xAxisField && dataSource?.schema?.columns) {
      const xAxisColumn = dataSource.schema.columns.find((col: any) => col.name === xAxisField)
      if (xAxisColumn) {
        const colType = String(xAxisColumn.type || '').toLowerCase()
        if (colType.includes('date') || colType.includes('timestamp') || colType.includes('datetime') || colType.includes('time')) {
          isDateField = true
        }
      }
    }

    // Second priority: Check actual data values (sample multiple rows)
    if (!isDateField && xAxisField && rows.length > 0) {
      const sampleSize = Math.min(10, rows.length)
      let dateCount = 0
      const xAxisIndex = columns.indexOf(xAxisField)

      if (xAxisIndex >= 0) {
        for (let i = 0; i < sampleSize; i++) {
          const row = rows[i]
          if (row && row[xAxisIndex] !== undefined && row[xAxisIndex] !== null && row[xAxisIndex] !== '') {
            if (isDateValue(row[xAxisIndex])) {
              dateCount++
            }
          }
        }
        // Only mark as date if majority of samples are dates
        if (dateCount > sampleSize / 2) {
          isDateField = true
        }
      }
    }

    // Last resort: Check field name (but only if config explicitly says it's a date hierarchy)
    // This prevents false positives from fields like "CreatedBy" or "UpdatedAt" when they're not dates
    if (!isDateField && xAxisConfig?.dateHierarchyLevel) {
      // If user explicitly set a date hierarchy level, trust them
      isDateField = true
    }

    // Get date hierarchy level from config (or default to year)
    if (isDateField && xAxisConfig?.dateHierarchyLevel) {
      dateHierarchyLevel = xAxisConfig.dateHierarchyLevel
    }

    // For dual-axis charts, handle both axes
    let yAxisFields: string[] = []
    let aggregation: string = 'sum'

    if (chartType === 'dual-axis' && dualAxisConfig) {
      // For dual-axis, we need to aggregate all fields from both axes
      // Use the left axis aggregation for transformation, but we'll handle both in rendering
      yAxisFields = [...(dualAxisConfig.leftAxis?.fields || []), ...(dualAxisConfig.rightAxis?.fields || [])]
      aggregation = dualAxisConfig.leftAxis?.aggregation || 'sum'
    } else {
      yAxisFields = yAxisConfig?.fields || (columns[1] ? [columns[1]] : [])
      aggregation = yAxisConfig?.aggregation || 'sum'
    }
    // console.log('Transform config:', {
    //   xAxisField,
    //   yAxisFields,
    //   aggregation,
    //   availableColumns: columns,
    //   chartType,
    // })

    // For KPI cards, X-axis is optional
    if (chartType !== 'kpi' && chartType !== 'dual-axis' && !xAxisField) {
      console.error('No X-axis field configured')
      return []
    }

    // For dual-axis charts, check dualAxisConfig instead
    if (chartType === 'dual-axis') {
      const dualAxisConfig = viz.config?.dualAxis
      if (!dualAxisConfig) {
        console.error('No dual-axis configuration found')
        return []
      }
      const leftFields = dualAxisConfig.leftAxis?.fields || []
      const rightFields = dualAxisConfig.rightAxis?.fields || []
      if (leftFields.length === 0 && rightFields.length === 0) {
        console.error('No fields configured for dual-axis chart')
        return []
      }
    } else if (!yAxisFields || yAxisFields.length === 0) {
      console.error('No Y-axis fields configured')
      return []
    }

    // Transform rows to objects
    const dataObjects = rows.map(row => {
      const obj: any = {}
      columns.forEach((col, idx) => {
        // Handle null/undefined values
        obj[col] = row[idx] !== undefined && row[idx] !== null ? row[idx] : null
      })
      return obj
    })

    // console.log('Data objects sample:', {
    //   count: dataObjects.length,
    //   firstItem: dataObjects[0],
    //   xAxisFieldValue: dataObjects[0]?.[xAxisField],
    //   yAxisFieldValue: dataObjects[0]?.[yAxisFields[0]],
    //   sampleRows: dataObjects.slice(0, 5),
    // })

    // For KPI cards, aggregate across ALL data without grouping
    if (chartType === 'kpi') {
      const kpiItem: any = {}
      yAxisFields.forEach(field => {
        let aggregated: number
        if (aggregation === 'count') {
          // Count total rows
          aggregated = dataObjects.length
        } else {
          // For other aggregations, parse numeric values
          const values = dataObjects
            .map(item => {
              const val = item[field]
              if (val === null || val === undefined || val === '') {
                return null
              }
              if (typeof val === 'number') {
                return val
              }
              if (typeof val === 'string') {
                const cleaned = val.replace(/[^0-9.-]/g, '')
                const parsed = parseFloat(cleaned)
                return isNaN(parsed) ? null : parsed
              }
              return null
            })
            .filter(v => v !== null) as number[]

          if (values.length === 0) {
            aggregated = 0
          } else {
            switch (aggregation) {
              case 'sum':
                aggregated = values.reduce((a, b) => a + b, 0)
                break
              case 'avg':
                aggregated = values.reduce((a, b) => a + b, 0) / values.length
                break
              case 'min':
                aggregated = Math.min(...values)
                break
              case 'max':
                aggregated = Math.max(...values)
                break
              default:
                aggregated = values.reduce((a, b) => a + b, 0)
            }
          }
        }
        kpiItem[field] = Math.round(aggregated * 100) / 100
      })
      return [kpiItem]
    }

    // Debug: Count rows per X-axis value before grouping
    const preGroupCounts: Record<string, number> = {}
    dataObjects.forEach(item => {
      let key: string
      if (isDateField && xAxisField) {
        key = getDatePart(item[xAxisField], dateHierarchyLevel)
      } else {
        key = String(item[xAxisField] || '')
      }
      preGroupCounts[key] = (preGroupCounts[key] || 0) + 1
    })
    // console.log('Rows per X-axis value (before grouping):', preGroupCounts)

    // Group data by X-axis only (no Group By concept)
    // For date fields, group by the selected hierarchy level
    const grouped: Record<string, any[]> = {}
    dataObjects.forEach(item => {
      let key: string
      if (isDateField && xAxisField && item[xAxisField] != null) {
        try {
          // Use date hierarchy level for grouping
          const datePart = getDatePart(item[xAxisField], dateHierarchyLevel)
          key = datePart || String(item[xAxisField] || '')
        } catch (e) {
          // If date grouping fails, fall back to string
          key = String(item[xAxisField] || '')
        }
      } else {
        key = String(item[xAxisField] || '')
      }
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(item)
    })

    // Helper function to aggregate a field
    const aggregateField = (items: any[], field: string, agg: string): number => {
      let aggregated: number

      if (agg === 'count') {
        // For count, we need to count UNIQUE values of the Y-axis field
        const uniqueValues = new Set<string>()
        items.forEach(item => {
          const value = item[field]
          if (value !== null && value !== undefined && value !== '') {
            uniqueValues.add(String(value))
          }
        })
        aggregated = uniqueValues.size
      } else {
        // For other aggregations, parse numeric values
        const values = items
          .map(item => {
            const val = item[field]
            if (val === null || val === undefined || val === '') {
              return null
            }
            // Try to parse as number
            if (typeof val === 'number') {
              return val
            }
            if (typeof val === 'string') {
              // Remove any non-numeric characters except decimal point and minus
              const cleaned = val.replace(/[^0-9.-]/g, '')
              const parsed = parseFloat(cleaned)
              return isNaN(parsed) ? null : parsed
            }
            return null
          })
          .filter(v => v !== null) as number[]

        if (values.length === 0) {
          aggregated = 0
        } else {
          switch (agg) {
            case 'sum':
              aggregated = values.reduce((a, b) => a + b, 0)
              break
            case 'avg':
              aggregated = values.reduce((a, b) => a + b, 0) / values.length
              break
            case 'min':
              aggregated = Math.min(...values)
              break
            case 'max':
              aggregated = Math.max(...values)
              break
            default:
              aggregated = values.reduce((a, b) => a + b, 0)
          }
        }
      }
      return Math.round(aggregated * 100) / 100 // Round to 2 decimals
    }

    // For dual-axis charts, we need to aggregate fields with their respective aggregations
    // dualAxisConfig is already declared at the top of this function
    const isDualAxis = chartType === 'dual-axis' && dualAxisConfig

    const result = Object.entries(grouped).map(([key, items]) => {
      // For date fields, use formatted display value
      let displayValue = key
      if (isDateField && xAxisField && items && items.length > 0 && items[0] && items[0][xAxisField] != null) {
        try {
          displayValue = formatDateForDisplay(items[0][xAxisField], dateHierarchyLevel)
          if (!displayValue || displayValue === '') displayValue = key // Fallback if formatting returns empty
        } catch (e) {
          // If formatting fails, use the key
          displayValue = key
        }
      }

      const chartItem: any = {
        [xAxisField]: displayValue || key, // Ensure we always have a value
      }

      // Only add drill-down metadata for date fields
      if (isDateField && xAxisField && items && items.length > 0 && items[0] && items[0][xAxisField] != null) {
        chartItem.__originalKey = key
        chartItem.__dateValue = items[0][xAxisField]
      }

      if (isDualAxis) {
        // Handle dual-axis: aggregate left and right axis fields separately
        const leftAxisConfig = dualAxisConfig.leftAxis
        const rightAxisConfig = dualAxisConfig.rightAxis

        // Aggregate left axis fields
        if (leftAxisConfig?.fields) {
          leftAxisConfig.fields.forEach((field: string) => {
            const fieldAggregation = leftAxisConfig.aggregation || 'sum'
            chartItem[field] = aggregateField(items, field, fieldAggregation)
          })
        }

        // Aggregate right axis fields
        if (rightAxisConfig?.fields) {
          rightAxisConfig.fields.forEach((field: string) => {
            const fieldAggregation = rightAxisConfig.aggregation || 'sum'
            chartItem[field] = aggregateField(items, field, fieldAggregation)
          })
        }
      } else {
        // Regular charts: aggregate all Y-axis fields with the same aggregation
        yAxisFields.forEach((field: string) => {
          chartItem[field] = aggregateField(items, field, aggregation)
        })
      }

      return chartItem
    })

    // console.log('Final chart data after aggregation:', {
    //   resultCount: result.length,
    //   sampleResults: result.slice(0, 3),
    //   allResults: result,
    //   xAxisField,
    //   yAxisFields,
    //   isDateField,
    //   dateHierarchyLevel,
    // })

    return result
  }

  const renderChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-muted-foreground">Loading chart data...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No data available</p>
          </div>
        </div>
      )
    }

    const chartType = visualization.type || 'bar'
    // Get axis config from config field (stored as JSON)
    let config = visualization.config
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config)
      } catch (e) {
        config = {}
      }
    }

    const xAxisConfig = config?.xAxis || visualization.xAxis
    const yAxisConfig = config?.yAxis || visualization.yAxis
    const dualAxisConfig = config?.dualAxis
    const xAxisField = xAxisConfig?.field
    const yAxisFields = yAxisConfig?.fields || []

    // Check if X-axis field is a date field (reusable check)
    // This should match the detection logic in transformDataForChart
    // Be conservative - only mark as date if we're very confident
    let isDateField = false

    // First check: Check schema column type (most reliable)
    if (xAxisField && dataSource?.schema?.columns) {
      const xAxisColumn = dataSource.schema.columns.find((col: any) => col.name === xAxisField)
      if (xAxisColumn) {
        const colType = String(xAxisColumn.type || '').toLowerCase()
        if (colType.includes('date') || colType.includes('timestamp') || colType.includes('datetime') || colType.includes('time')) {
          isDateField = true
        }
      }
    }

    // Second check: Check actual data values (sample multiple rows)
    if (!isDateField && xAxisField && data.length > 0) {
      const sampleSize = Math.min(10, data.length)
      let dateCount = 0
      let totalChecked = 0
      for (let i = 0; i < sampleSize; i++) {
        const item = data[i]
        if (item && xAxisField in item && item[xAxisField] !== null && item[xAxisField] !== undefined && item[xAxisField] !== '') {
          totalChecked++
          if (isDateValue(item[xAxisField])) {
            dateCount++
          }
        }
      }
      // Only mark as date if majority of samples are dates
      if (totalChecked > 0 && dateCount > totalChecked / 2) {
        isDateField = true
      }
    }

    // Third check: If config explicitly sets dateHierarchyLevel, trust it
    if (!isDateField && xAxisConfig?.dateHierarchyLevel) {
      isDateField = true
    }

    // Debug logging (enable temporarily to debug)
    // console.log('Date field detection:', {
    //   xAxisField,
    //   isDateField,
    //   hasDataSource: !!dataSource,
    //   hasSchema: !!dataSource?.schema?.columns,
    //   dataLength: data.length,
    //   firstValue: data.length > 0 && xAxisField ? data[0]?.[xAxisField] : null,
    //   onDateHierarchyChange: !!onDateHierarchyChange,
    //   currentDateLevel: xAxisConfig?.dateHierarchyLevel || 'year'
    // })

    const currentDateLevel = xAxisConfig?.dateHierarchyLevel || 'year'

    // Date Hierarchy UI Component
    const DateHierarchyControls = () => {
      if (!isDateField || !onDateHierarchyChange) return null

      return (
        <div className="flex items-center gap-2 mb-2 px-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Group by:</span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant={currentDateLevel === 'year' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onDateHierarchyChange(visualization.id, 'year')}
            >
              Year
            </Button>
            <Button
              type="button"
              variant={currentDateLevel === 'month' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onDateHierarchyChange(visualization.id, 'month')}
            >
              Month
            </Button>
            <Button
              type="button"
              variant={currentDateLevel === 'day' ? 'default' : 'outline'}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onDateHierarchyChange(visualization.id, 'day')}
            >
              Day
            </Button>
          </div>
        </div>
      )
    }

    // For dual-axis charts, get fields from both axes
    const leftAxisFields = dualAxisConfig?.leftAxis?.fields || []
    const rightAxisFields = dualAxisConfig?.rightAxis?.fields || []

    // Get formatting
    const formatting: ChartFormatting = getFormatting(visualization) || DEFAULT_FORMATTING

    // Get chart dimensions from formatting or use defaults
    // When exporting, use fixed export dimensions (PPT resolution); otherwise use formatting/container dimensions
    const EXPORT_WIDTH = 1200
    const EXPORT_HEIGHT = 700

    const chartArea = formatting.chartArea || DEFAULT_FORMATTING.chartArea!

    // Use fixed export dimensions when exporting, otherwise use formatting/container dimensions
    const chartWidth = exporting
      ? EXPORT_WIDTH
      : (chartArea.width === 'auto' || !chartArea.width ? '100%' : (typeof chartArea.width === 'number' ? `${chartArea.width}px` : chartArea.width))

    const chartHeight = exporting
      ? EXPORT_HEIGHT
      : (height !== undefined
        ? height
        : (chartArea.height === 'auto' || !chartArea.height ? '100%' : (typeof chartArea.height === 'number' ? `${chartArea.height}px` : chartArea.height)))

    // Log for debugging (as requested in sanity check)
    if (exporting) {
      console.log('exporting', exporting, chartWidth, chartHeight)
    }

    // Initialize axis formatting early so it can be used below
    const xAxisFormatting = formatting.xAxis || DEFAULT_FORMATTING.xAxis!
    const yAxisFormatting = formatting.yAxis || DEFAULT_FORMATTING.yAxis!

    // Use formatting colors if available, otherwise fallback
    const colors = formatting.dataSeries?.colors || visualization.config?.colors || ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
    const showGrid = formatting.xAxis?.gridLines?.visible !== false && formatting.yAxis?.gridLines?.visible !== false

    // Format axis labels - convert field names to readable labels
    const formatAxisLabel = (fieldName: string) => {
      if (!fieldName) return ''
      // Replace underscores and hyphens with spaces, then capitalize words
      return fieldName
        .replace(/[_-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
    }

    // Use custom labels if provided, otherwise format field names
    // Only use customLabel if it's a non-empty string
    const xAxisLabel = (xAxisFormatting.customLabel && xAxisFormatting.customLabel.trim() !== '')
      ? xAxisFormatting.customLabel
      : formatAxisLabel(xAxisField || '')
    const yAxisLabel = (yAxisFormatting.customLabel && yAxisFormatting.customLabel.trim() !== '')
      ? yAxisFormatting.customLabel
      : (yAxisFields.length > 0
        ? formatAxisLabel(yAxisFields[0])
        : 'Value')

    // KPI cards don't need X-axis field, only Y-axis
    // For KPI cards, skip X-axis validation and go straight to rendering
    if (chartType === 'kpi') {
      if (yAxisFields.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">Value field not configured</p>
            </div>
          </div>
        )
      }
      // KPI cards are rendered in the switch statement below, so we continue
    } else if (chartType === 'dual-axis') {
      // For dual-axis charts, X-axis is required and at least one field on either axis
      if (!xAxisField) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">X-axis field not configured</p>
            </div>
          </div>
        )
      }
      if (leftAxisFields.length === 0 && rightAxisFields.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">No fields configured for dual-axis chart</p>
            </div>
          </div>
        )
      }
      // For dual-axis charts, skip the yAxisFields check since we use leftAxisFields and rightAxisFields
    } else {
      // For other non-KPI charts, X-axis is required
      if (!xAxisField) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">X-axis field not configured</p>
            </div>
          </div>
        )
      }
      // Check Y-axis fields for non-dual-axis charts
      if (yAxisFields.length === 0) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-destructive">Y-axis fields not configured</p>
            </div>
          </div>
        )
      }
    }

    // Apply chart area formatting
    const chartAreaFormatting = formatting.chartArea || DEFAULT_FORMATTING.chartArea!
    const margin = {
      top: chartAreaFormatting.padding.top,
      right: chartAreaFormatting.padding.right,
      left: chartAreaFormatting.padding.left,
      bottom: chartAreaFormatting.padding.bottom,
    }

    // Apply background and border styles
    const chartContainerStyle: React.CSSProperties = {
      width: '100%',
      height: chartHeight === '100%' ? '100%' : (typeof chartHeight === 'string' ? chartHeight : `${chartHeight}px`),
      minHeight: typeof chartHeight === 'number' ? `${chartHeight}px` : '200px',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: chartAreaFormatting.backgroundColor === 'transparent' ? undefined : chartAreaFormatting.backgroundColor,
      border: chartAreaFormatting.border.visible
        ? `${chartAreaFormatting.border.width}px ${chartAreaFormatting.border.style} ${chartAreaFormatting.border.color}`
        : 'none',
      borderRadius: '4px',
      padding: '8px',
    }

    // Ensure data is always an array
    let safeData = Array.isArray(data) ? data : []

    // When sorting is applied, we need to ensure Recharts respects the order
    // Recharts may reorder categories, so we'll use index-based ordering
    let useIndexBasedOrdering = false
    if (config.sort?.field && safeData.length > 0) {
      useIndexBasedOrdering = true
      // Add index field for maintaining sort order
      safeData = safeData.map((item: any, index: number) => ({
        ...item,
        __index: index, // Use index to maintain order
        __displayValue: String(item[xAxisField]) // Store original value for display
      }))

      // console.log('Chart rendering with sorted data:', {
      //   sortField: config.sort.field,
      //   sortOrder: config.sort.order,
      //   firstThreeItems: safeData.slice(0, 3).map((d: any) => ({
      //     [config.sort.field]: d[config.sort.field],
      //     [xAxisField]: d[xAxisField],
      //     __index: d.__index,
      //     __displayValue: d.__displayValue
      //   })),
      //   xAxisField,
      //   useIndexBasedOrdering
      // })
    }

    const commonProps = {
      data: safeData,
      margin,
    }

    // Format number function for axes
    const formatAxisNumber = (value: any) => {
      if (typeof value !== 'number') return value
      const axisFormat = formatting.xAxis?.numberFormat || DEFAULT_FORMATTING.xAxis!.numberFormat
      return formatNumber(value, axisFormat)
    }

    const formatYAxisNumber = (value: any) => {
      if (typeof value !== 'number') return value
      const axisFormat = formatting.yAxis?.numberFormat || DEFAULT_FORMATTING.yAxis!.numberFormat
      return formatNumber(value, axisFormat)
    }

    // X-Axis and Y-Axis formatting are already initialized above
    const xAxisLabelStyle = applyFontStyles(xAxisFormatting.labelFont)
    const yAxisLabelStyle = applyFontStyles(yAxisFormatting.labelFont)

    // Calculate Y-axis domain from formatting settings
    // Use manual values if set, otherwise use auto (let Recharts decide)
    // Pre-calculate domain if both min and max are set (for better ticks alignment)
    const calculateStaticDomain = () => {
      if (!data || !Array.isArray(data) || data.length === 0) return undefined
      if (!yAxisFields || !Array.isArray(yAxisFields) || yAxisFields.length === 0) return undefined

      // Calculate actual min/max from data values (only numeric values)
      const allValues = data.flatMap((d: any) =>
        yAxisFields.map((field: string) => {
          const val = d[field]
          if (val === null || val === undefined || val === '') return null
          const num = typeof val === 'number' ? val : parseFloat(String(val))
          return isNaN(num) ? null : num
        })
      ).filter(v => v !== null) as number[]

      // If no valid values, return undefined
      if (allValues.length === 0) return undefined

      const dataMin = Math.min(...allValues)
      const dataMax = Math.max(...allValues)

      // If min and max are the same, add padding
      let actualMin = dataMin
      let actualMax = dataMax
      if (dataMin === dataMax) {
        const padding = Math.abs(dataMin) * 0.1 || 1
        actualMin = dataMin - padding
        actualMax = dataMax + padding
      }

      const minIsAuto = yAxisFormatting.min === 'auto' || yAxisFormatting.min === undefined
      const maxIsAuto = yAxisFormatting.max === 'auto' || yAxisFormatting.max === undefined

      // If both are set manually, return static array (better for ticks)
      if (!minIsAuto && !maxIsAuto) {
        const minValue = typeof yAxisFormatting.min === 'number' ? yAxisFormatting.min : actualMin
        const maxValue = typeof yAxisFormatting.max === 'number' ? yAxisFormatting.max : actualMax
        return [minValue, maxValue]
      }

      // If both are auto, return the data min/max (not starting from 0)
      if (minIsAuto && maxIsAuto) {
        return [actualMin, actualMax]
      }

      return undefined // Use function for dynamic calculation when one is auto and one is manual
    }

    const staticDomain = calculateStaticDomain()

    const getYAxisDomain = (dataMin: number, dataMax: number): [number, number] => {
      // If we have a static domain, use it
      if (staticDomain) {
        return staticDomain as [number, number]
      }

      // Calculate actual min/max from data (same logic as calculateStaticDomain)
      const allValues = data.flatMap((d: any) =>
        yAxisFields.map((field: string) => {
          const val = d[field]
          if (val === null || val === undefined || val === '') return null
          const num = typeof val === 'number' ? val : parseFloat(String(val))
          return isNaN(num) ? null : num
        })
      ).filter(v => v !== null) as number[]

      // Use calculated values if available, otherwise use passed params
      const actualDataMin = allValues.length > 0 ? Math.min(...allValues) : dataMin
      const actualDataMax = allValues.length > 0 ? Math.max(...allValues) : dataMax

      // If min and max are the same, add padding
      let calculatedMin = actualDataMin
      let calculatedMax = actualDataMax
      if (actualDataMin === actualDataMax && actualDataMin !== 0) {
        const padding = Math.abs(actualDataMin) * 0.1 || 1
        calculatedMin = actualDataMin - padding
        calculatedMax = actualDataMax + padding
      }

      const minIsAuto = yAxisFormatting.min === 'auto' || yAxisFormatting.min === undefined
      const maxIsAuto = yAxisFormatting.max === 'auto' || yAxisFormatting.max === undefined

      // When auto, use calculated min/max (not starting from 0)
      const minValue = minIsAuto
        ? calculatedMin
        : (typeof yAxisFormatting.min === 'number' ? yAxisFormatting.min : calculatedMin)
      const maxValue = maxIsAuto
        ? calculatedMax
        : (typeof yAxisFormatting.max === 'number' ? yAxisFormatting.max : calculatedMax)

      return [minValue, maxValue]
    }

    // Calculate ticks array if interval is specified
    // This needs to use the same logic as getYAxisDomain to ensure consistency
    const calculateYAxisTicks = () => {
      const tickInterval = typeof yAxisFormatting.interval === 'number'
        ? yAxisFormatting.interval
        : undefined

      if (!tickInterval) return undefined

      // Ensure data is available and is an array
      if (!data || !Array.isArray(data) || data.length === 0) {
        return undefined
      }

      // Ensure yAxisFields is an array
      if (!yAxisFields || !Array.isArray(yAxisFields) || yAxisFields.length === 0) {
        return undefined
      }

      // Calculate min/max from data first (same as domain function)
      const allValues = data.flatMap((d: any) =>
        yAxisFields.map((field: string) => parseFloat(d[field]) || 0)
      )
      const dataMin = allValues.length > 0 ? Math.min(...allValues) : 0
      const dataMax = allValues.length > 0 ? Math.max(...allValues) : 100

      // Use the same logic as getYAxisDomain to get min/max
      const minIsAuto = yAxisFormatting.min === 'auto' || yAxisFormatting.min === undefined
      const maxIsAuto = yAxisFormatting.max === 'auto' || yAxisFormatting.max === undefined

      const minVal = minIsAuto
        ? dataMin
        : (typeof yAxisFormatting.min === 'number' ? yAxisFormatting.min : dataMin)
      const maxVal = maxIsAuto
        ? dataMax
        : (typeof yAxisFormatting.max === 'number' ? yAxisFormatting.max : dataMax)

      // Generate ticks at the specified interval
      // Always start from minVal, then add ticks at exact intervals: minVal, minVal+interval, minVal+2*interval, etc.
      const ticks: number[] = []

      // Always start with minVal as the first tick
      ticks.push(Number(minVal.toFixed(2)))

      // Generate subsequent ticks: minVal + interval, minVal + 2*interval, etc.
      let currentValue = minVal + tickInterval

      // Generate ticks at exact intervals from minVal
      while (currentValue <= maxVal) {
        ticks.push(Number(currentValue.toFixed(2)))
        currentValue += tickInterval
        // Prevent infinite loop
        if (ticks.length > 1000) break
      }

      // Always include maxVal at the end if it's not already there
      const lastTick = ticks[ticks.length - 1]
      if (lastTick && Math.abs(lastTick - maxVal) > 0.01) {
        ticks.push(Number(maxVal.toFixed(2)))
      }

      // Remove duplicates and sort
      const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b)

      return uniqueTicks.length > 0 ? uniqueTicks : undefined
    }

    const yAxisTicks = calculateYAxisTicks()

    // Grid line formatting
    const gridLineStyle = {
      stroke: xAxisFormatting.gridLines.color,
      strokeWidth: xAxisFormatting.gridLines.width,
      strokeDasharray: xAxisFormatting.gridLines.style === 'solid' ? undefined :
        xAxisFormatting.gridLines.style === 'dashed' ? '5 5' : '2 2',
    }

    // Tooltip formatting
    const tooltipFormatting = formatting.tooltip || DEFAULT_FORMATTING.tooltip!
    const tooltipContentStyle = {
      backgroundColor: tooltipFormatting.backgroundColor,
      border: tooltipFormatting.border.visible
        ? `${tooltipFormatting.border.width}px ${tooltipFormatting.border.style} ${tooltipFormatting.border.color}`
        : 'none',
      borderRadius: '4px',
      padding: '8px',
    }

    switch (chartType) {
      case 'bar':
        // Debug: Log data structure
        // console.log('Bar chart data:', {
        //   dataLength: data.length,
        //   firstItem: data[0],
        //   xAxisField,
        //   yAxisFields,
        //   dataKeys: data[0] ? Object.keys(data[0]) : [],
        //   firstItemValues: data[0] ? Object.entries(data[0]).map(([k, v]) => `${k}: ${v} (${typeof v})`) : [],
        // })

        // Check if X-axis field is a date field
        let isDateField = false
        if (xAxisField && dataSource?.schema?.columns) {
          const xAxisColumn = dataSource.schema.columns.find((col: any) => col.name === xAxisField)
          if (xAxisColumn) {
            const colType = String(xAxisColumn.type || '').toLowerCase()
            isDateField = colType.includes('date') || colType.includes('timestamp') || colType.includes('datetime')
          }
        }

        // If not found in schema, check the actual data
        if (!isDateField && xAxisField && data.length > 0) {
          const firstItem = data[0]
          if (firstItem && xAxisField in firstItem) {
            isDateField = isDateValue(firstItem[xAxisField])
          }
        }

        const currentDateLevel = xAxisConfig?.dateHierarchyLevel || 'year'

        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            {/* Date Hierarchy Controls */}
            {isDateField && onDateHierarchyChange && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Group by:</span>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={currentDateLevel === 'year' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onDateHierarchyChange(visualization.id, 'year')}
                  >
                    Year
                  </Button>
                  <Button
                    type="button"
                    variant={currentDateLevel === 'month' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onDateHierarchyChange(visualization.id, 'month')}
                  >
                    Month
                  </Button>
                  <Button
                    type="button"
                    variant={currentDateLevel === 'day' ? 'default' : 'outline'}
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => onDateHierarchyChange(visualization.id, 'day')}
                  >
                    Day
                  </Button>
                </div>
              </div>
            )}
            {exporting ? (
              <BarChart
                {...commonProps}
                width={typeof chartWidth === 'number' ? chartWidth : 1200}
                height={typeof chartHeight === 'number' ? chartHeight : 700}
                key={`bar-${JSON.stringify(config.sort || {})}`}
              >
                {showGrid && <CartesianGrid key="grid" {...gridLineStyle} />}
                <XAxis
                  key="xaxis"
                  dataKey={useIndexBasedOrdering ? '__index' : xAxisField}
                  type="category"
                  angle={xAxisFormatting.labelRotation}
                  textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                  height={xAxisFormatting.labelRotation !== 0 ? 60 : 40}
                  interval={0}
                  tick={{ style: xAxisLabelStyle }}
                  tickFormatter={(value: any, index: number) => {
                    if (useIndexBasedOrdering) {
                      // When using index-based ordering, value is the __index (0, 1, 2, ...)
                      // Find the data item with matching __index
                      const dataItem = safeData.find((d: any) => d.__index === value) || safeData[value]
                      return dataItem ? String(dataItem[xAxisField] || dataItem.__displayValue || value) : String(value)
                    }
                    return formatAxisNumber(value)
                  }}
                  scale="band"
                  padding={{ left: 0, right: 0 }}
                  label={{
                    value: xAxisLabel,
                    position: xAxisFormatting.labelPosition === 'inside'
                      ? 'insideBottom'
                      : xAxisFormatting.labelPosition === 'center'
                        ? 'insideBottom'
                        : 'outside',
                    offset: xAxisFormatting.labelOffset !== undefined
                      ? xAxisFormatting.labelOffset
                      : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                    style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={xAxisFormatting.axisLine.width}
                />
                <YAxis
                  key="yaxis"
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: yAxisFormatting.labelPosition === 'inside'
                      ? 'insideLeft'
                      : yAxisFormatting.labelPosition === 'center'
                        ? 'insideLeft'
                        : 'outside',
                    offset: yAxisFormatting.labelOffset !== undefined
                      ? yAxisFormatting.labelOffset
                      : (yAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={yAxisFormatting.axisLine.visible ? yAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={yAxisFormatting.axisLine.width}
                  scale={yAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={staticDomain || ((domain: [number, number]) => getYAxisDomain(domain[0], domain[1]))}
                  ticks={yAxisTicks}
                  allowDecimals={true}
                />
                {tooltipFormatting.visible && (
                  <Tooltip
                    key="tooltip"
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any) => formatYAxisNumber(value)}
                  />
                )}
                {yAxisFields.map((field: string, idx: number) => {
                  const seriesColor = colors[idx % colors.length]
                  const fillOpacity = formatting.dataSeries?.fillOpacity || 1
                  const fillColor = hexToRgba(seriesColor, fillOpacity)

                  return (
                    <Bar
                      key={field}
                      dataKey={field}
                      fill={fillColor}
                      name={field}
                      radius={[4, 4, 0, 0]}
                      label={formatting.dataLabels?.visible ? {
                        position: (formatting.dataLabels.position === 'insideBase' || formatting.dataLabels.position === 'center')
                          ? 'inside'
                          : formatting.dataLabels.position === 'insideEnd'
                            ? 'inside'
                            : formatting.dataLabels.position === 'outsideEnd'
                              ? 'outside'
                              : formatting.dataLabels.position as any,
                        style: applyFontStyles(formatting.dataLabels.font),
                        formatter: (value: any) => {
                          if (formatting.dataLabels?.format === 'percentage') {
                            const total = data.reduce((sum, item) => sum + (item[field] || 0), 0)
                            return `${((value / total) * 100).toFixed(formatting.dataLabels.decimalPlaces)}%`
                          }
                          return formatNumber(value, {
                            type: 'number',
                            decimalPlaces: formatting.dataLabels?.decimalPlaces || 0,
                          })
                        }
                      } : false}
                    />
                  )
                })}
              </BarChart>
            ) : (
              <ResponsiveContainer width={chartWidth} height={chartHeight}>
                <BarChart {...commonProps} key={`bar-${JSON.stringify(config.sort || {})}`}>
                  {showGrid && <CartesianGrid key="grid" {...gridLineStyle} />}
                  <XAxis
                    key="xaxis"
                    dataKey={useIndexBasedOrdering ? '__index' : xAxisField}
                    type="category"
                    angle={xAxisFormatting.labelRotation}
                    textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                    height={xAxisFormatting.labelRotation !== 0 ? 60 : 40}
                    interval={0}
                    tick={{ style: xAxisLabelStyle }}
                    tickFormatter={(value: any, index: number) => {
                      if (useIndexBasedOrdering) {
                        const dataItem = safeData.find((d: any) => d.__index === value) || safeData[value]
                        return dataItem ? String(dataItem[xAxisField] || dataItem.__displayValue || value) : String(value)
                      }
                      return formatAxisNumber(value)
                    }}
                    scale="band"
                    padding={{ left: 0, right: 0 }}
                    label={{
                      value: xAxisLabel,
                      position: xAxisFormatting.labelPosition === 'inside'
                        ? 'insideBottom'
                        : xAxisFormatting.labelPosition === 'center'
                          ? 'insideBottom'
                          : 'outside',
                      offset: xAxisFormatting.labelOffset !== undefined
                        ? xAxisFormatting.labelOffset
                        : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                      style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                    }}
                    stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                    strokeWidth={xAxisFormatting.axisLine.width}
                  />
                  <YAxis
                    key="yaxis"
                    tick={{ style: yAxisLabelStyle }}
                    tickFormatter={formatYAxisNumber}
                    label={{
                      value: yAxisLabel,
                      angle: -90,
                      position: yAxisFormatting.labelPosition === 'inside'
                        ? 'insideLeft'
                        : yAxisFormatting.labelPosition === 'center'
                          ? 'insideLeft'
                          : 'outside',
                      offset: yAxisFormatting.labelOffset !== undefined
                        ? yAxisFormatting.labelOffset
                        : (yAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                      style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                    }}
                    stroke={yAxisFormatting.axisLine.visible ? yAxisFormatting.axisLine.color : 'none'}
                    strokeWidth={yAxisFormatting.axisLine.width}
                    scale={yAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                    domain={staticDomain || ((domain: [number, number]) => getYAxisDomain(domain[0], domain[1]))}
                    ticks={yAxisTicks}
                    allowDecimals={true}
                  />
                  {tooltipFormatting.visible && (
                    <Tooltip
                      key="tooltip"
                      contentStyle={tooltipContentStyle}
                      formatter={(value: any) => formatYAxisNumber(value)}
                    />
                  )}
                  {yAxisFields.map((field: string, idx: number) => {
                    const seriesColor = colors[idx % colors.length]
                    const fillOpacity = formatting.dataSeries?.fillOpacity || 1
                    const fillColor = hexToRgba(seriesColor, fillOpacity)

                    return (
                      <Bar
                        key={field}
                        dataKey={field}
                        fill={fillColor}
                        name={field}
                        radius={[4, 4, 0, 0]}
                        label={formatting.dataLabels?.visible ? {
                          position: (formatting.dataLabels.position === 'insideBase' || formatting.dataLabels.position === 'center')
                            ? 'inside'
                            : formatting.dataLabels.position === 'insideEnd'
                              ? 'inside'
                              : formatting.dataLabels.position === 'outsideEnd'
                                ? 'outside'
                                : formatting.dataLabels.position as any,
                          style: applyFontStyles(formatting.dataLabels.font),
                          formatter: (value: any) => {
                            if (formatting.dataLabels?.format === 'percentage') {
                              const total = data.reduce((sum, item) => sum + (item[field] || 0), 0)
                              return `${((value / total) * 100).toFixed(formatting.dataLabels.decimalPlaces)}%`
                            }
                            return formatNumber(value, {
                              type: 'number',
                              decimalPlaces: formatting.dataLabels?.decimalPlaces || 0,
                            })
                          }
                        } : false}
                      />
                    )
                  })}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )

      case 'dual-axis':
        // Dual-axis chart with left and right Y-axes
        const leftAxisConfig = dualAxisConfig?.leftAxis
        const rightAxisConfig = dualAxisConfig?.rightAxis

        if (!leftAxisConfig || !rightAxisConfig) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-destructive">Dual-axis configuration not found</p>
              </div>
            </div>
          )
        }

        // Get all fields for data transformation
        const allDualAxisFields = [...leftAxisFields, ...rightAxisFields]
        if (allDualAxisFields.length === 0) {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-destructive">No fields configured for dual-axis chart</p>
              </div>
            </div>
          )
        }

        // Data is already transformed by fetchVisualizationData, so we can use it directly
        // The transformDataForChart function already handles dual-axis charts correctly
        const dualAxisData = data

        // Calculate Y-axis domains and ticks for both axes
        const leftAxisValues = dualAxisData.flatMap(item =>
          leftAxisFields.map((field: string) => {
            const val = item[field]
            return typeof val === 'number' ? val : parseFloat(String(val)) || 0
          })
        ).filter(v => !isNaN(v) && isFinite(v))

        const rightAxisValues = dualAxisData.flatMap(item =>
          rightAxisFields.map((field: string) => {
            const val = item[field]
            return typeof val === 'number' ? val : parseFloat(String(val)) || 0
          })
        ).filter(v => !isNaN(v) && isFinite(v))

        const leftMin = leftAxisValues.length > 0 ? Math.min(...leftAxisValues) : 0
        const leftMax = leftAxisValues.length > 0 ? Math.max(...leftAxisValues) : 100
        const rightMin = rightAxisValues.length > 0 ? Math.min(...rightAxisValues) : 0
        const rightMax = rightAxisValues.length > 0 ? Math.max(...rightAxisValues) : 100

        // Calculate ticks for left axis
        const leftAxisFormatting = formatting.yAxis || DEFAULT_FORMATTING.yAxis!
        const leftMinVal = leftAxisFormatting.min === 'auto' || leftAxisFormatting.min === undefined
          ? leftMin
          : (typeof leftAxisFormatting.min === 'number' ? leftAxisFormatting.min : leftMin)
        const leftMaxVal = leftAxisFormatting.max === 'auto' || leftAxisFormatting.max === undefined
          ? leftMax
          : (typeof leftAxisFormatting.max === 'number' ? leftAxisFormatting.max : leftMax)

        // Ensure min < max
        const leftMinFinal = Math.min(leftMinVal, leftMaxVal)
        const leftMaxFinal = Math.max(leftMinVal, leftMaxVal)

        const leftInterval = leftAxisFormatting.interval === 'auto' || leftAxisFormatting.interval === undefined
          ? (leftMaxFinal - leftMinFinal) / 5
          : (typeof leftAxisFormatting.interval === 'number' ? leftAxisFormatting.interval : (leftMaxFinal - leftMinFinal) / 5)

        // Safety check: ensure interval is positive and reasonable
        const leftIntervalSafe = Math.max(0.01, Math.abs(leftInterval))
        const leftMaxTicks = 1000 // Prevent creating too many ticks

        const leftTicks: number[] = []
        if (leftMaxFinal > leftMinFinal && leftIntervalSafe > 0) {
          const estimatedTicks = Math.ceil((leftMaxFinal - leftMinFinal) / leftIntervalSafe)
          if (estimatedTicks <= leftMaxTicks) {
            for (let val = leftMinFinal; val <= leftMaxFinal; val += leftIntervalSafe) {
              leftTicks.push(Number(val.toFixed(2)))
            }
            if (leftTicks.length > 0 && leftTicks[leftTicks.length - 1] !== leftMaxFinal) {
              leftTicks.push(leftMaxFinal)
            }
          } else {
            // Too many ticks, use auto calculation
            leftTicks.push(leftMinFinal, leftMaxFinal)
          }
        } else {
          leftTicks.push(leftMinFinal, leftMaxFinal)
        }

        // Calculate ticks for right axis (use same formatting for now, could be separate in future)
        const rightAxisFormatting = formatting.yAxis || DEFAULT_FORMATTING.yAxis!
        const rightMinVal = rightAxisFormatting.min === 'auto' || rightAxisFormatting.min === undefined
          ? rightMin
          : (typeof rightAxisFormatting.min === 'number' ? rightAxisFormatting.min : rightMin)
        const rightMaxVal = rightAxisFormatting.max === 'auto' || rightAxisFormatting.max === undefined
          ? rightMax
          : (typeof rightAxisFormatting.max === 'number' ? rightAxisFormatting.max : rightMax)

        // Ensure min < max
        const rightMinFinal = Math.min(rightMinVal, rightMaxVal)
        const rightMaxFinal = Math.max(rightMinVal, rightMaxVal)

        const rightInterval = rightAxisFormatting.interval === 'auto' || rightAxisFormatting.interval === undefined
          ? (rightMaxFinal - rightMinFinal) / 5
          : (typeof rightAxisFormatting.interval === 'number' ? rightAxisFormatting.interval : (rightMaxFinal - rightMinFinal) / 5)

        // Safety check: ensure interval is positive and reasonable
        const rightIntervalSafe = Math.max(0.01, Math.abs(rightInterval))
        const rightMaxTicks = 1000 // Prevent creating too many ticks

        const rightTicks: number[] = []
        if (rightMaxFinal > rightMinFinal && rightIntervalSafe > 0) {
          const estimatedTicks = Math.ceil((rightMaxFinal - rightMinFinal) / rightIntervalSafe)
          if (estimatedTicks <= rightMaxTicks) {
            for (let val = rightMinFinal; val <= rightMaxFinal; val += rightIntervalSafe) {
              rightTicks.push(Number(val.toFixed(2)))
            }
            if (rightTicks.length > 0 && rightTicks[rightTicks.length - 1] !== rightMaxFinal) {
              rightTicks.push(rightMaxFinal)
            }
          } else {
            // Too many ticks, use auto calculation
            rightTicks.push(rightMinFinal, rightMaxFinal)
          }
        } else {
          rightTicks.push(rightMinFinal, rightMaxFinal)
        }

        const leftAxisLabel = leftAxisConfig.label || formatAxisLabel(leftAxisFields[0] || 'Left Axis')
        const rightAxisLabel = rightAxisConfig.label || formatAxisLabel(rightAxisFields[0] || 'Right Axis')

        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            <DateHierarchyControls />
            <ResponsiveContainer width={chartWidth} height={chartHeight}>
              <ComposedChart {...commonProps} data={dualAxisData}>
                {showGrid && <CartesianGrid {...gridLineStyle} />}
                <XAxis
                  dataKey={xAxisField}
                  angle={xAxisFormatting.labelRotation}
                  textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                  height={xAxisFormatting.labelRotation !== 0 ? 60 : 40}
                  interval={0}
                  tick={{ style: xAxisLabelStyle }}
                  tickFormatter={formatAxisNumber}
                  label={{
                    value: xAxisLabel,
                    position: xAxisFormatting.labelPosition === 'inside'
                      ? 'insideBottom'
                      : xAxisFormatting.labelPosition === 'center'
                        ? 'insideBottom'
                        : 'outside',
                    offset: xAxisFormatting.labelOffset !== undefined
                      ? xAxisFormatting.labelOffset
                      : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                    style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={xAxisFormatting.axisLine.width}
                />
                {/* Left Y-Axis */}
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: leftAxisLabel,
                    angle: -90,
                    position: leftAxisFormatting.labelPosition === 'inside'
                      ? 'insideLeft'
                      : leftAxisFormatting.labelPosition === 'center'
                        ? 'insideLeft'
                        : 'outside',
                    offset: leftAxisFormatting.labelOffset !== undefined
                      ? leftAxisFormatting.labelOffset
                      : (leftAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={leftAxisFormatting.axisLine.visible ? leftAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={leftAxisFormatting.axisLine.width}
                  scale={leftAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={[leftMinVal, leftMaxVal]}
                  ticks={leftTicks}
                  allowDecimals={true}
                />
                {/* Right Y-Axis */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: rightAxisLabel,
                    angle: 90,
                    position: rightAxisFormatting.labelPosition === 'inside'
                      ? 'insideRight'
                      : rightAxisFormatting.labelPosition === 'center'
                        ? 'insideRight'
                        : 'outside',
                    offset: rightAxisFormatting.labelOffset !== undefined
                      ? -rightAxisFormatting.labelOffset
                      : (rightAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={rightAxisFormatting.axisLine.visible ? rightAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={rightAxisFormatting.axisLine.width}
                  scale={rightAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={[rightMinVal, rightMaxVal]}
                  ticks={rightTicks}
                  allowDecimals={true}
                />
                {tooltipFormatting.visible && (
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any, name: string) => {
                      const formattedValue = formatNumber(value, formatting.yAxis?.numberFormat || { type: 'auto' })
                      return [formattedValue, name]
                    }}
                  />
                )}
                {formatting.legend && formatting.legend.position !== 'none' && (
                  <Legend
                    wrapperStyle={{
                      paddingTop: '16px',
                      ...applyFontStyles(formatting.legend.font),
                    }}
                  />
                )}
                {/* Render left axis series */}
                {leftAxisFields.map((field: string, index: number) => {
                  const color = colors[index % colors.length]
                  if (leftAxisConfig.chartType === 'bar') {
                    return (
                      <Bar
                        key={`left-${field}`}
                        yAxisId="left"
                        dataKey={field}
                        fill={color}
                        name={field}
                      />
                    )
                  } else {
                    return (
                      <Line
                        key={`left-${field}`}
                        yAxisId="left"
                        type="monotone"
                        dataKey={field}
                        stroke={color}
                        strokeWidth={formatting.dataSeries?.lineStyle?.width || 2}
                        strokeDasharray={getStrokeDashArray(formatting.dataSeries?.lineStyle?.style || 'solid')}
                        dot={formatting.dataSeries?.markerStyle?.type !== 'none' ? {
                          fill: color,
                          r: formatting.dataSeries?.markerStyle?.size || 4,
                        } : false}
                        name={field}
                      />
                    )
                  }
                })}
                {/* Render right axis series */}
                {rightAxisFields.map((field: string, index: number) => {
                  const color = colors[(leftAxisFields.length + index) % colors.length]
                  if (rightAxisConfig.chartType === 'bar') {
                    return (
                      <Bar
                        key={`right-${field}`}
                        yAxisId="right"
                        dataKey={field}
                        fill={color}
                        name={field}
                      />
                    )
                  } else {
                    return (
                      <Line
                        key={`right-${field}`}
                        yAxisId="right"
                        type="monotone"
                        dataKey={field}
                        stroke={color}
                        strokeWidth={formatting.dataSeries?.lineStyle?.width || 2}
                        strokeDasharray={getStrokeDashArray(formatting.dataSeries?.lineStyle?.style || 'solid')}
                        dot={formatting.dataSeries?.markerStyle?.type !== 'none' ? {
                          fill: color,
                          r: formatting.dataSeries?.markerStyle?.size || 4,
                        } : false}
                        name={field}
                      />
                    )
                  }
                })}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )

      case 'line':
        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            <DateHierarchyControls />
            <ResponsiveContainer width={chartWidth} height={chartHeight}>
              <LineChart {...commonProps}>
                {showGrid && <CartesianGrid {...gridLineStyle} />}
                <XAxis
                  dataKey={xAxisField}
                  angle={xAxisFormatting.labelRotation}
                  textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                  tick={{ style: xAxisLabelStyle }}
                  tickFormatter={formatAxisNumber}
                  label={{
                    value: xAxisLabel,
                    position: xAxisFormatting.labelPosition === 'inside'
                      ? 'insideBottom'
                      : xAxisFormatting.labelPosition === 'center'
                        ? 'insideBottom'
                        : 'outside',
                    offset: xAxisFormatting.labelOffset !== undefined
                      ? xAxisFormatting.labelOffset
                      : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                    style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={xAxisFormatting.axisLine.width}
                />
                <YAxis
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: yAxisFormatting.labelPosition === 'inside'
                      ? 'insideLeft'
                      : yAxisFormatting.labelPosition === 'center'
                        ? 'insideLeft'
                        : 'outside',
                    offset: yAxisFormatting.labelOffset !== undefined
                      ? yAxisFormatting.labelOffset
                      : (yAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={yAxisFormatting.axisLine.visible ? yAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={yAxisFormatting.axisLine.width}
                  scale={yAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={staticDomain || ((domain: [number, number]) => getYAxisDomain(domain[0], domain[1]))}
                  ticks={yAxisTicks}
                  allowDecimals={true}
                />
                {tooltipFormatting.visible && (
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any) => formatYAxisNumber(value)}
                  />
                )}
                {yAxisFields.map((field: string, idx: number) => {
                  const seriesColor = colors[idx % colors.length]
                  const lineStyle = formatting.dataSeries?.lineStyle || DEFAULT_FORMATTING.dataSeries!.lineStyle
                  const markerStyle = formatting.dataSeries?.markerStyle || DEFAULT_FORMATTING.dataSeries!.markerStyle

                  return (
                    <Line
                      key={field}
                      type="monotone"
                      dataKey={field}
                      stroke={seriesColor}
                      strokeWidth={lineStyle.width}
                      strokeDasharray={getStrokeDashArray(lineStyle.style)}
                      name={field}
                      dot={markerStyle.type !== 'none' ? {
                        fill: seriesColor,
                        r: markerStyle.size / 2,
                        stroke: seriesColor,
                        strokeWidth: 2,
                      } : false}
                      label={formatting.dataLabels?.visible ? {
                        position: (formatting.dataLabels.position === 'insideBase' || formatting.dataLabels.position === 'center')
                          ? 'inside'
                          : formatting.dataLabels.position === 'insideEnd'
                            ? 'inside'
                            : formatting.dataLabels.position === 'outsideEnd'
                              ? 'outside'
                              : formatting.dataLabels.position as any,
                        style: applyFontStyles(formatting.dataLabels.font),
                        formatter: (value: any) => formatNumber(value, {
                          type: 'number',
                          decimalPlaces: formatting.dataLabels?.decimalPlaces || 0,
                        })
                      } : false}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )

      case 'area':
        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            <DateHierarchyControls />
            <ResponsiveContainer width={chartWidth} height={chartHeight}>
              <AreaChart {...commonProps}>
                {showGrid && <CartesianGrid {...gridLineStyle} />}
                <XAxis
                  dataKey={xAxisField}
                  angle={xAxisFormatting.labelRotation}
                  textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                  tick={{ style: xAxisLabelStyle }}
                  tickFormatter={formatAxisNumber}
                  label={{
                    value: xAxisLabel,
                    position: xAxisFormatting.labelPosition === 'inside'
                      ? 'insideBottom'
                      : xAxisFormatting.labelPosition === 'center'
                        ? 'insideBottom'
                        : 'outside',
                    offset: xAxisFormatting.labelOffset !== undefined
                      ? xAxisFormatting.labelOffset
                      : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                    style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={xAxisFormatting.axisLine.width}
                />
                <YAxis
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: yAxisFormatting.labelPosition === 'inside'
                      ? 'insideLeft'
                      : yAxisFormatting.labelPosition === 'center'
                        ? 'insideLeft'
                        : 'outside',
                    offset: yAxisFormatting.labelOffset !== undefined
                      ? yAxisFormatting.labelOffset
                      : (yAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={yAxisFormatting.axisLine.visible ? yAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={yAxisFormatting.axisLine.width}
                  scale={yAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={staticDomain || ((domain: [number, number]) => getYAxisDomain(domain[0], domain[1]))}
                  ticks={yAxisTicks}
                  allowDecimals={true}
                />
                {tooltipFormatting.visible && (
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any) => formatYAxisNumber(value)}
                  />
                )}
                {formatting.legend && formatting.legend.position !== 'none' && (
                  <Legend
                    verticalAlign={formatting.legend.position === 'top' || formatting.legend.position === 'bottom' ? formatting.legend.position : undefined}
                    align={formatting.legend.position === 'left' || formatting.legend.position === 'right' ? formatting.legend.position : undefined}
                    wrapperStyle={applyFontStyles(formatting.legend.font)}
                    iconType="circle"
                  />
                )}
                {yAxisFields.map((field: string, idx: number) => {
                  const seriesColor = colors[idx % colors.length]
                  const fillOpacity = formatting.dataSeries?.fillOpacity || 0.8
                  const fillColor = hexToRgba(seriesColor, fillOpacity)
                  const lineStyle = formatting.dataSeries?.lineStyle || DEFAULT_FORMATTING.dataSeries!.lineStyle

                  return (
                    <Area
                      key={field}
                      type="monotone"
                      dataKey={field}
                      stroke={seriesColor}
                      strokeWidth={lineStyle.width}
                      strokeDasharray={getStrokeDashArray(lineStyle.style)}
                      fill={fillColor}
                      name={field}
                      label={formatting.dataLabels?.visible ? {
                        position: formatting.dataLabels.position,
                        style: applyFontStyles(formatting.dataLabels.font),
                        formatter: (value: any) => formatNumber(value, {
                          type: 'number',
                          decimalPlaces: formatting.dataLabels?.decimalPlaces || 0,
                        })
                      } : false}
                    />
                  )
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )

      case 'pie':
        // Pie chart uses first Y-axis field
        const pieData = data.map(item => ({
          name: String(item[xAxisField] || ''),
          value: parseFloat(item[yAxisFields[0]] || 0) || 0,
        }))
        const legendFormatting = formatting.legend || DEFAULT_FORMATTING.legend!

        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            <ResponsiveContainer width={chartWidth} height={chartHeight}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={formatting.dataLabels?.visible ? (entry: any) => {
                    if (!formatting.dataLabels) return ''
                    const labelStyle = applyFontStyles(formatting.dataLabels.font)
                    let labelText: string
                    if (formatting.dataLabels.format === 'percentage') {
                      labelText = `${(entry.percent * 100).toFixed(formatting.dataLabels.decimalPlaces)}%`
                    } else {
                      labelText = formatNumber(entry.value, {
                        type: 'number',
                        decimalPlaces: formatting.dataLabels.decimalPlaces || 0,
                      })
                    }
                    // Return a styled text element
                    return (
                      <text
                        x={entry.x}
                        y={entry.y}
                        fill={labelStyle.color}
                        textAnchor={entry.textAnchor || 'middle'}
                        fontSize={labelStyle.fontSize}
                        fontFamily={labelStyle.fontFamily}
                        fontWeight={labelStyle.fontWeight}
                        fontStyle={labelStyle.fontStyle}
                      >
                        {labelText}
                      </text>
                    )
                  } : false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                {tooltipFormatting.visible && (
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any) => formatNumber(value, {
                      type: 'number',
                      decimalPlaces: formatting.dataLabels?.decimalPlaces || 0,
                    })}
                  />
                )}
                {legendFormatting.position !== 'none' && (
                  <Legend
                    verticalAlign={legendFormatting.position === 'top' || legendFormatting.position === 'bottom' ? legendFormatting.position : undefined}
                    align={legendFormatting.position === 'left' || legendFormatting.position === 'right' ? legendFormatting.position : undefined}
                    wrapperStyle={applyFontStyles(legendFormatting.font)}
                    iconType="circle"
                  />
                )}
              </PieChart>
            </ResponsiveContainer>
          </div>
        )

      case 'scatter':
        return (
          <div style={chartContainerStyle}>
            {formatting.title?.visible && formatting.title?.text && (
              <div style={{
                ...applyFontStyles(formatting.title.font),
                color: formatting.title.color,
                textAlign: formatting.title.position === 'center' ? 'center' :
                  formatting.title.position === 'left' ? 'left' :
                    formatting.title.position === 'right' ? 'right' : 'center',
                marginBottom: formatting.title.position === 'top' ? '8px' : '0',
                marginTop: formatting.title.position === 'bottom' ? '8px' : '0',
              }}>
                {formatting.title.text}
              </div>
            )}
            <ResponsiveContainer width={chartWidth} height={chartHeight}>
              <ScatterChart {...commonProps}>
                {showGrid && <CartesianGrid {...gridLineStyle} />}
                <XAxis
                  dataKey={xAxisField}
                  angle={xAxisFormatting.labelRotation}
                  textAnchor={xAxisFormatting.labelRotation < 0 ? 'end' : xAxisFormatting.labelRotation > 0 ? 'start' : 'middle'}
                  tick={{ style: xAxisLabelStyle }}
                  tickFormatter={formatAxisNumber}
                  label={{
                    value: xAxisLabel,
                    position: xAxisFormatting.labelPosition === 'inside'
                      ? 'insideBottom'
                      : xAxisFormatting.labelPosition === 'center'
                        ? 'insideBottom'
                        : 'outside',
                    offset: xAxisFormatting.labelOffset !== undefined
                      ? xAxisFormatting.labelOffset
                      : (xAxisFormatting.labelPosition === 'inside' ? -5 : -5),
                    style: { ...xAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={xAxisFormatting.axisLine.visible ? xAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={xAxisFormatting.axisLine.width}
                />
                <YAxis
                  dataKey={yAxisFields[0]}
                  tick={{ style: yAxisLabelStyle }}
                  tickFormatter={formatYAxisNumber}
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: yAxisFormatting.labelPosition === 'inside'
                      ? 'insideLeft'
                      : yAxisFormatting.labelPosition === 'center'
                        ? 'insideLeft'
                        : 'outside',
                    offset: yAxisFormatting.labelOffset !== undefined
                      ? yAxisFormatting.labelOffset
                      : (yAxisFormatting.labelPosition === 'inside' ? 0 : 0),
                    style: { ...yAxisLabelStyle, textAnchor: 'middle' }
                  }}
                  stroke={yAxisFormatting.axisLine.visible ? yAxisFormatting.axisLine.color : 'none'}
                  strokeWidth={yAxisFormatting.axisLine.width}
                  scale={yAxisFormatting.scaleType === 'logarithmic' ? 'log' : 'linear'}
                  domain={staticDomain || ((domain: [number, number]) => getYAxisDomain(domain[0], domain[1]))}
                  ticks={yAxisTicks}
                  allowDecimals={true}
                />
                {tooltipFormatting.visible && (
                  <Tooltip
                    contentStyle={tooltipContentStyle}
                    formatter={(value: any) => formatYAxisNumber(value)}
                  />
                )}
                <Scatter
                  dataKey={yAxisFields[0]}
                  fill={colors[0]}
                  name={yAxisFields[0]}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        )

      case 'table':
        return (
          <div className="overflow-auto max-h-full w-full" style={{ pointerEvents: 'auto', position: 'relative', zIndex: 1 }}>
            <table className="w-full text-sm" style={{ pointerEvents: 'auto' }}>
              <thead className="bg-muted sticky top-0" style={{ zIndex: 1 }}>
                <tr>
                  <th className="px-3 py-2 text-left font-semibold border-b">{xAxisField}</th>
                  {yAxisFields.map((field: string) => (
                    <th key={field} className="px-3 py-2 text-left font-semibold border-b">
                      {field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-3 py-2">{row[xAxisField]}</td>
                    {yAxisFields.map((field: string) => (
                      <td key={field} className="px-3 py-2">
                        {row[field]?.toLocaleString() || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )

      case 'kpi':
        // Data is already aggregated by transformDataForChart, so just get the value from the first item
        const kpiAggregation = yAxisConfig?.aggregation || 'sum'
        const kpiField = yAxisFields[0]

        // The data array should contain a single object with the aggregated value
        const kpiDataItem = data[0] || {}
        const kpiValue = kpiDataItem[kpiField] !== undefined
          ? parseFloat(kpiDataItem[kpiField]) || 0
          : 0

        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              boxSizing: 'border-box',
            }}
          >
            <div
              className="font-bold text-purple-600"
              style={{
                fontSize: '48px',
                fontWeight: 700,
                lineHeight: 1.2,
                textAlign: 'center',
              }}
            >
              {kpiAggregation === 'avg'
                ? kpiValue.toFixed(2)
                : kpiValue.toLocaleString()}
            </div>
            <div
              className="text-muted-foreground"
              style={{
                fontSize: '14px',
                marginTop: '8px',
                textAlign: 'center',
                opacity: 0.7,
              }}
            >
              {kpiAggregation === 'count' && !kpiField
                ? 'Count'
                : `${kpiAggregation.toUpperCase()}(${kpiField || 'Value'})`}
            </div>
          </div>
        )

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Chart type "{chartType}" not supported yet</p>
          </div>
        )
    }
  }

  // For KPI cards, ensure the wrapper allows proper resizing
  const isKPI = visualization?.type === 'kpi'

  return (
    <div
      className="w-full h-full"
      style={{
        minHeight: 0,
        minWidth: 0,
        overflow: isKPI ? 'hidden' : 'visible',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {renderChart()}
    </div>
  )
}

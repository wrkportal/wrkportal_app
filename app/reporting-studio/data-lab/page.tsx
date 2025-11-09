'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Beaker,
    BarChart3,
    LineChart,
    PieChart,
    TrendingUp,
    Activity,
    Table2,
    Plus,
    X,
    Download,
    Maximize2,
    ChevronDown,
    ChevronRight,
    ChevronLeft,
    Settings2,
    Minimize2,
    Loader2,
    Filter,
    Search,
    Save,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import {
    BarChart as RechartsBar,
    LineChart as RechartsLine,
    PieChart as RechartsPie,
    AreaChart as RechartsArea,
    ScatterChart as RechartsScatter,
    ComposedChart,
    Bar,
    Line,
    Pie,
    Area,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell,
} from 'recharts'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface ChartData {
    dataSourceId?: string
    dataSourceName?: string
    xAxis?: string
    yAxis?: string
    aggregation?: string
    chartData?: any[] // Processed data for the chart
    rawData?: any[] // Raw data for pie chart drill-down
    yAxisFields?: Array<{ id: string; field: string; label: string; aggregation: string; chartType?: 'bar' | 'line'; axis?: 'left' | 'right' }> // For multi-series charts
    secondaryYAxis?: string // For dual-axis charts (legacy, kept for backward compatibility)
    secondaryAggregation?: string // For dual-axis charts (legacy)
    primaryChartType?: 'bar' | 'line' // For dual-axis charts (legacy)
    secondaryChartType?: 'bar' | 'line' // For dual-axis charts (legacy)
    decompositionFields?: string[] // For pie chart drill-down
    drillDownSegment?: string // The segment name this drill-down represents
}

interface ChartProperties {
    showLegend: boolean
    showGrid: boolean
    color: string // This is for data bars/lines/areas
    chartBackgroundColor: string // This is for the chart card background
    legendPosition: 'top' | 'bottom' | 'left' | 'right'
    showAxisLabels: boolean
    showDataLabels: boolean
    dataLabelPosition: 'top' | 'center' | 'bottom' | 'inside' | 'outside'
    titleFontSize: number
    titleFontFamily: string
    titleColor: string
    titleAlign: 'left' | 'center' | 'right'
    titleBold: boolean
    titleItalic: boolean
    titleUnderline: boolean
    axisFontSize: number
    axisFontFamily: string
    axisColor: string
    axisBold: boolean
    axisItalic: boolean
    labelFontSize: number
    labelFontFamily: string
    labelColor: string
    labelBold: boolean
    labelItalic: boolean
    chartPaddingLeft: number
    chartPaddingRight: number
    chartPaddingTop: number
    chartPaddingBottom: number
    backgroundOpacity: number
}

interface Chart {
    id: string
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter' | 'table' | 'filter' | 'multibar' | 'multiline' | 'dualaxis'
    title: string
    data?: ChartData
    isLoading?: boolean
    properties: ChartProperties
    filterField?: string // For filter type
    filterValues?: string[] // Selected filter values
    leftAxisLabel?: string // For dual-axis charts
    rightAxisLabel?: string // For dual-axis charts
    drillDownParent?: string // ID of parent chart for drill-down charts
    drillDownLevel?: number // Level of drill-down
    drillDownPath?: string[] // Path of clicked values
}

interface DataSource {
    id: string
    name: string
}

const CHART_TYPES = [
    { id: 'filter', name: 'Filter', icon: Filter, color: 'text-slate-500' },
    { id: 'bar', name: 'Bar Chart', icon: BarChart3, color: 'text-blue-500' },
    { id: 'line', name: 'Line Chart', icon: LineChart, color: 'text-green-500' },
    { id: 'pie', name: 'Pie Chart', icon: PieChart, color: 'text-purple-500' },
    { id: 'area', name: 'Area Chart', icon: TrendingUp, color: 'text-orange-500' },
    { id: 'scatter', name: 'Scatter Plot', icon: Activity, color: 'text-pink-500' },
    { id: 'multibar', name: 'Multi Bar', icon: BarChart3, color: 'text-cyan-500' },
    { id: 'multiline', name: 'Multi Line', icon: LineChart, color: 'text-emerald-500' },
    { id: 'dualaxis', name: 'Dual Axis', icon: TrendingUp, color: 'text-violet-500' },
]

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#14b8a6']

// Helper to get consistent color for a segment name
const getSegmentColor = (segmentName: string, allSegments: string[]) => {
    const index = allSegments.indexOf(segmentName)
    return index >= 0 ? COLORS[index % COLORS.length] : COLORS[0]
}

const aggregateData = (rows: any[], xAxis: string, yAxis: string, aggregation: string, activeFilters?: Record<string, string[]>) => {
    // Apply filters first if provided
    let filteredRows = rows
    if (activeFilters && Object.keys(activeFilters).length > 0) {
        filteredRows = rows.filter(row => {
            // Check if row passes all active filters
            return Object.entries(activeFilters).every(([field, values]) => {
                // If no values selected for this filter, don't filter
                if (values.length === 0) return true
                // Check if row's value is in the selected values
                return values.includes(String(row[field] || 'N/A'))
            })
        })
    }

    const grouped: Record<string, number[]> = {}

    filteredRows.forEach(row => {
        const xValue = String(row[xAxis] || 'Unknown')
        const yValue = parseFloat(row[yAxis])

        if (!isNaN(yValue)) {
            if (!grouped[xValue]) {
                grouped[xValue] = []
            }
            grouped[xValue].push(yValue)
        }
    })

    return Object.entries(grouped).map(([key, values]) => {
        let aggregatedValue: number

        switch (aggregation) {
            case 'sum':
                aggregatedValue = values.reduce((a, b) => a + b, 0)
                break
            case 'average':
                aggregatedValue = values.reduce((a, b) => a + b, 0) / values.length
                break
            case 'count':
                aggregatedValue = values.length
                break
            case 'min':
                aggregatedValue = Math.min(...values)
                break
            case 'max':
                aggregatedValue = Math.max(...values)
                break
            default:
                aggregatedValue = values.reduce((a, b) => a + b, 0)
        }

        return {
            name: key,
            value: Math.round(aggregatedValue * 100) / 100,
        }
    })
}

export default function DataLabPage() {
    const [charts, setCharts] = useState<Chart[]>([])
    const [layout, setLayout] = useState<Layout[]>([])
    const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({}) // Global filters: {fieldName: [values]}
    const [filterSearchTerms, setFilterSearchTerms] = useState<Record<string, string>>({}) // Search terms for each filter: {chartId: searchTerm}
    const [filterDropdownOpen, setFilterDropdownOpen] = useState<Record<string, boolean>>({}) // Dropdown state for each filter: {chartId: isOpen}
    const [expandedPageSettings, setExpandedPageSettings] = useState(true)
    const [expandedFilters, setExpandedFilters] = useState(true)
    const [expandedVisualizations, setExpandedVisualizations] = useState(true)
    const [expandedProperties, setExpandedProperties] = useState(true)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [configDialogOpen, setConfigDialogOpen] = useState(false)
    const [saveViewDialogOpen, setSaveViewDialogOpen] = useState(false)
    const [viewName, setViewName] = useState('')
    const [selectedChartForProperties, setSelectedChartForProperties] = useState<string | null>(null)
    const [selectedChartId, setSelectedChartId] = useState<string | null>(null)
    const [dataSources, setDataSources] = useState<DataSource[]>([])
    const [availableColumns, setAvailableColumns] = useState<string[]>([])

    // Chart configuration state
    const [selectedDataSource, setSelectedDataSource] = useState<string>('')
    const [selectedXAxis, setSelectedXAxis] = useState<string>('')
    const [selectedYAxis, setSelectedYAxis] = useState<string>('')
    const [selectedAggregation, setSelectedAggregation] = useState<string>('sum')

    // Multi-series chart state
    const [yAxisFields, setYAxisFields] = useState<Array<{ id: string; field: string; label: string; aggregation: string; chartType?: 'bar' | 'line'; axis?: 'left' | 'right' }>>([])
    const [secondaryYAxis, setSecondaryYAxis] = useState<string>('')
    const [secondaryAggregation, setSecondaryAggregation] = useState<string>('sum')

    // Dual-axis chart type state
    const [primaryChartType, setPrimaryChartType] = useState<'bar' | 'line'>('bar')
    const [secondaryChartType, setSecondaryChartType] = useState<'bar' | 'line'>('line')

    // Pie chart drill-down state
    const [decompositionFields, setDecompositionFields] = useState<string[]>([])
    const [pieChartLevel, setPieChartLevel] = useState<{ [chartId: string]: number }>({}) // Track current drill level per chart
    const [pieChartFilters, setPieChartFilters] = useState<{ [chartId: string]: { [level: number]: string } }>({}) // Track selected values per level
    const [pieDrillDownLevel, setPieDrillDownLevel] = useState<Record<string, number>>({}) // chartId -> level
    const [pieDrillDownPath, setPieDrillDownPath] = useState<Record<string, string[]>>({}) // chartId -> path
    // Track selected segments for multi-drill-down
    const [selectedPieSegments, setSelectedPieSegments] = useState<Record<string, string[]>>({}) // chartId -> selected segments

    // Chart properties state
    const [chartTitle, setChartTitle] = useState<string>('')
    const [showLegend, setShowLegend] = useState<boolean>(true)
    const [showGrid, setShowGrid] = useState<boolean>(true)
    const [chartColor, setChartColor] = useState<string>('#3b82f6') // Data color
    const [chartBackgroundColor, setChartBackgroundColor] = useState<string>('#ffffff') // Chart background
    const [legendPosition, setLegendPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
    const [showAxisLabels, setShowAxisLabels] = useState<boolean>(true)
    const [showDataLabels, setShowDataLabels] = useState<boolean>(false)
    const [dataLabelPosition, setDataLabelPosition] = useState<'top' | 'center' | 'bottom' | 'inside' | 'outside'>('top')
    const [titleFontSize, setTitleFontSize] = useState<number>(16)
    const [titleFontFamily, setTitleFontFamily] = useState<string>('Arial')
    const [titleColor, setTitleColor] = useState<string>('#000000')
    const [titleAlign, setTitleAlign] = useState<'left' | 'center' | 'right'>('left')
    const [titleBold, setTitleBold] = useState<boolean>(false)
    const [titleItalic, setTitleItalic] = useState<boolean>(false)
    const [titleUnderline, setTitleUnderline] = useState<boolean>(false)
    const [axisFontSize, setAxisFontSize] = useState<number>(11)
    const [axisFontFamily, setAxisFontFamily] = useState<string>('Arial')
    const [axisColor, setAxisColor] = useState<string>('#666666')
    const [axisBold, setAxisBold] = useState<boolean>(false)
    const [axisItalic, setAxisItalic] = useState<boolean>(false)
    const [labelFontSize, setLabelFontSize] = useState<number>(11)
    const [labelFontFamily, setLabelFontFamily] = useState<string>('Arial')
    const [labelColor, setLabelColor] = useState<string>('#000000')
    const [labelBold, setLabelBold] = useState<boolean>(false)
    const [labelItalic, setLabelItalic] = useState<boolean>(false)
    const [chartPaddingLeft, setChartPaddingLeft] = useState<number>(16)
    const [chartPaddingRight, setChartPaddingRight] = useState<number>(16)
    const [chartPaddingTop, setChartPaddingTop] = useState<number>(8)
    const [chartPaddingBottom, setChartPaddingBottom] = useState<number>(8)
    const [backgroundOpacity, setBackgroundOpacity] = useState<number>(100)
    const [leftAxisLabel, setLeftAxisLabel] = useState<string>('')
    const [rightAxisLabel, setRightAxisLabel] = useState<string>('')

    // Page background color
    const [pageBackgroundColor, setPageBackgroundColor] = useState<string>('#f8fafc')

    // Property section expansion states
    const [expandedTitle, setExpandedTitle] = useState<boolean>(false)
    const [expandedLegend, setExpandedLegend] = useState<boolean>(false)
    const [expandedAxis, setExpandedAxis] = useState<boolean>(false)
    const [expandedDataLabels, setExpandedDataLabels] = useState<boolean>(false)
    const [expandedStyling, setExpandedStyling] = useState<boolean>(false)

    // Load data from localStorage on mount
    useEffect(() => {
        const savedCharts = localStorage.getItem('datalab-charts')
        const savedLayout = localStorage.getItem('datalab-layout')

        if (savedCharts && savedLayout) {
            const loadedCharts = JSON.parse(savedCharts)
            // Migrate old charts to include properties if missing
            const migratedCharts = loadedCharts.map((chart: Chart) => ({
                ...chart,
                properties: {
                    showLegend: chart.properties?.showLegend ?? true,
                    showGrid: chart.properties?.showGrid ?? true,
                    color: chart.properties?.color ?? '#3b82f6',
                    chartBackgroundColor: chart.properties?.chartBackgroundColor ?? '#ffffff',
                    legendPosition: chart.properties?.legendPosition ?? 'top',
                    showAxisLabels: chart.properties?.showAxisLabels ?? true,
                    showDataLabels: chart.properties?.showDataLabels ?? false,
                    dataLabelPosition: chart.properties?.dataLabelPosition ?? 'top',
                    titleFontSize: chart.properties?.titleFontSize ?? 16,
                    titleFontFamily: chart.properties?.titleFontFamily ?? 'Arial',
                    titleColor: chart.properties?.titleColor ?? '#000000',
                    titleAlign: chart.properties?.titleAlign ?? 'left',
                    titleBold: chart.properties?.titleBold ?? false,
                    titleItalic: chart.properties?.titleItalic ?? false,
                    titleUnderline: chart.properties?.titleUnderline ?? false,
                    axisFontSize: chart.properties?.axisFontSize ?? 11,
                    axisFontFamily: chart.properties?.axisFontFamily ?? 'Arial',
                    axisColor: chart.properties?.axisColor ?? '#666666',
                    axisBold: chart.properties?.axisBold ?? false,
                    axisItalic: chart.properties?.axisItalic ?? false,
                    labelFontSize: chart.properties?.labelFontSize ?? 11,
                    labelFontFamily: chart.properties?.labelFontFamily ?? 'Arial',
                    labelColor: chart.properties?.labelColor ?? '#000000',
                    labelBold: chart.properties?.labelBold ?? false,
                    labelItalic: chart.properties?.labelItalic ?? false,
                    chartPaddingLeft: chart.properties?.chartPaddingLeft ?? 16,
                    chartPaddingRight: chart.properties?.chartPaddingRight ?? 16,
                    chartPaddingTop: chart.properties?.chartPaddingTop ?? 8,
                    chartPaddingBottom: chart.properties?.chartPaddingBottom ?? 8,
                    backgroundOpacity: chart.properties?.backgroundOpacity ?? 0
                }
            }))
            setCharts(migratedCharts)
            setLayout(JSON.parse(savedLayout))
        }

        // Load page background color
        const savedBgColor = localStorage.getItem('datalab-page-bg-color')
        if (savedBgColor) {
            setPageBackgroundColor(savedBgColor)
        }

        fetchDataSources()
    }, [])

    // Save to localStorage whenever charts or layout change
    useEffect(() => {
        if (charts.length > 0) {
            localStorage.setItem('datalab-charts', JSON.stringify(charts))
            localStorage.setItem('datalab-layout', JSON.stringify(layout))
        }
    }, [charts, layout])

    // Save page background color to localStorage
    useEffect(() => {
        localStorage.setItem('datalab-page-bg-color', pageBackgroundColor)
    }, [pageBackgroundColor])

    // Re-aggregate all chart data when filters change
    useEffect(() => {
        const refreshCharts = async () => {
            for (const chart of charts) {
                // Skip filter charts and charts without data
                if (chart.type === 'filter' || !chart.data?.dataSourceId || !chart.data?.xAxis || !chart.data?.yAxis) {
                    continue
                }

                try {
                    const response = await fetch(`/api/reporting-studio/preview/${chart.data.dataSourceId}`)
                    if (response.ok) {
                        const { rows, columns } = await response.json()

                        // Convert array rows to objects
                        const rowObjects = rows.map((row: any[]) => {
                            const obj: any = {}
                            columns.forEach((col: string, idx: number) => {
                                obj[col] = row[idx]
                            })
                            return obj
                        })

                        // Re-aggregate with active filters
                        const chartData = aggregateData(rowObjects, chart.data.xAxis, chart.data.yAxis, chart.data.aggregation || 'sum', activeFilters)

                        // Update this chart's data
                        setCharts(prev => prev.map(c =>
                            c.id === chart.id
                                ? { ...c, data: { ...c.data!, chartData } }
                                : c
                        ))
                    }
                } catch (error) {
                    console.error('Error refreshing chart:', chart.id, error)
                }
            }
        }

        // Only refresh if we have charts and filters
        if (charts.length > 0 && Object.keys(activeFilters).length > 0) {
            refreshCharts()
        }
    }, [activeFilters])

    const fetchDataSources = async () => {
        try {
            const response = await fetch('/api/reporting-studio/files')
            if (response.ok) {
                const { files } = await response.json()
                const sources: DataSource[] = files.map((f: any) => ({
                    id: f.id,
                    name: f.originalName
                }))
                setDataSources(sources)
            }
        } catch (error) {
            console.error('Error fetching data sources:', error)
        }
    }

    const fetchColumns = async (dataSourceId: string) => {
        try {
            const response = await fetch(`/api/reporting-studio/preview/${dataSourceId}?limit=1`)
            if (response.ok) {
                const data = await response.json()
                setAvailableColumns(data.columns || [])
            }
        } catch (error) {
            console.error('Error fetching columns:', error)
        }
    }

    const addChart = (type: string) => {
        const chartType = CHART_TYPES.find(c => c.id === type)
        if (!chartType) return

        const chartId = `${type}-${Date.now()}`
        const newChart: Chart = {
            id: chartId,
            type: type as any,
            title: chartType.name,
            properties: {
                showLegend: true,
                showGrid: true,
                color: '#3b82f6',
                chartBackgroundColor: '#ffffff',
                legendPosition: 'top',
                showAxisLabels: true,
                showDataLabels: false,
                dataLabelPosition: 'top',
                titleFontSize: 16,
                titleFontFamily: 'Arial',
                titleColor: '#000000',
                titleAlign: 'left',
                titleBold: false,
                titleItalic: false,
                titleUnderline: false,
                axisFontSize: 11,
                axisFontFamily: 'Arial',
                axisColor: '#666666',
                axisBold: false,
                axisItalic: false,
                labelFontSize: 11,
                labelFontFamily: 'Arial',
                labelColor: '#000000',
                labelBold: false,
                labelItalic: false,
                chartPaddingLeft: 16,
                chartPaddingRight: 16,
                chartPaddingTop: 8,
                chartPaddingBottom: 8,
                backgroundOpacity: 0
            }
        }

        // Calculate position for new chart (grid layout)
        const newLayout: Layout = {
            i: chartId,
            x: (charts.length * 6) % 12,
            y: Math.floor(charts.length / 2) * 4,
            w: 6,
            h: 4,
            minW: 2,
            minH: 2,
        }

        setCharts([...charts, newChart])
        setLayout([...layout, newLayout])

        // Auto-select the new chart for properties
        setSelectedChartForProperties(chartId)
        setChartTitle(newChart.title)
        setShowLegend(newChart.properties.showLegend)
        setShowGrid(newChart.properties.showGrid)
        setChartColor(newChart.properties.color)
        setChartBackgroundColor(newChart.properties.chartBackgroundColor)
        setLegendPosition(newChart.properties.legendPosition)
        setShowAxisLabels(newChart.properties.showAxisLabels)
        setShowDataLabels(newChart.properties.showDataLabels)
        setTitleFontSize(newChart.properties.titleFontSize)
        setTitleFontFamily(newChart.properties.titleFontFamily)
        setTitleColor(newChart.properties.titleColor)
        setTitleAlign(newChart.properties.titleAlign)
        setTitleBold(newChart.properties.titleBold)
        setTitleItalic(newChart.properties.titleItalic)
        setTitleUnderline(newChart.properties.titleUnderline)
        setAxisFontSize(newChart.properties.axisFontSize)
        setAxisFontFamily(newChart.properties.axisFontFamily)
        setAxisColor(newChart.properties.axisColor)
        setAxisBold(newChart.properties.axisBold)
        setAxisItalic(newChart.properties.axisItalic)
        setLabelFontSize(newChart.properties.labelFontSize)
        setLabelFontFamily(newChart.properties.labelFontFamily)
        setLabelColor(newChart.properties.labelColor)
        setLabelBold(newChart.properties.labelBold)
        setLabelItalic(newChart.properties.labelItalic)
        setChartPaddingLeft(newChart.properties.chartPaddingLeft)
        setChartPaddingRight(newChart.properties.chartPaddingRight)
        setChartPaddingTop(newChart.properties.chartPaddingTop)
        setChartPaddingBottom(newChart.properties.chartPaddingBottom)
        setBackgroundOpacity(newChart.properties.backgroundOpacity)
    }

    const selectChartForProperties = (chartId: string) => {
        const chart = charts.find(c => c.id === chartId)
        if (chart) {
            setSelectedChartForProperties(chartId)
            setChartTitle(chart.title)
            setShowLegend(chart.properties.showLegend)
            setShowGrid(chart.properties.showGrid)
            setChartColor(chart.properties.color)
            setChartBackgroundColor(chart.properties.chartBackgroundColor || '#ffffff')
            setLegendPosition(chart.properties.legendPosition)
            setShowAxisLabels(chart.properties.showAxisLabels)
            setShowDataLabels(chart.properties.showDataLabels)
            setDataLabelPosition(chart.properties.dataLabelPosition)
            setTitleFontSize(chart.properties.titleFontSize)
            setTitleFontFamily(chart.properties.titleFontFamily)
            setTitleColor(chart.properties.titleColor)
            setTitleAlign(chart.properties.titleAlign)
            setTitleBold(chart.properties.titleBold)
            setTitleItalic(chart.properties.titleItalic)
            setTitleUnderline(chart.properties.titleUnderline)
            setAxisFontSize(chart.properties.axisFontSize)
            setAxisFontFamily(chart.properties.axisFontFamily)
            setAxisColor(chart.properties.axisColor)
            setAxisBold(chart.properties.axisBold)
            setAxisItalic(chart.properties.axisItalic)
            setLabelFontSize(chart.properties.labelFontSize)
            setLabelFontFamily(chart.properties.labelFontFamily)
            setLabelColor(chart.properties.labelColor)
            setLabelBold(chart.properties.labelBold)
            setLabelItalic(chart.properties.labelItalic)
            setChartPaddingLeft(chart.properties.chartPaddingLeft)
            setChartPaddingRight(chart.properties.chartPaddingRight)
            setChartPaddingTop(chart.properties.chartPaddingTop)
            setChartPaddingBottom(chart.properties.chartPaddingBottom)
            setBackgroundOpacity(chart.properties.backgroundOpacity || 100)
            setLeftAxisLabel(chart.leftAxisLabel || '')
            setRightAxisLabel(chart.rightAxisLabel || '')
            setExpandedProperties(true)
        }
    }

    const updateChartProperty = (property: string, value: any) => {
        if (!selectedChartForProperties) return

        const updatedCharts = charts.map(chart => {
            if (chart.id === selectedChartForProperties) {
                if (property === 'title') {
                    return { ...chart, title: value }
                } else if (property === 'leftAxisLabel' || property === 'rightAxisLabel') {
                    // Axis labels go directly on the chart object, not in properties
                    return { ...chart, [property]: value }
                } else {
                    return {
                        ...chart,
                        properties: {
                            ...chart.properties,
                            [property]: value
                        }
                    }
                }
            }
            return chart
        })
        setCharts(updatedCharts)
    }

    const removeChart = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation()
        }
        // Also remove any drill-down charts that belong to this chart
        const chartsToRemove = [id]
        charts.forEach(chart => {
            if (chart.drillDownParent === id) {
                chartsToRemove.push(chart.id)
            }
        })

        setCharts(charts.filter(chart => !chartsToRemove.includes(chart.id)))
        setLayout(layout.filter(item => !chartsToRemove.includes(item.i)))
    }

    const clearAll = () => {
        setCharts([])
        setLayout([])
        localStorage.removeItem('datalab-charts')
        localStorage.removeItem('datalab-layout')
    }

    const handleLayoutChange = (newLayout: Layout[]) => {
        setLayout(newLayout)
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            setIsFullscreen(true)
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullscreen(false)
            }
        }
    }

    const openConfigDialog = (chartId: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation()
        }
        const chart = charts.find(c => c.id === chartId)
        if (chart) {
            setSelectedChartId(chartId)

            // Load existing data if available
            if (chart.data) {
                setSelectedDataSource(chart.data.dataSourceId || '')
                setSelectedXAxis(chart.data.xAxis || '')
                setSelectedYAxis(chart.data.yAxis || '')
                setSelectedAggregation(chart.data.aggregation || 'sum')

                // Load multi-series data if available
                if (chart.data.yAxisFields) {
                    setYAxisFields(chart.data.yAxisFields)
                }
                if (chart.data.secondaryYAxis) {
                    setSecondaryYAxis(chart.data.secondaryYAxis)
                    setSecondaryAggregation(chart.data.secondaryAggregation || 'sum')
                    setPrimaryChartType(chart.data.primaryChartType || 'bar')
                    setSecondaryChartType(chart.data.secondaryChartType || 'line')
                }

                // Load decomposition fields for pie charts
                if (chart.type === 'pie' && chart.data.decompositionFields) {
                    setDecompositionFields(chart.data.decompositionFields)
                } else {
                    setDecompositionFields([])
                }

                // Fetch columns for existing data source
                if (chart.data.dataSourceId) {
                    fetchColumns(chart.data.dataSourceId)
                }
            } else {
                // Reset form
                setSelectedDataSource('')
                setSelectedXAxis('')
                setSelectedYAxis('')
                setSelectedAggregation('sum')
                setYAxisFields([])
                setSecondaryYAxis('')
                setSecondaryAggregation('sum')
                setAvailableColumns([])
                setDecompositionFields([])
            }

            setConfigDialogOpen(true)
        }
    }

    const handleDataSourceChange = (value: string) => {
        setSelectedDataSource(value)
        setSelectedXAxis('')
        setSelectedYAxis('')
        setYAxisFields([])
        setSecondaryYAxis('')
        fetchColumns(value)
    }

    const addYAxisField = () => {
        const currentChart = charts.find(c => c.id === selectedChartId)
        const newField: any = {
            id: `field-${Date.now()}`,
            field: '',
            label: '',
            aggregation: 'sum'
        }

        // Add chartType for combo charts - no longer used, combo removed
        // Removed: if (currentChart?.type === 'combo') { newField.chartType = 'bar' }

        // Add axis and chartType for dual-axis charts
        if (currentChart?.type === 'dualaxis') {
            newField.chartType = 'bar'
            newField.axis = 'left'
        }

        setYAxisFields([...yAxisFields, newField])
    }

    const updateYAxisField = (id: string, updates: Partial<typeof yAxisFields[0]>) => {
        setYAxisFields(yAxisFields.map(f => f.id === id ? { ...f, ...updates } : f))
    }

    const removeYAxisField = (id: string) => {
        setYAxisFields(yAxisFields.filter(f => f.id !== id))
    }

    // Helper function to get pie chart data based on drill-down level
    const getPieChartData = (chart: Chart, level: number, filterPath: string[]) => {
        console.log('getPieChartData called:', { level, filterPath, hasRawData: !!chart.data?.rawData, hasChartData: !!chart.data?.chartData })

        if (!chart.data?.rawData && !chart.data?.chartData) return []

        // Use rawData if available (for drill-down), otherwise fall back to chartData
        let data: any[] = chart.data.rawData || chart.data.chartData || []
        const decompositionFields = chart.data.decompositionFields || []

        console.log('Initial data length:', data.length, 'Decomposition fields:', decompositionFields)

        // If at level 0, use the primary xAxis
        if (level === 0) {
            return aggregateData(data, chart.data.xAxis!, chart.data.yAxis!, chart.data.aggregation!, activeFilters)
        }

        // Apply filters for previous levels
        for (let i = 0; i < level && i < filterPath.length; i++) {
            const field = i === 0 ? chart.data.xAxis : decompositionFields[i - 1]
            const filterValue = filterPath[i]
            console.log(`Filtering level ${i}: field=${field}, value=${filterValue}`)
            const beforeLength = data.length
            // Use loose equality to handle string/number mismatches
            data = data.filter((row: any) => {
                const rowValue = row[field!]
                const match = rowValue == filterValue || String(rowValue) === String(filterValue)
                return match
            })
            console.log(`After filter: ${beforeLength} -> ${data.length} rows`)
            if (data.length > 0) {
                console.log('Sample filtered row:', data[0])
            }
        }

        // Get the current level field
        const currentField = decompositionFields[level - 1]
        console.log('Current field for level', level, ':', currentField)

        if (!currentField) {
            console.log('No field found for level', level)
            return []
        }

        // Aggregate by current field
        const result = aggregateData(data, currentField, chart.data.yAxis!, chart.data.aggregation!, {})
        console.log('Aggregated result:', result)
        return result
    }

    // Handle pie chart slice click for drill-down
    const handlePieClick = (chartId: string, data: any, event?: any) => {
        console.log('Pie click event:', { chartId, data, event })

        const chart = charts.find(c => c.id === chartId)
        if (!chart || !chart.data?.decompositionFields || chart.data.decompositionFields.length === 0) return

        const currentLevel = pieDrillDownLevel[chartId] || 0
        const currentPath = pieDrillDownPath[chartId] || []

        // Can only drill down if there are more levels available
        if (currentLevel >= chart.data.decompositionFields.length) return

        // Extract the name from the data payload (Recharts passes it differently)
        const clickedName = data?.payload?.name || data?.name || data
        console.log('Clicked name:', clickedName, 'Current level:', currentLevel, 'Current path:', currentPath)

        // Check if Ctrl/Cmd key is pressed for multi-selection
        const isMultiSelect = event?.ctrlKey || event?.metaKey

        if (isMultiSelect) {
            // Multi-selection mode: Add to selection without creating drill-down yet
            const currentSelections = selectedPieSegments[chartId] || []
            const newSelections = currentSelections.includes(clickedName)
                ? currentSelections.filter(s => s !== clickedName) // Deselect if already selected
                : [...currentSelections, clickedName] // Add to selection

            setSelectedPieSegments({
                ...selectedPieSegments,
                [chartId]: newSelections
            })
            return
        }

        // Single selection mode: Create drill-down immediately
        const newPath = [...currentPath, clickedName]
        const newLevel = currentLevel + 1

        // Get the drill-down data
        const drillDownData = getPieChartData(chart, newLevel, newPath)

        if (drillDownData.length === 0) {
            console.log('No data for drill-down')
            return
        }

        // Check if a drill-down chart already exists for this parent and segment
        const drillDownChartId = `${chartId}-drilldown-${clickedName}`
        const existingDrillDown = charts.find(c => c.id === drillDownChartId)

        if (existingDrillDown) {
            // Update existing drill-down chart
            const updatedCharts = charts.map(c => {
                if (c.id === drillDownChartId) {
                    return {
                        ...c,
                        title: `${chart.title} - ${newPath.join(' > ')}`,
                        data: {
                            ...c.data!,
                            chartData: drillDownData,
                            rawData: chart.data?.rawData,
                            drillDownSegment: clickedName
                        },
                        drillDownParent: chartId,
                        drillDownLevel: newLevel,
                        drillDownPath: newPath
                    }
                }
                return c
            })
            setCharts(updatedCharts)
        } else {
            // Create new drill-down chart
            const parentLayoutItem = layout.find(l => l.i === chartId)

            // Calculate position: stack drill-downs below the parent
            const existingDrillDowns = charts.filter(c => c.drillDownParent === chartId)
            const drillDownIndex = existingDrillDowns.length

            const newChart: Chart = {
                id: drillDownChartId,
                type: 'pie',
                title: `${chart.title} - ${newPath.join(' > ')}`,
                properties: { ...chart.properties },
                data: {
                    ...(chart.data || {}),
                    chartData: drillDownData,
                    rawData: chart.data?.rawData,
                    decompositionFields: chart.data?.decompositionFields?.slice(newLevel), // Remaining levels
                    drillDownSegment: clickedName
                },
                drillDownParent: chartId,
                drillDownLevel: newLevel,
                drillDownPath: newPath
            }

            // Position the new chart below or beside the parent based on available space
            const newLayoutItem: Layout = {
                i: drillDownChartId,
                x: ((parentLayoutItem?.x || 0) + (drillDownIndex % 3) * (parentLayoutItem?.w || 4)) % 12,
                y: (parentLayoutItem?.y || 0) + (parentLayoutItem?.h || 4) + Math.floor(drillDownIndex / 3) * (parentLayoutItem?.h || 4),
                w: parentLayoutItem?.w || 4,
                h: parentLayoutItem?.h || 4
            }

            setCharts([...charts, newChart])
            setLayout([...layout, newLayoutItem])
        }
    }

    // Reset pie chart to initial level
    const resetPieDrillDown = (chartId: string) => {
        setPieDrillDownLevel({ ...pieDrillDownLevel, [chartId]: 0 })
        setPieDrillDownPath({ ...pieDrillDownPath, [chartId]: [] })
        setSelectedPieSegments({ ...selectedPieSegments, [chartId]: [] })

        // Also remove drill-down charts
        const updatedCharts = charts.filter(c => c.drillDownParent !== chartId)
        const updatedLayout = layout.filter(l => {
            return !charts.some(c => c.id === l.i && c.drillDownParent === chartId)
        })
        setCharts(updatedCharts)
        setLayout(updatedLayout)
    }

    // Create drill-downs for multiple selected segments
    const createMultiDrillDowns = (chartId: string) => {
        const chart = charts.find(c => c.id === chartId)
        const selections = selectedPieSegments[chartId] || []

        if (!chart || selections.length === 0) return

        const currentLevel = pieDrillDownLevel[chartId] || 0
        const currentPath = pieDrillDownPath[chartId] || []
        const newLevel = currentLevel + 1

        const parentLayoutItem = layout.find(l => l.i === chartId)
        const newCharts: Chart[] = []
        const newLayouts: Layout[] = []

        selections.forEach((segmentName, index) => {
            const newPath = [...currentPath, segmentName]
            const drillDownData = getPieChartData(chart, newLevel, newPath)

            if (drillDownData.length === 0) return

            const drillDownChartId = `${chartId}-drilldown-${segmentName}`

            // Check if this drill-down already exists
            const existingChart = charts.find(c => c.id === drillDownChartId)
            if (existingChart) return // Skip if already exists

            const newChart: Chart = {
                id: drillDownChartId,
                type: 'pie',
                title: `${chart.title} - ${newPath.join(' > ')}`,
                properties: { ...chart.properties },
                data: {
                    ...(chart.data || {}),
                    chartData: drillDownData,
                    rawData: chart.data?.rawData,
                    decompositionFields: chart.data?.decompositionFields?.slice(newLevel),
                    drillDownSegment: segmentName
                },
                drillDownParent: chartId,
                drillDownLevel: newLevel,
                drillDownPath: newPath
            }

            // Position charts in a grid below parent
            const newLayoutItem: Layout = {
                i: drillDownChartId,
                x: ((parentLayoutItem?.x || 0) + (index % 3) * (parentLayoutItem?.w || 4)) % 12,
                y: (parentLayoutItem?.y || 0) + (parentLayoutItem?.h || 4) + Math.floor(index / 3) * (parentLayoutItem?.h || 4),
                w: parentLayoutItem?.w || 4,
                h: parentLayoutItem?.h || 4
            }

            newCharts.push(newChart)
            newLayouts.push(newLayoutItem)
        })

        if (newCharts.length > 0) {
            setCharts([...charts, ...newCharts])
            setLayout([...layout, ...newLayouts])
            // Clear selections after creating drill-downs
            setSelectedPieSegments({ ...selectedPieSegments, [chartId]: [] })
        }
    }

    // Go back one level in pie chart
    const pieGoBack = (chartId: string) => {
        const currentLevel = pieDrillDownLevel[chartId] || 0
        const currentPath = pieDrillDownPath[chartId] || []

        if (currentLevel > 0) {
            setPieDrillDownLevel({ ...pieDrillDownLevel, [chartId]: currentLevel - 1 })
            setPieDrillDownPath({ ...pieDrillDownPath, [chartId]: currentPath.slice(0, -1) })
        }
    }

    const saveChartConfig = async () => {
        if (!selectedChartId) return

        const dataSource = dataSources.find(ds => ds.id === selectedDataSource)
        const currentChart = charts.find(c => c.id === selectedChartId)

        // Set chart to loading state
        const updatedChartsLoading = charts.map(chart => {
            if (chart.id === selectedChartId) {
                // For filter type, store the filter field
                if (currentChart?.type === 'filter') {
                    return {
                        ...chart,
                        isLoading: true,
                        filterField: selectedXAxis,
                        filterValues: [],
                        data: {
                            dataSourceId: selectedDataSource,
                            dataSourceName: dataSource?.name,
                            xAxis: selectedXAxis,
                            yAxis: '',
                            aggregation: ''
                        }
                    }
                }

                // For multi-series charts (multibar, multiline, combo)
                if (['multibar', 'multiline', 'combo'].includes(currentChart?.type || '')) {
                    return {
                        ...chart,
                        isLoading: true,
                        data: {
                            dataSourceId: selectedDataSource,
                            dataSourceName: dataSource?.name,
                            xAxis: selectedXAxis,
                            yAxis: '', // Not used for multi-series
                            aggregation: '', // Not used for multi-series
                            yAxisFields: yAxisFields // Store all series
                        }
                    }
                }

                // For dualaxis charts - now using multi-series approach
                if (currentChart?.type === 'dualaxis') {
                    return {
                        ...chart,
                        isLoading: true,
                        data: {
                            dataSourceId: selectedDataSource,
                            dataSourceName: dataSource?.name,
                            xAxis: selectedXAxis,
                            yAxis: '', // Not used for multi-series
                            aggregation: '', // Not used for multi-series
                            yAxisFields: yAxisFields // Store all series with axis assignment
                        }
                    }
                }

                // For single-series charts (bar, line, area, pie, scatter, table)
                return {
                    ...chart,
                    isLoading: true,
                    data: {
                        dataSourceId: selectedDataSource,
                        dataSourceName: dataSource?.name,
                        xAxis: selectedXAxis,
                        yAxis: selectedYAxis,
                        aggregation: selectedAggregation,
                        // Save decomposition fields for pie charts
                        ...(currentChart?.type === 'pie' ? { decompositionFields } : {})
                    }
                }
            }
            return chart
        })
        setCharts(updatedChartsLoading)
        setConfigDialogOpen(false)
        setSelectedChartId(null)

        // Fetch the actual data
        try {
            const response = await fetch(`/api/reporting-studio/preview/${selectedDataSource}`)
            if (response.ok) {
                const { rows, columns } = await response.json()

                // Convert array rows to objects
                const rowObjects = rows.map((row: any[]) => {
                    const obj: any = {}
                    columns.forEach((col: string, idx: number) => {
                        obj[col] = row[idx]
                    })
                    return obj
                })

                // For filter type, just store the raw data
                if (currentChart?.type === 'filter') {
                    const updatedChartsWithData = updatedChartsLoading.map(chart => {
                        if (chart.id === selectedChartId) {
                            return {
                                ...chart,
                                isLoading: false,
                                data: {
                                    ...chart.data!,
                                    chartData: rowObjects, // Store raw data for filter
                                }
                            }
                        }
                        return chart
                    })
                    setCharts(updatedChartsWithData)
                    return
                }

                // For multi-series charts (multibar, multiline, combo)
                if (['multibar', 'multiline', 'combo'].includes(currentChart?.type || '')) {
                    // Aggregate data for each series
                    const chartData = rowObjects

                    const updatedChartsWithData = updatedChartsLoading.map(chart => {
                        if (chart.id === selectedChartId) {
                            return {
                                ...chart,
                                isLoading: false,
                                data: {
                                    ...chart.data!,
                                    chartData, // Store raw data for multi-series processing
                                }
                            }
                        }
                        return chart
                    })
                    setCharts(updatedChartsWithData)
                    return
                }

                // For dualaxis charts - now using multi-series approach like multibar/multiline
                if (currentChart?.type === 'dualaxis') {
                    // Store raw data for multi-series processing
                    const chartData = rowObjects

                    const updatedChartsWithData = updatedChartsLoading.map(chart => {
                        if (chart.id === selectedChartId) {
                            return {
                                ...chart,
                                isLoading: false,
                                data: {
                                    ...chart.data!,
                                    chartData, // Store raw data for dual-axis multi-series processing
                                }
                            }
                        }
                        return chart
                    })
                    setCharts(updatedChartsWithData)
                    return
                }

                // For single-series charts - aggregate the data
                const chartData = aggregateData(rowObjects, selectedXAxis, selectedYAxis, selectedAggregation, activeFilters)

                // Update chart with actual data
                const updatedChartsWithData = updatedChartsLoading.map(chart => {
                    if (chart.id === selectedChartId) {
                        // For pie charts with decomposition, store both raw and aggregated data
                        if (currentChart?.type === 'pie') {
                            return {
                                ...chart,
                                isLoading: false,
                                data: {
                                    ...chart.data!,
                                    rawData: rowObjects, // Store raw data for drill-down
                                    chartData, // Store aggregated data for initial display
                                }
                            }
                        }
                        // For other charts, just store aggregated data
                        return {
                            ...chart,
                            isLoading: false,
                            data: {
                                ...chart.data!,
                                chartData,
                            }
                        }
                    }
                    return chart
                })
                setCharts(updatedChartsWithData)
            } else {
                // Handle error
                const updatedChartsError = updatedChartsLoading.map(chart => {
                    if (chart.id === selectedChartId) {
                        return {
                            ...chart,
                            isLoading: false,
                        }
                    }
                    return chart
                })
                setCharts(updatedChartsError)
                alert('Failed to fetch data')
            }
        } catch (error) {
            console.error('Error fetching chart data:', error)
            const updatedChartsError = updatedChartsLoading.map(chart => {
                if (chart.id === selectedChartId) {
                    return {
                        ...chart,
                        isLoading: false,
                    }
                }
                return chart
            })
            setCharts(updatedChartsError)
            alert('Error loading chart data')
        }
    }

    const saveView = async () => {
        if (!viewName.trim()) {
            alert('Please enter a view name')
            return
        }

        try {
            const dashboardData = {
                name: viewName.trim(),
                charts: charts,
                layout: layout,
                pageBackgroundColor: pageBackgroundColor,
                activeFilters: activeFilters
            }

            const response = await fetch('/api/reporting-studio/dashboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dashboardData)
            })

            if (response.ok) {
                const result = await response.json()
                alert(`Dashboard "${viewName}" saved successfully! Redirecting to dashboards...`)
                setSaveViewDialogOpen(false)
                setViewName('')
                // Redirect to dashboards page
                setTimeout(() => {
                    window.location.href = '/reporting-studio/dashboards'
                }, 1000)
            } else {
                const error = await response.json()
                alert(`Failed to save dashboard: ${error.message || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error saving dashboard:', error)
            alert('Error saving dashboard')
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Sidebar */}
            <div className="w-80 h-full border-r bg-card flex flex-col flex-shrink-0">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Beaker className="h-5 w-5" />
                        Data Lab
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                        Create and customize visualizations
                    </p>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                        {/* Page Settings Section - Collapsible */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setExpandedPageSettings(!expandedPageSettings)}
                                className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span>Page Settings</span>
                                {expandedPageSettings ? (
                                    <ChevronDown className="h-3 w-3" />
                                ) : (
                                    <ChevronRight className="h-3 w-3" />
                                )}
                            </button>

                            {expandedPageSettings && (
                                <div className="space-y-2">
                                    <Label className="text-[10px] text-muted-foreground">Canvas Background Color</Label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={pageBackgroundColor}
                                            onChange={(e) => setPageBackgroundColor(e.target.value)}
                                            className="w-12 h-8 rounded cursor-pointer border border-border"
                                        />
                                        <span className="text-xs text-muted-foreground font-mono">{pageBackgroundColor}</span>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setPageBackgroundColor('#f8fafc')}
                                            className="text-xs h-7 px-2"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t" />

                        {/* Filters Section - Collapsible */}
                        {charts.filter(c => c.type === 'filter' && c.filterField && c.data?.chartData).length > 0 && (
                            <>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setExpandedFilters(!expandedFilters)}
                                        className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <span>Filters</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs">
                                                {charts.filter(c => c.type === 'filter' && c.filterField && c.data?.chartData).length}
                                            </Badge>
                                            {expandedFilters ? (
                                                <ChevronDown className="h-3 w-3" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3" />
                                            )}
                                        </div>
                                    </button>

                                    {expandedFilters && (
                                        <div className="space-y-2">
                                            {charts.filter(c => c.type === 'filter' && c.filterField && c.data?.chartData).map((chart) => (
                                                <div key={chart.id} className="border rounded-lg bg-card">
                                                    {/* Filter Header - Always Visible */}
                                                    <div className="p-2 border-b bg-muted/30">
                                                        <div className="flex items-center gap-2">
                                                            <Filter className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                                            <span className="text-xs font-semibold truncate">{chart.filterField}</span>
                                                            {(chart.filterValues?.length || 0) > 0 && (
                                                                <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                                                    {chart.filterValues?.length}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Filter Content - Always Open */}
                                                    <div className="p-2">
                                                        {/* Search Bar */}
                                                        <div className="mb-2">
                                                            <div className="relative">
                                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                                                                <input
                                                                    type="text"
                                                                    placeholder="Search..."
                                                                    value={filterSearchTerms[chart.id] || ''}
                                                                    onChange={(e) => {
                                                                        setFilterSearchTerms({
                                                                            ...filterSearchTerms,
                                                                            [chart.id]: e.target.value
                                                                        })
                                                                    }}
                                                                    className="w-full pl-7 pr-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Filter Options */}
                                                        <div className="max-h-48 overflow-auto space-y-1">
                                                            {(() => {
                                                                const allValues = Array.from(new Set((chart.data?.chartData || []).map((row: any) => String(row[chart.filterField!] || 'N/A')))).sort()
                                                                const searchTerm = (filterSearchTerms[chart.id] || '').toLowerCase()
                                                                const filteredValues = allValues.filter(value => value.toLowerCase().includes(searchTerm))
                                                                const allSelected = filteredValues.every(value => chart.filterValues?.includes(value))

                                                                return (
                                                                    <>
                                                                        {/* Select All Option */}
                                                                        <label className="flex items-center gap-1.5 p-1.5 rounded hover:bg-muted cursor-pointer text-xs border-b">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={allSelected && filteredValues.length > 0}
                                                                                onChange={(e) => {
                                                                                    const newValues = e.target.checked
                                                                                        ? Array.from(new Set([...(chart.filterValues || []), ...filteredValues]))
                                                                                        : (chart.filterValues || []).filter(v => !filteredValues.includes(v))

                                                                                    const updatedCharts = charts.map(c =>
                                                                                        c.id === chart.id ? { ...c, filterValues: newValues } : c
                                                                                    )
                                                                                    setCharts(updatedCharts)

                                                                                    setActiveFilters({
                                                                                        ...activeFilters,
                                                                                        [chart.filterField!]: newValues
                                                                                    })
                                                                                }}
                                                                                className="h-3 w-3 flex-shrink-0"
                                                                            />
                                                                            <span className="font-semibold">Select All</span>
                                                                            <span className="text-[10px] text-muted-foreground ml-auto">
                                                                                ({filteredValues.length})
                                                                            </span>
                                                                        </label>

                                                                        {/* Individual Options */}
                                                                        {filteredValues.map((value: string) => (
                                                                            <label key={value} className="flex items-center gap-1.5 p-1.5 rounded hover:bg-muted cursor-pointer text-xs">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={chart.filterValues?.includes(value) || false}
                                                                                    onChange={(e) => {
                                                                                        const currentValues = chart.filterValues || []
                                                                                        const newValues = e.target.checked
                                                                                            ? [...currentValues, value]
                                                                                            : currentValues.filter(v => v !== value)

                                                                                        const updatedCharts = charts.map(c =>
                                                                                            c.id === chart.id ? { ...c, filterValues: newValues } : c
                                                                                        )
                                                                                        setCharts(updatedCharts)

                                                                                        setActiveFilters({
                                                                                            ...activeFilters,
                                                                                            [chart.filterField!]: newValues
                                                                                        })
                                                                                    }}
                                                                                    className="h-3 w-3 flex-shrink-0"
                                                                                />
                                                                                <span className="truncate flex-1" title={value}>{value}</span>
                                                                                <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                                                                    ({chart.data?.chartData?.filter((row: any) => String(row[chart.filterField!]) === value).length || 0})
                                                                                </span>
                                                                            </label>
                                                                        ))}

                                                                        {filteredValues.length === 0 && (
                                                                            <div className="text-center py-3 text-xs text-muted-foreground">
                                                                                No matches found
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t" />
                            </>
                        )}

                        {/* Visualizations Section - Collapsible */}
                        <div className="space-y-3">
                            <button
                                onClick={() => setExpandedVisualizations(!expandedVisualizations)}
                                className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <span>Visualizations</span>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-xs">
                                        {charts.length}
                                    </Badge>
                                    {expandedVisualizations ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronRight className="h-3 w-3" />
                                    )}
                                </div>
                            </button>

                            {expandedVisualizations && (
                                <>
                                    <p className="text-xs text-muted-foreground">
                                        Click any chart type to add it to the canvas
                                    </p>

                                    <div className="grid grid-cols-3 gap-2">
                                        {CHART_TYPES.map((chart) => (
                                            <button
                                                key={chart.id}
                                                onClick={() => addChart(chart.id)}
                                                className="group relative flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed border-muted hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg bg-muted flex items-center justify-center mb-1 group-hover:scale-110 transition-transform",
                                                    "group-hover:bg-primary/10"
                                                )}>
                                                    <chart.icon className={cn("h-4 w-4", chart.color)} />
                                                </div>
                                                <span className="text-[10px] font-medium text-center leading-tight">
                                                    {chart.name.replace(' Chart', '').replace(' Plot', '')}
                                                </span>
                                                <Plus className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Properties Section */}
                        <div className="space-y-3 pt-4 border-t">
                            <button
                                onClick={() => setExpandedProperties(!expandedProperties)}
                                className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors px-2"
                            >
                                <span>Chart Properties</span>
                                <div className="flex items-center gap-2">
                                    {selectedChartForProperties ? (
                                        <Badge variant="secondary" className="text-xs">
                                            {charts.find(c => c.id === selectedChartForProperties)?.title}
                                        </Badge>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground">Select a chart</span>
                                    )}
                                    {expandedProperties ? (
                                        <ChevronDown className="h-3 w-3" />
                                    ) : (
                                        <ChevronRight className="h-3 w-3" />
                                    )}
                                </div>
                            </button>

                            {expandedProperties && (
                                selectedChartForProperties && charts.find(c => c.id === selectedChartForProperties) ? (
                                    <div className="space-y-2">
                                        {/* Chart Title Button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedTitle(!expandedTitle)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: titleColor }}
                                                    />
                                                    <span className="text-xs font-medium">Title</span>
                                                </div>
                                                {expandedTitle ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {expandedTitle && (
                                                <div className="mt-2 p-3 border rounded-lg bg-card/50 space-y-2">
                                                    <input
                                                        type="text"
                                                        value={chartTitle}
                                                        onChange={(e) => {
                                                            setChartTitle(e.target.value)
                                                            updateChartProperty('title', e.target.value)
                                                        }}
                                                        className="w-full px-2 py-1.5 text-xs border rounded-md"
                                                        placeholder="Enter chart title"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Size</Label>
                                                            <input
                                                                type="number"
                                                                value={titleFontSize}
                                                                onChange={(e) => {
                                                                    setTitleFontSize(Number(e.target.value))
                                                                    updateChartProperty('titleFontSize', Number(e.target.value))
                                                                }}
                                                                className="w-full px-2 py-1 text-xs border rounded-md"
                                                                min="8"
                                                                max="32"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Align</Label>
                                                            <Select value={titleAlign} onValueChange={(val: any) => {
                                                                setTitleAlign(val)
                                                                updateChartProperty('titleAlign', val)
                                                            }}>
                                                                <SelectTrigger className="h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="left">Left</SelectItem>
                                                                    <SelectItem value="center">Center</SelectItem>
                                                                    <SelectItem value="right">Right</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Font</Label>
                                                            <Select value={titleFontFamily} onValueChange={(val) => {
                                                                setTitleFontFamily(val)
                                                                updateChartProperty('titleFontFamily', val)
                                                            }}>
                                                                <SelectTrigger className="h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Arial">Arial</SelectItem>
                                                                    <SelectItem value="Times New Roman">Times</SelectItem>
                                                                    <SelectItem value="Georgia">Georgia</SelectItem>
                                                                    <SelectItem value="Verdana">Verdana</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Color</Label>
                                                            <input
                                                                type="color"
                                                                value={titleColor}
                                                                onChange={(e) => {
                                                                    setTitleColor(e.target.value)
                                                                    updateChartProperty('titleColor', e.target.value)
                                                                }}
                                                                className="w-full h-7 rounded cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-[10px]">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={titleBold}
                                                                onChange={(e) => {
                                                                    setTitleBold(e.target.checked)
                                                                    updateChartProperty('titleBold', e.target.checked)
                                                                }}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="font-bold">B</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={titleItalic}
                                                                onChange={(e) => {
                                                                    setTitleItalic(e.target.checked)
                                                                    updateChartProperty('titleItalic', e.target.checked)
                                                                }}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="italic">I</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={titleUnderline}
                                                                onChange={(e) => {
                                                                    setTitleUnderline(e.target.checked)
                                                                    updateChartProperty('titleUnderline', e.target.checked)
                                                                }}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="underline">U</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Legend Button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedLegend(!expandedLegend)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <span className="text-xs font-medium">Legend</span>
                                                {expandedLegend ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {expandedLegend && (
                                                <div className="mt-2 p-3 border rounded-lg bg-card/50 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs">Show Legend</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={showLegend}
                                                            onChange={(e) => {
                                                                setShowLegend(e.target.checked)
                                                                updateChartProperty('showLegend', e.target.checked)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    {showLegend && (
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Position</Label>
                                                            <Select value={legendPosition} onValueChange={(val: any) => {
                                                                setLegendPosition(val)
                                                                updateChartProperty('legendPosition', val)
                                                            }}>
                                                                <SelectTrigger className="h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="top">Top</SelectItem>
                                                                    <SelectItem value="bottom">Bottom</SelectItem>
                                                                    <SelectItem value="left">Left</SelectItem>
                                                                    <SelectItem value="right">Right</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Axis Button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedAxis(!expandedAxis)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: axisColor }}
                                                    />
                                                    <span className="text-xs font-medium">Axis</span>
                                                </div>
                                                {expandedAxis ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {expandedAxis && (
                                                <div className="mt-2 p-3 border rounded-lg bg-card/50 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs">Show Axis</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={showAxisLabels}
                                                            onChange={(e) => {
                                                                setShowAxisLabels(e.target.checked)
                                                                updateChartProperty('showAxisLabels', e.target.checked)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    {/* Dual Axis Labels - Only show for dual-axis charts */}
                                                    {charts.find(c => c.id === selectedChartForProperties)?.type === 'dualaxis' && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <Label className="text-[10px] text-muted-foreground">Left Axis Label</Label>
                                                                <input
                                                                    type="text"
                                                                    value={leftAxisLabel}
                                                                    onChange={(e) => {
                                                                        setLeftAxisLabel(e.target.value)
                                                                        updateChartProperty('leftAxisLabel', e.target.value)
                                                                    }}
                                                                    placeholder="Left axis name (optional)"
                                                                    className="w-full px-2 py-1 text-xs border rounded-md"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] text-muted-foreground">Right Axis Label</Label>
                                                                <input
                                                                    type="text"
                                                                    value={rightAxisLabel}
                                                                    onChange={(e) => {
                                                                        setRightAxisLabel(e.target.value)
                                                                        updateChartProperty('rightAxisLabel', e.target.value)
                                                                    }}
                                                                    placeholder="Right axis name (optional)"
                                                                    className="w-full px-2 py-1 text-xs border rounded-md"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Size</Label>
                                                            <input
                                                                type="number"
                                                                value={axisFontSize}
                                                                onChange={(e) => {
                                                                    setAxisFontSize(Number(e.target.value))
                                                                    updateChartProperty('axisFontSize', Number(e.target.value))
                                                                }}
                                                                className="w-full px-2 py-1 text-xs border rounded-md"
                                                                min="8"
                                                                max="20"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Font</Label>
                                                            <Select value={axisFontFamily} onValueChange={(val) => {
                                                                setAxisFontFamily(val)
                                                                updateChartProperty('axisFontFamily', val)
                                                            }}>
                                                                <SelectTrigger className="h-7 text-xs">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Arial">Arial</SelectItem>
                                                                    <SelectItem value="Georgia">Georgia</SelectItem>
                                                                    <SelectItem value="Verdana">Verdana</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div>
                                                            <Label className="text-[10px] text-muted-foreground">Color</Label>
                                                            <input
                                                                type="color"
                                                                value={axisColor}
                                                                onChange={(e) => {
                                                                    setAxisColor(e.target.value)
                                                                    updateChartProperty('axisColor', e.target.value)
                                                                }}
                                                                className="w-full h-7 rounded cursor-pointer"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3 text-[10px]">
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={axisBold}
                                                                onChange={(e) => {
                                                                    setAxisBold(e.target.checked)
                                                                    updateChartProperty('axisBold', e.target.checked)
                                                                }}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="font-bold">B</span>
                                                        </label>
                                                        <label className="flex items-center gap-1 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={axisItalic}
                                                                onChange={(e) => {
                                                                    setAxisItalic(e.target.checked)
                                                                    updateChartProperty('axisItalic', e.target.checked)
                                                                }}
                                                                className="h-3 w-3"
                                                            />
                                                            <span className="italic">I</span>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Data Labels Button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedDataLabels(!expandedDataLabels)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: labelColor }}
                                                    />
                                                    <span className="text-xs font-medium">Data Labels</span>
                                                </div>
                                                {expandedDataLabels ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {expandedDataLabels && (
                                                <div className="mt-2 p-3 border rounded-lg bg-card/50 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs">Show Labels</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={showDataLabels}
                                                            onChange={(e) => {
                                                                setShowDataLabels(e.target.checked)
                                                                updateChartProperty('showDataLabels', e.target.checked)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    {showDataLabels && (
                                                        <>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                <div>
                                                                    <Label className="text-[10px] text-muted-foreground">Size</Label>
                                                                    <input
                                                                        type="number"
                                                                        value={labelFontSize}
                                                                        onChange={(e) => {
                                                                            setLabelFontSize(Number(e.target.value))
                                                                            updateChartProperty('labelFontSize', Number(e.target.value))
                                                                        }}
                                                                        className="w-full px-2 py-1 text-xs border rounded-md"
                                                                        min="8"
                                                                        max="20"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Label className="text-[10px] text-muted-foreground">Font</Label>
                                                                    <Select value={labelFontFamily} onValueChange={(val) => {
                                                                        setLabelFontFamily(val)
                                                                        updateChartProperty('labelFontFamily', val)
                                                                    }}>
                                                                        <SelectTrigger className="h-7 text-xs">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="Arial">Arial</SelectItem>
                                                                            <SelectItem value="Georgia">Georgia</SelectItem>
                                                                            <SelectItem value="Verdana">Verdana</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-[10px] text-muted-foreground">Color</Label>
                                                                    <input
                                                                        type="color"
                                                                        value={labelColor}
                                                                        onChange={(e) => {
                                                                            setLabelColor(e.target.value)
                                                                            updateChartProperty('labelColor', e.target.value)
                                                                        }}
                                                                        className="w-full h-7 rounded cursor-pointer"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <Label className="text-[10px] text-muted-foreground">Position</Label>
                                                                <Select value={dataLabelPosition} onValueChange={(val: any) => {
                                                                    setDataLabelPosition(val)
                                                                    updateChartProperty('dataLabelPosition', val)
                                                                }}>
                                                                    <SelectTrigger className="h-7 text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="top">Top</SelectItem>
                                                                        <SelectItem value="center">Center</SelectItem>
                                                                        <SelectItem value="bottom">Bottom</SelectItem>
                                                                        <SelectItem value="inside">Inside</SelectItem>
                                                                        <SelectItem value="outside">Outside</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="flex gap-3 text-[10px]">
                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={labelBold}
                                                                        onChange={(e) => {
                                                                            setLabelBold(e.target.checked)
                                                                            updateChartProperty('labelBold', e.target.checked)
                                                                        }}
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <span className="font-bold">B</span>
                                                                </label>
                                                                <label className="flex items-center gap-1 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={labelItalic}
                                                                        onChange={(e) => {
                                                                            setLabelItalic(e.target.checked)
                                                                            updateChartProperty('labelItalic', e.target.checked)
                                                                        }}
                                                                        className="h-3 w-3"
                                                                    />
                                                                    <span className="italic">I</span>
                                                                </label>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Styling Button */}
                                        <div>
                                            <button
                                                onClick={() => setExpandedStyling(!expandedStyling)}
                                                className="w-full flex items-center justify-between p-2.5 rounded-lg border bg-card hover:bg-accent transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded border"
                                                        style={{ backgroundColor: chartColor }}
                                                    />
                                                    <span className="text-xs font-medium">Styling</span>
                                                </div>
                                                {expandedStyling ? (
                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                ) : (
                                                    <ChevronRight className="h-3.5 w-3.5" />
                                                )}
                                            </button>
                                            {expandedStyling && (
                                                <div className="mt-2 p-3 border rounded-lg bg-card/50 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs">Show Grid</span>
                                                        <input
                                                            type="checkbox"
                                                            checked={showGrid}
                                                            onChange={(e) => {
                                                                setShowGrid(e.target.checked)
                                                                updateChartProperty('showGrid', e.target.checked)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">Chart Background Color</Label>
                                                        <input
                                                            type="color"
                                                            value={chartBackgroundColor}
                                                            onChange={(e) => {
                                                                setChartBackgroundColor(e.target.value)
                                                                updateChartProperty('chartBackgroundColor', e.target.value)
                                                            }}
                                                            className="w-full h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-[10px] text-muted-foreground mb-1 block">Data Color (Bars/Lines)</Label>
                                                        <input
                                                            type="color"
                                                            value={chartColor}
                                                            onChange={(e) => {
                                                                setChartColor(e.target.value)
                                                                updateChartProperty('color', e.target.value)
                                                            }}
                                                            className="w-full h-8 rounded cursor-pointer"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1">
                                                            <Label className="text-[10px] text-muted-foreground">Background Transparency</Label>
                                                            <span className="text-[10px] text-muted-foreground">{backgroundOpacity}%</span>
                                                        </div>
                                                        <p className="text-[9px] text-muted-foreground mb-2">0% = Solid, 100% = See-through</p>
                                                        <input
                                                            type="range"
                                                            value={backgroundOpacity}
                                                            onChange={(e) => {
                                                                setBackgroundOpacity(Number(e.target.value))
                                                                updateChartProperty('backgroundOpacity', Number(e.target.value))
                                                            }}
                                                            className="w-full"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                    <div className="pt-2 border-t">
                                                        <Label className="text-xs font-medium mb-2 block">Padding</Label>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Left</Label>
                                                                    <span className="text-[10px] text-muted-foreground">{chartPaddingLeft}px</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    value={chartPaddingLeft}
                                                                    onChange={(e) => {
                                                                        setChartPaddingLeft(Number(e.target.value))
                                                                        updateChartProperty('chartPaddingLeft', Number(e.target.value))
                                                                    }}
                                                                    className="w-full"
                                                                    min="0"
                                                                    max="50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Right</Label>
                                                                    <span className="text-[10px] text-muted-foreground">{chartPaddingRight}px</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    value={chartPaddingRight}
                                                                    onChange={(e) => {
                                                                        setChartPaddingRight(Number(e.target.value))
                                                                        updateChartProperty('chartPaddingRight', Number(e.target.value))
                                                                    }}
                                                                    className="w-full"
                                                                    min="0"
                                                                    max="50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Top</Label>
                                                                    <span className="text-[10px] text-muted-foreground">{chartPaddingTop}px</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    value={chartPaddingTop}
                                                                    onChange={(e) => {
                                                                        setChartPaddingTop(Number(e.target.value))
                                                                        updateChartProperty('chartPaddingTop', Number(e.target.value))
                                                                    }}
                                                                    className="w-full"
                                                                    min="0"
                                                                    max="50"
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Bottom</Label>
                                                                    <span className="text-[10px] text-muted-foreground">{chartPaddingBottom}px</span>
                                                                </div>
                                                                <input
                                                                    type="range"
                                                                    value={chartPaddingBottom}
                                                                    onChange={(e) => {
                                                                        setChartPaddingBottom(Number(e.target.value))
                                                                        updateChartProperty('chartPaddingBottom', Number(e.target.value))
                                                                    }}
                                                                    className="w-full"
                                                                    min="0"
                                                                    max="50"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="px-4 py-6 text-center space-y-3">
                                        <Settings2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground mb-1">
                                                No Chart Selected
                                            </p>
                                            <p className="text-xs text-muted-foreground/70">
                                                Click on any chart in the canvas to customize its appearance
                                            </p>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </ScrollArea>
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 h-full flex flex-col bg-muted/20">
                {/* Top Bar */}
                <div className="p-4 border-b bg-card flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">Live Preview</h1>
                        <p className="text-sm text-muted-foreground">
                            {charts.length === 0
                                ? 'Click any chart type from the sidebar to start'
                                : `${charts.length} chart${charts.length !== 1 ? 's' : ''} • Drag to move, resize from corners`
                            }
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={charts.length === 0}
                            onClick={toggleFullscreen}
                        >
                            {isFullscreen ? (
                                <>
                                    <Minimize2 className="mr-2 h-4 w-4" />
                                    Exit Fullscreen
                                </>
                            ) : (
                                <>
                                    <Maximize2 className="mr-2 h-4 w-4" />
                                    Fullscreen
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            disabled={charts.length === 0}
                            onClick={() => setSaveViewDialogOpen(true)}
                            variant="default"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Save View
                        </Button>
                        <Button size="sm" disabled={charts.length === 0}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Canvas with Grid Layout */}
                <div
                    className="flex-1 overflow-auto p-6 transition-colors duration-300 relative"
                    style={{ backgroundColor: pageBackgroundColor }}
                    onClick={(e) => {
                        // Deselect chart if clicking on the canvas background (not on a chart)
                        if (e.target === e.currentTarget) {
                            setSelectedChartForProperties(null)
                        }
                    }}
                >
                    {charts.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center max-w-md">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                    <BarChart3 className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Start Creating Visualizations</h3>
                                <p className="text-sm text-muted-foreground mb-6">
                                    Click any chart icon from the sidebar to add it to your dashboard
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {CHART_TYPES.slice(0, 3).map((chart) => (
                                        <Button
                                            key={chart.id}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addChart(chart.id)}
                                            className="gap-2"
                                        >
                                            <chart.icon className={cn("h-4 w-4", chart.color)} />
                                            {chart.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={{ lg: layout }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={80}
                            onLayoutChange={handleLayoutChange}
                            draggableHandle=".drag-handle"
                            isDraggable={true}
                            isResizable={true}
                        >
                            {charts.filter(chart => chart.type !== 'filter').map((chart) => {
                                const chartType = CHART_TYPES.find(c => c.id === chart.type)
                                // For filter and table charts, only xAxis is required
                                // For multi-series charts (multibar, multiline, combo, dualaxis), check if yAxisFields exists and has items
                                // For other charts, both xAxis and yAxis are needed
                                const hasData = chart.data && chart.data.xAxis && (
                                    ['filter', 'table'].includes(chart.type) ||
                                    (['multibar', 'multiline', 'combo', 'dualaxis'].includes(chart.type) && chart.data.yAxisFields && chart.data.yAxisFields.length > 0) ||
                                    chart.data.yAxis
                                )
                                const isSelected = selectedChartForProperties === chart.id

                                return (
                                    <div key={chart.id}>
                                        <Card
                                            className={cn(
                                                "h-full bg-card shadow-lg transition-all cursor-pointer group",
                                                isSelected && "ring-2 ring-primary"
                                            )}
                                            onClick={() => selectChartForProperties(chart.id)}
                                            onDoubleClick={() => openConfigDialog(chart.id)}
                                        >
                                            <CardHeader className="pb-2 pt-3 px-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 drag-handle cursor-move">
                                                        {/* Visual indicator for drill-down charts */}
                                                        {chart.type === 'pie' && chart.drillDownParent && chart.data?.drillDownSegment && (
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div
                                                                    className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
                                                                    style={{
                                                                        backgroundColor: (() => {
                                                                            const parentChart = charts.find(c => c.id === chart.drillDownParent)
                                                                            if (parentChart?.data?.chartData) {
                                                                                const allSegments = parentChart.data.chartData.map((d: any) => d.name)
                                                                                return getSegmentColor(chart.data.drillDownSegment!, allSegments)
                                                                            }
                                                                            return '#3b82f6'
                                                                        })()
                                                                    }}
                                                                />
                                                                <span className="text-[10px] text-muted-foreground font-medium">
                                                                    Drill-down from: {chart.data.drillDownSegment}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <CardTitle
                                                            className="text-sm"
                                                            style={{
                                                                fontSize: `${chart.properties.titleFontSize}px`,
                                                                fontFamily: chart.properties.titleFontFamily,
                                                                color: chart.properties.titleColor,
                                                                textAlign: chart.properties.titleAlign,
                                                                fontWeight: chart.properties.titleBold ? 'bold' : 'normal',
                                                                fontStyle: chart.properties.titleItalic ? 'italic' : 'normal',
                                                                textDecoration: chart.properties.titleUnderline ? 'underline' : 'none'
                                                            }}
                                                        >
                                                            {chart.title}
                                                        </CardTitle>
                                                        {/* Pie chart drill-down breadcrumb */}
                                                        {chart.type === 'pie' && chart.drillDownPath && chart.drillDownPath.length > 0 && (
                                                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <span>{chart.drillDownPath.join(' > ')}</span>
                                                            </div>
                                                        )}
                                                        {/* Multi-selection indicator */}
                                                        {chart.type === 'pie' && !chart.drillDownParent && selectedPieSegments[chart.id]?.length > 0 && (
                                                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                                                                <span className="text-[10px] text-muted-foreground">Selected:</span>
                                                                {selectedPieSegments[chart.id].map((segment: string) => (
                                                                    <Badge
                                                                        key={segment}
                                                                        variant="secondary"
                                                                        className="text-[10px] px-1.5 py-0"
                                                                        style={{
                                                                            backgroundColor: chart.data?.chartData ?
                                                                                getSegmentColor(segment, chart.data.chartData.map((d: any) => d.name)) :
                                                                                '#3b82f6',
                                                                            color: 'white'
                                                                        }}
                                                                    >
                                                                        {segment}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 flex-shrink-0">
                                                        {/* Multi-drill-down button */}
                                                        {chart.type === 'pie' && !chart.drillDownParent && selectedPieSegments[chart.id]?.length > 0 && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                className="h-6 text-[10px] px-2"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    createMultiDrillDowns(chart.id)
                                                                }}
                                                            >
                                                                <ChevronDown className="h-3 w-3 mr-1" />
                                                                Drill Down ({selectedPieSegments[chart.id].length})
                                                            </Button>
                                                        )}
                                                        {/* Reset drill-down button for parent charts with drill-downs */}
                                                        {chart.type === 'pie' && !chart.drillDownParent && charts.some(c => c.drillDownParent === chart.id) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-6 text-[10px] px-2"
                                                                onClick={(e) => {
                                                                    e.preventDefault()
                                                                    e.stopPropagation()
                                                                    resetPieDrillDown(chart.id)
                                                                }}
                                                            >
                                                                Reset
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.preventDefault()
                                                                e.stopPropagation()
                                                                removeChart(chart.id)
                                                            }}
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent
                                                className="h-[calc(100%-3.5rem)]"
                                                style={{
                                                    paddingLeft: `${chart.properties.chartPaddingLeft}px`,
                                                    paddingRight: `${chart.properties.chartPaddingRight}px`,
                                                    paddingTop: `${chart.properties.chartPaddingTop}px`,
                                                    paddingBottom: `${chart.properties.chartPaddingBottom}px`,
                                                    backgroundColor: (() => {
                                                        const color = chart.properties.chartBackgroundColor || '#ffffff'
                                                        const r = parseInt(color.slice(1, 3), 16)
                                                        const g = parseInt(color.slice(3, 5), 16)
                                                        const b = parseInt(color.slice(5, 7), 16)
                                                        const opacity = (100 - chart.properties.backgroundOpacity) / 100
                                                        return `rgba(${r}, ${g}, ${b}, ${opacity})`
                                                    })()
                                                }}
                                            >
                                                {chart.isLoading ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <div className="text-center">
                                                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                                                            <p className="text-sm text-muted-foreground">Loading data...</p>
                                                        </div>
                                                    </div>
                                                ) : hasData && chart.data?.chartData && chart.data.chartData.length > 0 ? (
                                                    <div className="h-full">
                                                        {(chart.type === 'table' || chart.type === 'filter') ? (
                                                            // Non-chart visualizations (table/filter) - render directly without ResponsiveContainer
                                                            chart.type === 'table' ? (
                                                                <div className="h-full overflow-auto">
                                                                    <table className="w-full text-xs">
                                                                        <thead className="bg-muted sticky top-0">
                                                                            <tr>
                                                                                <th className="p-2 text-left border">{chart.data.xAxis}</th>
                                                                                <th className="p-2 text-left border">{chart.data.yAxis}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {chart.data.chartData.map((row, idx) => (
                                                                                <tr key={idx} className="hover:bg-muted/50">
                                                                                    <td className="p-2 border">{row.name}</td>
                                                                                    <td className="p-2 border">{row.value}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            ) : null
                                                        ) : (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                {chart.type === 'bar' ? (
                                                                    <RechartsBar data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    dataKey="name"
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        <Bar
                                                                            dataKey="value"
                                                                            fill={chart.properties.color}
                                                                            name={chart.data.yAxis}
                                                                            label={chart.properties.showDataLabels ? {
                                                                                position: chart.properties.dataLabelPosition as any,
                                                                                fontSize: chart.properties.labelFontSize,
                                                                                fontFamily: chart.properties.labelFontFamily,
                                                                                fill: chart.properties.labelColor,
                                                                                fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                            } : false}
                                                                        />
                                                                    </RechartsBar>
                                                                ) : chart.type === 'line' ? (
                                                                    <RechartsLine data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    dataKey="name"
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        <Line
                                                                            type="monotone"
                                                                            dataKey="value"
                                                                            stroke={chart.properties.color}
                                                                            name={chart.data.yAxis}
                                                                            label={chart.properties.showDataLabels ? {
                                                                                fontSize: chart.properties.labelFontSize,
                                                                                fontFamily: chart.properties.labelFontFamily,
                                                                                fill: chart.properties.labelColor,
                                                                                fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                            } : false}
                                                                        />
                                                                    </RechartsLine>
                                                                ) : chart.type === 'area' ? (
                                                                    <RechartsArea data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    dataKey="name"
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        <Area
                                                                            type="monotone"
                                                                            dataKey="value"
                                                                            fill={chart.properties.color}
                                                                            stroke={chart.properties.color}
                                                                            name={chart.data.yAxis}
                                                                            label={chart.properties.showDataLabels ? {
                                                                                fontSize: chart.properties.labelFontSize,
                                                                                fontFamily: chart.properties.labelFontFamily,
                                                                                fill: chart.properties.labelColor,
                                                                                fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                            } : false}
                                                                        />
                                                                    </RechartsArea>
                                                                ) : chart.type === 'pie' ? (
                                                                    (() => {
                                                                        // For drill-down charts, just use the chartData directly
                                                                        const pieData = chart.data.chartData
                                                                        const hasDecomposition = chart.data.decompositionFields && chart.data.decompositionFields.length > 0
                                                                        const canDrillDown = hasDecomposition && !chart.drillDownParent // Only parent charts can drill down
                                                                        const selections = selectedPieSegments[chart.id] || []

                                                                        return (
                                                                            <RechartsPie data={pieData}>
                                                                                <Pie
                                                                                    data={pieData}
                                                                                    cx="50%"
                                                                                    cy="50%"
                                                                                    labelLine={false}
                                                                                    label={chart.properties.showDataLabels ? {
                                                                                        fontSize: chart.properties.labelFontSize,
                                                                                        fontFamily: chart.properties.labelFontFamily,
                                                                                        fill: chart.properties.labelColor,
                                                                                        fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                                    } : false}
                                                                                    outerRadius="80%"
                                                                                    dataKey="value"
                                                                                    onClick={canDrillDown ? (data: any, index: number, event: any) => handlePieClick(chart.id, data, event) : undefined}
                                                                                    cursor={canDrillDown ? 'pointer' : 'default'}
                                                                                >
                                                                                    {pieData?.map((entry, index) => {
                                                                                        const isSelected = selections.includes(entry.name)
                                                                                        return (
                                                                                            <Cell
                                                                                                key={`cell-${index}`}
                                                                                                fill={COLORS[index % COLORS.length]}
                                                                                                style={{
                                                                                                    cursor: canDrillDown ? 'pointer' : 'default',
                                                                                                    opacity: canDrillDown && isSelected ? 0.7 : 1,
                                                                                                    stroke: isSelected ? '#fff' : 'none',
                                                                                                    strokeWidth: isSelected ? 3 : 0
                                                                                                }}
                                                                                            />
                                                                                        )
                                                                                    })}
                                                                                </Pie>
                                                                                <Tooltip />
                                                                                {chart.properties.showLegend && (
                                                                                    <Legend
                                                                                        verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                        align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                                    />
                                                                                )}
                                                                            </RechartsPie>
                                                                        )
                                                                    })()
                                                                ) : chart.type === 'scatter' ? (
                                                                    <RechartsScatter data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    type="category"
                                                                                    dataKey="name"
                                                                                    name={chart.data.xAxis}
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    type="number"
                                                                                    dataKey="value"
                                                                                    name={chart.data.yAxis}
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        <Scatter
                                                                            name={chart.data.yAxis}
                                                                            dataKey="value"
                                                                            fill={chart.properties.color}
                                                                        />
                                                                    </RechartsScatter>
                                                                ) : chart.type === 'multibar' ? (
                                                                    <RechartsBar data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    dataKey={chart.data.xAxis}
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        {chart.data.yAxisFields?.map((field: any, idx: number) => (
                                                                            <Bar
                                                                                key={field.id}
                                                                                dataKey={field.field}
                                                                                fill={COLORS[idx % COLORS.length]}
                                                                                name={field.label || field.field}
                                                                                label={chart.properties.showDataLabels ? {
                                                                                    position: chart.properties.dataLabelPosition as any,
                                                                                    fontSize: chart.properties.labelFontSize,
                                                                                    fontFamily: chart.properties.labelFontFamily,
                                                                                    fill: chart.properties.labelColor,
                                                                                    fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                    fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                                } : false}
                                                                            />
                                                                        ))}
                                                                    </RechartsBar>
                                                                ) : chart.type === 'multiline' ? (
                                                                    <RechartsLine data={chart.data.chartData}>
                                                                        {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                        {chart.properties.showAxisLabels && (
                                                                            <>
                                                                                <XAxis
                                                                                    dataKey={chart.data.xAxis}
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                <YAxis
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Tooltip />
                                                                        {chart.properties.showLegend && (
                                                                            <Legend
                                                                                verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                            />
                                                                        )}
                                                                        {chart.data.yAxisFields?.map((field: any, idx: number) => (
                                                                            <Line
                                                                                key={field.id}
                                                                                type="monotone"
                                                                                dataKey={field.field}
                                                                                stroke={COLORS[idx % COLORS.length]}
                                                                                name={field.label || field.field}
                                                                                label={chart.properties.showDataLabels ? {
                                                                                    fontSize: chart.properties.labelFontSize,
                                                                                    fontFamily: chart.properties.labelFontFamily,
                                                                                    fill: chart.properties.labelColor,
                                                                                    fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                    fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                                } : false}
                                                                            />
                                                                        ))}
                                                                    </RechartsLine>
                                                                ) : chart.type === 'dualaxis' ? (
                                                                    (() => {
                                                                        console.log('Dual-axis chart data:', {
                                                                            chartData: chart.data.chartData,
                                                                            xAxis: chart.data.xAxis,
                                                                            yAxisFields: chart.data.yAxisFields,
                                                                            sampleRow: chart.data.chartData?.[0]
                                                                        })

                                                                        const leftFields = chart.data.yAxisFields?.filter((f: any) => f.axis === 'left') || []
                                                                        const rightFields = chart.data.yAxisFields?.filter((f: any) => f.axis === 'right') || []

                                                                        return (
                                                                            <ComposedChart data={chart.data.chartData}>
                                                                                {chart.properties.showGrid && <CartesianGrid strokeDasharray="3 3" />}
                                                                                {/* X-Axis */}
                                                                                <XAxis
                                                                                    dataKey={chart.data.xAxis}
                                                                                    hide={!chart.properties.showAxisLabels}
                                                                                    tick={{
                                                                                        fontSize: chart.properties.axisFontSize,
                                                                                        fontFamily: chart.properties.axisFontFamily,
                                                                                        fill: chart.properties.axisColor,
                                                                                        fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                        fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                    }}
                                                                                />
                                                                                {/* Left Y-Axis (Primary) - Show if there are left-axis series */}
                                                                                {leftFields.length > 0 && (
                                                                                    <YAxis
                                                                                        yAxisId="left"
                                                                                        tick={{
                                                                                            fontSize: chart.properties.axisFontSize,
                                                                                            fontFamily: chart.properties.axisFontFamily,
                                                                                            fill: chart.properties.axisColor,
                                                                                            fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                            fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                        }}
                                                                                        label={chart.properties.showAxisLabels && chart.leftAxisLabel ? {
                                                                                            value: chart.leftAxisLabel,
                                                                                            angle: -90,
                                                                                            position: 'insideLeft',
                                                                                            style: {
                                                                                                fontSize: chart.properties.axisFontSize,
                                                                                                fontFamily: chart.properties.axisFontFamily,
                                                                                                fill: chart.properties.axisColor
                                                                                            }
                                                                                        } : undefined}
                                                                                    />
                                                                                )}
                                                                                {/* Right Y-Axis (Secondary) - Show if there are right-axis series */}
                                                                                {rightFields.length > 0 && (
                                                                                    <YAxis
                                                                                        yAxisId="right"
                                                                                        orientation="right"
                                                                                        tick={{
                                                                                            fontSize: chart.properties.axisFontSize,
                                                                                            fontFamily: chart.properties.axisFontFamily,
                                                                                            fill: chart.properties.axisColor,
                                                                                            fontWeight: chart.properties.axisBold ? 'bold' : 'normal',
                                                                                            fontStyle: chart.properties.axisItalic ? 'italic' : 'normal'
                                                                                        }}
                                                                                        label={chart.properties.showAxisLabels && chart.rightAxisLabel ? {
                                                                                            value: chart.rightAxisLabel,
                                                                                            angle: 90,
                                                                                            position: 'insideRight',
                                                                                            style: {
                                                                                                fontSize: chart.properties.axisFontSize,
                                                                                                fontFamily: chart.properties.axisFontFamily,
                                                                                                fill: chart.properties.axisColor
                                                                                            }
                                                                                        } : undefined}
                                                                                    />
                                                                                )}
                                                                                <Tooltip />
                                                                                {chart.properties.showLegend && (
                                                                                    <Legend
                                                                                        verticalAlign={chart.properties.legendPosition === 'top' || chart.properties.legendPosition === 'bottom' ? chart.properties.legendPosition : 'top'}
                                                                                        align={chart.properties.legendPosition === 'left' || chart.properties.legendPosition === 'right' ? chart.properties.legendPosition : 'center'}
                                                                                    />
                                                                                )}
                                                                                {/* Render all series */}
                                                                                {chart.data.yAxisFields?.map((field: any, idx: number) => {
                                                                                    const yAxisId = field.axis || 'left'
                                                                                    const chartType = field.chartType || 'bar'

                                                                                    return chartType === 'line' ? (
                                                                                        <Line
                                                                                            key={field.id}
                                                                                            yAxisId={yAxisId}
                                                                                            type="monotone"
                                                                                            dataKey={field.field}
                                                                                            stroke={COLORS[idx % COLORS.length]}
                                                                                            name={field.label || field.field}
                                                                                            strokeWidth={2}
                                                                                            dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                                                                                            label={chart.properties.showDataLabels ? {
                                                                                                fontSize: chart.properties.labelFontSize,
                                                                                                fontFamily: chart.properties.labelFontFamily,
                                                                                                fill: chart.properties.labelColor,
                                                                                                fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                                fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                                            } : false}
                                                                                        />
                                                                                    ) : (
                                                                                        <Bar
                                                                                            key={field.id}
                                                                                            yAxisId={yAxisId}
                                                                                            dataKey={field.field}
                                                                                            fill={COLORS[idx % COLORS.length]}
                                                                                            name={field.label || field.field}
                                                                                            label={chart.properties.showDataLabels ? {
                                                                                                position: chart.properties.dataLabelPosition as any,
                                                                                                fontSize: chart.properties.labelFontSize,
                                                                                                fontFamily: chart.properties.labelFontFamily,
                                                                                                fill: chart.properties.labelColor,
                                                                                                fontWeight: chart.properties.labelBold ? 'bold' : 'normal',
                                                                                                fontStyle: chart.properties.labelItalic ? 'italic' : 'normal'
                                                                                            } : false}
                                                                                        />
                                                                                    )
                                                                                })}
                                                                            </ComposedChart>
                                                                        )
                                                                    })()
                                                                ) : (
                                                                    <div />
                                                                )}
                                                            </ResponsiveContainer>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-full border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                                                        <div className="text-center">
                                                            {chartType && (
                                                                <chartType.icon className={cn("h-12 w-12 mx-auto mb-3", chartType.color, "opacity-50")} />
                                                            )}
                                                            <p className="text-sm text-muted-foreground mb-3">
                                                                No data connected
                                                            </p>
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={(e) => openConfigDialog(chart.id, e)}
                                                            >
                                                                <Plus className="mr-2 h-3 w-3" />
                                                                Add Data
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                )
                            })}
                        </ResponsiveGridLayout>
                    )}
                </div>
            </div>

            {/* Data Configuration Dialog */}
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Configure Chart Data - {charts.find(c => c.id === selectedChartId)?.title}</DialogTitle>
                        <DialogDescription>
                            {charts.find(c => c.id === selectedChartId)?.type === 'multibar' && 'Add multiple data series for grouped or stacked bars'}
                            {charts.find(c => c.id === selectedChartId)?.type === 'multiline' && 'Add multiple data series for comparison'}
                            {charts.find(c => c.id === selectedChartId)?.type === 'dualaxis' && 'Add multiple metrics with independent left/right scales'}
                            {!['multibar', 'multiline', 'dualaxis'].includes(charts.find(c => c.id === selectedChartId)?.type || '') && 'Select a data source and choose columns for visualization'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Data Source</Label>
                            <Select value={selectedDataSource} onValueChange={handleDataSourceChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a data source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dataSources.map((source) => (
                                        <SelectItem key={source.id} value={source.id}>
                                            {source.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {availableColumns.length > 0 && (
                            <>
                                {/* Filter Configuration */}
                                {charts.find(c => c.id === selectedChartId)?.type === 'filter' ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Filter Field</Label>
                                            <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select field to filter" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableColumns.map((col) => (
                                                        <SelectItem key={col} value={col}>
                                                            {col}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                This field will be used to filter all charts in the dashboard
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-2">
                                            <Label>X-Axis Column (Category/Labels)</Label>
                                            <Select value={selectedXAxis} onValueChange={setSelectedXAxis}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select X-axis column" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availableColumns.map((col) => (
                                                        <SelectItem key={col} value={col}>
                                                            {col}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Multi-series charts (Multi Bar, Multi Line, Combo) */}
                                        {['multibar', 'multiline', 'combo'].includes(charts.find(c => c.id === selectedChartId)?.type || '') && (
                                            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold">Data Series</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={addYAxisField}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Series
                                                    </Button>
                                                </div>
                                                {yAxisFields.length === 0 && (
                                                    <p className="text-xs text-muted-foreground text-center py-4">
                                                        No data series added yet. Click "Add Series" to get started.
                                                    </p>
                                                )}
                                                {yAxisFields.map((field, index) => (
                                                    <div key={field.id} className="space-y-2 p-3 border rounded-lg bg-card">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium">Series {index + 1}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => removeYAxisField(field.id)}
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                        <div className={cn(
                                                            "grid gap-2",
                                                            charts.find(c => c.id === selectedChartId)?.type === 'dualaxis' ? 'grid-cols-4' : 'grid-cols-3'
                                                        )}>
                                                            <div>
                                                                <Label className="text-xs">Column</Label>
                                                                <Select
                                                                    value={field.field}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { field: val })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue placeholder="Select column" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableColumns.map((col) => (
                                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Label</Label>
                                                                <input
                                                                    type="text"
                                                                    value={field.label}
                                                                    onChange={(e) => updateYAxisField(field.id, { label: e.target.value })}
                                                                    placeholder="Series name"
                                                                    className="h-8 w-full px-2 text-xs border rounded-md"
                                                                />
                                                            </div>
                                                            {charts.find(c => c.id === selectedChartId)?.type === 'dualaxis' && (
                                                                <div>
                                                                    <Label className="text-xs">Chart Type</Label>
                                                                    <Select
                                                                        value={field.chartType || 'bar'}
                                                                        onValueChange={(val) => updateYAxisField(field.id, { chartType: val as 'bar' | 'line' })}
                                                                    >
                                                                        <SelectTrigger className="h-8">
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="bar">Bar</SelectItem>
                                                                            <SelectItem value="line">Line</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Label className="text-xs">Aggregation</Label>
                                                                <Select
                                                                    value={field.aggregation}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { aggregation: val })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="sum">Sum</SelectItem>
                                                                        <SelectItem value="average">Avg</SelectItem>
                                                                        <SelectItem value="count">Count</SelectItem>
                                                                        <SelectItem value="min">Min</SelectItem>
                                                                        <SelectItem value="max">Max</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Dual Axis chart - now uses multi-series approach */}
                                        {charts.find(c => c.id === selectedChartId)?.type === 'dualaxis' && (
                                            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-semibold">Data Series (Dual-Axis)</Label>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={addYAxisField}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Add Series
                                                    </Button>
                                                </div>
                                                {yAxisFields.length === 0 && (
                                                    <p className="text-xs text-muted-foreground text-center py-4">
                                                        No data series added yet. Click "Add Series" to get started. You can assign each series to left or right Y-axis.
                                                    </p>
                                                )}
                                                {yAxisFields.map((field, index) => (
                                                    <div key={field.id} className="space-y-2 p-3 border rounded-lg bg-card">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-medium">Series {index + 1}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => removeYAxisField(field.id)}
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            <div>
                                                                <Label className="text-xs">Column</Label>
                                                                <Select
                                                                    value={field.field}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { field: val })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue placeholder="Select column" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableColumns.map((col) => (
                                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Label</Label>
                                                                <input
                                                                    type="text"
                                                                    value={field.label}
                                                                    onChange={(e) => updateYAxisField(field.id, { label: e.target.value })}
                                                                    placeholder="Series name"
                                                                    className="h-8 w-full px-2 text-xs border rounded-md"
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Y-Axis</Label>
                                                                <Select
                                                                    value={field.axis || 'left'}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { axis: val as 'left' | 'right' })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="left">Left</SelectItem>
                                                                        <SelectItem value="right">Right</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs">Type</Label>
                                                                <Select
                                                                    value={field.chartType || 'bar'}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { chartType: val as 'bar' | 'line' })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="bar">Bar</SelectItem>
                                                                        <SelectItem value="line">Line</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            <div>
                                                                <Label className="text-xs">Aggregation</Label>
                                                                <Select
                                                                    value={field.aggregation}
                                                                    onValueChange={(val) => updateYAxisField(field.id, { aggregation: val })}
                                                                >
                                                                    <SelectTrigger className="h-8">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="sum">Sum</SelectItem>
                                                                        <SelectItem value="average">Avg</SelectItem>
                                                                        <SelectItem value="count">Count</SelectItem>
                                                                        <SelectItem value="min">Min</SelectItem>
                                                                        <SelectItem value="max">Max</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Single-series charts (Bar, Line, Area, Pie, Scatter) */}
                                        {!['multibar', 'multiline', 'combo', 'dualaxis'].includes(charts.find(c => c.id === selectedChartId)?.type || '') && (
                                            <>
                                                <div className="space-y-2">
                                                    <Label>Y-Axis Column (Values)</Label>
                                                    <Select value={selectedYAxis} onValueChange={setSelectedYAxis}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Y-axis column" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {availableColumns.map((col) => (
                                                                <SelectItem key={col} value={col}>
                                                                    {col}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label>Aggregation</Label>
                                                    <Select value={selectedAggregation} onValueChange={setSelectedAggregation}>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sum">Sum</SelectItem>
                                                            <SelectItem value="average">Average</SelectItem>
                                                            <SelectItem value="count">Count</SelectItem>
                                                            <SelectItem value="min">Minimum</SelectItem>
                                                            <SelectItem value="max">Maximum</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {/* Pie Chart Drill-Down Decomposition Fields */}
                                                {charts.find(c => c.id === selectedChartId)?.type === 'pie' && (
                                                    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <Label className="text-sm font-semibold">Drill-Down Levels (Optional)</Label>
                                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                                    Click on pie slices to drill down. Hold Ctrl/Cmd to select multiple slices.
                                                                </p>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setDecompositionFields([...decompositionFields, ''])}
                                                                disabled={decompositionFields.length >= 3}
                                                            >
                                                                <Plus className="h-4 w-4 mr-1" />
                                                                Add Level
                                                            </Button>
                                                        </div>
                                                        {decompositionFields.length === 0 && (
                                                            <p className="text-xs text-muted-foreground text-center py-3">
                                                                No drill-down levels. Add levels for hierarchical exploration.
                                                            </p>
                                                        )}
                                                        {decompositionFields.map((field, index) => (
                                                            <div key={index} className="flex items-center gap-2">
                                                                <span className="text-xs font-medium w-16">Level {index + 2}:</span>
                                                                <Select
                                                                    value={field}
                                                                    onValueChange={(val) => {
                                                                        const updated = [...decompositionFields]
                                                                        updated[index] = val
                                                                        setDecompositionFields(updated)
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="h-8 flex-1">
                                                                        <SelectValue placeholder="Select decomposition field" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableColumns.map((col) => (
                                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 flex-shrink-0"
                                                                    onClick={() => {
                                                                        setDecompositionFields(decompositionFields.filter((_, i) => i !== index))
                                                                    }}
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={saveChartConfig}
                            disabled={
                                !selectedDataSource ||
                                !selectedXAxis ||
                                (
                                    // Filter and table charts only need datasource and xAxis
                                    ['filter', 'table'].includes(charts.find(c => c.id === selectedChartId)?.type || '')
                                        ? false
                                        : ['multibar', 'multiline', 'combo', 'dualaxis'].includes(charts.find(c => c.id === selectedChartId)?.type || '')
                                            ? yAxisFields.length === 0 || yAxisFields.some(f => !f.field)
                                            : !selectedYAxis
                                )
                            }
                        >
                            Save Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Save View Dialog */}
            <Dialog open={saveViewDialogOpen} onOpenChange={setSaveViewDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Save Dashboard View</DialogTitle>
                        <DialogDescription>
                            Enter a name for this dashboard. It will be saved and appear in the Dashboard page.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="viewName">Dashboard Name</Label>
                            <Input
                                id="viewName"
                                placeholder="Enter dashboard name..."
                                value={viewName}
                                onChange={(e) => setViewName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        saveView()
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                        <div className="text-xs text-muted-foreground">
                            <p className="font-semibold mb-1">What will be saved:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>{charts.length} chart{charts.length !== 1 ? 's' : ''}</li>
                                <li>Chart layout and positioning</li>
                                <li>All chart configurations and styling</li>
                                <li>Active filters ({Object.keys(activeFilters).length})</li>
                                <li>Page settings (background color)</li>
                            </ul>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setSaveViewDialogOpen(false)
                            setViewName('')
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={saveView} disabled={!viewName.trim()}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Dashboard
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface Dashboard {
    id: string
    name: string
    configuration: {
        charts: any[]
        layout: any[]
        pageBackgroundColor: string
        activeFilters: Record<string, string[]>
    }
    createdAt: string
    updatedAt: string
    createdByUser: {
        name: string | null
        email: string
    }
}

// Aggregation function to process data
const aggregateData = (
    rawData: any[],
    xField: string,
    yField: string,
    aggregation: string
): any[] => {
    if (aggregation === 'none') {
        return rawData.map(item => ({
            [xField]: item[xField],
            [yField]: item[yField]
        }))
    }

    const grouped = rawData.reduce((acc, item) => {
        const key = item[xField]
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(Number(item[yField]) || 0)
        return acc
    }, {} as Record<string, number[]>)

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
            [xField]: key,
            [yField]: aggregatedValue
        }
    })
}

export default function DashboardViewPage() {
    const params = useParams()
    const router = useRouter()
    const [dashboard, setDashboard] = useState<Dashboard | null>(null)
    const [chartsWithData, setChartsWithData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboard = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/reporting-studio/dashboard')
            if (response.ok) {
                const data = await response.json()
                const foundDashboard = data.dashboards?.find((d: Dashboard) => d.id === params.id)
                if (foundDashboard) {
                    setDashboard(foundDashboard)
                    // Load fresh data for each chart
                    await loadChartsData(foundDashboard.configuration.charts, foundDashboard.configuration.activeFilters)
                } else {
                    setError('Dashboard not found')
                }
            } else {
                setError('Failed to load dashboard')
            }
        } catch (err) {
            console.error('Error fetching dashboard:', err)
            setError('Error loading dashboard')
        } finally {
            setLoading(false)
        }
    }

    const loadChartsData = async (charts: any[], activeFilters: Record<string, string[]>) => {
        try {
            console.log('Loading charts data:', charts)
            const chartsWithFreshData = await Promise.all(
                charts.map(async (chart) => {
                    console.log('Processing chart:', chart.id, 'type:', chart.type, 'dataSourceId:', chart.data?.dataSourceId)
                    
                    if (chart.type === 'filter' || chart.type === 'table') {
                        return { ...chart, loadedData: [] }
                    }

                    try {
                        // Fetch fresh data from the data source
                        const dataSourceId = chart.data?.dataSourceId
                        if (!dataSourceId) {
                            console.error(`No dataSourceId found for chart ${chart.id}`)
                            return { ...chart, loadedData: [] }
                        }
                        
                        console.log(`Fetching data from: /api/reporting-studio/files/${dataSourceId}`)
                        
                        const response = await fetch(`/api/reporting-studio/files/${dataSourceId}`)
                        console.log(`Response status for chart ${chart.id}:`, response.status)
                        
                        if (!response.ok) {
                            console.error(`Failed to load data for chart ${chart.id}, status: ${response.status}`)
                            return { ...chart, loadedData: [] }
                        }

                        const result = await response.json()
                        let rawData = result.data || []
                        console.log(`Raw data loaded for chart ${chart.id}:`, rawData.length, 'rows')

                        // Apply active filters
                        Object.entries(activeFilters).forEach(([filterField, selectedValues]) => {
                            if (selectedValues.length > 0) {
                                rawData = rawData.filter((row: any) =>
                                    selectedValues.includes(String(row[filterField]))
                                )
                            }
                        })
                        console.log(`Filtered data for chart ${chart.id}:`, rawData.length, 'rows')

                        // Aggregate data
                        const chartData = aggregateData(
                            rawData,
                            chart.data.xAxis,
                            chart.data.yAxis,
                            chart.data.aggregation || 'sum'
                        )
                        console.log(`Aggregated data for chart ${chart.id}:`, chartData)

                        return { ...chart, loadedData: chartData }
                    } catch (error) {
                        console.error(`Error loading data for chart ${chart.id}:`, error)
                        return { ...chart, loadedData: [] }
                    }
                })
            )
            console.log('All charts with data:', chartsWithFreshData)
            setChartsWithData(chartsWithFreshData)
        } catch (error) {
            console.error('Error loading charts data:', error)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [params.id])

    const renderChart = (chart: any) => {
        const chartData = chart.loadedData || []
        const hasData = chartData.length > 0

        if (!hasData) {
            return (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                </div>
            )
        }

        const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d']

        switch (chart.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={chart.data.xAxis} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={chart.data.yAxis} fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                )
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={chart.data.xAxis} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey={chart.data.yAxis} stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                )
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey={chart.data.yAxis}
                                nameKey={chart.data.xAxis}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                label
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                )
            default:
                return <div className="text-muted-foreground">Unsupported chart type</div>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (error || !dashboard) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-2">
                    <Link href="/reporting-studio/dashboards">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboards
                        </Button>
                    </Link>
                </div>
                <Card className="p-12">
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{error || 'Dashboard not found'}</p>
                        <Link href="/reporting-studio/dashboards">
                            <Button>Return to Dashboards</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: dashboard.configuration.pageBackgroundColor || '#ffffff' }}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/reporting-studio/dashboards">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{dashboard.name}</h1>
                            <p className="text-sm text-muted-foreground">
                                Created by {dashboard.createdByUser.name || dashboard.createdByUser.email}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                            {dashboard.configuration.charts.length} charts
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDashboard}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Active Filters */}
                {Object.keys(dashboard.configuration.activeFilters).length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-4">
                        <h3 className="text-sm font-semibold mb-2">Active Filters:</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(dashboard.configuration.activeFilters).map(([key, values]) => (
                                <Badge key={key} variant="outline">
                                    {key}: {values.length} selected
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chartsWithData
                        .filter(chart => chart.type !== 'filter')
                        .map((chart) => (
                            <Card key={chart.id} className="p-4">
                                <div className="mb-2">
                                    <h3 className="font-semibold">{chart.title}</h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {chart.type}
                                    </Badge>
                                </div>
                                <div style={{ height: '300px' }}>
                                    {renderChart(chart)}
                                </div>
                            </Card>
                        ))}
                </div>

                {chartsWithData.filter(c => c.type !== 'filter').length === 0 && (
                    <Card className="p-12">
                        <div className="text-center text-muted-foreground">
                            No charts to display
                        </div>
                    </Card>
                )}
            </div>
        </div>
    )
}


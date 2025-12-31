'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { DollarSign, TrendingUp, Calendar, Clock, Target, Briefcase, GripVertical, ChevronLeft, ChevronRight, Search as SearchIcon, Filter, Calendar as CalendarIcon, Video, Phone, MessageSquare, Users as UsersIcon, LayoutGrid, UserPlus, Building2 } from 'lucide-react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  // Sales Metrics
  { id: 'metric-totalSales', type: 'metric-totalSales', visible: false },
  { id: 'metric-winRate', type: 'metric-winRate', visible: false },
  { id: 'metric-closeRate', type: 'metric-closeRate', visible: false },
  { id: 'metric-avgDaysToClose', type: 'metric-avgDaysToClose', visible: false },
  { id: 'metric-pipelineValue', type: 'metric-pipelineValue', visible: false },
  { id: 'metric-openDeals', type: 'metric-openDeals', visible: false },
  { id: 'metric-weightedValue', type: 'metric-weightedValue', visible: false },
  { id: 'metric-avgOpenDealAge', type: 'metric-avgOpenDealAge', visible: false },
  // Sales Charts
  { id: 'chart-wonDeals', type: 'chart-wonDeals', visible: false },
  { id: 'chart-projection', type: 'chart-projection', visible: false },
  { id: 'chart-pipeline', type: 'chart-pipeline', visible: false },
  { id: 'chart-lossReasons', type: 'chart-lossReasons', visible: false },
  // Sales Tools
  { id: 'filters', type: 'filters', visible: false },
  { id: 'schedule', type: 'schedule', visible: false },
  { id: 'help', type: 'help', visible: false },
  // General Widgets
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'forms', type: 'forms', visible: false },
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
  { id: 'ganttChart', type: 'ganttChart', visible: false },
]

interface DashboardStats {
  totalSales: number
  winRate: number
  closeRate: number
  avgDaysToClose: number
  pipelineValue: number
  openDeals: number
  weightedValue: number
  avgOpenDealAge: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d', '#8dd1e1', '#d084d0']

const defaultLayouts: Layouts = {
  lg: [
    // Key metrics row 1
    { i: 'metric-totalSales', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-winRate', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-closeRate', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgDaysToClose', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    // Key metrics row 2
    { i: 'metric-pipelineValue', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openDeals', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-weightedValue', x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgOpenDealAge', x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    // Charts and filters
    { i: 'chart-wonDeals', x: 0, y: 6, w: 8, h: 8, minW: 4, minH: 6 },
    { i: 'chart-projection', x: 0, y: 14, w: 8, h: 8, minW: 4, minH: 6 },
    { i: 'filters', x: 8, y: 6, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'chart-pipeline', x: 8, y: 12, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'chart-lossReasons', x: 8, y: 18, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'help', x: 8, y: 24, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'schedule', x: 0, y: 22, w: 12, h: 12, minW: 6, minH: 8 },
  ],
  md: [
    { i: 'metric-totalSales', x: 0, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-winRate', x: 5, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-closeRate', x: 0, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgDaysToClose', x: 5, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-pipelineValue', x: 0, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openDeals', x: 5, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-weightedValue', x: 0, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgOpenDealAge', x: 5, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'chart-wonDeals', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-projection', x: 0, y: 20, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'filters', x: 6, y: 12, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'chart-pipeline', x: 6, y: 18, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'chart-lossReasons', x: 6, y: 24, w: 4, h: 6, minW: 3, minH: 4 },
    { i: 'help', x: 6, y: 30, w: 4, h: 4, minW: 3, minH: 3 },
    { i: 'schedule', x: 0, y: 34, w: 10, h: 12, minW: 5, minH: 8 },
  ],
  sm: [
    { i: 'metric-totalSales', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-winRate', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-closeRate', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgDaysToClose', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-pipelineValue', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openDeals', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-weightedValue', x: 0, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgOpenDealAge', x: 3, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-wonDeals', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-projection', x: 0, y: 20, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'filters', x: 0, y: 28, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-pipeline', x: 0, y: 34, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-lossReasons', x: 0, y: 40, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'help', x: 0, y: 46, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'schedule', x: 0, y: 50, w: 6, h: 12, minW: 3, minH: 8 },
  ],
}

export default function SalesDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    winRate: 0,
    closeRate: 0,
    avgDaysToClose: 0,
    pipelineValue: 0,
    openDeals: 0,
    weightedValue: 0,
    avgOpenDealAge: 0,
  })
  const [loading, setLoading] = useState(true)
  const [wonDealsData, setWonDealsData] = useState<any[]>([])
  const [projectionData, setProjectionData] = useState<any[]>([])
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [lossReasonsData, setLossReasonsData] = useState<any[]>([])
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [scheduleActivities, setScheduleActivities] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [scheduleTab, setScheduleTab] = useState<'meetings' | 'events' | 'holiday'>('meetings')
  const [scheduleSearch, setScheduleSearch] = useState('')
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)

  useEffect(() => {
    // Load saved widgets
    const savedWidgets = localStorage.getItem('sales-widgets')
    if (savedWidgets) {
      try {
        const parsed: Widget[] = JSON.parse(savedWidgets)
        const mergedWidgets = defaultWidgets.map(defaultWidget => {
          const savedWidget = parsed.find(w => w.id === defaultWidget.id)
          return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
        })
        setWidgets(mergedWidgets)
      } catch (e) {
        console.error('Failed to load widget preferences', e)
        setWidgets(defaultWidgets)
      }
    } else {
      setWidgets(defaultWidgets)
    }

    // Load saved layouts
    const savedLayouts = localStorage.getItem('sales-dashboard-layouts')
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts))
      } catch (error) {
        console.error('Error loading saved layouts:', error)
      }
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    setIsInitialMount(false)
    fetchDashboardData()

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem('sales-widgets', JSON.stringify(widgets))
    }
  }, [widgets])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
    )
  }

  useEffect(() => {
    // Mark initial mount as complete after layouts are loaded
    if (isInitialMount) {
      const timer = setTimeout(() => setIsInitialMount(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isInitialMount])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    // Don't save on initial mount to prevent overwriting saved layouts
    if (isInitialMount) {
      return
    }
    setLayouts(allLayouts)
    localStorage.setItem('sales-dashboard-layouts', JSON.stringify(allLayouts))
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const [opportunitiesRes, activitiesRes] = await Promise.all([
        fetch('/api/sales/opportunities'),
        fetch('/api/sales/activities?type=MEETING&status=PLANNED'),
      ])

      const opportunities = await opportunitiesRes.json()

      if (Array.isArray(opportunities)) {
        // Calculate statistics
        const won = opportunities.filter((o: any) => o.status === 'WON')
        const lost = opportunities.filter((o: any) => o.status === 'LOST')
        const open = opportunities.filter((o: any) => o.status === 'OPEN')
        
        const totalSales = won.reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)
        const pipelineValue = open.reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)
        const weightedValue = open.reduce(
          (sum: number, o: any) => sum + (parseFloat(o.amount?.toString() || '0') * (o.probability || 0)) / 100,
          0
        )

        const totalClosed = won.length + lost.length
        const winRate = totalClosed > 0 ? (won.length / totalClosed) * 100 : 0
        const closeRate = opportunities.length > 0 ? (totalClosed / opportunities.length) * 100 : 0

        // Calculate avg days to close
        const closedDates = won
          .filter((o: any) => o.actualCloseDate || o.updatedAt)
          .map((o: any) => {
            const closeDate = new Date(o.actualCloseDate || o.updatedAt)
            const createdDate = new Date(o.createdAt)
            return (closeDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
          })
        const avgDaysToClose = closedDates.length > 0
          ? closedDates.reduce((sum: number, days: number) => sum + days, 0) / closedDates.length
          : 0

        // Calculate avg open deal age
        const openAges = open.map((o: any) => {
          const createdDate = new Date(o.createdAt)
          const now = new Date()
          return (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        })
        const avgOpenDealAge = openAges.length > 0
          ? openAges.reduce((sum: number, age: number) => sum + age, 0) / openAges.length
          : 0

        setStats({
          totalSales,
          winRate,
          closeRate,
          avgDaysToClose,
          pipelineValue,
          openDeals: open.length,
          weightedValue,
          avgOpenDealAge,
        })

        // Generate won deals data (last 12 months)
        const wonDealsChart = generateMonthlyData(won, 12, false)
        setWonDealsData(wonDealsChart)

        // Generate projection data (future 12 months)
        const projectionChart = generateMonthlyData(open, 12, true)
        setProjectionData(projectionChart)

        // Generate pipeline data by stage
        const stages = [
          'PROSPECTING',
          'QUALIFICATION',
          'NEEDS_ANALYSIS',
          'VALUE_PROPOSITION',
          'ID_DECISION_MAKERS',
          'PERCEPTION_ANALYSIS',
          'PROPOSAL_PRICE_QUOTE',
          'NEGOTIATION_REVIEW',
        ]
        const pipelineByStage = stages.map((stage) => {
          const stageOpps = open.filter((o: any) => o.stage === stage)
          return {
            name: stage.replace(/_/g, ' '),
            value: stageOpps.length,
          }
        }).filter((item) => item.value > 0)
        setPipelineData(pipelineByStage)

        // Generate loss reasons data
        const lossReasons = [
          'Feature limitations',
          'Budget constraints',
          'Price too high',
          'Better alternative',
          'Lack of urgency',
        ]
        const lossByReason = lossReasons.map((reason, index) => ({
          name: reason,
          value: Math.floor(lost.length * (0.33 - index * 0.05)), // Simulated distribution
        })).filter((item) => item.value > 0)
        setLossReasonsData(lossByReason)
      }

      // Fetch activities for schedule
      const activities = await activitiesRes.json()
      if (Array.isArray(activities)) {
        setScheduleActivities(activities)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyData = (data: any[], months: number, future: boolean) => {
    const result: any[] = []
    const now = new Date()
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      if (future) {
        date.setMonth(date.getMonth() + (months - i))
      } else {
        date.setMonth(date.getMonth() - i)
      }
      
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      
      let value = 0
      let count = 0
      
      if (future) {
        // For projections, use expected close date
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthOpps = data.filter((o: any) => {
          const closeDate = new Date(o.expectedCloseDate || o.createdAt)
          return closeDate >= monthStart && closeDate <= monthEnd
        })
        
        value = monthOpps.reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)
        count = monthOpps.length
      } else {
        // For past data, use actual close date or updated date
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
        
        const monthOpps = data.filter((o: any) => {
          const closeDate = new Date(o.actualCloseDate || o.updatedAt || o.createdAt)
          return closeDate >= monthStart && closeDate <= monthEnd
        })
        
        value = monthOpps.reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)
        count = monthOpps.length
      }
      
      result.push({
        month: monthKey,
        value: value / 1000, // Convert to K
        count,
      })
    }
    
    return result
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toFixed(1)
  }

  const renderMetricCard = (id: string, title: string, value: string | number, icon: any) => {
    const Icon = icon
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
        </CardContent>
      </Card>
    )
  }

  const renderWidget = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    if (!widget) return null
    
    switch (widgetId) {
      case 'metric-totalSales':
        return renderMetricCard('metric-totalSales', 'Total sales', formatCurrency(stats.totalSales), DollarSign)
      case 'metric-winRate':
        return renderMetricCard('metric-winRate', 'Win rate', `${stats.winRate.toFixed(2)}%`, TrendingUp)
      case 'metric-closeRate':
        return renderMetricCard('metric-closeRate', 'Close rate', `${stats.closeRate.toFixed(2)}%`, Target)
      case 'metric-avgDaysToClose':
        return renderMetricCard('metric-avgDaysToClose', 'Avg days to close', stats.avgDaysToClose.toFixed(2), Calendar)
      case 'metric-pipelineValue':
        return renderMetricCard('metric-pipelineValue', 'Pipeline value', formatCurrency(stats.pipelineValue), Briefcase)
      case 'metric-openDeals':
        return renderMetricCard(
          'metric-openDeals',
          'Open deals',
          stats.openDeals >= 1000 ? `${(stats.openDeals / 1000).toFixed(1)}K` : stats.openDeals,
          Target
        )
      case 'metric-weightedValue':
        return renderMetricCard('metric-weightedValue', 'Weighted value', formatCurrency(stats.weightedValue), TrendingUp)
      case 'metric-avgOpenDealAge':
        return renderMetricCard('metric-avgOpenDealAge', 'Avg open deal age', stats.avgOpenDealAge.toFixed(2), Clock)
      case 'chart-wonDeals':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Won deals (last 12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={wonDealsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    name="Closed value (K)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#82ca9d"
                    name="Won deals"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      case 'chart-projection':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Deals projection (future 12 months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    name="Projected value (K)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    stroke="#82ca9d"
                    name="Deals due"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      case 'filters':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report date</label>
                <div className="text-sm text-muted-foreground">4/1/2024 - 5/7/2025</div>
                <input type="range" className="w-full mt-2" min="0" max="100" defaultValue="100" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deal Owner</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deal Stage</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Pipeline</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Deal Label</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )
      case 'chart-pipeline':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Sales pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      case 'chart-lossReasons':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Deal loss reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={lossReasonsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(2)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {lossReasonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )
      case 'help':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Have questions?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground mb-3">
                Click the AI icon in the bottom-right corner to ask questions about your data
              </p>
              <a href="#" className="text-sm text-blue-600 hover:underline block">
                Dashboard setup guide
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline block">
                Book a demo
              </a>
              <a href="#" className="text-sm text-blue-600 hover:underline block">
                Contact support
              </a>
            </CardContent>
          </Card>
        )
      case 'schedule':
        return renderSchedule()
      default:
        return null
    }
  }

  const renderSchedule = () => {
    const monthYear = selectedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    
    // Get days of the week around selected date
    const getDaysInWeek = () => {
      const days: Date[] = []
      const startOfWeek = new Date(selectedDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day
      const start = new Date(startOfWeek.setDate(diff))
      
      for (let i = 0; i < 5; i++) {
        const date = new Date(start)
        date.setDate(start.getDate() + i)
        days.push(date)
      }
      return days
    }

    const weekDays = getDaysInWeek()
    const selectedDayIndex = weekDays.findIndex(d => 
      d.getDate() === selectedDate.getDate() && 
      d.getMonth() === selectedDate.getMonth()
    )

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }

    const filteredActivities = scheduleActivities.filter(activity => {
      if (scheduleTab === 'meetings' && activity.type !== 'MEETING') return false
      if (scheduleSearch && !activity.subject?.toLowerCase().includes(scheduleSearch.toLowerCase())) return false
      return true
    })

    const getPlatformIcon = (location: string | null) => {
      if (!location) return Video
      const lower = location.toLowerCase()
      if (lower.includes('zoom')) return Video
      if (lower.includes('google') || lower.includes('meet')) return Video
      if (lower.includes('teams')) return Video
      if (lower.includes('phone') || lower.includes('call')) return Phone
      if (lower.includes('slack')) return MessageSquare
      return Video
    }

    const getTagColor = (tag: string) => {
      const colors: Record<string, string> = {
        'MARKETING': 'border-orange-300 text-orange-700 bg-orange-50',
        'PRODUCT MANAGER': 'border-purple-300 text-purple-700 bg-purple-50',
        'PARTNERSHIP': 'border-blue-300 text-blue-700 bg-blue-50',
        'SALES': 'border-green-300 text-green-700 bg-green-50',
      }
      return colors[tag] || 'border-gray-300 text-gray-700 bg-gray-50'
    }

    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              <CardTitle>Schedule</CardTitle>
            </div>
            <Button variant="ghost" size="sm">
              See All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() - 1)
                setSelectedDate(newDate)
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-lg font-semibold">{monthYear}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newDate = new Date(selectedDate)
                newDate.setMonth(newDate.getMonth() + 1)
                setSelectedDate(newDate)
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Day Selector */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {weekDays.map((day, index) => {
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = day.getDate()
              const isSelected = index === selectedDayIndex
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={`flex flex-col items-center justify-center min-w-[60px] p-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <span className="text-xs">{dayName}</span>
                  <span className="text-lg font-semibold">{dayNum}</span>
                </button>
              )
            })}
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setScheduleTab('meetings')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                scheduleTab === 'meetings'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setScheduleTab('events')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                scheduleTab === 'events'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setScheduleTab('holiday')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                scheduleTab === 'holiday'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Holiday
            </button>
          </div>

          {/* Activities List */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {scheduleTab} scheduled
              </div>
            ) : (
              filteredActivities.map((activity) => {
                const PlatformIcon = getPlatformIcon(activity.location)
                const startDate = activity.dueDate ? new Date(activity.dueDate) : new Date()
                const endDate = activity.duration
                  ? new Date(startDate.getTime() + activity.duration * 60000)
                  : new Date(startDate.getTime() + 45 * 60000)
                const timeString = `${formatTime(startDate)} - ${formatTime(endDate)} (UTC)`
                
                return (
                  <div
                    key={activity.id}
                    className="p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow bg-gradient-to-r from-blue-50/50 to-purple-50/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-sm">{activity.subject || 'Meeting'}</h3>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4 rotate-90" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">{timeString}</div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex -space-x-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">+2</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <PlatformIcon className="h-3 w-3" />
                          <span>On {activity.location || 'Video Call'}</span>
                        </div>
                      </div>
                      <Badge className={`ml-2 ${getTagColor('MARKETING')}`}>
                        MARKETING
                      </Badge>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get visible widgets from state
  const visibleWidgets = widgets.filter(w => w.visible)
  const widgetIds = visibleWidgets.map(w => w.id)

  // Empty state component
  const EmptyState = () => {
    const router = useRouter()
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-lg">
          <div className="mb-6">
            <LayoutGrid className="h-20 w-20 mx-auto text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Sales Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Your dashboard is ready to be customized. 
          </p>
          <p className="text-muted-foreground mb-8">
            Click the <strong className="text-foreground">"Widgets"</strong> button in the navigation bar above to add metrics, charts, and tools to your dashboard. Once you've added widgets, they will appear here.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button 
              variant="outline" 
              onClick={() => router.push('/sales-dashboard/leads?create=true')}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Lead
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/sales-dashboard/opportunities?create=true')}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Create Opportunity
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/sales-dashboard/contacts?create=true')}
              className="flex items-center gap-2"
            >
              <UsersIcon className="h-4 w-4" />
              Create Contact
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/sales-dashboard/accounts?create=true')}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Create Account
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SalesPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      {widgetIds.length === 0 ? (
        <EmptyState />
      ) : isMobile ? (
        /* Mobile: Simple Stacked Layout */
        <div className="space-y-4">
          {widgetIds.map((widgetId) => (
            <div key={widgetId} className="w-full">
              {renderWidget(widgetId)}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Draggable Grid Layout */
        <div className="sales-dashboard-grid">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            isDraggable={true}
            isResizable={true}
          >
            {widgetIds.map((widgetId) => (
              <div key={widgetId} className="relative group">
                {/* Drag Handle - appears on hover */}
                <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="h-full overflow-auto">
                  {renderWidget(widgetId)}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}
    </SalesPageLayout>
  )
}

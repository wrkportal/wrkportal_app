'use client'

import { useState, useEffect } from 'react'
import { OperationsPageLayout } from '@/components/operations/operations-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { 
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  FileText,
  Target,
  Shield,
  Package,
  GripVertical,
  AlertCircle,
  Calendar,
  Award,
  Activity,
  ArrowRight,
  AlertTriangle,
  UserCheck,
  GraduationCap,
  Wrench,
  BarChart3
} from 'lucide-react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Link from 'next/link'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'stats', type: 'stats', visible: true },
  { id: 'invoices', type: 'invoices', visible: false },
  { id: 'forecast', type: 'forecast', visible: false },
  { id: 'expenses', type: 'expenses', visible: false },
  { id: 'roadmap', type: 'roadmap', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
  { id: 'blockers', type: 'blockers', visible: false },
  { id: 'teamCapacity', type: 'teamCapacity', visible: false },
  { id: 'recentProjects', type: 'recentProjects', visible: false },
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'assignedToOthers', type: 'assignedToOthers', visible: false },
  { id: 'activeOKRs', type: 'activeOKRs', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'forms', type: 'forms', visible: false },
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
  { id: 'ganttChart', type: 'ganttChart', visible: false },
]

interface DashboardStats {
  // Resources
  totalResources: number
  capacityUtilization: number
  attendanceRate: number
  attritionRate: number
  activeShifts: number
  pendingTrainings: number
  newHires: number
  activeOnboarding: number
  
  // Performance
  avgTAT: number
  backlog: number
  qualityScore: number
  errorRate: number
  leakageRate: number
  
  // Compliance
  complianceRate: number
  pendingTrainingsCompliance: number
  openIssues: number
  identifiedRisks: number
  activeIncidents: number
  
  // Inventory
  totalInventory: number
  lowStockItems: number
  outOfStockItems: number
  itemsInTransit: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#6366f1']

const defaultLayouts: Layouts = {
  lg: [
    // Top Metrics Row 1 - Resources
    { i: 'metric-totalResources', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-capacityUtilization', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attendanceRate', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attritionRate', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    
    // Top Metrics Row 2 - Performance
    { i: 'metric-avgTAT', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-backlog', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-qualityScore', x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-errorRate', x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    
    // Top Metrics Row 3 - Compliance & Inventory
    { i: 'metric-complianceRate', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openIssues', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalInventory', x: 6, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-lowStock', x: 9, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    
    // Charts Row 1
    { i: 'chart-resources', x: 0, y: 9, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'chart-performance', x: 6, y: 9, w: 6, h: 8, minW: 4, minH: 6 },
    
    // Charts Row 2
    { i: 'chart-compliance', x: 0, y: 17, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-inventory', x: 6, y: 17, w: 6, h: 6, minW: 3, minH: 4 },
    
    // Quick Actions & Alerts
    { i: 'quick-actions', x: 0, y: 23, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'recent-activities', x: 6, y: 23, w: 6, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'metric-totalResources', x: 0, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-capacityUtilization', x: 5, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attendanceRate', x: 0, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attritionRate', x: 5, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgTAT', x: 0, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-backlog', x: 5, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-qualityScore', x: 0, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-errorRate', x: 5, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-complianceRate', x: 0, y: 12, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openIssues', x: 5, y: 12, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalInventory', x: 0, y: 15, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-lowStock', x: 5, y: 15, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'chart-resources', x: 0, y: 18, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-performance', x: 6, y: 18, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'chart-compliance', x: 0, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'chart-inventory', x: 5, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'quick-actions', x: 0, y: 32, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'recent-activities', x: 5, y: 32, w: 5, h: 6, minW: 3, minH: 4 },
  ],
  sm: [
    { i: 'metric-totalResources', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-capacityUtilization', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attendanceRate', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-attritionRate', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgTAT', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-backlog', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-qualityScore', x: 0, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-errorRate', x: 3, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-complianceRate', x: 0, y: 12, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openIssues', x: 3, y: 12, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalInventory', x: 0, y: 15, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-lowStock', x: 3, y: 15, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-resources', x: 0, y: 18, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-performance', x: 0, y: 26, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-compliance', x: 0, y: 34, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-inventory', x: 0, y: 40, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'quick-actions', x: 0, y: 46, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'recent-activities', x: 0, y: 52, w: 6, h: 6, minW: 3, minH: 4 },
  ],
}

export default function OperationsDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalResources: 0,
    capacityUtilization: 0,
    attendanceRate: 0,
    attritionRate: 0,
    activeShifts: 0,
    pendingTrainings: 0,
    newHires: 0,
    activeOnboarding: 0,
    avgTAT: 0,
    backlog: 0,
    qualityScore: 0,
    errorRate: 0,
    leakageRate: 0,
    complianceRate: 0,
    pendingTrainingsCompliance: 0,
    openIssues: 0,
    identifiedRisks: 0,
    activeIncidents: 0,
    totalInventory: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    itemsInTransit: 0,
  })
  const [loading, setLoading] = useState(true)
  const [resourcesData, setResourcesData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any[]>([])
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)

  useEffect(() => {
    fetchDashboardData()
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved widgets
      const savedWidgets = localStorage.getItem('operations-widgets')
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

      const savedLayouts = localStorage.getItem('operations-dashboard-layouts')
      if (savedLayouts) {
        try {
          const parsed = JSON.parse(savedLayouts)
          // Validate that parsed layouts have the expected structure
          if (parsed && (parsed.lg || parsed.md || parsed.sm)) {
            setLayouts(parsed)
          } else {
            setLayouts(defaultLayouts)
          }
        } catch (error) {
          console.error('Error loading layouts:', error)
          setLayouts(defaultLayouts)
        }
      } else {
        setLayouts(defaultLayouts)
      }
      setIsInitialMount(false)
    }
  }, [])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (widgets.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('operations-widgets', JSON.stringify(widgets))
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
    if (!isInitialMount && typeof window !== 'undefined') {
      localStorage.setItem('operations-dashboard-layouts', JSON.stringify(layouts))
    }
  }, [layouts, isInitialMount])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with API calls
      setStats({
        totalResources: 275,
        capacityUtilization: 82.5,
        attendanceRate: 92.0,
        attritionRate: 2.5,
        activeShifts: 3,
        pendingTrainings: 10,
        newHires: 3,
        activeOnboarding: 2,
        avgTAT: 2.5,
        backlog: 45,
        qualityScore: 86.0,
        errorRate: 0.8,
        leakageRate: 1.2,
        complianceRate: 95.2,
        pendingTrainingsCompliance: 10,
        openIssues: 8,
        identifiedRisks: 15,
        activeIncidents: 2,
        totalInventory: 710,
        lowStockItems: 25,
        outOfStockItems: 5,
        itemsInTransit: 12,
      })

      setResourcesData([
        { month: 'Jan', Capacity: 78, Attendance: 90, Attrition: 3.2 },
        { month: 'Feb', Capacity: 80, Attendance: 91, Attrition: 2.8 },
        { month: 'Mar', Capacity: 81, Attendance: 91.5, Attrition: 2.6 },
        { month: 'Apr', Capacity: 82.5, Attendance: 92, Attrition: 2.5 },
      ])

      setPerformanceData([
        { month: 'Jan', TAT: 3.2, Backlog: 52, Quality: 85, Errors: 1.2 },
        { month: 'Feb', TAT: 2.8, Backlog: 48, Quality: 87, Errors: 1.0 },
        { month: 'Mar', TAT: 2.6, Backlog: 45, Quality: 88, Errors: 0.9 },
        { month: 'Apr', TAT: 2.5, Backlog: 45, Quality: 88, Errors: 0.8 },
      ])

      setComplianceData([
        { month: 'Jan', Completed: 45, Pending: 12, Overdue: 3 },
        { month: 'Feb', Completed: 52, Pending: 8, Overdue: 2 },
        { month: 'Mar', Completed: 48, Pending: 15, Overdue: 5 },
        { month: 'Apr', Completed: 55, Pending: 10, Overdue: 4 },
      ])

      setInventoryData([
        { category: 'Supplies', value: 545, percentage: 77 },
        { category: 'Equipment', value: 25, percentage: 4 },
        { category: 'Safety', value: 150, percentage: 21 },
        { category: 'Tools', value: 80, percentage: 11 },
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onLayoutChange = (layout: Layout[], layouts: Layouts) => {
    setLayouts(layouts)
  }

  const recentActivities = [
    { id: '1', type: 'DISTRIBUTION', description: 'IT Equipment distributed to Storage Room B', time: '2 hours ago', status: 'COMPLETED' },
    { id: '2', type: 'TRAINING', description: 'Safety Protocols training completed by 15 employees', time: '4 hours ago', status: 'COMPLETED' },
    { id: '3', type: 'INCIDENT', description: 'New incident reported: Unauthorized access attempt', time: '6 hours ago', status: 'OPEN' },
    { id: '4', type: 'PERFORMANCE', description: 'Quality score improved to 88%', time: '1 day ago', status: 'SUCCESS' },
    { id: '5', type: 'INVENTORY', description: 'Low stock alert: Office Supplies - Paper', time: '1 day ago', status: 'WARNING' },
  ]

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      // Resource Metrics
      case 'metric-totalResources':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalResources}</div>
              <p className="text-xs text-muted-foreground">Total employees</p>
            </CardContent>
          </Card>
        )

      case 'metric-capacityUtilization':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.capacityUtilization}%</div>
              <p className="text-xs text-muted-foreground">Average utilization</p>
            </CardContent>
          </Card>
        )

      case 'metric-attendanceRate':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">Current attendance</p>
            </CardContent>
          </Card>
        )

      case 'metric-attritionRate':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attrition Rate</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attritionRate}%</div>
              <p className="text-xs text-muted-foreground">Monthly attrition</p>
            </CardContent>
          </Card>
        )

      // Performance Metrics
      case 'metric-avgTAT':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg TAT</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTAT}h</div>
              <p className="text-xs text-muted-foreground">Turnaround time</p>
            </CardContent>
          </Card>
        )

      case 'metric-backlog':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backlog</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.backlog}</div>
              <p className="text-xs text-muted-foreground">Pending items</p>
            </CardContent>
          </Card>
        )

      case 'metric-qualityScore':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qualityScore}%</div>
              <p className="text-xs text-muted-foreground">Overall quality</p>
            </CardContent>
          </Card>
        )

      case 'metric-errorRate':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.errorRate}%</div>
              <p className="text-xs text-muted-foreground">Target: 0.5%</p>
            </CardContent>
          </Card>
        )

      // Compliance Metrics
      case 'metric-complianceRate':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.complianceRate}%</div>
              <p className="text-xs text-muted-foreground">Training compliance</p>
            </CardContent>
          </Card>
        )

      case 'metric-openIssues':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openIssues}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>
        )

      // Inventory Metrics
      case 'metric-totalInventory':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInventory}</div>
              <p className="text-xs text-muted-foreground">Inventory items</p>
            </CardContent>
          </Card>
        )

      case 'metric-lowStock':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Requires reorder</p>
            </CardContent>
          </Card>
        )

      // Charts
      case 'chart-resources':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resources Trends</CardTitle>
                <Link href="/operations-dashboard/resources">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={resourcesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Capacity" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Capacity %" />
                  <Area type="monotone" dataKey="Attendance" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Attendance %" />
                  <Line type="monotone" dataKey="Attrition" stroke="#ef4444" strokeWidth={2} name="Attrition %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-performance':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Metrics</CardTitle>
                <Link href="/operations-dashboard/performance">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="TAT" stroke="#3b82f6" strokeWidth={2} name="TAT (hours)" />
                  <Line yAxisId="left" type="monotone" dataKey="Backlog" stroke="#f59e0b" strokeWidth={2} name="Backlog" />
                  <Line yAxisId="right" type="monotone" dataKey="Quality" stroke="#10b981" strokeWidth={2} name="Quality %" />
                  <Line yAxisId="right" type="monotone" dataKey="Errors" stroke="#ef4444" strokeWidth={2} name="Error Rate %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-compliance':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Compliance Status</CardTitle>
                <Link href="/operations-dashboard/compliance">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="Pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="Overdue" fill="#ef4444" name="Overdue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-inventory':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inventory by Category</CardTitle>
                <Link href="/operations-dashboard/inventory">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {inventoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      // Quick Actions
      case 'quick-actions':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common operations and tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/operations-dashboard/resources?tab=capacity">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Users className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Capacity</div>
                      <div className="text-xs text-muted-foreground">Manage resources</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/operations-dashboard/resources?tab=attendance">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Calendar className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Attendance</div>
                      <div className="text-xs text-muted-foreground">Track attendance</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/operations-dashboard/performance?tab=kpis">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">KPIs</div>
                      <div className="text-xs text-muted-foreground">View metrics</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/operations-dashboard/compliance?tab=incidents">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Incidents</div>
                      <div className="text-xs text-muted-foreground">Report incident</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/operations-dashboard/inventory?tab=distribution">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Package className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Distribute</div>
                      <div className="text-xs text-muted-foreground">Move inventory</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/operations-dashboard/resources?tab=trainings">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Trainings</div>
                      <div className="text-xs text-muted-foreground">Assign training</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )

      // Recent Activities
      case 'recent-activities':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest operations updates</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${
                      activity.type === 'DISTRIBUTION' ? 'bg-blue-100 dark:bg-blue-900/30' :
                      activity.type === 'TRAINING' ? 'bg-purple-100 dark:bg-purple-900/30' :
                      activity.type === 'INCIDENT' ? 'bg-red-100 dark:bg-red-900/30' :
                      activity.type === 'PERFORMANCE' ? 'bg-green-100 dark:bg-green-900/30' :
                      'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {activity.type === 'DISTRIBUTION' ? <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" /> :
                       activity.type === 'TRAINING' ? <GraduationCap className="h-4 w-4 text-purple-600 dark:text-purple-400" /> :
                       activity.type === 'INCIDENT' ? <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" /> :
                       activity.type === 'PERFORMANCE' ? <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" /> :
                       <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={activity.status === 'COMPLETED' || activity.status === 'SUCCESS' ? 'default' : activity.status === 'WARNING' ? 'secondary' : 'destructive'} className="text-xs">
                          {activity.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const widgetIds = [
    'metric-totalResources',
    'metric-capacityUtilization',
    'metric-attendanceRate',
    'metric-attritionRate',
    'metric-avgTAT',
    'metric-backlog',
    'metric-qualityScore',
    'metric-errorRate',
    'metric-complianceRate',
    'metric-openIssues',
    'metric-totalInventory',
    'metric-lowStock',
    'chart-resources',
    'chart-performance',
    'chart-compliance',
    'chart-inventory',
    'quick-actions',
    'recent-activities',
  ]

  if (loading) {
    return (
      <OperationsPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </OperationsPageLayout>
    )
  }

  return (
    <OperationsPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      {isMobile ? (
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
        <div className="operations-dashboard-grid w-full">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={onLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={80}
            draggableHandle=".drag-handle"
            isDraggable={true}
            isResizable={true}
          >
            {widgetIds.map((widgetId) => (
              <div key={widgetId} className="relative group">
                {/* Drag Handle - appears on hover */}
                <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-blue-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-blue-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
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
    </OperationsPageLayout>
  )
}

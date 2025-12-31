'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Shield,
  Server,
  Monitor,
  GripVertical,
  AlertCircle,
  AlertTriangle,
  Ticket,
  HardDrive,
  Network,
  Lock,
  FolderKanban,
  Book,
  Key,
  Activity,
  ArrowRight,
  Wifi,
  Database,
  Cloud
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
  // Tickets
  openTickets: number
  resolvedToday: number
  avgResponseTime: number
  avgResolutionTime: number
  
  // Assets
  totalAssets: number
  availableAssets: number
  inUseAssets: number
  pendingMaintenance: number
  
  // Users
  totalUsers: number
  activeUsers: number
  pendingAccess: number
  
  // Networks
  networkUptime: number
  activeDevices: number
  bandwidthUsage: number
  
  // Security
  securityAlerts: number
  vulnerabilities: number
  blockedThreats: number
  
  // Projects
  activeProjects: number
  completedProjects: number
  
  // Licenses
  totalLicenses: number
  expiringSoon: number
  
  // Monitoring
  systemHealth: number
  serverUtilization: number
}

const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1']

const defaultLayouts: Layouts = {
  lg: [
    // Top Metrics Row 1 - Tickets & Assets
    { i: 'metric-openTickets', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-resolvedToday', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgResponseTime', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalAssets', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    
    // Top Metrics Row 2 - Users & Networks
    { i: 'metric-totalUsers', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-networkUptime', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-securityAlerts', x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-systemHealth', x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    
    // Charts Row 1
    { i: 'chart-tickets', x: 0, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'chart-assets', x: 6, y: 6, w: 6, h: 8, minW: 4, minH: 6 },
    
    // Charts Row 2
    { i: 'chart-security', x: 0, y: 14, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-network', x: 6, y: 14, w: 6, h: 6, minW: 3, minH: 4 },
    
    // Quick Actions & Recent Activities
    { i: 'quick-actions', x: 0, y: 20, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'recent-tickets', x: 6, y: 20, w: 6, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'metric-openTickets', x: 0, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-resolvedToday', x: 5, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgResponseTime', x: 0, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalAssets', x: 5, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalUsers', x: 0, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-networkUptime', x: 5, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-securityAlerts', x: 0, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-systemHealth', x: 5, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'chart-tickets', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-assets', x: 6, y: 12, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'chart-security', x: 0, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'chart-network', x: 5, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'quick-actions', x: 0, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'recent-tickets', x: 5, y: 26, w: 5, h: 6, minW: 3, minH: 4 },
  ],
  sm: [
    { i: 'metric-openTickets', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-resolvedToday', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgResponseTime', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalAssets', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-totalUsers', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-networkUptime', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-securityAlerts', x: 0, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-systemHealth', x: 3, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-tickets', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-assets', x: 0, y: 20, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-security', x: 0, y: 28, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-network', x: 0, y: 34, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'quick-actions', x: 0, y: 40, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'recent-tickets', x: 0, y: 46, w: 6, h: 6, minW: 3, minH: 4 },
  ],
}

export default function ITDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    openTickets: 0,
    resolvedToday: 0,
    avgResponseTime: 0,
    avgResolutionTime: 0,
    totalAssets: 0,
    availableAssets: 0,
    inUseAssets: 0,
    pendingMaintenance: 0,
    totalUsers: 0,
    activeUsers: 0,
    pendingAccess: 0,
    networkUptime: 0,
    activeDevices: 0,
    bandwidthUsage: 0,
    securityAlerts: 0,
    vulnerabilities: 0,
    blockedThreats: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalLicenses: 0,
    expiringSoon: 0,
    systemHealth: 0,
    serverUtilization: 0,
  })
  const [loading, setLoading] = useState(true)
  const [ticketsData, setTicketsData] = useState<any[]>([])
  const [assetsData, setAssetsData] = useState<any[]>([])
  const [securityData, setSecurityData] = useState<any[]>([])
  const [networkData, setNetworkData] = useState<any[]>([])
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
      const savedWidgets = localStorage.getItem('it-widgets')
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

      const savedLayouts = localStorage.getItem('it-dashboard-layouts')
      if (savedLayouts) {
        try {
          const parsed = JSON.parse(savedLayouts)
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
      localStorage.setItem('it-widgets', JSON.stringify(widgets))
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
      localStorage.setItem('it-dashboard-layouts', JSON.stringify(layouts))
    }
  }, [layouts, isInitialMount])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data - replace with API calls
      setStats({
        openTickets: 42,
        resolvedToday: 28,
        avgResponseTime: 15,
        avgResolutionTime: 120,
        totalAssets: 450,
        availableAssets: 125,
        inUseAssets: 298,
        pendingMaintenance: 27,
        totalUsers: 520,
        activeUsers: 485,
        pendingAccess: 12,
        networkUptime: 99.8,
        activeDevices: 342,
        bandwidthUsage: 68,
        securityAlerts: 5,
        vulnerabilities: 8,
        blockedThreats: 142,
        activeProjects: 6,
        completedProjects: 24,
        totalLicenses: 180,
        expiringSoon: 15,
        systemHealth: 98,
        serverUtilization: 72,
      })

      setTicketsData([
        { month: 'Jan', Open: 45, Resolved: 320, InProgress: 25 },
        { month: 'Feb', Open: 42, Resolved: 335, InProgress: 28 },
        { month: 'Mar', Open: 38, Resolved: 348, InProgress: 22 },
        { month: 'Apr', Open: 42, Resolved: 340, InProgress: 30 },
      ])

      setAssetsData([
        { category: 'Laptops', value: 150, percentage: 33 },
        { category: 'Desktops', value: 120, percentage: 27 },
        { category: 'Servers', value: 45, percentage: 10 },
        { category: 'Network Devices', value: 85, percentage: 19 },
        { category: 'Other', value: 50, percentage: 11 },
      ])

      setSecurityData([
        { month: 'Jan', Alerts: 12, Threats: 125, Incidents: 2 },
        { month: 'Feb', Alerts: 8, Threats: 142, Incidents: 1 },
        { month: 'Mar', Alerts: 6, Threats: 138, Incidents: 0 },
        { month: 'Apr', Alerts: 5, Threats: 142, Incidents: 1 },
      ])

      setNetworkData([
        { time: '00:00', Usage: 45, Uptime: 100 },
        { time: '06:00', Usage: 52, Uptime: 100 },
        { time: '12:00', Usage: 68, Uptime: 99.9 },
        { time: '18:00', Usage: 65, Uptime: 99.8 },
        { time: '24:00', Usage: 48, Uptime: 99.8 },
      ])
    } catch (error) {
      console.error('Error fetching IT dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onLayoutChange = (layout: Layout[], layouts: Layouts) => {
    setLayouts(layouts)
  }

  const recentTickets = [
    { id: '1', title: 'Printer not working in Finance', priority: 'HIGH', status: 'OPEN', assignee: 'John Doe', created: '2 hours ago' },
    { id: '2', title: 'Email access issue', priority: 'MEDIUM', status: 'IN_PROGRESS', assignee: 'Jane Smith', created: '4 hours ago' },
    { id: '3', title: 'Software installation request', priority: 'LOW', status: 'RESOLVED', assignee: 'Bob Wilson', created: '1 day ago' },
    { id: '4', title: 'Network connectivity problem', priority: 'HIGH', status: 'OPEN', assignee: 'Unassigned', created: '1 day ago' },
    { id: '5', title: 'Password reset request', priority: 'LOW', status: 'RESOLVED', assignee: 'Alice Brown', created: '2 days ago' },
  ]

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      // Ticket Metrics
      case 'metric-openTickets':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
              <p className="text-xs text-muted-foreground">Requiring attention</p>
            </CardContent>
          </Card>
        )

      case 'metric-resolvedToday':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolvedToday}</div>
              <p className="text-xs text-muted-foreground">Tickets resolved</p>
            </CardContent>
          </Card>
        )

      case 'metric-avgResponseTime':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResponseTime}m</div>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </CardContent>
          </Card>
        )

      // Asset Metrics
      case 'metric-totalAssets':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAssets}</div>
              <p className="text-xs text-muted-foreground">IT assets</p>
            </CardContent>
          </Card>
        )

      // User Metrics
      case 'metric-totalUsers':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">{stats.activeUsers} active</p>
            </CardContent>
          </Card>
        )

      // Network Metrics
      case 'metric-networkUptime':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Uptime</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.networkUptime}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        )

      // Security Metrics
      case 'metric-securityAlerts':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.securityAlerts}</div>
              <p className="text-xs text-muted-foreground">Active alerts</p>
            </CardContent>
          </Card>
        )

      // System Health
      case 'metric-systemHealth':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.systemHealth}%</div>
              <p className="text-xs text-muted-foreground">Overall health</p>
            </CardContent>
          </Card>
        )

      // Charts
      case 'chart-tickets':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ticket Trends</CardTitle>
                <Link href="/it-dashboard/tickets">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ticketsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Open" stackId="1" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} name="Open" />
                  <Area type="monotone" dataKey="Resolved" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Resolved" />
                  <Area type="monotone" dataKey="InProgress" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="In Progress" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-assets':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assets by Category</CardTitle>
                <Link href="/it-dashboard/assets">
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
                    data={assetsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-security':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Security Overview</CardTitle>
                <Link href="/it-dashboard/security">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={securityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Alerts" fill="#ef4444" name="Alerts" />
                  <Bar dataKey="Threats" fill="#f59e0b" name="Blocked Threats" />
                  <Bar dataKey="Incidents" fill="#9333ea" name="Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-network':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Network Performance</CardTitle>
                <Link href="/it-dashboard/networks">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={networkData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="Usage" stroke="#9333ea" strokeWidth={2} name="Bandwidth %" />
                  <Line yAxisId="right" type="monotone" dataKey="Uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
                </LineChart>
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
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="grid grid-cols-2 gap-3">
                <Link href="/it-dashboard/tickets?action=create">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Ticket className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Create Ticket</div>
                      <div className="text-xs text-muted-foreground">New support request</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/it-dashboard/assets?action=add">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <HardDrive className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Add Asset</div>
                      <div className="text-xs text-muted-foreground">Register new asset</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/it-dashboard/users?action=add">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Users className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Add User</div>
                      <div className="text-xs text-muted-foreground">Create account</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/it-dashboard/security">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Shield className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Security</div>
                      <div className="text-xs text-muted-foreground">View alerts</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/it-dashboard/networks">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Network className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Networks</div>
                      <div className="text-xs text-muted-foreground">Monitor status</div>
                    </div>
                  </Button>
                </Link>
                <Link href="/it-dashboard/monitoring">
                  <Button variant="outline" className="w-full justify-start h-auto py-3">
                    <Activity className="mr-2 h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Monitoring</div>
                      <div className="text-xs text-muted-foreground">System status</div>
                    </div>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )

      // Recent Tickets
      case 'recent-tickets':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Tickets</CardTitle>
                <Link href="/it-dashboard/tickets">
                  <Button variant="ghost" size="sm">
                    View All <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`p-2 rounded-full ${
                      ticket.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30' :
                      ticket.priority === 'MEDIUM' ? 'bg-orange-100 dark:bg-orange-900/30' :
                      'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Ticket className={`h-4 w-4 ${
                        ticket.priority === 'HIGH' ? 'text-red-600 dark:text-red-400' :
                        ticket.priority === 'MEDIUM' ? 'text-orange-600 dark:text-orange-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{ticket.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={ticket.status === 'RESOLVED' ? 'default' : ticket.status === 'IN_PROGRESS' ? 'default' : 'destructive'} className="text-xs">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{ticket.created}</span>
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
    'metric-openTickets',
    'metric-resolvedToday',
    'metric-avgResponseTime',
    'metric-totalAssets',
    'metric-totalUsers',
    'metric-networkUptime',
    'metric-securityAlerts',
    'metric-systemHealth',
    'chart-tickets',
    'chart-assets',
    'chart-security',
    'chart-network',
    'quick-actions',
    'recent-tickets',
  ]

  if (loading) {
    return (
      <ITPageLayout widgets={widgets} toggleWidget={toggleWidget}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </ITPageLayout>
    )
  }

  return (
    <ITPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      {isMobile ? (
        <div className="space-y-4">
          {widgetIds.map((widgetId) => (
            <div key={widgetId} className="w-full">
              {renderWidget(widgetId)}
            </div>
          ))}
        </div>
      ) : (
        <div className="it-dashboard-grid w-full">
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
                <div className="drag-handle absolute top-2 right-2 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
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
    </ITPageLayout>
  )
}

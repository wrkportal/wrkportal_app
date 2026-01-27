'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
  CheckCircle2,
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
  Cloud,
  LayoutGrid,
  List,
  Calendar,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize,
  Minimize,
  Play,
  Pause,
  X,
  History,
  Trash2,
} from 'lucide-react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { format, addDays, isToday } from 'date-fns'
import { TaskDialog } from '@/components/dialogs/task-dialog'
import { TaskDetailDialog } from '@/components/dialogs/task-detail-dialog'
import { TimeTrackingDialog } from '@/components/dialogs/time-tracking-dialog'
import { TimerNotesDialog } from '@/components/dialogs/timer-notes-dialog'
import { AdvancedMindMapWidget } from '@/components/widgets/AdvancedMindMapWidget'
import { AdvancedCanvasWidget } from '@/components/widgets/AdvancedCanvasWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  // Analytics Widgets
  { id: 'metrics', type: 'metrics', visible: true },
  // General Widgets
  { id: 'myTasks', type: 'myTasks', visible: true },
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'schedule', type: 'schedule', visible: false },
  { id: 'filters', type: 'filters', visible: false },
  { id: 'help', type: 'help', visible: false },
  // Mind Map & Canvas
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
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

const initializeDefaultLayout = (): Layouts => {
  const defaultLayout: Layout[] = [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
  ]
  return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
}

const defaultLayouts: Layouts = initializeDefaultLayout()

export default function ITDashboardPage() {
  const user = useAuthStore((state) => state.user)
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
  const [loading, setLoading] = useState(false)
  const [ticketsData, setTicketsData] = useState<any[]>([])
  const [assetsData, setAssetsData] = useState<any[]>([])
  const [securityData, setSecurityData] = useState<any[]>([])
  const [networkData, setNetworkData] = useState<any[]>([])
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)
  const router = useRouter()
  const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  // My Tasks widget state
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  // Initialize with default value to avoid hydration mismatch
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar' | 'kanban' | 'gantt'>('gantt')
  // Initialize with null to avoid hydration mismatch, set in useEffect
  const [calendarDate, setCalendarDate] = useState<Date | null>(null)

  // Kanban drag and drop state
  const dragRef = useRef<{
    taskId: string
    startX: number
    startY: number
    pointerId: number
    element: HTMLElement | null
    offsetX: number
    offsetY: number
  } | null>(null)
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null)
  const draggingTaskIdRef = useRef<string | null>(null)
  const dragOverColumnIdRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastColumnCheckRef = useRef<string | null>(null)

  // Gantt chart state
  const [ganttGroups, setGanttGroups] = useState<Array<{ id: string; name: string; expanded: boolean; tasks: any[] }>>([])
  // Initialize with null to avoid hydration mismatch, set in useEffect
  const [ganttTimelineStart, setGanttTimelineStart] = useState<Date | null>(null)
  const [ganttViewMode, setGanttViewMode] = useState<'days' | 'weeks' | 'months'>('days')
  const [isAddingGanttGroup, setIsAddingGanttGroup] = useState(false)
  const [newGanttGroupName, setNewGanttGroupName] = useState('')
  const [addingTaskToGroup, setAddingTaskToGroup] = useState<string | null>(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set())
  const [hoveredConnector, setHoveredConnector] = useState<number | null>(null)
  const [connectorMousePos, setConnectorMousePos] = useState<{ x: number; y: number } | null>(null)
  const [ganttGroupsLoaded, setGanttGroupsLoaded] = useState(false)

  // Task color customization state
  const [taskColors, setTaskColors] = useState<Record<string, string>>({})

  // Task dialogs and timer state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [timeTrackingDialogOpen, setTimeTrackingDialogOpen] = useState(false)
  const [timeTrackingTaskId, setTimeTrackingTaskId] = useState<string | undefined>(undefined)
  const [activeTimer, setActiveTimer] = useState<any>(null)
  const [timerSeconds, setTimerSeconds] = useState<{ [key: string]: number }>({})
  const [timerNotesDialogOpen, setTimerNotesDialogOpen] = useState(false)
  const [pendingTimerTask, setPendingTimerTask] = useState<{ id: string; title: string } | null>(null)

  useEffect(() => {
    fetchDashboardData()

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize dates after hydration to avoid hydration mismatch
  const datesInitializedRef = useRef(false)
  useEffect(() => {
    if (!datesInitializedRef.current) {
      setCalendarDate(new Date())
      setGanttTimelineStart(new Date())
      datesInitializedRef.current = true
    }
  }, [])

  // Load taskViewMode from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('task-view-mode')
        if (saved && ['list', 'calendar', 'kanban', 'gantt'].includes(saved)) {
          setTaskViewMode(saved as 'list' | 'calendar' | 'kanban' | 'gantt')
        } else {
          // Default to 'gantt' for new users
          setTaskViewMode('gantt')
          localStorage.setItem('task-view-mode', 'gantt')
        }
      } catch (error) {
        console.error('Error loading task view mode from localStorage:', error)
      }
    }
  }, [])

  // Load task colors from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('it-task-colors')
        if (saved) {
          setTaskColors(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading task colors from localStorage:', error)
      }
    }
  }, [])

  // Save taskViewMode to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('task-view-mode', taskViewMode)
    } catch (error) {
      console.error('Error saving task view mode to localStorage:', error)
    }
  }, [taskViewMode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load saved widgets
      const savedWidgets = localStorage.getItem('it-widgets')
      if (savedWidgets) {
        try {
          const parsed: Widget[] = JSON.parse(savedWidgets)
          // Check if parsed widgets are valid and have the same structure
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            // Migration: If all widgets are visible (old default), reset to invisible for welcome message
            const allVisible = parsed.every(w => w.visible === true)
            if (allVisible) {
              console.log('🔄 Migrating IT dashboard: Resetting widgets for welcome message')
              const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
              setWidgets(firstLoginWidgets)
              setWidgetsLoaded(true)
              localStorage.setItem('it-widgets', JSON.stringify(firstLoginWidgets))
              return
            }
            // Use saved widgets as-is if they match default widget IDs, otherwise merge
            const savedWidgetIds = new Set(parsed.map(w => w.id))
            const defaultWidgetIds = new Set(defaultWidgets.map(w => w.id))
            
            // If saved widgets have all default IDs, use them directly (they're already saved)
            if (savedWidgetIds.size === defaultWidgetIds.size && 
                Array.from(savedWidgetIds).every(id => defaultWidgetIds.has(id))) {
              // All saved widget IDs match defaults, use saved preferences directly
              setWidgets(parsed)
              setWidgetsLoaded(true)
              return
            }
            
            // Otherwise, merge saved with defaults
            const mergedWidgets = defaultWidgets.map(defaultWidget => {
              const savedWidget = parsed.find(w => w.id === defaultWidget.id)
              // If we have a saved widget, use its visibility preference, otherwise default to invisible
              if (savedWidget) {
                return { ...defaultWidget, visible: savedWidget.visible }
              }
              // If no saved widget found, default to invisible (not visible)
              return { ...defaultWidget, visible: false }
            })
            setWidgets(mergedWidgets)
            setWidgetsLoaded(true)
            // Save merged widgets back to ensure all widgets are in localStorage
            localStorage.setItem('it-widgets', JSON.stringify(mergedWidgets))
          } else {
            // Invalid saved data, reset to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('it-widgets', JSON.stringify(firstLoginWidgets))
          }
        } catch (e) {
          console.error('Failed to load widget preferences', e)
          // On error, also set all widgets to invisible for first login
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          setWidgetsLoaded(true)
        }
      } else {
        // First login: set all widgets to invisible
        const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
        setWidgets(firstLoginWidgets)
        setWidgetsLoaded(true)
        localStorage.setItem('it-widgets', JSON.stringify(firstLoginWidgets))
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

  // Save widgets to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (widgetsLoaded && widgets.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('it-widgets', JSON.stringify(widgets))
    }
  }, [widgets, widgetsLoaded])

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
      // Save to localStorage immediately
      localStorage.setItem('it-widgets', JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }, [])

  useEffect(() => {
    if (!isInitialMount && typeof window !== 'undefined') {
      localStorage.setItem('it-dashboard-layouts', JSON.stringify(layouts))
    }
  }, [layouts, isInitialMount])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    const sanitizedLayouts: Layouts = {
      lg: (allLayouts.lg || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      md: (allLayouts.md || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      sm: (allLayouts.sm || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      xs: (allLayouts.xs || []).filter((item): item is Layout => item && typeof item.y === 'number'),
    }
    setLayouts(sanitizedLayouts)
    try {
      localStorage.setItem('it-dashboard-layouts', JSON.stringify(sanitizedLayouts))
    } catch (error) {
      console.error('Error saving layout:', error)
    }
  }

  const toggleFullscreen = (widgetId: string) => {
    if (fullscreenWidget === widgetId) {
      setFullscreenWidget(null)
    } else {
      setFullscreenWidget(widgetId)
    }
  }

  const isWidgetVisible = (widgetId: string) => {
    return widgets.find(w => w.id === widgetId)?.visible ?? false
  }

  // Helper component to wrap cards in grid items
  const GridCard = ({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) => {
    const isFullscreen = fullscreenWidget === id
    return (
      <div
        className={`relative group h-full ${className}`}
        style={isFullscreen ? {
          visibility: 'hidden',
          pointerEvents: 'none'
        } : undefined}
      >
        {!isFullscreen && (
          <div className="drag-handle absolute top-2 right-[3.5rem] z-20 cursor-move opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex items-center gap-0.5 p-1 rounded-md bg-background/95 backdrop-blur-md border border-border/60 hover:border-border hover:bg-background transition-all">
              <div className="flex flex-col gap-0.5">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                </div>
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                  <div className="w-0.5 h-0.5 rounded-full bg-muted-foreground/40"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        {children}
      </div>
    )
  }

  const fetchDashboardData = async () => {
    try {
      // Don't set loading to true - fetch in background for instant load

      // Fetch dashboard stats
      const statsResponse = await fetch('/api/it/dashboard/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          openTickets: statsData.openTickets || 0,
          resolvedToday: statsData.resolvedToday || 0,
          avgResponseTime: statsData.avgResponseTime || 0,
          avgResolutionTime: statsData.avgResolutionTime || 0,
          totalAssets: statsData.totalAssets || 0,
          availableAssets: statsData.availableAssets || 0,
          inUseAssets: statsData.inUseAssets || 0,
          pendingMaintenance: statsData.pendingMaintenance || 0,
          totalUsers: statsData.totalUsers || 0,
          activeUsers: statsData.activeUsers || 0,
          pendingAccess: statsData.pendingAccess || 0,
          networkUptime: statsData.networkUptime || 0,
          activeDevices: statsData.activeDevices || 0,
          bandwidthUsage: statsData.bandwidthUsage || 0,
          securityAlerts: statsData.securityAlerts || 0,
          vulnerabilities: statsData.vulnerabilities || 0,
          blockedThreats: statsData.blockedThreats || 0,
          activeProjects: statsData.activeProjects || 0,
          completedProjects: statsData.completedProjects || 0,
          totalLicenses: statsData.totalLicenses || 0,
          expiringSoon: statsData.expiringSoon || 0,
          systemHealth: statsData.systemHealth || 0,
          serverUtilization: statsData.serverUtilization || 0,
        })
      }

      // Fetch trends data
      const trendsResponse = await fetch('/api/it/dashboard/trends?type=all&months=4')
      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json()
        if (trendsData.tickets) {
          setTicketsData(trendsData.tickets)
        }
        if (trendsData.assets) {
          setAssetsData(trendsData.assets)
        }
        if (trendsData.security) {
          setSecurityData(trendsData.security)
        }
        if (trendsData.network) {
          setNetworkData(trendsData.network)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onLayoutChange = (layout: Layout[], layouts: Layouts) => {
    setLayouts(layouts)
    // Save to localStorage immediately to persist across navigation
    if (typeof window !== 'undefined' && !isInitialMount) {
      try {
        localStorage.setItem('it-dashboard-layouts', JSON.stringify(layouts))
      } catch (error) {
        console.error('Error saving layouts to localStorage:', error)
      }
    }
  }

  const [recentTickets, setRecentTickets] = useState<any[]>([])

  useEffect(() => {
    const fetchRecentTickets = async () => {
      try {
        const response = await fetch('/api/it/dashboard/activities?limit=5')
        if (response.ok) {
          const data = await response.json()
          setRecentTickets(data.tickets || [])
        }
      } catch (error) {
        console.error('Error fetching recent tickets:', error)
        setRecentTickets([])
      }
    }
    fetchRecentTickets()
  }, [])

  // Render myTasks widget - Full implementation from sales-dashboard
  const renderMyTasksWidget = (skipFullscreenStyles = false) => {
    const filteredTasks = getFilteredTasks()
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'myTasks'

    return (
      <Card
        ref={(el) => { widgetRefs.current['myTasks'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">My Tasks</CardTitle>
              <CardDescription className="text-xs truncate">Tasks assigned to you</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Tabs value={taskViewMode} onValueChange={(v: any) => setTaskViewMode(v)} className="w-auto">
                <TabsList className="h-8 p-1">
                  <TabsTrigger value="gantt" className="text-xs px-3 py-1">
                    <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden lg:inline">Gantt</span>
                  </TabsTrigger>
                  <TabsTrigger value="kanban" className="text-xs px-3 py-1">
                    <LayoutGrid className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden lg:inline">Kanban</span>
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs px-3 py-1">
                    <List className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden lg:inline">List</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs px-3 py-1">
                    <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                    <span className="hidden lg:inline">Calendar</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <Button
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-xs"
                title="Toggle Filters"
              >
                <Filter className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline ml-1">Filters</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTaskDialogOpen(true)}
                className="text-xs"
                title="Add New Task"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden lg:inline ml-1">Add Task</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFullscreen('myTasks')}
                title={fullscreenWidget === 'myTasks' ? "Exit Fullscreen" : "Enter Fullscreen"}
                className="h-8 w-8 p-0"
              >
                {fullscreenWidget === 'myTasks' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('ALL')
                    setPriorityFilter('ALL')
                    setDueDateFilter('ALL')
                    setShowFilters(false)
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">In Review</SelectItem>
                      <SelectItem value="BLOCKED">Blocked</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                  <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
                    <SelectTrigger className="h-9 text-xs w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="TODAY">Today</SelectItem>
                      <SelectItem value="THIS_WEEK">This Week</SelectItem>
                      <SelectItem value="THIS_MONTH">This Month</SelectItem>
                      <SelectItem value="NO_DUE_DATE">No Due Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredTasks.length} of {userTasks.length} tasks
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden pt-4">
          {taskViewMode === 'list' ? (
            <div className="space-y-3">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task: any) => {
                  const isTimerActive = activeTimer?.taskId === task.id
                  const timerDisplay = isTimerActive && timerSeconds[task.id]
                    ? formatDuration(timerSeconds[task.id])
                    : '0s'

                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-2 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div
                        className="flex-1 space-y-1 cursor-pointer"
                        onClick={() => {
                          setSelectedTaskId(task.id)
                          setTaskDetailDialogOpen(true)
                        }}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-muted-foreground">
                            {task.project.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {task.status}
                          </Badge>
                          <Badge variant={task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'destructive' : task.priority === 'MEDIUM' ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
                            {task.priority}
                          </Badge>
                          {task.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {task.source === 'task' && (
                        <div className="flex flex-col gap-1 items-end">
                          {isTimerActive ? (
                            <>
                              <Badge variant="secondary" className="text-xs animate-pulse">
                                <Clock className="h-3 w-3 mr-1" />
                                {timerDisplay}
                              </Badge>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 px-2"
                                onClick={stopTimer}
                              >
                                <Pause className="h-3 w-3 mr-1" />
                                Stop
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                              onClick={(e) => showTimerNotesDialog(task.id, task.title, e)}
                              disabled={!!activeTimer}
                            >
                              <Play className="h-3 w-3 mr-1" />
                              Start
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              setTimeTrackingTaskId(task.id)
                              setTimeTrackingDialogOpen(true)
                            }}
                          >
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })
              ) : userTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No tasks yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Filter className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No tasks match your filters</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('ALL')
                      setPriorityFilter('ALL')
                      setDueDateFilter('ALL')
                      setShowFilters(false)
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          ) : taskViewMode === 'calendar' ? (
            <div className="h-full">
              {(() => {
                const tasksByDate: { [key: string]: any[] } = {}

                filteredTasks.forEach(task => {
                  if (task.dueDate) {
                    try {
                      const dueDate = new Date(task.dueDate)
                      if (!isNaN(dueDate.getTime())) {
                        const dateKey = dueDate.toISOString().split('T')[0]
                        if (!tasksByDate[dateKey]) {
                          tasksByDate[dateKey] = []
                        }
                        tasksByDate[dateKey].push(task)
                      }
                    } catch (error) {
                      console.error('Error parsing due date for task:', task.id, task.dueDate, error)
                    }
                  }
                })

                if (!calendarDate) {
                  return <div className="p-4 text-center text-muted-foreground">Loading calendar...</div>
                }

                const currentMonth = calendarDate.getMonth()
                const currentYear = calendarDate.getFullYear()
                const firstDay = new Date(currentYear, currentMonth, 1)
                const lastDay = new Date(currentYear, currentMonth + 1, 0)
                const daysInMonth = lastDay.getDate()
                const startingDayOfWeek = firstDay.getDay()

                const calendarDays = []
                const now = new Date()
                const today = now.getDate()
                const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear

                for (let i = 0; i < startingDayOfWeek; i++) {
                  calendarDays.push(null)
                }

                for (let day = 1; day <= daysInMonth; day++) {
                  calendarDays.push(day)
                }

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

                const goToPreviousMonth = () => {
                  setCalendarDate(new Date(currentYear, currentMonth - 1, 1))
                }

                const goToNextMonth = () => {
                  setCalendarDate(new Date(currentYear, currentMonth + 1, 1))
                }

                const goToToday = () => {
                  setCalendarDate(new Date())
                }

                return (
                  <div className="flex flex-col h-full">
                    <div className="mb-3 pb-2 border-b flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="h-7 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold">
                          {monthNames[currentMonth]} {currentYear}
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={goToToday}
                          className="h-6 px-2 text-xs"
                        >
                          Today
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextMonth}
                        className="h-7 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto">
                      {calendarDays.map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} className="bg-muted/20 rounded-lg" />
                        }

                        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const tasksForDay = tasksByDate[dateKey] || []
                        const isTodayDate = isCurrentMonth && day === today
                        const isPast = new Date(dateKey) < new Date(now.toISOString().split('T')[0])

                        return (
                          <div
                            key={day}
                            className={cn(
                              "border rounded-lg p-2 min-h-[80px] flex flex-col",
                              isTodayDate && "border-primary bg-primary/5 border-2",
                              isPast && tasksForDay.length > 0 && "bg-destructive/5",
                              !isTodayDate && !isPast && "hover:bg-accent"
                            )}
                          >
                            <div className={cn(
                              "text-sm font-semibold mb-1",
                              isTodayDate && "text-primary",
                              isPast && "text-muted-foreground"
                            )}>
                              {day}
                            </div>

                            <div className="space-y-1 flex-1 overflow-y-auto">
                              {tasksForDay.map(task => (
                                <div
                                  key={task.id}
                                  className={cn(
                                    "text-[10px] px-1.5 py-1 rounded cursor-pointer truncate",
                                    task.priority === 'CRITICAL' && "bg-red-500 text-white",
                                    task.priority === 'HIGH' && "bg-orange-500 text-white",
                                    task.priority === 'MEDIUM' && "bg-yellow-500 text-white",
                                    task.priority === 'LOW' && "bg-blue-500 text-white",
                                    "hover:opacity-80 transition-opacity"
                                  )}
                                  onClick={() => {
                                    setSelectedTaskId(task.id)
                                    setTaskDetailDialogOpen(true)
                                  }}
                                  title={task.title}
                                >
                                  {task.title}
                                </div>
                              ))}
                            </div>

                            {tasksForDay.length > 0 && (
                              <div className="text-[10px] text-muted-foreground text-center mt-1">
                                {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {filteredTasks.some(t => !t.dueDate) && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                          No Due Date ({filteredTasks.filter(t => !t.dueDate).length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {filteredTasks.filter(t => !t.dueDate).map(task => (
                            <div
                              key={task.id}
                              className={cn(
                                "text-[10px] px-2 py-1 rounded cursor-pointer",
                                task.priority === 'CRITICAL' && "bg-red-500 text-white",
                                task.priority === 'HIGH' && "bg-orange-500 text-white",
                                task.priority === 'MEDIUM' && "bg-yellow-500 text-white",
                                task.priority === 'LOW' && "bg-blue-500 text-white",
                                "hover:opacity-80"
                              )}
                              onClick={() => {
                                setSelectedTaskId(task.id)
                                setTaskDetailDialogOpen(true)
                              }}
                            >
                              {task.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : taskViewMode === 'kanban' ? (
            <div className="h-full overflow-auto bg-gradient-to-br from-background to-muted/20">
              <div className="flex gap-4 min-w-[1000px] pb-6 px-1">
                {[
                  {
                    id: 'TODO',
                    name: 'To Do',
                    icon: '📋',
                    dragOverClasses: 'border-blue-400 shadow-lg shadow-blue-500/20 bg-blue-50/50',
                    dragOverBadgeClasses: 'bg-blue-100 text-blue-700 border-blue-300',
                    dragOverContentClasses: 'bg-blue-50/30 border-2 border-blue-300 border-dashed',
                    dragOverEmptyClasses: 'border-blue-400 bg-blue-50/50 text-blue-700'
                  },
                  {
                    id: 'IN_PROGRESS',
                    name: 'In Progress',
                    icon: '⚡',
                    dragOverClasses: 'border-amber-400 shadow-lg shadow-amber-500/20 bg-amber-50/50',
                    dragOverBadgeClasses: 'bg-amber-100 text-amber-700 border-amber-300',
                    dragOverContentClasses: 'bg-amber-50/30 border-2 border-amber-300 border-dashed',
                    dragOverEmptyClasses: 'border-amber-400 bg-amber-50/50 text-amber-700'
                  },
                  {
                    id: 'IN_REVIEW',
                    name: 'In Review',
                    icon: '📋',
                    dragOverClasses: 'border-purple-400 shadow-lg shadow-purple-500/20 bg-purple-50/50',
                    dragOverBadgeClasses: 'bg-purple-100 text-purple-700 border-purple-300',
                    dragOverContentClasses: 'bg-purple-50/30 border-2 border-purple-300 border-dashed',
                    dragOverEmptyClasses: 'border-purple-400 bg-purple-50/50 text-purple-700'
                  },
                  {
                    id: 'DONE',
                    name: 'Done',
                    icon: '✅',
                    dragOverClasses: 'border-green-400 shadow-lg shadow-green-500/20 bg-green-50/50',
                    dragOverBadgeClasses: 'bg-green-100 text-green-700 border-green-300',
                    dragOverContentClasses: 'bg-green-50/30 border-2 border-green-300 border-dashed',
                    dragOverEmptyClasses: 'border-green-400 bg-green-50/50 text-green-700'
                  },
                ].map((column) => {
                  const columnTasks = filteredTasks.filter((task: any) => {
                    const taskStatus = task.status || 'TODO'
                    return taskStatus === column.id
                  })

                  const isDragOver = dragOverColumnId === column.id

                  return (
                    <div
                      key={column.id}
                      data-column-id={column.id}
                      className="flex flex-col flex-1 min-w-[280px] max-w-[320px]"
                    >
                      <div className="mb-4">
                        <div className={cn(
                          "relative flex items-center justify-between px-5 py-4 rounded-xl border",
                          "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
                          "shadow-sm",
                          draggingTaskId ? "transition-none" : "transition-all duration-200",
                          isDragOver
                            ? column.dragOverClasses
                            : "border-border/60 hover:border-border hover:shadow-md"
                        )}>
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                            column.id === 'TODO' && "bg-gradient-to-b from-blue-500 to-blue-400",
                            column.id === 'IN_PROGRESS' && "bg-gradient-to-b from-amber-500 to-amber-400",
                            column.id === 'IN_REVIEW' && "bg-gradient-to-b from-purple-500 to-purple-400",
                            column.id === 'DONE' && "bg-gradient-to-b from-green-500 to-green-400"
                          )} />

                          <div className="flex items-center gap-3 pl-1">
                            <div className={cn(
                              "flex items-center justify-center w-9 h-9 rounded-lg",
                              "bg-background/60 backdrop-blur-sm",
                              column.id === 'TODO' && "bg-blue-50 dark:bg-blue-950/30",
                              column.id === 'IN_PROGRESS' && "bg-amber-50 dark:bg-amber-950/30",
                              column.id === 'IN_REVIEW' && "bg-purple-50 dark:bg-purple-950/30",
                              column.id === 'DONE' && "bg-green-50 dark:bg-green-950/30"
                            )}>
                              <span className="text-xl leading-none">{column.icon}</span>
                            </div>
                            <div className="flex flex-col">
                              <h3 className="font-semibold text-sm text-foreground leading-tight">
                                {column.name}
                              </h3>
                              <span className="text-[10px] text-muted-foreground/70 font-medium uppercase tracking-wider mt-0.5">
                                {column.id.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-semibold min-w-[28px] h-7 px-2.5 justify-center",
                              "rounded-full shadow-sm",
                              draggingTaskId ? "transition-none" : "transition-all duration-200",
                              isDragOver && column.dragOverBadgeClasses,
                              !isDragOver && column.id === 'TODO' && "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
                              !isDragOver && column.id === 'IN_PROGRESS' && "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                              !isDragOver && column.id === 'IN_REVIEW' && "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
                              !isDragOver && column.id === 'DONE' && "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800"
                            )}
                          >
                            {columnTasks.length}
                          </Badge>
                        </div>
                      </div>

                      <div
                        data-drop-zone={column.id}
                        data-column-id={column.id}
                        className={cn(
                          "flex-1 rounded-lg min-h-[500px]",
                          draggingTaskId ? "transition-none" : "transition-all duration-150",
                          isDragOver && column.dragOverContentClasses
                        )}
                      >
                        <div className="p-2 space-y-2.5">
                          {columnTasks.map((task: any) => {
                            const taskIsDragging = draggingTaskId === task.id
                            const isDraggable = task.source === 'task'

                            return (
                              <div
                                key={task.id}
                                onPointerDown={isDraggable ? (e) => onPointerDown(e, task.id) : undefined}
                                className={cn(
                                  "group bg-card border rounded-xl p-4 shadow-sm",
                                  !taskIsDragging && "transition-all duration-200 ease-out",
                                  !taskIsDragging && "hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5",
                                  taskIsDragging && "border-primary/50 shadow-lg cursor-grabbing",
                                  !taskIsDragging && isDraggable && "cursor-grab active:cursor-grabbing",
                                  !isDraggable && "cursor-pointer opacity-90"
                                )}
                                style={isDraggable ? {
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  touchAction: 'none',
                                  WebkitTouchCallout: 'none',
                                  cursor: 'grab'
                                } as React.CSSProperties : undefined}
                                onClick={(e) => {
                                  if (taskIsDragging || dragRef.current?.taskId === task.id) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    return
                                  }
                                  setSelectedTaskId(task.id)
                                  setTaskDetailDialogOpen(true)
                                }}
                              >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <p className="text-sm font-medium flex-1 leading-snug text-foreground group-hover:text-primary transition-colors">
                                    {task.title}
                                  </p>
                                  {isDraggable && (
                                    <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant={
                                      task.priority === 'HIGH' || task.priority === 'CRITICAL'
                                        ? 'destructive'
                                        : task.priority === 'MEDIUM'
                                          ? 'secondary'
                                          : 'default'
                                    }
                                    className="text-[10px] px-2 py-0.5 font-medium"
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.dueDate && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                          {columnTasks.length === 0 && (
                            <div className={cn(
                              "text-center text-muted-foreground/60 text-sm py-16 rounded-xl border-2 border-dashed",
                              draggingTaskId ? "transition-none" : "transition-all duration-150",
                              isDragOver
                                ? column.dragOverEmptyClasses
                                : "border-border/30 hover:border-border/50"
                            )}>
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl opacity-50">{column.icon}</span>
                                <span className="font-medium">{isDragOver ? 'Drop task here' : 'No tasks'}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setIsAddingGanttGroup(true)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add group
                  </Button>
                  <Tabs value={ganttViewMode} onValueChange={(v: any) => setGanttViewMode(v)} className="w-auto">
                    <TabsList className="h-8 p-1">
                      <TabsTrigger value="days" className="text-xs px-3 py-1">Days</TabsTrigger>
                      <TabsTrigger value="weeks" className="text-xs px-3 py-1">Weeks</TabsTrigger>
                      <TabsTrigger value="months" className="text-xs px-3 py-1">Months</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setTaskViewMode('list')}
                    title="Close Gantt view"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <div className="flex min-w-[1200px]">
                  <div className="w-[400px] border-r bg-background sticky left-0 z-20">
                    <div className="border-b bg-muted/50 p-2 grid grid-cols-3 gap-2 text-xs font-semibold">
                      <div>Task</div>
                      <div>Contributor</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {ganttGroups.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsAddingGanttGroup(true)}
                            className="mt-2"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Group
                          </Button>
                        </div>
                      ) : (
                        ganttGroups.map((group) => (
                          <div key={group.id}>
                            <div className="flex items-center justify-between p-2 bg-muted/30 hover:bg-muted/50">
                              <div className="flex items-center gap-2 flex-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleGroupExpanded(group.id)}
                                >
                                  {group.expanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <span className="font-semibold text-sm">{group.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => addTaskToGanttGroup(group.id)}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add task
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => deleteGanttGroup(group.id)}
                                  title="Delete group"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {group.expanded && (
                              <div>
                                {group.tasks.filter((task: any) => !task.parentTaskId && !task.parentId).length === 0 ? (
                                  <div className="p-4 text-center text-xs text-muted-foreground">
                                    No tasks in this group
                                  </div>
                                ) : (
                                  group.tasks
                                    .filter((task: any) => !task.parentTaskId && !task.parentId)
                                    .map((task: any) => {
                                      const taskStatus = task.status || 'TODO'
                                      const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date()
                                      const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)

                                      return (
                                        <div key={task.id}>
                                          {(() => {
                                            const subtasks = group.tasks.filter((t: any) =>
                                              (t.parentTaskId === task.id || t.parentId === task.id) && t.id !== task.id
                                            )
                                            const hasSubtasks = subtasks.length > 0
                                            const isExpanded = expandedSubtasks.has(task.id)

                                            return (
                                              <>
                                                <div
                                                  onClick={(e) => {
                                                    // Don't open dialog if clicking buttons
                                                    const target = e.target as HTMLElement
                                                    if (target.closest('button')) {
                                                      return
                                                    }
                                                    setSelectedTaskId(task.id)
                                                    setTaskDetailDialogOpen(true)
                                                  }}
                                                  className="grid grid-cols-3 gap-2 p-2 hover:bg-accent/50 text-xs border-b cursor-pointer transition-colors"
                                                >
                                                  <div className="flex items-center gap-1">
                                                    {hasSubtasks && (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setExpandedSubtasks(prev => {
                                                            const next = new Set(prev)
                                                            if (next.has(task.id)) {
                                                              next.delete(task.id)
                                                            } else {
                                                              next.add(task.id)
                                                            }
                                                            return next
                                                          })
                                                        }}
                                                      >
                                                        {isExpanded ? (
                                                          <ChevronDown className="h-3 w-3" />
                                                        ) : (
                                                          <ChevronRight className="h-3 w-3" />
                                                        )}
                                                      </Button>
                                                    )}
                                                    <span className="font-medium">
                                                      {task.title || 'Untitled Task'}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center">
                                                    {task.assignee ? (
                                                      <span>{task.assignee.firstName || task.assignee.name || 'Unassigned'}</span>
                                                    ) : (
                                                      <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-2">
                                                      <div className={`h-2 w-2 rounded-full ${getStatusDotColor(taskStatus)}`} />
                                                      <span>{formatStatusText(taskStatus)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          setAddingTaskToGroup(group.id)
                                                          setSelectedTaskId(task.id)
                                                          setTaskDialogOpen(true)
                                                        }}
                                                        title="Add subtask"
                                                      >
                                                        <Plus className="h-3 w-3" />
                                                      </Button>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          deleteGanttTask(group.id, task.id)
                                                        }}
                                                        title="Delete task"
                                                      >
                                                        <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
                                                {isExpanded && hasSubtasks && (
                                                  <div className="pl-4 border-l-2 border-muted ml-2">
                                                    {subtasks.map((subtask: any) => {
                                                      const subtaskStatus = subtask.status || 'TODO'

                                                      return (
                                                        <div key={subtask.id}>
                                                          <div 
                                                            onClick={(e) => {
                                                              // Don't open dialog if clicking buttons
                                                              if ((e.target as HTMLElement).closest('button')) {
                                                                return
                                                              }
                                                              setSelectedTaskId(subtask.id)
                                                              setTaskDetailDialogOpen(true)
                                                            }}
                                                            className="grid grid-cols-3 gap-2 p-2 hover:bg-accent/50 text-xs border-b bg-muted/30 cursor-pointer transition-colors"
                                                          >
                                                            <div className="flex items-center font-medium text-[11px]">
                                                              {subtask.title || 'Untitled Subtask'}
                                                            </div>
                                                            <div className="flex items-center text-[11px]">
                                                              {subtask.assignee ? (
                                                                <span>{subtask.assignee.firstName || subtask.assignee.name || 'Unassigned'}</span>
                                                              ) : (
                                                                <span className="text-muted-foreground">Unassigned</span>
                                                              )}
                                                            </div>
                                                            <div className="flex items-center justify-between gap-1 text-[11px]">
                                                              <div className="flex items-center gap-2">
                                                                <div className={`h-2 w-2 rounded-full ${getStatusDotColor(subtaskStatus)}`} />
                                                                <span>{formatStatusText(subtaskStatus)}</span>
                                                              </div>
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-4 w-4 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={(e) => {
                                                                  e.stopPropagation()
                                                                  deleteGanttTask(group.id, subtask.id)
                                                                }}
                                                                title="Delete subtask"
                                                              >
                                                                <Trash2 className="h-2.5 w-2.5" />
                                                              </Button>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      )
                                                    })}
                                                  </div>
                                                )}
                                              </>
                                            )
                                          })()}
                                        </div>
                                      )
                                    })
                                )}
                              </div>
                            )}
                          </div>
                        ))
                      )}

                      {isAddingGanttGroup && (
                        <div className="p-2 border-b">
                          <div className="flex items-center gap-2">
                            <Input
                              value={newGanttGroupName}
                              onChange={(e) => setNewGanttGroupName(e.target.value)}
                              placeholder="Group name"
                              className="h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addGanttGroup()
                                } else if (e.key === 'Escape') {
                                  setIsAddingGanttGroup(false)
                                  setNewGanttGroupName('')
                                }
                              }}
                              autoFocus
                            />
                            <Button size="sm" onClick={addGanttGroup} className="h-8">
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setIsAddingGanttGroup(false)
                                setNewGanttGroupName('')
                              }}
                              className="h-8"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <div className="border-b bg-muted/50 sticky top-0 z-10">
                      {ganttViewMode === 'days' ? (
                        <div className="relative">
                          <div className="border-b relative" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px`, minHeight: '20px' }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const showMonth = idx === 0 || date.getDate() === 1
                              const monthName = format(date, 'MMM')
                              if (!showMonth) return null
                              let monthSpan = 1
                              for (let i = idx + 1; i < getTimelineDates().length; i++) {
                                if (getTimelineDates()[i].getDate() === 1) break
                                monthSpan++
                              }
                              return (
                                <div
                                  key={`month-${idx}`}
                                  className="text-[10px] font-semibold text-muted-foreground p-1 border-r absolute"
                                  style={{
                                    left: `${idx * dateWidth}px`,
                                    minWidth: `${dateWidth * monthSpan}px`,
                                    width: `${dateWidth * monthSpan}px`,
                                    top: 0
                                  }}
                                >
                                  {monthName}
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const isTodayDate = isToday(date)
                              const dayNum = format(date, 'dd')
                              const dayName = format(date, 'EEE')
                              const dayOfWeek = date.getDay()
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                              return (
                                <div
                                  key={`day-${idx}`}
                                  className={cn(
                                    "border-r text-center p-1 text-[10px]",
                                    isTodayDate && "bg-primary text-primary-foreground font-semibold",
                                    isWeekend && !isTodayDate && "bg-muted/70"
                                  )}
                                  style={{ minWidth: `${dateWidth}px`, width: `${dateWidth}px` }}
                                >
                                  <div>{dayName}</div>
                                  <div>{dayNum}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : ganttViewMode === 'weeks' ? (
                        <div className="relative">
                          <div className="border-b relative" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px`, minHeight: '20px' }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const showMonth = idx === 0 || date.getDate() <= 7
                              const monthName = format(date, 'MMM')
                              if (!showMonth) return null
                              let monthSpan = 1
                              for (let i = idx + 1; i < getTimelineDates().length; i++) {
                                const nextDate = getTimelineDates()[i]
                                if (nextDate.getDate() <= 7 && (nextDate.getMonth() !== date.getMonth() || nextDate.getFullYear() !== date.getFullYear())) break
                                monthSpan++
                              }
                              return (
                                <div
                                  key={`month-${idx}`}
                                  className="text-[10px] font-semibold text-muted-foreground p-1 border-r absolute"
                                  style={{
                                    left: `${idx * dateWidth}px`,
                                    minWidth: `${dateWidth * monthSpan}px`,
                                    width: `${dateWidth * monthSpan}px`,
                                    top: 0
                                  }}
                                >
                                  {monthName}
                                </div>
                              )
                            })}
                          </div>
                          <div className="flex" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const isTodayDate = isToday(date) || (date <= new Date() && addDays(date, 7) > new Date())
                              const weekStart = format(date, 'MMM dd')
                              const weekEnd = format(addDays(date, 6), 'MMM dd')
                              return (
                                <div
                                  key={`week-${idx}`}
                                  className={cn(
                                    "border-r text-center p-1 text-[10px]",
                                    isTodayDate && "bg-primary text-primary-foreground font-semibold"
                                  )}
                                  style={{ minWidth: `${dateWidth}px`, width: `${dateWidth}px` }}
                                >
                                  <div className="font-semibold">{weekStart}</div>
                                  <div className="text-[9px]">{weekEnd}</div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }}>
                          {getTimelineDates().map((date, idx) => {
                            const dateWidth = getDateWidth()
                            const isTodayDate = date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear()
                            const year = format(date, 'yyyy')
                            const monthFull = format(date, 'MMMM')
                            return (
                              <div
                                key={idx}
                                className={cn(
                                  "border-r text-center p-2 text-[11px] font-semibold",
                                  isTodayDate && "bg-primary text-primary-foreground"
                                )}
                                style={{ minWidth: `${dateWidth}px`, width: `${dateWidth}px` }}
                              >
                                <div>{monthFull}</div>
                                <div className="text-[9px] opacity-80">{year}</div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    <div className="relative h-full">
                      {ganttViewMode === 'days' && getTimelineDates().map((date, idx) => {
                        const dateWidth = getDateWidth()
                        const dayOfWeek = date.getDay()
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
                        if (!isWeekend) return null
                        return (
                          <div
                            key={`weekend-${idx}`}
                            className="absolute top-0 bottom-0 bg-muted/40 z-0"
                            style={{
                              left: `${idx * dateWidth}px`,
                              width: `${dateWidth}px`
                            }}
                          />
                        )
                      })}
                      {(() => {
                        const todayPos = getTodayPosition()
                        const timelineDates = getTimelineDates()
                        const dateWidth = getDateWidth()
                        if (todayPos >= 0 && todayPos < timelineDates.length * dateWidth) {
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-0.5 bg-primary z-30"
                              style={{ left: `${todayPos}px` }}
                            >
                              <div className="absolute -top-3 -left-2 bg-primary text-primary-foreground text-[10px] px-1 rounded">
                                Today
                              </div>
                            </div>
                          )
                        }
                        return null
                      })()}

                      <svg
                        className="absolute top-0 left-0 w-full h-full z-20"
                        style={{ overflow: 'visible' }}
                      >
                        <defs>
                          <marker
                            id="arrowhead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="2.5"
                            orient="auto"
                          >
                            <polygon points="0 0, 6 2.5, 0 5" fill="#3b82f6" />
                          </marker>
                        </defs>
                        {getDependencyConnectors().map((connector, idx) => {
                          const { fromX, fromY, toX, toY, fromTask, toTask } = connector
                          const dx = toX - fromX
                          const dy = toY - fromY
                          const midX = fromX + Math.abs(dx) * 0.5
                          const pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX - 4} ${toY}`
                          const isHovered = hoveredConnector === idx
                          const labelX = connectorMousePos ? connectorMousePos.x + 15 : midX + 15
                          const labelY = connectorMousePos ? connectorMousePos.y - 25 : (fromY + toY) / 2 - 25

                          return (
                            <g key={idx}>
                              <path
                                d={pathData}
                                stroke="transparent"
                                strokeWidth="20"
                                fill="none"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoveredConnector(idx)}
                                onMouseLeave={() => {
                                  setHoveredConnector(null)
                                  setConnectorMousePos(null)
                                }}
                                onMouseMove={(e) => {
                                  if (isHovered) {
                                    const svg = e.currentTarget.ownerSVGElement
                                    if (svg) {
                                      const pt = svg.createSVGPoint()
                                      pt.x = e.clientX
                                      pt.y = e.clientY
                                      const svgPt = pt.matrixTransform(svg.getScreenCTM()?.inverse())
                                      setConnectorMousePos({ x: svgPt.x, y: svgPt.y })
                                    }
                                  }
                                }}
                              />
                              <path
                                d={pathData}
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                opacity={isHovered ? "1" : "0.7"}
                                className="pointer-events-none transition-opacity"
                              />
                              {isHovered && connectorMousePos && (
                                <g className="pointer-events-none">
                                  <rect
                                    x={labelX - 85}
                                    y={labelY - 22}
                                    width="170"
                                    height="44"
                                    fill="white"
                                    stroke="#3b82f6"
                                    strokeWidth="1.5"
                                    rx="6"
                                    className="drop-shadow-lg"
                                  />
                                  <text
                                    x={labelX}
                                    y={labelY - 8}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#1e40af"
                                    fontWeight="600"
                                  >
                                    {fromTask.title?.substring(0, 20) || 'Task'}
                                  </text>
                                  <text
                                    x={labelX}
                                    y={labelY + 4}
                                    textAnchor="middle"
                                    fontSize="9"
                                    fill="#64748b"
                                    fontWeight="500"
                                  >
                                    depends on
                                  </text>
                                  <text
                                    x={labelX}
                                    y={labelY + 16}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#1e40af"
                                    fontWeight="600"
                                  >
                                    {toTask.title?.substring(0, 20) || 'Task'}
                                  </text>
                                </g>
                              )}
                            </g>
                          )
                        })}
                      </svg>

                      <div className="divide-y">
                        {ganttGroups.map((group) => (
                          <div key={group.id}>
                            {!group.expanded && (
                              <div className="h-10 border-b" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }} />
                            )}

                            {group.expanded && (
                              <>
                                {group.tasks.length === 0 ? (
                                  <div className="h-10 border-b" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }} />
                                ) : (
                                  group.tasks.map((task: any) => {
                                    const taskStatus = task.status || 'TODO'
                                    const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date()
                                    const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)
                                    const position = getTaskPosition(startDate, endDate)
                                    const timelineDates = getTimelineDates()
                                    const dateWidth = getDateWidth()
                                    const maxPosition = timelineDates.length * dateWidth

                                    return (
                                      <div
                                        key={task.id}
                                        className="relative h-10 border-b"
                                        style={{ minWidth: `${maxPosition}px` }}
                                      >
                                        {position.left >= 0 && position.left < maxPosition && (() => {
                                          const statusColorResult = getStatusColor(taskStatus, task)
                                          const customColor = typeof statusColorResult === 'object' ? statusColorResult.backgroundColor : null
                                          const bgClass = typeof statusColorResult === 'string' ? statusColorResult : ''
                                          
                                          return (
                                            <div
                                              className={cn(
                                                "absolute top-1 h-6 rounded flex items-center px-2 text-[10px] text-white font-medium cursor-pointer hover:opacity-90 transition-opacity",
                                                !customColor && bgClass
                                              )}
                                              style={{
                                                left: `${position.left}px`,
                                                width: `${position.width}px`,
                                                minWidth: '60px',
                                                ...(customColor ? { backgroundColor: customColor } : {})
                                              }}
                                              onClick={() => {
                                                setSelectedTaskId(task.id)
                                                setTaskDetailDialogOpen(true)
                                              }}
                                              title={task.title}
                                            >
                                              <span className="truncate">{task.title}</span>
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    )
                                  })
                                )}
                              </>
                            )}
                          </div>
                        ))}

                        {isAddingGanttGroup && (
                          <div className="h-10 border-b" style={{ minWidth: '800px' }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Fetch user's tasks
  useEffect(() => {
    if (user?.id) {
      fetchUserTasks()
      checkActiveTimer()
    }
  }, [user?.id])

  // Save taskViewMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('task-view-mode', taskViewMode)
    } catch (error) {
      console.error('Error saving task view mode to localStorage:', error)
    }
  }, [taskViewMode])

  // Sync refs with state
  useEffect(() => {
    draggingTaskIdRef.current = draggingTaskId
  }, [draggingTaskId])

  useEffect(() => {
    dragOverColumnIdRef.current = dragOverColumnId
  }, [dragOverColumnId])

  // Check for active timer
  const checkActiveTimer = async () => {
    try {
      const response = await fetch('/api/time-tracking/active')
      if (response.ok) {
        const data = await response.json()
        if (data.activeTimer) {
          setActiveTimer(data.activeTimer)
        }
      }
    } catch (error) {
      console.error('Error checking active timer:', error)
    }
  }

  // Update timer seconds
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const startTime = new Date(activeTimer.startTime).getTime()
        const now = Date.now()
        const seconds = Math.floor((now - startTime) / 1000)
        setTimerSeconds({ ...timerSeconds, [activeTimer.taskId]: seconds })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer])

  // Fetch user's tasks
  const fetchUserTasks = async () => {
    try {
      if (!user?.id) return

      const tasksResponse = await fetch(`/api/tasks?includeCreated=true`)
      let allTasks: any[] = []

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        allTasks = (tasksData.tasks || []).map((task: any) => ({
          ...task,
          source: 'task',
          sourceId: task.id,
        }))
      }

      setUserTasks(allTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  // Format duration helper
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  // Get filtered tasks
  const getFilteredTasks = () => {
    let filtered = [...userTasks]

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    if (dueDateFilter !== 'ALL') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      filtered = filtered.filter(task => {
        if (!task.dueDate) return dueDateFilter === 'NO_DUE_DATE'

        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        switch (dueDateFilter) {
          case 'OVERDUE':
            return dueDate < today
          case 'TODAY':
            return dueDate.getTime() === today.getTime()
          case 'THIS_WEEK':
            const weekEnd = new Date(today)
            weekEnd.setDate(weekEnd.getDate() + 7)
            return dueDate >= today && dueDate <= weekEnd
          case 'THIS_MONTH':
            return dueDate.getMonth() === today.getMonth() &&
              dueDate.getFullYear() === today.getFullYear()
          case 'NO_DUE_DATE':
            return false
          default:
            return true
        }
      })
    }

    return filtered
  }

  // Update task status (for Kanban drag and drop)
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const task = userTasks.find((t: any) => t.id === taskId)
      if (!task || task.source !== 'task') {
        return
      }

      setUserTasks((prevTasks: any[]) =>
        prevTasks.map((t: any) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      )

      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, status: newStatus }),
      })

      if (!response.ok) {
        fetchUserTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      fetchUserTasks()
    }
  }, [userTasks])

  // Kanban drag handlers
  const onPointerDown = (e: React.PointerEvent, taskId: string) => {
    if (e.button !== 0) return

    const element = e.currentTarget as HTMLElement
    element.setPointerCapture(e.pointerId)

    const cloned = element.cloneNode(true) as HTMLElement
    const rect = element.getBoundingClientRect()
    cloned.style.position = 'fixed'
    cloned.style.width = `${rect.width}px`
    cloned.style.pointerEvents = 'none'
    cloned.style.zIndex = '9999'
    cloned.style.opacity = '0.85'
    cloned.style.transform = 'rotate(3deg) scale(1.02)'
    cloned.style.transition = 'none'
    cloned.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    cloned.className = cloned.className.replace(/transition-[^ ]*/g, '')

    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    cloned.style.top = `${e.clientY - offsetY}px`
    cloned.style.left = `${e.clientX - offsetX}px`

    document.body.appendChild(cloned)

    dragRef.current = {
      taskId,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      element: cloned,
      offsetX,
      offsetY
    }
  }

  // Global pointer handlers for dragging
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return

        const dx = Math.abs(e.clientX - dragRef.current.startX)
        const dy = Math.abs(e.clientY - dragRef.current.startY)

        if (dragRef.current.element && dragRef.current.offsetX !== undefined && dragRef.current.offsetY !== undefined) {
          dragRef.current.element.style.top = `${e.clientY - dragRef.current.offsetY}px`
          dragRef.current.element.style.left = `${e.clientX - dragRef.current.offsetX}px`
        }

        if (!draggingTaskIdRef.current && (dx > 6 || dy > 6)) {
          setDraggingTaskId(dragRef.current.taskId)
        }

        const isDragging = draggingTaskIdRef.current || (dx > 6 || dy > 6)
        if (isDragging) {
          const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
          if (elementBelow) {
            const columnElement = elementBelow.closest('[data-column-id]') as HTMLElement
            const dropZone = elementBelow.closest('[data-drop-zone]') as HTMLElement

            let newColumnId: string | null = null
            if (columnElement) {
              newColumnId = columnElement.getAttribute('data-column-id')
            } else if (dropZone) {
              newColumnId = dropZone.getAttribute('data-drop-zone')
            }

            if (newColumnId !== lastColumnCheckRef.current) {
              lastColumnCheckRef.current = newColumnId
              setDragOverColumnId(newColumnId)
            }
          }
        }
      })
    }

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (!dragRef.current) return

      const taskId = dragRef.current.taskId
      const pointerId = dragRef.current.pointerId
      const dragElement = dragRef.current.element
      const startX = dragRef.current.startX
      const startY = dragRef.current.startY
      const dx = Math.abs(e.clientX - startX)
      const dy = Math.abs(e.clientY - startY)

      const isDragging = draggingTaskIdRef.current || (dx > 6 || dy > 6)

      if (dragElement && dragElement.parentNode) {
        dragElement.parentNode.removeChild(dragElement)
      }

      try {
        const capturedElement = document.elementFromPoint(e.clientX, e.clientY)
        if (capturedElement && 'releasePointerCapture' in capturedElement) {
          (capturedElement as HTMLElement).releasePointerCapture(pointerId)
        }
      } catch (err) {
        // Ignore
      }

      if (isDragging) {
        const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
        let targetColumnId: string | null = null

        if (elementBelow) {
          const columnElement = elementBelow.closest('[data-column-id]') as HTMLElement
          const dropZone = elementBelow.closest('[data-drop-zone]') as HTMLElement

          if (columnElement) {
            targetColumnId = columnElement.getAttribute('data-column-id')
          } else if (dropZone) {
            targetColumnId = dropZone.getAttribute('data-drop-zone')
          }
        }

        if (!targetColumnId) {
          targetColumnId = dragOverColumnIdRef.current
        }

        if (targetColumnId) {
          const task = userTasks.find((t: any) => t.id === taskId)
          if (task && task.status !== targetColumnId) {
            await updateTaskStatus(taskId, targetColumnId)
          }
        }
      }

      dragRef.current = null
      setDraggingTaskId(null)
      setDragOverColumnId(null)
      lastColumnCheckRef.current = null
    }

    const handleGlobalPointerCancel = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (dragRef.current) {
        const pointerId = dragRef.current.pointerId
        const dragElement = dragRef.current.element

        if (dragElement && dragElement.parentNode) {
          dragElement.parentNode.removeChild(dragElement)
        }

        try {
          const element = document.elementFromPoint(dragRef.current.startX, dragRef.current.startY)
          if (element && 'releasePointerCapture' in element) {
            (element as HTMLElement).releasePointerCapture(pointerId)
          }
        } catch (err) {
          // Ignore
        }
      }
      dragRef.current = null
      setDraggingTaskId(null)
      setDragOverColumnId(null)
      lastColumnCheckRef.current = null
    }

    document.addEventListener('pointermove', handleGlobalPointerMove)
    document.addEventListener('pointerup', handleGlobalPointerUp)
    document.addEventListener('pointercancel', handleGlobalPointerCancel)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (dragRef.current?.element && dragRef.current.element.parentNode) {
        dragRef.current.element.parentNode.removeChild(dragRef.current.element)
      }

      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerCancel)
    }
  }, [userTasks, updateTaskStatus])

  // Gantt chart helpers
  const toggleGroupExpanded = (groupId: string) => {
    setGanttGroups(groups =>
      groups.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    )
  }

  // Load ganttGroups from localStorage
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem('gantt-groups')
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups)
        setGanttGroups(parsed)
      }
      setGanttGroupsLoaded(true)
    } catch (error) {
      console.error('Error loading gantt groups from localStorage:', error)
      setGanttGroupsLoaded(true)
    }
  }, [])

  // Save ganttGroups to localStorage
  useEffect(() => {
    if (!ganttGroupsLoaded) return

    try {
      localStorage.setItem('gantt-groups', JSON.stringify(ganttGroups))
    } catch (error) {
      console.error('Error saving gantt groups to localStorage:', error)
    }
  }, [ganttGroups, ganttGroupsLoaded])

  // Sync tasks from userTasks into ganttGroups
  useEffect(() => {
    if (userTasks.length === 0 || !ganttGroupsLoaded) return

    setGanttGroups(prevGroups => {
      if (prevGroups.length === 0) return prevGroups

      const updatedGroups = prevGroups.map(group => {
        const taskIdsInGroup = new Set(group.tasks.map((t: any) => t.id))

        const updatedTasks = group.tasks.map((groupTask: any) => {
          const latestTask = userTasks.find((t: any) => t.id === groupTask.id)
          if (latestTask) {
            return {
              ...latestTask,
              parentId: latestTask.parentId || groupTask.parentId,
              parentTaskId: latestTask.parentTaskId || groupTask.parentTaskId || groupTask.parentId
            }
          }
          return groupTask
        })

        const newTasks = userTasks.filter((t: any) => {
          if (taskIdsInGroup.has(t.id)) return false

          if (t.parentId || t.parentTaskId) {
            const parentId = t.parentId || t.parentTaskId
            return taskIdsInGroup.has(parentId)
          }

          return true
        })

        return {
          ...group,
          tasks: [...updatedTasks, ...newTasks]
        }
      })

      return updatedGroups
    })
  }, [userTasks, ganttGroupsLoaded])

  const addGanttGroup = () => {
    if (newGanttGroupName.trim()) {
      setGanttGroups([...ganttGroups, {
        id: newGanttGroupName.trim(),
        name: newGanttGroupName.trim(),
        expanded: true,
        tasks: []
      }])
      setNewGanttGroupName('')
      setIsAddingGanttGroup(false)
    }
  }

  const addTaskToGanttGroup = async (groupId: string) => {
    setAddingTaskToGroup(groupId)
    setTaskDialogOpen(true)
  }

  const deleteGanttGroup = (groupId: string) => {
    setGanttGroups(groups => groups.filter(g => g.id !== groupId))
  }

  const deleteGanttTask = (groupId: string, taskId: string) => {
    setGanttGroups(groups =>
      groups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            tasks: group.tasks.filter((t: any) => t.id !== taskId)
          }
        }
        return group
      })
    )
  }

  // Calculate timeline dates
  const getTimelineDates = () => {
    const today = new Date()
    const dates: Date[] = []

    if (ganttViewMode === 'days') {
      for (let i = -30; i <= 335; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
    } else if (ganttViewMode === 'weeks') {
      const startWeek = new Date(today)
      startWeek.setDate(today.getDate() - today.getDay())
      for (let i = -4; i <= 48; i++) {
        const date = new Date(startWeek)
        date.setDate(startWeek.getDate() + (i * 7))
        dates.push(date)
      }
    } else if (ganttViewMode === 'months') {
      for (let i = -2; i <= 10; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
        dates.push(date)
      }
    }

    return dates
  }

  // Get date width
  const getDateWidth = () => {
    if (ganttViewMode === 'days') return 40
    if (ganttViewMode === 'weeks') return 80
    if (ganttViewMode === 'months') return 120
    return 40
  }

  // Calculate task position
  const getTaskPosition = (startDate: Date, endDate: Date) => {
    const timelineStart = getTimelineDates()[0]
    const dateWidth = getDateWidth()

    if (ganttViewMode === 'days') {
      const daysFromStart = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
      return {
        left: daysFromStart * dateWidth,
        width: Math.max(duration * dateWidth - 4, 60)
      }
    } else if (ganttViewMode === 'weeks') {
      const weeksFromStart = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)) + 1
      return {
        left: weeksFromStart * dateWidth,
        width: Math.max(duration * dateWidth - 4, 60)
      }
    } else if (ganttViewMode === 'months') {
      const monthsFromStart = (startDate.getFullYear() - timelineStart.getFullYear()) * 12 +
        (startDate.getMonth() - timelineStart.getMonth())
      const duration = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth()) + 1
      return {
        left: monthsFromStart * dateWidth,
        width: Math.max(duration * dateWidth - 4, 60)
      }
    }

    return { left: 0, width: 60 }
  }

  // Get all tasks with positions for dependency connectors
  const getAllTasksWithPositions = () => {
    const tasksWithPositions: Array<{
      task: any
      groupId: string
      rowIndex: number
      startPos: { left: number; width: number }
      endPos: { left: number; width: number }
      centerY: number
    }> = []

    ganttGroups.forEach((group, groupIdx) => {
      if (!group.expanded) return

      const parentTasks = group.tasks.filter((t: any) => !t.parentTaskId && !t.parentId)
      parentTasks.forEach((task: any, taskIdx: number) => {
        const taskStatus = task.status || 'TODO'
        const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date()
        const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)
        const position = getTaskPosition(startDate, endDate)

        let rowIndex = 0
        for (let i = 0; i < groupIdx; i++) {
          if (ganttGroups[i].expanded) {
            rowIndex += ganttGroups[i].tasks.filter((t: any) => !t.parentTaskId && !t.parentId).length
          }
        }
        rowIndex += taskIdx

        tasksWithPositions.push({
          task,
          groupId: group.id,
          rowIndex,
          startPos: { left: position.left, width: position.width },
          endPos: { left: position.left + position.width, width: 0 },
          centerY: rowIndex * 40 + 20
        })
      })
    })

    return tasksWithPositions
  }

  // Get dependency connectors
  const getDependencyConnectors = () => {
    const tasksWithPositions = getAllTasksWithPositions()
    const taskMap = new Map(tasksWithPositions.map(t => [t.task.id, t]))
    const connectors: Array<{
      fromTask: any
      toTask: any
      fromX: number
      fromY: number
      toX: number
      toY: number
    }> = []

    tasksWithPositions.forEach(({ task, endPos, centerY }) => {
      const dependencyId = task.dependencyId || task.predecessorId
      const dependencies = task.dependencies || []

      if (dependencyId) {
        const fromTask = taskMap.get(dependencyId)
        if (fromTask) {
          connectors.push({
            fromTask: fromTask.task,
            toTask: task,
            fromX: fromTask.endPos.left,
            fromY: fromTask.centerY,
            toX: endPos.left,
            toY: centerY
          })
        }
      }

      if (Array.isArray(dependencies) && dependencies.length > 0) {
        dependencies.forEach((dep: any) => {
          const depId = typeof dep === 'string' ? dep : (dep.id || dep.taskId || dep.predecessorId)
          const fromTask = taskMap.get(depId)
          if (fromTask) {
            connectors.push({
              fromTask: fromTask.task,
              toTask: task,
              fromX: fromTask.endPos.left,
              fromY: fromTask.centerY,
              toX: endPos.left,
              toY: centerY
            })
          }
        })
      }
    })

    return connectors
  }

  // Get today position
  const getTodayPosition = () => {
    const today = new Date()
    const timelineStart = getTimelineDates()[0]
    const dateWidth = getDateWidth()

    if (ganttViewMode === 'days') {
      const daysDiff = Math.floor((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff * dateWidth
    } else if (ganttViewMode === 'weeks') {
      const weeksDiff = Math.floor((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24 * 7))
      return weeksDiff * dateWidth
    } else if (ganttViewMode === 'months') {
      const monthsDiff = (today.getFullYear() - timelineStart.getFullYear()) * 12 +
        (today.getMonth() - timelineStart.getMonth())
      return monthsDiff * dateWidth
    }

    return 0
  }

  // Format status text to normal case (e.g., "IN_PROGRESS" -> "In Progress")
  const formatStatusText = (status: string): string => {
    if (!status) return ''
    return status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Get status color hex value (for color picker default)
  const getStatusColorHex = (status: string): string => {
    const statusUpper = status?.toUpperCase() || ''
    if (statusUpper === 'DONE' || statusUpper === 'COMPLETED') return '#22c55e' // green-500
    if (statusUpper === 'IN_PROGRESS') return '#3b82f6' // blue-500
    if (statusUpper === 'IN_REVIEW') return '#a855f7' // purple-500
    if (statusUpper === 'BLOCKED') return '#ef4444' // red-500
    if (statusUpper === 'TODO' || statusUpper === 'BACKLOG') return '#94a3b8' // slate-400
    if (statusUpper === 'CANCELLED' || statusUpper === 'ON_HOLD') return '#9ca3af' // gray-400
    return '#9ca3af' // gray-400 default
  }

  // Get status color for badges (returns class name or custom color)
  const getStatusColor = (status: string, task?: any): string | { backgroundColor: string } => {
    // Check if task has a custom color
    if (task?.id && taskColors[task.id]) {
      return { backgroundColor: taskColors[task.id] }
    }
    
    // Fall back to status-based colors
    switch (status) {
      case 'DONE': return 'bg-green-500'
      case 'IN_REVIEW': return 'bg-yellow-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'TODO': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Set task color
  const setTaskColor = (taskId: string, color: string) => {
    const newColors = { ...taskColors, [taskId]: color }
    setTaskColors(newColors)
    try {
      localStorage.setItem('it-task-colors', JSON.stringify(newColors))
    } catch (error) {
      console.error('Error saving task colors to localStorage:', error)
    }
  }

  // Reset task color to status-based
  const resetTaskColor = (taskId: string) => {
    const newColors = { ...taskColors }
    delete newColors[taskId]
    setTaskColors(newColors)
    try {
      localStorage.setItem('it-task-colors', JSON.stringify(newColors))
    } catch (error) {
      console.error('Error saving task colors to localStorage:', error)
    }
  }

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case 'DONE': return 'bg-green-500'
      case 'IN_REVIEW': return 'bg-yellow-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'TODO': return 'bg-gray-400'
      default: return 'bg-gray-400'
    }
  }

  // Timer functions
  const showTimerNotesDialog = (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingTimerTask({ id: taskId, title: taskTitle })
    setTimerNotesDialogOpen(true)
  }

  const startTimer = async (notes: string) => {
    if (!pendingTimerTask) return

    try {
      const response = await fetch('/api/time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: pendingTimerTask.id,
          notes: notes || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActiveTimer(data.timeLog)
        setPendingTimerTask(null)
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  const stopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!activeTimer) return

    try {
      const response = await fetch('/api/time-tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeLogId: activeTimer.id })
      })

      if (response.ok) {
        setActiveTimer(null)
        setTimerSeconds({})
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

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
              <p className="text-xs text-muted-foreground">assets</p>
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
              {recentTickets.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No recent tickets
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${ticket.priority === 'HIGH' ? 'bg-red-100 dark:bg-red-900/30' :
                        ticket.priority === 'MEDIUM' ? 'bg-orange-100 dark:bg-orange-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                        <Ticket className={`h-4 w-4 ${ticket.priority === 'HIGH' ? 'text-red-600 dark:text-red-400' :
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
              )}
            </CardContent>
          </Card>
        )

      case 'metrics':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Metrics</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-center py-8 text-sm text-muted-foreground">
                Metrics widget - to be implemented
              </div>
            </CardContent>
          </Card>
        )

      case 'myTasks':
        return renderMyTasksWidget(true)

      case 'quickActions':
        return (
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-center py-8 text-sm text-muted-foreground">
                Quick Actions widget - to be implemented
              </div>
            </CardContent>
          </Card>
        )

      case 'mindMap':
        return <AdvancedMindMapWidget />

      case 'canvas':
        return <AdvancedCanvasWidget />

      default:
        return null
    }
  }

  // Widget visibility check is now handled by isWidgetVisible function

  if (loading) {
    return (
      <ITPageLayout widgets={widgets} toggleWidget={toggleWidget}>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </div>
      </ITPageLayout>
    )
  }

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'
  
  // Check if there are any visible widgets
  const hasVisibleWidgets = widgets.some(w => w.visible)

  // Empty State Component
  const EmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-lg">
          <div className="mb-6">
            <LayoutGrid className="h-20 w-20 mx-auto text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your IT Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Get started by adding your first widgets and data.
          </p>
          <p className="text-muted-foreground mb-8">
            Once you start adding widgets, you'll see beautiful visualizations and insights here.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={() => router.push('/it-dashboard')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/wrkboard')}
              className="flex items-center gap-2"
            >
              <Ticket className="h-4 w-4" />
              View Tickets
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ITPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      {/* Welcome Message - Always shown */}
      {!hasVisibleWidgets ? (
        <EmptyState />
      ) : (
        <>
          {/* Greeting Header */}
          <div className="mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {greeting}, {user?.firstName || 'there'}!
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome to Your IT Dashboard
              </p>
            </div>
          </div>

          {isMobile ? (
        <div className="space-y-4">
          {isWidgetVisible('metrics') && (
            <div className="w-full">
              {renderWidget('metrics')}
            </div>
          )}
          {isWidgetVisible('quickActions') && (
            <div className="w-full">
              {renderWidget('quickActions')}
            </div>
          )}
          {isWidgetVisible('myTasks') && (
            <div className="w-full">
              {renderWidget('myTasks')}
            </div>
          )}
        </div>
      ) : (
        <div style={{ minHeight: '800px' }} className="it-dashboard-grid">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            onDragStart={() => {
              // Grid layout drag started
            }}
            onDragStop={() => {
              // Grid layout drag stopped
            }}
            draggableHandle=".drag-handle"
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            compactType="vertical"
            preventCollision={false}
            useCSSTransforms={true}
          >
            {/* Metrics Widget */}
            {isWidgetVisible('metrics') && (
              <div key="metrics">
                <GridCard id="metrics">
                  {renderWidget('metrics')}
                </GridCard>
              </div>
            )}

            {/* Quick Actions Widget */}
            {isWidgetVisible('quickActions') && (
              <div key="quickActions">
                <GridCard id="quickActions">
                  {renderWidget('quickActions')}
                </GridCard>
              </div>
            )}

            {/* My Tasks Widget */}
            {isWidgetVisible('myTasks') && (
              <div key="myTasks">
                <GridCard id="myTasks">
                  {renderWidget('myTasks')}
                </GridCard>
              </div>
            )}
          </ResponsiveGridLayout>
        </div>
        )}
        </>
      )}

      {/* Fullscreen Widgets */}
      {fullscreenWidget === 'myTasks' && renderMyTasksWidget()}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false)
          setAddingTaskToGroup(null)
          setSelectedTaskId(null)
        }}
        onSubmit={async (data) => {
          try {
            const taskData = selectedTaskId
              ? { ...data, parentId: selectedTaskId }
              : data

            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            })
            if (response.ok) {
              const result = await response.json()
              const createdTask = result.task || result

              if (selectedTaskId) {
                createdTask.parentId = selectedTaskId
                createdTask.parentTaskId = selectedTaskId
              }

              if (addingTaskToGroup) {
                setGanttGroups(groups =>
                  groups.map(group => {
                    if (group.id === addingTaskToGroup) {
                      if (selectedTaskId) {
                        const parentTask = group.tasks.find((t: any) => t.id === selectedTaskId)
                        if (parentTask) {
                          return {
                            ...group,
                            tasks: [...group.tasks, createdTask]
                          }
                        } else {
                          const parentInUserTasks = userTasks.find((t: any) => t.id === selectedTaskId)
                          if (parentInUserTasks) {
                            return {
                              ...group,
                              tasks: [...group.tasks, parentInUserTasks, createdTask]
                            }
                          }
                        }
                      }
                      return {
                        ...group,
                        tasks: [...group.tasks, createdTask]
                      }
                    }
                    return group
                  })
                )
                setAddingTaskToGroup(null)
              }

              setSelectedTaskId(null)
              await fetchUserTasks()
              setTaskDialogOpen(false)
            } else {
              const error = await response.json()
              alert(error.error || 'Failed to create task')
            }
          } catch (error) {
            console.error('Error creating task:', error)
            alert('Failed to create task. Please try again.')
          }
        }}
      />

      {/* Task Detail Dialog */}
      <TaskDetailDialog
        open={taskDetailDialogOpen}
        onClose={() => {
          setTaskDetailDialogOpen(false)
          setSelectedTaskId(null)
        }}
        taskId={selectedTaskId}
        onUpdate={fetchUserTasks}
        taskColors={taskColors}
        onSetTaskColor={setTaskColor}
        onResetTaskColor={resetTaskColor}
        getStatusColorHex={getStatusColorHex}
      />

      {/* Time Tracking Dialog */}
      <TimeTrackingDialog
        open={timeTrackingDialogOpen}
        onClose={() => {
          setTimeTrackingDialogOpen(false)
          setTimeTrackingTaskId(undefined)
        }}
        taskId={timeTrackingTaskId}
      />

      {/* Timer Notes Dialog */}
      <TimerNotesDialog
        open={timerNotesDialogOpen}
        onClose={() => {
          setTimerNotesDialogOpen(false)
          setPendingTimerTask(null)
        }}
        onSubmit={startTimer}
        taskTitle={pendingTimerTask?.title}
      />
    </ITPageLayout>
  )
}

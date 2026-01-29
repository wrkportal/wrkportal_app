'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { OperationsPageLayout } from '@/components/operations/operations-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  BarChart3,
  List,
  LayoutGrid,
  Filter,
  Plus,
  Minimize,
  Maximize,
  X,
  Play,
  Pause,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Link as LinkIcon
} from 'lucide-react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { format, addDays, isToday } from 'date-fns'
import { TaskDialog } from '@/components/dialogs/task-dialog'
import { TaskDetailDialog } from '@/components/dialogs/task-detail-dialog'
import { TimeTrackingDialog } from '@/components/dialogs/time-tracking-dialog'
import { TimerNotesDialog } from '@/components/dialogs/timer-notes-dialog'
import { AdvancedMindMapWidget } from '@/components/widgets/AdvancedMindMapWidget'
import { AdvancedCanvasWidget } from '@/components/widgets/AdvancedCanvasWidget'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
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
    // Key Operational Metrics
    { i: 'metrics', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 4 },
    // Quick Actions & Useful Links
    { i: 'quick-actions', x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 6, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    // My Tasks
    { i: 'myTasks', x: 0, y: 12, w: 12, h: 10, minW: 6, minH: 8 },
    // Mind Map & Canvas
    { i: 'mindMap', x: 0, y: 22, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 6, y: 22, w: 6, h: 8, minW: 3, minH: 8 },
  ],
  md: [
    { i: 'metrics', x: 0, y: 0, w: 10, h: 6, minW: 5, minH: 4 },
    { i: 'quick-actions', x: 0, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 5, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 12, w: 10, h: 10, minW: 5, minH: 8 },
    { i: 'mindMap', x: 0, y: 22, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 5, y: 22, w: 5, h: 8, minW: 3, minH: 8 },
  ],
  sm: [
    { i: 'metrics', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'quick-actions', x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 18, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'mindMap', x: 0, y: 28, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 0, y: 36, w: 6, h: 8, minW: 3, minH: 8 },
  ],
}

export default function OperationsDashboardPage() {
  const user = useAuthStore((state) => state.user)
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resourcesData, setResourcesData] = useState<any[]>([])
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [complianceData, setComplianceData] = useState<any[]>([])
  const [inventoryData, setInventoryData] = useState<any[]>([])
  // Initialize layouts from localStorage if available (client-side only)
  const getInitialLayouts = (): Layouts => {
    if (typeof window === 'undefined') return defaultLayouts
    try {
      const saved = localStorage.getItem('operations-dashboard-layouts')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && (parsed.lg || parsed.md || parsed.sm)) {
          return {
            lg: parsed.lg || defaultLayouts.lg || [],
            md: parsed.md || parsed.lg || defaultLayouts.md || [],
            sm: parsed.sm || parsed.md || parsed.lg || defaultLayouts.sm || [],
            xs: parsed.xs || parsed.sm || parsed.md || parsed.lg || defaultLayouts.xs || [],
          }
        }
      }
    } catch (error) {
      console.error('Error loading initial layouts:', error)
    }
    return defaultLayouts
  }

  const [layouts, setLayouts] = useState<Layouts>(getInitialLayouts())
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

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
  const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)

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

  // Useful Links state
  const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

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
        const saved = localStorage.getItem('operations-task-colors')
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
      const savedWidgets = localStorage.getItem('operations-widgets')
      if (savedWidgets) {
        try {
          const parsed: Widget[] = JSON.parse(savedWidgets)
          // Check if parsed widgets are valid and have the same structure
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            // Migration: If all widgets are visible (old default), reset to invisible for welcome message
            const allVisible = parsed.every(w => w.visible === true)
            if (allVisible) {
              console.log('🔄 Migrating operations dashboard: Resetting widgets for welcome message')
              const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
              setWidgets(firstLoginWidgets)
              setWidgetsLoaded(true)
              localStorage.setItem('operations-widgets', JSON.stringify(firstLoginWidgets))
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
            localStorage.setItem('operations-widgets', JSON.stringify(mergedWidgets))
          } else {
            // Invalid saved data, reset to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('operations-widgets', JSON.stringify(firstLoginWidgets))
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
        localStorage.setItem('operations-widgets', JSON.stringify(firstLoginWidgets))
      }

      // Only update layouts if they differ from initial (to avoid unnecessary re-renders)
      // The initial layouts are already loaded from localStorage in getInitialLayouts()
      // This useEffect is mainly for syncing with any external changes
      const savedLayouts = localStorage.getItem('operations-dashboard-layouts')
      if (savedLayouts) {
        try {
          const parsed = JSON.parse(savedLayouts)
          if (parsed && (parsed.lg || parsed.md || parsed.sm)) {
            const completeLayouts: Layouts = {
              lg: parsed.lg || defaultLayouts.lg || [],
              md: parsed.md || parsed.lg || defaultLayouts.md || [],
              sm: parsed.sm || parsed.md || parsed.lg || defaultLayouts.sm || [],
              xs: parsed.xs || parsed.sm || parsed.md || parsed.lg || defaultLayouts.xs || [],
            }
            // Only update if different to prevent unnecessary re-renders
            const currentLayoutsStr = JSON.stringify(layouts)
            const newLayoutsStr = JSON.stringify(completeLayouts)
            if (currentLayoutsStr !== newLayoutsStr) {
              setLayouts(completeLayouts)
            }
          }
        } catch (error) {
          console.error('Error loading layouts:', error)
        }
      }

      // Load useful links
      try {
        const savedLinks = localStorage.getItem('operations-useful-links')
        if (savedLinks) {
          setUsefulLinks(JSON.parse(savedLinks))
        }
      } catch (error) {
        console.error('Error loading useful links:', error)
      }

      setIsInitialMount(false)
    }
  }, [])

  // Save widgets to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (widgetsLoaded && widgets.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('operations-widgets', JSON.stringify(widgets))
      // Clear error if user has no visible widgets (first-time user)
      const hasVisibleWidgets = widgets.some(w => w.visible)
      if (!hasVisibleWidgets && error) {
        setError(null)
      }
    }
  }, [widgets, widgetsLoaded, error])

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
      // Save to localStorage immediately
      localStorage.setItem('operations-widgets', JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }, [])

  useEffect(() => {
    if (!isInitialMount && typeof window !== 'undefined') {
      try {
        localStorage.setItem('operations-dashboard-layouts', JSON.stringify(layouts))
      } catch (error) {
        console.error('Error saving layouts to localStorage:', error)
      }
    }
  }, [layouts, isInitialMount])

  const fetchDashboardData = async () => {
    try {
      // Don't set loading to true - fetch in background for instant load
      // Fetch real dashboard stats
      const response = await fetch('/api/operations/dashboard/stats')
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorData: any = {}
        
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const text = await response.text()
            if (text) {
              errorData = JSON.parse(text)
              errorMessage = errorData.error || errorData.message || errorData.reason || errorMessage
            }
          } else {
            // Try to get text response
            const text = await response.text()
            if (text) {
              errorMessage = text || errorMessage
            }
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
        }
        
        console.error('Dashboard stats API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          errorData,
        })
        
        // Set user-friendly error message only if user has visible widgets
        // For first-time users (no widgets), don't show permission errors
        // We'll check this in the render function instead, after widgets are loaded
        if (response.status === 403) {
          // Only set error if widgets are loaded and user has visible widgets
          // Otherwise, it's a first-time user and they should see the empty state
          if (widgetsLoaded) {
            const hasVisibleWidgets = widgets.some(w => w.visible)
            if (hasVisibleWidgets) {
              const reason = errorData.reason || 'You do not have permission to view operations dashboard statistics.'
              setError(reason)
            }
          }
        } else if (response.status === 401) {
          setError('Please log in to view dashboard statistics.')
        } else if (response.status === 500) {
          setError('Server error occurred while loading dashboard statistics. Please try again later.')
        } else {
          setError(`Unable to load dashboard statistics. ${errorMessage}`)
        }
        
        // Don't throw - use default values instead for graceful degradation
        console.warn('Using default stats values due to API error')
        return
      }
      
      // Clear any previous errors on success
      setError(null)
      const data = await response.json()

      setStats({
        totalResources: data.totalResources || 0,
        capacityUtilization: data.capacityUtilization || 0,
        attendanceRate: data.attendanceRate || 0,
        attritionRate: data.attritionRate || 0,
        activeShifts: data.activeShifts || 0,
        pendingTrainings: data.pendingTrainings || 0,
        newHires: data.newHires || 0,
        activeOnboarding: data.activeOnboarding || 0,
        avgTAT: data.avgTAT || 0,
        backlog: data.backlog || 0,
        qualityScore: data.qualityScore || 0,
        errorRate: data.errorRate || 0,
        leakageRate: data.leakageRate || 0,
        complianceRate: data.complianceRate || 0,
        pendingTrainingsCompliance: data.pendingTrainingsCompliance || 0,
        openIssues: data.openIssues || 0,
        identifiedRisks: data.identifiedRisks || 0,
        activeIncidents: data.activeIncidents || 0,
        totalInventory: data.totalInventory || 0,
        lowStockItems: data.lowStockItems || 0,
        outOfStockItems: data.outOfStockItems || 0,
        itemsInTransit: data.itemsInTransit || 0,
      })

      // Fetch trends data
      try {
        const trendsResponse = await fetch('/api/operations/dashboard/trends?type=all&months=4')
        if (trendsResponse.ok) {
          const trendsData = await trendsResponse.json()
          if (trendsData.resources) {
            setResourcesData(trendsData.resources)
          }
          if (trendsData.performance) {
            setPerformanceData(trendsData.performance)
          }
          if (trendsData.compliance) {
            setComplianceData(trendsData.compliance)
          }
        }
      } catch (err) {
        console.error('Error fetching trends data:', err)
        // Set empty arrays if trends fail
        setResourcesData([])
        setPerformanceData([])
        setComplianceData([])
      }

      // Fetch inventory category distribution
      try {
        const inventoryResponse = await fetch('/api/operations/inventory')
        if (inventoryResponse.ok) {
          const inventoryData = await inventoryResponse.json()
          const categoryCounts: Record<string, number> = {}
          inventoryData.items?.forEach((item: any) => {
            categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
          })
          const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0)
          const inventoryChartData = Object.entries(categoryCounts).map(([category, count]) => ({
            category,
            value: count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }))
          setInventoryData(inventoryChartData)
        }
      } catch (err) {
        console.error('Error fetching inventory data:', err)
        // Set empty array if inventory fetch fails
        setInventoryData([])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(`Failed to load dashboard data: ${errorMessage}`)
      
      // Set default/empty values on error to prevent UI breakage
      setStats({
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
      setResourcesData([])
      setPerformanceData([])
      setComplianceData([])
      setInventoryData([])
    } finally {
      setLoading(false)
    }
  }

  const onLayoutChange = (layout: Layout[], layouts: Layouts) => {
    // Ensure all breakpoints are included in the saved layouts
    const completeLayouts: Layouts = {
      lg: layouts.lg || [],
      md: layouts.md || layouts.lg || [],
      sm: layouts.sm || layouts.md || layouts.lg || [],
      xs: layouts.xs || layouts.sm || layouts.md || layouts.lg || [],
    }
    setLayouts(completeLayouts)
    // Save to localStorage immediately to persist across navigation
    // Only save if not during initial mount to avoid overwriting during load
    if (typeof window !== 'undefined' && !isInitialMount) {
      try {
        localStorage.setItem('operations-dashboard-layouts', JSON.stringify(completeLayouts))
      } catch (error) {
        console.error('Error saving layouts to localStorage:', error)
      }
    }
  }
  
  // Also save layouts via useEffect as backup (but onLayoutChange is primary)
  useEffect(() => {
    if (!isInitialMount && typeof window !== 'undefined') {
      try {
        localStorage.setItem('operations-dashboard-layouts', JSON.stringify(layouts))
      } catch (error) {
        console.error('Error saving layouts to localStorage:', error)
      }
    }
  }, [layouts, isInitialMount])

  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/operations/dashboard/activities?limit=5')
        if (response.ok) {
          const data = await response.json()
          setRecentActivities(data.activities || [])
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
        setRecentActivities([])
      }
    }
    fetchActivities()
  }, [])

  // Task-related functions
  const toggleFullscreen = (widgetId: string) => {
    if (fullscreenWidget === widgetId) {
      setFullscreenWidget(null)
    } else {
      setFullscreenWidget(widgetId)
    }
  }

  const fetchUserTasks = async () => {
    try {
      const response = await fetch('/api/tasks?includeCreated=true')
      if (response.ok) {
        const data = await response.json()
        setUserTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  useEffect(() => {
    fetchUserTasks()

    // Fetch active timer
    const fetchActiveTimer = async () => {
      try {
        const response = await fetch('/api/time-tracking/active')
        if (response.ok) {
          const data = await response.json()
          if (data.timeLog) {
            setActiveTimer(data.timeLog)
            const startTime = new Date(data.timeLog.startTime).getTime()
            const updateTimer = () => {
              const elapsed = Math.floor((Date.now() - startTime) / 1000)
              setTimerSeconds({ [data.timeLog.taskId]: elapsed })
            }
            updateTimer()
            const interval = setInterval(updateTimer, 1000)
            return () => clearInterval(interval)
          }
        }
      } catch (error) {
        console.error('Error fetching active timer:', error)
      }
    }
    fetchActiveTimer()
  }, [])

  // Save taskViewMode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('task-view-mode', taskViewMode)
    } catch (error) {
      console.error('Error saving task view mode to localStorage:', error)
    }
  }, [taskViewMode])

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins < 60) return `${mins}m ${secs}s`
    const hrs = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hrs}h ${remainingMins}m`
  }

  // Get filtered tasks
  const getFilteredTasks = () => {
    let filtered = userTasks.filter(task => task.assigneeId === user?.id)

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

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await fetchUserTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }, [userTasks])

  // Kanban drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent, taskId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    dragRef.current = {
      taskId,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      element: target,
      offsetX,
      offsetY
    }

    setDraggingTaskId(taskId)
    draggingTaskIdRef.current = taskId
    target.setPointerCapture(e.pointerId)

    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return

        const element = dragRef.current.element
        if (element) {
          const deltaX = e.clientX - dragRef.current.startX
          const deltaY = e.clientY - dragRef.current.startY
          element.style.transform = `translate(${deltaX}px, ${deltaY}px)`
          element.style.opacity = '0.8'
          element.style.zIndex = '1000'
        }

        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        let foundColumn: string | null = null

        for (const el of elements) {
          const columnId = (el as HTMLElement).dataset?.columnId || (el as HTMLElement).dataset?.dropZone
          if (columnId && columnId !== lastColumnCheckRef.current) {
            foundColumn = columnId
            lastColumnCheckRef.current = columnId
            break
          }
        }

        if (foundColumn && foundColumn !== dragOverColumnIdRef.current) {
          dragOverColumnIdRef.current = foundColumn
          setDragOverColumnId(foundColumn)
        } else if (!foundColumn && dragOverColumnIdRef.current) {
          dragOverColumnIdRef.current = null
          setDragOverColumnId(null)
        }
      })
    }

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return

      const targetColumnId = dragOverColumnIdRef.current
      const taskId = dragRef.current.taskId

      if (targetColumnId) {
        const task = userTasks.find((t: any) => t.id === taskId)
        if (task && task.status !== targetColumnId) {
          await updateTaskStatus(taskId, targetColumnId)
        }
      }

      const element = dragRef.current.element
      if (element) {
        element.style.transform = ''
        element.style.opacity = ''
        element.style.zIndex = ''
        element.releasePointerCapture(e.pointerId)
      }

      dragRef.current = null
      setDraggingTaskId(null)
      draggingTaskIdRef.current = null
      setDragOverColumnId(null)
      dragOverColumnIdRef.current = null
      lastColumnCheckRef.current = null

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerCancel)
    }

    const handleGlobalPointerCancel = () => {
      if (!dragRef.current) return

      const element = dragRef.current.element
      if (element) {
        element.style.transform = ''
        element.style.opacity = ''
        element.style.zIndex = ''
        element.releasePointerCapture(dragRef.current.pointerId)
      }

      dragRef.current = null
      setDraggingTaskId(null)
      draggingTaskIdRef.current = null
      setDragOverColumnId(null)
      dragOverColumnIdRef.current = null
      lastColumnCheckRef.current = null

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerCancel)
    }

    document.addEventListener('pointermove', handleGlobalPointerMove)
    document.addEventListener('pointerup', handleGlobalPointerUp)
    document.addEventListener('pointercancel', handleGlobalPointerCancel)
  }, [userTasks, updateTaskStatus])

  // Gantt chart helpers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gantt-groups')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setGanttGroups(parsed)
          setGanttGroupsLoaded(true)
        } catch (error) {
          console.error('Error loading gantt groups:', error)
          setGanttGroupsLoaded(true)
        }
      } else {
        setGanttGroupsLoaded(true)
      }
    }
  }, [])

  useEffect(() => {
    if (ganttGroups.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('gantt-groups', JSON.stringify(ganttGroups))
    }
  }, [ganttGroups])

  // Sync tasks from userTasks into ganttGroups
  useEffect(() => {
    if (userTasks.length === 0 || !ganttGroupsLoaded) return

    setGanttGroups(prevGroups => {
      const taskIdsInGroup = new Set<string>()
      prevGroups.forEach(group => {
        group.tasks.forEach((task: any) => {
          taskIdsInGroup.add(task.id)
        })
      })

      const updatedGroups = prevGroups.map(group => {
        const updatedTasks = group.tasks.map((groupTask: any) => {
          const latestTask = userTasks.find((t: any) => t.id === groupTask.id)
          if (latestTask) {
            return {
              ...groupTask,
              ...latestTask,
              parentTaskId: groupTask.parentTaskId || groupTask.parentId
            }
          }
          return groupTask
        })

        const newTasks = userTasks.filter((t: any) => {
          if (taskIdsInGroup.has(t.id)) return false
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

  const toggleGroupExpanded = (groupId: string) => {
    setGanttGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, expanded: !group.expanded } : group
    ))
  }

  const addGanttGroup = () => {
    if (!newGanttGroupName.trim()) return
    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGanttGroupName,
      expanded: true,
      tasks: []
    }
    setGanttGroups(prev => [...prev, newGroup])
    setNewGanttGroupName('')
    setIsAddingGanttGroup(false)
  }

  const addTaskToGanttGroup = async (groupId: string) => {
    setAddingTaskToGroup(groupId)
    setSelectedTaskId(null)
    setTaskDialogOpen(true)
  }

  const deleteGanttGroup = (groupId: string) => {
    setGanttGroups(prev => prev.filter(group => group.id !== groupId))
  }

  const deleteGanttTask = (groupId: string, taskId: string) => {
    setGanttGroups(prev => prev.map(group =>
      group.id === groupId
        ? { ...group, tasks: group.tasks.filter((t: any) => t.id !== taskId && (t.parentTaskId !== taskId && t.parentId !== taskId)) }
        : group
    ))
  }

  const getTimelineDates = () => {
    const dates: Date[] = []
    const start = new Date(ganttTimelineStart)
    start.setDate(start.getDate() - 7)

    if (ganttViewMode === 'days') {
      for (let i = 0; i < 60; i++) {
        dates.push(addDays(start, i))
      }
    } else if (ganttViewMode === 'weeks') {
      for (let i = 0; i < 26; i++) {
        dates.push(addDays(start, i * 7))
      }
    } else {
      for (let i = 0; i < 12; i++) {
        const date = new Date(start)
        date.setMonth(date.getMonth() + i)
        dates.push(date)
      }
    }
    return dates
  }

  const getDateWidth = () => {
    if (ganttViewMode === 'days') return 60
    if (ganttViewMode === 'weeks') return 120
    return 200
  }

  const getTaskPosition = (startDate: Date, endDate: Date) => {
    const timelineDates = getTimelineDates()
    const dateWidth = getDateWidth()
    const timelineStart = timelineDates[0]

    const startDiff = Math.floor((startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const endDiff = Math.floor((endDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))

    let left = 0
    let width = 0

    if (ganttViewMode === 'days') {
      left = startDiff * dateWidth
      width = (endDiff - startDiff + 1) * dateWidth
    } else if (ganttViewMode === 'weeks') {
      left = Math.floor(startDiff / 7) * dateWidth
      width = Math.ceil((endDiff - startDiff) / 7) * dateWidth
    } else {
      const startMonth = startDate.getMonth() + startDate.getFullYear() * 12
      const endMonth = endDate.getMonth() + endDate.getFullYear() * 12
      const timelineStartMonth = timelineStart.getMonth() + timelineStart.getFullYear() * 12
      left = (startMonth - timelineStartMonth) * dateWidth
      width = (endMonth - startMonth + 1) * dateWidth
    }

    return { left, width }
  }

  const getAllTasksWithPositions = () => {
    const tasksWithPositions: Array<{ task: any; position: { left: number; width: number } }> = []
    ganttGroups.forEach(group => {
      if (group.expanded) {
        group.tasks.forEach((task: any) => {
          if (!task.parentTaskId && !task.parentId) {
            const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date()
            const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)
            const position = getTaskPosition(startDate, endDate)
            tasksWithPositions.push({ task, position })
          }
        })
      }
    })
    return tasksWithPositions
  }

  const getDependencyConnectors = () => {
    const connectors: Array<{ fromX: number; fromY: number; toX: number; toY: number; fromTask: any; toTask: any }> = []
    const tasksWithPositions = getAllTasksWithPositions()
    const dateWidth = getDateWidth()
    const rowHeight = 40

    tasksWithPositions.forEach((item, idx) => {
      const task = item.task
      if (task.dependencies && Array.isArray(task.dependencies)) {
        task.dependencies.forEach((depId: string) => {
          const depItem = tasksWithPositions.find(t => t.task.id === depId)
          if (depItem) {
            const fromX = item.position.left + item.position.width
            const fromY = idx * rowHeight + rowHeight / 2
            const toX = depItem.position.left
            const toY = tasksWithPositions.findIndex(t => t.task.id === depId) * rowHeight + rowHeight / 2
            connectors.push({
              fromX,
              fromY,
              toX,
              toY,
              fromTask: item.task,
              toTask: depItem.task
            })
          }
        })
      }
    })

    return connectors
  }

  const getTodayPosition = () => {
    const timelineDates = getTimelineDates()
    const dateWidth = getDateWidth()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (ganttViewMode === 'days') {
      const daysDiff = Math.floor((today.getTime() - timelineDates[0].getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff * dateWidth
    } else if (ganttViewMode === 'weeks') {
      const daysDiff = Math.floor((today.getTime() - timelineDates[0].getTime()) / (1000 * 60 * 60 * 24))
      return Math.floor(daysDiff / 7) * dateWidth
    } else {
      const todayMonth = today.getMonth() + today.getFullYear() * 12
      const timelineStartMonth = timelineDates[0].getMonth() + timelineDates[0].getFullYear() * 12
      return (todayMonth - timelineStartMonth) * dateWidth
    }
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
      localStorage.setItem('operations-task-colors', JSON.stringify(newColors))
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
      localStorage.setItem('operations-task-colors', JSON.stringify(newColors))
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
          notes
        })
      })

      if (response.ok) {
        const data = await response.json()
        setActiveTimer(data.timeLog)
        setTimerSeconds({ [pendingTimerTask.id]: 0 })
        const startTime = Date.now()
        const interval = setInterval(() => {
          setTimerSeconds(prev => ({
            ...prev,
            [pendingTimerTask.id]: Math.floor((Date.now() - startTime) / 1000)
          }))
        }, 1000)
        // Store interval ID for cleanup if needed
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
                Showing {filteredTasks.length} of {userTasks.filter(task => task.assigneeId === user?.id).length} tasks
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
              ) : userTasks.filter(task => task.assigneeId === user?.id).length === 0 ? (
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
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No recent activities
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`p-2 rounded-full ${activity.type === 'DISTRIBUTION' ? 'bg-blue-100 dark:bg-blue-900/30' :
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
              )}
            </CardContent>
          </Card>
        )

      case 'myTasks':
        return renderMyTasksWidget()

      case 'metrics':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Key Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Total Resources</div>
                  <div className="text-sm font-semibold mt-1">{stats.totalResources}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Capacity Utilization</div>
                  <div className="text-sm font-semibold mt-1">{stats.capacityUtilization}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Attendance Rate</div>
                  <div className="text-sm font-semibold mt-1">{stats.attendanceRate}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Attrition Rate</div>
                  <div className="text-sm font-semibold mt-1">{stats.attritionRate}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Avg TAT</div>
                  <div className="text-sm font-semibold mt-1">{stats.avgTAT}h</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Backlog</div>
                  <div className="text-sm font-semibold mt-1">{stats.backlog}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Quality Score</div>
                  <div className="text-sm font-semibold mt-1">{stats.qualityScore}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Error Rate</div>
                  <div className="text-sm font-semibold mt-1">{stats.errorRate}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Compliance Rate</div>
                  <div className="text-sm font-semibold mt-1">{stats.complianceRate}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Open Issues</div>
                  <div className="text-sm font-semibold mt-1">{stats.openIssues}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Total Inventory</div>
                  <div className="text-sm font-semibold mt-1">{stats.totalInventory}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Low Stock Items</div>
                  <div className="text-sm font-semibold mt-1">{stats.lowStockItems}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 'usefulLinks':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Useful Links</CardTitle>
              <CardDescription className="text-xs">Quick access to frequently visited resources</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newLinkTitle && newLinkUrl) {
                        const newLink = {
                          id: Date.now().toString(),
                          title: newLinkTitle,
                          url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
                        }
                        const updated = [...usefulLinks, newLink]
                        setUsefulLinks(updated)
                        localStorage.setItem('operations-useful-links', JSON.stringify(updated))
                        setNewLinkTitle('')
                        setNewLinkUrl('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {usefulLinks.length > 0 ? (
                  <div className="space-y-2">
                    {usefulLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent group">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 flex-1 text-sm"
                        >
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            const updated = usefulLinks.filter(l => l.id !== link.id)
                            setUsefulLinks(updated)
                            localStorage.setItem('operations-useful-links', JSON.stringify(updated))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                    <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No links saved yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your frequently visited links above</p>
                  </div>
                )}
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

  const widgetIds = [
    // Key Operational Metrics
    'metrics',
    // Quick Actions
    'quick-actions',
    // My Tasks
    'myTasks',
    // Useful Links
    'usefulLinks',
    // Mind Map & Canvas
    'mindMap',
    'canvas',
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
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Operations Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Get started by adding your first widgets and data.
          </p>
          <p className="text-muted-foreground mb-8">
            Once you start adding widgets, you'll see beautiful visualizations and insights here.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={() => {
                // Open widget gallery dialog
                setWidgetGalleryOpen(true)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Navigate to tasks page or toggle myTasks widget
                const myTasksWidget = widgets.find(w => w.id === 'myTasks')
                if (myTasksWidget) {
                  toggleWidget('myTasks')
                } else {
                  router.push('/operations-dashboard/tasks')
                }
              }}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              View Tasks
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <OperationsPageLayout widgets={widgets} toggleWidget={toggleWidget}>
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
                Welcome to Your Operations Dashboard
              </p>
            </div>
            
            {/* Error Message - Only show if user has visible widgets (not a first-time user) */}
            {error && hasVisibleWidgets && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-6 px-2"
                    onClick={() => {
                      setError(null)
                      fetchDashboardData()
                    }}
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>

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
        </>
      )}

      {/* Fullscreen Widget */}
      {fullscreenWidget === 'myTasks' && renderMyTasksWidget()}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onClose={() => {
          setTaskDialogOpen(false)
          setSelectedTaskId(null)
          setAddingTaskToGroup(null)
        }}
        onSubmit={async (data) => {
          try {
            const taskData = addingTaskToGroup
              ? { ...data, parentId: addingTaskToGroup }
              : data

            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData),
            })

            if (response.ok) {
              await fetchUserTasks()
              setTaskDialogOpen(false)
              setSelectedTaskId(null)
              setAddingTaskToGroup(null)
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

      {/* Widget Gallery Dialog */}
      <WidgetGalleryDialog
        open={widgetGalleryOpen}
        onOpenChange={setWidgetGalleryOpen}
        widgets={widgets}
        toggleWidget={toggleWidget}
      />
    </OperationsPageLayout>
  )
}

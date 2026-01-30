'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GripVertical } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import type { Layout, Layouts } from 'react-grid-layout'
// Dynamic imports for heavy libraries - loaded only when needed
const ResponsiveGridLayout = dynamic(
  () => import('react-grid-layout').then(mod => {
    const { WidthProvider, Responsive } = mod
    return WidthProvider(Responsive)
  }),
  {
    ssr: false,
    loading: () => <div className="h-screen w-full" />
  }
)
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Dynamic imports for recharts components - large library
const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => mod.ResponsiveContainer),
  { ssr: false }
)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false })
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false })
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false })
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false })

// Lighter recharts components can be imported normally
import {
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  UserPlus,
  Target,
  Building2,
  Users,
  FileText,
  ShoppingCart,
  LayoutGrid,
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Calendar,
  Activity,
  TrendingDown,
  Zap,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Filter,
  List,
  History,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Maximize,
  Minimize,
  Play,
  Pause,
  X,
  Bot,
  Mic,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { useAuthStore } from '@/stores/authStore'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
// Dynamic imports for dialogs - only load when opened
const TaskDialog = dynamic(() => import('@/components/dialogs/task-dialog').then(mod => ({ default: mod.TaskDialog })), { ssr: false })
const TaskDetailDialog = dynamic(() => import('@/components/dialogs/task-detail-dialog').then(mod => ({ default: mod.TaskDetailDialog })), { ssr: false })
const TimeTrackingDialog = dynamic(() => import('@/components/dialogs/time-tracking-dialog').then(mod => ({ default: mod.TimeTrackingDialog })), { ssr: false })
const TimerNotesDialog = dynamic(() => import('@/components/dialogs/timer-notes-dialog').then(mod => ({ default: mod.TimerNotesDialog })), { ssr: false })

// Dynamic imports for heavy widgets - only load when widget is visible
const MyTasksWidget = dynamic(() => import('@/components/widgets/MyTasksWidget').then(mod => ({ default: mod.MyTasksWidget })), {
  ssr: false
})
const QuickActionsWidget = dynamic(() => import('@/components/widgets/QuickActionsWidget').then(mod => ({ default: mod.QuickActionsWidget })), {
  ssr: false
})
const UsefulLinksWidget = dynamic(() => import('@/components/widgets/UsefulLinksWidget').then(mod => ({ default: mod.UsefulLinksWidget })), {
  ssr: false
})
const AdvancedMindMapWidget = dynamic(() => import('@/components/widgets/AdvancedMindMapWidget').then(mod => ({ default: mod.AdvancedMindMapWidget })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})
const AdvancedCanvasWidget = dynamic(() => import('@/components/widgets/AdvancedCanvasWidget').then(mod => ({ default: mod.AdvancedCanvasWidget })), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
})

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d', '#8dd1e1', '#d084d0']

interface SalesData {
  leads: any[]
  opportunities: any[]
  accounts: any[]
  contacts: any[]
  quotes: any[]
  orders: any[]
  activities: any[]
}

interface Widget {
  id: string
  type: string
  visible: boolean
}

// Default sales widgets
const defaultSalesWidgets: Widget[] = [
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
  // Analytics Widgets
  { id: 'forecast', type: 'forecast', visible: false },
  { id: 'metrics', type: 'metrics', visible: true },
  // Finance Widgets
  { id: 'invoices', type: 'invoices', visible: false },
  { id: 'expenses', type: 'expenses', visible: false },
  // Sales Tools
  { id: 'filters', type: 'filters', visible: false },
  { id: 'schedule', type: 'schedule', visible: false },
  { id: 'help', type: 'help', visible: false },
  // General Widgets
  { id: 'stats', type: 'stats', visible: false },
  { id: 'myTasks', type: 'myTasks', visible: true },
  { id: 'assignedToOthers', type: 'assignedToOthers', visible: false },
  { id: 'activeOKRs', type: 'activeOKRs', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'forms', type: 'forms', visible: false },
  // Planning Widgets
  { id: 'roadmap', type: 'roadmap', visible: false },
  { id: 'ganttChart', type: 'ganttChart', visible: false },
  // Issues Widgets
  { id: 'blockers', type: 'blockers', visible: false },
  // Resources Widgets
  { id: 'teamCapacity', type: 'teamCapacity', visible: false },
  // Projects Widgets
  { id: 'recentProjects', type: 'recentProjects', visible: false },
  // Tools Widgets
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
]

function SalesDashboardPageInner() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [salesData, setSalesData] = useState<SalesData>({
    leads: [],
    opportunities: [],
    accounts: [],
    contacts: [],
    quotes: [],
    orders: [],
    activities: [],
  })
  const [hasAnyData, setHasAnyData] = useState(false)
  const [overviewData, setOverviewData] = useState<any>(null)
  const [loadingOverview, setLoadingOverview] = useState(false)
  // Initialize layouts from localStorage immediately to prevent default overwrite
  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sales-dashboard-layout')
      if (saved) {
        try {
          const parsedLayouts = JSON.parse(saved)
          // Validate and sanitize layouts to ensure all items have valid properties
          const sanitizedLayouts: Layouts = {
            lg: (parsedLayouts.lg || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ),
            md: (parsedLayouts.md || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ),
            sm: (parsedLayouts.sm || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ),
            xs: (parsedLayouts.xs || []).filter((item: any): item is Layout =>
              item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
            ),
          }
          // Only return if we have valid layouts
          if (sanitizedLayouts.lg.length > 0 || sanitizedLayouts.md.length > 0 || sanitizedLayouts.sm.length > 0 || sanitizedLayouts.xs.length > 0) {
            return sanitizedLayouts
          }
        } catch (error) {
          console.error('Error loading layout from localStorage in useState:', error)
        }
      }
    }
    return {
      lg: [],
      md: [],
      sm: [],
      xs: [],
    }
  })
  const [widgets, setWidgets] = useState<Widget[]>(defaultSalesWidgets)
  const [userTasks, setUserTasks] = useState<any[]>([])
  const user = useAuthStore((state) => state.user)

  // Task filters and view state
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  // Initialize with default value to avoid hydration mismatch
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar' | 'kanban' | 'gantt'>('gantt')
  // Initialize with null to avoid hydration mismatch, set in useEffect
  const [calendarDate, setCalendarDate] = useState<Date | null>(null)

  // Kanban drag and drop state - Pointer-based (no HTML5 drag)
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
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; visible: boolean } | null>(null)
  const draggingTaskIdRef = useRef<string | null>(null)
  const dragOverColumnIdRef = useRef<string | null>(null)
  const dragPreviewRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastColumnCheckRef = useRef<string | null>(null)

  // Keep refs in sync with state for use in event handlers
  useEffect(() => {
    draggingTaskIdRef.current = draggingTaskId
  }, [draggingTaskId])

  useEffect(() => {
    dragOverColumnIdRef.current = dragOverColumnId
  }, [dragOverColumnId])

  // Gantt chart state
  const [ganttGroups, setGanttGroups] = useState<Array<{ id: string; name: string; expanded: boolean; tasks: any[] }>>([])
  // Initialize with null to avoid hydration mismatch, set in useEffect
  const [ganttTimelineStart, setGanttTimelineStart] = useState<Date | null>(null)
  const [ganttViewMode, setGanttViewMode] = useState<'days' | 'weeks' | 'months'>('days')
  const [isAddingGanttGroup, setIsAddingGanttGroup] = useState(false)
  const [newGanttGroupName, setNewGanttGroupName] = useState('')
  const [addingTaskToGroup, setAddingTaskToGroup] = useState<string | null>(null)
  const [ganttColorScheme, setGanttColorScheme] = useState<'default' | 'status' | 'priority' | 'assignee'>('default')
  const [ganttShowAllTasks, setGanttShowAllTasks] = useState(true)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set())
  const datesInitializedRef = useRef(false)
  const [hoveredConnector, setHoveredConnector] = useState<number | null>(null)
  const [connectorMousePos, setConnectorMousePos] = useState<{ x: number; y: number } | null>(null)

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

  // Quick actions for sales dashboard
  const salesQuickActions = [
    {
      id: 'new-lead',
      label: 'New Lead',
      icon: UserPlus,
      href: '/sales-dashboard/leads?create=true',
      variant: 'outline' as const,
    },
    {
      id: 'new-deal',
      label: 'New Deal',
      icon: Target,
      href: '/sales-dashboard/opportunities?create=true',
      variant: 'outline' as const,
    },
    {
      id: 'new-contact',
      label: 'New Contact',
      icon: Users,
      href: '/sales-dashboard/contacts?create=true',
      variant: 'outline' as const,
    },
    {
      id: 'new-account',
      label: 'New Account',
      icon: Building2,
      href: '/sales-dashboard/accounts?create=true',
      variant: 'outline' as const,
    },
    {
      id: 'log-activity',
      label: 'Log Activity',
      icon: Calendar,
      href: '/sales-dashboard/activities?create=true',
      variant: 'outline' as const,
    },
    {
      id: 'new-task',
      label: 'New Task',
      icon: CheckCircle2,
      onClick: () => setTaskDialogOpen(true),
      variant: 'outline' as const,
    },
  ]

  // Fullscreen state
  const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)

  // Optimized: Batch API calls and localStorage operations
  useEffect(() => {
    // Useful links are now managed by the centralized UsefulLinksWidget component

    // Load layout and widgets (synchronous)
    loadSavedLayout()
    loadSavedWidgets()

    // Batch all API calls to run in parallel (major performance improvement)
    if (user?.id) {
      Promise.all([
        fetchAllSalesData(),
        fetchOverviewData(),
        fetchUserTasks(),
        checkActiveTimer(),
      ]).catch(error => {
        console.error('Error fetching dashboard data:', error)
      })
    } else {
      // Load non-user-dependent data immediately
      Promise.all([
        fetchAllSalesData(),
        fetchOverviewData(),
      ]).catch(error => {
        console.error('Error fetching sales data:', error)
      })
    }
  }, [user?.id])

  // Listen for refresh events from lead/opportunity pages
  useEffect(() => {
    const handleRefreshTasks = () => {
      if (user?.id) {
        console.log('Refreshing tasks due to nextContactDate update')
        fetchUserTasks()
      }
    }

    window.addEventListener('refreshSalesTasks', handleRefreshTasks)
    return () => window.removeEventListener('refreshSalesTasks', handleRefreshTasks)
  }, [user?.id])

  // Check for active timer on mount - memoized to prevent recreation
  const checkActiveTimer = useCallback(async () => {
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
  }, [])

  // Optimized: Batch all localStorage reads in a single useEffect
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      // Initialize dates (only once)
      if (!datesInitializedRef.current) {
        setCalendarDate(new Date())
        setGanttTimelineStart(new Date())
        datesInitializedRef.current = true
      }

      // Batch all localStorage reads
      const taskViewModeSaved = localStorage.getItem('task-view-mode')
      const taskColorsSaved = localStorage.getItem('sales-task-colors')

      // Set task view mode
      if (taskViewModeSaved && ['list', 'calendar', 'kanban', 'gantt'].includes(taskViewModeSaved)) {
        setTaskViewMode(taskViewModeSaved as 'list' | 'calendar' | 'kanban' | 'gantt')
      } else {
        setTaskViewMode('gantt')
        localStorage.setItem('task-view-mode', 'gantt')
      }

      // Set task colors
      if (taskColorsSaved) {
        setTaskColors(JSON.parse(taskColorsSaved))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
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

  // Update timer seconds for active timer
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        const startTime = new Date(activeTimer.startTime).getTime()
        const now = Date.now()
        const seconds = Math.floor((now - startTime) / 1000)
        setTimerSeconds(prev => ({ ...prev, [activeTimer.taskId]: seconds }))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setFullscreenWidget(null)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Fetch user's tasks (including sales activities and opportunities with due dates)
  const fetchUserTasks = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('No user ID, skipping task fetch')
        return
      }

      console.log('Fetching tasks for user:', user.id)
      // Fetch regular tasks - tasks assigned to user or created by user
      const tasksResponse = await fetch(`/api/tasks?includeCreated=true`)
      let allTasks: any[] = []

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        console.log('Fetched tasks from API:', tasksData.tasks?.length || 0, 'tasks')
        console.log('Raw tasks data:', tasksData.tasks?.slice(0, 3))

        allTasks = (tasksData.tasks || []).map((task: any) => {
          // If task has sourceType, use it to determine source
          if (task.sourceType === 'sales-lead') {
            console.log('Found sales-lead task:', task.id, task.title, task.dueDate, task.assigneeId, task.sourceId)
            return {
              ...task,
              source: 'lead',
              sourceId: task.sourceId || task.id,
              sourceType: 'sales-lead',
            }
          } else if (task.sourceType === 'sales-opportunity') {
            console.log('Found sales-opportunity task:', task.id, task.title, task.dueDate, task.assigneeId, task.sourceId)
            return {
              ...task,
              source: 'opportunity',
              sourceId: task.sourceId || task.id,
              sourceType: 'sales-opportunity',
            }
          } else {
            return {
              ...task,
              source: 'task',
              sourceId: task.id,
            }
          }
        })
        console.log('Mapped tasks:', allTasks.length, 'total tasks')
      } else {
        const errorData = await tasksResponse.json().catch(() => ({}))
        console.error('Error fetching tasks:', tasksResponse.status, errorData)
      }

      // Fetch sales activities with due dates assigned to user
      try {
        const activitiesResponse = await fetch(`/api/sales/activities?assignedToId=${user?.id}`)
        if (activitiesResponse.ok) {
          const activities = await activitiesResponse.json()
          const activitiesWithDueDate = (activities || [])
            .filter((activity: any) => activity.dueDate)
            .map((activity: any) => ({
              id: `activity-${activity.id}`,
              title: `${activity.type || 'Activity'}: ${activity.subject || activity.description || 'No subject'}`,
              dueDate: activity.dueDate,
              status: activity.status || 'TODO',
              priority: activity.priority || 'MEDIUM',
              source: 'activity',
              sourceId: activity.id,
              sourceType: 'sales-activity',
              project: activity.account ? { name: activity.account.name } : activity.opportunity ? { name: activity.opportunity.name } : null,
              assigneeId: activity.assignedToId,
              createdAt: activity.createdAt,
              description: activity.description,
              activityType: activity.type,
              account: activity.account,
              opportunity: activity.opportunity,
              lead: activity.lead,
              contact: activity.contact,
            }))
          allTasks = [...allTasks, ...activitiesWithDueDate]
        }
      } catch (error) {
        console.error('Error fetching sales activities:', error)
      }

      // Note: We're not fetching opportunities with expectedCloseDate anymore
      // Tasks are now created automatically from nextContactDate
      // This prevents duplicate entries and ensures tasks show up correctly

      console.log('Final allTasks count:', allTasks.length)
      console.log('Tasks with sourceType sales-lead:', allTasks.filter((t: any) => t.sourceType === 'sales-lead').length)
      console.log('Tasks with sourceType sales-opportunity:', allTasks.filter((t: any) => t.sourceType === 'sales-opportunity').length)
      console.log('Sample tasks:', allTasks.slice(0, 5).map((t: any) => ({ id: t.id, title: t.title, sourceType: t.sourceType, sourceId: t.sourceId, dueDate: t.dueDate, assigneeId: t.assigneeId })))
      setUserTasks(allTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [user?.id])

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

  // Get filtered tasks - memoized to prevent recalculation on every render
  const getFilteredTasks = useCallback(() => {
    let filtered = [...userTasks]

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    // Due date filter
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
  }, [userTasks, statusFilter, priorityFilter, dueDateFilter])

  // Memoize filtered tasks result to avoid recalculation
  const filteredTasks = useMemo(() => getFilteredTasks(), [userTasks, statusFilter, priorityFilter, dueDateFilter])

  // Fullscreen toggle function - memoized to prevent recreation
  const toggleFullscreen = useCallback((widgetId: string) => {
    if (fullscreenWidget === widgetId) {
      setFullscreenWidget(null)
    } else {
      setFullscreenWidget(widgetId)
    }
  }, [fullscreenWidget])

  // Update task status (for Kanban drag and drop)
  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    try {
      // Only update regular tasks (not activities)
      const task = userTasks.find((t: any) => t.id === taskId)
      if (!task || task.source !== 'task') {
        return // Don't update activities or other source types
      }

      // Optimistic update
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
        console.error('Failed to update task status')
        // Revert on error by refreshing
        fetchUserTasks()
      }
      // Success - state already updated optimistically
    } catch (error) {
      console.error('Error updating task status:', error)
      // Revert on error by refreshing
      fetchUserTasks()
    }
  }, [userTasks, fetchUserTasks])

  // Kanban drag handlers - Pointer-based (no HTML5 drag)
  const onPointerDown = (e: React.PointerEvent, taskId: string) => {
    if (e.button !== 0) return // Only handle left mouse button

    const element = e.currentTarget as HTMLElement
    element.setPointerCapture(e.pointerId)

    // Clone element for drag preview
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
    // Remove transitions from cloned element
    cloned.className = cloned.className.replace(/transition-[^ ]*/g, '')

    // Calculate offset from card top-left to click position
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top

    // Position drag preview at cursor immediately with proper offset
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

    // Initialize drag preview as visible immediately
    setDragPreview({ x: e.clientX, y: e.clientY, visible: true })
  }

  // Global pointer handlers for dragging across elements
  useEffect(() => {
    // Always attach listeners - they check dragRef.current internally
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return

      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }

      // Use RAF for smooth updates
      rafRef.current = requestAnimationFrame(() => {
        if (!dragRef.current) return

        const dx = Math.abs(e.clientX - dragRef.current.startX)
        const dy = Math.abs(e.clientY - dragRef.current.startY)

        // Always update drag preview position to follow cursor from the start
        // Maintain the offset from where user clicked on the card
        if (dragRef.current.element && dragRef.current.offsetX !== undefined && dragRef.current.offsetY !== undefined) {
          dragRef.current.element.style.top = `${e.clientY - dragRef.current.offsetY}px`
          dragRef.current.element.style.left = `${e.clientX - dragRef.current.offsetX}px`
          setDragPreview({ x: e.clientX, y: e.clientY, visible: true })
        }

        // Activate drag state if moved more than 6px (for status update logic)
        if (!draggingTaskIdRef.current && (dx > 6 || dy > 6)) {
          setDraggingTaskId(dragRef.current.taskId)
        }

        // Update drag over column during drag (check if we've moved enough to activate drag)
        const isDragging = draggingTaskIdRef.current || (dx > 6 || dy > 6)
        if (isDragging) {
          // Throttle column detection to reduce flickering
          const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
          if (elementBelow) {
            // Find the column container or drop zone
            const columnElement = elementBelow.closest('[data-column-id]') as HTMLElement
            const dropZone = elementBelow.closest('[data-drop-zone]') as HTMLElement

            let newColumnId: string | null = null
            if (columnElement) {
              newColumnId = columnElement.getAttribute('data-column-id')
            } else if (dropZone) {
              newColumnId = dropZone.getAttribute('data-drop-zone')
            }

            // Only update if column changed (reduces unnecessary state updates)
            if (newColumnId !== lastColumnCheckRef.current) {
              lastColumnCheckRef.current = newColumnId
              setDragOverColumnId(newColumnId)
            }
          }
        }
      })
    }

    const handleGlobalPointerUp = async (e: PointerEvent) => {
      // Cancel any pending RAF
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

      // Check current dragging state using ref
      const isDragging = draggingTaskIdRef.current || (dx > 6 || dy > 6)

      // Clean up drag preview
      if (dragElement && dragElement.parentNode) {
        dragElement.parentNode.removeChild(dragElement)
      }
      setDragPreview(null)

      // Release pointer capture
      try {
        const capturedElement = document.elementFromPoint(e.clientX, e.clientY)
        if (capturedElement && 'releasePointerCapture' in capturedElement) {
          (capturedElement as HTMLElement).releasePointerCapture(pointerId)
        }
      } catch (err) {
        // Ignore if already released
      }

      // If we were dragging and have a target column, update status
      if (isDragging) {
        // Get the column we're over at drop time
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

        // Fallback to dragOverColumnIdRef if element lookup fails
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

      // Reset drag state
      dragRef.current = null
      setDraggingTaskId(null)
      setDragOverColumnId(null)
      lastColumnCheckRef.current = null
    }

    const handleGlobalPointerCancel = () => {
      // Cancel any pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      if (dragRef.current) {
        const pointerId = dragRef.current.pointerId
        const dragElement = dragRef.current.element

        // Clean up drag preview
        if (dragElement && dragElement.parentNode) {
          dragElement.parentNode.removeChild(dragElement)
        }
        setDragPreview(null)

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

    // Always attach listeners - they check dragRef.current internally
    document.addEventListener('pointermove', handleGlobalPointerMove)
    document.addEventListener('pointerup', handleGlobalPointerUp)
    document.addEventListener('pointercancel', handleGlobalPointerCancel)

    return () => {
      // Clean up pending RAF
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      // Clean up drag preview if still exists
      if (dragRef.current?.element && dragRef.current.element.parentNode) {
        dragRef.current.element.parentNode.removeChild(dragRef.current.element)
      }

      document.removeEventListener('pointermove', handleGlobalPointerMove)
      document.removeEventListener('pointerup', handleGlobalPointerUp)
      document.removeEventListener('pointercancel', handleGlobalPointerCancel)
    }
  }, [userTasks, updateTaskStatus])

  // Gantt chart helpers - Groups are only created manually by users

  const toggleGroupExpanded = (groupId: string) => {
    setGanttGroups(groups =>
      groups.map(g => g.id === groupId ? { ...g, expanded: !g.expanded } : g)
    )
  }

  // Track if localStorage has been loaded to prevent race conditions
  const [ganttGroupsLoaded, setGanttGroupsLoaded] = useState(false)

  // Load ganttGroups from localStorage on mount
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

  // Save ganttGroups to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (!ganttGroupsLoaded) return // Don't save until after initial load

    try {
      localStorage.setItem('gantt-groups', JSON.stringify(ganttGroups))
    } catch (error) {
      console.error('Error saving gantt groups to localStorage:', error)
    }
  }, [ganttGroups, ganttGroupsLoaded])

  // Sync tasks from userTasks into ganttGroups when tasks are loaded
  // This ensures that tasks in groups are updated with latest data from the database
  useEffect(() => {
    if (userTasks.length === 0 || !ganttGroupsLoaded) return

    setGanttGroups(prevGroups => {
      // Don't sync if no groups exist yet
      if (prevGroups.length === 0) return prevGroups

      const updatedGroups = prevGroups.map(group => {
        // Get all task IDs currently in this group
        const taskIdsInGroup = new Set(group.tasks.map((t: any) => t.id))

        // Update existing tasks with latest data from database
        const updatedTasks = group.tasks.map((groupTask: any) => {
          // Find the corresponding task in userTasks
          const latestTask = userTasks.find((t: any) => t.id === groupTask.id)
          if (latestTask) {
            // Update task with latest data from database, but preserve parentId and other local fields
            return {
              ...latestTask,
              // Preserve parentId if it exists in the group task but not in latestTask
              parentId: latestTask.parentId || groupTask.parentId,
              parentTaskId: latestTask.parentTaskId || groupTask.parentTaskId || groupTask.parentId
            }
          }
          // Task was deleted from database, but keep it in group for now (user can manually delete)
          return groupTask
        })

        // Add any new tasks from userTasks that aren't in the group yet
        // This includes both top-level tasks and subtasks whose parents are in the group
        const newTasks = userTasks.filter((t: any) => {
          if (taskIdsInGroup.has(t.id)) return false // Already in group

          // If it's a subtask, check if its parent is in the group
          if (t.parentId || t.parentTaskId) {
            const parentId = t.parentId || t.parentTaskId
            return taskIdsInGroup.has(parentId)
          }

          // Top-level task - add it
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
    // This will open the task dialog - implementation can be enhanced
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

  // Calculate timeline dates based on view mode
  const getTimelineDates = () => {
    const today = new Date()
    const dates: Date[] = []

    if (ganttViewMode === 'days') {
      // Show 1 year (30 days before, 335 days after = 365 days total)
      for (let i = -30; i <= 335; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        dates.push(date)
      }
    } else if (ganttViewMode === 'weeks') {
      // Show 1 year of weeks (4 weeks before, 48 weeks after = 52 weeks total)
      const startWeek = startOfWeek(today)
      for (let i = -4; i <= 48; i++) {
        const date = new Date(startWeek)
        date.setDate(startWeek.getDate() + (i * 7))
        dates.push(date)
      }
    } else if (ganttViewMode === 'months') {
      // Show 12 months (2 months before, 10 months after)
      for (let i = -2; i <= 10; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
        dates.push(date)
      }
    }

    return dates
  }

  // Get date width based on view mode
  const getDateWidth = () => {
    if (ganttViewMode === 'days') return 40
    if (ganttViewMode === 'weeks') return 80
    if (ganttViewMode === 'months') return 120
    return 40
  }

  // Calculate task position in timeline
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

  // Get all tasks with their positions for dependency connectors
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

        // Calculate row index (accounting for group headers)
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
          centerY: rowIndex * 40 + 20 // 40px per row, center at 20px
        })
      })
    })

    return tasksWithPositions
  }

  // Get dependency connectors (lines between tasks)
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
      // Check for dependencies - tasks might have dependencyId, dependencies array, or predecessorId
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

      // Handle dependencies array
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

  // Get today position in timeline
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

  const getStatusColor = (status: string, task?: any): string | { backgroundColor: string } => {
    // Check if task has a custom color (takes priority over color scheme)
    if (task?.id && taskColors[task.id]) {
      return { backgroundColor: taskColors[task.id] }
    }

    // Fall back to color scheme logic
    if (ganttColorScheme === 'priority' && task) {
      switch (task.priority) {
        case 'CRITICAL': return 'bg-red-600'
        case 'HIGH': return 'bg-orange-500'
        case 'MEDIUM': return 'bg-yellow-500'
        case 'LOW': return 'bg-blue-400'
        default: return 'bg-gray-400'
      }
    } else if (ganttColorScheme === 'assignee' && task?.assignee) {
      // Use a hash of the assignee ID to get consistent colors
      const assigneeId = task.assignee.id || task.assignee.name || 'unassigned'
      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500', 'bg-red-500']
      const hash = assigneeId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
      return colors[hash % colors.length]
    } else if (ganttColorScheme === 'status') {
      switch (status) {
        case 'DONE': return 'bg-green-500'
        case 'IN_REVIEW': return 'bg-yellow-500'
        case 'IN_PROGRESS': return 'bg-blue-500'
        case 'TODO': return 'bg-gray-400'
        default: return 'bg-gray-400'
      }
    } else {
      // Default color scheme
      return 'bg-blue-500'
    }
  }

  // Set task color
  const setTaskColor = (taskId: string, color: string) => {
    const newColors = { ...taskColors, [taskId]: color }
    setTaskColors(newColors)
    try {
      localStorage.setItem('sales-task-colors', JSON.stringify(newColors))
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
      localStorage.setItem('sales-task-colors', JSON.stringify(newColors))
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

  const calculateTaskPosition = (startDate: Date, endDate: Date, timelineStart: Date, dayWidth: number = 40) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const startDiff = Math.floor((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
    const duration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return {
      left: startDiff * dayWidth,
      width: duration * dayWidth
    }
  }

  // Show notes dialog before starting timer
  const showTimerNotesDialog = (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingTimerTask({ id: taskId, title: taskTitle })
    setTimerNotesDialogOpen(true)
  }

  // Start timer for a task with notes
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
      } else {
        const error = await response.json()
        console.error('Failed to start timer:', error.error)
      }
    } catch (error) {
      console.error('Error starting timer:', error)
    }
  }

  // Stop timer
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
        const data = await response.json()
        setActiveTimer(null)
        setTimerSeconds({})
      } else {
        console.error('Failed to stop timer')
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }

  // Load saved widgets from localStorage
  const loadSavedWidgets = () => {
    try {
      const saved = localStorage.getItem('sales-dashboard-widgets')
      if (saved) {
        const savedWidgets: Widget[] = JSON.parse(saved)
        // Merge saved widgets with defaults to ensure all widgets are present
        const mergedWidgets = defaultSalesWidgets.map(defaultWidget => {
          const savedWidget = savedWidgets.find(w => w.id === defaultWidget.id)
          return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
        })
        setWidgets(mergedWidgets)
      } else {
        // First login: set all widgets to invisible
        const firstLoginWidgets = defaultSalesWidgets.map(w => ({ ...w, visible: false }))
        setWidgets(firstLoginWidgets)
        localStorage.setItem('sales-dashboard-widgets', JSON.stringify(firstLoginWidgets))
      }
    } catch (error) {
      console.error('Error loading widgets:', error)
      // On error, also set all widgets to invisible for first login
      const firstLoginWidgets = defaultSalesWidgets.map(w => ({ ...w, visible: false }))
      setWidgets(firstLoginWidgets)
    }
  }

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prev => {
      const widget = prev.find(w => w.id === widgetId)
      const isBeingEnabled = widget && !widget.visible

      const updated = prev.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
      localStorage.setItem('sales-dashboard-widgets', JSON.stringify(updated))

      // If widget is being enabled, add it to the layout
      if (isBeingEnabled) {
        setLayouts(prevLayouts => {
          const defaultLayoutItem: Layout = {
            i: widgetId,
            x: 0,
            y: 100, // Place at the end
            w: 6,
            h: 4,
            minW: widgetId === 'mindMap' ? 16 : 3,
            minH: widgetId === 'mindMap' ? 12 : 2,
          }

          const updatedLayouts: Layouts = {
            lg: [...(prevLayouts.lg || []), defaultLayoutItem],
            md: [...(prevLayouts.md || []), defaultLayoutItem],
            sm: [...(prevLayouts.sm || []), defaultLayoutItem],
            xs: [...(prevLayouts.xs || []), defaultLayoutItem],
          }

          localStorage.setItem('sales-dashboard-layout', JSON.stringify(updatedLayouts))
          return updatedLayouts
        })
      }

      return updated
    })
  }, [])

  // Load saved layout from localStorage (only if not already loaded in useState)
  const loadSavedLayout = () => {
    try {
      const saved = localStorage.getItem('sales-dashboard-layout')
      if (saved) {
        const parsedLayouts = JSON.parse(saved)
        // Validate and sanitize layouts to ensure all items have valid properties
        const sanitizedLayouts: Layouts = {
          lg: (parsedLayouts.lg || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          md: (parsedLayouts.md || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          sm: (parsedLayouts.sm || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
          xs: (parsedLayouts.xs || []).filter((item: any): item is Layout =>
            item && typeof item === 'object' && typeof item.y === 'number' && typeof item.x === 'number'
          ),
        }
        // Only update if different from current state
        setLayouts(prev => {
          const prevStr = JSON.stringify(prev)
          const newStr = JSON.stringify(sanitizedLayouts)
          if (prevStr !== newStr) {
            return sanitizedLayouts
          }
          return prev
        })
      } else {
        // Only initialize defaults if layouts are empty
        setLayouts(prev => {
          const isEmpty = prev.lg.length === 0 && prev.md.length === 0 && prev.sm.length === 0 && prev.xs.length === 0
          if (isEmpty) {
            const defaultLayout: Layout[] = [
              { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
              { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
              { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
            ]
            return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
          }
          return prev
        })
      }
    } catch (error) {
      console.error('Error loading layout:', error)
      // Only initialize defaults if layouts are empty
      setLayouts(prev => {
        const isEmpty = prev.lg.length === 0 && prev.md.length === 0 && prev.sm.length === 0 && prev.xs.length === 0
        if (isEmpty) {
          const defaultLayout: Layout[] = [
            { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
            { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
            { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
          ]
          return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
        }
        return prev
      })
    }
  }

  // Initialize default layout for all charts
  const initializeDefaultLayout = () => {
    const defaultLayout: Layout[] = [
      { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
      { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
      { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
    ]
    setLayouts({ lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout })
  }

  // Save layout to localStorage - memoized to prevent recreation on every render
  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    // Filter out any undefined or invalid layout items
    const sanitizedLayouts: Layouts = {
      lg: (allLayouts.lg || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      md: (allLayouts.md || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      sm: (allLayouts.sm || []).filter((item): item is Layout => item && typeof item.y === 'number'),
      xs: (allLayouts.xs || []).filter((item): item is Layout => item && typeof item.y === 'number'),
    }
    setLayouts(sanitizedLayouts)
    try {
      localStorage.setItem('sales-dashboard-layout', JSON.stringify(sanitizedLayouts))
    } catch (error) {
      console.error('Error saving layout:', error)
    }
  }, [])

  const fetchOverviewData = useCallback(async () => {
    try {
      setLoadingOverview(true)
      const response = await fetch('/api/sales/dashboard/overview')
      if (response.ok) {
        const data = await response.json()
        setOverviewData(data)
      }
    } catch (error) {
      console.error('Error fetching overview data:', error)
    } finally {
      setLoadingOverview(false)
    }
  }, [])

  const fetchAllSalesData = useCallback(async () => {
    try {
      // Don't set loading to true - fetch in background for instant load
      const [
        leadsRes,
        opportunitiesRes,
        accountsRes,
        contactsRes,
        quotesRes,
        ordersRes,
        activitiesRes,
      ] = await Promise.all([
        fetch('/api/sales/leads').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/opportunities').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/accounts').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/contacts').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/quotes').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/orders').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
        fetch('/api/sales/activities').catch(() => ({ ok: false, json: () => Promise.resolve([]) })),
      ])

      const leads = await leadsRes.json().catch(() => [])
      const opportunities = await opportunitiesRes.json().catch(() => [])
      const accounts = await accountsRes.json().catch(() => [])
      const contacts = await contactsRes.json().catch(() => [])
      const quotes = await quotesRes.json().catch(() => [])
      const orders = await ordersRes.json().catch(() => [])
      const activities = await activitiesRes.json().catch(() => [])

      const leadsArray = Array.isArray(leads) ? leads : []
      const opportunitiesArray = Array.isArray(opportunities) ? opportunities : []
      const accountsArray = Array.isArray(accounts) ? accounts : []
      const contactsArray = Array.isArray(contacts) ? contacts : []
      const quotesArray = Array.isArray(quotes) ? quotes : []
      const ordersArray = Array.isArray(orders) ? orders : []
      const activitiesArray = Array.isArray(activities) ? activities : []

      const data = {
        leads: leadsArray,
        opportunities: opportunitiesArray,
        accounts: accountsArray,
        contacts: contactsArray,
        quotes: quotesArray,
        orders: ordersArray,
        activities: activitiesArray,
      }

      setSalesData(data)

      // Check if there's any data
      const hasData =
        leadsArray.length > 0 ||
        opportunitiesArray.length > 0 ||
        accountsArray.length > 0 ||
        contactsArray.length > 0 ||
        quotesArray.length > 0 ||
        ordersArray.length > 0 ||
        activitiesArray.length > 0

      setHasAnyData(hasData)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const formatCurrency = useCallback((value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }, [])

  // Overview Tab - Command Center
  const renderOverview = () => {
    if (loadingOverview || !overviewData) {
      return (
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading overview...</div>
        </div>
      )
    }

    const { personalScoreboard } = overviewData

    return (
      <div className="space-y-6">
        {/* Header - Personal Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pipeline Coverage</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(personalScoreboard.pipelineCoverage)}</div>
              <p className="text-xs text-muted-foreground mt-1">{personalScoreboard.openDeals} open deals</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{personalScoreboard.conversionRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">{personalScoreboard.wonDeals} won / {personalScoreboard.wonDeals + (personalScoreboard.openDeals || 0)} total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(personalScoreboard.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Deal Risk Radar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Deal Risk Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overviewData.dealRiskRadar && overviewData.dealRiskRadar.filter((deal: any) => deal.riskLevel !== 'low').length > 0 ? (
                  overviewData.dealRiskRadar
                    .filter((deal: any) => deal.riskLevel !== 'low')
                    .slice(0, 3)
                    .map((deal: any) => (
                      <div key={deal.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <Link href={`/sales-dashboard/opportunities/${deal.id}`} className="font-medium hover:underline">
                            {deal.name}
                          </Link>
                          <Badge
                            variant={deal.riskLevel === 'high' ? 'destructive' : 'default'}
                            className={deal.riskLevel === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {deal.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {formatCurrency(deal.amount)} • {deal.account}
                        </div>
                        {deal.riskReasons.length > 0 && (
                          <div className="space-y-1">
                            {deal.riskReasons.map((reason: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <AlertTriangle className="h-3 w-3 mt-0.5 text-orange-500" />
                                <span>{reason}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />
                    <p className="text-muted-foreground">All deals look healthy!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Best Actions Feed - Compact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Next Best Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {overviewData.nextBestActions && overviewData.nextBestActions.length > 0 ? (
                overviewData.nextBestActions.slice(0, 5).map((action: any, index: number) => {
                  const getActionIcon = () => {
                    switch (action.type) {
                      case 'CALL':
                        return <Phone className="h-4 w-4 text-blue-600" />
                      case 'EMAIL':
                        return <Mail className="h-4 w-4 text-green-600" />
                      case 'MEETING':
                        return <Calendar className="h-4 w-4 text-purple-600" />
                      case 'PROPOSAL':
                        return <FileText className="h-4 w-4 text-orange-600" />
                      default:
                        return <Activity className="h-4 w-4 text-gray-600" />
                    }
                  }

                  const getActionColor = () => {
                    switch (action.priority) {
                      case 'HIGH':
                        return 'border-red-200 bg-red-50/50'
                      case 'MEDIUM':
                        return 'border-yellow-200 bg-yellow-50/50'
                      default:
                        return 'border-gray-200'
                    }
                  }

                  const getUrl = () => {
                    if (action.relatedToType === 'opportunity') {
                      return `/sales-dashboard/opportunities/${action.relatedToId}`
                    } else if (action.relatedToType === 'lead') {
                      return `/sales-dashboard/leads/${action.relatedToId}`
                    } else if (action.relatedToType === 'contact') {
                      return `/sales-dashboard/contacts/${action.relatedToId}`
                    }
                    return '#'
                  }

                  return (
                    <div key={action.id || index} className={`flex items-center gap-3 p-3 border rounded-lg ${getActionColor()}`}>
                      {getActionIcon()}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{action.actionLabel}</span>
                          {action.priority && (
                            <Badge variant={action.priority === 'HIGH' ? 'destructive' : 'default'} className="text-xs">
                              {action.priority}
                            </Badge>
                          )}
                        </div>
                        <Link href={getUrl()} className="text-sm text-muted-foreground hover:underline">
                          {action.subject} - {action.relatedTo}
                        </Link>
                        {action.dueDate && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Due: {format(new Date(action.dueDate), 'MMM dd, yyyy HH:mm')}
                          </div>
                        )}
                      </div>
                      <Link href={getUrl()}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                    </div>
                  )
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No actions scheduled</p>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    )
  }

  // Leads Tab
  const renderLeads = () => {
    if (salesData.leads.length === 0) {
      return (
        <div className="text-center py-12">
          <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Leads Yet</h3>
          <p className="text-muted-foreground mb-4">Start by adding your first lead</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/leads?create=true')
          }}>
            Create Lead
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Leads</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Leads page to view all lead charts and analytics</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/leads')
        }}>
          Go to Leads Page
        </Button>
      </div>
    )
  }

  // Opportunities Tab
  const renderOpportunities = () => {
    if (salesData.opportunities.length === 0) {
      return (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Opportunities Yet</h3>
          <p className="text-muted-foreground mb-4">Start tracking your sales opportunities</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/opportunities?create=true')
          }}>
            Create Opportunity
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Opportunities</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Opportunities page to view all opportunities</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/opportunities')
        }}>
          Go to Opportunities Page
        </Button>
      </div>
    )
  }

  // Accounts Tab
  const renderAccounts = () => {
    if (salesData.accounts.length === 0) {
      return (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
          <p className="text-muted-foreground mb-4">Start by adding your first account</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/accounts?create=true')
          }}>
            Create Account
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Accounts</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Accounts page to view all accounts</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/accounts')
        }}>
          Go to Accounts Page
        </Button>
      </div>
    )
  }

  // Contacts Tab
  const renderContacts = () => {
    if (salesData.contacts.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Contacts Yet</h3>
          <p className="text-muted-foreground mb-4">Start by adding your first contact</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/contacts?create=true')
          }}>
            Create Contact
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Contacts</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Contacts page to view all contacts</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/contacts')
        }}>
          Go to Contacts Page
        </Button>
      </div>
    )
  }

  // Quotes Tab
  const renderQuotes = () => {
    if (salesData.quotes.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Quotes Yet</h3>
          <p className="text-muted-foreground mb-4">Start by creating your first quote</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/quotes?create=true')
          }}>
            Create Quote
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Quotes</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Quotes page to view all quotes</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/quotes')
        }}>
          Go to Quotes Page
        </Button>
      </div>
    )
  }

  // Orders Tab
  const renderOrders = () => {
    if (salesData.orders.length === 0) {
      return (
        <div className="text-center py-12">
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
          <p className="text-muted-foreground mb-4">Orders will appear here once created</p>
          <Button onClick={() => {
            if (!router) {
              console.error('[SalesDashboard] Router not available')
              return
            }
            router.push('/sales-dashboard/orders')
          }}>
            View Orders
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-12">
        <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">View Orders</h3>
        <p className="text-muted-foreground mb-4">Navigate to the Orders page to view all orders</p>
        <Button onClick={() => {
          if (!router) {
            console.error('[SalesDashboard] Router not available')
            return
          }
          router.push('/sales-dashboard/orders')
        }}>
          Go to Orders Page
        </Button>
      </div>
    )
  }

  // Empty State Component
  const EmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-lg">
          <div className="mb-6">
            <LayoutGrid className="h-20 w-20 mx-auto text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Sales Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Get started by adding your first sales data.
          </p>
          <p className="text-muted-foreground mb-8">
            Once you start adding leads, opportunities, accounts, or other sales data, you'll see beautiful visualizations and insights here.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={() => {
                if (!router) {
                  console.error('[SalesDashboard] Router not available')
                  return
                }
                router.push('/sales-dashboard/leads?create=true')
              }}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Create Lead
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!router) {
                  console.error('[SalesDashboard] Router not available')
                  return
                }
                router.push('/sales-dashboard/opportunities?create=true')
              }}
              className="flex items-center gap-2"
            >
              <Target className="h-4 w-4" />
              Create Opportunity
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!router) {
                  console.error('[SalesDashboard] Router not available')
                  return
                }
                router.push('/sales-dashboard/contacts?create=true')
              }}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Create Contact
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!router) {
                  console.error('[SalesDashboard] Router not available')
                  return
                }
                router.push('/sales-dashboard/accounts?create=true')
              }}
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

  // Data Generation Helper Functions
  const generateSalesTrendData = (opportunities: any[]) => {
    const months = 6
    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })

      const monthOpps = opportunities.filter((o: any) => {
        const closeDate = new Date(o.actualCloseDate || o.updatedAt || o.createdAt)
        return closeDate.getMonth() === date.getMonth() && closeDate.getFullYear() === date.getFullYear()
      })

      const sales = monthOpps
        .filter((o: any) => o.status === 'WON')
        .reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)

      data.push({ month: monthKey, sales })
    }

    return data
  }

  const generatePipelineByStage = (opportunities: any[]) => {
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

    return stages
      .map((stage) => {
        const stageOpps = opportunities.filter((o: any) => o.stage === stage && o.status === 'OPEN')
        return {
          stage: stage.replace(/_/g, ' '),
          value: stageOpps.reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0),
        }
      })
      .filter((item) => item.value > 0)
  }


  const generateOpportunitiesByStage = (opportunities: any[]) => {
    const stageCounts: Record<string, number> = {}
    opportunities.forEach((opp) => {
      const stage = opp.stage || 'PROSPECTING'
      stageCounts[stage] = (stageCounts[stage] || 0) + 1
    })

    return Object.entries(stageCounts).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value,
    }))
  }

  const generateRevenueForecast = (opportunities: any[]) => {
    const months = 6
    const data = []
    const now = new Date()

    for (let i = 0; i < months; i++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() + i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })

      const monthOpps = opportunities.filter((o: any) => {
        const closeDate = new Date(o.expectedCloseDate || o.createdAt)
        return closeDate.getMonth() === date.getMonth() && closeDate.getFullYear() === date.getFullYear()
      })

      const expected = monthOpps
        .filter((o: any) => o.status === 'OPEN')
        .reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)

      const committed = monthOpps
        .filter((o: any) => o.status === 'WON')
        .reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)

      data.push({ month: monthKey, expected, committed })
    }

    return data
  }

  const generateAccountsByType = (accounts: any[]) => {
    const typeCounts: Record<string, number> = {}
    accounts.forEach((account) => {
      const type = account.type || 'CUSTOMER'
      typeCounts[type] = (typeCounts[type] || 0) + 1
    })

    return Object.entries(typeCounts).map(([name, value]) => ({ name, value }))
  }

  const generateAccountsByIndustry = (accounts: any[]) => {
    const industryCounts: Record<string, number> = {}
    accounts.forEach((account) => {
      const industry = account.industry || 'Other'
      industryCounts[industry] = (industryCounts[industry] || 0) + 1
    })

    return Object.entries(industryCounts).map(([industry, count]) => ({ industry, count }))
  }

  const generateContactsGrowth = (contacts: any[]) => {
    const months = 6
    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })

      const monthContacts = contacts.filter((contact: any) => {
        const createdDate = new Date(contact.createdAt)
        return createdDate.getMonth() === date.getMonth() && createdDate.getFullYear() === date.getFullYear()
      })

      data.push({ month: monthKey, count: monthContacts.length })
    }

    return data
  }

  const generateQuotesByStatus = (quotes: any[]) => {
    const statusCounts: Record<string, number> = {}
    quotes.forEach((quote) => {
      const status = quote.status || 'DRAFT'
      statusCounts[status] = (statusCounts[status] || 0) + 1
    })

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
  }

  const generateOrdersTrend = (orders: any[]) => {
    const months = 6
    const data = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' })

      const monthOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.orderDate || order.createdAt)
        return orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()
      })

      const value = monthOrders.reduce((sum: number, o: any) => sum + parseFloat(o.totalAmount?.toString() || '0'), 0)

      data.push({ month: monthKey, value })
    }

    return data
  }

  if (loading) {
    return (
      <SalesPageLayout widgets={widgets} toggleWidget={toggleWidget}>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium">Loading dashboard...</div>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  // Invoices Section
  const renderInvoices = () => {
    const invoices = salesData.orders.filter((o: any) => o.status === 'DELIVERED' || o.status === 'SHIPPED')
    if (invoices.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No invoices available</p>
        </div>
      )
    }

    return (
      <div className="text-center py-8">
        <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">View invoices on the Orders page</p>
      </div>
    )
  }

  // Forecast Section
  const renderForecast = () => {
    return (
      <div className="text-center py-8">
        <Target className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Forecast data available on the Forecast page</p>
      </div>
    )
  }

  // Helper function to check if a widget is visible
  const isWidgetVisible = (widgetId: string) => {
    const widget = widgets.find(w => w.id === widgetId)
    return widget?.visible ?? false
  }

  // Render schedule widget
  const renderScheduleWidget = (skipFullscreenStyles = false) => {
    const upcomingActivities = salesData.activities
      .filter((a: any) => {
        const activityDate = new Date(a.scheduledDate || a.dueDate || a.createdAt)
        return activityDate >= new Date()
      })
      .slice(0, 10)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.scheduledDate || a.dueDate || a.createdAt)
        const dateB = new Date(b.scheduledDate || b.dueDate || b.createdAt)
        return dateA.getTime() - dateB.getTime()
      })

    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'schedule'
    return (
      <Card
        ref={(el) => { widgetRefs.current['schedule'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('schedule')}
              title={fullscreenWidget === 'schedule' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'schedule' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingActivities.length > 0 ? (
              upcomingActivities.map((activity: any, index: number) => {
                const activityDate = new Date(activity.scheduledDate || activity.dueDate || activity.createdAt)
                return (
                  <div key={activity.id || index} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{activity.subject || activity.title || 'Activity'}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(activityDate, 'MMM dd, yyyy HH:mm')}
                      </div>
                    </div>
                    <Badge variant="outline">{activity.type || 'Meeting'}</Badge>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming activities</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render filters widget
  const renderFiltersWidget = (skipFullscreenStyles = false) => {
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'filters'
    return (
      <Card
        ref={(el) => { widgetRefs.current['filters'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('filters')}
              title={fullscreenWidget === 'filters' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'filters' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">Last 7 days</Button>
                <Button variant="outline" size="sm" className="flex-1">Last 30 days</Button>
                <Button variant="outline" size="sm" className="flex-1">Custom</Button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer">Open</Badge>
                <Badge variant="outline" className="cursor-pointer">Won</Badge>
                <Badge variant="outline" className="cursor-pointer">Lost</Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Stage</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer">All Stages</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render help widget
  const renderHelpWidget = (skipFullscreenStyles = false) => {
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'help'
    return (
      <Card
        ref={(el) => { widgetRefs.current['help'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Help & Support
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('help')}
              title={fullscreenWidget === 'help' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'help' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              if (!router) {
                console.error('[SalesDashboard] Router not available')
                return
              }
              router.push('/sales-dashboard/help')
            }}>
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              if (!router) {
                console.error('[SalesDashboard] Router not available')
                return
              }
              router.push('/sales-dashboard/help')
            }}>
              <AlertCircle className="h-4 w-4 mr-2" />
              FAQ
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              if (!router) {
                console.error('[SalesDashboard] Router not available')
                return
              }
              router.push('/sales-dashboard/help')
            }}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Need help? Check our documentation or contact support for assistance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // renderMyTasksWidget removed - now using centralized MyTasksWidget component
  // renderUsefulLinksWidget removed - now using centralized UsefulLinksWidget component
  // renderQuickActionsWidget removed - now using centralized QuickActionsWidget component

  // renderMyTasksWidget removed - now using centralized MyTasksWidget component
  // renderUsefulLinksWidget removed - now using centralized UsefulLinksWidget component
  // renderQuickActionsWidget removed - now using centralized QuickActionsWidget component

  // renderMyTasksWidget removed - now using centralized MyTasksWidget component
  // renderUsefulLinksWidget removed - now using centralized UsefulLinksWidget component
  // renderQuickActionsWidget removed - now using centralized QuickActionsWidget component

  // Render metrics widget (Key Delivery Metrics)
  const renderMetricsWidget = (skipFullscreenStyles = false) => {
    const totalDeals = salesData.opportunities.length
    const wonDeals = salesData.opportunities.filter((o: any) => o.status === 'WON').length
    const lostDeals = salesData.opportunities.filter((o: any) => o.status === 'LOST').length
    const openDeals = salesData.opportunities.filter((o: any) => o.status === 'OPEN').length
    const winRate = totalDeals > 0 ? ((wonDeals / totalDeals) * 100).toFixed(1) : '0'
    const conversionRate = totalDeals > 0 ? ((wonDeals / (wonDeals + lostDeals || 1)) * 100).toFixed(1) : '0'

    const totalRevenue = salesData.opportunities
      .filter((o: any) => o.status === 'WON')
      .reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)

    const avgDealSize = wonDeals > 0 ? totalRevenue / wonDeals : 0
    const pipelineValue = salesData.opportunities
      .filter((o: any) => o.status === 'OPEN')
      .reduce((sum: number, o: any) => sum + parseFloat(o.amount?.toString() || '0'), 0)

    const metrics = [
      { label: 'Win Rate', value: `${winRate}%` },
      { label: 'Conversion Rate', value: `${conversionRate}%` },
      { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { label: 'Avg Deal Size', value: formatCurrency(avgDealSize) },
      { label: 'Pipeline Value', value: formatCurrency(pipelineValue) },
      { label: 'Total Deals', value: totalDeals.toString() },
    ]

    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'metrics'
    return (
      <Card
        ref={(el) => { widgetRefs.current['metrics'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="px-6 pt-6 pb-4 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Key Delivery Metrics</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('metrics')}
              title={fullscreenWidget === 'metrics' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'metrics' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pt-4 pb-6">
          <div className="grid grid-cols-2 gap-3 text-xs">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-border bg-background p-3"
              >
                <div className="text-muted-foreground">{m.label}</div>
                <div className="text-sm font-semibold mt-1">{m.value}</div>
              </div>
            ))}
          </div>
          <div className="h-32 rounded-xl bg-muted border border-border flex items-center justify-center text-[11px] text-muted-foreground mt-4">
            [Sales Performance Chart Placeholder]
          </div>
        </CardContent>
      </Card>
    )
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

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  // Check if there are any visible widgets
  const hasVisibleWidgets = widgets.some(w => w.visible)

  return (
    <SalesPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      <div className="space-y-6">
        {/* Welcome Message - Always shown */}
        {!hasVisibleWidgets ? (
          <EmptyState />
        ) : (
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {greeting}, {user?.firstName || 'there'}!
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome to Your Sales Dashboard
              </p>
            </div>
          </div>
        )}

        {/* Draggable Grid Layout - Only show if there are visible widgets */}
        {hasVisibleWidgets && (
          <div style={{ minHeight: '800px' }} className="sales-dashboard-grid">
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
                    {renderMetricsWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* Schedule Widget */}
              {isWidgetVisible('schedule') && (
                <div key="schedule">
                  <GridCard id="schedule">
                    {renderScheduleWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* Filters Widget */}
              {isWidgetVisible('filters') && (
                <div key="filters">
                  <GridCard id="filters">
                    {renderFiltersWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* Help Widget */}
              {isWidgetVisible('help') && (
                <div key="help">
                  <GridCard id="help">
                    {renderHelpWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* Quick Actions Widget */}
              {isWidgetVisible('quickActions') && (
                <div key="quickActions">
                  <GridCard id="quickActions">
                    <QuickActionsWidget
                      actions={salesQuickActions}
                      widgetId="quickActions"
                      fullscreen={fullscreenWidget === 'quickActions'}
                      onToggleFullscreen={toggleFullscreen}
                      dashboardType="sales"
                      columns={3}
                    />
                  </GridCard>
                </div>
              )}

              {/* Useful Links Widget */}
              {isWidgetVisible('usefulLinks') && (
                <div key="usefulLinks">
                  <GridCard id="usefulLinks">
                    <UsefulLinksWidget
                      storageKey="sales-useful-links"
                      widgetId="usefulLinks"
                      fullscreen={fullscreenWidget === 'usefulLinks'}
                      onToggleFullscreen={toggleFullscreen}
                    />
                  </GridCard>
                </div>
              )}

              {/* My Tasks Widget */}
              {isWidgetVisible('myTasks') && (
                <div key="myTasks">
                  <GridCard id="myTasks">
                    <MyTasksWidget
                      tasks={userTasks.filter(task => task.assigneeId === user?.id)}
                      widgetId="myTasks"
                      fullscreen={fullscreenWidget === 'myTasks'}
                      onToggleFullscreen={toggleFullscreen}
                      dashboardType="sales"
                      basePath="/sales-dashboard"
                    />
                  </GridCard>
                </div>
              )}

              {/* Mind Map Widget */}
              {isWidgetVisible('mindMap') && (
                <div key="mindMap">
                  <GridCard id="mindMap">
                    <AdvancedMindMapWidget />
                  </GridCard>
                </div>
              )}

              {/* Canvas Widget */}
              {isWidgetVisible('canvas') && (
                <div key="canvas">
                  <GridCard id="canvas">
                    <AdvancedCanvasWidget />
                  </GridCard>
                </div>
              )}
            </ResponsiveGridLayout>
          </div>
        )}

        {/* Fullscreen Widgets */}
        {fullscreenWidget === 'metrics' && renderMetricsWidget()}
        {fullscreenWidget === 'schedule' && renderScheduleWidget()}
        {fullscreenWidget === 'filters' && renderFiltersWidget()}
        {fullscreenWidget === 'help' && renderHelpWidget()}
        {fullscreenWidget === 'quickActions' && (
          <QuickActionsWidget
            actions={salesQuickActions}
            widgetId="quickActions"
            fullscreen={true}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="sales"
            columns={3}
          />
        )}
        {fullscreenWidget === 'usefulLinks' && (
          <UsefulLinksWidget
            storageKey="sales-useful-links"
            widgetId="usefulLinks"
            fullscreen={true}
            onToggleFullscreen={toggleFullscreen}
          />
        )}
        {fullscreenWidget === 'myTasks' && (
          <MyTasksWidget
            tasks={userTasks.filter(task => task.assigneeId === user?.id)}
            widgetId="myTasks"
            fullscreen={true}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="sales"
            basePath="/sales-dashboard"
          />
        )}
        {fullscreenWidget === 'mindMap' && <AdvancedMindMapWidget />}
        {fullscreenWidget === 'canvas' && <AdvancedCanvasWidget />}
      </div>

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
            // If selectedTaskId is set, this is a subtask - include parentId
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

              // Ensure the created task has parentId set for subtasks
              if (selectedTaskId) {
                createdTask.parentId = selectedTaskId
                createdTask.parentTaskId = selectedTaskId
              }

              // If adding to a Gantt group, add the task to that group
              if (addingTaskToGroup) {
                setGanttGroups(groups =>
                  groups.map(group => {
                    if (group.id === addingTaskToGroup) {
                      // If this is a subtask, find the parent task and ensure it's in the group
                      if (selectedTaskId) {
                        // Check if parent task exists in this group
                        const parentTask = group.tasks.find((t: any) => t.id === selectedTaskId)
                        if (parentTask) {
                          // Parent exists, just add the subtask
                          return {
                            ...group,
                            tasks: [...group.tasks, createdTask]
                          }
                        } else {
                          // Parent doesn't exist in group, add both parent and subtask
                          // First find parent in userTasks
                          const parentInUserTasks = userTasks.find((t: any) => t.id === selectedTaskId)
                          if (parentInUserTasks) {
                            return {
                              ...group,
                              tasks: [...group.tasks, parentInUserTasks, createdTask]
                            }
                          }
                        }
                      }
                      // Regular task or subtask with parent already in group
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

              // Clear selectedTaskId after creating subtask
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

    </SalesPageLayout>
  )
}

export default function SalesDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    }>
      <SalesDashboardPageInner />
    </Suspense>
  )
}

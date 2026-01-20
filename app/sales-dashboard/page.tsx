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
  const [layouts, setLayouts] = useState<Layouts>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
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

  // Useful Links state
  const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // Fullscreen state
  const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)

  // Optimized: Batch API calls and localStorage operations
  useEffect(() => {
    // Load all localStorage data in one batch (synchronous, fast)
    try {
      const savedLinks = localStorage.getItem('useful-links')
      if (savedLinks) {
        setUsefulLinks(JSON.parse(savedLinks))
      }
    } catch (error) {
      console.error('Error loading useful links:', error)
    }
    
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
            minW: 3,
            minH: 2,
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

  // Load saved layout from localStorage
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
        setLayouts(sanitizedLayouts)
      } else {
        initializeDefaultLayout()
      }
    } catch (error) {
      console.error('Error loading layout:', error)
      initializeDefaultLayout()
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
          <Button onClick={() => router.push('/sales-dashboard/leads?create=true')}>
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
        <Button onClick={() => router.push('/sales-dashboard/leads')}>
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
          <Button onClick={() => router.push('/sales-dashboard/opportunities?create=true')}>
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
        <Button onClick={() => router.push('/sales-dashboard/opportunities')}>
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
          <Button onClick={() => router.push('/sales-dashboard/accounts?create=true')}>
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
        <Button onClick={() => router.push('/sales-dashboard/accounts')}>
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
          <Button onClick={() => router.push('/sales-dashboard/contacts?create=true')}>
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
        <Button onClick={() => router.push('/sales-dashboard/contacts')}>
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
          <Button onClick={() => router.push('/sales-dashboard/quotes?create=true')}>
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
        <Button onClick={() => router.push('/sales-dashboard/quotes')}>
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
          <Button onClick={() => router.push('/sales-dashboard/orders')}>
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
        <Button onClick={() => router.push('/sales-dashboard/orders')}>
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
              <Users className="h-4 w-4" />
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
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/sales-dashboard/help')}>
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/sales-dashboard/help')}>
              <AlertCircle className="h-4 w-4 mr-2" />
              FAQ
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => router.push('/sales-dashboard/help')}>
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

  // Render myTasks widget
  function renderMyTasksWidget(skipFullscreenStyles = false) {
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'myTasks'
    const filteredTasks = getFilteredTasks()
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
                          // Handle different source types
                          if (task.source === 'activity') {
                            router.push(`/sales-dashboard/activities?view=${task.sourceId}`)
                          } else if (task.source === 'opportunity' || task.sourceType === 'sales-opportunity') {
                            router.push(`/sales-dashboard/opportunities/${task.sourceId}`)
                          } else if (task.source === 'lead' || task.sourceType === 'sales-lead') {
                            router.push(`/sales-dashboard/leads/${task.sourceId}`)
                          } else {
                            setSelectedTaskId(task.id)
                            setTaskDetailDialogOpen(true)
                          }
                        }}
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.project && (
                          <p className="text-xs text-muted-foreground">
                            {task.project.name}
                          </p>
                        )}
                        {task.source === 'activity' && (
                          <p className="text-xs text-blue-600">Sales Activity</p>
                        )}
                        {(task.source === 'opportunity' || task.sourceType === 'sales-opportunity') && (
                          <p className="text-xs text-purple-600">Sales Opportunity</p>
                        )}
                        {(task.source === 'lead' || task.sourceType === 'sales-lead') && (
                          <p className="text-xs text-green-600">Sales Lead</p>
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

                      {/* Timer Controls - Only for regular tasks */}
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
            /* Calendar View */
            <div className="h-full">
              {(() => {
                // Group tasks by due date
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

                // Get current month and year from calendarDate state
                if (!calendarDate) {
                  return <div className="p-4 text-center text-muted-foreground">Loading calendar...</div>
                }

                const currentMonth = calendarDate.getMonth()
                const currentYear = calendarDate.getFullYear()

                // Get first day of month and number of days
                const firstDay = new Date(currentYear, currentMonth, 1)
                const lastDay = new Date(currentYear, currentMonth + 1, 0)
                const daysInMonth = lastDay.getDate()
                const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

                // Create calendar grid
                const calendarDays = []
                const now = new Date()
                const today = now.getDate()
                const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear

                // Add empty cells for days before month starts
                for (let i = 0; i < startingDayOfWeek; i++) {
                  calendarDays.push(null)
                }

                // Add days of month
                for (let day = 1; day <= daysInMonth; day++) {
                  calendarDays.push(day)
                }

                const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

                // Navigation functions
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
                    {/* Calendar Header with Navigation */}
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

                    {/* Day Names */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto">
                      {calendarDays.map((day, index) => {
                        if (day === null) {
                          return <div key={`empty-${index}`} className="bg-muted/20 rounded-lg" />
                        }

                        const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        const tasksForDay = tasksByDate[dateKey] || []
                        const isToday = isCurrentMonth && day === today
                        const isPast = new Date(dateKey) < new Date(now.toISOString().split('T')[0])

                        return (
                          <div
                            key={day}
                            className={cn(
                              "border rounded-lg p-2 min-h-[80px] flex flex-col",
                              isToday && "border-primary bg-primary/5 border-2",
                              isPast && tasksForDay.length > 0 && "bg-destructive/5",
                              !isToday && !isPast && "hover:bg-accent"
                            )}
                          >
                            {/* Date number */}
                            <div className={cn(
                              "text-sm font-semibold mb-1",
                              isToday && "text-primary",
                              isPast && "text-muted-foreground"
                            )}>
                              {day}
                            </div>

                            {/* Tasks for this day */}
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
                                    // Handle different source types
                                    if (task.source === 'activity') {
                                      router.push(`/sales-dashboard/activities?view=${task.sourceId}`)
                                    } else if (task.source === 'opportunity' || task.sourceType === 'sales-opportunity') {
                                      router.push(`/sales-dashboard/opportunities/${task.sourceId}`)
                                    } else if (task.source === 'lead' || task.sourceType === 'sales-lead') {
                                      router.push(`/sales-dashboard/leads/${task.sourceId}`)
                                    } else {
                                      setSelectedTaskId(task.id)
                                      setTaskDetailDialogOpen(true)
                                    }
                                  }}
                                  title={task.title}
                                >
                                  {task.title}
                                </div>
                              ))}
                            </div>

                            {/* Task count badge */}
                            {tasksForDay.length > 0 && (
                              <div className="text-[10px] text-muted-foreground text-center mt-1">
                                {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Tasks without due date */}
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
                                // Handle different source types
                                if (task.source === 'activity') {
                                  router.push(`/sales-dashboard/activities?view=${task.sourceId}`)
                                } else if (task.source === 'opportunity' || task.sourceType === 'sales-opportunity') {
                                  router.push(`/sales-dashboard/opportunities/${task.sourceId}`)
                                } else if (task.source === 'lead' || task.sourceType === 'sales-lead') {
                                  router.push(`/sales-dashboard/leads/${task.sourceId}`)
                                } else {
                                  setSelectedTaskId(task.id)
                                  setTaskDetailDialogOpen(true)
                                }
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
            /* Kanban View */
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
                      {/* Column Header */}
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
                          {/* Status indicator bar */}
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

                      {/* Column Content */}
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
                          {columnTasks.map((task: any, taskIndex: number) => {
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
                                  // Block click if we were dragging
                                  if (taskIsDragging || dragRef.current?.taskId === task.id) {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    return
                                  }

                                  // Handle click normally if no drag occurred
                                  if (task.source === 'activity') {
                                    router.push(`/sales-dashboard/activities?view=${task.sourceId}`)
                                  } else if (task.source === 'opportunity' || task.sourceType === 'sales-opportunity') {
                                    router.push(`/sales-dashboard/opportunities/${task.sourceId}`)
                                  } else if (task.source === 'lead' || task.sourceType === 'sales-lead') {
                                    router.push(`/sales-dashboard/leads/${task.sourceId}`)
                                  } else {
                                    setSelectedTaskId(task.id)
                                    setTaskDetailDialogOpen(true)
                                  }
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
                                  {task.source !== 'task' && (
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                      {task.source === 'activity' ? 'Activity' : task.source === 'opportunity' ? 'Opportunity' : 'Lead'}
                                    </Badge>
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
            /* Gantt Chart View */
            <div className="h-full flex flex-col overflow-hidden">
              {/* Gantt Chart Header */}
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

              {/* Gantt Chart Body */}
              <div className="flex-1 overflow-auto">
                <div className="flex min-w-[1200px]">
                  {/* Left Panel - Task List */}
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
                            {/* Group Header */}
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

                            {/* Group Tasks */}
                            {group.expanded && (
                              <div>
                                {group.tasks.filter((task: any) => !task.parentTaskId && !task.parentId).length === 0 ? (
                                  <div className="p-4 text-center text-xs text-muted-foreground">
                                    No tasks in this group
                                  </div>
                                ) : (
                                  group.tasks
                                    .filter((task: any) => !task.parentTaskId && !task.parentId) // Only show parent tasks in main list
                                    .map((task: any) => {
                                      const taskStatus = task.status || 'TODO'
                                      const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date()
                                      const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)

                                      return (
                                        <div key={task.id}>
                                          {(() => {
                                            // Get subtasks for this task (tasks with parentTaskId or parentId matching this task's id)
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
                                                          setSelectedTaskId(task.id) // Store parent task ID for subtask
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
                                                {/* Subtasks */}
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

                      {/* Add Group Input */}
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

                  {/* Right Panel - Timeline */}
                  <div className="flex-1 overflow-x-auto">
                    {/* Timeline Header */}
                    <div className="border-b bg-muted/50 sticky top-0 z-10">
                      {ganttViewMode === 'days' ? (
                        <div className="relative">
                          {/* Month Row */}
                          <div className="border-b relative" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px`, minHeight: '20px' }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const showMonth = idx === 0 || date.getDate() === 1
                              const monthName = format(date, 'MMM')
                              if (!showMonth) return null
                              // Calculate how many days until next month or end
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
                          {/* Day Row */}
                          <div className="flex" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const isTodayDate = isToday(date)
                              const dayNum = format(date, 'dd')
                              const dayName = format(date, 'EEE')
                              const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
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
                          {/* Month Row */}
                          <div className="border-b relative" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px`, minHeight: '20px' }}>
                            {getTimelineDates().map((date, idx) => {
                              const dateWidth = getDateWidth()
                              const showMonth = idx === 0 || date.getDate() <= 7
                              const monthName = format(date, 'MMM')
                              if (!showMonth) return null
                              // Calculate how many weeks until next month or end
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
                          {/* Week Row */}
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

                    {/* Timeline Body */}
                    <div className="relative h-full">
                      {/* Weekend Highlighting */}
                      {ganttViewMode === 'days' && getTimelineDates().map((date, idx) => {
                        const dateWidth = getDateWidth()
                        const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
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
                      {/* Today Indicator Line */}
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

                      {/* Dependency Connectors */}
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

                          // Create a path with straight corners (L commands for straight lines)
                          const pathData = `M ${fromX} ${fromY} L ${midX} ${fromY} L ${midX} ${toY} L ${toX - 4} ${toY}`

                          const isHovered = hoveredConnector === idx
                          // Use mouse position if available, otherwise use middle of connector
                          // Position label to the right and slightly above cursor
                          const labelX = connectorMousePos ? connectorMousePos.x + 15 : midX + 15
                          const labelY = connectorMousePos ? connectorMousePos.y - 25 : (fromY + toY) / 2 - 25

                          return (
                            <g key={idx}>
                              {/* Invisible wider path for hover detection */}
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
                              {/* Visible connector line with arrow */}
                              <path
                                d={pathData}
                                stroke="#3b82f6"
                                strokeWidth="1.5"
                                fill="none"
                                markerEnd="url(#arrowhead)"
                                opacity={isHovered ? "1" : "0.7"}
                                className="pointer-events-none transition-opacity"
                              />
                              {/* Hover label - positioned to the right and above cursor */}
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
                                  {/* From task name */}
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
                                  {/* Dependency indicator */}
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
                                  {/* To task name */}
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

                      {/* Task Bars - Must align with left panel rows */}
                      <div className="divide-y">
                        {ganttGroups.map((group) => (
                          <div key={group.id}>
                            {/* Group header row in timeline */}
                            {!group.expanded && (
                              <div className="h-10 border-b" style={{ minWidth: `${getTimelineDates().length * getDateWidth()}px` }} />
                            )}

                            {/* Task rows in timeline */}
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

                        {/* Add Group row in timeline */}
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

  // Render useful links widget
  const renderUsefulLinksWidget = (skipFullscreenStyles = false) => {
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'usefulLinks'
    return (
      <Card
        ref={(el) => { widgetRefs.current['usefulLinks'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Useful Links
              </CardTitle>
              <CardDescription className="text-xs">Your frequently visited links</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('usefulLinks')}
              title={fullscreenWidget === 'usefulLinks' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'usefulLinks' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-3 pt-4">
          {/* Add Link Form */}
          <div className="space-y-2">
            <Input
              placeholder="Link title..."
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              className="h-8 text-xs"
            />
            <div className="flex gap-2">
              <Input
                placeholder="https://..."
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
                className="h-8 text-xs flex-1"
              />
              <Button
                size="sm"
                className="h-8"
                onClick={() => {
                  if (newLinkTitle && newLinkUrl) {
                    const newLink = {
                      id: Date.now().toString(),
                      title: newLinkTitle,
                      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`
                    }
                    setUsefulLinks([...usefulLinks, newLink])
                    setNewLinkTitle('')
                    setNewLinkUrl('')
                    // Save to localStorage
                    localStorage.setItem('useful-links', JSON.stringify([...usefulLinks, newLink]))
                  }
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Links List */}
          <div className="flex-1 overflow-auto space-y-2">
            {usefulLinks.length > 0 ? (
              usefulLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-2 p-2 border rounded-lg hover:bg-accent cursor-pointer transition-colors group"
                >
                  <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="font-medium truncate">{link.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                  </a>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      const updated = usefulLinks.filter(l => l.id !== link.id)
                      setUsefulLinks(updated)
                      localStorage.setItem('useful-links', JSON.stringify(updated))
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No links saved yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add your frequently visited links above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render quick actions widget
  const renderQuickActionsWidget = (skipFullscreenStyles = false) => {
    const isFullscreen = !skipFullscreenStyles && fullscreenWidget === 'quickActions'
    return (
      <Card
        ref={(el) => { widgetRefs.current['quickActions'] = el }}
        className={cn(
          "h-full flex flex-col overflow-hidden",
          isFullscreen && "fixed inset-0 z-[9999] m-0 rounded-none"
        )}
        style={isFullscreen ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, margin: 0, borderRadius: 0 } : undefined}
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Fast access to common tasks</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleFullscreen('quickActions')}
              title={fullscreenWidget === 'quickActions' ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
            >
              {fullscreenWidget === 'quickActions' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 pt-4">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/sales-dashboard/leads?create=true')}>
              <UserPlus className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">New Lead</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/sales-dashboard/opportunities?create=true')}>
              <Target className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">New Deal</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/sales-dashboard/contacts?create=true')}>
              <Users className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">New Contact</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/sales-dashboard/accounts?create=true')}>
              <Building2 className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">New Account</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/sales-dashboard/activities?create=true')}>
              <Calendar className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">Log Activity</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => setTaskDialogOpen(true)}>
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span className="text-xs font-medium text-center">New Task</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

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
                    {renderQuickActionsWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* Useful Links Widget */}
              {isWidgetVisible('usefulLinks') && (
                <div key="usefulLinks">
                  <GridCard id="usefulLinks">
                    {renderUsefulLinksWidget(true)}
                  </GridCard>
                </div>
              )}

              {/* My Tasks Widget */}
              {isWidgetVisible('myTasks') && (
                <div key="myTasks">
                  <GridCard id="myTasks">
                    {renderMyTasksWidget(true)}
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
        {fullscreenWidget === 'quickActions' && renderQuickActionsWidget()}
        {fullscreenWidget === 'usefulLinks' && renderUsefulLinksWidget()}
        {fullscreenWidget === 'myTasks' && renderMyTasksWidget()}
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

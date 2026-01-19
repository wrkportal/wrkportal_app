'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MoreVertical, BarChart3, TrendingUp, FileText, Users, TrendingDown, Map, AlertTriangle, ClipboardList, Network, Palette, Link as LinkIcon, Briefcase, CheckCircle2, Target, Plus, X, UserCheck, Clock, GripVertical, List, Calendar, Filter, ChevronLeft, ChevronRight, ChevronDown, Minimize, Maximize, Play, Pause, History, Trash2, Activity, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, addDays, isToday } from 'date-fns'
import { TaskDialog } from '@/components/dialogs/task-dialog'
import { TaskDetailDialog } from '@/components/dialogs/task-detail-dialog'
import { TimeTrackingDialog } from '@/components/dialogs/time-tracking-dialog'
import { TimerNotesDialog } from '@/components/dialogs/timer-notes-dialog'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'
import { AdvancedFormsWidget } from '@/components/widgets/AdvancedFormsWidget'
import { AdvancedMindMapWidget } from '@/components/widgets/AdvancedMindMapWidget'
import { AdvancedCanvasWidget } from '@/components/widgets/AdvancedCanvasWidget'
import { GanttChartWidget } from '@/components/widgets/GanttChartWidget'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { useDefaultLayout } from '@/hooks/useDefaultLayout'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

export const defaultWidgets: Widget[] = [
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

export type { Widget }

const initializeDefaultLayout = (): Layouts => {
  const defaultLayout: Layout[] = [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
  ]
  return { lg: defaultLayout, md: defaultLayout, sm: defaultLayout, xs: defaultLayout }
}

export const defaultLayouts: Layouts = initializeDefaultLayout()

export default function FinanceDashboardLandingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const isWrkboard = pathname === '/wrkboard'
  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const { loadDefaultLayout } = useDefaultLayout()
  const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [userGoals, setUserGoals] = useState<any[]>([])
  const [roadmap, setRoadmap] = useState<any[]>([])
  const [blockers, setBlockers] = useState<any[]>([])
  const [teamStatus, setTeamStatus] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])

  // My Tasks widget state
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar' | 'kanban' | 'gantt'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('task-view-mode')
        if (saved && ['list', 'calendar', 'kanban', 'gantt'].includes(saved)) {
          return saved as 'list' | 'calendar' | 'kanban' | 'gantt'
        }
      } catch (error) {
        console.error('Error loading task view mode from localStorage:', error)
      }
    }
    return 'list'
  })
  const [calendarDate, setCalendarDate] = useState(new Date())
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
  const [ganttTimelineStart, setGanttTimelineStart] = useState(new Date())
  const [ganttViewMode, setGanttViewMode] = useState<'days' | 'weeks' | 'months'>('days')
  const [isAddingGanttGroup, setIsAddingGanttGroup] = useState(false)
  const [newGanttGroupName, setNewGanttGroupName] = useState('')
  const [addingTaskToGroup, setAddingTaskToGroup] = useState<string | null>(null)
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set())
  const [hoveredConnector, setHoveredConnector] = useState<number | null>(null)
  const [connectorMousePos, setConnectorMousePos] = useState<{ x: number; y: number } | null>(null)
  const [ganttGroupsLoaded, setGanttGroupsLoaded] = useState(false)

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

  // Finance dashboard data from API
  const [stats, setStats] = useState([
    { label: "Revenue (MTD)", value: "₹0" },
    { label: "Expenses (MTD)", value: "₹0" },
    { label: "Cash on Hand", value: "₹0" },
    { label: "Outstanding Receivables", value: "₹0" },
  ])
  const [invoices, setInvoices] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [forecast, setForecast] = useState<any[]>([])
  const [isLoadingFinanceData, setIsLoadingFinanceData] = useState(true)


  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      const authenticatedUser = await fetchAuthenticatedUser()
      if (authenticatedUser) {
        setUser(authenticatedUser)
      }
    }
    loadUser()
  }, [setUser])

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        setIsLoadingFinanceData(true)
        const response = await fetch('/api/finance/dashboard-stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data.stats || [
            { label: "Revenue (MTD)", value: "₹0" },
            { label: "Expenses (MTD)", value: "₹0" },
            { label: "Cash on Hand", value: "₹0" },
            { label: "Outstanding Receivables", value: "₹0" },
          ])
          setInvoices(data.invoices || [])
          setExpenses(data.expenses || [])
          setForecast(data.forecast || [])
        }
      } catch (error) {
        console.error('Failed to fetch finance data', error)
      } finally {
        setIsLoadingFinanceData(false)
      }
    }
    fetchFinanceData()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/projects')
        let projects: any[] = []
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          projects = projectsData.projects || projectsData || []
          setUserProjects(projects)
        }

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks?includeCreated=true')
        let tasks: any[] = []
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          tasks = tasksData.tasks || tasksData || []
          setUserTasks(tasks)
        }

        // Fetch OKRs/Goals
        try {
          const goalsRes = await fetch('/api/okrs')
          let goals: any[] = []
          if (goalsRes.ok) {
            const goalsData = await goalsRes.json()
            goals = goalsData.goals || goalsData || []
            setUserGoals(goals)
          }
        } catch (error) {
          // API endpoint might not exist, set empty array
          console.warn('Goals API not available:', error)
          setUserGoals([])
        }

        // Calculate roadmap items from projects
        const roadmapItems = projects
          .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
          .slice(0, 4)
          .map((p: any) => ({
            title: p.name,
            status: p.status === 'IN_PROGRESS' ? 'In Progress' :
              p.status === 'PLANNING' ? 'Planning' :
                p.status === 'PLANNED' ? 'Planned' : 'Draft',
            eta: p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          }))
        setRoadmap(roadmapItems)

        // Calculate blockers from blocked tasks
        const blockerItems = tasks
          .filter((t: any) => t.status === 'BLOCKED')
          .slice(0, 3)
          .map((t: any) => ({
            title: t.title,
            team: t.project?.name || 'Unassigned',
            impact: t.priority === 'CRITICAL' ? 'Blocks release' :
              t.priority === 'HIGH' ? 'Delays feature' : 'Minor delay',
            severity: t.priority === 'CRITICAL' ? 'High' :
              t.priority === 'HIGH' ? 'Medium' : 'Low',
          }))
        setBlockers(blockerItems)

        // Calculate team capacity
        const teamMap: Record<string, { tasks: number, load: number }> = {}
        tasks.forEach((t: any) => {
          if (t.assigneeId && t.status !== 'DONE' && t.status !== 'CANCELLED') {
            const current = teamMap[t.assigneeId] || { tasks: 0, load: 0 }
            teamMap[t.assigneeId] = { tasks: current.tasks + 1, load: current.load + 1 }
          }
        })

        const teamStatusItems: any[] = []
        Object.entries(teamMap).forEach(([userId, value]) => {
          const load = Math.min(100, (value.tasks / 10) * 100)
          teamStatusItems.push({
            name: `Team Member ${userId.slice(0, 8)}`,
            load: Math.round(load),
            status: load > 80 ? 'Overloaded' : load > 60 ? 'Busy' : 'Stable',
          })
        })

        if (teamStatusItems.length === 0) {
          setTeamStatus([
            { name: "No team data", load: 0, status: "N/A" },
          ])
        } else {
          setTeamStatus(teamStatusItems.slice(0, 4))
        }

        // Calculate metrics from real data
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0'

        const overdueTasks = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
          return new Date(t.dueDate) < new Date()
        }).length
        const overdueRate = totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : '0'

        const activeProjects = projects.filter((p: any) =>
          p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
        ).length

        setMetrics([
          { label: "Task Completion Rate", value: `${completionRate}%` },
          { label: "Overdue Tasks Rate", value: `${overdueRate}%` },
          { label: "Active Projects", value: activeProjects.toString() },
          { label: "Total Tasks", value: totalTasks.toString() },
        ])

      } catch (error) {
        console.error('Failed to fetch data', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const loadLayouts = async () => {
      // Check for user's saved preferences first
      const saved = localStorage.getItem('finance-widgets')
      const savedLayouts = localStorage.getItem('finance-layouts')

      // Load widgets visibility
      if (saved) {
        try {
          const savedWidgets: Widget[] = JSON.parse(saved)

          // Check if parsed widgets are valid and have the same structure
          if (savedWidgets && Array.isArray(savedWidgets) && savedWidgets.length > 0) {
            // Migration: If all widgets are visible (old default), reset to invisible for welcome message
            const allVisible = savedWidgets.every(w => w.visible === true)
            if (allVisible) {
              console.log('🔄 Migrating finance dashboard: Resetting widgets for welcome message')
              const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
              setWidgets(firstLoginWidgets)
              setWidgetsLoaded(true)
              localStorage.setItem('finance-widgets', JSON.stringify(firstLoginWidgets))
              return
            }

            // Use saved widgets as-is if they match default widget IDs, otherwise merge
            const savedWidgetIds = new Set(savedWidgets.map(w => w.id))
            const defaultWidgetIds = new Set(defaultWidgets.map(w => w.id))

            // If saved widgets have all default IDs, use them directly (they're already saved)
            if (savedWidgetIds.size === defaultWidgetIds.size &&
              Array.from(savedWidgetIds).every(id => defaultWidgetIds.has(id))) {
              // All saved widget IDs match defaults, use saved preferences directly
              setWidgets(savedWidgets)
              setWidgetsLoaded(true)
              return
            }

            // Otherwise, filter out removed widgets and merge with defaults
            const validSavedWidgetIds = new Set(defaultWidgets.map(w => w.id))
            const filteredSavedWidgets = savedWidgets.filter(w => validSavedWidgetIds.has(w.id))

            const mergedWidgets = defaultWidgets.map(defaultWidget => {
              const savedWidget = filteredSavedWidgets.find(w => w.id === defaultWidget.id)
              // If we have a saved widget, use its visibility preference, otherwise default to invisible
              if (savedWidget) {
                return { ...defaultWidget, visible: savedWidget.visible }
              }
              // If no saved widget found, default to invisible (not visible)
              return { ...defaultWidget, visible: false }
            })
            setWidgets(mergedWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('finance-widgets', JSON.stringify(mergedWidgets))
          } else {
            // Invalid saved data, reset to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('finance-widgets', JSON.stringify(firstLoginWidgets))
          }
        } catch (e) {
          console.error('Failed to load widget preferences', e)
          // On error, set all widgets to invisible for first login
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          setWidgetsLoaded(true)
        }
      } else {
        // Try to load from database defaults
        try {
          const dbDefault = await loadDefaultLayout('finance-dashboard')
          if (dbDefault?.widgets) {
            const validWidgetIds = new Set(defaultWidgets.map(w => w.id))
            const mergedWidgets = defaultWidgets.map(defaultWidget => {
              const dbWidget = dbDefault.widgets.find((w: Widget) => w.id === defaultWidget.id)
              // Use database widget visibility if available, otherwise default to invisible
              if (dbWidget && validWidgetIds.has(dbWidget.id)) {
                return { ...defaultWidget, visible: dbWidget.visible || false }
              }
              // If no database widget found, default to invisible
              return { ...defaultWidget, visible: false }
            })
            setWidgets(mergedWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('finance-widgets', JSON.stringify(mergedWidgets))
          } else {
            // No database defaults, set all to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem('finance-widgets', JSON.stringify(firstLoginWidgets))
          }
        } catch (e) {
          console.error('Failed to load default widgets from DB', e)
          // On error, set all widgets to invisible
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          setWidgetsLoaded(true)
          localStorage.setItem('finance-widgets', JSON.stringify(firstLoginWidgets))
        }
      }

      // Load layouts
      if (savedLayouts) {
        try {
          const parsedLayouts: Layouts = JSON.parse(savedLayouts)
          // Filter out layouts for widgets that no longer exist (like leaderboard)
          const validWidgetIds = new Set(defaultWidgets.map(w => w.id))

          const filteredLayouts: Layouts = {}
          Object.keys(parsedLayouts).forEach(breakpoint => {
            const breakpointLayouts = parsedLayouts[breakpoint as keyof Layouts] || []
            // Filter to only include layouts for valid widgets
            filteredLayouts[breakpoint as keyof Layouts] = breakpointLayouts.filter(l => validWidgetIds.has(l.i)) as Layout[]
          })

          // Only use filtered layouts if they have valid entries, otherwise use defaults
          const hasValidLayouts = Object.values(filteredLayouts).some(layouts => layouts.length > 0)
          if (hasValidLayouts) {
            setLayouts(filteredLayouts)
            // Clean up localStorage to remove invalid widgets
            localStorage.setItem('finance-layouts', JSON.stringify(filteredLayouts))
          } else {
            // Try to load from database defaults
            try {
              const dbDefault = await loadDefaultLayout('finance-dashboard')
              if (dbDefault?.layouts) {
                setLayouts(dbDefault.layouts)
              } else {
                setLayouts(defaultLayouts)
              }
            } catch (e) {
              console.error('Failed to load default layouts from DB', e)
              setLayouts(defaultLayouts)
            }
          }
        } catch (e) {
          console.error('Failed to load layouts', e)
          setLayouts(defaultLayouts)
        }
      } else {
        // No saved layouts - try to load from database defaults
        try {
          const dbDefault = await loadDefaultLayout('finance-dashboard')
          if (dbDefault?.layouts) {
            setLayouts(dbDefault.layouts)
          } else {
            setLayouts(defaultLayouts)
          }
        } catch (e) {
          console.error('Failed to load default layouts from DB', e)
          setLayouts(defaultLayouts)
        }
      }

      // Mark initial mount as complete after a short delay to prevent onLayoutChange from firing
      setTimeout(() => {
        setIsInitialMount(false)
      }, 100)

      const savedLinks = localStorage.getItem('finance-useful-links')
      if (savedLinks) {
        try {
          setUsefulLinks(JSON.parse(savedLinks))
        } catch (e) {
          console.error('Failed to load useful links', e)
        }
      }
    }

    loadLayouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    // Don't save on initial mount to prevent overwriting saved layouts
    if (isInitialMount) {
      return
    }
    setLayouts(allLayouts)
    localStorage.setItem('finance-layouts', JSON.stringify(allLayouts))
  }

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

  const getStatusColor = (status: string, task?: any) => {
    switch (status) {
      case 'DONE': return 'bg-green-500'
      case 'IN_REVIEW': return 'bg-yellow-500'
      case 'IN_PROGRESS': return 'bg-blue-500'
      case 'TODO': return 'bg-gray-400'
      default: return 'bg-gray-400'
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
                                                <div className="grid grid-cols-3 gap-2 p-2 hover:bg-accent/50 text-xs border-b">
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
                                                      <span className="capitalize">{taskStatus.replace('_', ' ')}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground"
                                                        onClick={() => {
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
                                                        onClick={() => deleteGanttTask(group.id, task.id)}
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
                                                          <div className="grid grid-cols-3 gap-2 p-2 hover:bg-accent/50 text-xs border-b bg-muted/30">
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
                                                                <span className="capitalize">{subtaskStatus.replace('_', ' ')}</span>
                                                              </div>
                                                              <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-4 w-4 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                onClick={() => deleteGanttTask(group.id, subtask.id)}
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
                                        {position.left >= 0 && position.left < maxPosition && (
                                          <div
                                            className={cn(
                                              "absolute top-1 h-6 rounded flex items-center px-2 text-[10px] text-white font-medium cursor-pointer hover:opacity-80 transition-opacity",
                                              getStatusColor(taskStatus, task)
                                            )}
                                            style={{
                                              left: `${position.left}px`,
                                              width: `${position.width}px`,
                                              minWidth: '60px'
                                            }}
                                            onClick={() => {
                                              setSelectedTaskId(task.id)
                                              setTaskDetailDialogOpen(true)
                                            }}
                                            title={task.title}
                                          >
                                            <span className="truncate">{task.title}</span>
                                          </div>
                                        )}
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

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => {
      const existingWidget = prevWidgets.find(w => w.id === widgetId)
      let updatedWidgets: Widget[]

      if (existingWidget) {
        // Toggle visibility of existing widget
        updatedWidgets = prevWidgets.map(w =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        )
      } else {
        // Add new widget if it doesn't exist
        updatedWidgets = [...prevWidgets, { id: widgetId, type: widgetId, visible: true }]
      }

      // Save to localStorage immediately
      localStorage.setItem('finance-widgets', JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }, [])

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stats':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {isLoadingFinanceData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {stats.map((s) => (
                    <div
                      key={s.label}
                      className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5 shadow-sm"
                    >
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {s.label}
                      </div>
                      <div className="text-lg font-semibold">{s.value}</div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'invoices':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Invoices</CardTitle>
              <CardDescription className="text-xs">Incoming payments status.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {isLoadingFinanceData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No invoices found
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv, idx) => (
                    <div
                      key={inv.company}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{inv.company}</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] ${inv.status === "Paid"
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : inv.status === "Pending"
                              ? "border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                              : "border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                            }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px]">Amount: {inv.amount}</div>
                      <div className="text-muted-foreground text-[11px]">Due: {inv.due}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'forecast':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Financial Forecast</CardTitle>
              <CardDescription className="text-xs">Where you're headed financially.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {isLoadingFinanceData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : forecast.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No forecasts available
                </div>
              ) : (
                <div className="space-y-4">
                  {forecast.map((f, idx) => (
                    <div
                      key={f.label}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{f.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${f.risk === "Low"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : f.risk === "Medium"
                              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                              : "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                            }`}
                        >
                          {f.risk}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-1">{f.value}</div>
                    </div>
                  ))}
                  <div className="h-32 rounded-xl bg-muted border border-border flex items-center justify-center text-[11px] text-muted-foreground">
                    [Cashflow / Projection Chart Placeholder]
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'expenses':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Expenses Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {isLoadingFinanceData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : expenses.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No expenses found
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((e, idx) => (
                    <div
                      key={e.category}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">{e.category}</span>
                        <span className="text-foreground">{e.amount}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                            style={{
                              width:
                                e.trend === "Stable"
                                  ? "45%"
                                  : e.trend === "Increasing"
                                    ? "70%"
                                    : "85%",
                            }}
                          ></div>
                        </div>
                        <span>{e.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'roadmap':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Roadmap Items</CardTitle>
              <CardDescription className="text-xs">What's shipping next?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {roadmap.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {roadmap.map((r) => (
                    <div
                      key={r.title}
                      className="rounded-xl border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{r.title}</div>
                        <span className="rounded-full px-2 py-0.5 bg-muted border border-border text-[10px] text-muted-foreground">
                          {r.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-1">ETA: {r.eta}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Map className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No roadmap items yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'metrics':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Key Delivery Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
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
                [Velocity / Burndown Chart Placeholder]
              </div>
            </CardContent>
          </Card>
        )

      case 'blockers':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Top Blockers</CardTitle>
              <CardDescription className="text-xs">What's slowing us down?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {blockers.length > 0 ? (
                <div className="space-y-3">
                  {blockers.map((b) => (
                    <div
                      key={b.title}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{b.title}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${b.severity === "High"
                            ? "border border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                            : b.severity === "Medium"
                              ? "border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                              : "border border-border bg-muted text-muted-foreground"
                            }`}
                        >
                          {b.severity}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1">{b.team} Team</div>
                      <div className="text-muted-foreground text-[11px]">{b.impact}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No blockers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'teamCapacity':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Team Capacity & Load</CardTitle>
              <CardDescription className="text-xs">Who's overloaded? Who's free?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {teamStatus.length > 0 ? (
                <div className="space-y-3">
                  {teamStatus.map((t) => (
                    <div
                      key={t.name}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{t.name}</div>
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                            style={{ width: `${t.load}%` }}
                          />
                        </div>
                        <span>{t.load}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No team data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'recentProjects':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Projects</CardTitle>
                  <CardDescription className="text-xs">Your latest projects</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/projects/new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userProjects.length > 0 ? (
                <div className="space-y-3">
                  {userProjects
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5)
                    .map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${project.ragStatus === 'GREEN' ? 'bg-green-500' :
                                project.ragStatus === 'AMBER' ? 'bg-yellow-500' :
                                  project.ragStatus === 'RED' ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                            />
                            <p className="font-medium text-sm">{project.name}</p>
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                          {project.progress !== undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/projects/new')}
                  >
                    Create your first project →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'myTasks':
      case 'my-tasks':
        return renderMyTasksWidget()

      case 'assignedToOthers':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div>
                <CardTitle className="text-base">Assigned to Others</CardTitle>
                <CardDescription className="text-xs">Tasks you assigned to team members</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userTasks.filter(task => task.createdById === user?.id && task.assigneeId !== user?.id && task.assigneeId).length > 0 ? (
                <div className="space-y-3">
                  {userTasks
                    .filter(task => task.createdById === user?.id && task.assigneeId !== user?.id && task.assigneeId)
                    .slice(0, 5)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.project && (
                            <p className="text-xs text-muted-foreground">{task.project.name}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {task.status}
                            </Badge>
                            <Badge
                              variant={
                                task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'destructive' :
                                  task.priority === 'MEDIUM' ? 'secondary' : 'default'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.image || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(task.assignee.name || task.assignee.firstName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {task.assignee.name || `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No tasks assigned to others</p>
                  <p className="text-xs text-muted-foreground">
                    Tasks you create and assign to team members will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'activeOKRs':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Active OKRs</CardTitle>
                  <CardDescription className="text-xs">Your objectives and key results</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/okrs')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userGoals.length > 0 ? (
                <div className="space-y-4">
                  {userGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="space-y-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push('/okrs')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {goal.level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {goal.quarter} {goal.year}
                          </p>
                        </div>
                      </div>
                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="space-y-2">
                          {goal.keyResults.slice(0, 2).map((kr: any) => {
                            const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
                            const clampedProgress = Math.max(0, Math.min(progress, 100))
                            return (
                              <div key={kr.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground truncate flex-1">{kr.title}</span>
                                  <span className="font-medium ml-2">{Math.round(clampedProgress)}%</span>
                                </div>
                                <Progress value={clampedProgress} className="h-1" />
                              </div>
                            )
                          })}
                          {goal.keyResults.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                              +{goal.keyResults.length - 2} more key result{goal.keyResults.length - 2 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {userGoals.length > 3 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => router.push('/okrs')}
                    >
                      View all {userGoals.length} goals →
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No active OKRs yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/okrs')}
                  >
                    Set your first goal →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'quickActions':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Fast access to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/projects/new')}>
                  <Plus className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Project</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/releases/new')}>
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Release</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/roadmap')}>
                  <Map className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">Roadmap</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/teams/new')}>
                  <Users className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Team</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/backlog')}>
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">Backlog</span>
                </Button>
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
                    onClick={() => {
                      if (newLinkTitle && newLinkUrl) {
                        const newLink = {
                          id: Date.now().toString(),
                          title: newLinkTitle,
                          url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
                        }
                        const updated = [...usefulLinks, newLink]
                        setUsefulLinks(updated)
                        localStorage.setItem('finance-useful-links', JSON.stringify(updated))
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
                            localStorage.setItem('finance-useful-links', JSON.stringify(updated))
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

      case 'forms':
        return <AdvancedFormsWidget />

      case 'mindMap':
        return <AdvancedMindMapWidget />

      case 'canvas':
        return <AdvancedCanvasWidget />

      case 'ganttChart':
        return <GanttChartWidget />

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar with Title and Tabs */}
        <FinanceNavBar widgets={widgets} toggleWidget={toggleWidget} widgetGalleryOpen={widgetGalleryOpen} onWidgetGalleryOpenChange={setWidgetGalleryOpen} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 lg:py-6">
          {/* Greeting Header */}
          <div className="mb-6">
            {(() => {
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
                      <h3 className="text-2xl font-semibold mb-3">
                        {isWrkboard ? 'Welcome to Your wrkBoard' : 'Welcome to Your Finance Dashboard'}
                      </h3>
                      <p className="text-muted-foreground mb-2 text-lg">
                        {isWrkboard
                          ? 'Customize your board with widgets, reminders, charts, and more.'
                          : 'Get started by adding your first widgets and data.'
                        }
                      </p>
                      <p className="text-muted-foreground mb-8">
                        {isWrkboard
                          ? 'Add widgets to track your tasks, projects, goals, and organize your work exactly how you need it.'
                          : "Once you start adding widgets, you'll see beautiful visualizations and insights here."
                        }
                      </p>
                      <div className={`grid gap-3 max-w-md mx-auto ${isWrkboard ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                        {!isWrkboard && (
                          <Button
                            variant="outline"
                            onClick={() => router.push('/finance-dashboard/reports')}
                            className="flex items-center gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            View Reports
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <>
                  {!hasVisibleWidgets ? (
                    <EmptyState />
                  ) : (
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {greeting}, {user?.firstName || 'there'}!
                      </h1>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {isWrkboard ? 'Your Personal Workspace' : 'Welcome to Your Finance Dashboard'}
                      </p>
                    </div>
                  )}
                </>
              )
            })()}
          </div>
          {widgets.some(w => w.visible) && (
            <>
              {isMobile ? (
                /* Mobile: Simple Stacked Layout */
                <div className="space-y-4">
                  {widgets.map((widget) =>
                    widget.visible ? (
                      <div key={widget.id} className="w-full">
                        {renderWidget(widget)}
                      </div>
                    ) : null
                  )}
                </div>
              ) : (
                /* Desktop: Draggable Grid Layout */
                <div className="finance-grid">
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
                    {widgets.map((widget) =>
                      widget.visible ? (
                        <div key={widget.id} className="relative group">
                          {/* Drag Handle - appears on hover */}
                          <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                            <GripVertical className="h-3.5 w-3.5 text-white" />
                          </div>
                          {renderWidget(widget)}
                        </div>
                      ) : null
                    )}
                  </ResponsiveGridLayout>
                </div>
              )}
            </>
          )}

        </div>
      </main>

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
              ? { ...data, parentTaskId: addingTaskToGroup }
              : data

            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData)
            })

            if (response.ok) {
              await fetchUserTasks()
              setTaskDialogOpen(false)
              setAddingTaskToGroup(null)
            }
          } catch (error) {
            console.error('Error creating task:', error)
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
    </div>
  )
}

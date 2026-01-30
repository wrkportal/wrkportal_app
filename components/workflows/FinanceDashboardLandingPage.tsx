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
import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { useDefaultLayout } from '@/hooks/useDefaultLayout'
import type { QuickAction } from '@/types/widgets'

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
  // Initialize layouts from localStorage immediately to prevent default overwrite
  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window !== 'undefined') {
      // Determine which key to use based on current pathname
      const currentPath = window.location.pathname
      const layoutsKey = currentPath === '/wrkboard' ? 'wrkboard-layouts' : 'finance-layouts'
      const savedLayouts = localStorage.getItem(layoutsKey)
      if (savedLayouts) {
        try {
          const parsed = JSON.parse(savedLayouts)
          const validWidgetIds = new Set(defaultWidgets.map(w => w.id))
          const filteredLayouts: Layouts = {}
          Object.keys(parsed).forEach(breakpoint => {
            const breakpointLayouts = parsed[breakpoint as keyof Layouts] || []
            filteredLayouts[breakpoint as keyof Layouts] = breakpointLayouts.filter((l: Layout) => validWidgetIds.has(l.i)) as Layout[]
          })
          const hasValidLayouts = Object.values(filteredLayouts).some(layouts => layouts.length > 0)
          if (hasValidLayouts) {
            return filteredLayouts
          }
        } catch (e) {
          console.error('Failed to load layouts from localStorage in useState:', e)
        }
      }
    }
    return defaultLayouts
  })
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const { loadDefaultLayout } = useDefaultLayout()
  // Quick actions for finance dashboard
  const financeQuickActions: QuickAction[] = [
    {
      id: 'new-project',
      label: 'New Project',
      icon: Plus,
      href: '/projects/new',
      variant: 'outline',
    },
    {
      id: 'new-release',
      label: 'New Release',
      icon: CheckCircle2,
      href: '/releases/new',
      variant: 'outline',
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      icon: Map,
      href: '/roadmap',
      variant: 'outline',
    },
    {
      id: 'new-team',
      label: 'New Team',
      icon: Users,
      href: '/teams/new',
      variant: 'outline',
    },
    {
      id: 'backlog',
      label: 'Backlog',
      icon: Briefcase,
      href: '/backlog',
      variant: 'outline',
    },
  ]
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
      // Use different localStorage keys for wrkboard vs finance-dashboard
      const widgetsKey = isWrkboard ? 'wrkboard-widgets' : 'finance-widgets'
      const layoutsKey = isWrkboard ? 'wrkboard-layouts' : 'finance-layouts'
      
      // Check for user's saved preferences first
      const saved = localStorage.getItem(widgetsKey)
      const savedLayouts = localStorage.getItem(layoutsKey)

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
              localStorage.setItem(widgetsKey, JSON.stringify(firstLoginWidgets))
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
          localStorage.setItem(widgetsKey, JSON.stringify(mergedWidgets))
          } else {
            // Invalid saved data, reset to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem(widgetsKey, JSON.stringify(firstLoginWidgets))
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
          const dbDefault = await loadDefaultLayout(isWrkboard ? 'wrkboard' : 'finance-dashboard')
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
            localStorage.setItem(widgetsKey, JSON.stringify(mergedWidgets))
          } else {
            // No database defaults, set all to invisible
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            setWidgetsLoaded(true)
            localStorage.setItem(widgetsKey, JSON.stringify(firstLoginWidgets))
          }
        } catch (e) {
          console.error('Failed to load default widgets from DB', e)
          // On error, set all widgets to invisible
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          setWidgetsLoaded(true)
          localStorage.setItem(widgetsKey, JSON.stringify(firstLoginWidgets))
        }
      }

      // Load layouts - only update if different from what's already loaded in useState
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
            // Only update if different from current state to avoid unnecessary re-renders
            setLayouts(prev => {
              const prevStr = JSON.stringify(prev)
              const newStr = JSON.stringify(filteredLayouts)
              if (prevStr !== newStr) {
                return filteredLayouts
              }
              return prev
            })
            // Clean up localStorage to remove invalid widgets
            localStorage.setItem(layoutsKey, JSON.stringify(filteredLayouts))
          } else {
            // Try to load from database defaults
            try {
              const dbDefault = await loadDefaultLayout(isWrkboard ? 'wrkboard' : 'finance-dashboard')
              if (dbDefault?.layouts) {
                setLayouts(dbDefault.layouts)
              } else {
                // Only set defaults if not already set
                setLayouts(prev => {
                  const prevStr = JSON.stringify(prev)
                  const defaultStr = JSON.stringify(defaultLayouts)
                  if (prevStr !== defaultStr) {
                    return defaultLayouts
                  }
                  return prev
                })
              }
            } catch (e) {
              console.error('Failed to load default layouts from DB', e)
              // Only set defaults if not already set
              setLayouts(prev => {
                const prevStr = JSON.stringify(prev)
                const defaultStr = JSON.stringify(defaultLayouts)
                if (prevStr !== defaultStr) {
                  return defaultLayouts
                }
                return prev
              })
            }
          }
        } catch (e) {
          console.error('Failed to load layouts', e)
          // Only set defaults if not already set
          setLayouts(prev => {
            const prevStr = JSON.stringify(prev)
            const defaultStr = JSON.stringify(defaultLayouts)
            if (prevStr !== defaultStr) {
              return defaultLayouts
            }
            return prev
          })
        }
      } else {
        // No saved layouts - try to load from database defaults
        try {
          const dbDefault = await loadDefaultLayout(isWrkboard ? 'wrkboard' : 'finance-dashboard')
          if (dbDefault?.layouts) {
            setLayouts(dbDefault.layouts)
          } else {
            // Only set defaults if not already set
            setLayouts(prev => {
              const prevStr = JSON.stringify(prev)
              const defaultStr = JSON.stringify(defaultLayouts)
              if (prevStr !== defaultStr) {
                return defaultLayouts
              }
              return prev
            })
          }
        } catch (e) {
          console.error('Failed to load default layouts from DB', e)
          // Only set defaults if not already set
          setLayouts(prev => {
            const prevStr = JSON.stringify(prev)
            const defaultStr = JSON.stringify(defaultLayouts)
            if (prevStr !== defaultStr) {
              return defaultLayouts
            }
            return prev
          })
        }
      }

      // Mark initial mount as complete after a short delay to prevent onLayoutChange from firing
      setTimeout(() => {
        setIsInitialMount(false)
      }, 100)

      const linksKey = isWrkboard ? 'wrkboard-useful-links' : 'finance-useful-links'
      const savedLinks = localStorage.getItem(linksKey)
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
    const layoutsKey = isWrkboard ? 'wrkboard-layouts' : 'finance-layouts'
    localStorage.setItem(layoutsKey, JSON.stringify(allLayouts))
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

  // renderMyTasksWidget removed - now using centralized MyTasksWidget component

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => {
      const existingWidget = prevWidgets.find(w => w.id === widgetId)
      const isBeingEnabled = existingWidget ? !existingWidget.visible : true
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
      const widgetsKey = isWrkboard ? 'wrkboard-widgets' : 'finance-widgets'
      localStorage.setItem(widgetsKey, JSON.stringify(updatedWidgets))

      // If widget is being enabled and doesn't have a layout entry, add it
      if (isBeingEnabled) {
        setLayouts(prevLayouts => {
          const layoutsKey = isWrkboard ? 'wrkboard-layouts' : 'finance-layouts'
          const hasLayout = Object.values(prevLayouts).some(breakpointLayouts =>
            breakpointLayouts.some(l => l.i === widgetId)
          )

          if (!hasLayout) {
            const defaultLayoutItem: Layout = {
              i: widgetId,
              x: 0,
              y: 100, // Place at the end
              w: widgetId === 'mindMap' ? 12 : 6,
              h: widgetId === 'mindMap' ? 10 : 4,
              minW: widgetId === 'mindMap' ? 16 : 3,
              minH: widgetId === 'mindMap' ? 12 : 2,
            }

            const updatedLayouts: Layouts = {
              lg: [...(prevLayouts.lg || []), defaultLayoutItem],
              md: [...(prevLayouts.md || []), defaultLayoutItem],
              sm: [...(prevLayouts.sm || []), defaultLayoutItem],
              xs: [...(prevLayouts.xs || []), defaultLayoutItem],
            }

            localStorage.setItem(layoutsKey, JSON.stringify(updatedLayouts))
            return updatedLayouts
          }
          return prevLayouts
        })
      }

      return updatedWidgets
    })
  }, [isWrkboard])

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
        return (
          <MyTasksWidget
            tasks={userTasks.filter(task => task.assigneeId === user?.id)}
            widgetId="myTasks"
            fullscreen={fullscreenWidget === 'myTasks'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType={isWrkboard ? 'general' : 'finance'}
            basePath={isWrkboard ? '/wrkboard' : '/finance-dashboard'}
            defaultViewMode={taskViewMode}
          />
        )

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
          <QuickActionsWidget
            actions={financeQuickActions}
            widgetId="quickActions"
            fullscreen={fullscreenWidget === 'quickActions'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType={isWrkboard ? 'general' : 'finance'}
            columns={3}
          />
        )

      case 'usefulLinks':
        return (
          <UsefulLinksWidget
            storageKey={isWrkboard ? 'wrkboard-useful-links' : 'finance-useful-links'}
            widgetId="usefulLinks"
            fullscreen={fullscreenWidget === 'usefulLinks'}
            onToggleFullscreen={toggleFullscreen}
          />
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
                    <div className="md:ml-2">
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
      {fullscreenWidget === 'myTasks' && (
        <MyTasksWidget
          tasks={userTasks.filter(task => task.assigneeId === user?.id)}
          widgetId="myTasks"
          fullscreen={true}
          onToggleFullscreen={toggleFullscreen}
          dashboardType={isWrkboard ? 'general' : 'finance'}
          basePath={isWrkboard ? '/wrkboard' : '/finance-dashboard'}
          defaultViewMode={taskViewMode}
        />
      )}

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

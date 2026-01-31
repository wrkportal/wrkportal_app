'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, memo } from 'react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Briefcase, UserCheck, TrendingUp, Clock, Calendar, Award, Target, GripVertical, BarChart3, TrendingDown, DollarSign, CheckCircle2, List, LayoutGrid, Filter, Plus, Minimize, Maximize, X, Play, Pause, History, Trash2, ChevronLeft, ChevronRight, ChevronDown, Activity, Link as LinkIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/lib/utils'
import { format, addDays, isToday, startOfWeek } from 'date-fns'

// Dynamic imports for heavy components using React.lazy with wrapper components
// Note: We'll use dynamic imports with useState/useEffect pattern for better control
let rechartsModule: any = null
let reactGridLayoutModule: any = null

// Load recharts dynamically
const loadRecharts = async () => {
  if (!rechartsModule) {
    rechartsModule = await import('recharts')
  }
  return rechartsModule
}

// Load react-grid-layout dynamically
const loadReactGridLayout = async () => {
  if (!reactGridLayoutModule) {
    reactGridLayoutModule = await import('react-grid-layout')
  }
  return reactGridLayoutModule
}

const TaskDialog = lazy(() => import('@/components/dialogs/task-dialog').then(m => ({ default: m.TaskDialog })))
const TaskDetailDialog = lazy(() => import('@/components/dialogs/task-detail-dialog').then(m => ({ default: m.TaskDetailDialog })))
const TimeTrackingDialog = lazy(() => import('@/components/dialogs/time-tracking-dialog').then(m => ({ default: m.TimeTrackingDialog })))
const TimerNotesDialog = lazy(() => import('@/components/dialogs/timer-notes-dialog').then(m => ({ default: m.TimerNotesDialog })))
const AdvancedMindMapWidget = lazy(() => import('@/components/widgets/AdvancedMindMapWidget').then(m => ({ default: m.AdvancedMindMapWidget })))
const AdvancedCanvasWidget = lazy(() => import('@/components/widgets/AdvancedCanvasWidget').then(m => ({ default: m.AdvancedCanvasWidget })))
import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'

// Load CSS for react-grid-layout (dynamically)
if (typeof window !== 'undefined') {
  import('react-grid-layout/css/styles.css').catch(() => { })
  import('react-resizable/css/styles.css').catch(() => { })
}

// Type definitions
type Layout = { i: string; x: number; y: number; w: number; h: number; minW?: number; minH?: number }
type Layouts = { lg?: Layout[]; md?: Layout[]; sm?: Layout[]; xs?: Layout[]; xxs?: Layout[] }

// Loading fallback component
const LoadingFallback = memo(() => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
))

LoadingFallback.displayName = 'LoadingFallback'

// Recharts wrapper component with dynamic loading
const RechartsWrapper = memo(({ children }: { children: (Recharts: any) => React.ReactNode }) => {
  const [recharts, setRecharts] = useState<any>(null)

  useEffect(() => {
    loadRecharts().then(setRecharts)
  }, [])

  if (!recharts) {
    return <LoadingFallback />
  }

  return <>{children(recharts)}</>
})

RechartsWrapper.displayName = 'RechartsWrapper'

// Grid Layout wrapper component with dynamic loading
const GridLayoutWrapper = memo(({
  children,
  layouts,
  onLayoutChange,
  breakpoints,
  cols,
  rowHeight,
  draggableHandle,
  isDraggable,
  isResizable,
  className
}: {
  children: React.ReactNode
  layouts: Layouts
  onLayoutChange: (currentLayout: Layout[], allLayouts: Layouts) => void
  breakpoints: { lg: number; md: number; sm: number; xs: number; xxs: number }
  cols: { lg: number; md: number; sm: number; xs: number; xxs: number }
  rowHeight: number
  draggableHandle?: string
  isDraggable?: boolean
  isResizable?: boolean
  className?: string
}) => {
  const [GridLayout, setGridLayout] = useState<any>(null)

  useEffect(() => {
    loadReactGridLayout().then((module) => {
      const { Responsive, WidthProvider } = module
      const ResponsiveGridLayout = WidthProvider(Responsive)
      setGridLayout(() => ResponsiveGridLayout)
    })
  }, [])

  if (!GridLayout) {
    return <LoadingFallback />
  }

  return (
    <GridLayout
      className={className}
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={rowHeight}
      draggableHandle={draggableHandle}
      isDraggable={isDraggable}
      isResizable={isResizable}
    >
      {children}
    </GridLayout>
  )
})

GridLayoutWrapper.displayName = 'GridLayoutWrapper'

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'myTasks', type: 'myTasks', visible: true },
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: true },
  { id: 'metrics', type: 'metrics', visible: true },
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
]

interface DashboardStats {
  totalCandidates: number
  activeJobs: number
  scheduledInterviews: number
  hireRate: number
  avgTimeToHire: number
  openPositions: number
  offersExtended: number
  onboardingCount: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d', '#8dd1e1', '#d084d0']

// API Request deduplication and batching
const pendingRequests = new Map<string, Promise<any>>()

const deduplicatedFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const key = `${url}${JSON.stringify(options)}`

  if (pendingRequests.has(key)) {
    // Wait for existing request and return a cloned response
    const existingResponse = await pendingRequests.get(key)
    return existingResponse.clone()
  }

  const requestPromise = fetch(url, options).then(async (response) => {
    // Cache the response before removing from pending
    const clonedResponse = response.clone()
    pendingRequests.delete(key)
    return clonedResponse
  }).catch((error) => {
    pendingRequests.delete(key)
    throw error
  })

  pendingRequests.set(key, requestPromise)
  return requestPromise
}

// Batch multiple API calls
const batchFetch = async (urls: string[]): Promise<Response[]> => {
  return Promise.all(urls.map(url => deduplicatedFetch(url)))
}

const defaultLayouts: Layouts = {
  lg: [
    // Key Recruitment Metrics
    { i: 'metrics', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 4 },
    // Quick Actions & Useful Links
    { i: 'quickActions', x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 6, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    // My Tasks
    { i: 'myTasks', x: 0, y: 12, w: 12, h: 10, minW: 6, minH: 8 },
    // Mind Map & Canvas
    { i: 'mindMap', x: 0, y: 22, w: 6, h: 8, minW: 16, minH: 12 },
    { i: 'canvas', x: 6, y: 22, w: 6, h: 8, minW: 3, minH: 8 },
  ],
  md: [
    { i: 'metrics', x: 0, y: 0, w: 10, h: 6, minW: 5, minH: 4 },
    { i: 'quickActions', x: 0, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 5, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 12, w: 10, h: 10, minW: 5, minH: 8 },
    { i: 'mindMap', x: 0, y: 22, w: 5, h: 8, minW: 16, minH: 12 },
    { i: 'canvas', x: 5, y: 22, w: 5, h: 8, minW: 3, minH: 8 },
  ],
  sm: [
    { i: 'metrics', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'quickActions', x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 18, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'mindMap', x: 0, y: 28, w: 6, h: 8, minW: 16, minH: 12 },
    { i: 'canvas', x: 0, y: 36, w: 6, h: 8, minW: 3, minH: 8 },
  ],
}

function RecruitmentDashboardPageInner() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  // 🔐 Auth guard
  if (!user) {
    router.push('/login')
    return null
  }


  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    activeJobs: 0,
    scheduledInterviews: 0,
    hireRate: 0,
    avgTimeToHire: 0,
    openPositions: 0,
    offersExtended: 0,
    onboardingCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [candidatesData, setCandidatesData] = useState<any[]>([])
  const [jobsData, setJobsData] = useState<any[]>([])
  const [sourcesData, setSourcesData] = useState<any[]>([])
  const [stagesData, setStagesData] = useState<any[]>([])
  const [pipelineData, setPipelineData] = useState<any>(null)
  const [timeToHireData, setTimeToHireData] = useState<any>(null)
  const [sourcePerformanceData, setSourcePerformanceData] = useState<any>(null)
  // Initialize layouts from localStorage immediately to prevent default overwrite
  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window !== 'undefined') {
      const savedLayouts = localStorage.getItem('recruitment-dashboard-layouts')
      if (savedLayouts) {
        try {
          return JSON.parse(savedLayouts)
        } catch (error) {
          console.error('Error loading layouts from localStorage in useState:', error)
        }
      }
    }
    return defaultLayouts
  })
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
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
  // Default to 'gantt' - will be overridden by localStorage if user has a saved preference
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
  const ganttScrollContainerRef = useRef<HTMLDivElement | null>(null)
  const calendarScrollContainerRef = useRef<HTMLDivElement | null>(null)
  const datesInitializedRef = useRef(false)

  // Gantt task reordering state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null)

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
    // Only load from localStorage after mount to avoid hydration mismatch
    if (typeof window === 'undefined') return

    // Load saved widgets
    const savedWidgets = localStorage.getItem('recruitment-widgets')
    if (savedWidgets) {
      try {
        const parsed: Widget[] = JSON.parse(savedWidgets)

        // Check if parsed widgets are valid and have the same structure
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          // Migration: If all widgets are visible (old default), reset to invisible for welcome message
          const allVisible = parsed.every(w => w.visible === true)
          if (allVisible) {
            console.log('🔄 Migrating recruitment dashboard: Resetting widgets for welcome message')
            const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
            setWidgets(firstLoginWidgets)
            localStorage.setItem('recruitment-widgets', JSON.stringify(firstLoginWidgets))
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
          localStorage.setItem('recruitment-widgets', JSON.stringify(mergedWidgets))
        } else {
          // Invalid saved data, reset to invisible
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          setWidgetsLoaded(true)
          localStorage.setItem('recruitment-widgets', JSON.stringify(firstLoginWidgets))
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
      localStorage.setItem('recruitment-widgets', JSON.stringify(firstLoginWidgets))
    }

    const savedLayouts = localStorage.getItem('recruitment-dashboard-layouts')
    if (savedLayouts) {
      try {
        const parsed = JSON.parse(savedLayouts)
        // Only update if different from current state
        setLayouts(prev => {
          const prevStr = JSON.stringify(prev)
          const newStr = JSON.stringify(parsed)
          if (prevStr !== newStr) {
            return parsed
          }
          return prev
        })
      } catch (error) {
        console.error('Error loading saved layouts:', error)
      }
    }

    // Load useful links
    try {
      const savedLinks = localStorage.getItem('recruitment-useful-links')
      if (savedLinks) {
        setUsefulLinks(JSON.parse(savedLinks))
      }
    } catch (error) {
      console.error('Error loading useful links:', error)
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    setIsInitialMount(false)
    setIsMounted(true)

    // Batch fetch all recruitment data at once
    fetchAllRecruitmentData()

    if (user?.id) {
      fetchUserTasks()
      checkActiveTimer()
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [user?.id])

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

  // Initialize dates after hydration to avoid hydration mismatch
  useEffect(() => {
    if (!datesInitializedRef.current) {
      setCalendarDate(new Date())
      setGanttTimelineStart(new Date())
      datesInitializedRef.current = true
    }
  }, [])

  // Load ganttGroups structure from localStorage after hydration, then populate with tasks
  useEffect(() => {
    if (typeof window === 'undefined' || ganttGroupsLoaded) return

    try {
      const saved = localStorage.getItem('recruitment-gantt-groups')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Load group structure but clear tasks (will be repopulated from userTasks)
        const groupsStructure = parsed.map((g: any) => ({ ...g, tasks: [] }))
        setGanttGroups(groupsStructure)
      }
      setGanttGroupsLoaded(true)
    } catch (error) {
      console.error('Error loading gantt groups from localStorage:', error)
      setGanttGroupsLoaded(true)
    }
  }, [ganttGroupsLoaded])

  // Load task colors from localStorage after hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('recruitment-task-colors')
        if (saved) {
          setTaskColors(JSON.parse(saved))
        }
      } catch (error) {
        console.error('Error loading task colors from localStorage:', error)
      }
    }
  }, [])


  // Organize tasks into ganttGroups when userTasks change (after groups are loaded)
  useEffect(() => {
    if (!ganttGroupsLoaded || userTasks.length === 0) return

    setGanttGroups(prevGroups => {
      // Load task-to-group mapping from localStorage
      let taskToGroupMap: Record<string, string> = {}
      try {
        const saved = localStorage.getItem('recruitment-task-group-map')
        if (saved) {
          taskToGroupMap = JSON.parse(saved)
        }
      } catch (error) {
        console.error('Error loading task-group mapping:', error)
      }

      // If no groups exist and we have tasks, create a default "All Tasks" group
      if (prevGroups.length === 0) {
        const defaultGroup = {
          id: 'all-tasks',
          name: 'All Tasks',
          expanded: true,
          tasks: [...userTasks]
        }
        // Save mapping for all tasks to this group
        const newMap: Record<string, string> = {}
        userTasks.forEach(task => {
          newMap[task.id] = 'all-tasks'
        })
        try {
          localStorage.setItem('recruitment-task-group-map', JSON.stringify(newMap))
        } catch (error) {
          console.error('Error saving task-group mapping:', error)
        }
        return [defaultGroup]
      }

      // If groups exist, organize tasks into groups based on mapping or groupId
      type GanttGroup = { id: string; name: string; expanded: boolean; tasks: any[] }
      const groupsMap = new Map<string, GanttGroup>(prevGroups.map(g => [g.id, { ...g, tasks: [] }]))
      const assignedTaskIds = new Set<string>()

      // First, assign tasks based on mapping
      userTasks.forEach(task => {
        const groupId = taskToGroupMap[task.id] || task.ganttGroupId || task.groupId

        if (groupId && groupsMap.has(groupId)) {
          const group = groupsMap.get(groupId)!
          group.tasks.push(task)
          assignedTaskIds.add(task.id)
        }
      })

      // For tasks without a group assignment, add them to the first group (or create default)
      const unassignedTasks = userTasks.filter(task => !assignedTaskIds.has(task.id))

      if (unassignedTasks.length > 0) {
        let targetGroup: GanttGroup | undefined = Array.from(groupsMap.values())[0]

        // If no groups exist, create default
        if (!targetGroup) {
          targetGroup = {
            id: 'all-tasks',
            name: 'All Tasks',
            expanded: true,
            tasks: []
          }
          groupsMap.set('all-tasks', targetGroup)
        }

        targetGroup.tasks.push(...unassignedTasks)

        // Update mapping
        unassignedTasks.forEach(task => {
          taskToGroupMap[task.id] = targetGroup.id
        })
      }

      // Save updated mapping
      try {
        localStorage.setItem('recruitment-task-group-map', JSON.stringify(taskToGroupMap))
      } catch (error) {
        console.error('Error saving task-group mapping:', error)
      }

      return Array.from(groupsMap.values())
    })
  }, [userTasks, ganttGroupsLoaded])

  // Save ganttGroups to localStorage whenever they change (except during initial load)
  useEffect(() => {
    if (ganttGroupsLoaded && ganttGroups.length > 0) {
      try {
        localStorage.setItem('recruitment-gantt-groups', JSON.stringify(ganttGroups))
      } catch (error) {
        console.error('Error saving gantt groups to localStorage:', error)
      }
    }
  }, [ganttGroups, ganttGroupsLoaded])

  // Load taskViewMode from localStorage after hydration
  // If user has a saved preference, use it; otherwise default to 'gantt'
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('task-view-mode')
        if (saved && ['list', 'calendar', 'kanban', 'gantt'].includes(saved)) {
          // User has a saved preference, use it
          setTaskViewMode(saved as 'list' | 'calendar' | 'kanban' | 'gantt')
        } else {
          // First time user - default to 'gantt' and save it
          setTaskViewMode('gantt')
          localStorage.setItem('task-view-mode', 'gantt')
        }
      } catch (error) {
        console.error('Error loading task view mode from localStorage:', error)
        // On error, default to 'gantt'
        setTaskViewMode('gantt')
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

  // Save widgets to localStorage whenever they change (but not during initial load)
  useEffect(() => {
    if (widgetsLoaded && widgets.length > 0) {
      localStorage.setItem('recruitment-widgets', JSON.stringify(widgets))
    }
  }, [widgets, widgetsLoaded])

  const toggleWidget = useCallback((widgetId: string) => {
    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
      // Save to localStorage immediately
      localStorage.setItem('recruitment-widgets', JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }, [])

  useEffect(() => {
    if (isInitialMount) {
      const timer = setTimeout(() => setIsInitialMount(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isInitialMount])

  const handleLayoutChange = useCallback((currentLayout: Layout[], allLayouts: Layouts) => {
    if (isInitialMount) {
      return
    }
    setLayouts(allLayouts)
    localStorage.setItem('recruitment-dashboard-layouts', JSON.stringify(allLayouts))
  }, [isInitialMount])

  // Batch fetch all recruitment data at once
  const fetchAllRecruitmentData = useCallback(async () => {
    try {
      setLoading(true)
      const [dashboardResponse, pipelineResponse, timeToHireResponse, sourcesResponse] = await batchFetch([
        '/api/recruitment/dashboard',
        '/api/recruitment/pipeline',
        '/api/recruitment/analytics/time-to-hire',
        '/api/recruitment/analytics/sources'
      ])

      // Process dashboard data
      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        setStats({
          totalCandidates: data.stats.totalCandidates || 0,
          activeJobs: data.stats.activeJobs || 0,
          scheduledInterviews: data.stats.scheduledInterviews || 0,
          hireRate: data.stats.hireRate || 0,
          avgTimeToHire: data.stats.avgTimeToHire || 0,
          openPositions: data.stats.openPositions || 0,
          offersExtended: data.stats.offersExtended || 0,
          onboardingCount: data.stats.onboardingCount || 0,
        })
        setCandidatesData(data.candidatesData || [])
        setJobsData(data.jobsData || [])
        setSourcesData(data.sourcesData || [])
        setStagesData(data.stagesData || [])
      }

      // Process pipeline data
      if (pipelineResponse.ok) {
        const data = await pipelineResponse.json()
        setPipelineData(data)
      }

      // Process time-to-hire data
      if (timeToHireResponse.ok) {
        const data = await timeToHireResponse.json()
        setTimeToHireData(data)
      }

      // Process source performance data
      if (sourcesResponse.ok) {
        const data = await sourcesResponse.json()
        setSourcePerformanceData(data)
      }
    } catch (error) {
      console.error('Error fetching recruitment data:', error)
      setStats({
        totalCandidates: 0,
        activeJobs: 0,
        scheduledInterviews: 0,
        hireRate: 0,
        avgTimeToHire: 0,
        openPositions: 0,
        offersExtended: 0,
        onboardingCount: 0,
      })
      setCandidatesData([])
      setJobsData([])
      setSourcesData([])
      setStagesData([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Legacy individual fetch functions (kept for compatibility)
  const fetchDashboardData = useCallback(async () => {
    await fetchAllRecruitmentData()
  }, [fetchAllRecruitmentData])

  const fetchPipelineData = useCallback(async () => {
    try {
      const response = await deduplicatedFetch('/api/recruitment/pipeline')
      if (response.ok) {
        const data = await response.json()
        setPipelineData(data)
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error)
    }
  }, [])

  const fetchTimeToHireData = useCallback(async () => {
    try {
      const response = await deduplicatedFetch('/api/recruitment/analytics/time-to-hire')
      if (response.ok) {
        const data = await response.json()
        setTimeToHireData(data)
      }
    } catch (error) {
      console.error('Error fetching time-to-hire data:', error)
    }
  }, [])

  const fetchSourcePerformanceData = useCallback(async () => {
    try {
      const response = await deduplicatedFetch('/api/recruitment/analytics/sources')
      if (response.ok) {
        const data = await response.json()
        setSourcePerformanceData(data)
      }
    } catch (error) {
      console.error('Error fetching source performance data:', error)
    }
  }, [])

  // Fetch user's tasks
  const fetchUserTasks = useCallback(async () => {
    try {
      if (!user?.id) {
        console.log('No user ID, skipping task fetch')
        return
      }

      console.log('Fetching tasks for user:', user.id)
      const tasksResponse = await deduplicatedFetch(`/api/tasks?includeCreated=true`)
      let allTasks: any[] = []

      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        console.log('Fetched tasks from API:', tasksData.tasks?.length || 0, 'tasks')

        allTasks = (tasksData.tasks || []).map((task: any) => {
          return {
            ...task,
            source: 'task',
            sourceId: task.id,
          }
        })
        console.log('Mapped tasks:', allTasks.length, 'total tasks')
      } else {
        const errorData = await tasksResponse.json().catch(() => ({}))
        console.error('Error fetching tasks:', tasksResponse.status, errorData)
      }

      console.log('Final allTasks count:', allTasks.length)
      setUserTasks(allTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }, [user?.id])

  // Format duration helper - memoized
  const formatDuration = useCallback((seconds: number) => {
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
  }, [])

  // Check for active timer on mount
  const checkActiveTimer = useCallback(async () => {
    try {
      const response = await deduplicatedFetch('/api/time-tracking/active')
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

  // Start timer
  const startTimer = useCallback(async (notes: string) => {
    if (!pendingTimerTask) return

    try {
      const response = await deduplicatedFetch('/api/time-tracking', {
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
  }, [pendingTimerTask])

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

  // Get filtered tasks
  const getFilteredTasks = () => {
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

  // Get status dot color for Gantt chart
  const getStatusDotColor = (status: string): string => {
    const statusUpper = status?.toUpperCase() || ''
    const colors: Record<string, string> = {
      'TODO': 'bg-slate-400',
      'BACKLOG': 'bg-slate-400',
      'IN_PROGRESS': 'bg-blue-500',
      'IN_REVIEW': 'bg-purple-500',
      'BLOCKED': 'bg-red-500',
      'DONE': 'bg-green-500',
      'COMPLETED': 'bg-green-500',
      'CANCELLED': 'bg-gray-400',
      'ON_HOLD': 'bg-yellow-500',
    }
    return colors[statusUpper] || 'bg-gray-400'
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
    const statusUpper = status?.toUpperCase() || ''
    if (statusUpper === 'DONE' || statusUpper === 'COMPLETED') return 'bg-green-500'
    if (statusUpper === 'IN_PROGRESS') return 'bg-blue-500'
    if (statusUpper === 'IN_REVIEW') return 'bg-purple-500'
    if (statusUpper === 'BLOCKED') return 'bg-red-500'
    if (statusUpper === 'TODO' || statusUpper === 'BACKLOG') return 'bg-slate-400'
    if (statusUpper === 'CANCELLED' || statusUpper === 'ON_HOLD') return 'bg-gray-400'
    return 'bg-gray-400'
  }

  // Set task color
  const setTaskColor = (taskId: string, color: string) => {
    const newColors = { ...taskColors, [taskId]: color }
    setTaskColors(newColors)
    try {
      localStorage.setItem('recruitment-task-colors', JSON.stringify(newColors))
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
      localStorage.setItem('recruitment-task-colors', JSON.stringify(newColors))
    } catch (error) {
      console.error('Error saving task colors to localStorage:', error)
    }
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

  // Gantt Group Management Functions
  const addGanttGroup = () => {
    if (!newGanttGroupName.trim()) return

    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGanttGroupName.trim(),
      expanded: true,
      tasks: []
    }

    setGanttGroups(prev => [...prev, newGroup])
    setNewGanttGroupName('')
    setIsAddingGanttGroup(false)
  }

  const toggleGroupExpanded = (groupId: string) => {
    setGanttGroups(prev =>
      prev.map(group =>
        group.id === groupId ? { ...group, expanded: !group.expanded } : group
      )
    )
  }

  const addTaskToGanttGroup = (groupId: string) => {
    setAddingTaskToGroup(groupId)
    setTaskDialogOpen(true)
  }

  const deleteGanttGroup = (groupId: string) => {
    if (confirm('Are you sure you want to delete this group? Tasks in this group will remain but will be ungrouped.')) {
      setGanttGroups(prev => {
        const updatedGroups = prev.filter(group => group.id !== groupId)

        // Update task-to-group mapping - move tasks from deleted group to first remaining group or create default
        if (prev.length > 0) {
          const deletedGroup = prev.find(g => g.id === groupId)
          if (deletedGroup && deletedGroup.tasks.length > 0) {
            let taskToGroupMap: Record<string, string> = {}
            try {
              const saved = localStorage.getItem('recruitment-task-group-map')
              if (saved) {
                taskToGroupMap = JSON.parse(saved)
              }
            } catch (error) {
              console.error('Error loading task-group mapping:', error)
            }

            // Move tasks to first remaining group or "all-tasks" if none exist
            const targetGroupId = updatedGroups.length > 0 ? updatedGroups[0].id : 'all-tasks'

            // If no groups remain, create default group
            if (updatedGroups.length === 0) {
              updatedGroups.push({
                id: 'all-tasks',
                name: 'All Tasks',
                expanded: true,
                tasks: deletedGroup.tasks
              })
            } else {
              updatedGroups[0].tasks.push(...deletedGroup.tasks)
            }

            // Update mapping
            deletedGroup.tasks.forEach((task: any) => {
              taskToGroupMap[task.id] = targetGroupId
            })

            try {
              localStorage.setItem('recruitment-task-group-map', JSON.stringify(taskToGroupMap))
            } catch (error) {
              console.error('Error saving task-group mapping:', error)
            }
          }
        }

        return updatedGroups
      })
    }
  }

  const deleteGanttTask = async (groupId: string, taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          // Remove task from group
          setGanttGroups(prev =>
            prev.map(group =>
              group.id === groupId
                ? { ...group, tasks: group.tasks.filter((t: any) => t.id !== taskId) }
                : group
            )
          )
          // Refresh tasks
          await fetchUserTasks()
        }
      } catch (error) {
        console.error('Error deleting task:', error)
      }
    }
  }

  const toggleFullscreen = (widgetId: string) => {
    setFullscreenWidget(fullscreenWidget === widgetId ? null : widgetId)
  }

  const showTimerNotesDialog = (taskId: string, taskTitle: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPendingTimerTask({ id: taskId, title: taskTitle })
    setTimerNotesDialogOpen(true)
  }

  // Gantt task reordering handlers
  const handleGanttTaskDragStart = (e: React.DragEvent, taskId: string, groupId: string) => {
    setDraggedTaskId(taskId)
    setDraggedGroupId(groupId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleGanttTaskDragEnd = (e: React.DragEvent) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
    setDraggedTaskId(null)
    setDraggedGroupId(null)
    setDragOverTaskId(null)
  }

  const handleGanttTaskDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedTaskId && draggedTaskId !== taskId) {
      setDragOverTaskId(taskId)
    }
  }

  const handleGanttTaskDragLeave = () => {
    setDragOverTaskId(null)
  }

  const handleGanttTaskDrop = (e: React.DragEvent, targetTaskId: string, targetGroupId: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!draggedTaskId || !draggedGroupId || draggedTaskId === targetTaskId || draggedGroupId !== targetGroupId) {
      setDraggedTaskId(null)
      setDraggedGroupId(null)
      setDragOverTaskId(null)
      return
    }

    // Reorder tasks within the same group
    setGanttGroups(prevGroups => {
      return prevGroups.map(group => {
        if (group.id !== targetGroupId) return group

        // Get all parent tasks (excluding subtasks)
        const parentTasks = group.tasks.filter((t: any) => !t.parentTaskId && !t.parentId)
        const draggedIndex = parentTasks.findIndex((t: any) => t.id === draggedTaskId)
        const targetIndex = parentTasks.findIndex((t: any) => t.id === targetTaskId)

        if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
          return group
        }

        // Create new array with reordered tasks
        const newParentTasks = [...parentTasks]
        const [draggedTask] = newParentTasks.splice(draggedIndex, 1)
        newParentTasks.splice(targetIndex, 0, draggedTask)

        // Get all subtasks (they stay with their parents)
        const subtasks = group.tasks.filter((t: any) => t.parentTaskId || t.parentId)

        // Reconstruct tasks array with new order
        const reorderedTasks: any[] = []
        newParentTasks.forEach(parentTask => {
          reorderedTasks.push(parentTask)
          // Add subtasks for this parent
          const parentSubtasks = subtasks.filter((st: any) =>
            (st.parentTaskId === parentTask.id || st.parentId === parentTask.id) && st.id !== parentTask.id
          )
          reorderedTasks.push(...parentSubtasks)
        })

        return {
          ...group,
          tasks: reorderedTasks
        }
      })
    })

    setDraggedTaskId(null)
    setDraggedGroupId(null)
    setDragOverTaskId(null)
  }

  // Render myTasks widget - Full implementation from sales-dashboard
  // renderMyTasksWidget removed - now using centralized MyTasksWidget component

  const renderWidget = (id: string) => {
    switch (id) {
      case 'metric-totalCandidates':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>
        )

      case 'metric-activeJobs':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Open positions</p>
            </CardContent>
          </Card>
        )

      case 'metric-scheduledInterviews':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledInterviews}</div>
              <p className="text-xs text-muted-foreground">Scheduled this week</p>
            </CardContent>
          </Card>
        )

      case 'metric-hireRate':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hireRate}%</div>
              <p className="text-xs text-muted-foreground">Conversion rate</p>
            </CardContent>
          </Card>
        )

      case 'metric-avgTimeToHire':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTimeToHire}</div>
              <p className="text-xs text-muted-foreground">Days</p>
            </CardContent>
          </Card>
        )

      case 'metric-openPositions':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openPositions}</div>
              <p className="text-xs text-muted-foreground">Unfilled roles</p>
            </CardContent>
          </Card>
        )

      case 'metric-offersExtended':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Extended</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offersExtended}</div>
              <p className="text-xs text-muted-foreground">Pending acceptance</p>
            </CardContent>
          </Card>
        )

      case 'metric-onboardingCount':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onboardingCount}</div>
              <p className="text-xs text-muted-foreground">New hires</p>
            </CardContent>
          </Card>
        )

      case 'chart-candidates':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Candidates & Hires Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingFallback />}>
                <RechartsWrapper>
                  {(Recharts) => {
                    const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } = Recharts
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={candidatesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="candidates" stroke="#8884d8" name="Candidates" />
                          <Line type="monotone" dataKey="hires" stroke="#82ca9d" name="Hires" />
                        </LineChart>
                      </ResponsiveContainer>
                    )
                  }}
                </RechartsWrapper>
              </Suspense>
            </CardContent>
          </Card>
        )

      case 'chart-jobs':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingFallback />}>
                <RechartsWrapper>
                  {(Recharts) => {
                    const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts
                    return (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={jobsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  }}
                </RechartsWrapper>
              </Suspense>
            </CardContent>
          </Card>
        )

      case 'chart-sources':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Candidates by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingFallback />}>
                <RechartsWrapper>
                  {(Recharts) => {
                    const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = Recharts
                    return (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={sourcesData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {sourcesData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )
                  }}
                </RechartsWrapper>
              </Suspense>
            </CardContent>
          </Card>
        )

      case 'chart-stages':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<LoadingFallback />}>
                <RechartsWrapper>
                  {(Recharts) => {
                    const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts
                    return (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={stagesData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={80} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    )
                  }}
                </RechartsWrapper>
              </Suspense>
            </CardContent>
          </Card>
        )

      case 'pipeline':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Candidate Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              {pipelineData && pipelineData.pipeline ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2 overflow-x-auto">
                    {pipelineData.pipeline.map((stage: any) => (
                      <div key={stage.id} className="min-w-[180px]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold">{stage.label}</h4>
                          <Badge style={{ backgroundColor: stage.color }} className="text-white">
                            {stage.count}
                          </Badge>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {stage.candidates.map((candidate: any) => (
                            <div
                              key={candidate.id}
                              className="p-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-muted/80 transition-colors"
                            >
                              <div className="font-medium truncate">{candidate.name}</div>
                              <div className="text-xs text-muted-foreground truncate">{candidate.position}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {pipelineData.metrics && (
                    <div className="pt-2 border-t">
                      <div className="text-xs text-muted-foreground">
                        Total in Pipeline: {pipelineData.metrics.totalInPipeline}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading pipeline data...</div>
              )}
            </CardContent>
          </Card>
        )

      case 'timeToHire':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Time-to-Hire Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {timeToHireData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{timeToHireData.overall?.averageDays || 0}</div>
                      <div className="text-xs text-muted-foreground">Average Days</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{timeToHireData.overall?.totalHires || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Hires</div>
                    </div>
                  </div>
                  {timeToHireData.trend && timeToHireData.trend.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Monthly Trend</h4>
                      <Suspense fallback={<LoadingFallback />}>
                        <RechartsWrapper>
                          {(Recharts) => {
                            const { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts
                            return (
                              <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={timeToHireData.trend}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="month" />
                                  <YAxis />
                                  <Tooltip />
                                  <Line type="monotone" dataKey="averageDays" stroke="#8884d8" name="Avg Days" />
                                </LineChart>
                              </ResponsiveContainer>
                            )
                          }}
                        </RechartsWrapper>
                      </Suspense>
                    </div>
                  )}
                  {timeToHireData.byDepartment && timeToHireData.byDepartment.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">By Department</h4>
                      <div className="space-y-1">
                        {timeToHireData.byDepartment.slice(0, 3).map((dept: any) => (
                          <div key={dept.department} className="flex justify-between text-sm">
                            <span>{dept.department}</span>
                            <span className="font-medium">{dept.averageDays} days</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading time-to-hire data...</div>
              )}
            </CardContent>
          </Card>
        )

      case 'sourcePerformance':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Source Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {sourcePerformanceData ? (
                <div className="space-y-4">
                  {sourcePerformanceData.summary && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Conversion Rate</div>
                        <div className="text-lg font-bold">{sourcePerformanceData.summary.overallConversionRate}%</div>
                      </div>
                      <div className="p-2 bg-muted rounded">
                        <div className="text-xs text-muted-foreground">Avg Cost/Hire</div>
                        <div className="text-lg font-bold">${typeof sourcePerformanceData.summary.avgCostPerHire === 'number' ? sourcePerformanceData.summary.avgCostPerHire.toLocaleString('en-US') : '0'}</div>
                      </div>
                    </div>
                  )}
                  {sourcePerformanceData.sources && sourcePerformanceData.sources.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">By Source</h4>
                      <Suspense fallback={<LoadingFallback />}>
                        <RechartsWrapper>
                          {(Recharts) => {
                            const { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } = Recharts
                            return (
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={sourcePerformanceData.sources}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="label" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="conversionRate" fill="#8884d8" name="Conversion %" />
                                </BarChart>
                              </ResponsiveContainer>
                            )
                          }}
                        </RechartsWrapper>
                      </Suspense>
                    </div>
                  )}
                  {sourcePerformanceData.sources && (
                    <div className="space-y-1 text-xs">
                      {sourcePerformanceData.sources.slice(0, 3).map((source: any) => (
                        <div key={source.id} className="flex justify-between">
                          <span>{source.label}</span>
                          <span className="font-medium">{source.conversionRate}% ({source.hires} hires)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">Loading source performance data...</div>
              )}
            </CardContent>
          </Card>
        )

      case 'myTasks':
        return (
          <MyTasksWidget
            tasks={userTasks.filter(task => task.assigneeId === user?.id)}
            widgetId="myTasks"
            fullscreen={fullscreenWidget === 'myTasks'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="recruitment"
            basePath="/recruitment-dashboard"
          />
        )

      case 'metrics':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Key Recruitment Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Total Candidates</div>
                  <div className="text-sm font-semibold mt-1">{stats.totalCandidates}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Active Jobs</div>
                  <div className="text-sm font-semibold mt-1">{stats.activeJobs}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Scheduled Interviews</div>
                  <div className="text-sm font-semibold mt-1">{stats.scheduledInterviews}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Hire Rate</div>
                  <div className="text-sm font-semibold mt-1">{stats.hireRate}%</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Avg Time to Hire</div>
                  <div className="text-sm font-semibold mt-1">{stats.avgTimeToHire} days</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Open Positions</div>
                  <div className="text-sm font-semibold mt-1">{stats.openPositions}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Offers Extended</div>
                  <div className="text-sm font-semibold mt-1">{stats.offersExtended}</div>
                </div>
                <div className="rounded-xl border border-border bg-background p-3">
                  <div className="text-muted-foreground">Onboarding</div>
                  <div className="text-sm font-semibold mt-1">{stats.onboardingCount}</div>
                </div>
              </div>
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
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <UserCheck className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">New Candidate</div>
                    <div className="text-xs text-muted-foreground">Add candidate</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Briefcase className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">New Job</div>
                    <div className="text-xs text-muted-foreground">Post job</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Calendar className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Schedule Interview</div>
                    <div className="text-xs text-muted-foreground">Book interview</div>
                  </div>
                </Button>
                <Button variant="outline" className="w-full justify-start h-auto py-3">
                  <Award className="mr-2 h-4 w-4" />
                  <div className="text-left">
                    <div className="font-medium">Extend Offer</div>
                    <div className="text-xs text-muted-foreground">Create offer</div>
                  </div>
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
                        localStorage.setItem('recruitment-useful-links', JSON.stringify(updated))
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
                            localStorage.setItem('recruitment-useful-links', JSON.stringify(updated))
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
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdvancedMindMapWidget />
          </Suspense>
        )

      case 'canvas':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AdvancedCanvasWidget />
          </Suspense>
        )

      default:
        return null
    }
  }

  // Filter widgetIds to only include visible widgets
  const widgetIds = useMemo(() => {
    return widgets.filter(w => w.visible).map(w => w.id)
  }, [widgets])

  // Use state for greeting to avoid hydration mismatch
  const [greeting, setGreeting] = useState('Good morning')

  // Memoize breakpoints and cols configuration
  const gridBreakpoints = useMemo(() => ({ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }), [])
  const gridCols = useMemo(() => ({ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }), [])

  useEffect(() => {
    const currentHour = new Date().getHours()
    const greetingText = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'
    setGreeting(greetingText)
  }, [])

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
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Recruitment Dashboard</h3>
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
                if (!router) {
                  console.error('[RecruitmentDashboard] Router not available')
                  return
                }
                router.push('/recruitment-dashboard/candidates')
              }}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              View Candidates
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RecruitmentPageLayout
      widgets={widgets}
      toggleWidget={toggleWidget}
      widgetGalleryOpen={widgetGalleryOpen}
      setWidgetGalleryOpen={setWidgetGalleryOpen}
    >
      {!hasVisibleWidgets ? (
        <EmptyState />
      ) : (
        <GridLayoutWrapper
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={40}
          isDraggable={!isMobile}
          isResizable={!isMobile}
        >
          {widgets
            .filter(w => w.visible)
            .map(widget => (
              <div
                key={widget.id}
                data-grid={defaultLayouts.lg?.find(l => l.i === widget.id)}
              >
                {renderWidget(widget.id)}
              </div>
            ))}
        </GridLayoutWrapper>
      )}
    </RecruitmentPageLayout>
  )
}

export default function RecruitmentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    }>
      <RecruitmentDashboardPageInner />
    </Suspense>
  )
}

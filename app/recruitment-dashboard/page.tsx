'use client'

import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, memo } from 'react'
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
    { i: 'mindMap', x: 0, y: 22, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 6, y: 22, w: 6, h: 8, minW: 3, minH: 8 },
  ],
  md: [
    { i: 'metrics', x: 0, y: 0, w: 10, h: 6, minW: 5, minH: 4 },
    { i: 'quickActions', x: 0, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 5, y: 6, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 12, w: 10, h: 10, minW: 5, minH: 8 },
    { i: 'mindMap', x: 0, y: 22, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 5, y: 22, w: 5, h: 8, minW: 3, minH: 8 },
  ],
  sm: [
    { i: 'metrics', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'quickActions', x: 0, y: 6, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 18, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'mindMap', x: 0, y: 28, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 0, y: 36, w: 6, h: 8, minW: 3, minH: 8 },
  ],
}

export default function RecruitmentDashboardPage() {
  const user = useAuthStore((state) => state.user)
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
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [widgetsLoaded, setWidgetsLoaded] = useState(false)
  const [widgets, setWidgets] = useState<Widget[]>([])

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
        setLayouts(JSON.parse(savedLayouts))
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
                              Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
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

                if (!calendarDate || !isMounted) {
                  return <div className="p-4 text-center text-muted-foreground">Loading calendar...</div>
                }

                const currentMonth = calendarDate.getMonth()
                const currentYear = calendarDate.getFullYear()
                const firstDay = new Date(currentYear, currentMonth, 1)
                const lastDay = new Date(currentYear, currentMonth + 1, 0)
                const daysInMonth = lastDay.getDate()
                const startingDayOfWeek = firstDay.getDay()

                const calendarDays: (number | null)[] = []
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
                  // Scroll to today's date after state update
                  setTimeout(() => {
                    if (calendarScrollContainerRef.current) {
                      const today = new Date()
                      const todayDay = today.getDate()
                      const todayMonth = today.getMonth()
                      const todayYear = today.getFullYear()

                      // Only scroll if we're viewing the current month
                      if (currentMonth === todayMonth && currentYear === todayYear) {
                        // Find today's cell in the grid
                        const todayIndex = calendarDays.findIndex((day, idx) => {
                          // Skip empty cells at the start
                          if (day === null) return false
                          return day === todayDay
                        })

                        if (todayIndex >= 0) {
                          // Calculate row (7 columns per row)
                          const row = Math.floor(todayIndex / 7)
                          // Get the cell element
                          const cells = calendarScrollContainerRef.current.children
                          if (cells[todayIndex]) {
                            const cell = cells[todayIndex] as HTMLElement
                            // Scroll the cell into view
                            cell.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
                          }
                        }
                      }
                    }
                  }, 100)
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

                    <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto" ref={calendarScrollContainerRef}>
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
                                      {format(new Date(task.dueDate), 'MMM d, yyyy')}
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

              <div className="flex-1 overflow-auto" ref={ganttScrollContainerRef}>
                <div className="flex min-w-[1200px]">
                  <div className="w-[450px] border-r bg-background sticky left-0 z-20">
                    <div className="border-b bg-muted/50 p-2 grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 text-xs font-semibold">
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
                                                  draggable
                                                  onDragStart={(e) => handleGanttTaskDragStart(e, task.id, group.id)}
                                                  onDragEnd={handleGanttTaskDragEnd}
                                                  onDragOver={(e) => handleGanttTaskDragOver(e, task.id)}
                                                  onDragLeave={handleGanttTaskDragLeave}
                                                  onDrop={(e) => handleGanttTaskDrop(e, task.id, group.id)}
                                                  onClick={(e) => {
                                                    // Don't open dialog if clicking buttons or drag handle
                                                    const target = e.target as HTMLElement
                                                    if (target.closest('button') ||
                                                      target.closest('.cursor-grab')) {
                                                      return
                                                    }
                                                    // Only open if we're not currently dragging this task
                                                    if (draggedTaskId === task.id) {
                                                      return
                                                    }
                                                    setSelectedTaskId(task.id)
                                                    setTaskDetailDialogOpen(true)
                                                  }}
                                                  className={cn(
                                                    "grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 p-2 hover:bg-accent/50 text-xs border-b transition-all group/task",
                                                    draggedTaskId === task.id ? "opacity-50 cursor-move" : "cursor-pointer",
                                                    dragOverTaskId === task.id && draggedTaskId !== task.id && "border-t-2 border-primary bg-primary/10"
                                                  )}
                                                >
                                                  <div className="flex items-center gap-1 min-w-0">
                                                    <GripVertical
                                                      className="h-3 w-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity cursor-grab"
                                                      onMouseDown={(e) => e.stopPropagation()}
                                                    />
                                                    {hasSubtasks && (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-4 w-4 p-0 shrink-0"
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
                                                    <span
                                                      className="font-medium truncate cursor-pointer hover:text-primary transition-colors"
                                                      onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedTaskId(task.id)
                                                        setTaskDetailDialogOpen(true)
                                                      }}
                                                    >
                                                      {task.title || 'Untitled Task'}
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center min-w-0">
                                                    {task.assignee ? (
                                                      <span className="truncate">{task.assignee.firstName || task.assignee.name || 'Unassigned'}</span>
                                                    ) : (
                                                      <span className="text-muted-foreground">Unassigned</span>
                                                    )}
                                                  </div>
                                                  <div className="flex items-center justify-between gap-1 min-w-0">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(taskStatus)}`} />
                                                      <span className="truncate">{formatStatusText(taskStatus)}</span>
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
                                                            className="grid grid-cols-[2fr_1.5fr_1.5fr] gap-2 p-2 hover:bg-accent/50 text-xs border-b bg-muted/30 cursor-pointer transition-colors"
                                                          >
                                                            <div className="flex items-center font-medium text-[11px] min-w-0">
                                                              <span className="truncate">{subtask.title || 'Untitled Subtask'}</span>
                                                            </div>
                                                            <div className="flex items-center text-[11px] min-w-0">
                                                              {subtask.assignee ? (
                                                                <span className="truncate">{subtask.assignee.firstName || subtask.assignee.name || 'Unassigned'}</span>
                                                              ) : (
                                                                <span className="text-muted-foreground">Unassigned</span>
                                                              )}
                                                            </div>
                                                            <div className="flex items-center justify-between gap-1 text-[11px] min-w-0">
                                                              <div className="flex items-center gap-2 min-w-0">
                                                                <div className={`h-2 w-2 rounded-full shrink-0 ${getStatusDotColor(subtaskStatus)}`} />
                                                                <span className="truncate">{formatStatusText(subtaskStatus)}</span>
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

                                    const statusColorResult = getStatusColor(taskStatus, task)
                                    const customColor = typeof statusColorResult === 'object' ? statusColorResult.backgroundColor : null
                                    const bgClass = typeof statusColorResult === 'string' ? statusColorResult : ''

                                    return (
                                      <div
                                        key={task.id}
                                        className="relative h-10 border-b"
                                        style={{ minWidth: `${maxPosition}px` }}
                                      >
                                        {position.left >= 0 && position.left < maxPosition && (
                                          <div
                                            className={cn(
                                              "absolute top-1 h-6 rounded flex items-center gap-1 px-2 pr-1 text-[10px] text-white font-medium cursor-pointer hover:opacity-90 transition-opacity group/bar z-10",
                                              !customColor && bgClass
                                            )}
                                            style={{
                                              left: `${position.left}px`,
                                              width: `${position.width}px`,
                                              minWidth: '60px',
                                              ...(customColor ? { backgroundColor: customColor } : {})
                                            }}
                                            onClick={(e) => {
                                              setSelectedTaskId(task.id)
                                              setTaskDetailDialogOpen(true)
                                            }}
                                            title={task.title}
                                          >
                                            <span className="truncate flex-1 min-w-0">{task.title}</span>
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
        return renderMyTasksWidget()

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
              onClick={() => router.push('/recruitment-dashboard')}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/recruitment-dashboard/candidates')}
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
    <RecruitmentPageLayout widgets={widgets} toggleWidget={toggleWidget}>
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
                Welcome to Your Recruitment Dashboard
              </p>
            </div>
          </div>

          {!isMounted ? (
        /* Render desktop layout during SSR to avoid hydration mismatch */
        <div className="recruitment-dashboard-grid" suppressHydrationWarning>
          <Suspense fallback={<LoadingFallback />}>
            <GridLayoutWrapper
              className="layout"
              layouts={layouts}
              onLayoutChange={handleLayoutChange}
              breakpoints={gridBreakpoints}
              cols={gridCols}
              rowHeight={80}
              draggableHandle=".drag-handle"
              isDraggable={false}
              isResizable={false}
            >
              {widgetIds.map((widgetId) => (
                <div key={widgetId} className="relative group">
                  <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5 text-white" />
                  </div>
                  {renderWidget(widgetId)}
                </div>
              ))}
            </GridLayoutWrapper>
          </Suspense>
        </div>
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
        <div className="recruitment-dashboard-grid">
          <Suspense fallback={<LoadingFallback />}>
            <GridLayoutWrapper
              className="layout"
              layouts={layouts}
              breakpoints={gridBreakpoints}
              cols={gridCols}
              rowHeight={80}
              onLayoutChange={handleLayoutChange}
              draggableHandle=".drag-handle"
              isDraggable={true}
              isResizable={true}
            >
              {widgetIds.map((widgetId) => (
                <div key={widgetId} className="relative group">
                  {/* Drag Handle - appears on hover */}
                  <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                    <GripVertical className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="h-full overflow-auto">
                    {renderWidget(widgetId)}
                  </div>
                </div>
              ))}
            </GridLayoutWrapper>
          </Suspense>
        </div>
        )}
        </>
      )}

      {/* Fullscreen Widget */}
      {fullscreenWidget === 'myTasks' && renderMyTasksWidget()}

      {/* Task Dialog */}
      <Suspense fallback={null}>
        <TaskDialog
          open={taskDialogOpen}
          onClose={() => {
            setTaskDialogOpen(false)
            setSelectedTaskId(null)
            setAddingTaskToGroup(null)
          }}
          onSubmit={async (data: any) => {
            // If adding to a group, include groupId in the task data
            if (addingTaskToGroup) {
              data.groupId = addingTaskToGroup
            }
            await fetchUserTasks()
          }}
        />
      </Suspense>

      {/* Task Detail Dialog */}
      <Suspense fallback={null}>
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
      </Suspense>

      {/* Time Tracking Dialog */}
      <Suspense fallback={null}>
        <TimeTrackingDialog
          open={timeTrackingDialogOpen}
          onClose={() => {
            setTimeTrackingDialogOpen(false)
            setTimeTrackingTaskId(undefined)
          }}
          taskId={timeTrackingTaskId}
        />
      </Suspense>

      {/* Timer Notes Dialog */}
      <Suspense fallback={null}>
        <TimerNotesDialog
          open={timerNotesDialogOpen}
          onClose={() => {
            setTimerNotesDialogOpen(false)
            setPendingTimerTask(null)
          }}
          onSubmit={startTimer}
          taskTitle={pendingTimerTask?.title}
        />
      </Suspense>
    </RecruitmentPageLayout>
  )
}

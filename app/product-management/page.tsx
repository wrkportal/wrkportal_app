'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, BarChart3, Map as MapIcon, TrendingUp, AlertTriangle, Users, ClipboardList, Network, Palette, Link as LinkIcon, Briefcase, CheckCircle2, Target, Plus, MessageSquare, FileText, X, UserCheck, Calendar, Clock, GripVertical, List, Filter, ChevronLeft, ChevronRight, Activity, LayoutGrid, Maximize, Minimize, Play, Pause, History, Trash2, ChevronDown } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { getInitials, cn } from '@/lib/utils'
import { format, addDays, isToday } from 'date-fns'
import { AdvancedFormsWidget } from '@/components/widgets/AdvancedFormsWidget'
import { AdvancedMindMapWidget } from '@/components/widgets/AdvancedMindMapWidget'
import { AdvancedCanvasWidget } from '@/components/widgets/AdvancedCanvasWidget'
import { GanttChartWidget } from '@/components/widgets/GanttChartWidget'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { TaskDialog } from '@/components/dialogs/task-dialog'
import { TaskDetailDialog } from '@/components/dialogs/task-detail-dialog'
import { TimeTrackingDialog } from '@/components/dialogs/time-tracking-dialog'
import { TimerNotesDialog } from '@/components/dialogs/timer-notes-dialog'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'stats', type: 'stats', visible: true },
  { id: 'roadmap', type: 'roadmap', visible: true },
  { id: 'metrics', type: 'metrics', visible: true },
  { id: 'blockers', type: 'blockers', visible: true },
  { id: 'teamCapacity', type: 'teamCapacity', visible: true },
  { id: 'releaseTimeline', type: 'releaseTimeline', visible: false },
  { id: 'teamPerformance', type: 'teamPerformance', visible: false },
  { id: 'multiProjectRoadmap', type: 'multiProjectRoadmap', visible: false },
  { id: 'strategicPlanning', type: 'strategicPlanning', visible: false },
  { id: 'riskPrediction', type: 'riskPrediction', visible: false },
  { id: 'capacityForecast', type: 'capacityForecast', visible: false },
  { id: 'releaseSuccessPrediction', type: 'releaseSuccessPrediction', visible: false },
  { id: 'whatIfScenarios', type: 'whatIfScenarios', visible: false },
  { id: 'stakeholderUpdates', type: 'stakeholderUpdates', visible: false },
  { id: 'collaborationActivity', type: 'collaborationActivity', visible: false },
  { id: 'feedbackIntegration', type: 'feedbackIntegration', visible: false },
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

const defaultLayouts: Layouts = {
  lg: [
    // Top row - Key widgets
    { i: 'stats', x: 0, y: 0, w: 12, h: 4, minW: 6, minH: 3 },
    { i: 'roadmap', x: 0, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'metrics', x: 6, y: 4, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'blockers', x: 0, y: 10, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'teamCapacity', x: 6, y: 10, w: 6, h: 6, minW: 4, minH: 4 },
    // Additional widgets (initially hidden, but have positions)
    { i: 'releaseTimeline', x: 0, y: 16, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'teamPerformance', x: 0, y: 22, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'multiProjectRoadmap', x: 6, y: 22, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'strategicPlanning', x: 0, y: 30, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'riskPrediction', x: 0, y: 36, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'capacityForecast', x: 6, y: 36, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'releaseSuccessPrediction', x: 0, y: 42, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'whatIfScenarios', x: 0, y: 48, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'stakeholderUpdates', x: 0, y: 54, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'collaborationActivity', x: 6, y: 54, w: 6, h: 6, minW: 4, minH: 4 },
    { i: 'feedbackIntegration', x: 0, y: 60, w: 12, h: 6, minW: 6, minH: 4 },
    { i: 'recentProjects', x: 0, y: 66, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'myTasks', x: 6, y: 66, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'assignedToOthers', x: 0, y: 74, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'activeOKRs', x: 6, y: 74, w: 6, h: 8, minW: 4, minH: 6 },
    { i: 'quickActions', x: 0, y: 82, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 6, y: 82, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'forms', x: 0, y: 88, w: 12, h: 8, minW: 6, minH: 6 },
    { i: 'mindMap', x: 0, y: 96, w: 12, h: 10, minW: 6, minH: 8 },
    { i: 'canvas', x: 0, y: 106, w: 12, h: 10, minW: 6, minH: 8 },
    { i: 'ganttChart', x: 0, y: 116, w: 12, h: 10, minW: 6, minH: 8 },
  ],
  md: [
    { i: 'stats', x: 0, y: 0, w: 10, h: 4, minW: 5, minH: 3 },
    { i: 'roadmap', x: 0, y: 4, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'metrics', x: 5, y: 4, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'blockers', x: 0, y: 10, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'teamCapacity', x: 5, y: 10, w: 5, h: 6, minW: 3, minH: 4 },
  ],
  sm: [
    { i: 'stats', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'roadmap', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'metrics', x: 0, y: 10, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'blockers', x: 0, y: 16, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'teamCapacity', x: 0, y: 22, w: 6, h: 6, minW: 3, minH: 4 },
  ],
}

export default function PMDashboardLandingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [userGoals, setUserGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<any[]>([])
  const [roadmap, setRoadmap] = useState<any[]>([])
  const [blockers, setBlockers] = useState<any[]>([])
  const [teamStatus, setTeamStatus] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  const [velocityData, setVelocityData] = useState<any>(null)
  const [releaseTimeline, setReleaseTimeline] = useState<any[]>([])
  const [teamPerformance, setTeamPerformance] = useState<any>(null)
  const [multiProjectRoadmap, setMultiProjectRoadmap] = useState<any>(null)
  const [strategicPlanning, setStrategicPlanning] = useState<any>(null)
  const [whatIfScenarios, setWhatIfScenarios] = useState<any[]>([])
  const [riskPredictions, setRiskPredictions] = useState<any>(null)
  const [capacityForecast, setCapacityForecast] = useState<any>(null)
  const [releaseSuccessPredictions, setReleaseSuccessPredictions] = useState<any>(null)
  const [stakeholderUpdates, setStakeholderUpdates] = useState<any>(null)
  const [collaborationActivity, setCollaborationActivity] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)
  
  // My Tasks widget state
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [dueDateFilter, setDueDateFilter] = useState<string>('ALL')
  const [showFilters, setShowFilters] = useState(false)
  // Initialize with default value to avoid hydration mismatch
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar' | 'kanban' | 'gantt'>('calendar')
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


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      // Don't set loading to true - fetch in background for instant load
      const authenticatedUser = await fetchAuthenticatedUser()
      if (authenticatedUser) {
        setUser(authenticatedUser)
      }
      // Don't set loading to false - already false initially
    }
    loadUser()
  }, [setUser])

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
        }
      } catch (error) {
        console.error('Error loading task view mode from localStorage:', error)
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
    const fetchData = async () => {
      try {
        // Fetch dashboard data from dedicated API
        const dashboardRes = await fetch('/api/product-management/dashboard')
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json()
          setStats(dashboardData.stats || [])
          setRoadmap(dashboardData.roadmap || [])
          setBlockers(dashboardData.blockers || [])
          setTeamStatus(dashboardData.teamStatus || [])
          setMetrics(dashboardData.metrics || [])
        }

        // Fetch projects for user projects widget
        const projectsRes = await fetch('/api/projects')
        let projects: any[] = []
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          projects = projectsData.projects || projectsData || []
          setUserProjects(projects)
        }

        // Fetch tasks for user tasks widget
        const tasksRes = await fetch('/api/tasks?includeCreated=true')
        let tasks: any[] = []
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          tasks = tasksData.tasks || tasksData || []
          setUserTasks(tasks)
        }

        // Fetch OKRs/Goals
        const goalsRes = await fetch('/api/okrs')
        let goals: any[] = []
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          goals = goalsData.goals || goalsData || []
          setUserGoals(goals)
        }

        // Fetch velocity and burndown data
        const velocityRes = await fetch('/api/product-management/analytics/velocity')
        if (velocityRes.ok) {
          const velocityData = await velocityRes.json()
          setVelocityData(velocityData)
        }

        // Fetch release timeline
        const timelineRes = await fetch('/api/product-management/releases/timeline?months=6')
        if (timelineRes.ok) {
          const timelineData = await timelineRes.json()
          setReleaseTimeline(timelineData.releases || [])
        }

        // Fetch team performance
        const performanceRes = await fetch('/api/product-management/team/performance?months=3')
        if (performanceRes.ok) {
          const performanceData = await performanceRes.json()
          setTeamPerformance(performanceData)
        }

        // Fetch multi-project roadmap
        const roadmapRes = await fetch('/api/product-management/roadmap/multi-project?months=12&includeDependencies=true')
        if (roadmapRes.ok) {
          const roadmapData = await roadmapRes.json()
          setMultiProjectRoadmap(roadmapData)
        }

        // Fetch strategic planning
        const strategicRes = await fetch('/api/product-management/strategic-planning')
        if (strategicRes.ok) {
          const strategicData = await strategicRes.json()
          setStrategicPlanning(strategicData)
        }

        // Fetch risk predictions
        const riskRes = await fetch('/api/product-management/predictions/risk?includeReleases=true')
        if (riskRes.ok) {
          const riskData = await riskRes.json()
          setRiskPredictions(riskData)
        }

        // Fetch capacity forecast
        const capacityRes = await fetch('/api/product-management/predictions/capacity?months=3')
        if (capacityRes.ok) {
          const capacityData = await capacityRes.json()
          setCapacityForecast(capacityData)
        }

        // Fetch release success predictions
        const releaseSuccessRes = await fetch('/api/product-management/predictions/release-success')
        if (releaseSuccessRes.ok) {
          const releaseSuccessData = await releaseSuccessRes.json()
          setReleaseSuccessPredictions(releaseSuccessData)
        }

        // Fetch stakeholder updates
        const stakeholderRes = await fetch('/api/product-management/stakeholder-updates')
        if (stakeholderRes.ok) {
          const stakeholderData = await stakeholderRes.json()
          setStakeholderUpdates(stakeholderData)
        }

        // Fetch collaboration activity
        const collaborationRes = await fetch('/api/product-management/collaboration/activity?limit=10')
        if (collaborationRes.ok) {
          const collaborationData = await collaborationRes.json()
          setCollaborationActivity(collaborationData)
        }

        // Fetch feedback
        const feedbackRes = await fetch('/api/product-management/feedback')
        if (feedbackRes.ok) {
          const feedbackData = await feedbackRes.json()
          setFeedback(feedbackData)
        }

      } catch (error) {
        console.error('Failed to fetch data', error)
        // Set empty defaults on error
        setStats([])
        setRoadmap([])
        setBlockers([])
        setTeamStatus([{ id: 'none', name: 'No active tasks', load: 0, status: 'Available' }])
        setMetrics([])
        setVelocityData(null)
        setReleaseTimeline([])
        setTeamPerformance(null)
        setMultiProjectRoadmap(null)
        setStrategicPlanning(null)
        setWhatIfScenarios([])
        setRiskPredictions(null)
        setCapacityForecast(null)
        setReleaseSuccessPredictions(null)
        setStakeholderUpdates(null)
        setCollaborationActivity(null)
        setFeedback(null)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('pm-widgets')
    if (saved) {
      try {
        const savedWidgets: Widget[] = JSON.parse(saved)
        // Migration: If all widgets are visible (old default), reset to invisible for welcome message
        const allVisible = savedWidgets.every(w => w.visible === true)
        if (allVisible && savedWidgets.length > 0) {
          console.log('🔄 Migrating product management dashboard: Resetting widgets for welcome message')
          const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
          setWidgets(firstLoginWidgets)
          localStorage.setItem('pm-widgets', JSON.stringify(firstLoginWidgets))
          return
        }
        // Merge saved widgets with defaults to ensure all widgets are present
        // Start with all default widgets, then apply saved visibility preferences
        const mergedWidgets = defaultWidgets.map(defaultWidget => {
          const savedWidget = savedWidgets.find(w => w.id === defaultWidget.id)
          // Use saved visibility preference if exists, otherwise use default
          return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
        })
        // Also include any saved widgets that aren't in defaultWidgets (for backward compatibility)
        const savedWidgetIds = new Set(mergedWidgets.map(w => w.id))
        savedWidgets.forEach(savedWidget => {
          if (!savedWidgetIds.has(savedWidget.id)) {
            mergedWidgets.push(savedWidget)
          }
        })
        setWidgets(mergedWidgets)
        // Save merged widgets back to localStorage to include any new widgets
        localStorage.setItem('pm-widgets', JSON.stringify(mergedWidgets))
      } catch (e) {
        console.error('Failed to load widget preferences', e)
        // On error, also set all widgets to invisible for first login
        const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
        setWidgets(firstLoginWidgets)
        localStorage.setItem('pm-widgets', JSON.stringify(firstLoginWidgets))
      }
    } else {
      // First login: set all widgets to invisible
      const firstLoginWidgets = defaultWidgets.map(w => ({ ...w, visible: false }))
      setWidgets(firstLoginWidgets)
      localStorage.setItem('pm-widgets', JSON.stringify(firstLoginWidgets))
    }

    const savedLayouts = localStorage.getItem('pm-layouts')
    if (savedLayouts) {
      try {
        const parsedLayouts: Layouts = JSON.parse(savedLayouts)
        // Merge saved layouts with defaults to ensure all widgets have positions
        const mergedLayouts: Layouts = { lg: [], md: [], sm: [] }
        
        // For each breakpoint, merge saved layouts with defaults
        ;(['lg', 'md', 'sm'] as const).forEach(breakpoint => {
          const savedBreakpointLayouts = parsedLayouts[breakpoint] || []
          const defaultBreakpointLayouts = defaultLayouts[breakpoint] || []
          
          // Create a map of saved layouts by widget id
          const savedLayoutMap = new Map(savedBreakpointLayouts.map(l => [l.i, l]))
          
          // Start with saved layouts, then add any missing defaults
          const merged: Layout[] = [...savedBreakpointLayouts]
          
          defaultBreakpointLayouts.forEach(defaultLayout => {
            if (!savedLayoutMap.has(defaultLayout.i)) {
              merged.push(defaultLayout)
            }
          })
          
          mergedLayouts[breakpoint] = merged
        })
        
        setLayouts(mergedLayouts)
        localStorage.setItem('pm-layouts', JSON.stringify(mergedLayouts))
      } catch (e) {
        console.error('Failed to load layouts', e)
        setLayouts(defaultLayouts)
        localStorage.setItem('pm-layouts', JSON.stringify(defaultLayouts))
      }
    } else {
      setLayouts(defaultLayouts)
      localStorage.setItem('pm-layouts', JSON.stringify(defaultLayouts))
    }

    const savedLinks = localStorage.getItem('pm-useful-links')
    if (savedLinks) {
      try {
        setUsefulLinks(JSON.parse(savedLinks))
      } catch (e) {
        console.error('Failed to load useful links', e)
      }
    }
  }, [])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    localStorage.setItem('pm-layouts', JSON.stringify(allLayouts))
  }

  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    )
    setWidgets(updatedWidgets)
    localStorage.setItem('pm-widgets', JSON.stringify(updatedWidgets))
  }

  const toggleFullscreen = (widgetId: string) => {
    if (fullscreenWidget === widgetId) {
      setFullscreenWidget(null)
    } else {
      setFullscreenWidget(widgetId)
    }
  }

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

  // Fetch user's tasks
  useEffect(() => {
    if (user?.id) {
      fetchUserTasks()
      checkActiveTimer()
    }
  }, [user?.id])

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

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stats':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5"
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                    </div>
                  </div>
                ))}
              </div>
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
                      key={r.id || r.title}
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
                  <MapIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
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
              {/* Velocity and Burndown charts would be integrated here when sprint tracking is fully implemented */}
              {metrics.length > 4 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Additional Metrics</div>
                  <div className="grid grid-cols-2 gap-2">
                    {metrics.slice(4).map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg border border-border bg-background p-2"
                      >
                        <div className="text-[10px] text-muted-foreground">{m.label}</div>
                        <div className="text-sm font-semibold mt-0.5">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Velocity Trend Chart */}
              {velocityData && velocityData.velocityTrend && velocityData.velocityTrend.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">Sprint Velocity Trend</div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={velocityData.velocityTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="sprintName" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="velocity" 
                          stroke="#9333ea" 
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          name="Velocity"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {velocityData.avgVelocity > 0 && (
                    <div className="text-[10px] text-muted-foreground text-center">
                      Avg Velocity: {velocityData.avgVelocity} points
                    </div>
                  )}
                </div>
              )}

              {/* Burndown Chart */}
              {velocityData && velocityData.burndown && velocityData.burndown.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="text-xs text-muted-foreground">
                    Active Sprint Burndown
                    {velocityData.activeSprint && (
                      <span className="ml-2 text-[10px]">({velocityData.activeSprint.name})</span>
                    )}
                  </div>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={velocityData.burndown}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis 
                          tick={{ fontSize: 10 }}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '6px',
                            fontSize: '12px'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="ideal" 
                          stroke="#10b981" 
                          fill="#10b981" 
                          fillOpacity={0.2}
                          name="Ideal"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="actual" 
                          stroke="#9333ea" 
                          fill="#9333ea" 
                          fillOpacity={0.3}
                          name="Actual"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
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
                      key={b.id || b.title}
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
                      key={t.id || t.name}
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

      case 'releaseTimeline':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Release Timeline</CardTitle>
              <CardDescription className="text-xs">Upcoming releases and progress</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {releaseTimeline.length > 0 ? (
                <div className="space-y-3">
                  {releaseTimeline.slice(0, 5).map((release: any) => (
                    <div
                      key={release.id}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-foreground font-medium">{release.name}</div>
                          <Badge variant="outline" className="text-[10px]">
                            {release.version}
                          </Badge>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            release.riskLevel === 'HIGH'
                              ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300'
                              : release.riskLevel === 'MEDIUM'
                              ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-300'
                              : 'border border-green-500/60 bg-green-500/10 text-green-600 dark:text-green-300'
                          }`}
                        >
                          {release.riskLevel}
                        </span>
                      </div>
                      {release.project && (
                        <div className="text-muted-foreground text-[10px] mb-1">
                          {release.project.name}
                        </div>
                      )}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{release.progress}%</span>
                        </div>
                        <Progress value={release.progress} className="h-1" />
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                        <span>
                          Target: {new Date(release.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        {release.blockedTasks > 0 && (
                          <span className="text-rose-600">⚠ {release.blockedTasks} blocked</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No upcoming releases</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'teamPerformance':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Team Performance</CardTitle>
              <CardDescription className="text-xs">Individual performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {teamPerformance && teamPerformance.teamPerformance && teamPerformance.teamPerformance.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {teamPerformance.summary && (
                    <div className="grid grid-cols-3 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">{teamPerformance.summary.avgCompletionRate}%</div>
                        <div className="text-[10px] text-muted-foreground">Avg Completion</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{teamPerformance.summary.avgVelocity}</div>
                        <div className="text-[10px] text-muted-foreground">Avg Velocity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{teamPerformance.summary.completedTasks}</div>
                        <div className="text-[10px] text-muted-foreground">Completed</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Team Members */}
                  <div className="space-y-3">
                    {teamPerformance.teamPerformance.slice(0, 5).map((member: any) => (
                      <div
                        key={member.userId}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-foreground font-medium">{member.name}</div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              member.status === 'Blocked'
                                ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600'
                                : member.status === 'Overloaded'
                                ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                                : member.status === 'Busy'
                                ? 'border border-blue-500/60 bg-blue-500/10 text-blue-600'
                                : 'border border-green-500/60 bg-green-500/10 text-green-600'
                            }`}
                          >
                            {member.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <div className="text-[10px] text-muted-foreground">Completion</div>
                            <div className="text-sm font-semibold">{member.completionRate}%</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-muted-foreground">Velocity</div>
                            <div className="text-sm font-semibold">{member.velocity} pts</div>
                          </div>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Tasks: {member.completedTasks}/{member.totalTasks}</span>
                            <span className="text-muted-foreground">Load: {member.load}%</span>
                          </div>
                          <Progress value={member.load} className="h-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No performance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'multiProjectRoadmap':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Multi-Project Roadmap</CardTitle>
              <CardDescription className="text-xs">Unified view across all projects</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {multiProjectRoadmap && multiProjectRoadmap.roadmap && multiProjectRoadmap.roadmap.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary Stats */}
                  {multiProjectRoadmap.stats && (
                    <div className="grid grid-cols-3 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">{multiProjectRoadmap.stats.totalProjects}</div>
                        <div className="text-[10px] text-muted-foreground">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{multiProjectRoadmap.stats.totalReleases}</div>
                        <div className="text-[10px] text-muted-foreground">Releases</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{multiProjectRoadmap.stats.avgProgress}%</div>
                        <div className="text-[10px] text-muted-foreground">Avg Progress</div>
                      </div>
                    </div>
                  )}

                  {/* Projects List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {multiProjectRoadmap.roadmap.slice(0, 5).map((project: any) => (
                      <div
                        key={project.id}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-foreground font-medium">{project.name}</div>
                            {project.code && (
                              <Badge variant="outline" className="text-[10px]">{project.code}</Badge>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              project.status === 'IN_PROGRESS'
                                ? 'border border-blue-500/60 bg-blue-500/10 text-blue-600'
                                : project.status === 'PLANNING'
                                ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                                : 'border border-border bg-muted text-muted-foreground'
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-1" />
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
                          <span>{project.releases.length} releases</span>
                          <span>{project.sprints.length} sprints</span>
                          {project.dependencies && project.dependencies.length > 0 && (
                            <span className="text-amber-600">⚠ {project.dependencies.length} deps</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <MapIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No roadmap data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'strategicPlanning':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Strategic Planning</CardTitle>
              <CardDescription className="text-xs">
                OKR-aligned initiatives {strategicPlanning?.currentQuarter && `(${strategicPlanning.currentQuarter} ${strategicPlanning.currentYear})`}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {strategicPlanning && strategicPlanning.initiatives && strategicPlanning.initiatives.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {strategicPlanning.summary && (
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">{strategicPlanning.summary.activeInitiatives}</div>
                        <div className="text-[10px] text-muted-foreground">Active Initiatives</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{strategicPlanning.summary.avgProgress}%</div>
                        <div className="text-[10px] text-muted-foreground">Avg Progress</div>
                      </div>
                    </div>
                  )}

                  {/* Initiatives */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {strategicPlanning.initiatives.slice(0, 4).map((initiative: any) => (
                      <div
                        key={initiative.id}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <div className="text-foreground font-medium line-clamp-1">{initiative.title}</div>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{initiative.level}</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground mb-2">{initiative.quarter}</div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{initiative.progress}%</span>
                          </div>
                          <Progress value={initiative.progress} className="h-1" />
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                          <span>{initiative.keyResults.length} key results</span>
                          <span>{initiative.relatedProjects.length} projects</span>
                          <span>Confidence: {initiative.confidence}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No strategic initiatives</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'riskPrediction':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Risk Prediction</CardTitle>
              <CardDescription className="text-xs">AI-powered risk analysis</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {riskPredictions && riskPredictions.predictions && riskPredictions.predictions.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {riskPredictions.summary && (
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold text-rose-600">
                          {riskPredictions.summary.critical + riskPredictions.summary.high}
                        </div>
                        <div className="text-[10px] text-muted-foreground">At Risk</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{riskPredictions.summary.avgRiskScore}</div>
                        <div className="text-[10px] text-muted-foreground">Avg Risk Score</div>
                      </div>
                    </div>
                  )}

                  {/* At-Risk Projects */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {riskPredictions.predictions
                      .filter((p: any) => p.riskLevel === 'CRITICAL' || p.riskLevel === 'HIGH')
                      .slice(0, 5)
                      .map((prediction: any) => (
                        <div
                          key={prediction.projectId}
                          className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-foreground font-medium line-clamp-1">
                              {prediction.projectName}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                prediction.riskLevel === 'CRITICAL'
                                  ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600'
                                  : 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                              }`}
                            >
                              {prediction.riskLevel}
                            </span>
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">Risk Score</span>
                              <span className="font-medium">{prediction.riskScore}/100</span>
                            </div>
                            <Progress value={prediction.riskScore} className="h-1" />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-2">
                            Delay Probability: {prediction.delayProbability}%
                          </div>
                          {prediction.recommendations && prediction.recommendations.length > 0 && (
                            <div className="text-[10px] text-amber-600 mt-1">
                              ⚠ {prediction.recommendations[0]}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No risk predictions available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'capacityForecast':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Capacity Forecast</CardTitle>
              <CardDescription className="text-xs">Future team availability</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {capacityForecast && capacityForecast.forecasts && capacityForecast.forecasts.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {capacityForecast.summary && (
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {capacityForecast.summary.available}
                        </div>
                        <div className="text-[10px] text-muted-foreground">Available</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{capacityForecast.summary.avgUtilization}%</div>
                        <div className="text-[10px] text-muted-foreground">Avg Utilization</div>
                      </div>
                    </div>
                  )}

                  {/* Team Members */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {capacityForecast.forecasts.slice(0, 5).map((forecast: any) => (
                      <div
                        key={forecast.userId}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-foreground font-medium">{forecast.name}</div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              forecast.status === 'OVERLOADED'
                                ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600'
                                : forecast.status === 'FULL'
                                ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                                : forecast.status === 'BUSY'
                                ? 'border border-blue-500/60 bg-blue-500/10 text-blue-600'
                                : 'border border-green-500/60 bg-green-500/10 text-green-600'
                            }`}
                          >
                            {forecast.status}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Utilization</span>
                            <span className="font-medium">{forecast.utilization}%</span>
                          </div>
                          <Progress value={forecast.utilization} className="h-1" />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          Available: {forecast.availableCapacity} pts
                        </div>
                        {forecast.forecastedAvailability && forecast.forecastedAvailability.length > 0 && (
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Next month: {forecast.forecastedAvailability[0]?.available || 0} pts available
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No capacity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'releaseSuccessPrediction':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Release Success Prediction</CardTitle>
              <CardDescription className="text-xs">Probability of successful release</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {releaseSuccessPredictions &&
              releaseSuccessPredictions.predictions &&
              releaseSuccessPredictions.predictions.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {releaseSuccessPredictions.summary && (
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {releaseSuccessPredictions.summary.avgSuccessProbability}%
                        </div>
                        <div className="text-[10px] text-muted-foreground">Avg Success Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-rose-600">
                          {releaseSuccessPredictions.summary.critical + releaseSuccessPredictions.summary.low}
                        </div>
                        <div className="text-[10px] text-muted-foreground">At Risk</div>
                      </div>
                    </div>
                  )}

                  {/* Releases */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {releaseSuccessPredictions.predictions.slice(0, 5).map((prediction: any) => (
                      <div
                        key={prediction.releaseId}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="text-foreground font-medium line-clamp-1">
                              {prediction.releaseName}
                            </div>
                            <Badge variant="outline" className="text-[10px]">{prediction.version}</Badge>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                              prediction.successLevel === 'CRITICAL' || prediction.successLevel === 'LOW'
                                ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600'
                                : prediction.successLevel === 'MEDIUM'
                                ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                                : 'border border-green-500/60 bg-green-500/10 text-green-600'
                            }`}
                          >
                            {prediction.successProbability}%
                          </span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-muted-foreground">Success Probability</span>
                            <span className="font-medium">{prediction.successProbability}%</span>
                          </div>
                          <Progress
                            value={prediction.successProbability}
                            className={`h-1 ${
                              prediction.successProbability < 60 ? 'bg-rose-500' : 'bg-green-500'
                            }`}
                          />
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-2">
                          {prediction.daysUntilRelease} days until release • {prediction.progress}% complete
                        </div>
                        {prediction.riskFactors && prediction.riskFactors.length > 0 && (
                          <div className="text-[10px] text-amber-600 mt-1">
                            ⚠ {prediction.riskFactors[0]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No release predictions available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'whatIfScenarios':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">What-If Scenarios</CardTitle>
                  <CardDescription className="text-xs">Simulate project changes</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Open scenario dialog
                    alert('Scenario simulation dialog coming soon')
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {whatIfScenarios.length > 0 ? (
                <div className="space-y-3">
                  {whatIfScenarios.map((scenario, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-foreground font-medium">{scenario.scenarioType}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            scenario.riskAssessment?.level === 'HIGH'
                              ? 'border border-rose-500/60 bg-rose-500/10 text-rose-600'
                              : scenario.riskAssessment?.level === 'MEDIUM'
                              ? 'border border-amber-500/60 bg-amber-500/10 text-amber-600'
                              : 'border border-green-500/60 bg-green-500/10 text-green-600'
                          }`}
                        >
                          {scenario.riskAssessment?.level || 'LOW'}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[10px]">{scenario.projectName}</div>
                      {scenario.riskAssessment?.impact && (
                        <div className="text-muted-foreground text-[10px] mt-1">
                          {scenario.riskAssessment.impact}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No scenarios run yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      alert('Scenario simulation dialog coming soon')
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Create Scenario
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'stakeholderUpdates':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Stakeholder Updates</CardTitle>
                  <CardDescription className="text-xs">Automated project communications</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Open send update dialog
                    alert('Send update dialog coming soon')
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {stakeholderUpdates && stakeholderUpdates.updates && stakeholderUpdates.updates.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {stakeholderUpdates.summary && (
                    <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">{stakeholderUpdates.summary.activeProjects}</div>
                        <div className="text-[10px] text-muted-foreground">Active Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{stakeholderUpdates.summary.avgProgress}%</div>
                        <div className="text-[10px] text-muted-foreground">Avg Progress</div>
                      </div>
                    </div>
                  )}

                  {/* Update Schedule */}
                  {stakeholderUpdates.schedule && (
                    <div className="text-[10px] text-muted-foreground pb-2 border-b">
                      Next weekly update:{' '}
                      {new Date(stakeholderUpdates.schedule.weekly.nextUpdate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  )}

                  {/* Project Updates */}
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {stakeholderUpdates.updates.slice(0, 5).map((update: any) => (
                      <div
                        key={update.projectId}
                        className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-foreground font-medium line-clamp-1">{update.projectName}</div>
                          <Badge variant="outline" className="text-[10px]">{update.progress}%</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div>{update.updateSummary.tasks}</div>
                          {update.upcomingReleases.length > 0 && (
                            <div>{update.updateSummary.releases}</div>
                          )}
                        </div>
                        {update.upcomingReleases.length > 0 && (
                          <div className="mt-2 text-[10px] text-muted-foreground">
                            {update.upcomingReleases[0].name} -{' '}
                            {new Date(update.upcomingReleases[0].targetDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No updates available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'collaborationActivity':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Real-time Activity</CardTitle>
              <CardDescription className="text-xs">Live collaboration feed</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {collaborationActivity && collaborationActivity.activities && collaborationActivity.activities.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  {collaborationActivity.summary && (
                    <div className="grid grid-cols-3 gap-2 pb-3 border-b">
                      <div className="text-center">
                        <div className="text-lg font-bold">{collaborationActivity.summary.totalActivities}</div>
                        <div className="text-[10px] text-muted-foreground">Activities</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{collaborationActivity.summary.byType.taskUpdates}</div>
                        <div className="text-[10px] text-muted-foreground">Task Updates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{collaborationActivity.summary.byType.releaseUpdates}</div>
                        <div className="text-[10px] text-muted-foreground">Releases</div>
                      </div>
                    </div>
                  )}

                  {/* Activity Feed */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {collaborationActivity.activities.slice(0, 10).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {activity.type === 'TASK_UPDATE' && <ClipboardList className="h-3 w-3 text-blue-500" />}
                            {activity.type === 'PROJECT_UPDATE' && <Briefcase className="h-3 w-3 text-purple-500" />}
                            {activity.type === 'RELEASE_UPDATE' && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-foreground font-medium line-clamp-1">{activity.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{activity.description}</div>
                            {activity.project && (
                              <div className="text-[10px] text-muted-foreground mt-0.5">
                                {activity.project.name}
                              </div>
                            )}
                            <div className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'feedbackIntegration':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Feedback & Requests</CardTitle>
                  <CardDescription className="text-xs">User feedback and feature requests</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO: Open feedback form
                    alert('Feedback form coming soon')
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Submit
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {feedback && feedback.stats ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-2 pb-3 border-b">
                    <div className="text-center">
                      <div className="text-lg font-bold">{feedback.stats.total}</div>
                      <div className="text-[10px] text-muted-foreground">Total Feedback</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{feedback.stats.avgSatisfaction}/10</div>
                      <div className="text-[10px] text-muted-foreground">Avg Satisfaction</div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Feature Requests</span>
                      <span className="font-medium">{feedback.stats.featureRequests}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Bug Reports</span>
                      <span className="font-medium">{feedback.stats.bugReports}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Improvements</span>
                      <span className="font-medium">{feedback.stats.improvements}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">High Priority</span>
                      <span className="font-medium text-rose-600">{feedback.stats.highPriority}</span>
                    </div>
                  </div>

                  {/* Feedback List */}
                  {feedback.feedback && feedback.feedback.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto mt-4">
                      {feedback.feedback.slice(0, 5).map((item: any) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border bg-background px-2.5 py-2 text-xs"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-foreground font-medium line-clamp-1">{item.title}</div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                item.priority === 'CRITICAL' || item.priority === 'HIGH'
                                  ? 'border-rose-500/60 text-rose-600'
                                  : ''
                              }`}
                            >
                              {item.type}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground line-clamp-2">{item.description}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-muted-foreground">
                      No feedback submitted yet
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No feedback data available</p>
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
                  <MapIcon className="h-5 w-5 shrink-0" />
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
                        localStorage.setItem('pm-useful-links', JSON.stringify(updated))
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
                            localStorage.setItem('pm-useful-links', JSON.stringify(updated))
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar is now handled by layout.tsx */}

        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
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
                      <h3 className="text-2xl font-semibold mb-3">Welcome to Your Product Management Dashboard</h3>
                      <p className="text-muted-foreground mb-2 text-lg">
                        Get started by adding your first widgets and data.
                      </p>
                      <p className="text-muted-foreground mb-8">
                        Once you start adding widgets, you'll see beautiful visualizations and insights here.
                      </p>
                      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/product-management')}
                          className="flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Widget
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/projects')}
                          className="flex items-center gap-2"
                        >
                          <Briefcase className="h-4 w-4" />
                          View Projects
                        </Button>
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
                        Welcome to Your Product Management Dashboard
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
            <div className="pm-grid">
              <ResponsiveGridLayout
                key={JSON.stringify(layouts.lg?.map(l => l.i))}
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
        taskId={selectedTaskId}
        onUpdate={fetchUserTasks}
        parentTaskId={addingTaskToGroup ? undefined : null}
        groupId={addingTaskToGroup || undefined}
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


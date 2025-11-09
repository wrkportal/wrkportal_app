'use client'

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useAuthStore, fetchAuthenticatedUser } from "@/stores/authStore"
import { getInitials, cn } from "@/lib/utils"
import {
    Plus,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Target,
    TrendingUp,
    FileText,
    Users,
    BarChart3,
    MoreVertical,
    GripVertical,
    LayoutDashboard,
    Briefcase,
    Play,
    Pause,
    History,
    Filter,
    X,
    List,
    ChevronLeft,
    ChevronRight,
    MessageSquare,
    Link,
    Palette,
    Activity,
    ClipboardList,
    Network,
    Square,
    Circle,
    Minus,
    ArrowUpRight,
    Type,
    Image,
    Download,
    Upload,
    Trash2,
    Edit2,
    Save,
    Eye,
    Send,
    Undo,
    Redo,
    Maximize,
    Minimize
} from "lucide-react"
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { TaskDialog } from "@/components/dialogs/task-dialog"
import { TaskDetailDialog } from "@/components/dialogs/task-detail-dialog"
import { TimeTrackingDialog } from "@/components/dialogs/time-tracking-dialog"
import { TimerNotesDialog } from "@/components/dialogs/timer-notes-dialog"
import { CollaborationDialog } from "@/components/dialogs/collaboration-dialog"
import { SaveDefaultLayoutButton } from "@/components/ui/save-default-layout-button"
import { useDefaultLayout } from "@/hooks/useDefaultLayout"
import { AdvancedFormsWidget } from "@/components/widgets/AdvancedFormsWidget"
import { AdvancedMindMapWidget } from "@/components/widgets/AdvancedMindMapWidget"
import { AdvancedCanvasWidget } from "@/components/widgets/AdvancedCanvasWidget"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
    id: string
    type: string
    visible: boolean
}

const defaultWidgets: Widget[] = [
    { id: 'metrics', type: 'metrics', visible: true },
    { id: 'overdueTasks', type: 'overdueTasks', visible: false },
    { id: 'recentProjects', type: 'recentProjects', visible: true },
    { id: 'myTasks', type: 'myTasks', visible: true },
    { id: 'activeOKRs', type: 'activeOKRs', visible: true },
    { id: 'quickActions', type: 'quickActions', visible: true },
    { id: 'usefulLinks', type: 'usefulLinks', visible: false },
    { id: 'canvas', type: 'canvas', visible: false },
    { id: 'forms', type: 'forms', visible: true },
    { id: 'mindMap', type: 'mindMap', visible: true },
]

const defaultLayouts: Layouts = {
    lg: [
        { i: 'metrics', x: 0, y: 0, w: 6, h: 8, minW: 3, minH: 2 },
        { i: 'quickActions', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
        { i: 'recentProjects', x: 0, y: 8, w: 6, h: 8, minW: 3, minH: 4 },
        { i: 'myTasks', x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 6 },
        { i: 'activeOKRs', x: 0, y: 16, w: 6, h: 8, minW: 3, minH: 3 },
        { i: 'overdueTasks', x: 6, y: 16, w: 6, h: 8, minW: 3, minH: 3 },
        { i: 'usefulLinks', x: 0, y: 24, w: 6, h: 8, minW: 3, minH: 4 },
        { i: 'canvas', x: 6, y: 24, w: 6, h: 8, minW: 3, minH: 8 },
        { i: 'forms', x: 0, y: 32, w: 6, h: 8, minW: 3, minH: 4 },
        { i: 'mindMap', x: 6, y: 32, w: 6, h: 8, minW: 3, minH: 6 },
    ],
    md: [
        { i: 'metrics', x: 0, y: 0, w: 5, h: 8, minW: 3, minH: 2 },
        { i: 'quickActions', x: 5, y: 0, w: 5, h: 8, minW: 3, minH: 4 },
        { i: 'recentProjects', x: 0, y: 8, w: 5, h: 8, minW: 3, minH: 4 },
        { i: 'myTasks', x: 5, y: 8, w: 5, h: 8, minW: 3, minH: 6 },
        { i: 'activeOKRs', x: 0, y: 16, w: 5, h: 8, minW: 3, minH: 3 },
        { i: 'overdueTasks', x: 5, y: 16, w: 5, h: 8, minW: 3, minH: 3 },
        { i: 'usefulLinks', x: 0, y: 24, w: 5, h: 8, minW: 3, minH: 4 },
        { i: 'canvas', x: 5, y: 24, w: 5, h: 8, minW: 3, minH: 8 },
        { i: 'forms', x: 0, y: 32, w: 5, h: 8, minW: 3, minH: 4 },
        { i: 'mindMap', x: 5, y: 32, w: 5, h: 8, minW: 3, minH: 6 },
    ],
    sm: [
        { i: 'metrics', x: 0, y: 0, w: 3, h: 8, minW: 2, minH: 2 },
        { i: 'quickActions', x: 3, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'myTasks', x: 0, y: 8, w: 3, h: 8, minW: 2, minH: 6 },
        { i: 'recentProjects', x: 3, y: 8, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'activeOKRs', x: 0, y: 16, w: 3, h: 8, minW: 2, minH: 3 },
        { i: 'overdueTasks', x: 3, y: 16, w: 3, h: 8, minW: 2, minH: 3 },
        { i: 'usefulLinks', x: 0, y: 24, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'canvas', x: 3, y: 24, w: 3, h: 8, minW: 2, minH: 8 },
        { i: 'forms', x: 0, y: 32, w: 3, h: 8, minW: 2, minH: 4 },
        { i: 'mindMap', x: 3, y: 32, w: 3, h: 8, minW: 2, minH: 6 },
    ],
}

export default function HomePage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)
    const [isLoading, setIsLoading] = useState(true)
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
    const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
    const [defaultReferenceLayouts, setDefaultReferenceLayouts] = useState<Layouts>(defaultLayouts)
    const [useDefaultFromDB, setUseDefaultFromDB] = useState(false)
    const { loadDefaultLayout } = useDefaultLayout()
    const [taskDialogOpen, setTaskDialogOpen] = useState(false)
    const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false)
    const [timeTrackingDialogOpen, setTimeTrackingDialogOpen] = useState(false)
    const [timeTrackingTaskId, setTimeTrackingTaskId] = useState<string | undefined>(undefined)
    const [activeTimer, setActiveTimer] = useState<any>(null)
    const [timerSeconds, setTimerSeconds] = useState<{ [key: string]: number }>({})
    const [timerNotesDialogOpen, setTimerNotesDialogOpen] = useState(false)
    const [pendingTimerTask, setPendingTimerTask] = useState<{ id: string; title: string } | null>(null)

    // Task filters
    const [statusFilter, setStatusFilter] = useState<string>('ALL')
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
    const [dueDateFilter, setDueDateFilter] = useState<string>('ALL')
    const [showFilters, setShowFilters] = useState(false)
    const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('calendar')
    const [calendarDate, setCalendarDate] = useState(new Date())

    // Useful Links state
    const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
    const [newLinkTitle, setNewLinkTitle] = useState('')
    const [newLinkUrl, setNewLinkUrl] = useState('')

    // Canvas state
    const [canvasDrawing, setCanvasDrawing] = useState<boolean>(false)
    const [canvasMode, setCanvasMode] = useState<'draw' | 'shape' | 'text' | 'image'>('draw')
    const [canvasColor, setCanvasColor] = useState('#000000')
    const [canvasLineWidth, setCanvasLineWidth] = useState(2)
    const [canvasShapeType, setCanvasShapeType] = useState<'rectangle' | 'circle' | 'line' | 'arrow'>('rectangle')

    // Fullscreen state and refs for each widget
    const widgetRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)
    const [canvasElements, setCanvasElements] = useState<any[]>([])
    const [canvasHistory, setCanvasHistory] = useState<any[]>([])

    // Forms state
    const [forms, setForms] = useState<Array<{ id: string; name: string; fields: any[]; submissions: any[] }>>([])
    const [currentFormId, setCurrentFormId] = useState<string | null>(null)
    const [formBuilderOpen, setFormBuilderOpen] = useState(false)
    const [formFields, setFormFields] = useState<Array<{ id: string; type: string; label: string; required: boolean; options?: string[] }>>([])
    
    // Mind Map state
    const [mindMapNodes, setMindMapNodes] = useState<Array<{ id: string; x: number; y: number; label: string; color: string }>>([
        { id: 'root', x: 250, y: 200, label: 'Central Idea', color: '#3b82f6' }
    ])
    const [mindMapConnections, setMindMapConnections] = useState<Array<{ from: string; to: string }>>([])
    const [selectedNode, setSelectedNode] = useState<string | null>(null)
    const [draggingNode, setDraggingNode] = useState<string | null>(null)
    const [connectingFrom, setConnectingFrom] = useState<string | null>(null)


    // Mobile detection
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768) // md breakpoint
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Fetch real user data on component mount
    useEffect(() => {
        const loadUser = async () => {
            setIsLoading(true)
            const authenticatedUser = await fetchAuthenticatedUser()
            if (authenticatedUser) {
                setUser(authenticatedUser)
            }
            setIsLoading(false)
        }
        loadUser()
    }, [setUser])

    // Load saved widgets and layouts from localStorage or default from DB
    useEffect(() => {
        const loadLayouts = async () => {
            const savedWidgets = localStorage.getItem('home-widgets')
            const savedLayouts = localStorage.getItem('home-layouts')
            const useDBDefault = localStorage.getItem('home-use-db-default') === 'true'

            // Always use hardcoded defaultLayouts as reference for widget dimensions
            setDefaultReferenceLayouts(defaultLayouts)

            // Load saved widgets visibility, or use defaults
            if (savedWidgets) {
                setWidgets(JSON.parse(savedWidgets))
            } else {
                setWidgets(defaultWidgets)
            }

            // Load layouts - preserve user customizations!
            if (savedLayouts) {
                const parsedLayouts = JSON.parse(savedLayouts)
                setLayouts(parsedLayouts)
            } else {
                setLayouts(defaultLayouts)
                localStorage.setItem('home-layouts', JSON.stringify(defaultLayouts))
            }
        }

        loadLayouts()
    }, [])

    const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
        setLayouts(allLayouts)
        // Don't save to localStorage if using DB default
        if (!useDefaultFromDB) {
            localStorage.setItem('home-layouts', JSON.stringify(allLayouts))
        }
    }

    const toggleWidget = (widgetId: string) => {
        const widget = widgets.find(w => w.id === widgetId)
        const isBeingEnabled = widget && !widget.visible

        const updatedWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w
        )
        setWidgets(updatedWidgets)

        // Don't save to localStorage if using DB default
        if (!useDefaultFromDB) {
            localStorage.setItem('home-widgets', JSON.stringify(updatedWidgets))
        }

        // If widget is being re-enabled, restore its default layout dimensions
        if (isBeingEnabled) {
            const updatedLayouts = { ...layouts }

            // For each breakpoint, restore the default dimensions for this widget
            Object.keys(defaultReferenceLayouts).forEach(breakpoint => {
                const defaultLayout = defaultReferenceLayouts[breakpoint as keyof Layouts]
                const currentLayout = updatedLayouts[breakpoint as keyof Layouts]

                if (defaultLayout && currentLayout) {
                    const defaultWidgetLayout = defaultLayout.find((l: Layout) => l.i === widgetId)
                    const currentLayoutIndex = currentLayout.findIndex((l: Layout) => l.i === widgetId)

                    if (defaultWidgetLayout) {
                        if (currentLayoutIndex !== -1) {
                            // Widget exists, update it with default size
                            currentLayout[currentLayoutIndex] = {
                                ...currentLayout[currentLayoutIndex],
                                w: defaultWidgetLayout.w,
                                h: defaultWidgetLayout.h,
                                minW: defaultWidgetLayout.minW,
                                minH: defaultWidgetLayout.minH,
                            }
                        } else {
                            // Widget doesn't exist, add it with default size
                            currentLayout.push({ ...defaultWidgetLayout })
                        }
                    }
                }
            })

            setLayouts(updatedLayouts)

            // Don't save to localStorage if using DB default
            if (!useDefaultFromDB) {
                localStorage.setItem('home-layouts', JSON.stringify(updatedLayouts))
            }
        }
    }

    const resetLayout = async () => {
        // Clear user's personal layout
        localStorage.removeItem('home-widgets')
        localStorage.removeItem('home-layouts')
        localStorage.removeItem('home-use-db-default')

        // Use hardcoded defaults with large sizes
        setWidgets(defaultWidgets)
        setLayouts(defaultLayouts)
        setDefaultReferenceLayouts(defaultLayouts)
    }

    // State for real data
    const [userTasks, setUserTasks] = useState<any[]>([])
    const [userProjects, setUserProjects] = useState<any[]>([])
    const [userGoals, setUserGoals] = useState<any[]>([])

    // Fetch user's tasks
    const fetchTasks = async () => {
        try {
            const response = await fetch('/api/tasks')
            if (response.ok) {
                const data = await response.json()
                setUserTasks(data.tasks || [])
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    // Fetch user's projects
    const fetchProjects = async () => {
        try {
            const response = await fetch('/api/projects')
            if (response.ok) {
                const data = await response.json()
                setUserProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }

    // Fetch user's goals
    const fetchGoals = async () => {
        try {
            const response = await fetch('/api/okrs')
            if (response.ok) {
                const data = await response.json()
                // Only show active goals
                const activeGoals = (data.goals || []).filter((g: any) => g.status === 'ACTIVE')
                setUserGoals(activeGoals)
            }
        } catch (error) {
            console.error('Error fetching goals:', error)
        }
    }

    // Fetch tasks, projects, and goals when component mounts
    useEffect(() => {
        if (user) {
            fetchTasks()
            fetchProjects()
            fetchGoals()
            checkActiveTimer()
            
            // Load useful links from localStorage
            const savedLinks = localStorage.getItem('useful-links')
            if (savedLinks) {
                try {
                    setUsefulLinks(JSON.parse(savedLinks))
                } catch (e) {
                    console.error('Error loading useful links:', e)
                }
            }
        }
    }, [user])

    // Check for active timer on mount
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

    // Update timer seconds for active timer
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

    // Format duration in seconds to readable format
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    // Filter tasks based on selected filters
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

    // Calculate overdue tasks count
    const getOverdueCount = () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        return userTasks.filter(task => {
            // Exclude completed or cancelled tasks
            if (task.status === 'DONE' || task.status === 'CANCELLED') {
                return false
            }

            // Check if task has a due date
            if (!task.dueDate) {
                return false
            }

            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)

            // Include if due date is before today
            return dueDate < today
        }).length
    }

    // Fullscreen toggle function
    const toggleFullscreen = async (widgetId: string) => {
        const card = widgetRefs.current[widgetId]
        if (!card) return

        try {
            if (!document.fullscreenElement) {
                await card.requestFullscreen()
                setFullscreenWidget(widgetId)
            } else {
                await document.exitFullscreen()
                setFullscreenWidget(null)
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err)
        }
    }

    // Listen for fullscreen changes (e.g., user pressing ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                setFullscreenWidget(null)
            }
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const renderWidget = (widget: Widget) => {
        switch (widget.type) {
            case 'metrics':
                return (
                    <Card ref={(el) => widgetRefs.current['metrics'] = el} className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-base">Overview</CardTitle>
                                    <CardDescription className="text-xs">Your workspace at a glance</CardDescription>
                                </div>
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
                        <CardContent className="flex-1 pt-4 pb-4">
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                                <div className="space-y-1 p-2 md:p-2.5 rounded-lg border min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Active Projects</p>
                                    <p className="text-xl md:text-2xl font-bold text-blue-600">{userProjects.length}</p>
                                </div>
                                <div className="space-y-1 p-2 md:p-2.5 rounded-lg border min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">My Tasks</p>
                                    <p className="text-xl md:text-2xl font-bold text-green-600">{userTasks.length}</p>
                                </div>
                                <div className="space-y-1 p-2 md:p-2.5 rounded-lg border min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Overdue</p>
                                    <p className="text-xl md:text-2xl font-bold text-red-600">{getOverdueCount()}</p>
                                </div>
                                <div className="space-y-1 p-2 md:p-2.5 rounded-lg border min-w-0">
                                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate">Active OKRs</p>
                                    <p className="text-xl md:text-2xl font-bold text-purple-600">{userGoals.length}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'recentProjects':
                // Sort by most recent (createdAt) and take top 5
                const recentProjects = [...userProjects]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)

                return (
                    <Card ref={(el) => widgetRefs.current['recentProjects'] = el} className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">Recent Projects</CardTitle>
                                    <CardDescription className="text-xs truncate">Your latest projects</CardDescription>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/projects/new')}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">New</span>
                                        <Plus className="h-4 w-4 sm:hidden" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFullscreen('recentProjects')}
                                        title={fullscreenWidget === 'recentProjects' ? "Exit Fullscreen" : "Enter Fullscreen"}
                                        className="h-8 w-8 p-0"
                                    >
                                        {fullscreenWidget === 'recentProjects' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto pt-4">
                            {recentProjects.length > 0 ? (
                                <div className="space-y-3">
                                    {recentProjects.map((project) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                                            onClick={() => router.push(`/projects/${project.id}`)}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            "h-2 w-2 rounded-full shrink-0",
                                                            project.ragStatus === 'GREEN' && "bg-green-500",
                                                            project.ragStatus === 'AMBER' && "bg-yellow-500",
                                                            project.ragStatus === 'RED' && "bg-red-500"
                                                        )}
                                                        title={project.ragStatus}
                                                    />
                                                    <p className="font-medium text-sm">{project.name}</p>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    {project.manager && (
                                                        <span>{project.manager.firstName} {project.manager.lastName}</span>
                                                    )}
                                                    {project.manager && project.status && <span>•</span>}
                                                    {project.status && (
                                                        <span>{project.status.replace('_', ' ')}</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={project.progress || 0} className="h-1 flex-1" />
                                                    <span className="text-xs font-medium">{project.progress || 0}%</span>
                                                </div>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/projects/new')}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Create Your First Project
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )

            case 'overdueTasks':
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const overdueTasks = userTasks.filter(task => {
                    // Exclude completed or cancelled tasks
                    if (task.status === 'DONE' || task.status === 'CANCELLED') {
                        return false
                    }

                    // Check if task has a due date
                    if (!task.dueDate) {
                        return false
                    }

                    // Parse and compare dates
                    const dueDate = new Date(task.dueDate)
                    dueDate.setHours(0, 0, 0, 0)

                    // Include if due date is before today
                    const isOverdue = dueDate < today

                    return isOverdue
                })

                return (
                    <Card ref={(el) => widgetRefs.current['overdueTasks'] = el} className="h-full flex flex-col overflow-hidden border-l-4 border-l-red-500">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-base text-red-600 dark:text-red-400">
                                        Overdue Tasks
                                    </CardTitle>
                                    <CardDescription className="text-xs">Tasks past their due date</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="destructive" className="text-lg font-bold">
                                        {overdueTasks.length}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFullscreen('overdueTasks')}
                                        title={fullscreenWidget === 'overdueTasks' ? "Exit Fullscreen" : "Enter Fullscreen"}
                                        className="h-7 w-7 p-0"
                                    >
                                        {fullscreenWidget === 'overdueTasks' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto pt-4">
                            <div className="space-y-3">
                                {overdueTasks.length > 0 ? (
                                    overdueTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-start gap-3 p-2 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-colors"
                                            onClick={() => {
                                                setSelectedTaskId(task.id)
                                                setTaskDetailDialogOpen(true)
                                            }}
                                        >
                                            <div className="flex-1 space-y-1">
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
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                                        {task.priority}
                                                    </Badge>
                                                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                        <CheckCircle2 className="h-12 w-12 text-green-500 mb-3" />
                                        <p className="text-sm text-muted-foreground">No overdue tasks! 🎉</p>
                                        <p className="text-xs text-muted-foreground mt-1">You&apos;re all caught up!</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'myTasks':
                const filteredTasks = getFilteredTasks()

                return (
                    <Card ref={(el) => widgetRefs.current['myTasks'] = el} className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">My Tasks</CardTitle>
                                    <CardDescription className="text-xs truncate">Tasks assigned to you</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTaskViewMode(taskViewMode === 'list' ? 'calendar' : 'list')}
                                        className="text-xs"
                                    >
                                        {taskViewMode === 'list' ? (
                                            <>
                                                <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                                <span>Calendar</span>
                                            </>
                                        ) : (
                                            <>
                                                <List className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                                <span>List</span>
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setTimeTrackingTaskId(undefined)
                                            setTimeTrackingDialogOpen(true)
                                        }}
                                        className="text-xs"
                                    >
                                        <History className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        <span className="hidden sm:inline">History</span>
                                        <span className="sm:hidden">Time</span>
                                    </Button>
                                    <Button
                                        variant={showFilters ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="text-xs"
                                    >
                                        <Filter className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        Filters
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setTaskDialogOpen(true)}
                                        className="text-xs"
                                    >
                                        <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        <span className="hidden sm:inline">Add Task</span>
                                        <span className="sm:hidden">Add</span>
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
                        <CardContent className="flex-1 overflow-auto pt-4">
                            {taskViewMode === 'list' ? (
                                <div className="space-y-3">
                                    {filteredTasks.length > 0 ? (
                                        filteredTasks.map((task) => {
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

                                                    {/* Timer Controls */}
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
                                                }}
                                            >
                                                Clear Filters
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Calendar View */
                                <div className="h-full">
                                    {(() => {
                                        // Group tasks by due date
                                        const tasksByDate: { [key: string]: any[] } = {}

                                        filteredTasks.forEach(task => {
                                            if (task.dueDate) {
                                                const dateKey = new Date(task.dueDate).toISOString().split('T')[0]
                                                if (!tasksByDate[dateKey]) {
                                                    tasksByDate[dateKey] = []
                                                }
                                                tasksByDate[dateKey].push(task)
                                            }
                                        })

                                        // Get current month and year from calendarDate state
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
                                                                                setSelectedTaskId(task.id)
                                                                                setTaskDetailDialogOpen(true)
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
                            )}
                        </CardContent>
                    </Card>
                )

            case 'activeOKRs':
                return (
                    <Card ref={(el) => widgetRefs.current['activeOKRs'] = el} className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">Active OKRs</CardTitle>
                                    <CardDescription className="text-xs truncate">Your objectives and key results</CardDescription>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.push('/okrs')}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        <span className="hidden sm:inline">New</span>
                                        <Plus className="h-4 w-4 sm:hidden" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleFullscreen('activeOKRs')}
                                        title={fullscreenWidget === 'activeOKRs' ? "Exit Fullscreen" : "Enter Fullscreen"}
                                        className="h-8 w-8 p-0"
                                    >
                                        {fullscreenWidget === 'activeOKRs' ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto pt-4">
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
                                            <div className="space-y-2">
                                                {goal.keyResults?.slice(0, 2).map((kr: any) => {
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
                                                {goal.keyResults?.length > 2 && (
                                                    <p className="text-xs text-muted-foreground text-center pt-1">
                                                        +{goal.keyResults.length - 2} more key result{goal.keyResults.length - 2 > 1 ? 's' : ''}
                                                    </p>
                                                )}
                                            </div>
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
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
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
                    <Card ref={(el) => widgetRefs.current['quickActions'] = el} className="h-full flex flex-col overflow-hidden">
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
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/projects/new')}>
                                    <Plus className="h-5 w-5 shrink-0" />
                                    <span className="text-xs font-medium text-center">New Project</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => setTaskDialogOpen(true)}>
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    <span className="text-xs font-medium text-center">New Task</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => setCollaborationDialogOpen(true)}>
                                    <MessageSquare className="h-5 w-5 shrink-0" />
                                    <span className="text-xs font-medium text-center">Collaborate</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/reports')}>
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <span className="text-xs font-medium text-center">View Reports</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/okrs')}>
                                    <Target className="h-5 w-5 shrink-0" />
                                    <span className="text-xs font-medium text-center">Goals & OKRs</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

            case 'usefulLinks':
                return (
                    <Card ref={(el) => widgetRefs.current['usefulLinks'] = el} className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Link className="h-4 w-4" />
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
                                            <Link className="h-3 w-3 text-muted-foreground flex-shrink-0" />
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
                                        <Link className="h-12 w-12 text-muted-foreground/50 mb-3" />
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

            default:
                return null
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading your workspace...</p>
                </div>
            </div>
        )
    }

    const currentHour = new Date().getHours()
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="space-y-2">
            {/* Header - Sticky */}
            <div className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 mb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            {greeting}, {user?.firstName || 'there'}!
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Welcome back to your workspace
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Save as Default Button (Platform Owner only) */}
                        <SaveDefaultLayoutButton
                            pageKey="my-work"
                            getCurrentLayout={() => ({ widgets, layouts })}
                            onSaveSuccess={() => {
                                // Clear localStorage and set flag to use DB default
                                localStorage.removeItem('home-widgets')
                                localStorage.removeItem('home-layouts')
                                localStorage.setItem('home-use-db-default', 'true')
                                setUseDefaultFromDB(true)
                            }}
                        />

                        {/* 3-Dot Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="px-2 py-1.5 text-sm font-semibold">Widget Visibility</div>
                                <DropdownMenuSeparator />
                                {widgets.filter(w => w.type !== 'overdueTasks').map((widget) => (
                                    <DropdownMenuCheckboxItem
                                        key={widget.id}
                                        checked={widget.visible}
                                        onCheckedChange={() => toggleWidget(widget.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {widget.type === 'metrics' && (
                                                <>
                                                    <Activity className="h-4 w-4" />
                                                    <span>Overview</span>
                                                </>
                                            )}
                                            {widget.type === 'recentProjects' && (
                                                <>
                                                    <Briefcase className="h-4 w-4" />
                                                    <span>Recent Projects</span>
                                                </>
                                            )}
                                            {widget.type === 'myTasks' && (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>My Tasks</span>
                                                </>
                                            )}
                                            {widget.type === 'activeOKRs' && (
                                                <>
                                                    <Target className="h-4 w-4" />
                                                    <span>Active OKRs</span>
                                                </>
                                            )}
                                            {widget.type === 'quickActions' && (
                                                <>
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span>Quick Actions</span>
                                                </>
                                            )}
                                            {widget.type === 'usefulLinks' && (
                                                <>
                                                    <Link className="h-4 w-4" />
                                                    <span>Useful Links</span>
                                                </>
                                            )}
                                            {widget.type === 'canvas' && (
                                                <>
                                                    <Palette className="h-4 w-4" />
                                                    <span>Canvas</span>
                                                </>
                                            )}
                                            {widget.type === 'forms' && (
                                                <>
                                                    <ClipboardList className="h-4 w-4" />
                                                    <span>Forms</span>
                                                </>
                                            )}
                                            {widget.type === 'mindMap' && (
                                                <>
                                                    <Network className="h-4 w-4" />
                                                    <span>Mind Map</span>
                                                </>
                                            )}
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* Conditional Layout: Simple stacked on mobile, Draggable grid on desktop */}
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
                <div className="home-grid">
                    <ResponsiveGridLayout
                        key={JSON.stringify(layouts.lg?.map(l => l.i))} // Force re-render when widgets change
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
                                    {/* Drag Handle - appears on hover, positioned to not overlap */}
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

            <style jsx global>{`
                .home-grid .react-grid-item {
                    transition: all 200ms ease;
                }
                .home-grid .react-grid-item.react-grid-placeholder {
                    background: rgb(59 130 246 / 0.2);
                    border: 2px dashed rgb(59 130 246);
                    border-radius: 0.5rem;
                }
                .home-grid .react-resizable-handle {
                    background-image: none !important;
                    opacity: 1 !important;
                    z-index: 10;
                }
                .home-grid .react-resizable-handle::after {
                    content: "";
                    position: absolute;
                    right: 3px;
                    bottom: 3px;
                    width: 12px;
                    height: 12px;
                    border-right: 3px solid rgb(59 130 246);
                    border-bottom: 3px solid rgb(59 130 246);
                    border-radius: 0 0 4px 0;
                }
                .home-grid .react-grid-item:hover .react-resizable-handle::after {
                    border-right-color: rgb(37 99 235);
                    border-bottom-color: rgb(37 99 235);
                }
            `}</style>

            {/* Task Dialog */}
            <TaskDialog
                open={taskDialogOpen}
                onClose={() => setTaskDialogOpen(false)}
                onSubmit={async (data) => {
                    try {
                        const response = await fetch('/api/tasks', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(data),
                        })

                        if (response.ok) {
                            // Refresh tasks list
                            await fetchTasks()
                            setTaskDialogOpen(false)
                        } else {
                            const error = await response.json()
                            alert(`Error: ${error.error || 'Failed to create task'}`)
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
                onUpdate={fetchTasks}
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

            {/* Collaboration Dialog */}
            <CollaborationDialog
                open={collaborationDialogOpen}
                onOpenChange={setCollaborationDialogOpen}
                onSuccess={() => {
                    // Optionally navigate to collaborations page
                    router.push('/collaborate')
                }}
            />
        </div>
    )
}

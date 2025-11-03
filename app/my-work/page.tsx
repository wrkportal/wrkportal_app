'use client'

import { useState, useEffect } from "react"
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
    X
} from "lucide-react"
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { TaskDialog } from "@/components/dialogs/task-dialog"
import { TaskDetailDialog } from "@/components/dialogs/task-detail-dialog"
import { TimeTrackingDialog } from "@/components/dialogs/time-tracking-dialog"
import { TimerNotesDialog } from "@/components/dialogs/timer-notes-dialog"

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
]

const defaultLayouts: Layouts = {
    lg: [
        { i: 'metrics', x: 0, y: 0, w: 6, h: 2, minW: 6, minH: 2 },
        { i: 'recentProjects', x: 6, y: 0, w: 6, h: 11, minW: 4, minH: 3 },
        { i: 'quickActions', x: 0, y: 2, w: 6, h: 2, minW: 6, minH: 2 },
        { i: 'myTasks', x: 0, y: 4, w: 6, h: 7, minW: 6, minH: 3 },
        { i: 'activeOKRs', x: 0, y: 11, w: 12, h: 5, minW: 6, minH: 2 },
        { i: 'overdueTasks', x: 0, y: 16, w: 6, h: 3, minW: 4, minH: 2 },
    ],
    md: [
        { i: 'metrics', x: 0, y: 0, w: 10, h: 2, minW: 5, minH: 2 },
        { i: 'overdueTasks', x: 0, y: 2, w: 5, h: 3, minW: 4, minH: 2 },
        { i: 'recentProjects', x: 5, y: 2, w: 5, h: 3, minW: 4, minH: 3 },
        { i: 'myTasks', x: 0, y: 5, w: 10, h: 4, minW: 5, minH: 3 },
        { i: 'activeOKRs', x: 0, y: 9, w: 10, h: 3, minW: 5, minH: 2 },
        { i: 'quickActions', x: 0, y: 12, w: 10, h: 2, minW: 5, minH: 2 },
    ],
    sm: [
        { i: 'metrics', x: 0, y: 0, w: 6, h: 2, minW: 6, minH: 2 },
        { i: 'overdueTasks', x: 0, y: 2, w: 6, h: 3, minW: 6, minH: 2 },
        { i: 'recentProjects', x: 0, y: 5, w: 6, h: 3, minW: 6, minH: 3 },
        { i: 'myTasks', x: 0, y: 8, w: 6, h: 4, minW: 6, minH: 3 },
        { i: 'activeOKRs', x: 0, y: 12, w: 6, h: 3, minW: 6, minH: 2 },
        { i: 'quickActions', x: 0, y: 15, w: 6, h: 2, minW: 6, minH: 2 },
    ],
}

export default function HomePage() {
    const router = useRouter()
    const user = useAuthStore((state) => state.user)
    const setUser = useAuthStore((state) => state.setUser)
    const [isLoading, setIsLoading] = useState(true)
    const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
    const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
    const [taskDialogOpen, setTaskDialogOpen] = useState(false)
    const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
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

    // Load saved widgets and layouts from localStorage
    useEffect(() => {
        const savedWidgets = localStorage.getItem('home-widgets')
        const savedLayouts = localStorage.getItem('home-layouts')

        if (savedWidgets) {
            setWidgets(JSON.parse(savedWidgets))
        }
        if (savedLayouts) {
            setLayouts(JSON.parse(savedLayouts))
        }
    }, [])

    const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
        setLayouts(allLayouts)
        localStorage.setItem('home-layouts', JSON.stringify(allLayouts))
    }

    const toggleWidget = (widgetId: string) => {
        const updatedWidgets = widgets.map(w =>
            w.id === widgetId ? { ...w, visible: !w.visible } : w
        )
        setWidgets(updatedWidgets)
        localStorage.setItem('home-widgets', JSON.stringify(updatedWidgets))
    }

    const resetLayout = () => {
        setWidgets(defaultWidgets)
        setLayouts(defaultLayouts)
        localStorage.removeItem('home-widgets')
        localStorage.removeItem('home-layouts')
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

    const renderWidget = (widget: Widget) => {
        switch (widget.type) {
            case 'metrics':
                return (
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Overview</CardTitle>
                            <CardDescription className="text-xs">Your workspace at a glance</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
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
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">Recent Projects</CardTitle>
                                    <CardDescription className="text-xs truncate">Your latest projects</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/projects/new')}
                                    className="shrink-0"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">New</span>
                                    <Plus className="h-4 w-4 sm:hidden" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
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
                    <Card className="h-full flex flex-col border-l-4 border-l-red-500">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base text-red-600 dark:text-red-400">
                                        Overdue Tasks
                                    </CardTitle>
                                    <CardDescription className="text-xs">Tasks past their due date</CardDescription>
                                </div>
                                <Badge variant="destructive" className="text-lg font-bold">
                                    {overdueTasks.length}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
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
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">My Tasks</CardTitle>
                                    <CardDescription className="text-xs truncate">Tasks assigned to you</CardDescription>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
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
                        <CardContent className="flex-1 overflow-auto">
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
                        </CardContent>
                    </Card>
                )

            case 'activeOKRs':
                return (
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <CardTitle className="text-base truncate">Active OKRs</CardTitle>
                                    <CardDescription className="text-xs truncate">Your objectives and key results</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => router.push('/okrs')}
                                    className="shrink-0"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    <span className="hidden sm:inline">New</span>
                                    <Plus className="h-4 w-4 sm:hidden" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
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
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Quick Actions</CardTitle>
                            <CardDescription className="text-xs">Fast access to common tasks</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                <Button variant="outline" className="h-auto flex-col gap-1 sm:gap-1.5 py-2 sm:py-3 transition-all min-w-0" onClick={() => router.push('/projects/new')}>
                                    <Plus className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                    <span className="text-[10px] sm:text-xs font-medium truncate w-full">New Project</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1 sm:gap-1.5 py-2 sm:py-3 transition-all min-w-0" onClick={() => setTaskDialogOpen(true)}>
                                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                    <span className="text-[10px] sm:text-xs font-medium truncate w-full">New Task</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1 sm:gap-1.5 py-2 sm:py-3 transition-all min-w-0" onClick={() => router.push('/reports')}>
                                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                    <span className="text-[10px] sm:text-xs font-medium truncate w-full">View Reports</span>
                                </Button>
                                <Button variant="outline" className="h-auto flex-col gap-1 sm:gap-1.5 py-2 sm:py-3 transition-all min-w-0" onClick={() => router.push('/okrs')}>
                                    <Target className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                                    <span className="text-[10px] sm:text-xs font-medium truncate w-full">Goals & OKRs</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {greeting}, {user?.firstName || 'there'}!
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Welcome back to your workspace
                    </p>
                </div>

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
                        {widgets.map((widget) => (
                            <DropdownMenuCheckboxItem
                                key={widget.id}
                                checked={widget.visible}
                                onCheckedChange={() => toggleWidget(widget.id)}
                            >
                                {widget.type === 'metrics' && 'Overview'}
                                {widget.type === 'overdueTasks' && 'Overdue Tasks'}
                                {widget.type === 'recentProjects' && 'Recent Projects'}
                                {widget.type === 'myTasks' && 'My Tasks'}
                                {widget.type === 'activeOKRs' && 'Active OKRs'}
                                {widget.type === 'quickActions' && 'Quick Actions'}
                            </DropdownMenuCheckboxItem>
                        ))}
                        {!isMobile && (
                            <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={resetLayout}>
                                    <LayoutDashboard className="h-4 w-4 mr-2" />
                                    Reset Layout
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                    background: rgb(168 85 247 / 0.2);
                    border: 2px dashed rgb(168 85 247);
                    border-radius: 0.5rem;
                }
                .home-grid .react-resizable-handle {
                    background-image: none !important;
                }
                .home-grid .react-resizable-handle::after {
                    content: "";
                    position: absolute;
                    right: 3px;
                    bottom: 3px;
                    width: 8px;
                    height: 8px;
                    border-right: 2px solid rgb(168 85 247);
                    border-bottom: 2px solid rgb(168 85 247);
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
        </div>
    )
}

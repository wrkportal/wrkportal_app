'use client'

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { UserRole } from "@/types"
import { useWorkflowTerminology } from "@/hooks/useWorkflowTerminology"
import {
    LayoutDashboard,
    FolderKanban,
    Target,
    Users,
    Clock,
    CheckSquare,
    AlertTriangle,
    BarChart3,
    DollarSign,
    Settings,
    Shield,
    FileText,
    Calendar,
    Briefcase,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Trash2,
    Home,
    Sparkles,
    Bot,
    Brain,
    Map,
    GraduationCap,
    MessageSquare,
    Database,
    Beaker,
    LayoutGrid,
    FileStack,
    Code,
    Package,
    TrendingDown,
    Server,
    UserPlus,
    Network,
    CalendarDays,
    Plug,
    FileSpreadsheet,
    MessageCircle,
    X,
    Upload,
    ClipboardList,
    FileUp,
    Download,
    Phone,
} from "lucide-react"
import { useUIStore } from "@/stores/uiStore"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { StartCallButton } from "@/components/calls"

interface NavItem {
    title: string
    href: string
    icon: any
    roles: UserRole[]
    children?: NavItem[]
}

const navigationItems: NavItem[] = [
    {
        title: "wrkboard",
        href: "/wrkboard",
        icon: Home,
        roles: Object.values(UserRole),
    },
    {
        title: "Finance",
        href: "/finance-dashboard",
        icon: LayoutDashboard,
        roles: [
            UserRole.FINANCE_CONTROLLER,
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.EXECUTIVE,
            UserRole.PMO_LEAD,
        ],
    },
    {
        title: "Sales",
        href: "/sales-dashboard",
        icon: Target,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.PROJECT_MANAGER,
        ],
    },
    {
        title: "Operations",
        href: "/operations-dashboard",
        icon: Settings,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.PMO_LEAD,
            UserRole.PROJECT_MANAGER,
        ],
    },
    {
        title: "Developer",
        href: "/developer-dashboard",
        icon: Code,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.INTEGRATION_ADMIN,
        ],
    },
    {
        title: "IT Services",
        href: "/it-dashboard",
        icon: Server,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.INTEGRATION_ADMIN,
        ],
    },
    {
        title: "Customer Service",
        href: "/customer-service-dashboard",
        icon: Phone,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
        ],
    },
    {
        title: "Projects",
        href: "/product-management",
        icon: FolderKanban,
        roles: [
            UserRole.PMO_LEAD,
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.PROJECT_MANAGER,
        ],
    },
    {
        title: "Recruitment",
        href: "/recruitment-dashboard",
        icon: UserPlus,
        roles: [
            UserRole.ORG_ADMIN,
            UserRole.TENANT_SUPER_ADMIN,
            UserRole.RESOURCE_MANAGER,
        ],
    },
]


const collaborateNavItem: NavItem = {
    title: "Collaborate",
    href: "/collaborate",
    icon: MessageSquare,
    roles: Object.values(UserRole),
}


// Admin navigation moved to Settings page - see app/settings/page.tsx

const platformAdminNavItem: NavItem = {
    title: "Platform Admin",
    href: "/platform-admin",
    icon: Shield,
    roles: [UserRole.PLATFORM_OWNER],
}

// Calendar Schedule Widget Component
function CalendarScheduleWidget() {
    const user = useAuthStore((state) => state.user)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [currentMonth, setCurrentMonth] = useState(() => {
        const date = new Date()
        return new Date(date.getFullYear(), date.getMonth(), 1)
    })
    const [tasks, setTasks] = useState<any[]>([])
    const [loadingTasks, setLoadingTasks] = useState(false)
    const [tasksSidebarOpen, setTasksSidebarOpen] = useState(false)
    const calendarRef = useRef<HTMLDivElement>(null)
    const [calendarHeight, setCalendarHeight] = useState<number>(0)
    const [selectedTask, setSelectedTask] = useState<any>(null)
    const [agendaDialogOpen, setAgendaDialogOpen] = useState(false)
    const [chatDialogOpen, setChatDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [taskComments, setTaskComments] = useState<any[]>([])
    const [newComment, setNewComment] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [taskFiles, setTaskFiles] = useState<any[]>([])
    const [loadingFiles, setLoadingFiles] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()

    // Fetch tasks and calls for the selected date
    useEffect(() => {
        const fetchTasksForDate = async () => {
            if (!user?.id) {
                setTasks([])
                return
            }

            try {
                setLoadingTasks(true)
                
                // Fetch tasks and calls in parallel
                const [tasksResponse, callsResponse] = await Promise.all([
                    fetch('/api/tasks?includeCreated=true'),
                    fetch('/api/calls')
                ])
                
                const allItems: any[] = []
                
                // Process tasks
                if (tasksResponse.ok) {
                    const data = await tasksResponse.json()
                    const allTasks = data.tasks || []
                    
                    // Filter tasks by selected date and convert to unified format
                    const selectedDateStart = new Date(selectedDate)
                    selectedDateStart.setHours(0, 0, 0, 0)
                    const selectedDateEnd = new Date(selectedDate)
                    selectedDateEnd.setHours(23, 59, 59, 999)
                    
                    allTasks.forEach((task: any) => {
                        if (task.dueDate) {
                            const taskDate = new Date(task.dueDate)
                            if (taskDate >= selectedDateStart && taskDate <= selectedDateEnd) {
                                allItems.push({
                                    ...task,
                                    type: 'task',
                                    displayDate: task.dueDate,
                                })
                            }
                        }
                    })
                }
                
                // Process calls (scheduled meetings)
                if (callsResponse.ok) {
                    const data = await callsResponse.json()
                    const allCalls = data.calls || []
                    
                    // Filter calls by selected date and convert to unified format
                    const selectedDateStart = new Date(selectedDate)
                    selectedDateStart.setHours(0, 0, 0, 0)
                    const selectedDateEnd = new Date(selectedDate)
                    selectedDateEnd.setHours(23, 59, 59, 999)
                    
                    allCalls.forEach((call: any) => {
                        if (call.scheduledAt) {
                            const callDate = new Date(call.scheduledAt)
                            if (callDate >= selectedDateStart && callDate <= selectedDateEnd) {
                                allItems.push({
                                    id: call.id,
                                    title: call.title || 'Untitled Meeting',
                                    description: call.description,
                                    dueDate: call.scheduledAt, // Use scheduledAt as dueDate for display
                                    displayDate: call.scheduledAt,
                                    createdBy: call.createdBy,
                                    type: 'call',
                                    call: call, // Keep original call data
                                    estimatedHours: null, // Calls don't have estimated hours
                                })
                            }
                        }
                    })
                }
                
                // Sort by displayDate/time
                allItems.sort((a: any, b: any) => {
                    const dateA = new Date(a.displayDate).getTime()
                    const dateB = new Date(b.displayDate).getTime()
                    return dateA - dateB
                })
                
                setTasks(allItems)
            } catch (error) {
                console.error('Error fetching tasks and calls:', error)
                setTasks([])
            } finally {
                setLoadingTasks(false)
            }
        }

        fetchTasksForDate()
    }, [selectedDate, user?.id])

    // Update calendar height when it changes
    useEffect(() => {
        const updateHeight = () => {
            if (calendarRef.current) {
                setCalendarHeight(calendarRef.current.offsetHeight)
            }
        }
        updateHeight()
        window.addEventListener('resize', updateHeight)
        return () => window.removeEventListener('resize', updateHeight)
    }, [currentMonth, selectedDate])

    // Open tasks sidebar when date is selected
    const handleDateSelect = (date: Date) => {
        setSelectedDate(date)
        setTasksSidebarOpen(true)
    }

    // Handle Agenda icon click
    const handleAgendaClick = async (task: any) => {
        setSelectedTask(task)
        setAgendaDialogOpen(true)
        // Only fetch files for tasks, not calls
        if (task.type !== 'call') {
            await fetchFiles(task.id)
        } else {
            setTaskFiles([])
        }
    }

    // Fetch files for a task
    const fetchFiles = async (taskId: string) => {
        try {
            setLoadingFiles(true)
            const response = await fetch(`/api/tasks/${taskId}/files`)
            if (response.ok) {
                const data = await response.json()
                setTaskFiles(data.files || [])
            }
        } catch (error) {
            console.error('Error fetching files:', error)
            setTaskFiles([])
        } finally {
            setLoadingFiles(false)
        }
    }

    // Handle Chat icon click
    const handleChatClick = async (task: any) => {
        setSelectedTask(task)
        setChatDialogOpen(true)
        await fetchComments(task.id)
    }

    // Fetch comments for a task
    const fetchComments = async (taskId: string) => {
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`)
            if (response.ok) {
                const data = await response.json()
                setTaskComments(data.comments || [])
            }
        } catch (error) {
            console.error('Error fetching comments:', error)
        }
    }

    // Add comment
    const handleAddComment = async () => {
        if (!selectedTask || !newComment.trim()) return

        try {
            setIsAddingComment(true)
            const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim() }),
            })

            if (response.ok) {
                setNewComment('')
                await fetchComments(selectedTask.id)
                // Comment added successfully - no toast notification needed
            } else {
                throw new Error('Failed to add comment')
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add comment. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsAddingComment(false)
        }
    }

    // Handle Upload icon click
    const handleUploadClick = (task: any) => {
        setSelectedTask(task)
        fileInputRef.current?.click()
    }

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !selectedTask) return

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/tasks/${selectedTask.id}/files`, {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                // File uploaded successfully - refresh files list if agenda dialog is open
                if (agendaDialogOpen && selectedTask) {
                    await fetchFiles(selectedTask.id)
                }
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to upload file')
            }

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload file. Please try again.",
                variant: "destructive",
            })
        }
    }

    // Handle Delete icon click
    const handleDeleteClick = (task: any) => {
        setSelectedTask(task)
        setDeleteDialogOpen(true)
    }

    // Refresh tasks and calls list
    const refreshTasks = async () => {
        if (!user?.id) {
            setTasks([])
            return
        }

        try {
            setLoadingTasks(true)
            
            // Fetch tasks and calls in parallel
            const [tasksResponse, callsResponse] = await Promise.all([
                fetch('/api/tasks?includeCreated=true'),
                fetch('/api/calls')
            ])
            
            const allItems: any[] = []
            
            // Process tasks
            if (tasksResponse.ok) {
                const data = await tasksResponse.json()
                const allTasks = data.tasks || []
                
                const selectedDateStart = new Date(selectedDate)
                selectedDateStart.setHours(0, 0, 0, 0)
                const selectedDateEnd = new Date(selectedDate)
                selectedDateEnd.setHours(23, 59, 59, 999)
                
                allTasks.forEach((task: any) => {
                    if (task.dueDate) {
                        const taskDate = new Date(task.dueDate)
                        if (taskDate >= selectedDateStart && taskDate <= selectedDateEnd) {
                            allItems.push({
                                ...task,
                                type: 'task',
                                displayDate: task.dueDate,
                            })
                        }
                    }
                })
            }
            
            // Process calls
            if (callsResponse.ok) {
                const data = await callsResponse.json()
                const allCalls = data.calls || []
                
                const selectedDateStart = new Date(selectedDate)
                selectedDateStart.setHours(0, 0, 0, 0)
                const selectedDateEnd = new Date(selectedDate)
                selectedDateEnd.setHours(23, 59, 59, 999)
                
                allCalls.forEach((call: any) => {
                    if (call.scheduledAt) {
                        const callDate = new Date(call.scheduledAt)
                        if (callDate >= selectedDateStart && callDate <= selectedDateEnd) {
                            allItems.push({
                                id: call.id,
                                title: call.title || 'Untitled Meeting',
                                description: call.description,
                                dueDate: call.scheduledAt,
                                displayDate: call.scheduledAt,
                                createdBy: call.createdBy,
                                type: 'call',
                                call: call,
                                estimatedHours: null,
                            })
                        }
                    }
                })
            }
            
            // Sort by displayDate/time
            allItems.sort((a: any, b: any) => {
                const dateA = new Date(a.displayDate).getTime()
                const dateB = new Date(b.displayDate).getTime()
                return dateA - dateB
            })
            
            setTasks(allItems)
        } catch (error) {
            console.error('Error fetching tasks and calls:', error)
        } finally {
            setLoadingTasks(false)
        }
    }

    // Confirm delete
    const handleConfirmDelete = async () => {
        if (!selectedTask) return

        try {
            setIsDeleting(true)
            
            // Determine if this is a call or task
            const isCall = selectedTask.type === 'call'
            const apiEndpoint = isCall 
                ? `/api/calls/${selectedTask.id}`
                : `/api/tasks/${selectedTask.id}`
            
            const response = await fetch(apiEndpoint, {
                method: 'DELETE',
            })

            if (response.ok) {
                toast({
                    title: "Meeting deleted",
                    description: "The meeting has been deleted successfully.",
                })
                setDeleteDialogOpen(false)
                setSelectedTask(null)
                await refreshTasks()
            } else {
                throw new Error('Failed to delete')
            }
        } catch (error) {
            toast({
                title: "Delete failed",
                description: "Failed to delete meeting. Please try again.",
                variant: "destructive",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE':
            case 'COMPLETE':
                return 'text-green-600'
            case 'IN_PROGRESS':
            case 'IN PROGRESS':
                return 'text-blue-600'
            case 'OVERDUE':
            case 'PRO IS LATE':
                return 'text-red-600'
            case 'TODO':
            case 'SCHEDULED':
                return 'text-gray-600'
            default:
                return 'text-gray-600'
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const hours = date.getHours()
        const minutes = date.getMinutes()
        const ampm = hours >= 12 ? 'pm' : 'am'
        const displayHours = hours % 12 || 12
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`
    }

    const formatDuration = (estimatedHours: number | null | undefined) => {
        if (!estimatedHours) return ''
        if (estimatedHours < 1) {
            const minutes = Math.round(estimatedHours * 60)
            return `${minutes} min`
        }
        if (estimatedHours === 1) return '1 hr'
        return `${estimatedHours} hrs`
    }

    const formatAssigneeName = (assignee: any) => {
        if (!assignee) return 'Unassigned'
        if (assignee.name) return assignee.name
        if (assignee.firstName || assignee.lastName) {
            return `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim()
        }
        return 'Unassigned'
    }

    const formatCreatorName = (createdBy: any) => {
        if (!createdBy) return 'Unknown'
        if (createdBy.name) return createdBy.name
        if (createdBy.firstName || createdBy.lastName) {
            return `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim()
        }
        return 'Unknown'
    }

    const getMonthDates = () => {
        const year = currentMonth.getFullYear()
        const month = currentMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()
        const startingDayOfWeek = firstDay.getDay()

        const dates: (Date | null)[] = []
        
        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            dates.push(null)
        }
        
        // Add all days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(year, month, day))
        }
        
        // Fill remaining cells to always have 6 rows (42 cells = 6 rows × 7 days)
        const totalCells = 42
        const currentCells = dates.length
        for (let i = currentCells; i < totalCells; i++) {
            dates.push(null)
        }
        
        return dates
    }

    const monthDates = getMonthDates()
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const selectedDateString = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    return (
        <div className="relative px-1 space-y-3" ref={calendarRef}>
            {/* Date Picker Header */}
            <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                    <button
                        onClick={() => {
                            const newDate = new Date(currentMonth)
                            newDate.setMonth(newDate.getMonth() - 1)
                            setCurrentMonth(newDate)
                        }}
                        className="p-1 hover:bg-accent rounded"
                    >
                        <ChevronLeft className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-semibold">{monthName}</span>
                    <button
                        onClick={() => {
                            const newDate = new Date(currentMonth)
                            newDate.setMonth(newDate.getMonth() + 1)
                            setCurrentMonth(newDate)
                        }}
                        className="p-1 hover:bg-accent rounded"
                    >
                        <ChevronRight className="h-3 w-3" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 text-[10px]">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                        <div key={idx} className="text-center text-muted-foreground font-medium py-1">
                            {day}
                        </div>
                    ))}
                    {monthDates.map((date, idx) => {
                        if (!date) {
                            return <div key={`empty-${idx}`} className="h-7" />
                        }
                        const isSelected = date.toDateString() === selectedDate.toDateString()
                        const isToday = date.toDateString() === new Date().toDateString()
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => handleDateSelect(date)}
                                className={cn(
                                    "h-7 rounded text-[10px] flex items-center justify-center transition-colors",
                                    isSelected && "bg-primary text-primary-foreground",
                                    !isSelected && isToday && "border border-primary",
                                    !isSelected && !isToday && "hover:bg-accent"
                                )}
                            >
                                {date.getDate()}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tasks Sidebar - slides out smoothly */}
            <aside
                className={cn(
                    "absolute right-0 top-0 w-[380px] bg-card border border-border rounded-lg shadow-xl transition-all duration-500 ease-in-out z-50 overflow-hidden",
                    tasksSidebarOpen 
                        ? "translate-x-full opacity-100 pointer-events-auto" 
                        : "translate-x-0 opacity-0 pointer-events-none"
                )}
                style={{ 
                    height: calendarHeight > 0 ? `${calendarHeight}px` : 'auto',
                    transform: tasksSidebarOpen ? 'translateX(calc(100% + 0.5rem))' : 'translateX(0)'
                }}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-3 border-b">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold truncate">Meetings for {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h3>
                            <p className="text-xs text-muted-foreground">
                                {tasks.length} {tasks.length === 1 ? 'meeting' : 'meetings'}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTasksSidebarOpen(false)}
                            className="h-7 w-7 flex-shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Tasks List */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {loadingTasks ? (
                            <div className="text-center text-xs text-muted-foreground py-4">
                                Loading...
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="text-center text-xs text-muted-foreground py-4">
                                No meetings
                            </div>
                        ) : (
                            tasks.map((task) => {
                                const taskTime = task.dueDate ? formatTime(task.dueDate) : ''
                                const duration = formatDuration(task.estimatedHours)
                                const creatorName = formatCreatorName((task as any).createdBy || task.assignee)
                                
                                return (
                                    <div
                                        key={task.id}
                                        className="p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors space-y-2"
                                    >
                                        {/* Meeting Name */}
                                        <div className="text-sm font-semibold text-foreground">
                                            {task.title}
                                        </div>
                                        
                                        {/* Time and Duration */}
                                        <div className="flex items-center gap-2 text-xs">
                                            {taskTime && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">{taskTime}</span>
                                                </div>
                                            )}
                                            {duration && (
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <span>({duration})</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Set up by */}
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <span>Set up by:</span>
                                            <span className="font-medium">{creatorName}</span>
                                        </div>
                                        
                                        {/* Action Icons */}
                                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                title="Agenda"
                                                onClick={() => handleAgendaClick(task)}
                                            >
                                                <ClipboardList className="h-3.5 w-3.5" />
                                            </Button>
                                            {/* Only show Chat and Upload for tasks, not calls */}
                                            {task.type !== 'call' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        title="Chat"
                                                        onClick={() => handleChatClick(task)}
                                                    >
                                                        <MessageCircle className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        title="Upload Documents"
                                                        onClick={() => handleUploadClick(task)}
                                                    >
                                                        <Upload className="h-3.5 w-3.5" />
                                                    </Button>
                                                </>
                                            )}
                                            {/* Show Start Call button - use call participants if it's a call */}
                                            {task.type === 'call' && task.call?.participants ? (
                                                <StartCallButton
                                                    participantIds={task.call.participants
                                                        .filter((p: any) => p.userId !== user?.id)
                                                        .map((p: any) => p.userId)}
                                                    title={task.title}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                />
                                            ) : (
                                                <StartCallButton
                                                    participantIds={task.assigneeId ? [task.assigneeId] : []}
                                                    title={task.title}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                />
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                title="Delete"
                                                onClick={() => handleDeleteClick(task)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </aside>

            {/* Hidden file input for uploads */}
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                multiple={false}
            />

            {/* Agenda Dialog */}
            <Dialog open={agendaDialogOpen} onOpenChange={setAgendaDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Meeting Agenda</DialogTitle>
                        <DialogDescription>
                            {selectedTask?.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 py-4">
                        {/* Agenda Description */}
                        <div>
                            <label className="text-sm font-semibold mb-2 block">Agenda</label>
                            <Textarea
                                value={selectedTask?.description || ''}
                                readOnly
                                className="min-h-[150px]"
                                placeholder="No agenda available for this meeting."
                            />
                        </div>

                        {/* Uploaded Files Section */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold">Uploaded Documents</label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUploadClick(selectedTask)}
                                    className="h-7 text-xs"
                                >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Upload
                                </Button>
                            </div>
                            {loadingFiles ? (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    Loading files...
                                </div>
                            ) : taskFiles.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-4 border border-dashed rounded-lg">
                                    No files uploaded yet
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {taskFiles.map((file: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium truncate">
                                                        {file.fileName || 'Unknown file'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {(file.fileSize / 1024).toFixed(1)} KB
                                                        {file.uploadedAt && (
                                                            <> • {new Date(file.uploadedAt).toLocaleDateString()}</>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 flex-shrink-0"
                                                onClick={() => window.open(file.fileUrl, '_blank')}
                                                title="Download file"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Chat/Comments Dialog */}
            <Dialog open={chatDialogOpen} onOpenChange={setChatDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Chat - {selectedTask?.title}</DialogTitle>
                        <DialogDescription>
                            Discussion for this meeting
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto space-y-4 py-4">
                        {taskComments.length === 0 ? (
                            <div className="text-center text-sm text-muted-foreground py-8">
                                No comments yet. Start the conversation!
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {taskComments.map((comment: any) => (
                                    <div key={comment.id} className="border rounded-lg p-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-semibold">
                                                {comment.user?.name || `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim() || 'Unknown'}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(comment.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="border-t pt-4 space-y-2">
                        <Textarea
                            placeholder="Type your message..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    handleAddComment()
                                }
                            }}
                        />
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                                Press Ctrl+Enter to send
                            </span>
                            <Button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || isAddingComment}
                            >
                                {isAddingComment ? 'Sending...' : 'Send'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Meeting?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedTask?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export function Sidebar() {
    const pathname = usePathname()
    const user = useAuthStore((state) => state.user)
    const sidebarOpen = useUIStore((state) => state.sidebarOpen)
    const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
    const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
    const toggleSidebarCollapse = useUIStore((state) => state.toggleSidebarCollapse)
    const { getTerm } = useWorkflowTerminology()
    const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})
    const [expandedOtherProjects, setExpandedOtherProjects] = useState(false)
    const [expandedCommunication, setExpandedCommunication] = useState(false)
    const [expandedPlanetAI, setExpandedPlanetAI] = useState(false)
    const [expandedProgramsProjects, setExpandedProgramsProjects] = useState(false)
    const [expandedProgramsSection, setExpandedProgramsSection] = useState(false)
    const [expandedProjectsSection, setExpandedProjectsSection] = useState(false)
    const [programs, setPrograms] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [isMounted, setIsMounted] = useState(false)

    // Hydration check
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch programs and projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsRes, projectsRes] = await Promise.all([
                    fetch('/api/programs'),
                    fetch('/api/projects')
                ])

                if (programsRes.ok) {
                    const data = await programsRes.json()
                    setPrograms(data.programs || [])
                }

                if (projectsRes.ok) {
                    const data = await projectsRes.json()
                    setProjects(data.projects || [])
                }
            } catch (error) {
                console.error('Error fetching programs/projects:', error)
            }
        }

        if (user && isMounted) {
            fetchData()
        }
    }, [user, isMounted])

    // Ensure sidebar is open when user is logged in
    useEffect(() => {
        if (user && !sidebarOpen) {
            setSidebarOpen(true)
        }
    }, [user, sidebarOpen, setSidebarOpen])

    // Always render sidebar if user exists
    // Only hide if user is explicitly null (not authenticated)
    // Allow rendering if user is undefined (still loading) to prevent layout shift
    if (user === null) {
        // User is not authenticated, don't render sidebar
        return null
    }
    
    // If user is undefined (still loading), show sidebar with loading state
    // This ensures sidebar appears as soon as user loads
    if (!user) {
        // Return minimal sidebar structure while loading
        return (
            <aside 
                className={cn(
                    "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-card/95 backdrop-blur-xl transition-all duration-300 shadow-sm",
                    "md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    sidebarCollapsed ? "w-14" : "w-56"
                )}
            >
                <div className="flex h-full flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </aside>
        )
    }
    
    // Use opacity transition for smooth appearance - ensure full opacity when mounted
    const sidebarStyle = !isMounted ? { opacity: 0 } : { opacity: 1, transition: 'opacity 0.2s ease-in' }

    // Be robust if user.role isn't hydrated yet or not properly set
    const effectiveRole = (user.role && Object.values(UserRole).includes(user.role as UserRole))
        ? (user.role as UserRole)
        : UserRole.TEAM_MEMBER

    // Special case: sandeep200680@gmail.com sees all pages
    const isSuperUser = user?.email === 'sandeep200680@gmail.com' || user?.email?.includes('sandeep200680@gmail')

    // Parse allowed sections from user (stored as JSON string or null)
    // For invited users, check UserTenantAccess record instead of User.allowedSections
    const [allowedSections, setAllowedSections] = useState<string[] | null>(null)
    const [isInvitedUser, setIsInvitedUser] = useState(false)
    
    useEffect(() => {
        if (!user) return
        
        // Fetch allowedSections from UserTenantAccess (for invited users)
        const fetchAllowedSections = async () => {
            try {
                const response = await fetch('/api/user/tenants')
                if (response.ok) {
                    const data = await response.json()
                    // Check if current tenant has UserTenantAccess record with invitationId
                    if (data.activeTenantAccess && data.activeTenantAccess.invitationId) {
                        setIsInvitedUser(true)
                        if (data.activeTenantAccess.allowedSections) {
                            try {
                                const parsed = typeof data.activeTenantAccess.allowedSections === 'string'
                                    ? JSON.parse(data.activeTenantAccess.allowedSections)
                                    : data.activeTenantAccess.allowedSections
                                
                                // Handle both formats: array of strings or object with sections array
                                if (Array.isArray(parsed)) {
                                    setAllowedSections(parsed)
                                } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
                                    setAllowedSections(parsed.sections)
                                } else {
                                    setAllowedSections([]) // Invited user with invalid format = no access
                                }
                            } catch (e) {
                                console.warn('Failed to parse allowedSections from UserTenantAccess:', e)
                                setAllowedSections([]) // Invited user with invalid allowedSections = no access
                            }
                        } else {
                            // Invited user but no allowedSections specified = no access
                            setAllowedSections([])
                        }
                        return // Don't fall through to User.allowedSections
                    }
                }
            } catch (e) {
                console.warn('Failed to fetch UserTenantAccess:', e)
            }
            
            // Fallback to User.allowedSections if not found in UserTenantAccess
            if ((user as any).allowedSections) {
                try {
                    const parsed = typeof (user as any).allowedSections === 'string' 
                        ? JSON.parse((user as any).allowedSections) 
                        : (user as any).allowedSections
                    
                    // Handle both formats: array of strings or object with sections array
                    if (Array.isArray(parsed)) {
                        setAllowedSections(parsed)
                    } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.sections)) {
                        setAllowedSections(parsed.sections)
                    } else {
                        setAllowedSections(null) // Not an invited user, full access
                    }
                } catch (e) {
                    setAllowedSections(null) // Not an invited user, full access
                }
            } else {
                setAllowedSections(null) // Not an invited user, full access
            }
        }
        
        fetchAllowedSections()
    }, [user])

    // Map section titles to hrefs for permission checking
    const sectionMap: Record<string, string> = {
        'Finance': '/finance-dashboard',
        'Sales': '/sales-dashboard',
        'Operations': '/operations-dashboard',
        'Developer': '/developer-dashboard',
        'IT Services': '/it-dashboard',
        'Customer Service': '/customer-service-dashboard',
        'Projects': '/product-management',
        'Recruitment': '/recruitment-dashboard',
    }

    const filteredItems = navigationItems.filter((item) => {
        // Super user sees everything
        if (isSuperUser) return true
        
        // If user was invited (has invitationId), they must have allowedSections set
        // If allowedSections is null for invited user, treat as empty (no access)
        if (isInvitedUser && allowedSections === null) {
            allowedSections = [] // Treat as no access
        }
        
        // If allowedSections is null, user has full access (first-time signup or self-joined user)
        // Show all sections regardless of role
        if (allowedSections === null) {
            return true
        }
        
        // If user has allowedSections set (not null), check if this section is allowed
        // If allowedSections is empty array, user has no access
        if (allowedSections.length === 0) {
            // Only show wrkboard and collaborate
            return item.title === 'wrkboard' || item.title === 'Collaborate'
        }
        
        // Check if this section is in the allowed list
        // Handle both formats: "Finance" and "Finance:Dashboard"
        const isAllowed = allowedSections.some((section: string) => {
          // Direct match (e.g., "Finance" === "Finance")
          if (section === item.title) return true
          // Format match (e.g., "Finance:Dashboard" starts with "Finance:")
          if (section.includes(':') && section.split(':')[0] === item.title) return true
          return false
        })
        return isAllowed || item.title === 'wrkboard' || item.title === 'Collaborate'
    })

    // Toggle program expansion
    const toggleProgram = (programId: string) => {
        setExpandedPrograms(prev => ({
            ...prev,
            [programId]: !prev[programId]
        }))
    }

    // Get projects for a program
    const getProjectsForProgram = (programId: string) => {
        return projects.filter(project => project.programId === programId)
    }

    // Get projects without a program
    const standaloneProjects = projects.filter(p => !p.programId)

    // Close sidebar on mobile when clicking a link
    const handleLinkClick = () => {
        if (window.innerWidth < 768) { // md breakpoint
            setSidebarOpen(false)
        }
    }

    return (
        <>
            {/* Mobile overlay backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => useUIStore.getState().setSidebarOpen(false)}
                    aria-label="Close sidebar"
                />
            )}

            {/* Sidebar */}
            <aside 
                className={cn(
                    "fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] border-r bg-card backdrop-blur-xl transition-all duration-300 shadow-sm",
                    // Mobile: slide in from left, Desktop: always visible
                    "md:translate-x-0",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full",
                    sidebarCollapsed ? "w-14" : "w-56",
                    // Ensure sidebar is always visible when mounted and user exists
                    isMounted ? "opacity-100" : "opacity-0"
                )}
                style={sidebarStyle}
            >
                <div className="flex h-full flex-col px-2 py-4">
                    {/* Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarCollapse}
                        className="mb-3 ml-auto h-7 w-7 hover:bg-accent/50/50"
                        title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5" />
                        ) : (
                            <ChevronLeft className="h-3.5 w-3.5" />
                        )}
                    </Button>

                    {/* Main navigation - scrollable */}
                    <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
                        {filteredItems.map((item, index) => {
                            const Icon = item.icon
                            // Determine if nav item is active
                            let isActive = false
                            if (item.href === "/finance-dashboard") {
                                // Finance should be active on /finance-dashboard and all its sub-pages, plus /workflows/finance/ pages
                                isActive = pathname === "/finance-dashboard" || 
                                          pathname.startsWith("/finance-dashboard/") ||
                                          pathname.startsWith("/workflows/finance/")
                            } else if (item.href === "/product-management") {
                                // Projects should be active on /product-management and all its sub-pages
                                const productManagementSubPages = ["/roadmap", "/projects", "/releases", "/sprints", "/backlog", "/dependencies", "/teams"]
                                isActive = pathname === "/product-management" || 
                                          pathname.startsWith("/product-management/") ||
                                          productManagementSubPages.some(subPage => 
                                              pathname === subPage || pathname.startsWith(subPage + "/")
                                          )
                            } else {
                                // For all other sections, check if pathname matches or starts with the href
                                isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                            }

                            // Handle Programs & Projects with children - REMOVED
                            if (false && item.children && item.title === "Programs & Projects" && !sidebarCollapsed) {
                                const displayTitle = `Programs & ${getTerm('projects')}`
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all cursor-pointer rounded-md -mx-1",
                                                pathname.includes(item.href) || pathname.includes("/roadmap") || pathname.includes("/programs/") || pathname.includes("/projects/")
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50/70"
                                            )}
                                            onClick={() => setExpandedProgramsProjects(!expandedProgramsProjects)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-3.5 w-3.5" />
                                                <span>{displayTitle}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedProgramsProjects && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Programs & Projects children */}
                                        {expandedProgramsProjects && (
                                            <div className="space-y-1">
                                                {/* Static children - render Programs first, then Projects, then Roadmap */}
                                                {item.children
                                                    ?.filter((child) => isSuperUser || child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        // Special handling for Programs - make it expandable
                                                        if (child.title === "Programs") {
                                                            return (
                                                                <div key={child.href}>
                                                                    <div
                                                                        className={cn(
                                                                            "flex items-center justify-between py-1.5 px-3 text-xs font-medium transition-all cursor-pointer rounded-md ml-2",
                                                                            isChildActive
                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50/50"
                                                                        )}
                                                                        onClick={() => setExpandedProgramsSection(!expandedProgramsSection)}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <ChildIcon className="h-3.5 w-3.5" />
                                                                            {child.title}
                                                                        </div>
                                                                        <ChevronDown
                                                                            className={cn(
                                                                                "h-3 w-3 transition-transform flex-shrink-0",
                                                                                expandedProgramsSection && "rotate-180"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    {/* Programs dropdown */}
                                                                    {expandedProgramsSection && programs.length > 0 && (
                                                                        <div className="space-y-1 ml-4">
                                                                            {programs.map((program) => {
                                                                                const isProgramActive = pathname.includes(`/programs/${program.id}`)
                                                                                return (
                                                                                    <Link
                                                                                        key={program.id}
                                                                                        href={`/programs/${program.id}`}
                                                                                        onClick={handleLinkClick}
                                                                                        className={cn(
                                                                                            "flex items-center gap-2 py-2 text-sm font-medium transition-all tracking-tight -mx-2 px-10",
                                                                                            isProgramActive
                                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                                        )}
                                                                                    >
                                                                                        <Briefcase className="h-3 w-3" />
                                                                                        <span className="truncate">{program.name}</span>
                                                                                    </Link>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}

                                                                    {expandedProgramsSection && programs.length === 0 && (
                                                                        <div className="px-10 py-2 text-xs text-muted-foreground italic">
                                                                            No programs yet
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        }

                                                        // Don't render Roadmap yet, we'll render it after Projects
                                                        if (child.title === "Roadmap") {
                                                            return null
                                                        }

                                                        // Regular static children
                                                        const childTitle = child.title === "Project Dashboard"
                                                            ? `${getTerm('project')} Pinboard`
                                                            : child.title
                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {childTitle}
                                                            </Link>
                                                        )
                                                    })}

                                                {/* Projects - always visible, links to main projects page */}
                                                <Link
                                                    href="/projects"
                                                    onClick={handleLinkClick}
                                                    className={cn(
                                                        "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                        pathname === "/projects"
                                                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                    )}
                                                >
                                                    <FolderKanban className="h-3.5 w-3.5" />
                                                    <span>{getTerm('projects')}</span>
                                                </Link>

                                                {/* Roadmap - appears last */}
                                                {item.children
                                                    ?.filter((child) => (isSuperUser || child.roles.includes(effectiveRole)) && child.title === "Roadmap")
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}

                                                {/* Dynamic Programs with nested Projects */}
                                                {programs.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-border/50 space-y-1">
                                                        <div className="px-10 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                                            Programs
                                                        </div>
                                                        {programs.map((program) => {
                                                            const programProjects = getProjectsForProgram(program.id)
                                                            const isExpanded = expandedPrograms[program.id]
                                                            const isProgramActive = pathname.includes(`/programs/${program.id}`)

                                                            return (
                                                                <div key={program.id} className="space-y-1">
                                                                    <div
                                                                        className={cn(
                                                                            "flex items-center justify-between py-2.5 text-sm font-medium transition-all cursor-pointer tracking-tight -mx-2 px-10",
                                                                            isProgramActive && !pathname.includes('/projects/')
                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                        )}
                                                                        onClick={() => toggleProgram(program.id)}
                                                                    >
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <Briefcase className="h-3.5 w-3.5" />
                                                                            <span className="truncate">{program.name}</span>
                                                                        </div>
                                                                        <ChevronDown
                                                                            className={cn(
                                                                                "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                                                isExpanded && "rotate-180",
                                                                                programProjects.length === 0 && "opacity-30"
                                                                            )}
                                                                        />
                                                                    </div>

                                                                    {/* Projects under program */}
                                                                    {isExpanded && programProjects.length > 0 && (
                                                                        <div className="ml-6 space-y-1 border-l-2 border-border pl-2">
                                                                            {programProjects.map((project) => {
                                                                                const isProjectActive = pathname.includes(`/projects/${project.id}`)
                                                                                return (
                                                                                    <Link
                                                                                        key={project.id}
                                                                                        href={`/projects/${project.id}`}
                                                                                        onClick={handleLinkClick}
                                                                                        className={cn(
                                                                                            "flex items-center gap-2 py-2 text-xs font-medium transition-all tracking-tight -mx-2 px-8",
                                                                                            isProjectActive
                                                                                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-l-4 border-purple-400"
                                                                                                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                                        )}
                                                                                    >
                                                                                        <FolderKanban className="h-3 w-3" />
                                                                                        <span className="truncate">{project.name}</span>
                                                                                    </Link>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Communication with children
                            if (item.children && item.title === "Communication" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedCommunication(!expandedCommunication)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedCommunication && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Communication children */}
                                        {expandedCommunication && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => isSuperUser || child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            // Handle Planet AI with children
                            if (item.children && item.title === "Planet AI" && !sidebarCollapsed) {
                                return (
                                    <div key={item.href}>
                                        {/* Separator line between tabs */}
                                        {index > 0 && (
                                            <div className="my-1.5 border-t border-border/50"></div>
                                        )}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                                pathname.includes(item.href)
                                                    ? "bg-primary text-primary-foreground shadow-sm"
                                                    : "text-foreground hover:bg-accent/50"
                                            )}
                                            onClick={() => setExpandedPlanetAI(!expandedPlanetAI)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={cn(
                                                    "h-3.5 w-3.5 transition-transform flex-shrink-0",
                                                    expandedPlanetAI && "rotate-180"
                                                )}
                                            />
                                        </div>

                                        {/* Planet AI children */}
                                        {expandedPlanetAI && (
                                            <div className="space-y-1">
                                                {item.children
                                                    ?.filter((child) => isSuperUser || child.roles.includes(effectiveRole))
                                                    .map((child) => {
                                                        const ChildIcon = child.icon
                                                        const isChildActive =
                                                            pathname === child.href || pathname.startsWith(child.href + "/")

                                                        return (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                onClick={handleLinkClick}
                                                                className={cn(
                                                                    "flex items-center gap-2.5 py-1.5 px-3 text-xs font-medium transition-all rounded-md ml-2",
                                                                    isChildActive
                                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                                                                )}
                                                            >
                                                                <ChildIcon className="h-3.5 w-3.5" />
                                                                {child.title}
                                                            </Link>
                                                        )
                                                    })}
                                            </div>
                                        )}
                                    </div>
                                )
                            }

                            return (
                                <div key={item.href}>
                                    {/* Separator line between tabs */}
                                    {index > 0 && (
                                        <div className="my-1.5 border-t border-border/50"></div>
                                    )}
                                    <Link
                                        href={item.href}
                                        onClick={handleLinkClick}
                                        className={cn(
                                            "flex items-center gap-2.5 py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                            sidebarCollapsed ? "justify-center" : "",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-sm"
                                                : "text-foreground hover:bg-accent/70"
                                        )}
                                        title={sidebarCollapsed ? item.title : undefined}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {!sidebarCollapsed && item.title}
                                    </Link>
                                </div>
                            )
                        })}
                    </nav>

                    {/* Discussions Section */}
                    {user && (
                        <div className={cn("pt-2 border-t border-border/50 mt-auto")}>
                            <Link
                                href="/collaborate"
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-2.5 py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1",
                                    sidebarCollapsed ? "justify-center" : "",
                                    pathname === "/collaborate" || pathname.startsWith("/collaborate/")
                                        ? "bg-primary text-primary-foreground shadow-sm"
                                        : "text-foreground hover:bg-accent/70"
                                )}
                                title={sidebarCollapsed ? "Discussions" : undefined}
                            >
                                <MessageSquare className="h-4 w-4" />
                                {!sidebarCollapsed && "Discussions"}
                            </Link>
                        </div>
                    )}

                    {/* Calendar/Schedule Widget Section */}
                    {user && (
                        <div className={cn("pt-2 border-t border-border/50")}>
                            {sidebarCollapsed ? (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleSidebarCollapse}
                                    className={cn(
                                        "flex items-center justify-center py-2 px-3 text-xs font-medium transition-all rounded-md -mx-1 w-full",
                                        "text-foreground hover:bg-accent/50"
                                    )}
                                    title="Calendar"
                                >
                                    <CalendarDays className="h-4 w-4" />
                                </Button>
                            ) : (
                                <CalendarScheduleWidget />
                            )}
                        </div>
                    )}


                    {/* Platform Admin Tab - Last tab (god-mode) */}
                    {user && (isSuperUser || platformAdminNavItem.roles.includes(user.role)) && (
                        <div className="pt-2 border-t border-border/50">
                            <Link
                                href={platformAdminNavItem.href}
                                onClick={handleLinkClick}
                                className={cn(
                                    "flex items-center gap-2.5 py-3 text-sm font-medium transition-all tracking-tight relative",
                                    sidebarCollapsed ? "justify-center px-2 rounded-md" : "-mx-2 px-6",
                                    pathname === platformAdminNavItem.href || pathname.startsWith(platformAdminNavItem.href + "/")
                                        ? sidebarCollapsed
                                            ? "bg-primary text-primary-foreground rounded-md hover:bg-primary"
                                            : "bg-primary text-primary-foreground shadow-sm"
                                        : "text-foreground hover:bg-accent/50"
                                )}
                                title={sidebarCollapsed ? platformAdminNavItem.title : undefined}
                            >
                                <Shield className="h-4 w-4" />
                                {!sidebarCollapsed && <span>{platformAdminNavItem.title}</span>}
                            </Link>
                        </div>
                    )}
                </div>
            </aside>
        </>
    )
}


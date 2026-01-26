'use client'

/**
 * MyTasksWidget
 * 
 * Comprehensive reusable widget for displaying and managing user tasks across all dashboards.
 * Supports multiple view modes (list, calendar, kanban, gantt), filtering, timer functionality,
 * and dashboard-specific routing.
 * 
 * Features:
 * - Multiple view modes (list, calendar, kanban, gantt)
 * - Task filtering (status, priority, due date)
 * - Timer functionality (start/stop, time tracking)
 * - Task dialogs integration
 * - Fullscreen support
 * - Role-based access
 * - Dashboard-specific routing
 * - Accessible design
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useTaskFilters, type Task } from '@/hooks/useTaskFilters'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  Activity,
  Calendar,
  Filter,
  LayoutGrid,
  List,
  Plus,
  Maximize,
  Minimize,
  Clock,
  Play,
  Pause,
  History,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ChevronDown,
  Trash2,
} from 'lucide-react'
import { addDays, format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

// Dynamic imports for dialogs to reduce initial bundle size
const TaskDialog = dynamic(
  () => import('@/components/dialogs/task-dialog').then((mod) => ({ default: mod.TaskDialog })),
  { ssr: false }
)
const TaskDetailDialog = dynamic(
  () => import('@/components/dialogs/task-detail-dialog').then((mod) => ({ default: mod.TaskDetailDialog })),
  { ssr: false }
)
const TimeTrackingDialog = dynamic(
  () => import('@/components/dialogs/time-tracking-dialog').then((mod) => ({ default: mod.TimeTrackingDialog })),
  { ssr: false }
)
const TimerNotesDialog = dynamic(
  () => import('@/components/dialogs/timer-notes-dialog').then((mod) => ({ default: mod.TimerNotesDialog })),
  { ssr: false }
)

export type TaskViewMode = 'list' | 'calendar' | 'kanban' | 'gantt'

export interface MyTasksWidgetProps {
  /** Array of tasks to display */
  tasks: Task[]
  /** Widget ID for fullscreen functionality */
  widgetId?: string
  /** Whether widget is in fullscreen mode */
  fullscreen?: boolean
  /** Callback when fullscreen is toggled */
  onToggleFullscreen?: (widgetId: string) => void
  /** Dashboard type for custom routing */
  dashboardType?: 'sales' | 'operations' | 'it' | 'product' | 'finance' | 'recruitment' | 'general'
  /** Base path for dashboard routing (e.g., '/sales-dashboard') */
  basePath?: string
  /** Custom title */
  title?: string
  /** Custom description */
  description?: string
  /** Default view mode */
  defaultViewMode?: TaskViewMode
  /** Callback when task is clicked */
  onTaskClick?: (task: Task) => void
  /** Callback when task is created */
  onTaskCreate?: (task: any) => Promise<void>
  /** Callback when task status is updated */
  onTaskStatusUpdate?: (taskId: string, newStatus: string) => Promise<void>
  /** Whether to show timer controls */
  showTimer?: boolean
  /** Whether to show task creation button */
  showCreateButton?: boolean
  /** Optional role restrictions */
  allowedRoles?: string[]
  /** Optional permission check */
  requiredPermission?: { resource: string; action: string }
  /** Optional CSS class */
  className?: string
}

export function MyTasksWidget({
  tasks = [],
  widgetId = 'myTasks',
  fullscreen = false,
  onToggleFullscreen,
  dashboardType = 'general',
  basePath = '',
  title = 'My Tasks',
  description = 'Tasks assigned to you',
  defaultViewMode = 'list',
  onTaskClick,
  onTaskCreate,
  onTaskStatusUpdate,
  showTimer = true,
  showCreateButton = true,
  allowedRoles,
  requiredPermission,
  className,
}: MyTasksWidgetProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)

  // View mode state
  const [taskViewMode, setTaskViewMode] = useState<TaskViewMode>(defaultViewMode)
  const [showFilters, setShowFilters] = useState(false)
  const [calendarDate, setCalendarDate] = useState<Date>(new Date())

  // Task dialogs state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDetailDialogOpen, setTaskDetailDialogOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [timeTrackingDialogOpen, setTimeTrackingDialogOpen] = useState(false)
  const [timeTrackingTaskId, setTimeTrackingTaskId] = useState<string | undefined>(undefined)
  const [timerNotesDialogOpen, setTimerNotesDialogOpen] = useState(false)
  const [pendingTimerTask, setPendingTimerTask] = useState<{ id: string; title: string } | null>(null)

  // Timer state
  const [activeTimer, setActiveTimer] = useState<any>(null)
  const [timerSeconds, setTimerSeconds] = useState<{ [key: string]: number }>({})
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Gantt chart state
  const [ganttGroups, setGanttGroups] = useState<Array<{ id: string; name: string; expanded: boolean; tasks: any[] }>>([])
  const [ganttViewMode, setGanttViewMode] = useState<'days' | 'weeks' | 'months'>('days')
  const [isAddingGanttGroup, setIsAddingGanttGroup] = useState(false)
  const [newGanttGroupName, setNewGanttGroupName] = useState('')
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set())

  // Use task filters hook
  const {
    filteredTasks,
    filters,
    setStatusFilter,
    setPriorityFilter,
    setDueDateFilter,
    clearFilters,
    hasActiveFilters,
  } = useTaskFilters(tasks)

  // Check role-based access
  const hasAccess = useMemo(() => {
    if (!user) return false

    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(user.role)) {
        return false
      }
    }

    if (requiredPermission) {
      if (!hasPermission(requiredPermission.resource, requiredPermission.action)) {
        return false
      }
    }

    return true
  }, [user, allowedRoles, requiredPermission, hasPermission])

  // Initialize calendar date
  useEffect(() => {
    if (taskViewMode === 'calendar' && !calendarDate) {
      setCalendarDate(new Date())
    }
  }, [taskViewMode, calendarDate])

  // Timer functionality
  useEffect(() => {
    if (activeTimer && activeTimer.taskId) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => ({
          ...prev,
          [activeTimer.taskId]: (prev[activeTimer.taskId] || 0) + 1,
        }))
      }, 1000)
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [activeTimer])

  // Format duration helper
  const formatDuration = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    } else if (mins > 0) {
      return `${mins}m ${secs}s`
    }
    return `${secs}s`
  }, [])

  // Start timer
  const startTimer = useCallback(
    async (taskId: string, taskTitle: string) => {
      if (activeTimer) {
        // Show notes dialog first
        setPendingTimerTask({ id: taskId, title: taskTitle })
        setTimerNotesDialogOpen(true)
        return
      }

      try {
        const response = await fetch('/api/timers/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId }),
        })

        if (response.ok) {
          const data = await response.json()
          setActiveTimer({ taskId, startTime: Date.now(), ...data.timer })
          setTimerSeconds((prev) => ({ ...prev, [taskId]: 0 }))
        }
      } catch (error) {
        console.error('Error starting timer:', error)
      }
    },
    [activeTimer]
  )

  // Stop timer
  const stopTimer = useCallback(async () => {
    if (!activeTimer) return

    try {
      const response = await fetch('/api/timers/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: activeTimer.taskId }),
      })

      if (response.ok) {
        setActiveTimer(null)
        setTimerSeconds((prev) => {
          const updated = { ...prev }
          delete updated[activeTimer.taskId]
          return updated
        })
      }
    } catch (error) {
      console.error('Error stopping timer:', error)
    }
  }, [activeTimer])

  // Show timer notes dialog
  const showTimerNotesDialog = useCallback(
    (taskId: string, taskTitle: string, e?: React.MouseEvent) => {
      e?.stopPropagation()
      setPendingTimerTask({ id: taskId, title: taskTitle })
      setTimerNotesDialogOpen(true)
    },
    []
  )

  // Handle task click with dashboard-specific routing
  const handleTaskClick = useCallback(
    (task: Task) => {
      if (onTaskClick) {
        onTaskClick(task)
        return
      }

      // Defensive check: ensure router is available
      if (!router) {
        console.error('[MyTasksWidget] Router is not available')
        setSelectedTaskId(task.id)
        setTaskDetailDialogOpen(true)
        return
      }

      // Default routing based on task source and dashboard type
      const taskSource = (task as any).source || (task as any).sourceType

      if (taskSource === 'activity' && basePath) {
        router.push(`${basePath}/activities?view=${(task as any).sourceId || task.id}`)
      } else if ((taskSource === 'opportunity' || taskSource === 'sales-opportunity') && basePath) {
        router.push(`${basePath}/opportunities/${(task as any).sourceId || task.id}`)
      } else if ((taskSource === 'lead' || taskSource === 'sales-lead') && basePath) {
        router.push(`${basePath}/leads/${(task as any).sourceId || task.id}`)
      } else {
        setSelectedTaskId(task.id)
        setTaskDetailDialogOpen(true)
      }
    },
    [onTaskClick, basePath, router]
  )

  // Update task status (for Kanban)
  const updateTaskStatus = useCallback(
    async (taskId: string, newStatus: string) => {
      if (onTaskStatusUpdate) {
        await onTaskStatusUpdate(taskId, newStatus)
      } else {
        // Default API call
        try {
          await fetch(`/api/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          })
        } catch (error) {
          console.error('Error updating task status:', error)
        }
      }
    },
    [onTaskStatusUpdate]
  )

  // Kanban drag handlers
  const onPointerDown = useCallback((e: React.PointerEvent, taskId: string) => {
    const element = e.currentTarget as HTMLElement
    const rect = element.getBoundingClientRect()

    dragRef.current = {
      taskId,
      startX: e.clientX,
      startY: e.clientY,
      pointerId: e.pointerId,
      element,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    }

    setDraggingTaskId(taskId)
    element.setPointerCapture(e.pointerId)
  }, [])

  // Handle pointer move and up for drag and drop
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return

      const { element, offsetX, offsetY } = dragRef.current
      if (!element) return

      const x = e.clientX - offsetX
      const y = e.clientY - offsetY

      element.style.position = 'fixed'
      element.style.left = `${x}px`
      element.style.top = `${y}px`
      element.style.zIndex = '10000'
      element.style.pointerEvents = 'none'

      // Check which column we're over
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
      const columnElement = elementBelow?.closest('[data-column-id]')
      const columnId = columnElement?.getAttribute('data-column-id')

      if (columnId && columnId !== dragRef.current.taskId) {
        setDragOverColumnId(columnId)
      } else {
        setDragOverColumnId(null)
      }
    }

    const handlePointerUp = async (e: PointerEvent) => {
      if (!dragRef.current) return

      const { taskId, element } = dragRef.current

      // Find which column we dropped on
      const elementBelow = document.elementFromPoint(e.clientX, e.clientY)
      const columnElement = elementBelow?.closest('[data-column-id]')
      const newStatus = columnElement?.getAttribute('data-column-id')

      if (newStatus && newStatus !== taskId) {
        await updateTaskStatus(taskId, newStatus)
      }

      // Reset
      if (element) {
        element.style.position = ''
        element.style.left = ''
        element.style.top = ''
        element.style.zIndex = ''
        element.style.pointerEvents = ''
        element.releasePointerCapture(dragRef.current.pointerId)
      }

      setDraggingTaskId(null)
      setDragOverColumnId(null)
      dragRef.current = null
    }

    if (dragRef.current) {
      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
    }

    return () => {
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
    }
  }, [draggingTaskId, updateTaskStatus])

  if (!hasAccess) {
    return null
  }

  // Render different view modes
  const renderView = () => {
    switch (taskViewMode) {
      case 'list':
        return renderListView()
      case 'calendar':
        return renderCalendarView()
      case 'kanban':
        return renderKanbanView()
      case 'gantt':
        return renderGanttView()
      default:
        return renderListView()
    }
  }

  // List view renderer
  const renderListView = () => {
    return (
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
                className="flex items-start gap-3 p-2 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  {(task as any).project && (
                    <p className="text-xs text-muted-foreground">
                      {(task as any).project.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {task.status}
                    </Badge>
                    <Badge
                      variant={
                        task.priority === 'HIGH' || task.priority === 'CRITICAL'
                          ? 'destructive'
                          : task.priority === 'MEDIUM'
                            ? 'secondary'
                            : 'default'
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

                {showTimer && (task as any).source === 'task' && (
                  <div className="flex flex-col gap-1 items-end">
                    {isTimerActive ? (
                      <>
                        <Badge variant="secondary" className="text-xs animate-pulse">
                          <Clock className="h-3 w-3 mr-1" />
                          {timerDisplay}
                        </Badge>
                        <Button variant="destructive" size="sm" className="h-7 px-2" onClick={(e) => { e.stopPropagation(); stopTimer() }}>
                          <Pause className="h-3 w-3 mr-1" />
                          Stop
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          showTimerNotesDialog(task.id, task.title, e)
                        }}
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
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No tasks yet</p>
            {showCreateButton && (
              <Button variant="outline" size="sm" onClick={() => setTaskDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Create Your First Task
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Filter className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No tasks match your filters</p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Calendar view renderer
  const renderCalendarView = () => {
    // Group tasks by due date
    const tasksByDate: { [key: string]: Task[] } = {}

    filteredTasks.forEach((task) => {
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

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

    // Create calendar grid
    const calendarDays: (number | null)[] = []
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

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
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
        {/* Calendar Header with Navigation */}
        <div className="mb-3 pb-2 border-b flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="h-7 px-2">
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <Button variant="outline" size="sm" onClick={goToToday} className="h-6 px-2 text-xs">
              Today
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={goToNextMonth} className="h-7 px-2">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
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
                <div
                  className={cn(
                    "text-sm font-semibold mb-1",
                    isToday && "text-primary",
                    isPast && "text-muted-foreground"
                  )}
                >
                  {day}
                </div>

                {/* Tasks for this day */}
                <div className="space-y-1 flex-1 overflow-y-auto">
                  {tasksForDay.map((task) => (
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
                      onClick={() => handleTaskClick(task)}
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
        {filteredTasks.some((t) => !t.dueDate) && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              No Due Date ({filteredTasks.filter((t) => !t.dueDate).length})
            </div>
            <div className="flex flex-wrap gap-1">
              {filteredTasks
                .filter((t) => !t.dueDate)
                .map((task) => (
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
                    onClick={() => handleTaskClick(task)}
                  >
                    {task.title}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Kanban view renderer
  const renderKanbanView = () => {
    const kanbanColumns = [
      {
        id: 'TODO',
        name: 'To Do',
        icon: '📋',
        dragOverClasses: 'border-blue-400 shadow-lg shadow-blue-500/20 bg-blue-50/50',
        dragOverBadgeClasses: 'bg-blue-100 text-blue-700 border-blue-300',
        dragOverContentClasses: 'bg-blue-50/30 border-2 border-blue-300 border-dashed',
        dragOverEmptyClasses: 'border-blue-400 bg-blue-50/50 text-blue-700',
      },
      {
        id: 'IN_PROGRESS',
        name: 'In Progress',
        icon: '⚡',
        dragOverClasses: 'border-amber-400 shadow-lg shadow-amber-500/20 bg-amber-50/50',
        dragOverBadgeClasses: 'bg-amber-100 text-amber-700 border-amber-300',
        dragOverContentClasses: 'bg-amber-50/30 border-2 border-amber-300 border-dashed',
        dragOverEmptyClasses: 'border-amber-400 bg-amber-50/50 text-amber-700',
      },
      {
        id: 'IN_REVIEW',
        name: 'In Review',
        icon: '📋',
        dragOverClasses: 'border-purple-400 shadow-lg shadow-purple-500/20 bg-purple-50/50',
        dragOverBadgeClasses: 'bg-purple-100 text-purple-700 border-purple-300',
        dragOverContentClasses: 'bg-purple-50/30 border-2 border-purple-300 border-dashed',
        dragOverEmptyClasses: 'border-purple-400 bg-purple-50/50 text-purple-700',
      },
      {
        id: 'DONE',
        name: 'Done',
        icon: '✅',
        dragOverClasses: 'border-green-400 shadow-lg shadow-green-500/20 bg-green-50/50',
        dragOverBadgeClasses: 'bg-green-100 text-green-700 border-green-300',
        dragOverContentClasses: 'bg-green-50/30 border-2 border-green-300 border-dashed',
        dragOverEmptyClasses: 'border-green-400 bg-green-50/50 text-green-700',
      },
    ]


    return (
      <div className="h-full overflow-auto bg-gradient-to-br from-background to-muted/20">
        <div className="flex gap-4 min-w-[1000px] pb-6 px-1">
          {kanbanColumns.map((column) => {
            const columnTasks = filteredTasks.filter((task) => {
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
                  <div
                    className={cn(
                      "relative flex items-center justify-between px-5 py-4 rounded-xl border",
                      "bg-gradient-to-br from-card to-card/80 backdrop-blur-sm",
                      "shadow-sm",
                      draggingTaskId ? "transition-none" : "transition-all duration-200",
                      isDragOver
                        ? column.dragOverClasses
                        : "border-border/60 hover:border-border hover:shadow-md"
                    )}
                  >
                    {/* Status indicator bar */}
                    <div
                      className={cn(
                        "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
                        column.id === 'TODO' && "bg-gradient-to-b from-blue-500 to-blue-400",
                        column.id === 'IN_PROGRESS' && "bg-gradient-to-b from-amber-500 to-amber-400",
                        column.id === 'IN_REVIEW' && "bg-gradient-to-b from-purple-500 to-purple-400",
                        column.id === 'DONE' && "bg-gradient-to-b from-green-500 to-green-400"
                      )}
                    />

                    <div className="flex items-center gap-3 pl-1">
                      <div
                        className={cn(
                          "flex items-center justify-center w-9 h-9 rounded-lg",
                          "bg-background/60 backdrop-blur-sm",
                          column.id === 'TODO' && "bg-blue-50 dark:bg-blue-950/30",
                          column.id === 'IN_PROGRESS' && "bg-amber-50 dark:bg-amber-950/30",
                          column.id === 'IN_REVIEW' && "bg-purple-50 dark:bg-purple-950/30",
                          column.id === 'DONE' && "bg-green-50 dark:bg-green-950/30"
                        )}
                      >
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
                    {columnTasks.map((task) => {
                      const taskIsDragging = draggingTaskId === task.id
                      const isDraggable = (task as any).source === 'task' || !(task as any).source

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
                          style={
                            isDraggable
                              ? ({
                                userSelect: 'none',
                                WebkitUserSelect: 'none',
                                touchAction: 'none',
                                WebkitTouchCallout: 'none',
                                cursor: 'grab',
                              } as React.CSSProperties)
                              : undefined
                          }
                          onClick={(e) => {
                            // Block click if we were dragging
                            if (taskIsDragging || dragRef.current?.taskId === task.id) {
                              e.preventDefault()
                              e.stopPropagation()
                              return
                            }
                            handleTaskClick(task)
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
                            {(task as any).source && (task as any).source !== 'task' && (
                              <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                                {(task as any).source === 'activity'
                                  ? 'Activity'
                                  : (task as any).source === 'opportunity'
                                    ? 'Opportunity'
                                    : 'Lead'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {columnTasks.length === 0 && (
                      <div
                        className={cn(
                          "text-center text-muted-foreground/60 text-sm py-16 rounded-xl border-2 border-dashed",
                          draggingTaskId ? "transition-none" : "transition-all duration-150",
                          isDragOver
                            ? column.dragOverEmptyClasses
                            : "border-border/30 hover:border-border/50"
                        )}
                      >
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
    )
  }

  // Gantt view renderer
  const renderGanttView = () => {

    // Initialize gantt groups from tasks if empty
    useEffect(() => {
      if (ganttGroups.length === 0 && filteredTasks.length > 0) {
        // Group tasks by project or create default group
        const defaultGroup = {
          id: 'default',
          name: 'All Tasks',
          expanded: true,
          tasks: filteredTasks,
        }
        setGanttGroups([defaultGroup])
      }
    }, [filteredTasks.length])

    // Calculate timeline dates
    const getTimelineDates = () => {
      if (ganttViewMode === 'days') {
        const start = startOfWeek(new Date(), { weekStartsOn: 0 })
        const end = addDays(start, 13) // 2 weeks
        return eachDayOfInterval({ start, end })
      } else if (ganttViewMode === 'weeks') {
        const start = startOfWeek(new Date(), { weekStartsOn: 0 })
        const weeks = []
        for (let i = 0; i < 12; i++) {
          weeks.push(addDays(start, i * 7))
        }
        return weeks
      } else {
        // months
        const months = []
        const now = new Date()
        for (let i = -2; i < 10; i++) {
          months.push(new Date(now.getFullYear(), now.getMonth() + i, 1))
        }
        return months
      }
    }

    const timelineDates = getTimelineDates()

    const addGanttGroup = () => {
      if (!newGanttGroupName.trim()) return
      const newGroup = {
        id: Date.now().toString(),
        name: newGanttGroupName.trim(),
        expanded: true,
        tasks: [],
      }
      setGanttGroups([...ganttGroups, newGroup])
      setNewGanttGroupName('')
      setIsAddingGanttGroup(false)
    }

    const toggleGroupExpanded = (groupId: string) => {
      setGanttGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, expanded: !g.expanded } : g))
      )
    }

    const deleteGanttGroup = (groupId: string) => {
      setGanttGroups((prev) => prev.filter((g) => g.id !== groupId))
    }

    const getTaskPosition = (task: Task) => {
      const startDate = (task as any).startDate
        ? new Date((task as any).startDate)
        : task.dueDate
          ? new Date(task.dueDate)
          : new Date()
      const endDate = task.dueDate ? new Date(task.dueDate) : addDays(startDate, 1)

      const timelineStart = timelineDates[0]
      const timelineEnd = timelineDates[timelineDates.length - 1]

      if (startDate > timelineEnd || endDate < timelineStart) {
        return null
      }

      const startOffset = Math.max(0, (startDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      const duration = Math.max(1, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

      return { startOffset, duration }
    }

    return (
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
                <TabsTrigger value="days" className="text-xs px-3 py-1">
                  Days
                </TabsTrigger>
                <TabsTrigger value="weeks" className="text-xs px-3 py-1">
                  Weeks
                </TabsTrigger>
                <TabsTrigger value="months" className="text-xs px-3 py-1">
                  Months
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Add Group Dialog */}
        {isAddingGanttGroup && (
          <div className="p-3 border-b bg-muted/50 flex items-center gap-2">
            <Input
              placeholder="Group name..."
              value={newGanttGroupName}
              onChange={(e) => setNewGanttGroupName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addGanttGroup()
                }
              }}
              className="h-8 text-xs"
              autoFocus
            />
            <Button size="sm" onClick={addGanttGroup} className="h-8">
              Add
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
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Gantt Chart Body */}
        <div className="flex-1 overflow-auto">
          <div className="flex min-w-[1200px]">
            {/* Left Panel - Task List */}
            <div className="w-[400px] border-r bg-background sticky left-0 z-20">
              <div className="border-b bg-muted/50 p-2 grid grid-cols-3 gap-2 text-xs font-semibold">
                <div>Task</div>
                <div>Status</div>
                <div>Due Date</div>
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

                      {/* Group Tasks */}
                      {group.expanded && (
                        <div>
                          {group.tasks.length === 0 ? (
                            <div className="p-4 text-center text-xs text-muted-foreground">
                              No tasks in this group
                            </div>
                          ) : (
                            group.tasks.map((task: any) => {
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => handleTaskClick(task)}
                                  className="grid grid-cols-3 gap-2 p-2 hover:bg-accent/50 text-xs border-b cursor-pointer transition-colors"
                                >
                                  <div className="font-medium truncate">{task.title || 'Untitled Task'}</div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`h-2 w-2 rounded-full ${task.status === 'DONE'
                                        ? 'bg-green-500'
                                        : task.status === 'IN_PROGRESS'
                                          ? 'bg-blue-500'
                                          : task.status === 'BLOCKED'
                                            ? 'bg-red-500'
                                            : 'bg-gray-400'
                                        }`}
                                    />
                                    <span>{task.status || 'TODO'}</span>
                                  </div>
                                  <div>
                                    {task.dueDate
                                      ? format(new Date(task.dueDate), 'MMM dd')
                                      : 'No date'}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Panel - Timeline */}
            <div className="flex-1 overflow-x-auto">
              <div className="border-b bg-muted/50 p-2 text-xs font-semibold sticky top-0 z-10">
                <div className="flex" style={{ minWidth: `${timelineDates.length * 50}px` }}>
                  {timelineDates.map((date, index) => (
                    <div
                      key={index}
                      className="w-[50px] text-center border-r last:border-r-0"
                      style={{ minWidth: '50px' }}
                    >
                      {ganttViewMode === 'days'
                        ? format(date, 'dd')
                        : ganttViewMode === 'weeks'
                          ? format(date, 'MMM dd')
                          : format(date, 'MMM yyyy')}
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative" style={{ minHeight: `${ganttGroups.reduce((acc, g) => acc + (g.expanded ? g.tasks.length : 0), 0) * 40}px` }}>
                {ganttGroups.map((group) =>
                  group.expanded
                    ? group.tasks.map((task: any) => {
                      const position = getTaskPosition(task)
                      if (!position) return null

                      return (
                        <div
                          key={task.id}
                          className="absolute h-8 border rounded px-2 flex items-center text-xs cursor-pointer hover:opacity-80 transition-opacity"
                          style={{
                            left: `${position.startOffset * 50}px`,
                            width: `${position.duration * 50}px`,
                            backgroundColor:
                              task.priority === 'CRITICAL'
                                ? '#ef4444'
                                : task.priority === 'HIGH'
                                  ? '#f59e0b'
                                  : task.priority === 'MEDIUM'
                                    ? '#eab308'
                                    : '#3b82f6',
                            color: 'white',
                          }}
                          onClick={() => handleTaskClick(task)}
                          title={task.title}
                        >
                          <span className="truncate">{task.title}</span>
                        </div>
                      )
                    })
                    : null
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Card
        className={cn(
          "h-full flex flex-col overflow-hidden",
          fullscreen && "fixed inset-0 z-[9999] m-0 rounded-none",
          className
        )}
        style={
          fullscreen
            ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              margin: 0,
              borderRadius: 0,
            }
            : undefined
        }
      >
        <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{title}</CardTitle>
              <CardDescription className="text-xs truncate">{description}</CardDescription>
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
              {showCreateButton && (
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
              )}
              {onToggleFullscreen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleFullscreen(widgetId)}
                  title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  className="h-8 w-8 p-0"
                >
                  {fullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                </Button>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filters</span>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                  <Select value={filters.status} onValueChange={setStatusFilter}>
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
                  <Select value={filters.priority} onValueChange={setPriorityFilter}>
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
                  <Select value={filters.dueDate} onValueChange={setDueDateFilter}>
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
                Showing {filteredTasks.length} of {tasks.length} tasks
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden pt-4">
          {renderView()}
        </CardContent>
      </Card>

      {/* Task Dialogs */}
      {taskDialogOpen && (
        <TaskDialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          onSubmit={async (data) => {
            if (onTaskCreate) {
              await onTaskCreate(data)
            }
            setTaskDialogOpen(false)
          }}
        />
      )}

      {taskDetailDialogOpen && selectedTaskId && (
        <TaskDetailDialog
          open={taskDetailDialogOpen}
          onClose={() => {
            setTaskDetailDialogOpen(false)
            setSelectedTaskId(null)
          }}
          taskId={selectedTaskId}
        />
      )}

      {timeTrackingDialogOpen && timeTrackingTaskId && (
        <TimeTrackingDialog
          open={timeTrackingDialogOpen}
          onClose={() => {
            setTimeTrackingDialogOpen(false)
            setTimeTrackingTaskId(undefined)
          }}
          taskId={timeTrackingTaskId}
        />
      )}

      {timerNotesDialogOpen && pendingTimerTask && (
        <TimerNotesDialog
          open={timerNotesDialogOpen}
          onClose={() => {
            setTimerNotesDialogOpen(false)
            setPendingTimerTask(null)
          }}
          taskTitle={pendingTimerTask.title}
          onSubmit={async () => {
            await startTimer(pendingTimerTask.id, pendingTimerTask.title)
            setTimerNotesDialogOpen(false)
            setPendingTimerTask(null)
          }}
        />
      )}
    </>
  )
}

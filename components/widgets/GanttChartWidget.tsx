'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Network, Plus, ChevronDown, ChevronRight, Search, Filter, Users, SortAsc, EyeOff,
    LayoutGrid, MoreHorizontal, GripVertical, Maximize, Minimize, X, Save, Trash2,
    Edit2, Copy, Archive, Download, Upload, Settings, RefreshCw, Minus, MessageSquare, FileText, Palette
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GanttTask {
    id: string
    title: string
    personName?: string
    status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
    date?: string
    groupId: string
    subtasks?: GanttTask[]
    expanded?: boolean
    parentId?: string
}

interface GanttGroup {
    id: string
    title: string
    expanded: boolean
    tasks: GanttTask[]
}

interface GanttChartWidgetProps {
    fullscreenWidget?: string | null
    widgetId?: string
    onToggleFullscreen?: (widgetId: string) => void
}

export function GanttChartWidget(props: GanttChartWidgetProps) {
    const { fullscreenWidget, widgetId = 'ganttChart', onToggleFullscreen } = props

    const cardRef = useRef<HTMLDivElement>(null)
    const [groups, setGroups] = useState<GanttGroup[]>([])
    const [filteredGroups, setFilteredGroups] = useState<GanttGroup[]>([])
    const [isAddingTask, setIsAddingTask] = useState<string | null>(null)
    const [isAddingSubtask, setIsAddingSubtask] = useState<string | null>(null)
    const [isAddingGroup, setIsAddingGroup] = useState(false)
    const [newGroupName, setNewGroupName] = useState('')
    const [newTask, setNewTask] = useState({
        title: '',
        status: 'TODO' as const,
        priority: 'MEDIUM' as const,
        date: '',
        subtasks: [] as GanttTask[]
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [searchType, setSearchType] = useState<'all' | 'project' | 'task' | 'subtask' | 'people' | 'date'>('all')
    const [statusFilter, setStatusFilter] = useState<string[]>([])
    const [personFilter, setPersonFilter] = useState<string[]>([])
    const [sortBy, setSortBy] = useState<'none' | 'name' | 'date' | 'status'>('none')
    const [hideCompleted, setHideCompleted] = useState(false)
    const [visibleColumns, setVisibleColumns] = useState({
        person: true,
        status: true,
        date: true
    })
    const [draggedTask, setDraggedTask] = useState<{ taskId: string; groupId: string; isSubtask: boolean; parentId?: string } | null>(null)
    const [dragOverTask, setDragOverTask] = useState<{ taskId: string; groupId: string; parentId?: string } | null>(null)
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string }>>([])
    const [assigningTask, setAssigningTask] = useState<{ taskId: string; isSubtask: boolean } | null>(null)
    const [customColumns, setCustomColumns] = useState<Array<{ id: string; name: string }>>([])
    const [selectedTask, setSelectedTask] = useState<{ taskId: string; isSubtask: boolean; groupId: string; parentId?: string } | null>(null)
    const [showTaskDetail, setShowTaskDetail] = useState(false)
    const [taskUpdates, setTaskUpdates] = useState<Array<any>>([])
    const [newUpdate, setNewUpdate] = useState('')
    const [loadingUpdates, setLoadingUpdates] = useState(false)
    const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; uploadedAt: Date }>>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Header styling state
    const [editingHeader, setEditingHeader] = useState<{ type: 'group' | 'task', id: string } | null>(null)
    const [headerStyles, setHeaderStyles] = useState<{
        [key: string]: { fontColor?: string; backgroundColor?: string }
    }>({})

    // Task name editing state
    const [editingTaskName, setEditingTaskName] = useState<{ taskId: string; isSubtask: boolean; groupId: string; parentId?: string } | null>(null)
    const [editingTaskTitle, setEditingTaskTitle] = useState('')

    // Task row styling state
    const [editingTaskStyle, setEditingTaskStyle] = useState<{ taskId: string; isSubtask: boolean } | null>(null)
    const [taskStyles, setTaskStyles] = useState<{
        [key: string]: { fontColor?: string; backgroundColor?: string }
    }>({})

    // Column width state
    const [columnWidths, setColumnWidths] = useState({
        title: 300,
        person: 120,
        status: 150,
        date: 120,
        custom: 150 // default width for custom columns
    })
    const [isResizing, setIsResizing] = useState<string | null>(null)
    const [resizeStartX, setResizeStartX] = useState(0)
    const [resizeStartWidth, setResizeStartWidth] = useState(0)

    // Load task styles from localStorage
    useEffect(() => {
        const savedTaskStyles = localStorage.getItem('ganttTaskStyles')
        if (savedTaskStyles) {
            setTaskStyles(JSON.parse(savedTaskStyles))
        }
    }, [])

    // Save task styles to localStorage
    const saveTaskStyles = (styles: typeof taskStyles) => {
        setTaskStyles(styles)
        localStorage.setItem('ganttTaskStyles', JSON.stringify(styles))
    }

    // Update task style
    const updateTaskStyle = (taskId: string, fontColor?: string, backgroundColor?: string) => {
        const newStyles = {
            ...taskStyles,
            [taskId]: {
                fontColor: fontColor || taskStyles[taskId]?.fontColor,
                backgroundColor: backgroundColor || taskStyles[taskId]?.backgroundColor
            }
        }
        saveTaskStyles(newStyles)
        setEditingTaskStyle(null)
    }

    // Column resize handlers
    const handleResizeStart = (e: React.MouseEvent, column: string) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(column)
        setResizeStartX(e.clientX)
        setResizeStartWidth(columnWidths[column as keyof typeof columnWidths])
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return

            const diff = e.clientX - resizeStartX
            const newWidth = Math.max(80, resizeStartWidth + diff) // Minimum 80px

            setColumnWidths(prev => ({
                ...prev,
                [isResizing]: newWidth
            }))
        }

        const handleMouseUp = () => {
            setIsResizing(null)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'

            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
                document.body.style.cursor = ''
                document.body.style.userSelect = ''
            }
        }
    }, [isResizing, resizeStartX, resizeStartWidth])

    // Calculate grid template columns based on column widths
    const getGridTemplateColumns = () => {
        const cols: string[] = []
        cols.push(`${columnWidths.title}px`)
        if (visibleColumns.person) cols.push(`${columnWidths.person}px`)
        if (visibleColumns.status) cols.push(`${columnWidths.status}px`)
        if (visibleColumns.date) cols.push(`${columnWidths.date}px`)
        // Add custom columns
        customColumns.forEach(() => {
            cols.push(`${columnWidths.custom}px`)
        })
        return cols.join(' ')
    }

    // Load header styles from localStorage
    useEffect(() => {
        const savedStyles = localStorage.getItem('ganttHeaderStyles')
        if (savedStyles) {
            setHeaderStyles(JSON.parse(savedStyles))
        }
    }, [])

    // Save header styles to localStorage
    const saveHeaderStyles = (styles: typeof headerStyles) => {
        setHeaderStyles(styles)
        localStorage.setItem('ganttHeaderStyles', JSON.stringify(styles))
    }

    // Update header style
    const updateHeaderStyle = (id: string, fontColor?: string, backgroundColor?: string) => {
        const newStyles = {
            ...headerStyles,
            [id]: {
                fontColor: fontColor || headerStyles[id]?.fontColor,
                backgroundColor: backgroundColor || headerStyles[id]?.backgroundColor
            }
        }
        saveHeaderStyles(newStyles)
        setEditingHeader(null)
    }

    // Start editing task name
    const startEditingTaskName = (taskId: string, currentTitle: string, isSubtask: boolean, groupId: string, parentId?: string) => {
        setEditingTaskName({ taskId, isSubtask, groupId, parentId })
        setEditingTaskTitle(currentTitle)
    }

    // Save task name
    const saveTaskName = async () => {
        if (!editingTaskName || !editingTaskTitle.trim()) {
            setEditingTaskName(null)
            return
        }

        try {
            const response = await fetch(`/api/tasks/${editingTaskName.taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: editingTaskTitle.trim() })
            })

            if (response.ok) {
                // Update local state
                setGroups(prevGroups => prevGroups.map(group => {
                    if (group.id !== editingTaskName.groupId) return group

                    return {
                        ...group,
                        tasks: group.tasks.map(task => {
                            if (task.id === editingTaskName.taskId && !editingTaskName.isSubtask) {
                                return { ...task, title: editingTaskTitle.trim() }
                            }
                            if (editingTaskName.isSubtask && task.subtasks) {
                                return {
                                    ...task,
                                    subtasks: task.subtasks.map(subtask =>
                                        subtask.id === editingTaskName.taskId
                                            ? { ...subtask, title: editingTaskTitle.trim() }
                                            : subtask
                                    )
                                }
                            }
                            return task
                        })
                    }
                }))
                setEditingTaskName(null)
                setEditingTaskTitle('')
            }
        } catch (error) {
            console.error('Error updating task name:', error)
        }
    }

    // Cancel editing task name
    const cancelEditingTaskName = () => {
        setEditingTaskName(null)
        setEditingTaskTitle('')
    }

    const fetchTasks = useCallback(async () => {
        try {
            const response = await fetch('/api/tasks?includeCreated=true')
            if (response.ok) {
                const data = await response.json()
                console.log('[GanttChart] Fetched tasks:', data.tasks)

                const taskGroups: { [key: string]: GanttTask[] } = {}

                // First, create a map of all tasks by ID
                const tasksById: { [key: string]: any } = {}
                data.tasks.forEach((task: any) => {
                    tasksById[task.id] = task
                })

                // Separate parent tasks and subtasks
                const parentTasks: any[] = []
                const subtasksByParent: { [key: string]: any[] } = {}

                data.tasks.forEach((task: any) => {
                    if (task.parentId) {
                        // This is a subtask
                        console.log('[GanttChart] Found subtask:', task.title, 'parent:', task.parentId)
                        if (!subtasksByParent[task.parentId]) {
                            subtasksByParent[task.parentId] = []
                        }
                        subtasksByParent[task.parentId].push(task)
                    } else {
                        // This is a parent task
                        console.log('[GanttChart] Found parent task:', task.title)
                        parentTasks.push(task)
                    }
                })

                console.log('[GanttChart] Parent tasks:', parentTasks.length)
                console.log('[GanttChart] Subtasks by parent:', subtasksByParent)

                // Build the task hierarchy
                parentTasks.forEach((task: any) => {
                    const groupName = task.project?.name || 'Ungrouped Tasks'
                    if (!taskGroups[groupName]) {
                        taskGroups[groupName] = []
                    }

                    // Get subtasks for this parent
                    const taskSubtasks = subtasksByParent[task.id] || []
                    console.log(`[GanttChart] Task "${task.title}" has ${taskSubtasks.length} subtasks`)

                    taskGroups[groupName].push({
                        id: task.id,
                        title: task.title,
                        personName: task.assignee?.firstName || task.assignee?.name,
                        status: task.status || 'TODO',
                        date: task.dueDate || task.startDate,
                        groupId: groupName,
                        subtasks: taskSubtasks.map((subtask: any) => ({
                            id: subtask.id,
                            title: subtask.title,
                            personName: subtask.assignee?.firstName || subtask.assignee?.name,
                            status: subtask.status || 'TODO',
                            date: subtask.dueDate || subtask.startDate,
                            groupId: groupName,
                            parentId: task.id
                        })),
                        expanded: taskSubtasks.length > 0 // Auto-expand if has subtasks
                    })
                })

                const groupsArray = Object.entries(taskGroups).map(([name, tasks]) => ({
                    id: name,
                    title: name,
                    expanded: true,
                    tasks
                }))

                console.log('[GanttChart] Final groups:', groupsArray)
                setGroups(groupsArray)
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }, [])

    useEffect(() => {
        fetchTasks()
        fetchTeamMembers()
    }, [fetchTasks])

    const fetchTeamMembers = async () => {
        try {
            const response = await fetch('/api/users')
            if (response.ok) {
                const data = await response.json()
                setTeamMembers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching team members:', error)
        }
    }

    useEffect(() => {
        let filtered = groups.map(group => {
            let tasks = [...group.tasks]

            if (searchQuery) {
                tasks = tasks.filter(task => {
                    const query = searchQuery.toLowerCase()

                    switch (searchType) {
                        case 'project':
                            return group.title.toLowerCase().includes(query)
                        case 'task':
                            return task.title.toLowerCase().includes(query)
                        case 'subtask':
                            return task.subtasks?.some(subtask =>
                                subtask.title.toLowerCase().includes(query)
                            ) || false
                        case 'people':
                            return task.personName?.toLowerCase().includes(query) ||
                                task.subtasks?.some(subtask =>
                                    subtask.personName?.toLowerCase().includes(query)
                                ) || false
                        case 'date':
                            return task.date?.toLowerCase().includes(query) ||
                                task.subtasks?.some(subtask =>
                                    subtask.date?.toLowerCase().includes(query)
                                ) || false
                        case 'all':
                        default:
                            // Check if parent task matches
                            const parentMatches = task.title.toLowerCase().includes(query) ||
                                task.personName?.toLowerCase().includes(query) ||
                                task.date?.toLowerCase().includes(query) ||
                                group.title.toLowerCase().includes(query)

                            // Check if any subtask matches
                            const subtaskMatches = task.subtasks?.some(subtask =>
                                subtask.title.toLowerCase().includes(query) ||
                                subtask.personName?.toLowerCase().includes(query) ||
                                subtask.date?.toLowerCase().includes(query)
                            )

                            return parentMatches || subtaskMatches
                    }
                })
            }

            if (statusFilter.length > 0) {
                tasks = tasks.filter(task => statusFilter.includes(task.status))
            }

            if (personFilter.length > 0) {
                tasks = tasks.filter(task => task.personName && personFilter.includes(task.personName))
            }

            if (hideCompleted) {
                tasks = tasks.filter(task => task.status !== 'COMPLETED')
            }

            if (sortBy === 'name') {
                tasks.sort((a, b) => a.title.localeCompare(b.title))
            } else if (sortBy === 'date') {
                tasks.sort((a, b) => {
                    if (!a.date) return 1
                    if (!b.date) return -1
                    return new Date(a.date).getTime() - new Date(b.date).getTime()
                })
            } else if (sortBy === 'status') {
                const statusOrder = { 'TODO': 0, 'IN_PROGRESS': 1, 'COMPLETED': 2 }
                tasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
            }

            return { ...group, tasks }
        })

        filtered = filtered.filter(group => group.tasks.length > 0)
        setFilteredGroups(filtered)
    }, [groups, searchQuery, searchType, statusFilter, personFilter, sortBy, hideCompleted])

    const getUniquePersons = () => {
        const persons = new Set<string>()
        groups.forEach(group => {
            group.tasks.forEach(task => {
                if (task.personName) persons.add(task.personName)
            })
        })
        return Array.from(persons)
    }

    const getInitials = (name: string) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        }
        return name.substring(0, 2).toUpperCase()
    }

    const getStatusColor = (status: string) => {
        const colors = {
            TODO: 'bg-slate-200 text-slate-700',
            IN_PROGRESS: 'bg-orange-500 text-white',
            COMPLETED: 'bg-green-500 text-white'
        }
        return colors[status as keyof typeof colors] || 'bg-gray-200 text-gray-700'
    }

    const getStatusLabel = (status: string) => {
        const labels = {
            TODO: 'To Do',
            IN_PROGRESS: 'Working on it',
            COMPLETED: 'Done'
        }
        return labels[status as keyof typeof labels] || status
    }

    const toggleGroupExpanded = (groupId: string) => {
        setGroups(groups.map(g =>
            g.id === groupId ? { ...g, expanded: !g.expanded } : g
        ))
    }

    const toggleTaskExpanded = (groupId: string, taskId: string) => {
        setGroups(groups.map(g => {
            if (g.id === groupId) {
                return {
                    ...g,
                    tasks: g.tasks.map(t => {
                        if (t.id === taskId) {
                            return { ...t, expanded: !t.expanded }
                        }
                        return t
                    })
                }
            }
            return g
        }))
    }

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, taskId: string, groupId: string, isSubtask: boolean = false, parentId?: string) => {
        setDraggedTask({ taskId, groupId, isSubtask, parentId })
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, taskId: string, groupId: string, parentId?: string) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setDragOverTask({ taskId, groupId, parentId })
    }

    const handleDragEnd = () => {
        setDraggedTask(null)
        setDragOverTask(null)
    }

    const handleDrop = async (e: React.DragEvent, dropTaskId: string, dropGroupId: string, dropParentId?: string) => {
        e.preventDefault()

        if (!draggedTask) return

        const { taskId: dragTaskId, groupId: dragGroupId, isSubtask: isDraggingSubtask, parentId: dragParentId } = draggedTask

        // Don't do anything if dropping on itself
        if (dragTaskId === dropTaskId) {
            setDraggedTask(null)
            setDragOverTask(null)
            return
        }

        // Rule: Subtasks can only be moved to other parent tasks (change parent)
        // Rule: Parent tasks can only be reordered within the same group

        if (isDraggingSubtask) {
            // Moving a subtask - can move to a different parent task
            if (!dropParentId) {
                // Trying to drop subtask as a parent task - not allowed
                alert('Subtasks cannot be converted to parent tasks. They must be moved to another parent task.')
                setDraggedTask(null)
                setDragOverTask(null)
                return
            }

            // Move subtask to new parent
            await moveSubtaskToNewParent(dragTaskId, dragParentId!, dropParentId, dragGroupId, dropGroupId)
        } else {
            // Moving a parent task - can only reorder within the same group
            if (dragGroupId !== dropGroupId) {
                alert('Tasks cannot be moved between groups.')
                setDraggedTask(null)
                setDragOverTask(null)
                return
            }

            if (dropParentId) {
                // Trying to drop parent task inside another task - not allowed
                alert('Parent tasks cannot be converted to subtasks.')
                setDraggedTask(null)
                setDragOverTask(null)
                return
            }

            // Reorder task within group
            reorderTaskInGroup(dragTaskId, dropTaskId, dragGroupId)
        }

        setDraggedTask(null)
        setDragOverTask(null)
    }

    const reorderTaskInGroup = (dragTaskId: string, dropTaskId: string, groupId: string) => {
        setGroups(groups.map(group => {
            if (group.id !== groupId) return group

            const tasks = [...group.tasks]
            const dragIndex = tasks.findIndex(t => t.id === dragTaskId)
            const dropIndex = tasks.findIndex(t => t.id === dropTaskId)

            if (dragIndex === -1 || dropIndex === -1) return group

            // Remove dragged task and insert at new position
            const [draggedTask] = tasks.splice(dragIndex, 1)
            tasks.splice(dropIndex, 0, draggedTask)

            return { ...group, tasks }
        }))
    }

    const moveSubtaskToNewParent = async (subtaskId: string, oldParentId: string, newParentId: string, oldGroupId: string, newGroupId: string) => {
        try {
            // Update in database
            const response = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: subtaskId,
                    parentId: newParentId
                })
            })

            if (response.ok) {
                // Update local state
                setGroups(groups.map(group => {
                    if (group.id === oldGroupId) {
                        return {
                            ...group,
                            tasks: group.tasks.map(task => {
                                if (task.id === oldParentId) {
                                    // Remove subtask from old parent
                                    return {
                                        ...task,
                                        subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId)
                                    }
                                }
                                if (task.id === newParentId) {
                                    // Add subtask to new parent
                                    const subtaskToMove = groups
                                        .find(g => g.id === oldGroupId)
                                        ?.tasks.find(t => t.id === oldParentId)
                                        ?.subtasks?.find(st => st.id === subtaskId)

                                    if (subtaskToMove) {
                                        return {
                                            ...task,
                                            subtasks: [...(task.subtasks || []), { ...subtaskToMove, parentId: newParentId }],
                                            expanded: true
                                        }
                                    }
                                }
                                return task
                            })
                        }
                    }
                    return group
                }))

                // Refresh to get latest data
                await fetchTasks()
            }
        } catch (error) {
            console.error('Error moving subtask:', error)
            alert('Failed to move subtask')
        }
    }

    const assignUserToTask = async (taskId: string, userId: string, isSubtask: boolean, groupId: string, parentId?: string) => {
        try {
            const response = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: taskId,
                    assigneeId: userId
                })
            })

            if (response.ok) {
                // Update local state
                const user = teamMembers.find(u => u.id === userId)
                const userName = user?.name || user?.email?.split('@')[0] || 'Unknown'

                setGroups(groups.map(group => {
                    if (group.id === groupId) {
                        return {
                            ...group,
                            tasks: group.tasks.map(task => {
                                if (isSubtask && task.id === parentId) {
                                    // Update subtask
                                    return {
                                        ...task,
                                        subtasks: (task.subtasks || []).map(st =>
                                            st.id === taskId ? { ...st, personName: userName } : st
                                        )
                                    }
                                } else if (!isSubtask && task.id === taskId) {
                                    // Update parent task
                                    return { ...task, personName: userName }
                                }
                                return task
                            })
                        }
                    }
                    return group
                }))

                setAssigningTask(null)
            }
        } catch (error) {
            console.error('Error assigning user:', error)
            alert('Failed to assign user')
        }
    }

    const addTask = async (groupId: string) => {
        if (!newTask.title?.trim()) {
            console.log('No task title provided')
            return
        }

        console.log('Adding task:', newTask)

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTask.title,
                    status: newTask.status,
                    priority: newTask.priority,
                    dueDate: newTask.date || undefined
                })
            })

            console.log('Response status:', response.status)

            if (response.ok) {
                const result = await response.json()
                console.log('Task created:', result)
                await fetchTasks()
                setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] })
                setIsAddingTask(null)
            } else {
                const error = await response.json()
                console.error('Error response:', error)
                alert(`Error creating task: ${error.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error creating task:', error)
            alert('Error creating task. Check console for details.')
        }
    }

    const addSubtask = async (groupId: string, parentTaskId: string) => {
        if (!newTask.title?.trim()) {
            console.log('No subtask title provided')
            return
        }

        console.log('Adding subtask:', newTask, 'to parent:', parentTaskId)

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newTask.title,
                    status: newTask.status,
                    priority: newTask.priority,
                    dueDate: newTask.date || undefined,
                    parentId: parentTaskId
                })
            })

            console.log('Subtask response status:', response.status)

            if (response.ok) {
                const result = await response.json()
                console.log('Subtask created:', result)

                // Optimistically update UI
                setGroups(groups.map(g => {
                    if (g.id === groupId) {
                        return {
                            ...g,
                            tasks: g.tasks.map(t => {
                                if (t.id === parentTaskId) {
                                    const subtasks = t.subtasks || []
                                    return {
                                        ...t,
                                        subtasks: [...subtasks, {
                                            id: result.task?.id || Date.now().toString(),
                                            title: newTask.title,
                                            status: newTask.status,
                                            date: newTask.date,
                                            groupId,
                                            parentId: parentTaskId
                                        }],
                                        expanded: true
                                    }
                                }
                                return t
                            })
                        }
                    }
                    return g
                }))

                setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] })
                setIsAddingSubtask(null)
                await fetchTasks()
            } else {
                const error = await response.json()
                console.error('Error response:', error)
                alert(`Error creating subtask: ${error.error || 'Unknown error'}`)
            }
        } catch (error) {
            console.error('Error creating subtask:', error)
            alert('Error creating subtask. Check console for details.')
        }
    }

    const deleteTask = async (taskId: string, groupId: string) => {
        if (!confirm('Are you sure you want to delete this task?')) return

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setGroups(groups.map(g =>
                    g.id === groupId
                        ? { ...g, tasks: g.tasks.filter(t => t.id !== taskId) }
                        : g
                ))
            } else {
                alert('Failed to delete task')
            }
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('Error deleting task')
        }
    }

    const deleteGroup = (groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        if (group && group.tasks.length > 0) {
            if (!confirm(`Delete group "${group.title}" and all ${group.tasks.length} tasks?`)) return
        }
        setGroups(groups.filter(g => g.id !== groupId))
    }

    const addGroup = () => {
        if (!newGroupName.trim()) return

        const newGroup: GanttGroup = {
            id: Date.now().toString(),
            title: newGroupName,
            expanded: true,
            tasks: []
        }

        setGroups([...groups, newGroup])
        setNewGroupName('')
        setIsAddingGroup(false)
    }

    const getGroupStatusCounts = (tasks: GanttTask[]) => {
        const counts = { TODO: 0, IN_PROGRESS: 0, COMPLETED: 0 }
        tasks.forEach(task => {
            counts[task.status]++
        })
        return counts
    }

    const duplicateTask = async (taskId: string, groupId: string) => {
        const group = groups.find(g => g.id === groupId)
        const task = group?.tasks.find(t => t.id === taskId)
        if (!task) return

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: `${task.title} (Copy)`,
                    status: task.status,
                    priority: 'MEDIUM',
                    dueDate: task.date || undefined
                })
            })

            if (response.ok) {
                await fetchTasks()
            }
        } catch (error) {
            console.error('Error duplicating task:', error)
        }
    }

    const clearAllFilters = () => {
        setSearchQuery('')
        setSearchType('all')
        setStatusFilter([])
        setPersonFilter([])
        setSortBy('none')
        setHideCompleted(false)
    }

    const openTaskDetail = (taskId: string, isSubtask: boolean, groupId: string, parentId?: string) => {
        setSelectedTask({ taskId, isSubtask, groupId, parentId })
        setShowTaskDetail(true)
        fetchTaskUpdates(taskId)
    }

    const fetchTaskUpdates = async (taskId: string) => {
        setLoadingUpdates(true)
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`)
            if (response.ok) {
                const data = await response.json()
                setTaskUpdates(data.comments || [])
            }
        } catch (error) {
            console.error('Error fetching updates:', error)
        } finally {
            setLoadingUpdates(false)
        }
    }

    const postTaskUpdate = async () => {
        if (!selectedTask || !newUpdate.trim()) return

        try {
            const response = await fetch(`/api/tasks/${selectedTask.taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newUpdate })
            })

            if (response.ok) {
                const data = await response.json()
                setTaskUpdates([data.comment, ...taskUpdates])
                setNewUpdate('')
            } else {
                alert('Failed to post update')
            }
        } catch (error) {
            console.error('Error posting update:', error)
            alert('Error posting update')
        }
    }

    const formatRelativeTime = (date: string) => {
        const now = new Date()
        const past = new Date(date)
        const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

        if (diffInSeconds < 60) return 'Just now'
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
        return past.toLocaleDateString()
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const newFiles = Array.from(files).map(file => ({
                name: file.name,
                size: file.size,
                uploadedAt: new Date()
            }))
            setUploadedFiles([...uploadedFiles, ...newFiles])
            // TODO: Upload files to server/storage
            alert(`${files.length} file(s) selected. Upload functionality will be implemented with cloud storage.`)
        }
        // Reset the input
        if (event.target) {
            event.target.value = ''
        }
    }

    const handleChooseFiles = () => {
        fileInputRef.current?.click()
    }

    const handleFileDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
            const newFiles = Array.from(files).map(file => ({
                name: file.name,
                size: file.size,
                uploadedAt: new Date()
            }))
            setUploadedFiles([...uploadedFiles, ...newFiles])
            // TODO: Upload files to server/storage
            alert(`${files.length} file(s) dropped. Upload functionality will be implemented with cloud storage.`)
        }
    }

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
    }

    const removeFile = (index: number) => {
        setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))
    }

    const displayGroups = filteredGroups.length > 0 ? filteredGroups : groups

    // Style Editor Dialog
    const StyleEditorDialog = ({ headerId, currentStyles }: { headerId: string; currentStyles?: { fontColor?: string; backgroundColor?: string } }) => {
        const [fontColor, setFontColor] = useState(currentStyles?.fontColor || '#000000')
        const [backgroundColor, setBackgroundColor] = useState(currentStyles?.backgroundColor || '#ffffff')

        return (
            <Dialog open={editingHeader?.id === headerId} onOpenChange={(open) => !open && setEditingHeader(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Header Style</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Font Color</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={fontColor}
                                    onChange={(e) => setFontColor(e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={fontColor}
                                    onChange={(e) => setFontColor(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Background Color</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    placeholder="#ffffff"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded border" style={{ color: fontColor, backgroundColor: backgroundColor }}>
                            Preview Text
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingHeader(null)}>
                            Cancel
                        </Button>
                        <Button onClick={() => updateHeaderStyle(headerId, fontColor, backgroundColor)}>
                            Apply
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    // Task Style Editor Dialog
    const TaskStyleEditorDialog = ({ taskId, currentStyles }: { taskId: string; currentStyles?: { fontColor?: string; backgroundColor?: string } }) => {
        const [fontColor, setFontColor] = useState(currentStyles?.fontColor || '#000000')
        const [backgroundColor, setBackgroundColor] = useState(currentStyles?.backgroundColor || '#ffffff')

        return (
            <Dialog open={editingTaskStyle?.taskId === taskId} onOpenChange={(open) => !open && setEditingTaskStyle(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Task Style</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Font Color</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={fontColor}
                                    onChange={(e) => setFontColor(e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={fontColor}
                                    onChange={(e) => setFontColor(e.target.value)}
                                    placeholder="#000000"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Background Color</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="h-10 w-20 rounded border cursor-pointer"
                                />
                                <Input
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    placeholder="#ffffff"
                                    className="flex-1"
                                />
                            </div>
                        </div>
                        <div className="p-4 rounded border" style={{ color: fontColor, backgroundColor: backgroundColor }}>
                            Preview Text
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditingTaskStyle(null)}>
                            Cancel
                        </Button>
                        <Button onClick={() => updateTaskStyle(taskId, fontColor, backgroundColor)}>
                            Apply
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Card ref={cardRef} className="h-full flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Gantt Board
                        </CardTitle>
                        <CardDescription className="text-xs">Organize tasks in groups</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {(searchQuery || statusFilter.length > 0 || personFilter.length > 0 || hideCompleted) && (
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={clearAllFilters}>
                                Clear Filters
                            </Button>
                        )}
                        {onToggleFullscreen && (
                            <Button variant="ghost" size="sm" onClick={() => onToggleFullscreen(widgetId)} className="h-8 w-8 p-0">
                                {fullscreenWidget === widgetId ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
                {/* Toolbar */}
                <div className="border-b bg-muted/30 p-2 flex items-center gap-2 flex-wrap">
                    {/* Left Section - Action Buttons */}
                    <div className="flex items-center gap-2">
                        {/* Add New Group */}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs border border-dashed" onClick={() => setIsAddingGroup(true)}>
                            <Plus className="h-3 w-3 mr-1" />
                            Add Group
                        </Button>

                        {/* New Item */}
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs border border-dashed" onClick={() => setIsAddingTask(groups[0]?.id || 'new')}>
                            <Plus className="h-3 w-3 mr-1" />
                            New Item
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    {/* Center Section - Search */}
                    <div className="flex-1 flex justify-center">
                        <div className="flex items-center border-2 border-input rounded-md h-8 w-96 bg-background overflow-hidden">
                            {/* Search Type Dropdown */}
                            <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                                <SelectTrigger className="h-full w-32 border-0 border-r-2 border-input rounded-none text-xs shadow-none focus:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="text-xs">All</SelectItem>
                                    <SelectItem value="project" className="text-xs">Project</SelectItem>
                                    <SelectItem value="task" className="text-xs">Task</SelectItem>
                                    <SelectItem value="subtask" className="text-xs">Subtask</SelectItem>
                                    <SelectItem value="people" className="text-xs">People</SelectItem>
                                    <SelectItem value="date" className="text-xs">Due Date</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Search Input */}
                            <div className="relative flex-1 flex items-center">
                                <Search className="h-3 w-3 absolute left-2.5 text-muted-foreground pointer-events-none" />
                                <Input
                                    placeholder={`Search ${searchType === 'all' ? 'everything' : searchType}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="h-full border-0 pl-8 pr-8 text-xs focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none shadow-none bg-transparent"
                                />
                                {searchQuery && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 w-5 p-0 absolute right-1 hover:bg-muted"
                                        onClick={() => setSearchQuery('')}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Section - Filters and Options */}
                    <div className="flex items-center gap-2">

                        {/* Consolidated Filter Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={statusFilter.length > 0 || personFilter.length > 0 || hideCompleted ? "default" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                >
                                    <Filter className="h-3 w-3 mr-1" />
                                    Filter
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64">
                                {/* Filter by Person */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Filter by Person</div>
                                {getUniquePersons().length > 0 ? (
                                    getUniquePersons().map(person => (
                                        <DropdownMenuCheckboxItem
                                            key={person}
                                            checked={personFilter.includes(person)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setPersonFilter([...personFilter, person])
                                                } else {
                                                    setPersonFilter(personFilter.filter(p => p !== person))
                                                }
                                            }}
                                        >
                                            {person}
                                        </DropdownMenuCheckboxItem>
                                    ))
                                ) : (
                                    <div className="px-2 py-2 text-xs text-muted-foreground">No people assigned yet</div>
                                )}

                                <DropdownMenuSeparator />

                                {/* Filter by Status */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Filter by Status</div>
                                {['TODO', 'IN_PROGRESS', 'COMPLETED'].map(status => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={statusFilter.includes(status)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setStatusFilter([...statusFilter, status])
                                            } else {
                                                setStatusFilter(statusFilter.filter(s => s !== status))
                                            }
                                        }}
                                    >
                                        {getStatusLabel(status)}
                                    </DropdownMenuCheckboxItem>
                                ))}

                                <DropdownMenuSeparator />

                                {/* Hide Options */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Hide</div>
                                <DropdownMenuCheckboxItem checked={hideCompleted} onCheckedChange={setHideCompleted}>
                                    Hide Completed Tasks
                                </DropdownMenuCheckboxItem>

                                <DropdownMenuSeparator />

                                {/* Column Visibility */}
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Show/Hide Columns</div>
                                <DropdownMenuCheckboxItem checked={visibleColumns.person} onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, person: checked })}>
                                    Person Column
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleColumns.status} onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, status: checked })}>
                                    Status Column
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem checked={visibleColumns.date} onCheckedChange={(checked) => setVisibleColumns({ ...visibleColumns, date: checked })}>
                                    Date Column
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Separate Sort Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant={sortBy !== 'none' ? "default" : "ghost"}
                                    size="sm"
                                    className="h-8 px-2 text-xs"
                                >
                                    <SortAsc className="h-3 w-3 mr-1" />
                                    Sort
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sort By</div>
                                <DropdownMenuItem onClick={() => setSortBy('none')}>No sorting</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('name')}>Sort by Name</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('date')}>Sort by Date</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSortBy('status')}>Sort by Status</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* More Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => fetchTasks()}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh Tasks
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsAddingGroup(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Group
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => alert('Export functionality coming soon')}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Board
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert('Import functionality coming soon')}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import Tasks
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => { setHideCompleted(true); alert('Completed tasks hidden') }}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Archive Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => alert('Settings coming soon')}>
                                    <Settings className="h-4 w-4 mr-2" />
                                    Board Settings
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Add New Group Form */}
                {isAddingGroup && (
                    <div className="px-4 py-3 border-b border-border bg-muted/30">
                        <div className="flex items-center gap-2">
                            <Input
                                placeholder="Group name..."
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addGroup()
                                    if (e.key === 'Escape') {
                                        setIsAddingGroup(false)
                                        setNewGroupName('')
                                    }
                                }}
                                autoFocus
                                className="h-8 max-w-xs"
                            />
                            <Button size="sm" onClick={addGroup} className="h-8"><Save className="h-3 w-3" /></Button>
                            <Button size="sm" variant="ghost" onClick={() => { setIsAddingGroup(false); setNewGroupName('') }} className="h-8"><X className="h-3 w-3" /></Button>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <div className="min-w-full border border-border relative">
                        {/* Vertical grid lines overlay */}
                        <div className="absolute inset-0 pointer-events-none z-[5]">
                            <div
                                className="h-full grid px-6"
                                style={{ gridTemplateColumns: getGridTemplateColumns() }}
                            >
                                <div className="border-r border-border"></div>
                                {visibleColumns.person && <div className="border-r border-border"></div>}
                                {visibleColumns.status && <div className="border-r border-border"></div>}
                                {visibleColumns.date && <div className="border-r border-border"></div>}
                                {customColumns.map((col) => (
                                    <div key={col.id} className="border-r border-border"></div>
                                ))}
                            </div>
                        </div>

                        {/* Groups */}
                        {displayGroups.length > 0 && (
                            displayGroups.map((group) => (
                                <div key={group.id} className="border-b border-border">
                                    {/* Style Editor for Group */}
                                    <StyleEditorDialog headerId={`group-${group.id}`} currentStyles={headerStyles[`group-${group.id}`]} />

                                    {/* Group Name */}
                                    <div
                                        className="px-6 py-3 flex items-center gap-2 border-b border-border cursor-pointer hover:opacity-80 transition-opacity relative group/header z-10 bg-background"
                                        style={{
                                            color: headerStyles[`group-${group.id}`]?.fontColor,
                                            backgroundColor: headerStyles[`group-${group.id}`]?.backgroundColor || 'hsl(var(--background))'
                                        }}
                                        onDoubleClick={() => setEditingHeader({ type: 'group', id: `group-${group.id}` })}
                                        onKeyDown={(e) => {
                                            if (e.key === 'F2') {
                                                e.preventDefault()
                                                setEditingHeader({ type: 'group', id: `group-${group.id}` })
                                            }
                                        }}
                                        tabIndex={0}
                                        title="Double-click or press F2 to edit colors"
                                    >
                                        <Palette className="h-3 w-3 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity absolute left-1 top-1/2 -translate-y-1/2" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                toggleGroupExpanded(group.id)
                                            }}
                                        >
                                            {group.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </Button>
                                        <span className="text-base font-bold">{group.title}</span>
                                        <span className="text-xs text-muted-foreground">({group.tasks.length})</span>

                                        {group.tasks.length > 0 && (
                                            <div className="ml-auto flex items-center gap-2">
                                                <div className="flex h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                    {(() => {
                                                        const counts = getGroupStatusCounts(group.tasks)
                                                        const total = group.tasks.length
                                                        return (
                                                            <>
                                                                {counts.COMPLETED > 0 && <div className="bg-green-500" style={{ width: `${(counts.COMPLETED / total) * 100}%` }} />}
                                                                {counts.IN_PROGRESS > 0 && <div className="bg-orange-500" style={{ width: `${(counts.IN_PROGRESS / total) * 100}%` }} />}
                                                            </>
                                                        )
                                                    })()}
                                                </div>

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-3 w-3" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => setIsAddingTask(group.id)}>
                                                            <Plus className="h-4 w-4 mr-2" />
                                                            Add Task
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => deleteGroup(group.id)} className="text-red-600">
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Group
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>

                                    {/* Group Tasks */}
                                    {group.expanded && (
                                        <div>
                                            {/* Style Editor for Task Header */}
                                            <StyleEditorDialog headerId={`task-header-${group.id}`} currentStyles={headerStyles[`task-header-${group.id}`]} />

                                            {/* Task Header */}
                                            <div
                                                className="border-b border-border cursor-pointer hover:opacity-80 transition-opacity relative group/header"
                                                onDoubleClick={() => setEditingHeader({ type: 'task', id: `task-header-${group.id}` })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'F2') {
                                                        e.preventDefault()
                                                        setEditingHeader({ type: 'task', id: `task-header-${group.id}` })
                                                    }
                                                }}
                                                tabIndex={0}
                                                style={{
                                                    color: headerStyles[`task-header-${group.id}`]?.fontColor,
                                                    backgroundColor: headerStyles[`task-header-${group.id}`]?.backgroundColor
                                                }}
                                                title="Double-click or press F2 to edit colors"
                                            >
                                                <Palette className="h-3 w-3 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity absolute left-1 top-1/2 -translate-y-1/2 z-10" />
                                                <div
                                                    className="grid px-6 py-2 text-xs font-semibold"
                                                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                                                >
                                                    <div className="px-2 relative">
                                                        Task
                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize hover:bg-blue-500 hover:w-3 transition-all z-20 group"
                                                            onMouseDown={(e) => handleResizeStart(e, 'title')}
                                                            title="Drag to resize column"
                                                        />
                                                    </div>
                                                    {visibleColumns.person && (
                                                        <div className="flex justify-center items-center px-2 relative">
                                                            Person
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize hover:bg-blue-500 hover:w-3 transition-all z-20"
                                                                onMouseDown={(e) => handleResizeStart(e, 'person')}
                                                                title="Drag to resize column"
                                                            />
                                                        </div>
                                                    )}
                                                    {visibleColumns.status && (
                                                        <div className="flex justify-center items-center px-2 relative">
                                                            Status
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize hover:bg-blue-500 hover:w-3 transition-all z-20"
                                                                onMouseDown={(e) => handleResizeStart(e, 'status')}
                                                                title="Drag to resize column"
                                                            />
                                                        </div>
                                                    )}
                                                    {visibleColumns.date && (
                                                        <div className="flex justify-center items-center px-2 relative">
                                                            Date
                                                            <div
                                                                className="absolute right-0 top-0 bottom-0 w-2 -mr-1 cursor-col-resize hover:bg-blue-500 hover:w-3 transition-all z-20"
                                                                onMouseDown={(e) => handleResizeStart(e, 'date')}
                                                                title="Drag to resize column"
                                                            />
                                                        </div>
                                                    )}
                                                    {customColumns.map((column) => (
                                                        <div key={column.id} className="flex justify-center items-center px-2 relative group/customcol">
                                                            {column.name}
                                                            <button
                                                                className="ml-1 opacity-0 group-hover/customcol:opacity-100 hover:text-red-500"
                                                                onClick={() => setCustomColumns(customColumns.filter(c => c.id !== column.id))}
                                                                title="Remove column"
                                                            >
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Add Column Button */}
                                                <button
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded hover:bg-accent transition-colors z-20"
                                                    onClick={() => {
                                                        const columnName = prompt('Enter column name:')
                                                        if (columnName) {
                                                            setCustomColumns([...customColumns, { id: Date.now().toString(), name: columnName }])
                                                        }
                                                    }}
                                                    title="Add column"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {group.tasks.map((task) => (
                                                <div key={task.id}>
                                                    {/* Task Style Editor */}
                                                    <TaskStyleEditorDialog taskId={task.id} currentStyles={taskStyles[task.id]} />

                                                    {/* Main Task Row */}
                                                    <div
                                                        className="grid px-6 py-3 border-b border-border hover:bg-accent/30 transition-colors items-center group cursor-move relative"
                                                        style={{
                                                            gridTemplateColumns: getGridTemplateColumns(),
                                                            color: taskStyles[task.id]?.fontColor,
                                                            backgroundColor: taskStyles[task.id]?.backgroundColor
                                                        }}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, task.id, group.id, false)}
                                                        onDragOver={(e) => handleDragOver(e, task.id, group.id)}
                                                        onDragEnd={handleDragEnd}
                                                        onDrop={(e) => handleDrop(e, task.id, group.id)}
                                                    >
                                                        <div className="flex items-center gap-1 -ml-2 px-2">
                                                            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                                                            {task.subtasks && task.subtasks.length > 0 ? (
                                                                <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={(e) => { e.stopPropagation(); toggleTaskExpanded(group.id, task.id); }}>
                                                                    {task.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                                                </Button>
                                                            ) : (
                                                                <div className="h-4 w-4" />
                                                            )}
                                                            {editingTaskName?.taskId === task.id && !editingTaskName.isSubtask ? (
                                                                <Input
                                                                    value={editingTaskTitle}
                                                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault()
                                                                            saveTaskName()
                                                                        }
                                                                        if (e.key === 'Escape') {
                                                                            e.preventDefault()
                                                                            cancelEditingTaskName()
                                                                        }
                                                                    }}
                                                                    onBlur={saveTaskName}
                                                                    autoFocus
                                                                    className="h-7 text-sm flex-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="text-sm truncate font-medium cursor-text hover:bg-accent/50 px-1 py-0.5 rounded transition-colors"
                                                                    onDoubleClick={(e) => {
                                                                        e.stopPropagation()
                                                                        startEditingTaskName(task.id, task.title, false, group.id)
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'F2') {
                                                                            e.preventDefault()
                                                                            startEditingTaskName(task.id, task.title, false, group.id)
                                                                        }
                                                                    }}
                                                                    tabIndex={0}
                                                                    title="Double-click or press F2 to edit"
                                                                >
                                                                    {task.title}
                                                                </span>
                                                            )}
                                                            {task.subtasks && task.subtasks.length > 0 && (
                                                                <span className="text-xs text-muted-foreground">({task.subtasks.length})</span>
                                                            )}
                                                        </div>
                                                        {visibleColumns.person && (
                                                            <div className="flex justify-center px-2">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <button className="focus:outline-none cursor-pointer">
                                                                            {task.personName ? (
                                                                                <Avatar className="h-6 w-6 hover:ring-2 hover:ring-purple-400 transition-all">
                                                                                    <AvatarFallback className="text-[10px] bg-purple-600 text-white">
                                                                                        {getInitials(task.personName)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                            ) : (
                                                                                <div className="h-6 w-6 rounded-full border-2 border-dashed border-purple-400/50 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all" />
                                                                            )}
                                                                        </button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="start" className="w-56">
                                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Assign to</div>
                                                                        {teamMembers.map((member) => (
                                                                            <DropdownMenuItem
                                                                                key={member.id}
                                                                                onClick={() => assignUserToTask(task.id, member.id, false, group.id)}
                                                                                className="cursor-pointer"
                                                                            >
                                                                                <Avatar className="h-5 w-5 mr-2">
                                                                                    <AvatarFallback className="text-[9px] bg-purple-600 text-white">
                                                                                        {getInitials(member.name || member.email)}
                                                                                    </AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-sm">{member.name || member.email}</span>
                                                                                    {member.name && <span className="text-xs text-muted-foreground">{member.email}</span>}
                                                                                </div>
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                        {teamMembers.length === 0 && (
                                                                            <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                                                                                No team members found
                                                                            </div>
                                                                        )}
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        )}
                                                        {visibleColumns.status && (
                                                            <div className="flex justify-center px-2">
                                                                <Badge className={cn("text-xs font-medium px-3 py-1 rounded-sm", getStatusColor(task.status))}>
                                                                    {getStatusLabel(task.status)}
                                                                </Badge>
                                                            </div>
                                                        )}
                                                        {visibleColumns.date && (
                                                            <div className="flex items-center justify-center px-2">
                                                                <span className="text-xs text-muted-foreground">
                                                                    {task.date ? new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Action Icons - Positioned at top right */}
                                                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingTaskStyle({ taskId: task.id, isSubtask: false })
                                                                }}
                                                                title="Edit colors"
                                                            >
                                                                <Palette className="h-3 w-3" />
                                                            </Button>

                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 w-6 p-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    openTaskDetail(task.id, false, group.id)
                                                                }}
                                                                title="View updates & documents"
                                                            >
                                                                <MessageSquare className="h-3 w-3" />
                                                            </Button>

                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => e.stopPropagation()}>
                                                                        <MoreHorizontal className="h-3 w-3" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => setIsAddingSubtask(task.id)}>
                                                                        <Plus className="h-4 w-4 mr-2" />
                                                                        Add Subtask
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => duplicateTask(task.id, group.id)}>
                                                                        <Copy className="h-4 w-4 mr-2" />
                                                                        Duplicate
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => alert('Edit coming soon')}>
                                                                        <Edit2 className="h-4 w-4 mr-2" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem onClick={() => deleteTask(task.id, group.id)} className="text-red-600">
                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                        {customColumns.map((column) => (
                                                            <div key={column.id} className="flex items-center px-2 text-xs text-muted-foreground">
                                                                -
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Subtasks */}
                                                    {task.expanded && task.subtasks && task.subtasks.length > 0 && (
                                                        <div className="border-l-[3px] border-blue-400 ml-12">
                                                            {/* Style Editor for Subtask Header */}
                                                            <StyleEditorDialog headerId={`subtask-header-${task.id}`} currentStyles={headerStyles[`subtask-header-${task.id}`]} />

                                                            {/* Subtask Header */}
                                                            <div
                                                                className="border-b border-border cursor-pointer hover:opacity-80 transition-opacity relative group/header"
                                                                onDoubleClick={() => setEditingHeader({ type: 'task', id: `subtask-header-${task.id}` })}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'F2') {
                                                                        e.preventDefault()
                                                                        setEditingHeader({ type: 'task', id: `subtask-header-${task.id}` })
                                                                    }
                                                                }}
                                                                tabIndex={0}
                                                                style={{
                                                                    color: headerStyles[`subtask-header-${task.id}`]?.fontColor,
                                                                    backgroundColor: headerStyles[`subtask-header-${task.id}`]?.backgroundColor
                                                                }}
                                                                title="Double-click or press F2 to edit colors"
                                                            >
                                                                <Palette className="h-3 w-3 text-muted-foreground opacity-0 group-hover/header:opacity-100 transition-opacity absolute left-1 top-1/2 -translate-y-1/2 z-10" />
                                                                <div
                                                                    className="grid px-6 py-2 text-xs font-semibold"
                                                                    style={{ gridTemplateColumns: getGridTemplateColumns() }}
                                                                >
                                                                    <div className="pl-16 px-2 flex items-center">Sub-task</div>
                                                                    {visibleColumns.person && <div className="flex items-center px-4">Person</div>}
                                                                    {visibleColumns.status && <div className="flex items-center px-4">Status</div>}
                                                                    {visibleColumns.date && <div className="flex items-center px-4">Date</div>}
                                                                    {customColumns.map((column) => (
                                                                        <div key={column.id} className="flex items-center px-2 text-muted-foreground">
                                                                            {column.name}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {task.subtasks.map((subtask, index) => (
                                                                <div key={subtask.id}>
                                                                    {/* Subtask Style Editor */}
                                                                    <TaskStyleEditorDialog taskId={subtask.id} currentStyles={taskStyles[subtask.id]} />

                                                                    <div
                                                                        key={subtask.id}
                                                                        className="grid px-6 py-2 border-b border-border hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors items-center group cursor-move relative"
                                                                        style={{
                                                                            gridTemplateColumns: getGridTemplateColumns(),
                                                                            color: taskStyles[subtask.id]?.fontColor,
                                                                            backgroundColor: taskStyles[subtask.id]?.backgroundColor
                                                                        }}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, subtask.id, group.id, true, task.id)}
                                                                        onDragOver={(e) => handleDragOver(e, subtask.id, group.id, task.id)}
                                                                        onDragEnd={handleDragEnd}
                                                                        onDrop={(e) => handleDrop(e, subtask.id, group.id, task.id)}
                                                                    >
                                                                        <div className="flex items-center gap-1 pl-16 px-2">
                                                                            {editingTaskName?.taskId === subtask.id && editingTaskName.isSubtask ? (
                                                                                <Input
                                                                                    value={editingTaskTitle}
                                                                                    onChange={(e) => setEditingTaskTitle(e.target.value)}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            e.preventDefault()
                                                                                            saveTaskName()
                                                                                        }
                                                                                        if (e.key === 'Escape') {
                                                                                            e.preventDefault()
                                                                                            cancelEditingTaskName()
                                                                                        }
                                                                                    }}
                                                                                    onBlur={saveTaskName}
                                                                                    autoFocus
                                                                                    className="h-7 text-sm flex-1"
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                />
                                                                            ) : (
                                                                                <span
                                                                                    className="text-sm cursor-text hover:bg-accent/50 px-1 py-0.5 rounded transition-colors"
                                                                                    style={{ color: taskStyles[subtask.id]?.fontColor || 'hsl(var(--muted-foreground))' }}
                                                                                    onDoubleClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        startEditingTaskName(subtask.id, subtask.title, true, group.id, task.id)
                                                                                    }}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'F2') {
                                                                                            e.preventDefault()
                                                                                            startEditingTaskName(subtask.id, subtask.title, true, group.id, task.id)
                                                                                        }
                                                                                    }}
                                                                                    tabIndex={0}
                                                                                    title="Double-click or press F2 to edit"
                                                                                >
                                                                                    {subtask.title}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {visibleColumns.person && (
                                                                            <div className="flex items-center px-4">
                                                                                <DropdownMenu>
                                                                                    <DropdownMenuTrigger asChild>
                                                                                        <button className="focus:outline-none cursor-pointer">
                                                                                            {subtask.personName ? (
                                                                                                <Avatar className="h-6 w-6 hover:ring-2 hover:ring-purple-400 transition-all">
                                                                                                    <AvatarFallback className="text-[10px] bg-purple-600 text-white">
                                                                                                        {getInitials(subtask.personName)}
                                                                                                    </AvatarFallback>
                                                                                                </Avatar>
                                                                                            ) : (
                                                                                                <div className="h-6 w-6 rounded-full border-2 border-dashed border-purple-400/50 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all" />
                                                                                            )}
                                                                                        </button>
                                                                                    </DropdownMenuTrigger>
                                                                                    <DropdownMenuContent align="start" className="w-56">
                                                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Assign to</div>
                                                                                        {teamMembers.map((member) => (
                                                                                            <DropdownMenuItem
                                                                                                key={member.id}
                                                                                                onClick={() => assignUserToTask(subtask.id, member.id, true, group.id, task.id)}
                                                                                                className="cursor-pointer"
                                                                                            >
                                                                                                <Avatar className="h-5 w-5 mr-2">
                                                                                                    <AvatarFallback className="text-[9px] bg-purple-600 text-white">
                                                                                                        {getInitials(member.name || member.email)}
                                                                                                    </AvatarFallback>
                                                                                                </Avatar>
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-sm">{member.name || member.email}</span>
                                                                                                    {member.name && <span className="text-xs text-muted-foreground">{member.email}</span>}
                                                                                                </div>
                                                                                            </DropdownMenuItem>
                                                                                        ))}
                                                                                        {teamMembers.length === 0 && (
                                                                                            <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                                                                                                No team members found
                                                                                            </div>
                                                                                        )}
                                                                                    </DropdownMenuContent>
                                                                                </DropdownMenu>
                                                                            </div>
                                                                        )}
                                                                        {visibleColumns.status && (
                                                                            <div className="flex items-center px-4">
                                                                                <Badge className={cn("text-[10px] font-medium px-2 py-0.5 rounded-sm", getStatusColor(subtask.status))}>
                                                                                    {getStatusLabel(subtask.status)}
                                                                                </Badge>
                                                                            </div>
                                                                        )}
                                                                        {visibleColumns.date && (
                                                                            <div className="flex items-center px-4">
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {subtask.date ? new Date(subtask.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                                                </span>
                                                                            </div>
                                                                        )}

                                                                        {/* Action Icons - Positioned at top right */}
                                                                        <div className="absolute top-1 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-5 w-5 p-0"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    setEditingTaskStyle({ taskId: subtask.id, isSubtask: true })
                                                                                }}
                                                                                title="Edit colors"
                                                                            >
                                                                                <Palette className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                className="h-5 w-5 p-0"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation()
                                                                                    openTaskDetail(subtask.id, true, group.id, task.id)
                                                                                }}
                                                                                title="View updates & documents"
                                                                            >
                                                                                <MessageSquare className="h-3 w-3" />
                                                                            </Button>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                        <MoreHorizontal className="h-3 w-3" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem onClick={() => deleteTask(subtask.id, group.id)} className="text-red-600">
                                                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                                                        Delete Subtask
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                        {customColumns.map((column) => (
                                                                            <div key={column.id} className="flex items-center px-2 text-xs text-muted-foreground">
                                                                                -
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}

                                                        </div>
                                                    )}

                                                    {/* Add Subtask Form */}
                                                    {isAddingSubtask === task.id && (
                                                        <div className="border-l-[3px] border-cyan-400 ml-12 bg-gray-50/40 dark:bg-gray-900/20">
                                                            {/* Show existing subtasks if any */}
                                                            {task.subtasks && task.subtasks.map((subtask) => (
                                                                <div key={subtask.id} className={cn(
                                                                    "grid gap-2 px-4 py-2 border-b hover:bg-gray-100/50 dark:hover:bg-gray-800/30 transition-colors items-center group relative",
                                                                    visibleColumns.person && visibleColumns.status && visibleColumns.date ? "grid-cols-12" : "grid-cols-10"
                                                                )}>
                                                                    <div className={cn("flex items-center gap-2 pl-8", visibleColumns.person && visibleColumns.status && visibleColumns.date ? "col-span-5" : "col-span-7")}>
                                                                        <span className="text-sm text-muted-foreground">{subtask.title}</span>
                                                                    </div>
                                                                    {visibleColumns.person && (
                                                                        <div className="col-span-2">
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <button className="focus:outline-none cursor-pointer">
                                                                                        {subtask.personName ? (
                                                                                            <Avatar className="h-6 w-6 hover:ring-2 hover:ring-purple-400 transition-all">
                                                                                                <AvatarFallback className="text-[10px] bg-purple-600 text-white">
                                                                                                    {getInitials(subtask.personName)}
                                                                                                </AvatarFallback>
                                                                                            </Avatar>
                                                                                        ) : (
                                                                                            <div className="h-6 w-6 rounded-full border-2 border-dashed border-purple-400/50 hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-all" />
                                                                                        )}
                                                                                    </button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="start" className="w-56">
                                                                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Assign to</div>
                                                                                    {teamMembers.map((member) => (
                                                                                        <DropdownMenuItem
                                                                                            key={member.id}
                                                                                            onClick={() => assignUserToTask(subtask.id, member.id, true, group.id, task.id)}
                                                                                            className="cursor-pointer"
                                                                                        >
                                                                                            <Avatar className="h-5 w-5 mr-2">
                                                                                                <AvatarFallback className="text-[9px] bg-purple-600 text-white">
                                                                                                    {getInitials(member.name || member.email)}
                                                                                                </AvatarFallback>
                                                                                            </Avatar>
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-sm">{member.name || member.email}</span>
                                                                                                {member.name && <span className="text-xs text-muted-foreground">{member.email}</span>}
                                                                                            </div>
                                                                                        </DropdownMenuItem>
                                                                                    ))}
                                                                                    {teamMembers.length === 0 && (
                                                                                        <div className="px-2 py-4 text-xs text-muted-foreground text-center">
                                                                                            No team members found
                                                                                        </div>
                                                                                    )}
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    )}
                                                                    {visibleColumns.status && (
                                                                        <div className="col-span-3">
                                                                            <Badge className={cn("text-[10px] font-medium px-2 py-0.5 rounded-sm", getStatusColor(subtask.status))}>
                                                                                {getStatusLabel(subtask.status)}
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    {visibleColumns.date && (
                                                                        <div className="col-span-2">
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {subtask.date ? new Date(subtask.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                                            </span>
                                                                        </div>
                                                                    )}

                                                                    {/* Action Icons - Positioned at top right */}
                                                                    <div className="absolute top-1 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-5 w-5 p-0"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation()
                                                                                openTaskDetail(subtask.id, true, group.id, task.id)
                                                                            }}
                                                                            title="View updates & documents"
                                                                        >
                                                                            <MessageSquare className="h-3 w-3" />
                                                                        </Button>
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => e.stopPropagation()}>
                                                                                    <MoreHorizontal className="h-3 w-3" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem onClick={() => deleteTask(subtask.id, group.id)} className="text-red-600">
                                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                                    Delete Subtask
                                                                                </DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Add Subtask Input Form */}
                                                            {isAddingSubtask === task.id && (
                                                                <div className={cn(
                                                                    "grid px-6 py-2 border-b border-border bg-blue-50/50 items-center [&>*]:px-2",
                                                                    visibleColumns.person && visibleColumns.status && visibleColumns.date ? "grid-cols-12" : "grid-cols-10"
                                                                )}>
                                                                    <div className={cn("pl-8", visibleColumns.person && visibleColumns.status && visibleColumns.date ? "col-span-5" : "col-span-6")}>
                                                                        <Input
                                                                            placeholder="Enter subitem name..."
                                                                            value={newTask.title}
                                                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Enter') addSubtask(group.id, task.id)
                                                                                if (e.key === 'Escape') {
                                                                                    setIsAddingSubtask(null)
                                                                                    setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] })
                                                                                }
                                                                            }}
                                                                            autoFocus
                                                                            className="h-8 text-sm border-blue-300 focus:border-blue-500"
                                                                        />
                                                                    </div>
                                                                    {visibleColumns.person && <div className="col-span-2"><div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30" /></div>}
                                                                    {visibleColumns.status && (
                                                                        <div className="col-span-3">
                                                                            <Select value={newTask.status} onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}>
                                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="TODO">To Do</SelectItem>
                                                                                    <SelectItem value="IN_PROGRESS">Working on it</SelectItem>
                                                                                    <SelectItem value="COMPLETED">Done</SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    )}
                                                                    <div className="col-span-2 flex gap-1">
                                                                        <Button size="sm" onClick={() => addSubtask(group.id, task.id)} className="h-7"><Save className="h-3 w-3" /></Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => { setIsAddingSubtask(null); setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] }) }} className="h-7"><X className="h-3 w-3" /></Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                </div>
                                            ))}

                                            {/* Add Item in Group */}
                                            {isAddingTask === group.id ? (
                                                <div className={cn("grid px-6 py-3 border-b border-border bg-accent/20 items-center [&>*]:px-2", visibleColumns.person && visibleColumns.status && visibleColumns.date ? "grid-cols-12" : "grid-cols-10")}>
                                                    <div className={visibleColumns.person && visibleColumns.status && visibleColumns.date ? "col-span-5" : "col-span-6"}>
                                                        <Input
                                                            placeholder="Enter item name..."
                                                            value={newTask.title}
                                                            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') addTask(group.id)
                                                                if (e.key === 'Escape') {
                                                                    setIsAddingTask(null)
                                                                    setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] })
                                                                }
                                                            }}
                                                            autoFocus
                                                            className="h-8"
                                                        />
                                                    </div>
                                                    {visibleColumns.person && <div className="col-span-2"><div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground/30" /></div>}
                                                    {visibleColumns.status && (
                                                        <div className="col-span-3">
                                                            <Select value={newTask.status} onValueChange={(value: any) => setNewTask({ ...newTask, status: value })}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="TODO">To Do</SelectItem>
                                                                    <SelectItem value="IN_PROGRESS">Working on it</SelectItem>
                                                                    <SelectItem value="COMPLETED">Done</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    )}
                                                    <div className="col-span-2 flex gap-1">
                                                        <Button size="sm" onClick={() => addTask(group.id)} className="h-7"><Save className="h-3 w-3" /></Button>
                                                        <Button size="sm" variant="ghost" onClick={() => { setIsAddingTask(null); setNewTask({ title: '', status: 'TODO', priority: 'MEDIUM', date: '', subtasks: [] }) }} className="h-7"><X className="h-3 w-3" /></Button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Empty State - Moved below table */}
                    {displayGroups.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <Network className="h-12 w-12 text-muted-foreground mb-3" />
                            <h3 className="text-sm font-semibold mb-2">
                                {searchQuery || statusFilter.length > 0 || personFilter.length > 0 ? 'No tasks match your filters' : 'No groups yet'}
                            </h3>
                            <p className="text-xs text-muted-foreground mb-4">
                                {searchQuery || statusFilter.length > 0 || personFilter.length > 0 ? 'Try adjusting your filters' : 'Create your first group to get started'}
                            </p>
                            {!(searchQuery || statusFilter.length > 0 || personFilter.length > 0) && (
                                <Button size="sm" onClick={() => setIsAddingGroup(true)}>
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Group
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>

            {/* Task Detail Dialog */}
            <Dialog open={showTaskDetail} onOpenChange={(open) => {
                setShowTaskDetail(open)
                if (!open) {
                    setTaskUpdates([])
                    setNewUpdate('')
                    setUploadedFiles([])
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Task Details</DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="updates" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="updates">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Updates
                            </TabsTrigger>
                            <TabsTrigger value="documents">
                                <FileText className="h-4 w-4 mr-2" />
                                Documents
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="updates" className="space-y-4 mt-4">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Add an update..."
                                    className="flex-1"
                                    value={newUpdate}
                                    onChange={(e) => setNewUpdate(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            postTaskUpdate()
                                        }
                                    }}
                                />
                                <Button onClick={postTaskUpdate} disabled={!newUpdate.trim()}>
                                    Post Update
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold">Recent Updates</div>
                                <div className="space-y-2">
                                    {loadingUpdates ? (
                                        <div className="text-sm text-muted-foreground text-center py-8">
                                            Loading updates...
                                        </div>
                                    ) : taskUpdates.length > 0 ? (
                                        taskUpdates.map((update) => (
                                            <div key={update.id} className="border rounded-lg p-3 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarFallback className="text-[9px] bg-blue-600 text-white">
                                                                {getInitials(update.user.firstName || update.user.name || update.user.email)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm font-medium">
                                                            {update.user.firstName && update.user.lastName
                                                                ? `${update.user.firstName} ${update.user.lastName}`
                                                                : update.user.name || update.user.email}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatRelativeTime(update.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{update.content}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-8">
                                            No updates yet. Be the first to add one!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="documents" className="space-y-4 mt-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                                accept="*/*"
                            />

                            <div
                                className="border-2 border-dashed rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
                                onDragOver={handleFileDragOver}
                                onDrop={handleFileDrop}
                                onClick={handleChooseFiles}
                            >
                                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">Upload Documents</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Drag and drop files here or click to browse
                                </p>
                                <Button variant="outline" type="button" onClick={(e) => {
                                    e.stopPropagation()
                                    handleChooseFiles()
                                }}>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose Files
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div className="text-sm font-semibold">Uploaded Documents</div>
                                {uploadedFiles.length > 0 ? (
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div key={index} className="border rounded-lg p-3 flex items-center justify-between hover:bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <div className="text-sm font-medium">{file.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatFileSize(file.size)} • {formatRelativeTime(file.uploadedAt.toISOString())}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFile(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        No documents uploaded yet
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

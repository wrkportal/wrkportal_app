'use client'

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ProjectStatus, RAGStatus } from "@/types"
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react"

interface GanttTask {
    id: string
    title: string
    status: string
    startDate: Date | null
    dueDate: Date | null
    progress: number
    parentId: string | null
    tags: string[]
}

interface GanttProject {
    id: string
    name: string
    code: string
    status: ProjectStatus
    ragStatus: RAGStatus
    startDate: Date
    endDate: Date
    progress: number
    programId?: string
}

interface GanttChartProps {
    projects: GanttProject[]
}

export function GanttChart({ projects }: GanttChartProps) {
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
    const [projectTasks, setProjectTasks] = useState<Record<string, GanttTask[]>>({})
    const [loadingTasks, setLoadingTasks] = useState<Set<string>>(new Set())

    // Handle empty or undefined projects
    if (!projects || projects.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                <div className="text-center">
                    <p className="text-muted-foreground">No projects to display in Gantt chart</p>
                </div>
            </div>
        )
    }

    // Fetch tasks for a project
    const fetchProjectTasks = async (projectId: string) => {
        if (projectTasks[projectId]) return // Already loaded

        setLoadingTasks(prev => new Set(prev).add(projectId))
        
        try {
            const response = await fetch(`/api/projects/${projectId}/tasks`)
            if (response.ok) {
                const data = await response.json()
                setProjectTasks(prev => ({
                    ...prev,
                    [projectId]: data.tasks || []
                }))
            }
        } catch (error) {
            console.error('Error fetching tasks:', error)
        } finally {
            setLoadingTasks(prev => {
                const newSet = new Set(prev)
                newSet.delete(projectId)
                return newSet
            })
        }
    }

    // Toggle project expansion
    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects)
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId)
        } else {
            newExpanded.add(projectId)
            fetchProjectTasks(projectId)
        }
        setExpandedProjects(newExpanded)
    }

    // Calculate timeline range
    const allDates = projects.flatMap(p => [new Date(p.startDate), new Date(p.endDate)])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    // Round to start/end of month
    minDate.setDate(1)
    maxDate.setMonth(maxDate.getMonth() + 1)
    maxDate.setDate(0)

    // Generate months for timeline
    const months: Date[] = []
    const current = new Date(minDate)
    while (current <= maxDate) {
        months.push(new Date(current))
        current.setMonth(current.getMonth() + 1)
    }

    // Generate days for each month
    const getDaysInMonth = (monthDate: Date) => {
        const year = monthDate.getFullYear()
        const month = monthDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const days: Date[] = []
        
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d))
        }
        
        return days
    }

    // Calculate total days in timeline
    const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))

    // Function to calculate position and width for a project
    const getProjectPosition = (project: GanttProject) => {
        const start = new Date(project.startDate)
        const end = new Date(project.endDate)

        const startDays = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        const left = (startDays / totalDays) * 100
        const width = (duration / totalDays) * 100

        return { left: `${left}%`, width: `${width}%` }
    }

    // Function to calculate position and width for a task
    const getTaskPosition = (task: GanttTask) => {
        if (!task.startDate || !task.dueDate) return null

        const start = new Date(task.startDate)
        const end = new Date(task.dueDate)

        const startDays = Math.ceil((start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

        const left = (startDays / totalDays) * 100
        const width = Math.max((duration / totalDays) * 100, 2) // Minimum width of 2%

        return { left: `${left}%`, width: `${width}%` }
    }

    const getStatusColor = (status: ProjectStatus) => {
        const colors = {
            PLANNED: 'bg-slate-500',
            IN_PROGRESS: 'bg-blue-500',
            ON_HOLD: 'bg-amber-500',
            COMPLETED: 'bg-green-500',
            CANCELLED: 'bg-red-500',
        }
        return colors[status] || 'bg-gray-500'
    }

    const getTaskStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            TODO: 'bg-slate-400',
            IN_PROGRESS: 'bg-blue-400',
            IN_REVIEW: 'bg-purple-400',
            BLOCKED: 'bg-red-400',
            DONE: 'bg-green-400',
            CANCELLED: 'bg-gray-400',
        }
        return colors[status] || 'bg-slate-400'
    }

    const isMilestone = (task: GanttTask) => {
        return task.tags.includes('MILESTONE') || task.tags.includes('milestone')
    }

    const getRAGColor = (status: RAGStatus) => {
        switch (status) {
            case RAGStatus.GREEN:
                return 'bg-green-500'
            case RAGStatus.AMBER:
                return 'bg-amber-500'
            case RAGStatus.RED:
                return 'bg-red-500'
            default:
                return 'bg-slate-500'
        }
    }

    const formatMonth = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    return (
        <Card className="p-6">
            <div className="space-y-4">
                {/* Timeline Header */}
                <div className="flex">
                    {/* Project Names Column */}
                    <div className="w-64 flex-shrink-0 pr-4">
                        <div className="h-20 flex items-center font-semibold text-sm text-slate-600 dark:text-slate-300">
                            Project
                        </div>
                    </div>

                    {/* Timeline Grid */}
                    <div className="flex-1 relative">
                        {/* Month Headers */}
                        <div className="h-10 flex border-b border-slate-200 dark:border-slate-700">
                            {months.map((month, index) => {
                                const daysInMonth = getDaysInMonth(month).length
                                return (
                                    <div
                                        key={index}
                                        style={{ flex: `0 0 ${(daysInMonth / totalDays) * 100}%` }}
                                        className="text-xs font-semibold text-slate-700 dark:text-slate-300 px-2 flex items-center justify-center border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                                    >
                                        {formatMonth(month)}
                                    </div>
                                )
                            })}
                        </div>
                        
                        {/* Date Headers (Days) */}
                        <div className="h-10 flex border-b-2 border-slate-300 dark:border-slate-600">
                            {months.map((month, monthIndex) => {
                                const days = getDaysInMonth(month)
                                return days.map((day, dayIndex) => (
                                    <div
                                        key={`${monthIndex}-${dayIndex}`}
                                        style={{ flex: `0 0 ${(1 / totalDays) * 100}%` }}
                                        className={cn(
                                            "text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center justify-center border-l border-slate-100 dark:border-slate-800",
                                            day.getDay() === 0 || day.getDay() === 6 ? "bg-slate-100 dark:bg-slate-800/30" : ""
                                        )}
                                    >
                                        {day.getDate()}
                                    </div>
                                ))
                            })}
                        </div>
                    </div>
                </div>

                {/* Project Rows */}
                <div className="space-y-1">
                    {projects.map((project) => {
                        const position = getProjectPosition(project)
                        const isExpanded = expandedProjects.has(project.id)
                        const tasks = projectTasks[project.id] || []
                        const isLoading = loadingTasks.has(project.id)
                        
                        // Separate tasks into parent tasks, subtasks, and milestones
                        const parentTasks = tasks.filter(t => !t.parentId && !isMilestone(t))
                        const subtasks = tasks.filter(t => t.parentId !== null)
                        const milestones = tasks.filter(t => isMilestone(t))

                        return (
                            <div key={project.id}>
                                {/* Project Row */}
                                <div className="flex group hover:bg-muted/30">
                                    {/* Project Name with Expand Button */}
                                    <div className="w-64 flex-shrink-0 pr-4">
                                        <div className="flex items-center gap-2 py-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => toggleProject(project.id)}
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : isExpanded ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                )}
                                            </Button>
                                            <div className={cn("w-2 h-2 rounded-full", getStatusColor(project.status))} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate dark:text-slate-200">{project.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{project.code}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Bar */}
                                    <div className="flex-1 relative">
                                        <div className="h-full flex">
                                            {months.map((_, index) => (
                                                <div
                                                    key={index}
                                                    className="flex-1 border-l border-slate-100 dark:border-slate-800"
                                                />
                                            ))}
                                        </div>

                                        {/* Project Bar */}
                                        <div
                                            className="absolute top-3 h-8"
                                            style={position}
                                        >
                                            <div
                                                className={cn(
                                                    "h-full rounded-lg shadow-md relative overflow-hidden group-hover:shadow-lg transition-shadow cursor-pointer",
                                                    getStatusColor(project.status)
                                                )}
                                            >
                                                {/* Progress Overlay */}
                                                <div
                                                    className="absolute inset-0 bg-white/20"
                                                    style={{ width: `${100 - project.progress}%`, right: 0 }}
                                                />

                                                {/* Project Info Tooltip */}
                                                <div className="absolute inset-0 flex items-center px-2">
                                                    <span className="text-xs font-medium text-white truncate">
                                                        {project.name} ({project.progress}%)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks (when expanded) */}
                                {isExpanded && !isLoading && (
                                    <div className="ml-4 space-y-1">
                                        {/* Parent Tasks */}
                                        {parentTasks.map((task) => {
                                            const taskPosition = getTaskPosition(task)
                                            if (!taskPosition) return null

                                            const taskSubtasks = subtasks.filter(st => st.parentId === task.id)

                                            return (
                                                <div key={task.id}>
                                                    {/* Task Row */}
                                                    <div className="flex group hover:bg-muted/20">
                                                        <div className="w-60 flex-shrink-0 pr-4">
                                                            <div className="flex items-center gap-2 py-2 pl-4">
                                                                <div className={cn("w-1.5 h-1.5 rounded-full", getTaskStatusColor(task.status))} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-medium truncate dark:text-slate-300">{task.title}</p>
                                                                    <p className="text-xs text-muted-foreground">{task.status}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 relative">
                                                            <div className="h-full flex">
                                                                {months.map((_, index) => (
                                                                    <div
                                                                        key={index}
                                                                        className="flex-1 border-l border-slate-50 dark:border-slate-900"
                                                                    />
                                                                ))}
                                                            </div>

                                                            <div
                                                                className="absolute top-2 h-6"
                                                                style={taskPosition}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "h-full rounded shadow-sm relative overflow-hidden hover:shadow transition-shadow cursor-pointer",
                                                                        getTaskStatusColor(task.status)
                                                                    )}
                                                                >
                                                                    <div
                                                                        className="absolute inset-0 bg-white/20"
                                                                        style={{ width: `${100 - task.progress}%`, right: 0 }}
                                                                    />
                                                                    <div className="absolute inset-0 flex items-center px-1">
                                                                        <span className="text-[10px] font-medium text-white truncate">
                                                                            {task.title}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Subtasks */}
                                                    {taskSubtasks.map((subtask) => {
                                                        const subtaskPosition = getTaskPosition(subtask)
                                                        if (!subtaskPosition) return null

                                                        return (
                                                            <div key={subtask.id} className="flex group hover:bg-muted/10">
                                                                <div className="w-60 flex-shrink-0 pr-4">
                                                                    <div className="flex items-center gap-2 py-2 pl-8">
                                                                        <div className={cn("w-1 h-1 rounded-full", getTaskStatusColor(subtask.status))} />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs truncate text-muted-foreground dark:text-slate-400">{subtask.title}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1 relative">
                                                                    <div className="h-full flex">
                                                                        {months.map((_, index) => (
                                                                            <div
                                                                                key={index}
                                                                                className="flex-1 border-l border-slate-50 dark:border-slate-900"
                                                                            />
                                                                        ))}
                                                                    </div>

                                                                    <div
                                                                        className="absolute top-2 h-4"
                                                                        style={subtaskPosition}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                "h-full rounded-sm shadow-sm relative overflow-hidden hover:shadow transition-shadow cursor-pointer opacity-80",
                                                                                getTaskStatusColor(subtask.status)
                                                                            )}
                                                                        >
                                                                            <div
                                                                                className="absolute inset-0 bg-white/30"
                                                                                style={{ width: `${100 - subtask.progress}%`, right: 0 }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}

                                        {/* Milestones */}
                                        {milestones.map((milestone) => {
                                            const milestonePosition = getTaskPosition(milestone)
                                            if (!milestonePosition) return null

                                            return (
                                                <div key={milestone.id} className="flex group hover:bg-muted/20">
                                                    <div className="w-60 flex-shrink-0 pr-4">
                                                        <div className="flex items-center gap-2 py-2 pl-4">
                                                            <div className="w-2 h-2 bg-yellow-500 rotate-45" />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-semibold truncate text-yellow-700 dark:text-yellow-400">{milestone.title}</p>
                                                                <p className="text-xs text-muted-foreground">Milestone</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 relative">
                                                        <div className="h-full flex">
                                                            {months.map((_, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="flex-1 border-l border-slate-50 dark:border-slate-900"
                                                                />
                                                            ))}
                                                        </div>

                                                        {/* Milestone Bar */}
                                                        <div
                                                            className="absolute top-2 h-6"
                                                            style={milestonePosition}
                                                        >
                                                            <div
                                                                className="h-full rounded shadow-md relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer bg-yellow-500"
                                                            >
                                                                {/* Diamond markers at start and end */}
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-600 rotate-45 shadow-sm" />
                                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 bg-yellow-600 rotate-45 shadow-sm" />
                                                                
                                                                {/* Milestone label */}
                                                                <div className="absolute inset-0 flex items-center px-2">
                                                                    <span className="text-[10px] font-semibold text-white truncate">
                                                                        {milestone.title}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {/* No tasks message */}
                                        {parentTasks.length === 0 && milestones.length === 0 && (
                                            <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                                                No tasks or milestones found for this project
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-slate-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Planned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">On Hold</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Cancelled</span>
                    </div>
                </div>

                {/* Current Date Indicator */}
                <div className="flex">
                    <div className="w-64 flex-shrink-0" />
                    <div className="flex-1 relative">
                        {(() => {
                            const today = new Date()
                            if (today >= minDate && today <= maxDate) {
                                const todayDays = Math.ceil((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
                                const left = (todayDays / totalDays) * 100

                                return (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-10"
                                        style={{ left: `${left}%` }}
                                    >
                                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-purple-500 text-white text-xs rounded whitespace-nowrap">
                                            Today
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        })()}
                    </div>
                </div>
            </div>
        </Card>
    )
}


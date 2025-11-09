'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, ChevronDown, ChevronRight, Calendar } from 'lucide-react'

export interface Milestone {
    id: string
    title: string
    description: string
    dueDate: string
    tasks: Task[]
}

export interface Task {
    id: string
    title: string
    description: string
    assignee: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    dueDate: string
    estimatedHours: number
    subtasks: Subtask[]
}

export interface Subtask {
    id: string
    title: string
    assignee: string
    estimatedHours: number
}

interface PlanningStepProps {
    milestones: Milestone[]
    onChange: (milestones: Milestone[]) => void
}

export function PlanningStep({ milestones, onChange }: PlanningStepProps) {
    const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())
    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())

    const addMilestone = () => {
        const newMilestone: Milestone = {
            id: `milestone-${Date.now()}`,
            title: '',
            description: '',
            dueDate: '',
            tasks: []
        }
        onChange([...milestones, newMilestone])
        setExpandedMilestones(new Set([...expandedMilestones, newMilestone.id]))
    }

    const updateMilestone = (milestoneId: string, field: keyof Milestone, value: any) => {
        onChange(milestones.map(m =>
            m.id === milestoneId ? { ...m, [field]: value } : m
        ))
    }

    const deleteMilestone = (milestoneId: string) => {
        onChange(milestones.filter(m => m.id !== milestoneId))
    }

    const addTask = (milestoneId: string) => {
        const newTask: Task = {
            id: `task-${Date.now()}`,
            title: '',
            description: '',
            assignee: '',
            priority: 'MEDIUM',
            dueDate: '',
            estimatedHours: 0,
            subtasks: []
        }
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? { ...m, tasks: [...m.tasks, newTask] }
                : m
        ))
        setExpandedTasks(new Set([...expandedTasks, newTask.id]))
    }

    const updateTask = (milestoneId: string, taskId: string, field: keyof Task, value: any) => {
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? {
                    ...m,
                    tasks: m.tasks.map(t =>
                        t.id === taskId ? { ...t, [field]: value } : t
                    )
                }
                : m
        ))
    }

    const deleteTask = (milestoneId: string, taskId: string) => {
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? { ...m, tasks: m.tasks.filter(t => t.id !== taskId) }
                : m
        ))
    }

    const addSubtask = (milestoneId: string, taskId: string) => {
        const newSubtask: Subtask = {
            id: `subtask-${Date.now()}`,
            title: '',
            assignee: '',
            estimatedHours: 0
        }
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? {
                    ...m,
                    tasks: m.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, subtasks: [...t.subtasks, newSubtask] }
                            : t
                    )
                }
                : m
        ))
    }

    const updateSubtask = (milestoneId: string, taskId: string, subtaskId: string, field: keyof Subtask, value: any) => {
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? {
                    ...m,
                    tasks: m.tasks.map(t =>
                        t.id === taskId
                            ? {
                                ...t,
                                subtasks: t.subtasks.map(st =>
                                    st.id === subtaskId ? { ...st, [field]: value } : st
                                )
                            }
                            : t
                    )
                }
                : m
        ))
    }

    const deleteSubtask = (milestoneId: string, taskId: string, subtaskId: string) => {
        onChange(milestones.map(m =>
            m.id === milestoneId
                ? {
                    ...m,
                    tasks: m.tasks.map(t =>
                        t.id === taskId
                            ? { ...t, subtasks: t.subtasks.filter(st => st.id !== subtaskId) }
                            : t
                    )
                }
                : m
        ))
    }

    const toggleMilestone = (milestoneId: string) => {
        const newExpanded = new Set(expandedMilestones)
        if (newExpanded.has(milestoneId)) {
            newExpanded.delete(milestoneId)
        } else {
            newExpanded.add(milestoneId)
        }
        setExpandedMilestones(newExpanded)
    }

    const toggleTask = (taskId: string) => {
        const newExpanded = new Set(expandedTasks)
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId)
        } else {
            newExpanded.add(taskId)
        }
        setExpandedTasks(newExpanded)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Project Planning</h3>
                    <p className="text-sm text-muted-foreground">
                        Define milestones, tasks, and subtasks for your project (Optional)
                    </p>
                </div>
                <Button type="button" onClick={addMilestone} variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                </Button>
            </div>

            {milestones.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-4">No milestones yet</p>
                        <Button type="button" onClick={addMilestone}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Milestone
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {milestones.map((milestone, mIndex) => {
                        const isExpanded = expandedMilestones.has(milestone.id)
                        return (
                            <Card key={milestone.id} className="border-l-4 border-l-purple-500">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleMilestone(milestone.id)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <div className="flex-1">
                                                <Input
                                                    placeholder={`Milestone ${mIndex + 1} Title`}
                                                    value={milestone.title}
                                                    onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                                                    className="font-semibold text-lg border-none p-0 focus-visible:ring-0"
                                                />
                                            </div>
                                            <Badge variant="outline">
                                                {milestone.tasks.length} tasks
                                            </Badge>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteMilestone(milestone.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                {isExpanded && (
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label>Description</Label>
                                                <Textarea
                                                    placeholder="Milestone description"
                                                    value={milestone.description}
                                                    onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Due Date</Label>
                                                <Input
                                                    type="date"
                                                    value={milestone.dueDate}
                                                    onChange={(e) => updateMilestone(milestone.id, 'dueDate', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Tasks */}
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium">Tasks</h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => addTask(milestone.id)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Task
                                                </Button>
                                            </div>

                                            {milestone.tasks.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4">
                                                    No tasks yet
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {milestone.tasks.map((task, tIndex) => {
                                                        const isTaskExpanded = expandedTasks.has(task.id)
                                                        return (
                                                            <Card key={task.id} className="border-l-2 border-l-blue-400">
                                                                <CardHeader className="pb-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleTask(task.id)}
                                                                        >
                                                                            {isTaskExpanded ? (
                                                                                <ChevronDown className="h-3 w-3" />
                                                                            ) : (
                                                                                <ChevronRight className="h-3 w-3" />
                                                                            )}
                                                                        </Button>
                                                                        <Input
                                                                            placeholder={`Task ${tIndex + 1}`}
                                                                            value={task.title}
                                                                            onChange={(e) => updateTask(milestone.id, task.id, 'title', e.target.value)}
                                                                            className="border-none p-0 focus-visible:ring-0"
                                                                        />
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {task.subtasks.length} subtasks
                                                                        </Badge>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => deleteTask(milestone.id, task.id)}
                                                                        >
                                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                                        </Button>
                                                                    </div>
                                                                </CardHeader>

                                                                {isTaskExpanded && (
                                                                    <CardContent className="space-y-3">
                                                                        <div className="grid gap-3 md:grid-cols-2">
                                                                            <div className="space-y-2">
                                                                                <Label className="text-xs">Description</Label>
                                                                                <Textarea
                                                                                    placeholder="Task description"
                                                                                    value={task.description}
                                                                                    onChange={(e) => updateTask(milestone.id, task.id, 'description', e.target.value)}
                                                                                    rows={2}
                                                                                    className="text-sm"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label className="text-xs">Priority</Label>
                                                                                <Select
                                                                                    value={task.priority}
                                                                                    onValueChange={(value) => updateTask(milestone.id, task.id, 'priority', value)}
                                                                                >
                                                                                    <SelectTrigger className="text-sm">
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="LOW">Low</SelectItem>
                                                                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                                                                        <SelectItem value="HIGH">High</SelectItem>
                                                                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label className="text-xs">Due Date</Label>
                                                                                <Input
                                                                                    type="date"
                                                                                    value={task.dueDate}
                                                                                    onChange={(e) => updateTask(milestone.id, task.id, 'dueDate', e.target.value)}
                                                                                    className="text-sm"
                                                                                />
                                                                            </div>
                                                                            <div className="space-y-2">
                                                                                <Label className="text-xs">Estimated Hours</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    value={task.estimatedHours}
                                                                                    onChange={(e) => updateTask(milestone.id, task.id, 'estimatedHours', parseFloat(e.target.value))}
                                                                                    className="text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>

                                                                        {/* Subtasks */}
                                                                        <div className="border-t pt-3">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <Label className="text-xs">Subtasks</Label>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="sm"
                                                                                    variant="ghost"
                                                                                    onClick={() => addSubtask(milestone.id, task.id)}
                                                                                >
                                                                                    <Plus className="h-3 w-3 mr-1" />
                                                                                    Add Subtask
                                                                                </Button>
                                                                            </div>

                                                                            {task.subtasks.length === 0 ? (
                                                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                                                    No subtasks
                                                                                </p>
                                                                            ) : (
                                                                                <div className="space-y-2">
                                                                                    {task.subtasks.map((subtask, stIndex) => (
                                                                                        <div key={subtask.id} className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                                                                                            <Input
                                                                                                placeholder={`Subtask ${stIndex + 1}`}
                                                                                                value={subtask.title}
                                                                                                onChange={(e) => updateSubtask(milestone.id, task.id, subtask.id, 'title', e.target.value)}
                                                                                                className="text-sm flex-1"
                                                                                            />
                                                                                            <Input
                                                                                                type="number"
                                                                                                placeholder="0"
                                                                                                value={subtask.estimatedHours}
                                                                                                onChange={(e) => updateSubtask(milestone.id, task.id, subtask.id, 'estimatedHours', parseFloat(e.target.value))}
                                                                                                className="text-sm w-24"
                                                                                            />
                                                                                            <Button
                                                                                                type="button"
                                                                                                variant="ghost"
                                                                                                size="sm"
                                                                                                onClick={() => deleteSubtask(milestone.id, task.id, subtask.id)}
                                                                                            >
                                                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                                                            </Button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </CardContent>
                                                                )}
                                                            </Card>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}


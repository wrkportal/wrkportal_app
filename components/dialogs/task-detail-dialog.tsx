'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
    Calendar,
    Clock,
    User,
    MessageSquare,
    Save,
    Loader2,
    Send,
    Trash2,
    Play,
    Pause,
    Timer,
    History
} from 'lucide-react'
import { TimerNotesDialog } from './timer-notes-dialog'

interface TaskDetailDialogProps {
    open: boolean
    onClose: () => void
    taskId: string | null
    onUpdate?: () => void
    onDelete?: () => void
}

export function TaskDetailDialog({ open, onClose, taskId, onUpdate, onDelete }: TaskDetailDialogProps) {
    const [task, setTask] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [newComment, setNewComment] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [activeTimer, setActiveTimer] = useState<any>(null)
    const [timerSeconds, setTimerSeconds] = useState(0)
    const [timeLogs, setTimeLogs] = useState<any[]>([])
    const [timerNotesDialogOpen, setTimerNotesDialogOpen] = useState(false)

    // Fetch task details
    useEffect(() => {
        if (open && taskId) {
            fetchTask()
            checkActiveTimer()
            fetchTimeLogs()
        }
    }, [open, taskId])

    // Update timer seconds
    useEffect(() => {
        if (activeTimer) {
            const interval = setInterval(() => {
                const startTime = new Date(activeTimer.startTime).getTime()
                const now = Date.now()
                const seconds = Math.floor((now - startTime) / 1000)
                setTimerSeconds(seconds)
            }, 1000)
            return () => clearInterval(interval)
        }
    }, [activeTimer])

    const fetchTask = async () => {
        if (!taskId) return

        setIsLoading(true)
        try {
            const response = await fetch(`/api/tasks/${taskId}`)
            if (response.ok) {
                const data = await response.json()
                setTask(data.task)
            }
        } catch (error) {
            console.error('Error fetching task:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!taskId) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    status: newStatus,
                }),
            })

            if (response.ok) {
                await fetchTask()
                onUpdate?.()
            }
        } catch (error) {
            console.error('Error updating status:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handlePriorityChange = async (newPriority: string) => {
        if (!taskId) return

        setIsSaving(true)
        try {
            const response = await fetch('/api/tasks', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    priority: newPriority,
                }),
            })

            if (response.ok) {
                await fetchTask()
                onUpdate?.()
            }
        } catch (error) {
            console.error('Error updating priority:', error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleAddComment = async () => {
        if (!taskId || !newComment.trim()) return

        setIsAddingComment(true)
        try {
            const response = await fetch(`/api/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })

            if (response.ok) {
                setNewComment('')
                await fetchTask()
            }
        } catch (error) {
            console.error('Error adding comment:', error)
        } finally {
            setIsAddingComment(false)
        }
    }

    const handleDelete = async () => {
        if (!taskId) return

        const confirmed = confirm('Are you sure you want to delete this task? You can restore it from the Deleted Items page.')
        if (!confirmed) return

        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('✅ Task deleted successfully!')
                onClose()
                if (onDelete) onDelete()
                if (onUpdate) onUpdate()
            } else {
                alert('❌ Failed to delete task')
            }
        } catch (error) {
            console.error('Error deleting task:', error)
            alert('❌ Failed to delete task')
        }
    }

    const checkActiveTimer = async () => {
        try {
            const response = await fetch('/api/time-tracking/active')
            if (response.ok) {
                const data = await response.json()
                if (data.activeTimer && data.activeTimer.taskId === taskId) {
                    setActiveTimer(data.activeTimer)
                }
            }
        } catch (error) {
            console.error('Error checking active timer:', error)
        }
    }

    const fetchTimeLogs = async () => {
        if (!taskId) return

        try {
            const response = await fetch(`/api/time-tracking?taskId=${taskId}`)
            if (response.ok) {
                const data = await response.json()
                setTimeLogs(data.timeLogs || [])
            }
        } catch (error) {
            console.error('Error fetching time logs:', error)
        }
    }

    const showTimerNotesDialog = () => {
        setTimerNotesDialogOpen(true)
    }

    const startTimer = async (notes: string) => {
        if (!taskId) return

        try {
            const response = await fetch('/api/time-tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId,
                    notes: notes || null
                })
            })

            if (response.ok) {
                const data = await response.json()
                setActiveTimer(data.timeLog)
            } else {
                const error = await response.json()
                console.error('Failed to start timer:', error.error)
            }
        } catch (error) {
            console.error('Error starting timer:', error)
        }
    }

    const stopTimer = async () => {
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
                setTimerSeconds(0)
                fetchTimeLogs()
            } else {
                console.error('Failed to stop timer')
            }
        } catch (error) {
            console.error('Error stopping timer:', error)
        }
    }

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

    const calculateTotalTime = () => {
        return timeLogs.reduce((total, log) => total + (log.duration || 0), 0)
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
    }

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const formatDateTime = (date: string) => {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    if (isLoading) {
        return (
            <Dialog open={open} onOpenChange={onClose}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!task) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl">{task.title}</DialogTitle>
                        <div className="flex items-center gap-2">
                            {activeTimer ? (
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-sm animate-pulse">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {formatDuration(timerSeconds)}
                                    </Badge>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={stopTimer}
                                    >
                                        <Pause className="h-4 w-4 mr-2" />
                                        Stop Timer
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={showTimerNotesDialog}
                                >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Timer
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={task.status} onValueChange={handleStatusChange} disabled={isSaving}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                                    <SelectItem value="TODO">To Do</SelectItem>
                                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                    <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                    <SelectItem value="BLOCKED">Blocked</SelectItem>
                                    <SelectItem value="DONE">Done</SelectItem>
                                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={task.priority} onValueChange={handlePriorityChange} disabled={isSaving}>
                                <SelectTrigger>
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
                    </div>

                    {/* Description */}
                    {task.description && (
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                                {task.description}
                            </p>
                        </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        {task.project && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded flex items-center justify-center">
                                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                        {task.project.code}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Project</p>
                                    <p className="text-sm font-medium">{task.project.name}</p>
                                </div>
                            </div>
                        )}

                        {task.assignee && (
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={task.assignee.avatar} />
                                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs">
                                        {getInitials(task.assignee.firstName, task.assignee.lastName)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-xs text-muted-foreground">Assigned to</p>
                                    <p className="text-sm font-medium">
                                        {task.assignee.firstName} {task.assignee.lastName}
                                    </p>
                                </div>
                            </div>
                        )}

                        {task.dueDate && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Due Date</p>
                                    <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                                </div>
                            </div>
                        )}

                        {task.estimatedHours && (
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                                    <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Estimated</p>
                                    <p className="text-sm font-medium">{task.estimatedHours}h</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Time Tracking Section */}
                    {timeLogs.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Timer className="h-5 w-5 text-muted-foreground" />
                                    <Label className="text-base font-semibold">Time Tracking</Label>
                                </div>
                                <Badge variant="secondary" className="text-sm">
                                    Total: {formatDuration(calculateTotalTime())}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                {timeLogs.slice(0, 6).map((log: any) => (
                                    <div key={log.id} className="p-2 bg-muted/50 rounded-md">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(log.date).toLocaleDateString()}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {log.duration ? formatDuration(log.duration) : 'Active'}
                                            </Badge>
                                        </div>
                                        {log.notes && (
                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 truncate" title={log.notes}>
                                                📝 {log.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {timeLogs.length > 6 && (
                                <p className="text-xs text-muted-foreground text-center">
                                    +{timeLogs.length - 6} more entries
                                </p>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Comments Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <Label className="text-base font-semibold">
                                Comments ({task.comments?.length || 0})
                            </Label>
                        </div>

                        {/* Add Comment */}
                        <div className="flex gap-2">
                            <Textarea
                                placeholder="Add a comment or note..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                                className="flex-1"
                            />
                            <Button
                                onClick={handleAddComment}
                                disabled={!newComment.trim() || isAddingComment}
                                size="icon"
                                className="h-auto"
                            >
                                {isAddingComment ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                            </Button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((comment: any) => (
                                    <div
                                        key={comment.id}
                                        className="flex gap-3 p-3 bg-muted rounded-lg"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={comment.user.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                                                {getInitials(comment.user.firstName, comment.user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">
                                                    {comment.user.firstName} {comment.user.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(comment.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No comments yet. Be the first to add one!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Created Info */}
                    <div className="text-xs text-muted-foreground pt-4 border-t">
                        Created by {task.createdBy.firstName} {task.createdBy.lastName} on{' '}
                        {formatDate(task.createdAt)}
                    </div>
                </div>

                {/* Timer Notes Dialog */}
                <TimerNotesDialog
                    open={timerNotesDialogOpen}
                    onClose={() => setTimerNotesDialogOpen(false)}
                    onSubmit={startTimer}
                    taskTitle={task?.title}
                />
            </DialogContent>
        </Dialog>
    )
}


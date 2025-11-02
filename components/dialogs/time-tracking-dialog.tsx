'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    Clock,
    Calendar,
    Loader2,
    Timer,
    Trash2,
    Download
} from 'lucide-react'

interface TimeTrackingDialogProps {
    open: boolean
    onClose: () => void
    taskId?: string
}

export function TimeTrackingDialog({ open, onClose, taskId }: TimeTrackingDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [groupedLogs, setGroupedLogs] = useState<any[]>([])
    const [totalDuration, setTotalDuration] = useState(0)

    useEffect(() => {
        if (open) {
            fetchTimeLogs()
        }
    }, [open, taskId])

    const fetchTimeLogs = async () => {
        setIsLoading(true)
        try {
            const url = taskId
                ? `/api/time-tracking?taskId=${taskId}`
                : '/api/time-tracking'

            const response = await fetch(url)
            if (response.ok) {
                const data = await response.json()
                setGroupedLogs(data.groupedByDate || [])
                setTotalDuration(data.totalDuration || 0)
            }
        } catch (error) {
            console.error('Error fetching time logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`
        } else {
            return `${secs}s`
        }
    }

    const formatTime = (date: string) => {
        return new Date(date).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const today = new Date()
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        if (date.toDateString() === today.toDateString()) {
            return 'Today'
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday'
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })
        }
    }

    const deleteTimeLog = async (logId: string) => {
        if (!confirm('Are you sure you want to delete this time log?')) {
            return
        }

        try {
            const response = await fetch(`/api/time-tracking?timeLogId=${logId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchTimeLogs()
            }
        } catch (error) {
            console.error('Error deleting time log:', error)
        }
    }

    const downloadExcel = () => {
        // Prepare data for CSV export
        const csvData: any[] = []

        // Add headers
        csvData.push(['Date', 'Task', 'Project', 'Start Time', 'End Time', 'Duration', 'Notes'])

        // Add data rows
        groupedLogs.forEach((dayLog) => {
            dayLog.logs.forEach((log: any) => {
                const date = new Date(log.date).toLocaleDateString()
                const taskName = log.task.title
                const projectName = log.task.project ? log.task.project.name : 'N/A'
                const startTime = formatTime(log.startTime)
                const endTime = log.endTime ? formatTime(log.endTime) : 'Active'
                const duration = log.duration ? formatDuration(log.duration) : 'Active'
                const notes = log.notes || ''

                csvData.push([date, taskName, projectName, startTime, endTime, duration, notes])
            })
        })

        // Convert to CSV string
        const csvContent = csvData.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n')

        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        const fileName = taskId
            ? `time-tracking-task-${new Date().toISOString().split('T')[0]}.csv`
            : `time-tracking-all-tasks-${new Date().toISOString().split('T')[0]}.csv`

        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <Timer className="h-5 w-5 text-purple-600" />
                                Time Tracking History
                            </DialogTitle>
                            <DialogDescription>
                                {taskId ? 'Time spent on this task' : 'Time spent on all your tasks'}
                            </DialogDescription>
                        </div>
                        {groupedLogs.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadExcel}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Total Duration */}
                        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Total Time Tracked</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-6 w-6 text-purple-600" />
                                    <span className="text-3xl font-bold text-purple-600">
                                        {formatDuration(totalDuration)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Day-wise logs */}
                        {groupedLogs.length > 0 ? (
                            <div className="space-y-4">
                                {groupedLogs.map((dayLog) => (
                                    <Card key={dayLog.date}>
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    <CardTitle className="text-sm font-semibold">
                                                        {formatDate(dayLog.date)}
                                                    </CardTitle>
                                                </div>
                                                <Badge variant="secondary">
                                                    {formatDuration(dayLog.totalDuration)}
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {dayLog.logs.map((log: any) => (
                                                    <div
                                                        key={log.id}
                                                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                                                    >
                                                        <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-sm font-medium">
                                                                    {log.task.title}
                                                                </p>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {log.duration ? formatDuration(log.duration) : 'Active'}
                                                                </Badge>
                                                            </div>
                                                            {log.task.project && (
                                                                <p className="text-xs text-muted-foreground">
                                                                    {log.task.project.name} ({log.task.project.code})
                                                                </p>
                                                            )}
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                <span>
                                                                    {formatTime(log.startTime)}
                                                                </span>
                                                                {log.endTime && (
                                                                    <>
                                                                        <span>→</span>
                                                                        <span>{formatTime(log.endTime)}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            {log.notes && (
                                                                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                                                                    <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
                                                                        📝 {log.notes}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={() => deleteTimeLog(log.id)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Timer className="h-12 w-12 text-muted-foreground/50 mb-3" />
                                <p className="text-sm text-muted-foreground mb-1">No time tracked yet</p>
                                <p className="text-xs text-muted-foreground">
                                    Start tracking time on your tasks to see history here
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <Separator className="my-4" />

                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}



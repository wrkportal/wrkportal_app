'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Search, Filter, Trash2, Loader2, AlertCircle, CheckCircle2, Settings } from "lucide-react"

interface AuditLog {
    id: string
    timestamp: string
    user: string
    action: string
    entity: string
    entityId: string
    changes: string
    ipAddress?: string
}

interface RetentionSettings {
    auditLogRetentionDays: number
    taskRetentionDays: number
    notificationRetentionDays: number
    projectRetentionDays: number
}

interface RetentionStats {
    notificationsToDelete: number
    tasksToDelete: number
    projectsToDelete: number
    totalItemsToDelete: number
}

export default function AdminAuditPage() {
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [retentionSettings, setRetentionSettings] = useState<RetentionSettings>({
        auditLogRetentionDays: 2555,
        taskRetentionDays: 1825,
        notificationRetentionDays: 90,
        projectRetentionDays: 1825,
    })
    const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null)
    const [savingSettings, setSavingSettings] = useState(false)
    const [runningCleanup, setRunningCleanup] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [showRetentionConfig, setShowRetentionConfig] = useState(false)

    useEffect(() => {
        fetchAuditLogs()
        fetchRetentionSettings()
        fetchRetentionStats()
    }, [])

    const fetchAuditLogs = async () => {
        try {
            const response = await fetch('/api/admin/audit-logs')
            if (response.ok) {
                const data = await response.json()
                setAuditLogs(data.logs || [])
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchRetentionSettings = async () => {
        try {
            const response = await fetch('/api/admin/retention-settings')
            if (response.ok) {
                const data = await response.json()
                setRetentionSettings({
                    auditLogRetentionDays: data.auditLogRetentionDays,
                    taskRetentionDays: data.taskRetentionDays,
                    notificationRetentionDays: data.notificationRetentionDays,
                    projectRetentionDays: data.projectRetentionDays,
                })
            }
        } catch (error) {
            console.error('Error fetching retention settings:', error)
        }
    }

    const fetchRetentionStats = async () => {
        try {
            const response = await fetch('/api/admin/retention-cleanup')
            if (response.ok) {
                const data = await response.json()
                setRetentionStats(data.stats)
            }
        } catch (error) {
            console.error('Error fetching retention stats:', error)
        }
    }

    const handleSaveRetentionSettings = async () => {
        try {
            setSavingSettings(true)
            setMessage(null)

            const response = await fetch('/api/admin/retention-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(retentionSettings),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: 'Retention settings saved successfully!' })
                fetchRetentionStats() // Refresh stats
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to save retention settings' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred while saving settings' })
        } finally {
            setSavingSettings(false)
        }
    }

    const handleRunCleanup = async () => {
        if (!confirm('Are you sure you want to run data cleanup? This will permanently delete old data based on your retention settings.')) {
            return
        }

        try {
            setRunningCleanup(true)
            setMessage(null)

            const response = await fetch('/api/admin/retention-cleanup', {
                method: 'POST',
            })

            const data = await response.json()

            if (response.ok) {
                const { result } = data
                setMessage({
                    type: 'success',
                    text: `Cleanup completed! Deleted: ${result.deletedNotifications} notifications, ${result.deletedTasks} tasks, ${result.deletedProjects} projects.`,
                })
                fetchRetentionStats() // Refresh stats
            } else {
                setMessage({ type: 'error', text: data.error || 'Failed to run cleanup' })
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An error occurred during cleanup' })
        } finally {
            setRunningCleanup(false)
        }
    }

    const getDaysLabel = (days: number) => {
        if (days === -1) return 'Forever'
        if (days === 30) return '30 Days (1 Month)'
        if (days === 90) return '90 Days (3 Months)'
        if (days === 180) return '180 Days (6 Months)'
        if (days === 365) return '1 Year'
        if (days === 1095) return '3 Years'
        if (days === 1825) return '5 Years'
        if (days === 2555) return '7 Years'
        if (days === 3650) return '10 Years'
        return `${days} Days`
    }

    const handleExport = () => {
        // Open export endpoint in new window to download CSV
        window.open('/api/admin/audit-logs/export', '_blank')
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Audit Log</h1>
                    <p className="text-muted-foreground">
                        Comprehensive audit trail of all system activities
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Audit Logs</CardTitle>
                    <CardDescription>Search and filter audit events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search by user, action, or entity..."
                                className="w-full"
                            />
                        </div>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="CREATE">Create</SelectItem>
                                <SelectItem value="UPDATE">Update</SelectItem>
                                <SelectItem value="DELETE">Delete</SelectItem>
                                <SelectItem value="LOGIN">Login</SelectItem>
                                <SelectItem value="PERMISSION_CHANGE">Permission Change</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select defaultValue="all">
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Entity Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Entities</SelectItem>
                                <SelectItem value="PROJECT">Project</SelectItem>
                                <SelectItem value="TASK">Task</SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                                <SelectItem value="RISK">Risk</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button>
                            <Search className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest audit events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {loading && <p className="text-center py-8 text-muted-foreground">Loading audit logs...</p>}
                        {!loading && auditLogs.length === 0 && (
                            <p className="text-center py-8 text-muted-foreground">No audit logs found. Activity will appear here.</p>
                        )}
                        {auditLogs.map((log) => (
                            <div key={log.id} className="p-4 border rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{log.action}</Badge>
                                            <Badge variant="secondary">{log.entity}</Badge>
                                            <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                                        </div>
                                        <p className="text-sm font-medium">{log.changes}</p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>User: {log.user}</span>
                                            <span>•</span>
                                            <span>IP: {log.ipAddress}</span>
                                            <span>•</span>
                                            <span>Entity ID: {log.entityId}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">Details</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Messages */}
            {message && (
                <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : ''}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription className={message.type === 'success' ? 'text-green-800 dark:text-green-200' : ''}>
                        {message.text}
                    </AlertDescription>
                </Alert>
            )}

            {/* Data Retention Configuration */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Data Retention Settings</CardTitle>
                            <CardDescription>Configure how long data is kept before automatic deletion</CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowRetentionConfig(!showRetentionConfig)}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            {showRetentionConfig ? 'Hide' : 'Configure'}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {showRetentionConfig ? (
                        <div className="space-y-6">
                            {/* Notification Retention */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notifications Retention</label>
                                <Select
                                    value={retentionSettings.notificationRetentionDays.toString()}
                                    onValueChange={(value) =>
                                        setRetentionSettings({ ...retentionSettings, notificationRetentionDays: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="30">30 Days (1 Month)</SelectItem>
                                        <SelectItem value="90">90 Days (3 Months)</SelectItem>
                                        <SelectItem value="180">180 Days (6 Months)</SelectItem>
                                        <SelectItem value="365">1 Year</SelectItem>
                                        <SelectItem value="-1">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Read notifications older than this will be deleted</p>
                            </div>

                            {/* Task Retention */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Completed Tasks Retention</label>
                                <Select
                                    value={retentionSettings.taskRetentionDays.toString()}
                                    onValueChange={(value) =>
                                        setRetentionSettings({ ...retentionSettings, taskRetentionDays: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="365">1 Year</SelectItem>
                                        <SelectItem value="1095">3 Years</SelectItem>
                                        <SelectItem value="1825">5 Years</SelectItem>
                                        <SelectItem value="2555">7 Years</SelectItem>
                                        <SelectItem value="-1">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Completed tasks older than this will be deleted</p>
                            </div>

                            {/* Project Retention */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Archived Projects Retention</label>
                                <Select
                                    value={retentionSettings.projectRetentionDays.toString()}
                                    onValueChange={(value) =>
                                        setRetentionSettings({ ...retentionSettings, projectRetentionDays: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="365">1 Year</SelectItem>
                                        <SelectItem value="1095">3 Years</SelectItem>
                                        <SelectItem value="1825">5 Years</SelectItem>
                                        <SelectItem value="2555">7 Years</SelectItem>
                                        <SelectItem value="3650">10 Years</SelectItem>
                                        <SelectItem value="-1">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Archived projects older than this will be deleted</p>
                            </div>

                            {/* Audit Log Retention */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Audit Logs Retention</label>
                                <Select
                                    value={retentionSettings.auditLogRetentionDays.toString()}
                                    onValueChange={(value) =>
                                        setRetentionSettings({ ...retentionSettings, auditLogRetentionDays: parseInt(value) })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1825">5 Years</SelectItem>
                                        <SelectItem value="2555">7 Years (Recommended for Compliance)</SelectItem>
                                        <SelectItem value="3650">10 Years</SelectItem>
                                        <SelectItem value="-1">Forever</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Audit logs for compliance and security tracking</p>
                            </div>

                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    <strong>Warning:</strong> Deleted data cannot be recovered. Ensure your retention periods comply with your organization&apos;s policies and legal requirements.
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-3">
                                <Button onClick={handleSaveRetentionSettings} disabled={savingSettings}>
                                    {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Settings
                                </Button>
                                <Button variant="outline" onClick={() => setShowRetentionConfig(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Notifications</p>
                                    <p className="text-lg font-semibold">{getDaysLabel(retentionSettings.notificationRetentionDays)}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Completed Tasks</p>
                                    <p className="text-lg font-semibold">{getDaysLabel(retentionSettings.taskRetentionDays)}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Archived Projects</p>
                                    <p className="text-lg font-semibold">{getDaysLabel(retentionSettings.projectRetentionDays)}</p>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <p className="text-sm text-muted-foreground">Audit Logs</p>
                                    <p className="text-lg font-semibold">{getDaysLabel(retentionSettings.auditLogRetentionDays)}</p>
                                </div>
                            </div>

                            {retentionStats && retentionStats.totalItemsToDelete > 0 && (
                                <Alert className="border-amber-500 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30">
                                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                    <AlertDescription className="text-amber-800 dark:text-amber-200">
                                        <strong>{retentionStats.totalItemsToDelete} items</strong> are eligible for deletion based on current retention settings.
                                        <div className="text-xs mt-1">
                                            {retentionStats.notificationsToDelete} notifications, {retentionStats.tasksToDelete} tasks, {retentionStats.projectsToDelete} projects
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleRunCleanup} disabled={runningCleanup}>
                                    {runningCleanup ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Run Cleanup Now
                                </Button>
                                <div className="flex-1 flex items-center text-xs text-muted-foreground">
                                    Manually trigger data cleanup based on retention settings
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


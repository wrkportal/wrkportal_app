'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import {
    Plus,
    Workflow,
    Zap,
    Clock,
    ArrowRight,
    Check,
    AlertCircle,
    Bell,
    Mail,
    MessageSquare,
    Calendar,
    User,
    FolderKanban,
    Target,
    DollarSign,
    Play,
    Pause,
    Edit2,
    Trash2,
    Copy,
    Sparkles,
    GitBranch,
    Filter,
    Send,
    FileText,
    TrendingUp,
    Activity
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Automation {
    id: string
    name: string
    description: string
    trigger: {
        type: string
        value: string
    }
    conditions: Array<{
        field: string
        operator: string
        value: string
    }>
    actions: Array<{
        type: string
        value: string
    }>
    enabled: boolean
    executions: number
    lastRun?: Date
    category: string
}

interface Stats {
    totalAutomations: number
    activeAutomations: number
    totalExecutions: number
    avgSuccessRate: number
    timeSaved: number
}

export default function AutomationsPage() {
    const [automations, setAutomations] = useState<Automation[]>([])
    const [stats, setStats] = useState<Stats>({
        totalAutomations: 0,
        activeAutomations: 0,
        totalExecutions: 0,
        avgSuccessRate: 0,
        timeSaved: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('automations')

    // Fetch automations from API
    const fetchAutomations = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/automations')
            if (response.ok) {
                const data = await response.json()
                setAutomations(data.automations || [])
                setStats(data.stats || {
                    totalAutomations: 0,
                    activeAutomations: 0,
                    totalExecutions: 0,
                    avgSuccessRate: 0,
                    timeSaved: 0
                })
            }
        } catch (error) {
            console.error('Error fetching automations:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAutomations()
    }, [])

    // Automation Templates
    const templates = [
        {
            id: 'task_auto_assign',
            name: 'Auto-assign Tasks by Role',
            description: 'Automatically assign new tasks to team members based on their role',
            category: 'Task Management',
            icon: User,
            color: 'blue',
            trigger: 'Task Created',
            action: 'Assign to User',
            popular: true
        },
        {
            id: 'sla_breach',
            name: 'SLA Breach Notifications',
            description: 'Send alerts when tasks are approaching or have breached SLA',
            category: 'Notifications',
            icon: Bell,
            color: 'red',
            trigger: 'Task Overdue',
            action: 'Send Notification',
            popular: true
        },
        {
            id: 'budget_alert',
            name: 'Budget Alert Triggers',
            description: 'Notify stakeholders when project budget exceeds threshold',
            category: 'Financial',
            icon: DollarSign,
            color: 'green',
            trigger: 'Budget Updated',
            action: 'Send Email',
            popular: true
        },
        {
            id: 'okr_reminder',
            name: 'OKR Update Reminders',
            description: 'Schedule weekly reminders for OKR progress updates',
            category: 'Goals & OKRs',
            icon: Target,
            color: 'purple',
            trigger: 'Schedule',
            action: 'Send Reminder',
            popular: false
        },
        {
            id: 'status_report',
            name: 'Automated Status Reports',
            description: 'Generate and send project status reports on schedule',
            category: 'Reporting',
            icon: FileText,
            color: 'orange',
            trigger: 'Schedule',
            action: 'Generate Report',
            popular: false
        },
        {
            id: 'milestone_notify',
            name: 'Milestone Notifications',
            description: 'Notify team when project milestones are completed',
            category: 'Projects',
            icon: FolderKanban,
            color: 'indigo',
            trigger: 'Milestone Completed',
            action: 'Send Notification',
            popular: false
        }
    ]

    const handleCreateAutomation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const newAutomation: Automation = {
            id: Date.now().toString(),
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            trigger: {
                type: formData.get('triggerType') as string,
                value: formData.get('triggerValue') as string
            },
            conditions: [],
            actions: [
                {
                    type: formData.get('actionType') as string,
                    value: formData.get('actionValue') as string
                }
            ],
            enabled: true,
            executions: 0,
            category: formData.get('category') as string
        }

        setAutomations([newAutomation, ...automations])

        // Update stats
        setStats({
            ...stats,
            totalAutomations: stats.totalAutomations + 1,
            activeAutomations: stats.activeAutomations + 1
        })

        setCreateDialogOpen(false)
        alert('✅ Automation created successfully!')
    }

    const handleEditAutomation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingAutomation) return

        const formData = new FormData(e.currentTarget)

        const updatedAutomation: Automation = {
            ...editingAutomation,
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            trigger: {
                type: formData.get('triggerType') as string,
                value: formData.get('triggerValue') as string
            },
            actions: [
                {
                    type: formData.get('actionType') as string,
                    value: formData.get('actionValue') as string
                }
            ],
            category: formData.get('category') as string
        }

        setAutomations(automations.map(a =>
            a.id === editingAutomation.id ? updatedAutomation : a
        ))

        setEditDialogOpen(false)
        setEditingAutomation(null)
        alert('✅ Automation updated successfully!')
    }

    const toggleAutomation = (id: string) => {
        const automation = automations.find(a => a.id === id)
        if (!automation) return

        const wasEnabled = automation.enabled

        setAutomations(automations.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
        ))

        // Update active count
        setStats({
            ...stats,
            activeAutomations: wasEnabled
                ? stats.activeAutomations - 1
                : stats.activeAutomations + 1
        })
    }

    const deleteAutomation = (id: string) => {
        if (confirm('Are you sure you want to delete this automation?')) {
            const automation = automations.find(a => a.id === id)
            setAutomations(automations.filter(a => a.id !== id))

            // Update stats
            setStats({
                ...stats,
                totalAutomations: stats.totalAutomations - 1,
                activeAutomations: automation?.enabled
                    ? stats.activeAutomations - 1
                    : stats.activeAutomations,
                totalExecutions: stats.totalExecutions - (automation?.executions || 0)
            })

            alert('✅ Automation deleted successfully!')
        }
    }

    const duplicateAutomation = (automation: Automation) => {
        const duplicate: Automation = {
            ...automation,
            id: Date.now().toString(),
            name: `${automation.name} (Copy)`,
            executions: 0,
            enabled: false
        }
        setAutomations([duplicate, ...automations])

        // Update stats
        setStats({
            ...stats,
            totalAutomations: stats.totalAutomations + 1
        })

        alert('✅ Automation duplicated successfully!')
    }

    const applyTemplate = (templateId: string) => {
        setSelectedTemplate(templateId)
        setCreateDialogOpen(true)
    }

    const openEditDialog = (automation: Automation) => {
        setEditingAutomation(automation)
        setEditDialogOpen(true)
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'tasks': return FolderKanban
            case 'financial': return DollarSign
            case 'okrs': return Target
            case 'projects': return FolderKanban
            default: return Workflow
        }
    }

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'tasks': return 'text-blue-600 bg-blue-100'
            case 'financial': return 'text-green-600 bg-green-100'
            case 'okrs': return 'text-purple-600 bg-purple-100'
            case 'projects': return 'text-orange-600 bg-orange-100'
            default: return 'text-gray-600 bg-gray-100'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Automations & Workflows
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Create powerful no-code automations to save time and reduce manual work
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setActiveTab('guide')}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Learn How
                    </Button>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Automation
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>Create New Automation</DialogTitle>
                                <DialogDescription>
                                    Build a custom automation workflow with triggers and actions
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateAutomation} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Automation Name *</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="e.g., Notify team on critical issues"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        placeholder="Describe what this automation does..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Select name="category" required>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tasks">Tasks</SelectItem>
                                            <SelectItem value="projects">Projects</SelectItem>
                                            <SelectItem value="okrs">Goals & OKRs</SelectItem>
                                            <SelectItem value="financial">Financial</SelectItem>
                                            <SelectItem value="notifications">Notifications</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                        Trigger - When should this run?
                                    </h4>
                                    <div className="grid gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="triggerType">Trigger Type *</Label>
                                            <Select name="triggerType" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose trigger" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="task_created">Task Created</SelectItem>
                                                    <SelectItem value="task_updated">Task Updated</SelectItem>
                                                    <SelectItem value="task_overdue">Task Overdue</SelectItem>
                                                    <SelectItem value="project_created">Project Created</SelectItem>
                                                    <SelectItem value="budget_update">Budget Updated</SelectItem>
                                                    <SelectItem value="milestone_completed">Milestone Completed</SelectItem>
                                                    <SelectItem value="schedule">Schedule (Time-based)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="triggerValue">Trigger Details</Label>
                                            <Input
                                                id="triggerValue"
                                                name="triggerValue"
                                                placeholder="e.g., When priority is HIGH"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <Send className="h-4 w-4 text-muted-foreground" />
                                        Action - What should happen?
                                    </h4>
                                    <div className="grid gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="actionType">Action Type *</Label>
                                            <Select name="actionType" required>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choose action" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="send_email">Send Email</SelectItem>
                                                    <SelectItem value="send_notification">Send Notification</SelectItem>
                                                    <SelectItem value="create_task">Create Task</SelectItem>
                                                    <SelectItem value="update_status">Update Status</SelectItem>
                                                    <SelectItem value="assign_user">Assign to User</SelectItem>
                                                    <SelectItem value="add_comment">Add Comment</SelectItem>
                                                    <SelectItem value="generate_report">Generate Report</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="actionValue">Action Details *</Label>
                                            <Input
                                                id="actionValue"
                                                name="actionValue"
                                                placeholder="e.g., Project Manager"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="outline">
                                        <Zap className="mr-2 h-4 w-4" />
                                        Create Automation
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards - NOW WITH REAL DATA */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Total Automations</CardTitle>
                        <Workflow className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalAutomations}</div>
                        <p className="text-xs text-muted-foreground">{stats.activeAutomations} active</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Executions</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalExecutions.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Success Rate</CardTitle>
                        <Check className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgSuccessRate > 0 ? `${stats.avgSuccessRate.toFixed(1)}%` : '0%'}
                        </div>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                        <CardTitle className="text-base font-medium">Time Saved</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.timeSaved}h</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 h-auto">
                    <TabsTrigger value="automations" className="gap-1 md:gap-2 text-xs md:text-sm">
                        <Activity className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">My Automations ({automations.length})</span>
                        <span className="sm:hidden">Mine ({automations.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="templates" className="gap-1 md:gap-2 text-xs md:text-sm">
                        <Sparkles className="h-3 w-3 md:h-4 md:w-4" />
                        Templates
                    </TabsTrigger>
                    <TabsTrigger value="guide" className="gap-1 md:gap-2 text-xs md:text-sm">
                        <GitBranch className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Workflow Guide</span>
                        <span className="sm:hidden">Guide</span>
                    </TabsTrigger>
                </TabsList>

                {/* My Automations Tab */}
                <TabsContent value="automations" className="space-y-4">
                    {automations.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64">
                                <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">No automations created yet</p>
                                <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Automation
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {automations.map((automation) => {
                                const CategoryIcon = getCategoryIcon(automation.category)

                                return (
                                    <Card key={automation.id} className={cn(
                                        "hover:shadow-lg transition-all",
                                        !automation.enabled && "opacity-60"
                                    )}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className={cn(
                                                            "p-2 rounded-lg",
                                                            getCategoryColor(automation.category)
                                                        )}>
                                                            <CategoryIcon className="h-5 w-5" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg">{automation.name}</CardTitle>
                                                            <CardDescription className="mt-1">
                                                                {automation.description}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={automation.enabled}
                                                        onCheckedChange={() => toggleAutomation(automation.id)}
                                                    />
                                                    <Badge variant={automation.enabled ? 'default' : 'secondary'}>
                                                        {automation.enabled ? 'Active' : 'Disabled'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Workflow Visualization */}
                                            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-background rounded-full border">
                                                            <Zap className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">TRIGGER</p>
                                                            <p className="text-sm font-medium">{automation.trigger.value}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />

                                                {automation.conditions.length > 0 && (
                                                    <>
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-2 bg-background rounded-full border">
                                                                    <Filter className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-medium text-muted-foreground">CONDITION</p>
                                                                    <p className="text-sm font-medium">
                                                                        {automation.conditions[0].field} {automation.conditions[0].operator} {automation.conditions[0].value}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                                    </>
                                                )}

                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="p-2 bg-background rounded-full border">
                                                            <Send className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-medium text-muted-foreground">ACTION</p>
                                                            <p className="text-sm font-medium">{automation.actions[0].value}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Stats and Actions */}
                                            <div className="flex items-center justify-between pt-2 border-t">
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Activity className="h-3 w-3" />
                                                        {automation.executions} executions
                                                    </span>
                                                    {automation.lastRun && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            Last run: {automation.lastRun.toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => duplicateAutomation(automation)}>
                                                        <Copy className="h-3 w-3 mr-1" />
                                                        Duplicate
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => openEditDialog(automation)}>
                                                        <Edit2 className="h-3 w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => deleteAutomation(automation.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* Templates Tab */}
                <TabsContent value="templates" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Popular Automation Templates</CardTitle>
                            <CardDescription>
                                Start with pre-built templates and customize to your needs
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {templates.map((template) => {
                                    const Icon = template.icon
                                    return (
                                        <Card key={template.id} className="hover:shadow-lg transition-all cursor-pointer group">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="p-3 rounded-lg bg-muted transition-transform group-hover:scale-110">
                                                        <Icon className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                </div>
                                                <CardTitle className="text-lg mt-3">{template.name}</CardTitle>
                                                <CardDescription>{template.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Badge variant="outline">{template.category}</Badge>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Zap className="h-3 w-3" />
                                                    <span>{template.trigger}</span>
                                                    <ArrowRight className="h-3 w-3" />
                                                    <Send className="h-3 w-3" />
                                                    <span>{template.action}</span>
                                                </div>
                                                <Button
                                                    className="w-full mt-3"
                                                    variant="outline"
                                                    onClick={() => applyTemplate(template.id)}
                                                >
                                                    Use Template
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Workflow Guide Tab */}
                <TabsContent value="guide" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-2xl flex items-center gap-2">
                                <Sparkles className="h-6 w-6 text-muted-foreground" />
                                How to Create Powerful Automations
                            </CardTitle>
                            <CardDescription>
                                Follow this step-by-step guide to build your first workflow
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Step 1 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-muted border flex items-center justify-center font-bold text-lg">
                                        1
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">Choose a Trigger</h3>
                                    <p className="text-muted-foreground mb-3">
                                        Select what event should start your automation. This could be creating a task, updating a project, reaching a budget threshold, or a scheduled time.
                                    </p>
                                    <div className="grid gap-2 md:grid-cols-2">
                                        <div className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Zap className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Event-based</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Task created, Project updated, Status changed
                                            </p>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Time-based</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Daily at 9 AM, Every Friday, Monthly reports
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-muted border flex items-center justify-center font-bold text-lg">
                                        2
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">Add Conditions (Optional)</h3>
                                    <p className="text-muted-foreground mb-3">
                                        Filter when your automation should run by adding conditions. Only run the automation if certain criteria are met.
                                    </p>
                                    <div className="grid gap-2 md:grid-cols-3">
                                        <div className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Filter className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Priority</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                If priority = HIGH
                                            </p>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Budget</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                If spent {'>'} 80%
                                            </p>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium text-sm">Due Date</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                If overdue {'>'} 3 days
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 rounded-full bg-muted border flex items-center justify-center font-bold text-lg">
                                        3
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">Define Actions</h3>
                                    <p className="text-muted-foreground mb-3">
                                        Specify what should happen when the trigger fires and conditions are met. You can add multiple actions.
                                    </p>
                                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                        <div className="p-3 border rounded-lg bg-card">
                                            <Mail className="h-4 w-4 text-muted-foreground mb-2" />
                                            <span className="font-medium text-sm block">Send Email</span>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <Bell className="h-4 w-4 text-muted-foreground mb-2" />
                                            <span className="font-medium text-sm block">Notify User</span>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <FolderKanban className="h-4 w-4 text-muted-foreground mb-2" />
                                            <span className="font-medium text-sm block">Create Task</span>
                                        </div>
                                        <div className="p-3 border rounded-lg bg-card">
                                            <User className="h-4 w-4 text-muted-foreground mb-2" />
                                            <span className="font-medium text-sm block">Assign User</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Flow Example */}
                            <div className="border-t pt-6">
                                <h3 className="font-bold text-lg mb-4">Example Workflow</h3>
                                <div className="flex items-center gap-3 p-6 bg-muted rounded-lg border">
                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-background border flex items-center justify-center">
                                            <Zap className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">Task Created</p>
                                        <p className="text-xs text-muted-foreground mt-1">Trigger</p>
                                    </div>

                                    <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-background border flex items-center justify-center">
                                            <Filter className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">Priority = HIGH</p>
                                        <p className="text-xs text-muted-foreground mt-1">Condition</p>
                                    </div>

                                    <ArrowRight className="h-6 w-6 text-muted-foreground flex-shrink-0" />

                                    <div className="flex-1 text-center">
                                        <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-background border flex items-center justify-center">
                                            <Mail className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="font-medium">Email PM</p>
                                        <p className="text-xs text-muted-foreground mt-1">Action</p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA */}
                            <div className="flex justify-center pt-4">
                                <Button variant="outline" size="lg" onClick={() => {
                                    setActiveTab('automations')
                                    setCreateDialogOpen(true)
                                }}>
                                    <Plus className="mr-2 h-5 w-5" />
                                    Create Your First Automation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Use Cases */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Common Use Cases</CardTitle>
                            <CardDescription>
                                Real-world examples of how teams use automations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                        <h4 className="font-medium">Critical Task Alerts</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        When a high-priority task is created, immediately notify the project manager and team lead.
                                    </p>
                                    <Badge variant="outline" className="text-xs">Saves 30+ min/day</Badge>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                        <h4 className="font-medium">Budget Monitoring</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Alert finance team when any project exceeds 80% of allocated budget.
                                    </p>
                                    <Badge variant="outline" className="text-xs">Prevents overspend</Badge>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                        <h4 className="font-medium">Weekly Reports</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Automatically generate and send project status reports every Friday at 4 PM.
                                    </p>
                                    <Badge variant="outline" className="text-xs">Saves 2+ hours/week</Badge>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="h-5 w-5 text-muted-foreground" />
                                        <h4 className="font-medium">OKR Reminders</h4>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Remind goal owners to update their OKR progress at the end of each week.
                                    </p>
                                    <Badge variant="outline" className="text-xs">Improves tracking</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Automation</DialogTitle>
                        <DialogDescription>
                            Update your automation workflow
                        </DialogDescription>
                    </DialogHeader>
                    {editingAutomation && (
                        <form onSubmit={handleEditAutomation} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Automation Name *</Label>
                                <Input
                                    id="edit-name"
                                    name="name"
                                    defaultValue={editingAutomation.name}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">Description</Label>
                                <Textarea
                                    id="edit-description"
                                    name="description"
                                    defaultValue={editingAutomation.description}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-category">Category *</Label>
                                <Select name="category" defaultValue={editingAutomation.category} required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="tasks">Tasks</SelectItem>
                                        <SelectItem value="projects">Projects</SelectItem>
                                        <SelectItem value="okrs">Goals & OKRs</SelectItem>
                                        <SelectItem value="financial">Financial</SelectItem>
                                        <SelectItem value="notifications">Notifications</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-muted-foreground" />
                                    Trigger
                                </h4>
                                <div className="grid gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-triggerType">Trigger Type *</Label>
                                        <Select name="triggerType" defaultValue={editingAutomation.trigger.type} required>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="task_created">Task Created</SelectItem>
                                                <SelectItem value="task_updated">Task Updated</SelectItem>
                                                <SelectItem value="task_overdue">Task Overdue</SelectItem>
                                                <SelectItem value="project_created">Project Created</SelectItem>
                                                <SelectItem value="budget_update">Budget Updated</SelectItem>
                                                <SelectItem value="milestone_completed">Milestone Completed</SelectItem>
                                                <SelectItem value="schedule">Schedule (Time-based)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-triggerValue">Trigger Details</Label>
                                        <Input
                                            id="edit-triggerValue"
                                            name="triggerValue"
                                            defaultValue={editingAutomation.trigger.value}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <Send className="h-4 w-4 text-muted-foreground" />
                                    Action
                                </h4>
                                <div className="grid gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-actionType">Action Type *</Label>
                                        <Select name="actionType" defaultValue={editingAutomation.actions[0]?.type} required>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="send_email">Send Email</SelectItem>
                                                <SelectItem value="send_notification">Send Notification</SelectItem>
                                                <SelectItem value="create_task">Create Task</SelectItem>
                                                <SelectItem value="update_status">Update Status</SelectItem>
                                                <SelectItem value="assign_user">Assign to User</SelectItem>
                                                <SelectItem value="add_comment">Add Comment</SelectItem>
                                                <SelectItem value="generate_report">Generate Report</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-actionValue">Action Details *</Label>
                                        <Input
                                            id="edit-actionValue"
                                            name="actionValue"
                                            defaultValue={editingAutomation.actions[0]?.value}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => {
                                    setEditDialogOpen(false)
                                    setEditingAutomation(null)
                                }}>
                                    Cancel
                                </Button>
                                <Button type="submit" variant="outline">
                                    <Check className="mr-2 h-4 w-4" />
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

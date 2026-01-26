'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { Filter, Grid3x3, List, Plus, Loader2, Inbox, AlertCircle } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"

interface BacklogItem {
    id: string
    title: string
    description: string
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED'
    dueDate?: string
    estimatedHours?: number
    storyPoints?: number
    project?: {
        id: string
        name: string
        code: string
    }
    assignee?: {
        id: string
        firstName: string
        lastName: string
    }
    sprint?: {
        id: string
        name: string
    }
    createdAt: string
}

export default function BacklogPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterPriority, setFilterPriority] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch backlog items
    const fetchBacklogItems = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/tasks')
            if (response.ok) {
                const data = await response.json()
                // Transform API response to match BacklogItem interface
                const transformedItems: BacklogItem[] = (data.tasks || []).map((task: any) => ({
                    id: task.id,
                    title: task.title,
                    description: task.description || '',
                    priority: task.priority || 'MEDIUM',
                    status: task.status || 'TODO',
                    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : undefined,
                    estimatedHours: task.estimatedHours || undefined,
                    storyPoints: task.storyPoints || undefined,
                    project: task.project ? {
                        id: task.project.id,
                        name: task.project.name,
                        code: task.project.code
                    } : undefined,
                    assignee: task.assignee ? {
                        id: task.assignee.id,
                        firstName: task.assignee.firstName || '',
                        lastName: task.assignee.lastName || ''
                    } : undefined,
                    sprint: task.sprint ? {
                        id: task.sprint.id,
                        name: task.sprint.name
                    } : undefined,
                    createdAt: task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                }))
                setBacklogItems(transformedItems)
            } else {
                console.error('Failed to fetch backlog items:', response.statusText)
                setBacklogItems([])
            }
        } catch (error) {
            console.error('Error fetching backlog items:', error)
            setBacklogItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBacklogItems()
    }, [])

    // Filter backlog items
    const filteredItems = backlogItems.filter(item => {
        if (filterPriority !== 'all' && item.priority !== filterPriority) return false
        if (filterStatus !== 'all' && item.status !== filterStatus) return false
        return true
    })

    const getPriorityColor = (priority: string) => {
        const colors = {
            LOW: 'bg-slate-500',
            MEDIUM: 'bg-blue-500',
            HIGH: 'bg-amber-500',
            CRITICAL: 'bg-red-500',
        }
        return colors[priority as keyof typeof colors] || 'bg-gray-500'
    }

    const getPriorityLabel = (priority: string) => {
        return priority.charAt(0) + priority.slice(1).toLowerCase()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Backlog
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage and prioritize your product backlog items and tasks
                        </p>
                    </div>

                    <button 
                        onClick={() => {
                          if (!router) {
                            console.error('[Backlog] Router not available')
                            return
                          }
                          router.push('/backlog/new')
                        }}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Item
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Items</div>
                            <div className="text-lg font-semibold">{backlogItems.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">High Priority</div>
                            <div className="text-lg font-semibold">{backlogItems.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Blocked</div>
                            <div className="text-lg font-semibold">{backlogItems.filter(i => i.status === 'BLOCKED').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Unassigned</div>
                            <div className="text-lg font-semibold">{backlogItems.filter(i => !i.assignee).length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and View Toggle */}
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Filter className="h-5 w-5 text-muted-foreground" />
                                <Select value={filterPriority} onValueChange={setFilterPriority}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by priority" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Priorities</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="LOW">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="TODO">To Do</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={view === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('list')}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    List
                                </Button>
                                <Button
                                    variant={view === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('grid')}
                                >
                                    <Grid3x3 className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Backlog Content */}
                    {backlogItems.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No backlog items yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Add items to your backlog to start tracking and prioritizing work.
                                </p>
                                <Button onClick={() => router.push('/backlog/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Item
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {filteredItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => {
                                                      if (!router) {
                                                        console.error('[Backlog] Router not available')
                                                        return
                                                      }
                                                      router.push(`/tasks/${item.id}`)
                                                    }}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={cn("h-2 w-2 rounded-full mt-2", getPriorityColor(item.priority))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h4 className="text-base font-semibold">{item.title}</h4>
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "text-xs",
                                                                            item.priority === 'CRITICAL' && "border-red-500 text-red-600",
                                                                            item.priority === 'HIGH' && "border-amber-500 text-amber-600",
                                                                            item.priority === 'MEDIUM' && "border-blue-500 text-blue-600",
                                                                            item.priority === 'LOW' && "border-slate-500 text-slate-600"
                                                                        )}
                                                                    >
                                                                        {getPriorityLabel(item.priority)}
                                                                    </Badge>
                                                                    <StatusBadge status={item.status} />
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                                                                    {item.project && (
                                                                        <>
                                                                            <span>Project: {item.project.name}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    {item.assignee && (
                                                                        <>
                                                                            <span>Assigned to: {item.assignee.firstName} {item.assignee.lastName}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    {item.dueDate && (
                                                                        <>
                                                                            <span>Due: {formatDate(item.dueDate)}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    {item.storyPoints && (
                                                                        <span>{item.storyPoints} points</span>
                                                                    )}
                                                                    {item.estimatedHours && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>{item.estimatedHours}h estimated</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {item.status === 'BLOCKED' && (
                                                            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredItems.map((item) => (
                                        <Card key={item.id} className="hover-lift cursor-pointer" onClick={() => {
                                          if (!router) {
                                            console.error('[Backlog] Router not available')
                                            return
                                          }
                                          router.push(`/tasks/${item.id}`)
                                        }}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                                                        <CardDescription className="text-xs line-clamp-2 mt-1">{item.description}</CardDescription>
                                                    </div>
                                                    <div className={cn("h-3 w-3 rounded-full", getPriorityColor(item.priority))} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "text-xs",
                                                                item.priority === 'CRITICAL' && "border-red-500 text-red-600",
                                                                item.priority === 'HIGH' && "border-amber-500 text-amber-600",
                                                                item.priority === 'MEDIUM' && "border-blue-500 text-blue-600",
                                                                item.priority === 'LOW' && "border-slate-500 text-slate-600"
                                                            )}
                                                        >
                                                            {getPriorityLabel(item.priority)}
                                                        </Badge>
                                                        <StatusBadge status={item.status} />
                                                    </div>
                                                    {item.project && (
                                                        <div className="text-xs text-slate-500">
                                                            Project: {item.project.name}
                                                        </div>
                                                    )}
                                                    {item.assignee && (
                                                        <div className="text-xs text-slate-500">
                                                            Assigned to: {item.assignee.firstName} {item.assignee.lastName}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        {item.dueDate && (
                                                            <div>Due: {formatDate(item.dueDate)}</div>
                                                        )}
                                                        {item.storyPoints && (
                                                            <div>Story Points: {item.storyPoints}</div>
                                                        )}
                                                        {item.estimatedHours && (
                                                            <div>Estimated: {item.estimatedHours}h</div>
                                                        )}
                                                    </div>
                                                    {item.status === 'BLOCKED' && (
                                                        <div className="flex items-center gap-2 text-xs text-red-500 pt-2 border-t">
                                                            <AlertCircle className="h-4 w-4" />
                                                            <span>Blocked</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
        </div>
    )
}


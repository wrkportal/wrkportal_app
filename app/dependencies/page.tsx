'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { Filter, Grid3x3, List, Plus, Loader2, GitBranch, AlertTriangle, CheckCircle2 } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"

interface Dependency {
    id: string
    name: string
    description: string
    type: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED_TO' | 'DEPENDS_ON'
    status: 'ACTIVE' | 'RESOLVED' | 'AT_RISK' | 'BLOCKED'
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    sourceItem: {
        id: string
        name: string
        type: 'PROJECT' | 'TASK' | 'FEATURE' | 'RELEASE'
        project?: {
            id: string
            name: string
            code: string
        }
    }
    targetItem: {
        id: string
        name: string
        type: 'PROJECT' | 'TASK' | 'FEATURE' | 'RELEASE'
        project?: {
            id: string
            name: string
            code: string
        }
    }
    impact: string
    mitigation?: string
    createdAt: string
    resolvedAt?: string
}

export default function DependenciesPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [dependencies, setDependencies] = useState<Dependency[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch dependencies
    const fetchDependencies = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/dependencies')
            if (response.ok) {
                const data = await response.json()
                const apiDependencies = data.dependencies || []
                
                // Transform API data to match Dependency interface
                const transformedDependencies: Dependency[] = apiDependencies.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    description: d.description || '',
                    type: d.type,
                    status: d.status,
                    priority: d.priority,
                    sourceItem: d.sourceItem || {
                        id: d.sourceId,
                        name: 'Unknown',
                        type: d.sourceType,
                    },
                    targetItem: d.targetItem || {
                        id: d.targetId,
                        name: 'Unknown',
                        type: d.targetType,
                    },
                    impact: d.impact || '',
                    mitigation: d.mitigation || '',
                    createdAt: d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '',
                    resolvedAt: d.resolvedAt ? new Date(d.resolvedAt).toISOString().split('T')[0] : undefined,
                }))
                
                setDependencies(transformedDependencies)
                setLoading(false)
                return
            }
            
            // Fallback to empty array if API fails
            setDependencies([])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching dependencies:', error)
            setDependencies([])
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDependencies()
    }, [])

    // Filter dependencies
    const filteredDependencies = dependencies.filter(dep => {
        if (filterType !== 'all' && dep.type !== filterType) return false
        if (filterStatus !== 'all' && dep.status !== filterStatus) return false
        return true
    })

    const getStatusColor = (status: string) => {
        const colors = {
            ACTIVE: 'bg-blue-500',
            RESOLVED: 'bg-green-500',
            AT_RISK: 'bg-amber-500',
            BLOCKED: 'bg-red-500',
        }
        return colors[status as keyof typeof colors] || 'bg-gray-500'
    }

    const getTypeLabel = (type: string) => {
        const labels = {
            BLOCKS: 'Blocks',
            BLOCKED_BY: 'Blocked By',
            RELATED_TO: 'Related To',
            DEPENDS_ON: 'Depends On',
        }
        return labels[type as keyof typeof labels] || type
    }

    const getPriorityColor = (priority: string) => {
        const colors = {
            LOW: 'bg-slate-500',
            MEDIUM: 'bg-blue-500',
            HIGH: 'bg-amber-500',
            CRITICAL: 'bg-red-500',
        }
        return colors[priority as keyof typeof colors] || 'bg-gray-500'
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
                            Dependencies
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Track and manage dependencies between projects, tasks, and features
                        </p>
                    </div>

                    <button 
                        onClick={() => router.push('/dependencies/new')}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Dependency
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Dependencies</div>
                            <div className="text-lg font-semibold">{dependencies.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Active</div>
                            <div className="text-lg font-semibold">{dependencies.filter(d => d.status === 'ACTIVE').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">At Risk</div>
                            <div className="text-lg font-semibold">{dependencies.filter(d => d.status === 'AT_RISK').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Blocked</div>
                            <div className="text-lg font-semibold">{dependencies.filter(d => d.status === 'BLOCKED').length}</div>
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
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="DEPENDS_ON">Depends On</SelectItem>
                                        <SelectItem value="BLOCKED_BY">Blocked By</SelectItem>
                                        <SelectItem value="BLOCKS">Blocks</SelectItem>
                                        <SelectItem value="RELATED_TO">Related To</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="AT_RISK">At Risk</SelectItem>
                                        <SelectItem value="BLOCKED">Blocked</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
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

                    {/* Dependencies Content */}
                    {dependencies.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <GitBranch className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No dependencies yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Track relationships and dependencies between projects, tasks, and features.
                                </p>
                                <Button onClick={() => router.push('/dependencies/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Dependency
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {filteredDependencies.map((dep) => (
                                                <div
                                                    key={dep.id}
                                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/dependencies/${dep.id}`)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={cn("h-2 w-2 rounded-full mt-2", getStatusColor(dep.status))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h4 className="text-base font-semibold">{dep.name}</h4>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {getTypeLabel(dep.type)}
                                                                    </Badge>
                                                                    <StatusBadge status={dep.status} />
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "text-xs",
                                                                            dep.priority === 'CRITICAL' && "border-red-500 text-red-600",
                                                                            dep.priority === 'HIGH' && "border-amber-500 text-amber-600",
                                                                            dep.priority === 'MEDIUM' && "border-blue-500 text-blue-600",
                                                                            dep.priority === 'LOW' && "border-slate-500 text-slate-600"
                                                                        )}
                                                                    >
                                                                        {dep.priority}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2">{dep.description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2 flex-wrap">
                                                                    <span className="font-medium">{dep.sourceItem.name}</span>
                                                                    <span className="text-purple-600">→</span>
                                                                    <span className="font-medium">{dep.targetItem.name}</span>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground space-y-1">
                                                                    <div><span className="font-medium">Impact:</span> {dep.impact}</div>
                                                                    {dep.mitigation && (
                                                                        <div><span className="font-medium">Mitigation:</span> {dep.mitigation}</div>
                                                                    )}
                                                                    {dep.resolvedAt && (
                                                                        <div className="text-green-600 flex items-center gap-1">
                                                                            <CheckCircle2 className="h-3 w-3" />
                                                                            <span>Resolved on {formatDate(dep.resolvedAt)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {dep.status === 'BLOCKED' && (
                                                            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                                        )}
                                                        {dep.status === 'AT_RISK' && (
                                                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredDependencies.map((dep) => (
                                        <Card key={dep.id} className="hover-lift cursor-pointer" onClick={() => router.push(`/dependencies/${dep.id}`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base line-clamp-2">{dep.name}</CardTitle>
                                                        <CardDescription className="text-xs line-clamp-2 mt-1">{dep.description}</CardDescription>
                                                    </div>
                                                    <div className={cn("h-3 w-3 rounded-full", getStatusColor(dep.status))} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge variant="outline" className="text-xs">
                                                            {getTypeLabel(dep.type)}
                                                        </Badge>
                                                        <StatusBadge status={dep.status} />
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "text-xs",
                                                                dep.priority === 'CRITICAL' && "border-red-500 text-red-600",
                                                                dep.priority === 'HIGH' && "border-amber-500 text-amber-600",
                                                                dep.priority === 'MEDIUM' && "border-blue-500 text-blue-600",
                                                                dep.priority === 'LOW' && "border-slate-500 text-slate-600"
                                                            )}
                                                        >
                                                            {dep.priority}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-slate-700">{dep.sourceItem.name}</span>
                                                            <span className="text-purple-600">→</span>
                                                            <span className="font-medium text-slate-700">{dep.targetItem.name}</span>
                                                        </div>
                                                        {dep.sourceItem.project && (
                                                            <div className="text-slate-500">
                                                                Project: {dep.sourceItem.project.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-600 pt-2 border-t">
                                                        <div className="font-medium mb-1">Impact:</div>
                                                        <div className="text-slate-500 line-clamp-2">{dep.impact}</div>
                                                    </div>
                                                    {dep.mitigation && (
                                                        <div className="text-xs text-slate-600 pt-2 border-t">
                                                            <div className="font-medium mb-1">Mitigation:</div>
                                                            <div className="text-slate-500 line-clamp-2">{dep.mitigation}</div>
                                                        </div>
                                                    )}
                                                    {dep.resolvedAt && (
                                                        <div className="text-xs text-green-600 flex items-center gap-1 pt-2 border-t">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Resolved {formatDate(dep.resolvedAt)}</span>
                                                        </div>
                                                    )}
                                                    {(dep.status === 'BLOCKED' || dep.status === 'AT_RISK') && (
                                                        <div className="flex items-center gap-2 text-xs pt-2 border-t">
                                                            <AlertTriangle className={cn(
                                                                "h-4 w-4",
                                                                dep.status === 'BLOCKED' ? "text-red-500" : "text-amber-500"
                                                            )} />
                                                            <span className={dep.status === 'BLOCKED' ? "text-red-500" : "text-amber-500"}>
                                                                {dep.status === 'BLOCKED' ? 'Blocked' : 'At Risk'}
                                                            </span>
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


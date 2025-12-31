'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { Calendar, Filter, Grid3x3, List, Plus, Loader2, Rocket, Target } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"

interface Sprint {
    id: string
    name: string
    goal: string
    status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
    startDate: string
    endDate: string
    project?: {
        id: string
        name: string
        code: string
    }
    progress: number
    totalTasks: number
    completedTasks: number
    storyPoints: number
    completedStoryPoints: number
    velocity: number
}

export default function SprintsPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch sprints
    const fetchSprints = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/sprints')
            if (response.ok) {
                const data = await response.json()
                const apiSprints = data.sprints || []
                
                // Transform API data to match Sprint interface
                const transformedSprints: Sprint[] = apiSprints.map((s: any) => ({
                    id: s.id,
                    name: s.name,
                    goal: s.goal,
                    description: s.description || '',
                    status: s.status,
                    startDate: s.startDate ? new Date(s.startDate).toISOString().split('T')[0] : '',
                    endDate: s.endDate ? new Date(s.endDate).toISOString().split('T')[0] : '',
                    project: s.project ? {
                        id: s.project.id,
                        name: s.project.name,
                        code: s.project.code,
                    } : undefined,
                    progress: s.progress || 0,
                    totalTasks: s.totalTasks || 0,
                    completedTasks: s.completedTasks || 0,
                    storyPoints: s.storyPoints || 0,
                    completedStoryPoints: s.completedStoryPoints || 0,
                    velocity: s.velocity || 0,
                }))
                
                setSprints(transformedSprints)
                setLoading(false)
                return
            }
            
            // Fallback to empty array if API fails
            setSprints([])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching sprints:', error)
            setSprints([])
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSprints()
    }, [])

    // Filter sprints
    const filteredSprints = filterStatus === 'all'
        ? sprints
        : sprints.filter(s => s.status === filterStatus)

    const getStatusColor = (status: string) => {
        const colors = {
            PLANNED: 'bg-slate-500',
            ACTIVE: 'bg-blue-500',
            COMPLETED: 'bg-green-500',
            CANCELLED: 'bg-red-500',
        }
        return colors[status as keyof typeof colors] || 'bg-gray-500'
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
                            Sprints
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage agile sprints, track velocity, and monitor sprint progress
                        </p>
                    </div>

                    <button 
                        onClick={() => router.push('/sprints/new')}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Sprint
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Sprints</div>
                            <div className="text-lg font-semibold">{sprints.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Active</div>
                            <div className="text-lg font-semibold">{sprints.filter(s => s.status === 'ACTIVE').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Planned</div>
                            <div className="text-lg font-semibold">{sprints.filter(s => s.status === 'PLANNED').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Completed</div>
                            <div className="text-lg font-semibold">{sprints.filter(s => s.status === 'COMPLETED').length}</div>
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
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="PLANNED">Planned</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
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

                    {/* Sprints Content */}
                    {sprints.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Rocket className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No sprints yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create your first sprint to start tracking agile development cycles.
                                </p>
                                <Button onClick={() => router.push('/sprints/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Sprint
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {filteredSprints.map((sprint) => (
                                                <div
                                                    key={sprint.id}
                                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/sprints/${sprint.id}`)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={cn("h-2 w-2 rounded-full mt-2", getStatusColor(sprint.status))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-base font-semibold">{sprint.name}</h4>
                                                                    <StatusBadge status={sprint.status} />
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2">{sprint.goal}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    {sprint.project && (
                                                                        <>
                                                                            <span>Project: {sprint.project.name}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    <span>Start: {formatDate(sprint.startDate)}</span>
                                                                    <span>•</span>
                                                                    <span>End: {formatDate(sprint.endDate)}</span>
                                                                    <span>•</span>
                                                                    <span>Progress: {sprint.progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Tasks</div>
                                                                <div className="font-semibold">{sprint.completedTasks}/{sprint.totalTasks}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Story Points</div>
                                                                <div className="font-semibold">{sprint.completedStoryPoints}/{sprint.storyPoints}</div>
                                                            </div>
                                                            {sprint.status === 'COMPLETED' && sprint.velocity > 0 && (
                                                                <div className="text-right">
                                                                    <div className="text-xs text-muted-foreground">Velocity</div>
                                                                    <div className="font-semibold text-green-600">{sprint.velocity}</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredSprints.map((sprint) => (
                                        <Card key={sprint.id} className="hover-lift cursor-pointer" onClick={() => router.push(`/sprints/${sprint.id}`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base">{sprint.name}</CardTitle>
                                                        <CardDescription className="text-xs line-clamp-2 mt-1">{sprint.goal}</CardDescription>
                                                    </div>
                                                    <div className={cn("h-3 w-3 rounded-full", getStatusColor(sprint.status))} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-slate-600">Progress</span>
                                                            <span className="font-semibold text-purple-600">{sprint.progress}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                style={{ width: `${sprint.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">Status</span>
                                                        <StatusBadge status={sprint.status} />
                                                    </div>
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        <div>Start: {formatDate(sprint.startDate)}</div>
                                                        <div>End: {formatDate(sprint.endDate)}</div>
                                                    </div>
                                                    {sprint.project && (
                                                        <div className="text-xs text-slate-500">
                                                            Project: {sprint.project.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between pt-2 border-t">
                                                        <div className="text-xs">
                                                            <span className="text-slate-600 font-medium">{sprint.completedTasks}/{sprint.totalTasks}</span>
                                                            <span className="text-slate-400 ml-1">tasks</span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-slate-600 font-medium">{sprint.completedStoryPoints}/{sprint.storyPoints}</span>
                                                            <span className="text-slate-400 ml-1">points</span>
                                                        </div>
                                                    </div>
                                                    {sprint.status === 'COMPLETED' && sprint.velocity > 0 && (
                                                        <div className="text-xs text-center pt-2 border-t">
                                                            <span className="text-green-600 font-semibold">Velocity: {sprint.velocity} points</span>
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


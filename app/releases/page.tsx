'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { Calendar, Filter, Grid3x3, List, Plus, Loader2, Package, Tag } from "lucide-react"
import { StatusBadge } from "@/components/common/status-badge"

interface Release {
    id: string
    name: string
    version: string
    description: string
    status: 'PLANNED' | 'IN_PROGRESS' | 'RELEASED' | 'CANCELLED'
    releaseDate: string
    targetDate: string
    project?: {
        id: string
        name: string
        code: string
    }
    progress: number
    features: number
    bugs: number
}

export default function ReleasesPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [releases, setReleases] = useState<Release[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch releases
    const fetchReleases = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/releases')
            if (response.ok) {
                const data = await response.json()
                const apiReleases = data.releases || []
                
                // Transform API data to match Release interface
                const transformedReleases: Release[] = apiReleases.map((r: any) => ({
                    id: r.id,
                    name: r.name,
                    version: r.version,
                    description: r.description || '',
                    status: r.status,
                    releaseDate: r.releaseDate ? new Date(r.releaseDate).toISOString().split('T')[0] : '',
                    targetDate: r.targetDate ? new Date(r.targetDate).toISOString().split('T')[0] : '',
                    project: r.project ? {
                        id: r.project.id,
                        name: r.project.name,
                        code: r.project.code,
                    } : undefined,
                    progress: r.progress || 0,
                    features: r.features || 0,
                    bugs: r.bugs || 0,
                }))
                
                setReleases(transformedReleases)
                setLoading(false)
                return
            }
            
            // Fallback to empty array if API fails
            setReleases([])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching releases:', error)
            setReleases([])
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReleases()
    }, [])

    // Filter releases
    const filteredReleases = filterStatus === 'all'
        ? releases
        : releases.filter(r => r.status === filterStatus)

    const getStatusColor = (status: string) => {
        const colors = {
            PLANNED: 'bg-slate-500',
            IN_PROGRESS: 'bg-blue-500',
            RELEASED: 'bg-green-500',
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
                            Releases
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage product releases, versions, and deployment schedules
                        </p>
                    </div>

                    <button 
                        onClick={() => router.push('/releases/new')}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Release
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Releases</div>
                            <div className="text-lg font-semibold">{releases.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">In Progress</div>
                            <div className="text-lg font-semibold">{releases.filter(r => r.status === 'IN_PROGRESS').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Planned</div>
                            <div className="text-lg font-semibold">{releases.filter(r => r.status === 'PLANNED').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Released</div>
                            <div className="text-lg font-semibold">{releases.filter(r => r.status === 'RELEASED').length}</div>
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
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="RELEASED">Released</SelectItem>
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

                    {/* Releases Content */}
                    {releases.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No releases yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create your first release to start tracking product versions and deployments.
                                </p>
                                <Button onClick={() => router.push('/releases/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Release
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {filteredReleases.map((release) => (
                                                <div
                                                    key={release.id}
                                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/releases/${release.id}`)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={cn("h-2 w-2 rounded-full mt-2", getStatusColor(release.status))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h4 className="text-base font-semibold">{release.name}</h4>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {release.version}
                                                                    </Badge>
                                                                    <StatusBadge status={release.status} />
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2">{release.description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                                    {release.project && (
                                                                        <>
                                                                            <span>Project: {release.project.name}</span>
                                                                            <span>•</span>
                                                                        </>
                                                                    )}
                                                                    <span>Target: {formatDate(release.targetDate)}</span>
                                                                    {release.releaseDate && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span>Released: {formatDate(release.releaseDate)}</span>
                                                                        </>
                                                                    )}
                                                                    <span>•</span>
                                                                    <span>Progress: {release.progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Features</div>
                                                                <div className="font-semibold">{release.features}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Bugs</div>
                                                                <div className="font-semibold text-red-500">{release.bugs}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredReleases.map((release) => (
                                        <Card key={release.id} className="hover-lift cursor-pointer" onClick={() => router.push(`/releases/${release.id}`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <CardTitle className="text-base">{release.name}</CardTitle>
                                                            <Badge variant="outline" className="text-xs">
                                                                {release.version}
                                                            </Badge>
                                                        </div>
                                                        <CardDescription className="text-xs line-clamp-2">{release.description}</CardDescription>
                                                    </div>
                                                    <div className={cn("h-3 w-3 rounded-full", getStatusColor(release.status))} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-slate-600">Progress</span>
                                                            <span className="font-semibold text-purple-600">{release.progress}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                style={{ width: `${release.progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">Status</span>
                                                        <StatusBadge status={release.status} />
                                                    </div>
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        <div>Target: {formatDate(release.targetDate)}</div>
                                                        {release.releaseDate && (
                                                            <div>Released: {formatDate(release.releaseDate)}</div>
                                                        )}
                                                    </div>
                                                    {release.project && (
                                                        <div className="text-xs text-slate-500">
                                                            Project: {release.project.name}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center justify-between pt-2 border-t">
                                                        <div className="text-xs">
                                                            <span className="text-slate-600 font-medium">{release.features}</span>
                                                            <span className="text-slate-400 ml-1">features</span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-red-500 font-medium">{release.bugs}</span>
                                                            <span className="text-slate-400 ml-1">bugs</span>
                                                        </div>
                                                    </div>
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


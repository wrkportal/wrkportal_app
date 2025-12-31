'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"
import { formatDate, formatCurrency, getInitials, cn } from "@/lib/utils"
import { Plus, Filter, Download, LayoutGrid, List, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useWorkflowTerminology } from "@/hooks/useWorkflowTerminology"

export default function ProjectsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const { getTerm } = useWorkflowTerminology()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [projects, setProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const response = await fetch('/api/projects')
                if (response.ok) {
                    const data = await response.json()
                    setProjects(data.projects || [])
                }
            } catch (error) {
                console.error('Error fetching projects:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchProjects()
    }, [])

    // Get only standalone projects (projects without a program)
    const standaloneProjects = projects.filter(p => !p.programId)

    const filteredProjects = standaloneProjects.filter(project => {
        if (filterStatus === 'all') return true
        return project.status === filterStatus
    })

    const getManager = (managerId: string) => {
        // Since we don't have users loaded here, return a placeholder
        return { firstName: 'Project', lastName: 'Manager' }
    }

    const columns: Column<any>[] = [
        {
            key: 'name',
            header: `${getTerm('project')} Name`,
            accessor: (project) => (
                <div>
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{project.code}</div>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (project) => (
                <div className="space-y-1">
                    <StatusBadge status={project.status} />
                    {project.ragStatus && (
                        <div className="mt-1">
                            <StatusBadge status={project.ragStatus} />
                        </div>
                    )}
                </div>
            ),
            sortable: true,
        },
        {
            key: 'progress',
            header: 'Progress',
            accessor: (project) => (
                <div className="space-y-1 min-w-[150px]">
                    <div className="flex items-center justify-between text-sm">
                        <span>{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                </div>
            ),
            sortable: true,
        },
        {
            key: 'dates',
            header: 'Timeline',
            accessor: (project) => (
                <div className="text-sm">
                    <div>{formatDate(project.startDate)}</div>
                    <div className="text-muted-foreground">to {formatDate(project.endDate)}</div>
                </div>
            ),
            sortable: true,
        },
    ]

    if (isLoading) {
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
                        {getTerm('projects')}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and track standalone {getTerm('projects').toLowerCase()} (not assigned to programs)
                    </p>
                </div>

                <button 
                    onClick={() => router.push('/projects/new')}
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                >
                    + New {getTerm('project')}
                </button>
            </div>

            {/* SCROLL CONTENT */}
            <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total {getTerm('projects')}</div>
                            <div className="text-lg font-semibold">{standaloneProjects.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">In Progress</div>
                            <div className="text-lg font-semibold">{standaloneProjects.filter(p => p.status === 'IN_PROGRESS').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Planning</div>
                            <div className="text-lg font-semibold">{standaloneProjects.filter(p => p.status === 'PLANNING').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Completed</div>
                            <div className="text-lg font-semibold">{standaloneProjects.filter(p => p.status === 'COMPLETED').length}</div>
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
                                        <SelectItem value="PLANNING">Planning</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
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
                                    <LayoutGrid className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Projects Content */}
                    {standaloneProjects.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <LayoutGrid className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No standalone {getTerm('projects').toLowerCase()} yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Standalone {getTerm('projects').toLowerCase()} are {getTerm('projects').toLowerCase()} that are not assigned to any program.
                                </p>
                                <Button onClick={() => router.push('/projects/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First {getTerm('project')}
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <DataTable
                                            data={filteredProjects}
                                            columns={columns}
                                            searchable
                                            searchPlaceholder="Search projects..."
                                            onRowClick={(project) => router.push(`/projects/${project.id}`)}
                                            emptyMessage="No projects found with the selected filters"
                                        />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredProjects.map((project) => (
                                        <Card key={project.id} className="hover-lift cursor-pointer" onClick={() => router.push(`/projects/${project.id}`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base">{project.name}</CardTitle>
                                                        <CardDescription className="text-xs mt-1">{project.code}</CardDescription>
                                                    </div>
                                                    {project.ragStatus && <StatusBadge status={project.ragStatus} />}
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-slate-600">Progress</span>
                                                            <span className="font-semibold text-purple-600">{project.progress || 0}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                style={{ width: `${project.progress || 0}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-slate-500">Status</span>
                                                        <StatusBadge status={project.status} />
                                                    </div>
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        <div>Start: {formatDate(project.startDate)}</div>
                                                        <div>End: {formatDate(project.endDate)}</div>
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


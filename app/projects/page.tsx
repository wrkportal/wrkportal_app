'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"
import { formatDate, formatCurrency, getInitials } from "@/lib/utils"
import { Plus, Filter, Download, LayoutGrid, List, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ProjectsPage() {
    const router = useRouter()
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
            header: 'Project Name',
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
            <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Loading projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and track standalone projects (not assigned to programs)
                    </p>
                </div>
                <Button onClick={() => router.push('/projects/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base">Standalone Projects</CardTitle>
                            <CardDescription className="text-xs">
                                {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'} found
                            </CardDescription>
                        </div>
                        {standaloneProjects.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="PLANNING">Planning</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex border rounded-md">
                                    <Button
                                        variant={view === 'list' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        onClick={() => setView('list')}
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={view === 'grid' ? 'secondary' : 'ghost'}
                                        size="icon"
                                        onClick={() => setView('grid')}
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {standaloneProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                                <LayoutGrid className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-1">No standalone projects yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Standalone projects are projects that are not assigned to any program.
                            </p>
                            <Button onClick={() => router.push('/projects/new')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Your First Project
                            </Button>
                        </div>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <DataTable
                                    data={filteredProjects}
                                    columns={columns}
                                    searchable
                                    searchPlaceholder="Search projects..."
                                    onRowClick={(project) => router.push(`/projects/${project.id}`)}
                                    emptyMessage="No projects found with the selected filters"
                                />
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredProjects.map((project) => (
                                        <Card
                                            key={project.id}
                                            className="cursor-pointer hover:shadow-md transition-shadow"
                                            onClick={() => router.push(`/projects/${project.id}`)}
                                        >
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-0.5">
                                                        <CardTitle className="text-base">{project.name}</CardTitle>
                                                        <CardDescription className="text-xs">{project.code}</CardDescription>
                                                    </div>
                                                    {project.ragStatus && <StatusBadge status={project.ragStatus} />}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-muted-foreground">Progress</span>
                                                        <span className="font-medium">{project.progress || 0}%</span>
                                                    </div>
                                                    <Progress value={project.progress || 0} className="h-1.5" />
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Status</span>
                                                    <StatusBadge status={project.status} />
                                                </div>

                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Due Date</span>
                                                    <span className="font-medium">{formatDate(project.endDate)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


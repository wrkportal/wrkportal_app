'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn } from "@/lib/utils"
import { Calendar, Filter, Grid3x3, List, Plus, TrendingUp, Loader2 } from "lucide-react"
import { ProjectStatus, RAGStatus } from "@/types"
import { InitiativeDialog } from "@/components/dialogs/initiative-dialog"
import { GanttChart } from "@/components/roadmap/gantt-chart"

interface Project {
    id: string
    name: string
    code: string
    description: string
    status: ProjectStatus
    ragStatus?: RAGStatus
    startDate: string
    endDate: string
    progress: number
    manager: {
        id: string
        firstName: string
        lastName: string
    }
    program?: {
        id: string
        name: string
        code: string
    }
}

interface Program {
    id: string
    name: string
    code: string
    description: string
    status: string
    startDate: string
    endDate: string
    budget: number
    owner: {
        id: string
        firstName: string
        lastName: string
    }
    _count: {
        projects: number
    }
}

export default function RoadmapPage() {
    const pathname = usePathname()
    const [view, setView] = useState<'timeline' | 'grid' | 'gantt'>('timeline')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [initiativeDialogOpen, setInitiativeDialogOpen] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])
    const [programs, setPrograms] = useState<Program[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch projects and programs
    const fetchData = async () => {
        try {
            setLoading(true)
            const [projectsRes, programsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/programs')
            ])

            if (projectsRes.ok && programsRes.ok) {
                const projectsData = await projectsRes.json()
                const programsData = await programsRes.json()
                setProjects(projectsData.projects || [])
                setPrograms(programsData.programs || [])
            }
        } catch (error) {
            console.error('Error fetching roadmap data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    // Handle initiative submission
    const handleAddInitiative = async (data: any) => {
        try {
            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: data.name,
                    code: data.code,
                    description: data.description,
                    programId: data.programId || undefined,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    budget: parseFloat(data.budget) || 0,
                    status: data.status,
                    managerId: data.managerId,
                }),
            })

            if (response.ok) {
                alert('✅ Initiative added successfully!')
                setInitiativeDialogOpen(false)
                // Refresh data
                await fetchData()
            } else {
                const error = await response.json()
                alert(`❌ ${error.error || 'Failed to add initiative'}`)
                throw new Error(error.error)
            }
        } catch (error) {
            console.error('Error adding initiative:', error)
            alert('❌ An unexpected error occurred')
            throw error
        }
    }

    // Filter projects
    const filteredProjects = filterStatus === 'all'
        ? projects
        : projects.filter(p => p.status === filterStatus)

    // Group projects by quarter
    const projectsByQuarter = filteredProjects.reduce((acc, project) => {
        const startDate = new Date(project.startDate)
        const quarter = `Q${Math.floor(startDate.getMonth() / 3) + 1} ${startDate.getFullYear()}`
        if (!acc[quarter]) acc[quarter] = []
        acc[quarter].push(project)
        return acc
    }, {} as Record<string, Project[]>)

    const getStatusColor = (status: ProjectStatus) => {
        const colors: Record<ProjectStatus, string> = {
            [ProjectStatus.PLANNING]: 'bg-slate-500',
            [ProjectStatus.IN_PROGRESS]: 'bg-blue-500',
            [ProjectStatus.ON_HOLD]: 'bg-amber-500',
            [ProjectStatus.AT_RISK]: 'bg-orange-500',
            [ProjectStatus.COMPLETED]: 'bg-green-500',
            [ProjectStatus.CANCELLED]: 'bg-red-500',
        }
        return colors[status] || 'bg-gray-500'
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
                            Strategic Roadmap
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            View and manage your project timeline and strategic initiatives
                        </p>
                    </div>

                    <button
                        onClick={() => setInitiativeDialogOpen(true)}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Initiative
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Initiatives</div>
                            <div className="text-lg font-semibold">{projects.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">In Progress</div>
                            <div className="text-lg font-semibold">{projects.filter(p => p.status === 'IN_PROGRESS').length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Planned</div>
                            <div className="text-lg font-semibold">{projects.filter(p => p.status === ProjectStatus.PLANNING).length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Completed</div>
                            <div className="text-lg font-semibold">{projects.filter(p => p.status === 'COMPLETED').length}</div>
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
                                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={view === 'timeline' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('timeline')}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    Timeline
                                </Button>
                                <Button
                                    variant={view === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('grid')}
                                >
                                    <Grid3x3 className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                                <Button
                                    variant={view === 'gantt' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('gantt')}
                                >
                                    <Calendar className="h-4 w-4 mr-2" />
                                    Gantt
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Roadmap Content */}
                    <Tabs defaultValue="projects" className="space-y-4">
                        <TabsList className="bg-muted border">
                            <TabsTrigger value="projects">Projects</TabsTrigger>
                            <TabsTrigger value="programs">Programs</TabsTrigger>
                            <TabsTrigger value="milestones">Milestones</TabsTrigger>
                        </TabsList>

                        <TabsContent value="projects" className="space-y-6">
                            {view === 'gantt' ? (
                                // Gantt Chart View
                                <GanttChart projects={filteredProjects.map(p => ({
                                    id: p.id,
                                    name: p.name,
                                    code: p.code,
                                    status: p.status,
                                    ragStatus: p.ragStatus || RAGStatus.GREEN,
                                    startDate: new Date(p.startDate),
                                    endDate: new Date(p.endDate),
                                    progress: p.progress,
                                    programId: p.program?.id,
                                }))} />
                            ) : view === 'timeline' ? (
                                // Timeline View
                                <div className="space-y-6">
                                    {Object.entries(projectsByQuarter).map(([quarter, projects]) => (
                                        <Card key={quarter}>
                                            <CardHeader>
                                                <CardTitle className="text-base flex items-center gap-2">
                                                    <Calendar className="h-5 w-5 text-purple-600" />
                                                    {quarter}
                                                    <Badge variant="secondary" className="ml-2">{projects.length} Projects</Badge>
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    {projects.map((project) => (
                                                        <div
                                                            key={project.id}
                                                            className="flex items-center gap-4 p-4 bg-muted rounded-xl hover:shadow-md transition-all cursor-pointer"
                                                        >
                                                            <div className={cn("h-2 w-2 rounded-full", getStatusColor(project.status))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <h4 className="text-base font-semibold">{project.name}</h4>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {project.status.replace('_', ' ')}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                                                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                                    <span>Start: {formatDate(project.startDate)}</span>
                                                                    <span>•</span>
                                                                    <span>End: {formatDate(project.endDate)}</span>
                                                                    <span>•</span>
                                                                    <span>Progress: {project.progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                // Grid View
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredProjects.map((project) => (
                                        <Card key={project.id} className="hover-lift cursor-pointer">
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className={cn("h-3 w-3 rounded-full mt-1", getStatusColor(project.status))} />
                                                    <Badge variant="outline" className="text-xs">
                                                        {project.status.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <CardTitle className="text-base mt-2">{project.name}</CardTitle>
                                                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <div className="flex justify-between text-sm mb-1">
                                                            <span className="text-slate-600">Progress</span>
                                                            <span className="font-semibold text-purple-600">{project.progress}%</span>
                                                        </div>
                                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                                                style={{ width: `${project.progress}%` }}
                                                            />
                                                        </div>
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
                        </TabsContent>

                        <TabsContent value="programs" className="space-y-4">
                            <div className="grid gap-6 md:grid-cols-2">
                                {programs.map((program) => (
                                    <Card key={program.id} className="hover-lift cursor-pointer">
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center justify-between">
                                                {program.name}
                                                <Badge variant="outline">
                                                    {program._count.projects} Projects
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription>{program.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-sm text-slate-600">
                                                <div>Owner: {program.owner.firstName} {program.owner.lastName}</div>
                                                <div className="mt-2">
                                                    Start: {formatDate(program.startDate)} • End: {formatDate(program.endDate)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="milestones" className="space-y-4">
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-600">Milestone view coming soon</p>
                                    <p className="text-sm text-slate-400 mt-2">Track key deliverables and project milestones</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Initiative Dialog */}
                    <InitiativeDialog
                        open={initiativeDialogOpen}
                        onClose={() => setInitiativeDialogOpen(false)}
                        onSubmit={handleAddInitiative}
                    />
            </div>
        </div>
    )
}


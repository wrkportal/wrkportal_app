'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, Column } from "@/components/common/data-table"
import { StatusBadge } from "@/components/common/status-badge"
import { Progress } from "@/components/ui/progress"
import { mockProjects, mockUsers } from "@/lib/mock-data"
import { formatDate, formatCurrency, getInitials } from "@/lib/utils"
import { Project } from "@/types"
import { Plus, Filter, Download, LayoutGrid, List } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ProjectsPage() {
    const router = useRouter()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')

    const filteredProjects = mockProjects.filter(project => {
        if (filterStatus === 'all') return true
        return project.status === filterStatus
    })

    const getManager = (managerId: string) => {
        return mockUsers.find(u => u.id === managerId)
    }

    const columns: Column<Project>[] = [
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
                    <div className="mt-1">
                        <StatusBadge status={project.ragStatus} />
                    </div>
                </div>
            ),
            sortable: true,
        },
        {
            key: 'manager',
            header: 'Manager',
            accessor: (project) => {
                const manager = getManager(project.managerId)
                if (!manager) return 'N/A'
                return (
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                                {getInitials(manager.firstName, manager.lastName)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{manager.firstName} {manager.lastName}</span>
                    </div>
                )
            },
            sortable: true,
        },
        {
            key: 'progress',
            header: 'Progress',
            accessor: (project) => (
                <div className="space-y-1 min-w-[150px]">
                    <div className="flex items-center justify-between text-sm">
                        <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                </div>
            ),
            sortable: true,
        },
        {
            key: 'budget',
            header: 'Budget',
            accessor: (project) => (
                <div className="text-sm">
                    <div>{formatCurrency(project.budget.spentToDate)}</div>
                    <div className="text-muted-foreground">
                        / {formatCurrency(project.budget.totalBudget)}
                    </div>
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Manage and track all your projects
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
                            <CardTitle className="text-base">All Projects</CardTitle>
                            <CardDescription className="text-xs">
                                {filteredProjects.length} projects found
                            </CardDescription>
                        </div>
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

                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>

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
                    </div>
                </CardHeader>
                <CardContent>
                    {view === 'list' ? (
                        <DataTable
                            data={filteredProjects}
                            columns={columns}
                            searchable
                            searchPlaceholder="Search projects..."
                            onRowClick={(project) => router.push(`/projects/${project.id}`)}
                            emptyMessage="No projects found"
                        />
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredProjects.map((project) => {
                                const manager = getManager(project.managerId)
                                return (
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
                                                <StatusBadge status={project.ragStatus} />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Progress</span>
                                                    <span className="font-medium">{project.progress}%</span>
                                                </div>
                                                <Progress value={project.progress} className="h-1.5" />
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Budget</span>
                                                <span className="font-medium">
                                                    {formatCurrency(project.budget.spentToDate)} / {formatCurrency(project.budget.totalBudget)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-muted-foreground">Due Date</span>
                                                <span className="font-medium">{formatDate(project.endDate)}</span>
                                            </div>

                                            {manager && (
                                                <div className="flex items-center gap-2 pt-2 border-t">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarFallback className="text-[10px]">
                                                            {getInitials(manager.firstName, manager.lastName)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs text-muted-foreground">
                                                        {manager.firstName} {manager.lastName}
                                                    </span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}


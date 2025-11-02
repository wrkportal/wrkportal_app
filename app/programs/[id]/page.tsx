'use client'

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { mockPrograms, mockProjects, mockUsers, mockTasks } from "@/lib/mock-data"
import { formatDate, formatCurrency, cn } from "@/lib/utils"
import {
    ArrowLeft,
    Plus,
    TrendingUp,
    Calendar,
    DollarSign,
    Users,
    CheckCircle,
    AlertTriangle,
    Clock,
    Briefcase,
    Target
} from "lucide-react"
import { ProjectStatus, RAGStatus } from "@/types"

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const program = mockPrograms.find(p => p.id === params.id)

    if (!program) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-bold mb-2">Program Not Found</h2>
                <p className="text-muted-foreground mb-4">The program you&apos;re looking for doesn&apos;t exist.</p>
                <Button onClick={() => router.push('/programs')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Programs
                </Button>
            </div>
        )
    }

    // Get all projects in this program
    const programProjects = mockProjects.filter(p => p.programId === program.id)
    const owner = mockUsers.find(u => u.id === program.ownerId)

    // Calculate aggregated metrics
    const totalBudget = programProjects.reduce((sum, p) => sum + (Number((p.budget as any)?.total) || 0), Number(program.budget) || 0)
    const totalSpent = programProjects.reduce((sum, p) => sum + (Number((p.budget as any)?.spent) || 0), 0)
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    const completedProjects = programProjects.filter(p => p.status === ProjectStatus.COMPLETED).length
    const atRiskProjects = programProjects.filter(p => p.status === ProjectStatus.AT_RISK).length
    const activeProjects = programProjects.filter(p =>
        p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.PLANNING
    ).length

    // Calculate overall progress (average of all project progress)
    const overallProgress = programProjects.length > 0
        ? programProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / programProjects.length
        : 0

    // Get all team members across projects
    const allTeamMembers = new Set<string>()
    programProjects.forEach(project => {
        project.teamMembers?.forEach(member => allTeamMembers.add(member.userId))
    })

    // Get all tasks across projects
    const programTasks = mockTasks.filter(task =>
        programProjects.some(project => project.id === task.projectId)
    )
    const completedTasks = programTasks.filter(t => t.status === 'DONE').length
    const totalTasks = programTasks.length

    const getStatusColor = (status: ProjectStatus) => {
        switch (status) {
            case ProjectStatus.COMPLETED:
                return 'text-green-600 bg-green-50 dark:bg-green-950'
            case ProjectStatus.AT_RISK:
                return 'text-red-600 bg-red-50 dark:bg-red-950'
            case ProjectStatus.ON_HOLD:
                return 'text-amber-600 bg-amber-50 dark:bg-amber-950'
            case ProjectStatus.IN_PROGRESS:
                return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
            default:
                return 'text-slate-600 bg-slate-50 dark:bg-slate-800'
        }
    }

    const getRAGColor = (status: RAGStatus) => {
        switch (status) {
            case RAGStatus.GREEN:
                return 'bg-green-500'
            case RAGStatus.AMBER:
                return 'bg-amber-500'
            case RAGStatus.RED:
                return 'bg-red-500'
            default:
                return 'bg-slate-500'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/programs')}
                        className="hover:bg-purple-50 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
                            <div className={cn("w-3 h-3 rounded-full", getRAGColor(program.status))} title={`Status: ${program.status}`} />
                        </div>
                        <p className="text-muted-foreground">{program.description}</p>
                    </div>
                </div>
                <Button onClick={() => router.push('/projects/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Project
                </Button>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                        <Briefcase className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{programProjects.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeProjects} active, {completedProjects} completed
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overallProgress.toFixed(0)}%</div>
                        <Progress value={overallProgress} className="mt-2" />
                    </CardContent>
                </Card>

                <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
                        <p className="text-xs text-muted-foreground">
                            of {formatCurrency(totalBudget)} ({budgetUtilization.toFixed(0)}%)
                        </p>
                    </CardContent>
                </Card>

                <Card className="hover-lift">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{allTeamMembers.size}</div>
                        <p className="text-xs text-muted-foreground">
                            {completedTasks}/{totalTasks} tasks done
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Program Information */}
            <Card className="hover-lift">
                <CardHeader>
                    <CardTitle>Program Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Program Owner</p>
                            <p className="font-medium">
                                {owner ? `${owner.firstName} ${owner.lastName}` : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                <p className="font-medium">{formatDate(program.startDate)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">End Date</p>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-purple-500" />
                                <p className="font-medium">{formatDate(program.endDate)}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Status</p>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", getRAGColor(program.status))} />
                                <p className="font-medium">{program.status}</p>
                            </div>
                        </div>
                    </div>

                    {atRiskProjects > 0 && (
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                                    {atRiskProjects} project{atRiskProjects > 1 ? 's' : ''} at risk - Attention needed
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Projects in this Program */}
            <Card className="hover-lift">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Projects in this Program</CardTitle>
                            <CardDescription>
                                All projects associated with {program.name}
                            </CardDescription>
                        </div>
                        <Button onClick={() => router.push('/projects/new')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {programProjects.length === 0 ? (
                        <div className="text-center py-12">
                            <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                            <p className="text-muted-foreground mb-4">
                                Start by adding projects to this program
                            </p>
                            <Button onClick={() => router.push('/projects/new')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add First Project
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {programProjects.map((project) => {
                                const projectManager = mockUsers.find(u => u.id === project.managerId)
                                const projectTasks = mockTasks.filter(t => t.projectId === project.id)
                                const projectCompletedTasks = projectTasks.filter(t => t.status === 'DONE').length

                                return (
                                    <div
                                        key={project.id}
                                        className="border rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer bg-white dark:bg-slate-800/50"
                                        onClick={() => router.push(`/projects/${project.id}`)}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold">{project.name}</h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        {project.code}
                                                    </Badge>
                                                    <Badge className={cn("text-xs", getStatusColor(project.status))}>
                                                        {project.status.replace('_', ' ')}
                                                    </Badge>
                                                    <div className={cn("w-2 h-2 rounded-full", getRAGColor(project.ragStatus))} />
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-2">
                                                    {project.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Project Manager</p>
                                                <p className="text-sm font-medium">
                                                    {projectManager ? `${projectManager.firstName} ${projectManager.lastName}` : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Progress</p>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={project.progress} className="flex-1" />
                                                    <span className="text-sm font-medium">{project.progress}%</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Budget</p>
                                                <p className="text-sm font-medium">
                                                    {formatCurrency(Number((project.budget as any)?.spent) || 0)} / {formatCurrency(Number((project.budget as any)?.total) || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">Tasks</p>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                    <p className="text-sm font-medium">
                                                        {projectCompletedTasks}/{projectTasks.length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {project.teamMembers?.length || 0} members
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    router.push(`/projects/${project.id}`)
                                                }}
                                            >
                                                View Details →
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Budget Breakdown */}
            <Card className="hover-lift">
                <CardHeader>
                    <CardTitle>Budget Breakdown</CardTitle>
                    <CardDescription>Financial overview across all projects</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 rounded-lg">
                            <div>
                                <p className="text-sm text-muted-foreground">Program Budget</p>
                                <p className="text-2xl font-bold">{formatCurrency(Number(program.budget) || 0)}</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-purple-500" />
                        </div>

                        {programProjects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">{project.code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(Number((project.budget as any)?.spent) || 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        of {formatCurrency(Number((project.budget as any)?.total) || 0)}
                                    </p>
                                </div>
                                <div className="ml-4 w-24">
                                    <Progress
                                        value={
                                            (Number((project.budget as any)?.total) || 0) > 0
                                                ? ((Number((project.budget as any)?.spent) || 0) / (Number((project.budget as any)?.total) || 0)) * 100
                                                : 0
                                        }
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg font-semibold">
                            <span>Total Spent</span>
                            <span className="text-lg">{formatCurrency(totalSpent)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}


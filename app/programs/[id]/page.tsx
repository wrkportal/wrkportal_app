'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
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
    Target,
    Loader2
} from "lucide-react"
import { ProjectStatus, RAGStatus } from "@/types"

export default function ProgramDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const [program, setProgram] = useState<any>(null)
    const [programProjects, setProgramProjects] = useState<any[]>([])
    const [programTasks, setProgramTasks] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchProgramData = async () => {
            try {
                setLoading(true)
                setError(null)
                
                // Fetch program details
                const programRes = await fetch(`/api/programs`)
                if (programRes.ok) {
                    const programData = await programRes.json()
                    const foundProgram = programData.programs.find((p: any) => p.id === params.id)
                    if (foundProgram) {
                        setProgram(foundProgram)
                        
                        // Fetch projects in this program
                        const projectsRes = await fetch('/api/projects')
                        if (projectsRes.ok) {
                            const projectsData = await projectsRes.json()
                            const filteredProjects = (projectsData.projects || []).filter((p: any) => p.programId === foundProgram.id)
                            setProgramProjects(filteredProjects)
                            
                            // Fetch tasks for all projects
                            const projectIds = filteredProjects.map((p: any) => p.id)
                            if (projectIds.length > 0) {
                                const tasksPromises = projectIds.map((projectId: string) => 
                                    fetch(`/api/tasks?projectId=${projectId}`).then(res => res.json())
                                )
                                const tasksResults = await Promise.all(tasksPromises)
                                const allTasks = tasksResults.flatMap((result: any) => result.tasks || [])
                                setProgramTasks(allTasks)
                            }
                        }
                        
                        // Fetch users for manager lookups
                        const usersRes = await fetch('/api/users/onboarded')
                        if (usersRes.ok) {
                            const usersData = await usersRes.json()
                            setUsers(usersData.users || [])
                        }
                    } else {
                        setError('Program not found')
                    }
                } else {
                    setError('Failed to load program')
                }
            } catch (err) {
                console.error('Error fetching program data:', err)
                setError('Failed to load program')
            } finally {
                setLoading(false)
            }
        }
        
        if (params.id) {
            fetchProgramData()
        }
    }, [params.id])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading program...</p>
                </div>
            </div>
        )
    }

    if (error || !program) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <h2 className="text-2xl font-bold mb-2">{error || 'Program Not Found'}</h2>
                <p className="text-muted-foreground mb-4">The program you&apos;re looking for doesn&apos;t exist.</p>
                <Button onClick={() => router.push('/programs')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Programs
                </Button>
            </div>
        )
    }

    const owner = program.owner

    // Calculate aggregated metrics
    const totalBudget = programProjects.reduce((sum: number, p: any) => sum + (Number(p.budget) || 0), Number(program.budget) || 0)
    const totalSpent = programProjects.reduce((sum: number, p: any) => {
        // Budget spent would come from budget tracking - for now use 0 or calculate from actuals
        return sum + 0 // TODO: Add budget tracking
    }, 0)
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    const completedProjects = programProjects.filter((p: any) => p.status === ProjectStatus.COMPLETED).length
    const atRiskProjects = programProjects.filter((p: any) => p.status === ProjectStatus.AT_RISK).length
    const activeProjects = programProjects.filter((p: any) =>
        p.status === ProjectStatus.IN_PROGRESS || p.status === ProjectStatus.PLANNING
    ).length

    // Calculate overall progress (average of all project progress)
    const overallProgress = programProjects.length > 0
        ? programProjects.reduce((sum: number, p: any) => sum + (p.progress || 0), 0) / programProjects.length
        : 0

    // Get all team members across projects
    const allTeamMembers = new Set<string>()
    programProjects.forEach((project: any) => {
        if (project.managerId) allTeamMembers.add(project.managerId)
        project.teamMembers?.forEach((member: any) => allTeamMembers.add(member.userId))
    })

    const completedTasks = programTasks.filter((t: any) => t.status === 'DONE').length
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
                            <StatusBadge status={program.status} />
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
                            {programProjects.map((project: any) => {
                                const projectManager = users.find((u: any) => u.id === project.managerId)
                                const projectTasks = programTasks.filter((t: any) => t.projectId === project.id)
                                const projectCompletedTasks = projectTasks.filter((t: any) => t.status === 'DONE').length

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
                                                    {formatCurrency(0)} / {formatCurrency(Number(project.budget) || 0)}
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

                        {programProjects.map((project: any) => (
                            <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{project.name}</p>
                                    <p className="text-xs text-muted-foreground">{project.code}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">
                                        {formatCurrency(0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        of {formatCurrency(Number(project.budget) || 0)}
                                    </p>
                                </div>
                                <div className="ml-4 w-24">
                                    <Progress value={0} />
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


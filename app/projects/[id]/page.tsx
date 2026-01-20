'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate, formatCurrency, formatPercentage } from "@/lib/utils"
import {
    ArrowLeft,
    DollarSign,
    Calendar,
    Users,
    CheckCircle,
    FileText,
    AlertTriangle,
    TrendingUp,
    Edit,
    Loader2,
    Trash2,
} from "lucide-react"

// Import tab components - Project Lifecycle Phases
import { InitiateTab } from "@/components/project-tabs/initiate-tab"
import { PlanningTab } from "@/components/project-tabs/planning-tab"
import { ExecutionTab } from "@/components/project-tabs/execution-tab"
import { MonitoringTab } from "@/components/project-tabs/monitoring-tab"
import { ClosureTab } from "@/components/project-tabs/closure-tab"

export default function ProjectDetailPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id as string
    const [activeTab, setActiveTab] = useState("initiate")
    const [project, setProject] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [orgUsers, setOrgUsers] = useState<any[]>([])

    // Fetch organization users (once for all tabs)
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/api/users/onboarded')
                if (response.ok) {
                    const data = await response.json()
                    setOrgUsers(data.users || [])
                }
            } catch (error) {
                console.error('Error fetching users:', error)
            }
        }
        fetchUsers()
    }, [])

    // Fetch project from API
    useEffect(() => {
        const fetchProject = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch(`/api/projects/${projectId}`)

                if (response.ok) {
                    const data = await response.json()
                    setProject(data.project)
                } else if (response.status === 404) {
                    setError('Project not found')
                } else {
                    setError('Failed to load project')
                }
            } catch (err) {
                console.error('Error fetching project:', err)
                setError('Failed to load project')
            } finally {
                setIsLoading(false)
            }
        }

        if (projectId) {
            fetchProject()
        }
    }, [projectId])

    const handleDelete = async () => {
        const confirmed = confirm('Are you sure you want to delete this project? You can restore it from the Deleted Items page.')
        if (!confirmed) return

        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('✅ Project deleted successfully!')
                router.push('/projects')
            } else {
                alert('❌ Failed to delete project')
            }
        } catch (error) {
            console.error('Error deleting project:', error)
            alert('❌ Failed to delete project')
        }
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading project...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error || !project) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">{error || 'Project Not Found'}</h2>
                    <p className="text-muted-foreground mb-4">
                        The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                    </p>
                    <Button onClick={() => router.push('/projects')}>
                        Back to Projects
                    </Button>
                </div>
            </div>
        )
    }

    // Get project's program
    const program = project.program

    return (
        <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="shrink-0"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">{project.name}</h1>
                            <StatusBadge status={project.ragStatus} />
                        </div>
                        <div className="flex items-center gap-2 md:gap-4 mt-2 text-xs md:text-sm text-muted-foreground flex-wrap">
                            <span className="truncate">{project.code}</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate">{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                            {program && (
                                <>
                                    <span className="hidden sm:inline">•</span>
                                    <span className="truncate">Program: {program.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <Button
                        variant="secondary"
                        onClick={() => router.push(`/projects/${projectId}/edit`)}
                        className="flex-1 md:flex-none text-xs md:text-sm !bg-foreground !text-background hover:!bg-foreground/90"
                    >
                        <Edit className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Edit Project</span>
                        <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 flex-1 md:flex-none text-xs md:text-sm"
                    >
                        <Trash2 className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden sm:inline">Delete Project</span>
                        <span className="sm:hidden">Delete</span>
                    </Button>
                </div>
            </div>

            {/* Project Overview Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Progress</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.progress || 0}%</div>
                        <Progress value={project.progress || 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(project.budget?.total || 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            {formatCurrency(project.budget?.spent || 0)} spent
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{project.teamMembers?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">
                            Active members
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-lg font-bold">
                            <StatusBadge status={project.status} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Current status
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs - Project Lifecycle Phases */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted border p-1">
                    <TabsTrigger value="initiate" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Initiate
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        Planning
                    </TabsTrigger>
                    <TabsTrigger value="execution" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Execution
                    </TabsTrigger>
                    <TabsTrigger value="monitoring" className="gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Monitoring
                    </TabsTrigger>
                    <TabsTrigger value="closure" className="gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Closure
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="initiate">
                    <InitiateTab project={project} />
                </TabsContent>

                <TabsContent value="planning">
                    <PlanningTab project={project} orgUsers={orgUsers} />
                </TabsContent>

                <TabsContent value="execution">
                    <ExecutionTab project={project} />
                </TabsContent>

                <TabsContent value="monitoring">
                    <MonitoringTab project={project} />
                </TabsContent>

                <TabsContent value="closure">
                    <ClosureTab project={project} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

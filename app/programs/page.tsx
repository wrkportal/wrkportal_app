'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Briefcase, FolderKanban, Plus, Calendar, Users, ChevronRight } from 'lucide-react'

export default function ProgramsPage() {
    const router = useRouter()
    const [programs, setPrograms] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [programsRes, projectsRes] = await Promise.all([
                    fetch('/api/programs'),
                    fetch('/api/projects')
                ])

                if (programsRes.ok) {
                    const data = await programsRes.json()
                    setPrograms(data.programs || [])
                }

                if (projectsRes.ok) {
                    const data = await projectsRes.json()
                    setProjects(data.projects || [])
                }
            } catch (error) {
                console.error('Error fetching data:', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    const getProjectsForProgram = (programId: string) => {
        return projects.filter(p => p.programId === programId)
    }

    const standaloneProjects = projects.filter(p => !p.programId)

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading programs and projects...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Programs & Projects</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage your programs and their associated projects
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.push('/projects/new')}>
                            <FolderKanban className="h-4 w-4 mr-2" />
                            New Project
                        </Button>
                        <Button onClick={() => router.push('/programs/new')}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Program
                        </Button>
                    </div>
                </div>
            </div>

            {/* Programs Section */}
            {programs.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Programs</h2>
                        <Badge variant="secondary">{programs.length}</Badge>
                    </div>

                    <div className="space-y-4">
                        {programs.map((program) => {
                            const programProjects = getProjectsForProgram(program.id)
                            return (
                                <Card key={program.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    <Briefcase className="h-5 w-5 text-primary" />
                                                    {program.name}
                                                </CardTitle>
                                                {program.description && (
                                                    <CardDescription className="mt-2">
                                                        {program.description}
                                                    </CardDescription>
                                                )}
                                                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                                                    {program.startDate && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>
                                                                {new Date(program.startDate).toLocaleDateString()}
                                                                {program.endDate && ` - ${new Date(program.endDate).toLocaleDateString()}`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <FolderKanban className="h-4 w-4" />
                                                        <span>{programProjects.length} Project{programProjects.length !== 1 ? 's' : ''}</span>
                                                    </div>
                                                    {program.status && (
                                                        <Badge variant={
                                                            program.status === 'ACTIVE' ? 'default' :
                                                            program.status === 'PLANNING' ? 'secondary' :
                                                            program.status === 'ON_HOLD' ? 'outline' : 'destructive'
                                                        }>
                                                            {program.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => router.push(`/programs/${program.id}`)}
                                            >
                                                View Details
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </div>
                                    </CardHeader>

                                    {/* Projects under this program */}
                                    {programProjects.length > 0 && (
                                        <CardContent className="border-t">
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium text-muted-foreground mb-3">
                                                    Projects in this Program
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {programProjects.map((project) => (
                                                        <div
                                                            key={project.id}
                                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                                            onClick={() => router.push(`/projects/${project.id}`)}
                                                        >
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <FolderKanban className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                    <p className="text-sm font-medium truncate">{project.name}</p>
                                                                </div>
                                                                {project.code && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {project.code}
                                                                    </p>
                                                                )}
                                                                {project.progress !== undefined && (
                                                                    <div className="mt-2">
                                                                        <Progress value={project.progress} className="h-1.5" />
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {project.progress}% Complete
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {project.status && (
                                                                <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                                                                    {project.status}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Standalone Projects Section */}
            {standaloneProjects.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pt-4 border-t">
                        <FolderKanban className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-semibold">Standalone Projects</h2>
                        <Badge variant="secondary">{standaloneProjects.length}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {standaloneProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/projects/${project.id}`)}
                            >
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg flex items-center gap-2 truncate">
                                                <FolderKanban className="h-4 w-4 text-primary flex-shrink-0" />
                                                <span className="truncate">{project.name}</span>
                                            </CardTitle>
                                            {project.code && (
                                                <CardDescription className="mt-1">
                                                    {project.code}
                                                </CardDescription>
                                            )}
                                        </div>
                                        {project.status && (
                                            <Badge variant="outline" className="ml-2 shrink-0">
                                                {project.status}
                                            </Badge>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {project.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                            {project.description}
                                        </p>
                                    )}
                                    {project.progress !== undefined && (
                                        <div>
                                            <Progress value={project.progress} className="h-2" />
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {project.progress}% Complete
                                            </p>
                                        </div>
                                    )}
                                    {project.startDate && (
                                        <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            <span>
                                                {new Date(project.startDate).toLocaleDateString()}
                                                {project.endDate && ` - ${new Date(project.endDate).toLocaleDateString()}`}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {programs.length === 0 && standaloneProjects.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Briefcase className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Programs or Projects</h3>
                        <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                            Get started by creating your first program or project
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => router.push('/projects/new')}>
                                <FolderKanban className="h-4 w-4 mr-2" />
                                Create Project
                            </Button>
                            <Button onClick={() => router.push('/programs/new')}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Program
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Trash2, RotateCcw, Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function DeletedItemsPage() {
    const [deletedTasks, setDeletedTasks] = useState<any[]>([])
    const [deletedProjects, setDeletedProjects] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchDeletedItems = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/deleted-items')
            if (response.ok) {
                const data = await response.json()
                setDeletedTasks(data.tasks || [])
                setDeletedProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Error fetching deleted items:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchDeletedItems()
    }, [])

    const handleRestore = async (type: 'task' | 'project', id: string) => {
        try {
            const response = await fetch('/api/deleted-items/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, id }),
            })

            if (response.ok) {
                alert(`✅ ${type === 'task' ? 'Task' : 'Project'} restored successfully!`)
                fetchDeletedItems()
            } else {
                alert('❌ Failed to restore item')
            }
        } catch (error) {
            console.error('Error restoring item:', error)
            alert('❌ Failed to restore item')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Deleted Items</h1>
                <p className="text-muted-foreground">
                    View and restore deleted tasks and projects
                </p>
            </div>

            <Tabs defaultValue="tasks" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="tasks">
                        Tasks ({deletedTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="projects">
                        Projects ({deletedProjects.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="space-y-4">
                    {deletedTasks.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64">
                                <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No deleted tasks</p>
                            </CardContent>
                        </Card>
                    ) : (
                        deletedTasks.map((task) => (
                            <Card key={task.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <CardTitle className="text-lg">{task.title}</CardTitle>
                                            <CardDescription className="space-y-1">
                                                {task.project && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span>Project: {task.project.name}</span>
                                                    </div>
                                                )}
                                                {task.assignee && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="h-3 w-3" />
                                                        <span>
                                                            {task.assignee.firstName} {task.assignee.lastName}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Deleted: {formatDate(task.deletedAt)}</span>
                                                </div>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{task.status}</Badge>
                                            <Badge variant="secondary">{task.priority}</Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore('task', task.id)}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Restore
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {task.description && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="projects" className="space-y-4">
                    {deletedProjects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center h-64">
                                <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No deleted projects</p>
                            </CardContent>
                        </Card>
                    ) : (
                        deletedProjects.map((project) => (
                            <Card key={project.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1">
                                            <CardTitle className="text-lg">
                                                {project.name} ({project.code})
                                            </CardTitle>
                                            <CardDescription className="space-y-1">
                                                {project.manager && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <User className="h-3 w-3" />
                                                        <span>
                                                            Manager: {project.manager.firstName} {project.manager.lastName}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Deleted: {formatDate(project.deletedAt)}</span>
                                                </div>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{project.status}</Badge>
                                            <Badge
                                                variant={
                                                    project.ragStatus === 'GREEN'
                                                        ? 'default'
                                                        : project.ragStatus === 'AMBER'
                                                            ? 'secondary'
                                                            : 'destructive'
                                                }
                                            >
                                                {project.ragStatus}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRestore('project', project.id)}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Restore
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                {project.description && (
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{project.description}</p>
                                    </CardContent>
                                )}
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}


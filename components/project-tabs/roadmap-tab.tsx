'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/status-badge"
import { formatDate, cn } from "@/lib/utils"
import { Plus, Calendar, List, Grid3x3, BarChart3 } from "lucide-react"
import { TaskDialog } from "@/components/dialogs/task-dialog"
import { GanttChart } from "@/components/roadmap/gantt-chart"

interface RoadmapTabProps {
    project: any
}

export function RoadmapTab({ project }: RoadmapTabProps) {
    const [taskDialogOpen, setTaskDialogOpen] = useState(false)
    const [view, setView] = useState<'list' | 'grid' | 'gantt'>('list')

    if (!project) return <div>Project not found</div>

    // Get tasks from project data
    const projectTasks = project.tasks || []

    // Group tasks by status
    const tasksByStatus = {
        todo: projectTasks.filter((t: any) => t.status === 'TODO'),
        inProgress: projectTasks.filter((t: any) => t.status === 'IN_PROGRESS'),
        completed: projectTasks.filter((t: any) => t.status === 'DONE'),
    }

    return (
        <div className="space-y-6">
            {/* Project Timeline Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Project Timeline</CardTitle>
                            <CardDescription>
                                {formatDate(project.startDate)} - {formatDate(project.endDate)}
                            </CardDescription>
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
                            <Button
                                variant={view === 'gantt' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setView('gantt')}
                            >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Gantt
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Start Date</p>
                            <p className="text-lg font-medium">{formatDate(project.startDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">End Date</p>
                            <p className="text-lg font-medium">{formatDate(project.endDate)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Duration</p>
                            <p className="text-lg font-medium">
                                {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Tasks</p>
                            <p className="text-lg font-medium">{projectTasks.length} total</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Switcher */}
            {view === 'gantt' ? (
                // Gantt Chart View
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Gantt Chart</CardTitle>
                                <CardDescription>Timeline visualization of tasks</CardDescription>
                            </div>
                            <Button onClick={() => setTaskDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Task
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <GanttChart tasks={projectTasks} />
                    </CardContent>
                </Card>
            ) : view === 'grid' ? (
                // Grid View
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Tasks - Grid View</h3>
                        <Button onClick={() => setTaskDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                        </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {projectTasks.map((task) => (
                            <Card key={task.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <StatusBadge status={task.status} />
                                        <StatusBadge status={task.priority} />
                                    </div>
                                    <CardTitle className="text-base mt-2">{task.title}</CardTitle>
                                    {task.description && (
                                        <CardDescription className="line-clamp-2">{task.description}</CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-xs text-muted-foreground">
                                        {task.dueDate && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Due: {formatDate(task.dueDate)}
                                            </div>
                                        )}
                                        {task.estimatedHours && (
                                            <div>{task.estimatedHours}h estimated</div>
                                        )}
                                        {task.actualHours && (
                                            <div>{task.actualHours}h actual</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {projectTasks.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No tasks yet. Click &quot;Add Task&quot; to get started.
                        </div>
                    )}
                </div>
            ) : (
                // List View (Default)
                <Tabs defaultValue="all">
                    <div className="flex items-center justify-between mb-4">
                        <TabsList>
                            <TabsTrigger value="all">All Tasks ({projectTasks.length})</TabsTrigger>
                            <TabsTrigger value="todo">To Do ({tasksByStatus.todo.length})</TabsTrigger>
                            <TabsTrigger value="inProgress">In Progress ({tasksByStatus.inProgress.length})</TabsTrigger>
                            <TabsTrigger value="completed">Completed ({tasksByStatus.completed.length})</TabsTrigger>
                        </TabsList>
                        <Button onClick={() => setTaskDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                        </Button>
                    </div>

                    <TabsContent value="all" className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {projectTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">{task.title}</h4>
                                                    <StatusBadge status={task.status} />
                                                    <StatusBadge status={task.priority} />
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    {task.dueDate && (
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Due: {formatDate(task.dueDate)}
                                                        </span>
                                                    )}
                                                    {task.estimatedHours && (
                                                        <span>{task.estimatedHours}h estimated</span>
                                                    )}
                                                    {task.actualHours && (
                                                        <span>{task.actualHours}h actual</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {projectTasks.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            No tasks yet. Click &quot;Add Task&quot; to get started.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="todo" className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {tasksByStatus.todo.map((task) => (
                                        <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">{task.title}</h4>
                                                    <StatusBadge status={task.priority} />
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {tasksByStatus.todo.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">No tasks to do</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="inProgress" className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {tasksByStatus.inProgress.map((task) => (
                                        <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium">{task.title}</h4>
                                                    <StatusBadge status={task.priority} />
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {tasksByStatus.inProgress.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">No tasks in progress</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="completed" className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {tasksByStatus.completed.map((task) => (
                                        <div key={task.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer opacity-75">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium line-through">{task.title}</h4>
                                                    <StatusBadge status={task.priority} />
                                                </div>
                                                {task.description && (
                                                    <p className="text-sm text-muted-foreground">{task.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {tasksByStatus.completed.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">No completed tasks</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Task Dialog */}
            <TaskDialog
                open={taskDialogOpen}
                onClose={() => setTaskDialogOpen(false)}
                onSubmit={(data) => {
                    console.log('Task created:', data)
                    alert('✅ Task created successfully!')
                    setTaskDialogOpen(false)
                }}
                projectId={project.id}
            />
        </div>
    )
}


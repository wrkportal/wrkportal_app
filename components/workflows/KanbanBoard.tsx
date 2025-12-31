'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkflowType } from '@/lib/workflows/terminology'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { TaskCreationFormWithTemplates } from './TaskCreationFormWithTemplates'
import { Plus, MoreVertical } from 'lucide-react'

interface KanbanBoardProps {
  workflowType: WorkflowType
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assignee?: string
}

export function KanbanBoard({ workflowType }: KanbanBoardProps) {
  const { getTerm } = useWorkflowTerminology()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)
  const [wipLimits, setWipLimits] = useState<Record<string, number>>({
    'todo': 5,
    'in-progress': 3,
    'review': 2,
    'done': 10,
  })

  const columns = [
    { id: 'todo', name: 'To Do', wipLimit: wipLimits.todo },
    { id: 'in-progress', name: 'In Progress', wipLimit: wipLimits['in-progress'] },
    { id: 'review', name: 'Review', wipLimit: wipLimits.review },
    { id: 'done', name: 'Done', wipLimit: wipLimits.done },
  ]

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?workflowType=${workflowType}`)
        if (response.ok) {
          const data = await response.json()
          // Map tasks to match kanban board status format
          const fetchedTasks = (data.tasks || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            status: task.status?.toLowerCase().replace('_', '-') || 'todo',
            priority: task.priority || 'MEDIUM',
            assignee: task.assignee ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() : undefined,
          }))
          setTasks(fetchedTasks)
        } else {
          setTasks([])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
        setTasks([])
      }
    }
    fetchTasks()
  }, [workflowType])

  const getTasksForColumn = (columnId: string) => {
    return tasks.filter((task) => task.status === columnId)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isWipLimitReached = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId)
    if (!column) return false
    const taskCount = getTasksForColumn(columnId).length
    return taskCount >= column.wipLimit
  }

  return (
    <div className="space-y-4">
      {/* Kanban Board */}
      <div className="grid grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.id)
          const wipReached = isWipLimitReached(column.id)

          return (
            <div key={column.id} className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-t-lg bg-muted">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">{column.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}/{column.wipLimit}
                  </Badge>
                </div>
                {wipReached && (
                  <Badge variant="destructive" className="text-xs">
                    WIP Limit
                  </Badge>
                )}
              </div>
              <div
                className={`space-y-2 min-h-[400px] p-2 rounded-b-lg border-2 ${
                  wipReached ? 'border-destructive border-dashed' : 'border-dashed border-muted'
                }`}
              >
                {columnTasks.map((task) => (
                  <Card key={task.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <p className="text-sm font-medium">{task.title}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="text-xs text-muted-foreground">
                            {task.assignee}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {!wipReached && (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setIsTaskDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {getTerm('task')}
                  </Button>
                )}
                {columnTasks.length === 0 && !wipReached && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No {getTerm('tasks')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Task Creation Dialog */}
      <TaskCreationFormWithTemplates
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        workflowType={workflowType}
      />
    </div>
  )
}


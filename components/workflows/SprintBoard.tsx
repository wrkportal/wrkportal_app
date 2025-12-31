'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkflowType } from '@/lib/workflows/terminology'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { TaskCreationFormWithTemplates } from './TaskCreationFormWithTemplates'
import { Plus, MoreVertical } from 'lucide-react'

interface SprintBoardProps {
  workflowType: WorkflowType
}

interface Task {
  id: string
  title: string
  status: string
  priority: string
  assignee?: string
  storyPoints?: number
}

export function SprintBoard({ workflowType }: SprintBoardProps) {
  const { getTerm } = useWorkflowTerminology()
  const [tasks, setTasks] = useState<Task[]>([])
  const [sprintName, setSprintName] = useState('Sprint 1')
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false)

  const columns = [
    { id: 'backlog', name: 'Backlog', color: 'bg-gray-100' },
    { id: 'todo', name: 'To Do', color: 'bg-blue-100' },
    { id: 'in-progress', name: 'In Progress', color: 'bg-yellow-100' },
    { id: 'in-review', name: 'In Review', color: 'bg-purple-100' },
    { id: 'done', name: 'Done', color: 'bg-green-100' },
  ]

  // Fetch tasks for the current sprint
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?workflowType=${workflowType}`)
        if (response.ok) {
          const data = await response.json()
          // Filter tasks by status to match sprint board columns
          const fetchedTasks = (data.tasks || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            status: task.status?.toLowerCase().replace('_', '-') || 'todo',
            priority: task.priority || 'MEDIUM',
            assignee: task.assignee ? `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim() : undefined,
            storyPoints: task.estimatedHours ? Math.ceil(task.estimatedHours / 8) : undefined,
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
  }, [sprintName, workflowType])

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

  return (
    <div className="space-y-4">
      {/* Sprint Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{sprintName}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Active Sprint • {tasks.length} {getTerm('tasks')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">In Progress</Badge>
              <Button variant="outline" size="sm" onClick={() => setIsTaskDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add {getTerm('task')}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sprint Board */}
      <div className="grid grid-cols-5 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksForColumn(column.id)

          return (
            <div key={column.id} className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-t-lg bg-muted">
                <h3 className="font-semibold text-sm">{column.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {columnTasks.length}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[400px] p-2 rounded-b-lg border-2 border-dashed border-muted">
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
                          {task.storyPoints && (
                            <Badge variant="outline" className="text-xs">
                              {task.storyPoints} SP
                            </Badge>
                          )}
                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </Badge>
                        </div>
                        {task.assignee && (
                          <div className="text-xs text-muted-foreground">
                            Assigned to: {task.assignee}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {columnTasks.length === 0 && (
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


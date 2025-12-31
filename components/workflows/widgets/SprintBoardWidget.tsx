'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SprintBoard } from '../SprintBoard'
import { WorkflowType } from '@/lib/workflows/terminology'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { Calendar } from 'lucide-react'

interface SprintBoardWidgetProps {
  workflowType?: WorkflowType
}

export function SprintBoardWidget({ workflowType }: SprintBoardWidgetProps) {
  const { getTerm } = useWorkflowTerminology()
  const [sprintData, setSprintData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch(`/api/sprints/active?workflowType=${workflowType}`)
        // if (response.ok) {
        //   const data = await response.json()
        //   setSprintData(data.sprint)
        // }
        setSprintData(null) // No active sprint
      } catch (error) {
        console.error('Error fetching sprint data:', error)
        setSprintData(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSprintData()
  }, [workflowType])

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">Loading sprint data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!sprintData) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sprint Board
          </CardTitle>
          <CardDescription>No active sprint</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No active sprint found.</p>
            <p className="text-sm mt-2">Create a sprint to start tracking your {getTerm('tasks')}.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const progress = sprintData.totalStoryPoints > 0 
    ? (sprintData.completedStoryPoints / sprintData.totalStoryPoints) * 100 
    : 0
  const daysRemaining = Math.ceil(
    (new Date(sprintData.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {sprintData.name}
            </CardTitle>
            <CardDescription>
              {daysRemaining} days remaining • {sprintData.totalStoryPoints} story points
            </CardDescription>
          </div>
          <Badge variant="outline">Active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Sprint Progress</span>
            <span className="font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{sprintData.tasks.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{sprintData.tasks.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{sprintData.tasks.todo}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <SprintBoard 
            workflowType={workflowType || WorkflowType.SOFTWARE_DEVELOPMENT}
          />
        </div>
      </CardContent>
    </Card>
  )
}


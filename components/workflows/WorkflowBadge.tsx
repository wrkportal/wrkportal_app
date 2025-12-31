'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { WorkflowType } from '@/lib/workflows/terminology'
import { getWorkflowConfig } from '@/lib/workflows'

interface WorkflowBadgeProps {
  status: string
  workflowType?: WorkflowType | null
  className?: string
  type?: 'project' | 'task' | 'issue'
}

export function WorkflowBadge({
  status,
  workflowType,
  className,
  type = 'project',
}: WorkflowBadgeProps) {
  const { workflowType: contextWorkflowType } = useWorkflowTerminology()
  const effectiveWorkflowType = workflowType || contextWorkflowType

  // Get workflow-specific status labels if available
  const getStatusLabel = (): string => {
    if (!effectiveWorkflowType) {
      return status.replace('_', ' ')
    }

    const config = getWorkflowConfig(effectiveWorkflowType)
    const statuses = config.defaultStatuses[type] || []

    // Try to find a matching status in workflow-specific statuses
    const normalizedStatus = status.replace('_', ' ').toLowerCase()
    const matchingStatus = statuses.find(
      (s) => s.toLowerCase() === normalizedStatus
    )

    return matchingStatus || status.replace('_', ' ')
  }

  const getVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' => {
    const statusUpper = status.toUpperCase()

    // RAG Status
    if (statusUpper === 'GREEN') return 'success'
    if (statusUpper === 'AMBER') return 'warning'
    if (statusUpper === 'RED') return 'destructive'

    // Priority
    if (statusUpper === 'CRITICAL' || statusUpper === 'HIGH') return 'destructive'
    if (statusUpper === 'MEDIUM') return 'warning'
    if (statusUpper === 'LOW') return 'secondary'

    // Project Status
    if (statusUpper === 'COMPLETED' || statusUpper === 'DONE') return 'success'
    if (statusUpper === 'IN_PROGRESS' || statusUpper.includes('PROGRESS')) return 'default'
    if (statusUpper === 'ON_HOLD' || statusUpper === 'BLOCKED') return 'warning'
    if (statusUpper === 'CANCELLED') return 'outline'
    if (statusUpper === 'AT_RISK') return 'destructive'

    // Task Status
    if (statusUpper === 'BACKLOG' || statusUpper === 'TODO') return 'secondary'
    if (statusUpper === 'IN_REVIEW') return 'warning'
    if (statusUpper === 'BLOCKED') return 'destructive'

    return 'default'
  }

  return (
    <Badge variant={getVariant()} className={cn(className)}>
      {getStatusLabel()}
    </Badge>
  )
}


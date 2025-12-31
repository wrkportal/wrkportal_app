'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WorkflowType, getWorkflowConfig, workflowConfigs } from '@/lib/workflows'
import {
  Code,
  Package,
  Megaphone,
  Users,
  Scale,
  Headphones,
  Settings,
  Server,
  DollarSign,
  TrendingUp,
  Folder,
} from 'lucide-react'

const workflowIcons: Record<WorkflowType, any> = {
  [WorkflowType.SOFTWARE_DEVELOPMENT]: Code,
  [WorkflowType.PRODUCT_MANAGEMENT]: Package,
  [WorkflowType.MARKETING]: Megaphone,
  [WorkflowType.HUMAN_RESOURCES]: Users,
  [WorkflowType.LEGAL]: Scale,
  [WorkflowType.CUSTOMER_SERVICE]: Headphones,
  [WorkflowType.OPERATIONS]: Settings,
  [WorkflowType.IT_SUPPORT]: Server,
  [WorkflowType.FINANCE]: DollarSign,
  [WorkflowType.SALES]: TrendingUp,
  [WorkflowType.GENERAL]: Folder,
}

interface WorkflowSelectorProps {
  value?: WorkflowType | null
  onChange: (workflowType: WorkflowType | null) => void
  showPreview?: boolean
  label?: string
}

export function WorkflowSelector({
  value,
  onChange,
  showPreview = false,
  label = 'Primary Workflow',
}: WorkflowSelectorProps) {
  const selectedWorkflow = value || WorkflowType.GENERAL
  const workflowConfig = getWorkflowConfig(selectedWorkflow)
  const Icon = workflowIcons[selectedWorkflow] || Folder

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="workflow-select">{label}</Label>
        <Select
          value={selectedWorkflow}
          onValueChange={(val) => onChange(val as WorkflowType)}
        >
          <SelectTrigger id="workflow-select">
            <SelectValue placeholder="Select workflow" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(WorkflowType).map((workflowType) => {
              const config = workflowConfigs[workflowType]
              const WorkflowIcon = workflowIcons[workflowType] || Folder

              return (
                <SelectItem key={workflowType} value={workflowType}>
                  <div className="flex items-center gap-2">
                    <WorkflowIcon className="h-4 w-4" />
                    <span>{config.name}</span>
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {showPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{workflowConfig.name}</CardTitle>
            </div>
            <CardDescription>{workflowConfig.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Terminology Preview:</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Project → {workflowConfig.name === 'Software Development' ? 'Product' : workflowConfig.name === 'Marketing' ? 'Campaign' : 'Project'}</Badge>
                  <Badge variant="outline">Task → {workflowConfig.name === 'Software Development' ? 'User Story' : workflowConfig.name === 'Marketing' ? 'Marketing Activity' : 'Task'}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Key Features:</p>
                <div className="flex flex-wrap gap-2">
                  {workflowConfig.features.slice(0, 4).map((feature: string) => (
                    <Badge key={feature} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


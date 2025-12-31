'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getTaskTemplates, type TaskTemplate } from '@/lib/workflows/task-templates'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'
import { Check } from 'lucide-react'

interface TaskTemplateSelectorProps {
  workflowType: WorkflowType | null
  methodologyType?: MethodologyType | null
  onSelectTemplate: (template: TaskTemplate) => void
  selectedTemplateId?: string
}

export function TaskTemplateSelector({
  workflowType,
  methodologyType,
  onSelectTemplate,
  selectedTemplateId,
}: TaskTemplateSelectorProps) {
  const templates = workflowType ? getTaskTemplates(workflowType, methodologyType) : []

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">No templates available for this workflow.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Select a template:</p>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplateId === template.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {selectedTemplateId === template.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    {template.description && (
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {template.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.fields.length} fields
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TaskTemplateSelector } from './TaskTemplateSelector'
import { DynamicFormField } from './DynamicFormField'
import { getTaskTemplates, type TaskTemplate, type TaskField } from '@/lib/workflows/task-templates'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { useAuthStore } from '@/stores/authStore'
import { ArrowLeft, FileText } from 'lucide-react'

interface TaskCreationFormWithTemplatesProps {
  open: boolean
  onClose: () => void
  onSubmit?: (taskData: any) => void | Promise<void> // Make optional, can call API directly
  projectId?: string
  workflowType?: WorkflowType | null
  methodologyType?: MethodologyType | null
}

export function TaskCreationFormWithTemplates({
  open,
  onClose,
  onSubmit,
  projectId,
  workflowType: propWorkflowType,
  methodologyType: propMethodologyType,
}: TaskCreationFormWithTemplatesProps) {
  const user = useAuthStore((state) => state.user)
  const { getTerm, workflowType: contextWorkflowType } = useWorkflowTerminology()
  
  // Use prop workflow type or context workflow type
  const workflowType = propWorkflowType || contextWorkflowType || WorkflowType.GENERAL
  const methodologyType = propMethodologyType || null

  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'template' | 'form'>('template')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const templates = getTaskTemplates(workflowType, methodologyType)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTemplate(null)
      setFormData({})
      setErrors({})
      setSubmitSuccess(false)
      setActiveTab('template')
      setIsSubmitting(false)
    }
  }, [open])

  useEffect(() => {
    if (selectedTemplate) {
      // Initialize form data with default values
      const initialData: Record<string, any> = {}
      selectedTemplate.fields.forEach((field) => {
        if (field.type === 'list') {
          initialData[field.key] = []
        } else if (field.type === 'checklist') {
          initialData[field.key] = []
        } else {
          initialData[field.key] = ''
        }
      })
      setFormData(initialData)
      setErrors({})
      setActiveTab('form')
    }
  }, [selectedTemplate])

  const handleTemplateSelect = (template: TaskTemplate) => {
    setSelectedTemplate(template)
  }

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
    // Clear error for this field
    if (errors[fieldKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    if (!selectedTemplate) return false

    const newErrors: Record<string, string> = {}
    
    // Check for title (can be in different fields)
    const title = formData.title || formData.storyTitle || formData['activity-name']
    if (!title || title.trim() === '') {
      newErrors.title = 'Title is required'
    }
    
    selectedTemplate.fields.forEach((field) => {
      if (field.required) {
        const value = formData[field.key]
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field.key] = `${field.label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplate || !validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare task data
      const taskData = {
        title: formData.title || formData.storyTitle || formData['activity-name'] || 'Untitled Task',
        description: buildDescription(formData, selectedTemplate),
        projectId: projectId === 'NOT_A_PROJECT' ? null : (projectId || null),
        assigneeId: formData.assigneeId || undefined,
        status: formData.status || selectedTemplate.defaultStatus || 'TODO',
        priority: formData.priority || selectedTemplate.defaultPriority || 'MEDIUM',
        dueDate: formData.dueDate || undefined,
        estimatedHours: formData.estimatedHours ? parseFloat(formData.estimatedHours) : undefined,
        frequency: formData.frequency || undefined,
        referencePoint: formData.referencePoint || undefined,
        sourceType: 'WORKFLOW_TEMPLATE',
        sourceId: selectedTemplate.id,
      }

      // If onSubmit prop is provided, use it (for custom handling)
      // Otherwise, call the API directly
      if (onSubmit) {
        await onSubmit(taskData)
      } else {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        })

        if (!response.ok) {
          const error = await response.json()
          setErrors({ general: error.error || 'Failed to create task' })
          return
        }

        const result = await response.json()
        setSubmitSuccess(true)
        
        // Close dialog after success
        setTimeout(() => {
          onClose()
          // Reset form
          setSelectedTemplate(null)
          setFormData({})
          setErrors({})
          setSubmitSuccess(false)
          setActiveTab('template')
          // Refresh the page or trigger a callback if needed
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
        }, 1500)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      setErrors({ general: 'Failed to create task. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const buildDescription = (data: Record<string, any>, template: TaskTemplate): string => {
    // Build a formatted description from template fields
    let description = ''

    template.fields.forEach((field) => {
      if (field.key === 'title' || field.key === 'storyTitle' || field.key === 'activity-name') {
        return // Skip title fields
      }

      const value = data[field.key]
      if (value) {
        if (Array.isArray(value)) {
          if (field.type === 'list') {
            description += `**${field.label}:**\n${value.map((item: string) => `- ${item}`).join('\n')}\n\n`
          } else if (field.type === 'checklist') {
            description += `**${field.label}:**\n${value.map((item: { text: string; checked: boolean }) => `- [${item.checked ? 'x' : ' '}] ${item.text}`).join('\n')}\n\n`
          }
        } else {
          description += `**${field.label}:** ${value}\n\n`
        }
      }
    })

    return description.trim()
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setFormData({})
    setErrors({})
    setActiveTab('template')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create {getTerm('task')}</DialogTitle>
          <DialogDescription>
            {selectedTemplate
              ? `Using template: ${selectedTemplate.name}`
              : 'Select a template to create a task'}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'template' | 'form')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="template" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Select Template
            </TabsTrigger>
            <TabsTrigger value="form" disabled={!selectedTemplate} className="flex items-center gap-2">
              Fill Details
              {selectedTemplate && <ArrowLeft className="h-4 w-4" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="template" className="space-y-4">
            <TaskTemplateSelector
              workflowType={workflowType}
              methodologyType={methodologyType}
              onSelectTemplate={handleTemplateSelect}
              selectedTemplateId={selectedTemplate?.id}
            />
            {selectedTemplate && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('form')}>Continue to Form</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            {selectedTemplate ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.title && (
                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded-md">
                    {errors.title}
                  </div>
                )}
                <div className="space-y-4">
                  {selectedTemplate.fields.map((field) => (
                    <DynamicFormField
                      key={field.key}
                      field={field}
                      value={formData[field.key]}
                      onChange={(value) => handleFieldChange(field.key, value)}
                      error={errors[field.key]}
                    />
                  ))}
                </div>

                {submitSuccess && (
                  <div className="text-green-600 text-sm p-3 bg-green-50 rounded-md">
                    {getTerm('task')} created successfully!
                  </div>
                )}
                {errors.general && (
                  <div className="text-red-600 text-sm p-3 bg-red-50 rounded-md">
                    {errors.general}
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('template')} disabled={isSubmitting}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : `Create ${getTerm('task')}`}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Please select a template first
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}


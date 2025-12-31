'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DynamicFormField } from './DynamicFormField'
import { WorkflowType } from '@/lib/workflows/terminology'
import { MethodologyType } from '@/lib/workflows/methodologies'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { FileText, ArrowLeft } from 'lucide-react'

// Requirement templates - this would ideally come from the database
const requirementTemplates = {
  [WorkflowType.SOFTWARE_DEVELOPMENT]: [
    {
      id: 'user-story-template',
      workflowType: WorkflowType.SOFTWARE_DEVELOPMENT,
      methodologyType: MethodologyType.SCRUM,
      name: 'User Story',
      description: 'Create a user story following Scrum format',
      sections: [
        {
          section: 'User Story',
          fields: [
            {
              key: 'asA',
              label: 'As a',
              type: 'text',
              required: true,
              placeholder: 'As a [user type]',
            },
            {
              key: 'iWant',
              label: 'I want',
              type: 'textarea',
              required: true,
              placeholder: 'I want to [action]',
            },
            {
              key: 'soThat',
              label: 'So that',
              type: 'textarea',
              required: true,
              placeholder: 'So that [benefit]',
            },
          ],
        },
        {
          section: 'Acceptance Criteria',
          fields: [
            {
              key: 'given',
              label: 'Given',
              type: 'text',
              required: false,
              placeholder: 'Given [context]',
            },
            {
              key: 'when',
              label: 'When',
              type: 'text',
              required: false,
              placeholder: 'When [action]',
            },
            {
              key: 'then',
              label: 'Then',
              type: 'text',
              required: false,
              placeholder: 'Then [outcome]',
            },
          ],
        },
        {
          section: 'Technical Details',
          fields: [
            {
              key: 'storyPoints',
              label: 'Story Points',
              type: 'number',
              required: false,
            },
            {
              key: 'epic',
              label: 'Epic',
              type: 'text',
              required: false,
            },
            {
              key: 'sprint',
              label: 'Sprint',
              type: 'text',
              required: false,
            },
          ],
        },
      ],
    },
  ],
}

interface RequirementCreationFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (requirementData: any) => void
  workflowType?: WorkflowType | null
  methodologyType?: MethodologyType | null
}

export function RequirementCreationForm({
  open,
  onClose,
  onSubmit,
  workflowType: propWorkflowType,
  methodologyType: propMethodologyType,
}: RequirementCreationFormProps) {
  const { getTerm, workflowType: contextWorkflowType } = useWorkflowTerminology()
  
  const workflowType = propWorkflowType || contextWorkflowType || WorkflowType.GENERAL
  const methodologyType = propMethodologyType || null

  const templates = requirementTemplates[workflowType] || []
  const [selectedTemplate, setSelectedTemplate] = useState<any>(templates[0] || null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'template' | 'form'>('template')

  useEffect(() => {
    if (selectedTemplate) {
      const initialData: Record<string, any> = {}
      selectedTemplate.sections.forEach((section: any) => {
        section.fields.forEach((field: any) => {
          if (field.type === 'list') {
            initialData[field.key] = []
          } else if (field.type === 'checklist') {
            initialData[field.key] = []
          } else {
            initialData[field.key] = ''
          }
        })
      })
      setFormData(initialData)
      setErrors({})
      setActiveTab('form')
    }
  }, [selectedTemplate])

  const handleFieldChange = (fieldKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }))
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
    selectedTemplate.sections.forEach((section: any) => {
      section.fields.forEach((field: any) => {
        if (field.required) {
          const value = formData[field.key]
          if (!value || (Array.isArray(value) && value.length === 0)) {
            newErrors[field.key] = `${field.label} is required`
          }
        }
      })
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTemplate || !validateForm()) {
      return
    }

    const requirementData = {
      title: buildTitle(formData, selectedTemplate),
      description: buildDescription(formData, selectedTemplate),
      templateId: selectedTemplate.id,
      templateData: formData,
    }

    onSubmit(requirementData)
    handleClose()
  }

  const buildTitle = (data: Record<string, any>, template: any): string => {
    // Build title from key fields
    if (data.asA && data.iWant) {
      return `As a ${data.asA}, I want ${data.iWant.split('\n')[0]}`
    }
    return 'New Requirement'
  }

  const buildDescription = (data: Record<string, any>, template: any): string => {
    let description = ''

    template.sections.forEach((section: any) => {
      description += `## ${section.section}\n\n`
      section.fields.forEach((field: any) => {
        const value = data[field.key]
        if (value) {
          if (Array.isArray(value)) {
            if (field.type === 'list') {
              description += `**${field.label}:**\n${value.map((item: string) => `- ${item}`).join('\n')}\n\n`
            }
          } else {
            description += `**${field.label}:** ${value}\n\n`
          }
        }
      })
    })

    return description.trim()
  }

  const handleClose = () => {
    setSelectedTemplate(templates[0] || null)
    setFormData({})
    setErrors({})
    setActiveTab('template')
    onClose()
  }

  if (templates.length === 0) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Requirement</DialogTitle>
            <DialogDescription>
              No requirement templates available for this workflow.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Requirement</DialogTitle>
          <DialogDescription>
            {selectedTemplate
              ? `Using template: ${selectedTemplate.name}`
              : 'Select a template to create a requirement'}
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
            <div className="space-y-2">
              <p className="text-sm font-medium">Select a template:</p>
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      {template.description && (
                        <CardDescription>{template.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Badge variant="secondary" className="text-xs">
                        {template.sections.length} sections
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            {selectedTemplate && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('form')}>Continue to Form</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="form" className="space-y-4">
            {selectedTemplate ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {selectedTemplate.sections.map((section: any, sectionIndex: number) => (
                  <Card key={sectionIndex}>
                    <CardHeader>
                      <CardTitle className="text-lg">{section.section}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {section.fields.map((field: any) => (
                        <DynamicFormField
                          key={field.key}
                          field={field}
                          value={formData[field.key]}
                          onChange={(value) => handleFieldChange(field.key, value)}
                          error={errors[field.key]}
                        />
                      ))}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('template')}>
                    Back
                  </Button>
                  <Button type="submit">Create Requirement</Button>
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


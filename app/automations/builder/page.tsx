'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Zap, Mail, Bell, Plus, ArrowDown, Settings, Play, Save, X,
  ListTodo, Clock, UserPlus, FileText, AlertTriangle, ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStep {
  id: string
  type: 'trigger' | 'condition' | 'action'
  category: string
  label: string
  icon: React.ReactNode
  config: Record<string, string>
}

const triggerOptions = [
  { category: 'task_created', label: 'Task Created', icon: <Plus className="h-4 w-4" /> },
  { category: 'status_changed', label: 'Status Changed', icon: <Zap className="h-4 w-4" /> },
  { category: 'due_date_passed', label: 'Due Date Passed', icon: <Clock className="h-4 w-4" /> },
  { category: 'field_updated', label: 'Field Updated', icon: <Settings className="h-4 w-4" /> },
  { category: 'assigned', label: 'Task Assigned', icon: <UserPlus className="h-4 w-4" /> },
  { category: 'comment_added', label: 'Comment Added', icon: <FileText className="h-4 w-4" /> },
]

const actionOptions = [
  { category: 'send_email', label: 'Send Email', icon: <Mail className="h-4 w-4" /> },
  { category: 'create_task', label: 'Create Task', icon: <ListTodo className="h-4 w-4" /> },
  { category: 'notify_user', label: 'Notify User', icon: <Bell className="h-4 w-4" /> },
  { category: 'update_field', label: 'Update Field', icon: <Settings className="h-4 w-4" /> },
  { category: 'escalate', label: 'Escalate', icon: <AlertTriangle className="h-4 w-4" /> },
]

function StepCard({
  step,
  onRemove,
}: {
  step: WorkflowStep
  onRemove: () => void
}) {
  const typeColors = {
    trigger: 'border-blue-500/30 bg-blue-500/5',
    condition: 'border-yellow-500/30 bg-yellow-500/5',
    action: 'border-green-500/30 bg-green-500/5',
  }
  const typeLabels = { trigger: 'When', condition: 'If', action: 'Then' }

  return (
    <Card className={cn('relative', typeColors[step.type])}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold uppercase">
              {typeLabels[step.type]}
            </Badge>
            <span className="text-muted-foreground">{step.icon}</span>
            <span className="text-sm font-medium">{step.label}</span>
          </div>
          <button onClick={onRemove} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {step.type === 'trigger' && (
          <div className="text-xs text-muted-foreground">
            Triggered when a {step.category.replace(/_/g, ' ')} occurs in any project
          </div>
        )}
        {step.type === 'action' && (
          <div className="space-y-2">
            {step.category === 'send_email' && (
              <Input placeholder="Recipient email or role..." className="h-8 text-xs" />
            )}
            {step.category === 'notify_user' && (
              <Input placeholder="Notification message..." className="h-8 text-xs" />
            )}
            {step.category === 'create_task' && (
              <Input placeholder="Task title..." className="h-8 text-xs" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function WorkflowBuilder() {
  const [workflowName, setWorkflowName] = React.useState('New Automation')
  const [steps, setSteps] = React.useState<WorkflowStep[]>([])
  const [showPalette, setShowPalette] = React.useState<'trigger' | 'action' | null>(null)

  const addStep = (type: 'trigger' | 'action', option: { category: string; label: string; icon: React.ReactNode }) => {
    setSteps([...steps, {
      id: `step_${Date.now()}`,
      type,
      category: option.category,
      label: option.label,
      icon: option.icon,
      config: {},
    }])
    setShowPalette(null)
  }

  const removeStep = (id: string) => {
    setSteps(steps.filter((s) => s.id !== id))
  }

  const triggers = steps.filter((s) => s.type === 'trigger')
  const actions = steps.filter((s) => s.type === 'action')

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Panel - Step Palette */}
      <div className="w-64 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-sm mb-1">Workflow Steps</h2>
          <p className="text-xs text-muted-foreground">Drag or click to add steps</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Triggers</p>
            <div className="space-y-1">
              {triggerOptions.map((opt) => (
                <button
                  key={opt.category}
                  onClick={() => addStep('trigger', opt)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-blue-500/10 transition-colors text-left"
                >
                  <span className="text-blue-500">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Actions</p>
            <div className="space-y-1">
              {actionOptions.map((opt) => (
                <button
                  key={opt.category}
                  onClick={() => addStep('action', opt)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm hover:bg-green-500/10 transition-colors text-left"
                >
                  <span className="text-green-500">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="max-w-xs font-semibold border-none shadow-none text-lg h-auto p-0 focus-visible:ring-0"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Test
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-lg mx-auto space-y-0">
            {steps.length === 0 ? (
              <div className="text-center py-20">
                <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground mb-2">Build your automation</p>
                <p className="text-xs text-muted-foreground">
                  Click a trigger from the left panel to start, then add actions.
                </p>
              </div>
            ) : (
              <>
                {steps.map((step, i) => (
                  <React.Fragment key={step.id}>
                    <StepCard step={step} onRemove={() => removeStep(step.id)} />
                    {i < steps.length - 1 && (
                      <div className="flex justify-center py-2">
                        <ArrowDown className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Add step button */}
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed"
                    onClick={() => setShowPalette(triggers.length === 0 ? 'trigger' : 'action')}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Step
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

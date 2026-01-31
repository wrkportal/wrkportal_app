'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Edit, Trash2, Play, Pause, Copy, Settings, Workflow, History, FileText } from 'lucide-react'
import { WorkflowBuilderEnhanced } from '@/components/sales/workflow-builder-enhanced'

interface AutomationRule {
  id: string
  name: string
  description?: string
  triggerType: string
  actionType: string
  isActive: boolean
  priority: number
  createdBy: {
    name?: string
    email: string
  }
}

type AutomationCategoryId =
  | 'wrkboard'
  | 'finance'
  | 'sales'
  | 'operations'
  | 'developer'
  | 'it-services'
  | 'customer-service'
  | 'projects'
  | 'recruitment'
  | 'collaborate'

const AUTOMATION_CATEGORIES: { id: AutomationCategoryId; label: string }[] = [
  { id: 'wrkboard', label: 'wrkboard' },
  { id: 'finance', label: 'Finance' },
  { id: 'sales', label: 'Sales' },
  { id: 'operations', label: 'Operations' },
  { id: 'developer', label: 'Developer' },
  { id: 'it-services', label: 'IT Services' },
  { id: 'customer-service', label: 'Customer Service' },
  { id: 'projects', label: 'Projects' },
  { id: 'recruitment', label: 'Recruitment' },
  { id: 'collaborate', label: 'Collaborate' },
]

const CATEGORY_LABEL_TO_ID = new Map<string, AutomationCategoryId>([
  ['wrkboard', 'wrkboard'],
  ['Finance', 'finance'],
  ['Sales', 'sales'],
  ['Operations', 'operations'],
  ['Developer', 'developer'],
  ['IT Services', 'it-services'],
  ['Customer Service', 'customer-service'],
  ['Projects', 'projects'],
  ['Recruitment', 'recruitment'],
  ['Collaborate', 'collaborate'],
])

const TRIGGERS_BY_CATEGORY: Record<AutomationCategoryId, { value: string; label: string }[]> = {
  'wrkboard': [
    { value: 'TASK_CREATED', label: 'Task Created' },
    { value: 'TASK_OVERDUE', label: 'Task Overdue' },
    { value: 'TASK_STATUS_CHANGED', label: 'Task Status Changed' },
  ],
  finance: [
    { value: 'INVOICE_CREATED', label: 'Invoice Created' },
    { value: 'INVOICE_OVERDUE', label: 'Invoice Overdue' },
    { value: 'PAYMENT_RECEIVED', label: 'Payment Received' },
    { value: 'BUDGET_THRESHOLD_REACHED', label: 'Budget Threshold Reached' },
    { value: 'EXPENSE_SUBMITTED', label: 'Expense Submitted' },
  ],
  sales: [
    { value: 'LEAD_CREATED', label: 'Lead Created' },
    { value: 'LEAD_STATUS_CHANGED', label: 'Lead Status Changed' },
    { value: 'LEAD_SCORED', label: 'Lead Scored' },
    { value: 'OPPORTUNITY_CREATED', label: 'Opportunity Created' },
    { value: 'OPPORTUNITY_STAGE_CHANGED', label: 'Opportunity Stage Changed' },
    { value: 'QUOTE_SENT', label: 'Quote Sent' },
    { value: 'ORDER_CREATED', label: 'Order Created' },
  ],
  operations: [
    { value: 'WORK_ORDER_CREATED', label: 'Work Order Created' },
    { value: 'MAINTENANCE_DUE', label: 'Maintenance Due' },
    { value: 'INVENTORY_LOW', label: 'Inventory Low' },
  ],
  developer: [
    { value: 'PR_CREATED', label: 'Pull Request Created' },
    { value: 'BUILD_FAILED', label: 'Build Failed' },
    { value: 'DEPLOYMENT_COMPLETED', label: 'Deployment Completed' },
  ],
  'it-services': [
    { value: 'TICKET_CREATED', label: 'Ticket Created' },
    { value: 'TICKET_STATUS_CHANGED', label: 'Ticket Status Changed' },
    { value: 'SLA_BREACH', label: 'SLA Breach' },
  ],
  'customer-service': [
    { value: 'CASE_CREATED', label: 'Case Created' },
    { value: 'CSAT_LOW', label: 'Low CSAT Score' },
    { value: 'CASE_ESCALATED', label: 'Case Escalated' },
  ],
  projects: [
    { value: 'PROJECT_CREATED', label: 'Project Created' },
    { value: 'MILESTONE_REACHED', label: 'Milestone Reached' },
    { value: 'SPRINT_STARTED', label: 'Sprint Started' },
    { value: 'RELEASE_CREATED', label: 'Release Created' },
  ],
  recruitment: [
    { value: 'CANDIDATE_APPLIED', label: 'Candidate Applied' },
    { value: 'INTERVIEW_SCHEDULED', label: 'Interview Scheduled' },
    { value: 'OFFER_SENT', label: 'Offer Sent' },
  ],
  collaborate: [
    { value: 'MENTION_RECEIVED', label: 'Mention Received' },
    { value: 'COMMENT_ADDED', label: 'Comment Added' },
  ],
}

const ACTIONS_BY_TRIGGER: Record<string, { value: string; label: string }[]> = {
  LEAD_CREATED: [
    { value: 'ASSIGN_LEAD', label: 'Assign Lead' },
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'CREATE_TASK', label: 'Create Task' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
    { value: 'UPDATE_FIELD', label: 'Update Field' },
  ],
  LEAD_STATUS_CHANGED: [
    { value: 'NOTIFY_USER', label: 'Notify User' },
    { value: 'CREATE_TASK', label: 'Create Task' },
    { value: 'UPDATE_FIELD', label: 'Update Field' },
  ],
  LEAD_SCORED: [
    { value: 'ASSIGN_LEAD', label: 'Assign Lead' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  OPPORTUNITY_CREATED: [
    { value: 'CREATE_TASK', label: 'Create Task' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  OPPORTUNITY_STAGE_CHANGED: [
    { value: 'CHANGE_STAGE', label: 'Change Stage' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  QUOTE_SENT: [
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'CREATE_ACTIVITY', label: 'Create Activity' },
  ],
  ORDER_CREATED: [
    { value: 'NOTIFY_USER', label: 'Notify User' },
    { value: 'CREATE_TASK', label: 'Create Task' },
  ],
  INVOICE_OVERDUE: [
    { value: 'SEND_EMAIL', label: 'Send Email' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  PAYMENT_RECEIVED: [
    { value: 'UPDATE_FIELD', label: 'Update Field' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  EXPENSE_SUBMITTED: [
    { value: 'NOTIFY_USER', label: 'Notify User' },
    { value: 'CREATE_TASK', label: 'Create Task' },
  ],
  TICKET_CREATED: [
    { value: 'ASSIGN_TICKET', label: 'Assign Ticket' },
    { value: 'NOTIFY_USER', label: 'Notify User' },
  ],
  TASK_CREATED: [
    { value: 'NOTIFY_USER', label: 'Notify User' },
    { value: 'CREATE_ACTIVITY', label: 'Create Activity' },
  ],
}

function AutomationPageInner() {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null)
  const [showWorkflowBuilder, setShowWorkflowBuilder] = useState(false)
  const [showExecutionHistory, setShowExecutionHistory] = useState<string | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCategory, setFormCategory] = useState<AutomationCategoryId | null>(null)
  const [formTrigger, setFormTrigger] = useState<string | null>(null)
  const [formAction, setFormAction] = useState<string | null>(null)
  const [allowedSections, setAllowedSections] = useState<string[] | null>(null)

  useEffect(() => {
    fetchRules()
  }, [])

  useEffect(() => {
    const fetchAllowedSections = async () => {
      try {
        const response = await fetch('/api/user/tenants')
        if (response.ok) {
          const data = await response.json()
          const rawSections = data.activeTenantAccess?.allowedSections
          if (!rawSections) {
            setAllowedSections(null)
            return
          }
          const parsed = typeof rawSections === 'string' ? JSON.parse(rawSections) : rawSections
          if (Array.isArray(parsed)) {
            setAllowedSections(parsed.length === 0 ? null : parsed)
          } else if (parsed && Array.isArray(parsed.sections)) {
            setAllowedSections(parsed.sections.length === 0 ? null : parsed.sections)
          } else {
            setAllowedSections(null)
          }
        }
      } catch (error) {
        console.warn('Error fetching allowed sections:', error)
        setAllowedSections(null)
      }
    }
    fetchAllowedSections()
  }, [])

  useEffect(() => {
    if (dialogOpen) {
      if (editingRule) {
        setFormName(editingRule.name)
        setFormDescription(editingRule.description || '')
        setFormCategory(null)
        setFormTrigger(editingRule.triggerType || null)
        setFormAction(editingRule.actionType || null)
      } else {
        setFormName('')
        setFormDescription('')
        setFormCategory(null)
        setFormTrigger(null)
        setFormAction(null)
      }
    }
  }, [dialogOpen, editingRule])

  const availableCategories = useMemo(() => {
    if (allowedSections === null) return AUTOMATION_CATEGORIES
    const allowedCategoryIds = new Set<AutomationCategoryId>()
    allowedSections.forEach((section) => {
      const prefix = section.split(':')[0]
      const categoryId = CATEGORY_LABEL_TO_ID.get(prefix)
      if (categoryId) {
        allowedCategoryIds.add(categoryId)
      }
    })
    return AUTOMATION_CATEGORIES.filter((category) => allowedCategoryIds.has(category.id))
  }, [allowedSections])

  useEffect(() => {
    if (!formCategory && availableCategories.length > 0) {
      setFormCategory(availableCategories[0].id)
    }
  }, [availableCategories, formCategory])

  const triggerOptions = useMemo(() => {
    if (!formCategory) return []
    return TRIGGERS_BY_CATEGORY[formCategory] || []
  }, [formCategory])

  const actionOptions = useMemo(() => {
    if (!formTrigger) return []
    return ACTIONS_BY_TRIGGER[formTrigger] || [
      { value: 'NOTIFY_USER', label: 'Notify User' },
      { value: 'CREATE_TASK', label: 'Create Task' },
    ]
  }, [formTrigger])

  useEffect(() => {
    if (formAction && !actionOptions.some((option) => option.value === formAction)) {
      setFormAction(null)
    }
  }, [actionOptions, formAction])

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/sales/automation/rules')
      if (response.ok) {
        const data = await response.json()
        setRules(data)
      }
    } catch (error) {
      console.error('Error fetching automation rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/sales/automation/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error('Error toggling rule:', error)
    }
  }

  const handleDelete = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this automation rule?')) {
      return
    }

    try {
      const response = await fetch(`/api/sales/automation/rules/${ruleId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const labels: Record<string, string> = {
      LEAD_CREATED: 'Lead Created',
      LEAD_STATUS_CHANGED: 'Lead Status Changed',
      LEAD_SCORED: 'Lead Scored',
      OPPORTUNITY_CREATED: 'Opportunity Created',
      OPPORTUNITY_STAGE_CHANGED: 'Opportunity Stage Changed',
      QUOTE_SENT: 'Quote Sent',
      ORDER_CREATED: 'Order Created',
    }
    return labels[triggerType] || triggerType
  }

  const getActionLabel = (actionType: string) => {
    const labels: Record<string, string> = {
      ASSIGN_LEAD: 'Assign Lead',
      SEND_EMAIL: 'Send Email',
      CREATE_TASK: 'Create Task',
      UPDATE_FIELD: 'Update Field',
      CREATE_ACTIVITY: 'Create Activity',
      CHANGE_STAGE: 'Change Stage',
      NOTIFY_USER: 'Notify User',
    }
    return labels[actionType] || actionType
  }

  return (
    <SalesPageLayout
      title="Automation"
      description="Automate your sales processes with workflow rules"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Automation Rules</h2>
            <p className="text-sm text-muted-foreground">
              Create rules to automate repetitive tasks and workflows
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowWorkflowBuilder(true)}
            >
              <Workflow className="h-4 w-4 mr-2" />
              Visual Builder
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingRule(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
                  </DialogTitle>
                  <DialogDescription>
                    Configure trigger conditions and actions for your automation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="e.g., Auto-assign high-scoring leads"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe what this rule does..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={formCategory || undefined} onValueChange={(value) => setFormCategory(value as AutomationCategoryId)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Trigger</Label>
                      <Select value={formTrigger || undefined} onValueChange={setFormTrigger}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trigger" />
                        </SelectTrigger>
                        <SelectContent>
                          {triggerOptions.map((trigger) => (
                            <SelectItem key={trigger.value} value={trigger.value}>
                              {trigger.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Action</Label>
                      <Select value={formAction || undefined} onValueChange={setFormAction}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action" />
                        </SelectTrigger>
                        <SelectContent>
                          {actionOptions.map((action) => (
                            <SelectItem key={action.value} value={action.value}>
                              {action.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setDialogOpen(false)}>
                      {editingRule ? 'Update' : 'Create'} Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {showTemplates && (
          <TemplatesDialog
            onClose={() => setShowTemplates(false)}
            onSelectTemplate={async (template) => {
              try {
                const response = await fetch('/api/sales/automation/rules', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: template.name,
                    description: template.description,
                    ...template.workflow,
                  }),
                })
                if (response.ok) {
                  setShowTemplates(false)
                  fetchRules()
                }
              } catch (error) {
                console.error('Error creating rule from template:', error)
              }
            }}
          />
        )}

        {showWorkflowBuilder && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Visual Workflow Builder</CardTitle>
                  <CardDescription>
                    Drag and drop to create automation workflows visually. Use Ctrl+Scroll to zoom, Ctrl+Drag to pan.
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowWorkflowBuilder(false)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <WorkflowBuilderEnhanced
                onSave={async (workflow) => {
                  try {
                    const response = await fetch('/api/sales/automation/rules', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(workflow),
                    })
                    if (response.ok) {
                      setShowWorkflowBuilder(false)
                      fetchRules()
                    }
                  } catch (error) {
                    console.error('Error saving workflow:', error)
                  }
                }}
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">Loading automation rules...</div>
        ) : rules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No automation rules configured yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Rule
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <CardDescription>{rule.description}</CardDescription>
                      )}
                      <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                        <span>
                          <strong>Trigger:</strong> {getTriggerLabel(rule.triggerType)}
                        </span>
                        <span>
                          <strong>Action:</strong> {getActionLabel(rule.actionType)}
                        </span>
                        <span>
                          <strong>Priority:</strong> {rule.priority}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRule(rule)
                          setDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExecutionHistory(rule.id)}
                        title="View execution history"
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Automation Features</CardTitle>
            <CardDescription>Available automation capabilities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Communication Automation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Email Sequences</li>
                  <li>✓ Follow-Up Automation</li>
                  <li>✓ Meeting Reminders</li>
                  <li>✓ Proposal Follow-Up</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Data Automation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Duplicate Detection</li>
                  <li>✓ Data Validation</li>
                  <li>✓ Data Enrichment</li>
                  <li>✓ Auto-Assignment</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Workflow Automation</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Multi-Step Workflows</li>
                  <li>✓ Conditional Logic</li>
                  <li>✓ Trigger-Based Rules</li>
                  <li>✓ Scheduled Actions</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Actions Available</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✓ Assign Leads/Opportunities</li>
                  <li>✓ Send Emails</li>
                  <li>✓ Create Tasks/Activities</li>
                  <li>✓ Update Fields</li>
                  <li>✓ Change Stages</li>
                  <li>✓ Send Notifications</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {showExecutionHistory && (
          <ExecutionHistoryDialog
            ruleId={showExecutionHistory}
            onClose={() => setShowExecutionHistory(null)}
          />
        )}
      </div>
    </SalesPageLayout>
  )
}

function ExecutionHistoryDialog({ ruleId, onClose }: { ruleId: string; onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [ruleId])

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/sales/automation/executions?ruleId=${ruleId}`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching execution history:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
          <DialogDescription>
            View execution history and statistics for this automation rule
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{stats.total}</div>
                      <div className="text-sm text-muted-foreground">Total Executions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{stats.success}</div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            <div>
              <h3 className="font-medium mb-2">Recent Executions</h3>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No executions yet
                  </div>
                ) : (
                  history.map((exec) => (
                    <Card key={exec.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{exec.ruleName}</div>
                            <div className="text-sm text-muted-foreground">
                              {exec.triggerType} → {exec.actionType}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(exec.startedAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            variant={
                              exec.status === 'SUCCESS' ? 'default' :
                                exec.status === 'FAILED' ? 'destructive' : 'secondary'
                            }
                          >
                            {exec.status}
                          </Badge>
                        </div>
                        {exec.errorMessage && (
                          <div className="mt-2 text-sm text-red-600">
                            Error: {exec.errorMessage}
                          </div>
                        )}
                        {exec.executionTime && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Execution time: {exec.executionTime}ms
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function TemplatesDialog({ onClose, onSelectTemplate }: { onClose: () => void; onSelectTemplate: (template: any) => void }) {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchTemplates()
  }, [category, search])

  const fetchTemplates = async () => {
    try {
      const params = new URLSearchParams()
      if (category !== 'all') params.append('category', category)
      if (search) params.append('search', search)

      const response = await fetch(`/api/sales/automation/templates?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'lead-management', label: 'Lead Management' },
    { value: 'follow-up', label: 'Follow-Up' },
    { value: 'data-quality', label: 'Data Quality' },
    { value: 'notifications', label: 'Notifications' },
    { value: 'assignment', label: 'Assignment' },
  ]

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Workflow Templates</DialogTitle>
          <DialogDescription>
            Choose a pre-built template to get started quickly
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="text-center py-8">Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No templates found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:border-blue-500 transition-colors">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{template.icon}</span>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                        </div>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {template.tags?.slice(0, 3).map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          onSelectTemplate(template)
                        }}
                      >
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AutomationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <AutomationPageInner />
    </Suspense>
  )
}

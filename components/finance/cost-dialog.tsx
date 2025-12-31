'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface CostDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  budgetId: string
  costId?: string // If provided, edit mode
  projectId?: string
  taskId?: string
}

export function CostDialog({ open, onClose, onSuccess, budgetId, costId, projectId, taskId }: CostDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [budget, setBudget] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: 0,
    currency: 'USD',
    costType: 'DIRECT' as 'DIRECT' | 'INDIRECT' | 'FIXED' | 'VARIABLE',
    date: new Date().toISOString().split('T')[0],
    costCenter: '',
    budgetCategoryId: '',
    projectId: projectId || '',
    taskId: taskId || '',
  })

  // Load budget and related data
  useEffect(() => {
    if (open && budgetId) {
      // Load budget
      fetch(`/api/finance/budgets/${budgetId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.budget) {
            setBudget(data.budget)
            if (!formData.budgetCategoryId && data.budget.categories?.[0]) {
              setFormData((prev) => ({ ...prev, budgetCategoryId: data.budget.categories[0].id }))
            }
          }
        })
        .catch(console.error)

      // Load projects
      fetch('/api/projects')
        .then((r) => r.json())
        .then((data) => setProjects(data.projects || []))
        .catch(console.error)

      // If editing, load cost data
      if (costId) {
        fetch(`/api/finance/costs/${costId}`)
          .then((r) => r.json())
          .then((data) => {
            if (data.cost) {
              const cost = data.cost
              setFormData({
                name: cost.name,
                description: cost.description || '',
                amount: Number(cost.amount),
                currency: cost.currency,
                costType: cost.costType,
                date: new Date(cost.date).toISOString().split('T')[0],
                costCenter: cost.costCenter || '',
                budgetCategoryId: cost.budgetCategoryId || '',
                projectId: cost.projectId || '',
                taskId: cost.taskId || '',
              })
            }
          })
          .catch(console.error)
      }
    }
  }, [open, budgetId, costId])

  // Load tasks when project is selected
  useEffect(() => {
    if (formData.projectId) {
      fetch(`/api/projects/${formData.projectId}/tasks`)
        .then((r) => r.json())
        .then((data) => setTasks(data.tasks || []))
        .catch(() => setTasks([]))
    } else {
      setTasks([])
    }
  }, [formData.projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload = {
        ...formData,
        budgetId,
        amount: parseFloat(formData.amount.toString()),
      }

      const url = costId ? `/api/finance/costs/${costId}` : '/api/finance/costs'
      const method = costId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save cost')
      }

      const result = await response.json()

      // Show warnings if any
      if (result.warnings) {
        if (result.warnings.budgetExceeded) {
          alert('Warning: This cost exceeds the budget!')
        }
        if (result.warnings.thresholdAlerts?.length > 0) {
          alert(result.warnings.thresholdAlerts.join('\n'))
        }
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      alert(error.message || 'Failed to save cost')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{costId ? 'Edit Cost' : 'Add New Cost'}</DialogTitle>
          <DialogDescription>
            {costId ? 'Update cost details' : 'Record a new cost entry for this budget'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Cost Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Software License"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Cost description..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => setFormData({ ...formData, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="costType">Cost Type</Label>
                <Select
                  value={formData.costType}
                  onValueChange={(value: any) => setFormData({ ...formData, costType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="INDIRECT">Indirect</SelectItem>
                    <SelectItem value="FIXED">Fixed</SelectItem>
                    <SelectItem value="VARIABLE">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="costCenter">Cost Center</Label>
                <Input
                  id="costCenter"
                  value={formData.costCenter}
                  onChange={(e) => setFormData({ ...formData, costCenter: e.target.value })}
                  placeholder="e.g., Engineering"
                />
              </div>
            </div>

            {budget && budget.categories && budget.categories.length > 0 && (
              <div>
                <Label htmlFor="budgetCategoryId">Budget Category</Label>
                <Select
                  value={formData.budgetCategoryId}
                  onValueChange={(value) => setFormData({ ...formData, budgetCategoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {budget.categories.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectId">Project (Optional)</Label>
                <Select
                  value={formData.projectId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, projectId: value || '', taskId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="taskId">Task (Optional)</Label>
                <Select
                  value={formData.taskId || undefined}
                  onValueChange={(value) => setFormData({ ...formData, taskId: value || '' })}
                  disabled={!formData.projectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.projectId ? 'Select task' : 'Select project first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {tasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : costId ? 'Update Cost' : 'Add Cost'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


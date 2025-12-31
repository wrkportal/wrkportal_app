'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface ForecastDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  budgetId?: string
  projectId?: string
}

export function ForecastDialog({ open, onClose, onSuccess, budgetId, projectId }: ForecastDialogProps) {
  const [budgets, setBudgets] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedBudgetId, setSelectedBudgetId] = useState(budgetId || '')
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '')
  const [forecastType, setForecastType] = useState<'AI_POWERED' | 'MANUAL' | 'SCENARIO' | 'HYBRID'>('AI_POWERED')
  const [scenario, setScenario] = useState<'BEST_CASE' | 'BASE_CASE' | 'WORST_CASE'>('BASE_CASE')
  const [model, setModel] = useState<'LINEAR' | 'EXPONENTIAL' | 'SEASONAL' | 'MOVING_AVERAGE' | 'CUSTOM'>('LINEAR')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [forecastedAmount, setForecastedAmount] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [forecastResult, setForecastResult] = useState<any>(null)
  const [selectedBudget, setSelectedBudget] = useState<any>(null)

  useEffect(() => {
    if (open) {
      loadBudgets()
      loadProjects()
      if (budgetId) {
        setSelectedBudgetId(budgetId)
        loadBudgetDetails(budgetId)
      }
    }
  }, [open, budgetId])

  useEffect(() => {
    if (selectedBudgetId) {
      loadBudgetDetails(selectedBudgetId)
    }
  }, [selectedBudgetId])

  const loadBudgets = async () => {
    try {
      const response = await fetch('/api/finance/budgets')
      if (response.ok) {
        const data = await response.json()
        setBudgets(data.budgets || [])
      }
    } catch (error) {
      console.error('Error loading budgets:', error)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects')
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadBudgetDetails = async (id: string) => {
    try {
      const response = await fetch(`/api/finance/budgets/${id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedBudget(data.budget)
        if (!selectedProjectId && data.budget?.projectId) {
          setSelectedProjectId(data.budget.projectId)
        }
      }
    } catch (error) {
      console.error('Error loading budget details:', error)
    }
  }

  const handleGenerate = async () => {
    if (!selectedBudgetId || !name) {
      alert('Please select a budget and enter a forecast name')
      return
    }

    if (forecastType === 'MANUAL' && !forecastedAmount) {
      alert('Please enter forecasted amount for manual forecasts')
      return
    }

    setIsGenerating(true)
    setForecastResult(null)

    try {
      const response = await fetch('/api/finance/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetId: selectedBudgetId,
          projectId: selectedProjectId || undefined,
          name,
          description: description || undefined,
          forecastType,
          scenario: forecastType === 'SCENARIO' ? scenario : undefined,
          model,
          forecastedAmount: forecastType === 'MANUAL' ? parseFloat(forecastedAmount) : undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setForecastResult(data.forecast)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to generate forecast')
      }
    } catch (error) {
      console.error('Error generating forecast:', error)
      alert('Failed to generate forecast')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    setForecastResult(null)
    setName('')
    setDescription('')
    setForecastedAmount('')
    setForecastType('AI_POWERED')
    setScenario('BASE_CASE')
    onClose()
  }

  const variance = forecastResult && selectedBudget
    ? Number(forecastResult.forecastedAmount) - Number(selectedBudget.totalAmount)
    : 0
  const variancePercent = selectedBudget && selectedBudget.totalAmount > 0
    ? (variance / Number(selectedBudget.totalAmount)) * 100
    : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Forecast</DialogTitle>
          <DialogDescription>
            Create AI-powered or manual budget forecasts
          </DialogDescription>
        </DialogHeader>

        {!forecastResult ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="budget">Budget *</Label>
                <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgets.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={selectedProjectId || undefined} onValueChange={(value) => setSelectedProjectId(value || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBudget && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Budget Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Budget</p>
                      <p className="font-medium">{formatCurrency(selectedBudget.totalAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spent</p>
                      <p className="font-medium">{formatCurrency(selectedBudget.spentAmount)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Remaining</p>
                      <p className="font-medium">
                        {formatCurrency(Number(selectedBudget.totalAmount) - Number(selectedBudget.spentAmount))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="name">Forecast Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 2024 Forecast"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forecastType">Forecast Type</Label>
                <Select value={forecastType} onValueChange={(v: any) => setForecastType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI_POWERED">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI-Powered
                      </div>
                    </SelectItem>
                    <SelectItem value="HYBRID">Hybrid (AI + Manual)</SelectItem>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="SCENARIO">Scenario-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {forecastType === 'SCENARIO' && (
                <div>
                  <Label htmlFor="scenario">Scenario</Label>
                  <Select value={scenario} onValueChange={(v: any) => setScenario(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEST_CASE">Best Case</SelectItem>
                      <SelectItem value="BASE_CASE">Base Case</SelectItem>
                      <SelectItem value="WORST_CASE">Worst Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {forecastType === 'MANUAL' && (
                <div>
                  <Label htmlFor="forecastedAmount">Forecasted Amount *</Label>
                  <Input
                    id="forecastedAmount"
                    type="number"
                    value={forecastedAmount}
                    onChange={(e) => setForecastedAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              {(forecastType === 'AI_POWERED' || forecastType === 'HYBRID') && (
                <div>
                  <Label htmlFor="model">Forecast Model</Label>
                  <Select value={model} onValueChange={(v: any) => setModel(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LINEAR">Linear</SelectItem>
                      <SelectItem value="EXPONENTIAL">Exponential</SelectItem>
                      <SelectItem value="SEASONAL">Seasonal</SelectItem>
                      <SelectItem value="MOVING_AVERAGE">Moving Average</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium text-green-800">Forecast generated successfully!</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{forecastResult.name}</CardTitle>
                <CardDescription>{forecastResult.description || 'No description'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Forecasted Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(forecastResult.forecastedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(selectedBudget?.totalAmount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Variance</p>
                    <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.abs(variance))}
                    </p>
                    <p className={`text-xs ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance >= 0 ? 'Under' : 'Over'} budget ({formatPercentage(Math.abs(variancePercent))})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                    <div className="flex items-center gap-2">
                      <Progress value={forecastResult.confidence} className="flex-1" />
                      <span className="text-sm font-medium">{forecastResult.confidence}%</span>
                    </div>
                    {forecastResult.confidenceLow && forecastResult.confidenceHigh && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {formatCurrency(forecastResult.confidenceLow)} - {formatCurrency(forecastResult.confidenceHigh)}
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge>{forecastResult.forecastType}</Badge>
                    {forecastResult.scenario && (
                      <Badge variant="outline" className="ml-2">{forecastResult.scenario}</Badge>
                    )}
                  </div>
                </div>

                {forecastResult.assumptions && typeof forecastResult.assumptions === 'object' && (
                  <div className="space-y-2">
                    {forecastResult.assumptions.thresholdAlerts && forecastResult.assumptions.thresholdAlerts.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Threshold Alerts</p>
                        {forecastResult.assumptions.thresholdAlerts.map((alert: any, idx: number) => (
                          <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-amber-800">{alert.severity}</p>
                              <p className="text-xs text-amber-700">{alert.description || 'Threshold alert'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {forecastResult ? 'Close' : 'Cancel'}
          </Button>
          {!forecastResult && (
            <Button onClick={handleGenerate} disabled={isGenerating || !selectedBudgetId || !name}>
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Forecast
                </>
              )}
            </Button>
          )}
          {forecastResult && (
            <Button onClick={() => {
              onSuccess()
              handleClose()
            }}>
              Save Forecast
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


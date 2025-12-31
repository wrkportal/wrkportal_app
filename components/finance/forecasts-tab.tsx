'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatPercentage } from '@/lib/utils'
import { Plus, Sparkles, TrendingUp, TrendingDown, Eye, Trash2, Download, Filter } from 'lucide-react'
import { ForecastDialog } from './forecast-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export function ForecastsTab() {
  const [forecasts, setForecasts] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [forecastDialogOpen, setForecastDialogOpen] = useState(false)
  const [selectedForecast, setSelectedForecast] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [filterBudget, setFilterBudget] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  useEffect(() => {
    loadForecasts()
    loadBudgets()
    loadProjects()
  }, [])

  useEffect(() => {
    loadForecasts()
  }, [filterBudget, filterType])

  const loadForecasts = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filterBudget) params.append('budgetId', filterBudget)
      if (filterType) params.append('forecastType', filterType)

      const response = await fetch(`/api/finance/forecasts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setForecasts(data.forecasts || [])
      }
    } catch (error) {
      console.error('Error loading forecasts:', error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleViewForecast = async (forecastId: string) => {
    try {
      const response = await fetch(`/api/finance/forecasts/${forecastId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedForecast(data.forecast)
        setViewDialogOpen(true)
      }
    } catch (error) {
      console.error('Error loading forecast:', error)
    }
  }

  const handleDeleteForecast = async (forecastId: string) => {
    if (!confirm('Are you sure you want to delete this forecast?')) return

    try {
      const response = await fetch(`/api/finance/forecasts/${forecastId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        loadForecasts()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete forecast')
      }
    } catch (error) {
      alert('Failed to delete forecast')
    }
  }

  const handleExport = (type: string, format: 'excel' | 'pdf') => {
    const params = new URLSearchParams()
    params.append('type', type)
    params.append('format', format)
    if (filterBudget) params.append('id', filterBudget)

    window.open(`/api/finance/export?${params.toString()}`, '_blank')
  }

  const getForecastTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      AI_POWERED: { variant: 'default' as const, label: 'AI-Powered', className: 'bg-purple-500' },
      MANUAL: { variant: 'secondary' as const, label: 'Manual' },
      SCENARIO: { variant: 'outline' as const, label: 'Scenario' },
      HYBRID: { variant: 'default' as const, label: 'Hybrid', className: 'bg-blue-500' },
    }
    const config = variants[type] || { variant: 'secondary' as const, label: type }
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Forecasts</CardTitle>
              <CardDescription>AI-powered budget forecasting and scenarios</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport('FORECAST', 'excel')}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button onClick={() => setForecastDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                New Forecast
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Select value={filterBudget} onValueChange={setFilterBudget}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Budgets" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AI_POWERED">AI-Powered</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="SCENARIO">Scenario</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading forecasts...</div>
          ) : forecasts.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No forecasts found</p>
              <Button onClick={() => setForecastDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Forecast
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {forecasts.map((forecast) => {
                const budgetTotal = Number(forecast.budget?.totalAmount || 0)
                const forecastedAmount = Number(forecast.forecastedAmount)
                const variance = forecastedAmount - budgetTotal
                const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0

                return (
                  <div key={forecast.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{forecast.name}</p>
                          {getForecastTypeBadge(forecast.forecastType)}
                          {forecast.scenario && (
                            <Badge variant="outline">{forecast.scenario}</Badge>
                          )}
                        </div>
                        {forecast.description && (
                          <p className="text-sm text-muted-foreground mb-2">{forecast.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Budget: {forecast.budget?.name || 'N/A'} | 
                          {forecast.project && ` Project: ${forecast.project.name}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(forecastedAmount)}
                        </p>
                        <p className={`text-xs ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)} ({formatPercentage(Math.abs(variancePercent))})
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <span>{forecast.confidence}%</span>
                      </div>
                      <Progress value={forecast.confidence} className="h-2" />
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewForecast(forecast.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteForecast(forecast.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                      <div className="flex-1" />
                      <p className="text-xs text-muted-foreground">
                        Generated: {new Date(forecast.generatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ForecastDialog
        open={forecastDialogOpen}
        onClose={() => setForecastDialogOpen(false)}
        onSuccess={() => {
          loadForecasts()
          setForecastDialogOpen(false)
        }}
      />

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedForecast?.name}</DialogTitle>
            <DialogDescription>Forecast details and analysis</DialogDescription>
          </DialogHeader>
          {selectedForecast && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Forecasted Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedForecast.forecastedAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Budget Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedForecast.budget?.totalAmount || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variance</p>
                  <p className={`text-2xl font-bold ${selectedForecast.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(selectedForecast.variance))}
                  </p>
                  <p className={`text-xs ${selectedForecast.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedForecast.variancePercent >= 0 ? '+' : ''}{formatPercentage(Math.abs(selectedForecast.variancePercent))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Confidence</p>
                  <Progress value={selectedForecast.confidence} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {selectedForecast.confidence}% confidence
                  </p>
                  {selectedForecast.confidenceLow && selectedForecast.confidenceHigh && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Range: {formatCurrency(selectedForecast.confidenceLow)} - {formatCurrency(selectedForecast.confidenceHigh)}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type & Model</p>
                  <div className="flex gap-2 mt-2">
                    <Badge>{selectedForecast.forecastType}</Badge>
                    {selectedForecast.scenario && (
                      <Badge variant="outline">{selectedForecast.scenario}</Badge>
                    )}
                    <Badge variant="outline">{selectedForecast.model}</Badge>
                  </div>
                </div>
              </div>

              {selectedForecast.assumptions && typeof selectedForecast.assumptions === 'object' && (
                <div className="space-y-2">
                  {selectedForecast.assumptions.thresholdAlerts && selectedForecast.assumptions.thresholdAlerts.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Threshold Alerts</p>
                      {selectedForecast.assumptions.thresholdAlerts.map((alert: any, idx: number) => (
                        <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">{alert.severity}</p>
                            <p className="text-xs text-amber-700">{alert.description || 'Threshold alert'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedForecast.assumptions.costOptimizations && selectedForecast.assumptions.costOptimizations.length > 0 && (
                    <div>
                      <p className="font-medium mb-2">Cost Optimizations</p>
                      {selectedForecast.assumptions.costOptimizations.map((opt: any, idx: number) => (
                        <div key={idx} className="p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-blue-800">{opt.category}</p>
                            <p className="text-xs text-blue-700">{opt.description}</p>
                            <p className="text-xs text-blue-600 mt-1">
                              Potential Savings: {formatCurrency(opt.potentialSavings || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


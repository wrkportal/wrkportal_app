'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Trash2, Save } from 'lucide-react'
import type { LeadScoringConfig } from '@/lib/sales/lead-scoring'

interface LeadScoringConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeadScoringConfigDialog({ open, onOpenChange }: LeadScoringConfigDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState<LeadScoringConfig | null>(null)

  useEffect(() => {
    if (open) {
      fetchConfig()
    }
  }, [open])

  const fetchConfig = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales/scoring/config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load scoring configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error fetching config:', error)
      toast({
        title: 'Error',
        description: 'Failed to load scoring configuration',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      const response = await fetch('/api/sales/scoring/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Scoring configuration saved successfully',
        })
        onOpenChange(false)
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save configuration',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast({
        title: 'Error',
        description: 'Failed to save configuration',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateParameterWeight = (paramName: string, weight: number) => {
    if (!config) return
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [paramName]: {
          ...config.parameters[paramName],
          weight: Math.max(0, weight),
        },
      },
    })
  }

  const updateConditionPoints = (paramName: string, conditionIndex: number, points: number) => {
    if (!config) return
    const param = config.parameters[paramName]
    const updatedConditions = [...param.conditions]
    updatedConditions[conditionIndex] = {
      ...updatedConditions[conditionIndex],
      points: Math.max(0, points),
    }
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [paramName]: {
          ...param,
          conditions: updatedConditions,
        },
      },
    })
  }

  const addCondition = (paramName: string) => {
    if (!config) return
    const param = config.parameters[paramName]
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [paramName]: {
          ...param,
          conditions: [
            ...param.conditions,
            { field: 'company', operator: 'contains', value: '', points: 5 },
          ],
        },
      },
    })
  }

  const removeCondition = (paramName: string, conditionIndex: number) => {
    if (!config) return
    const param = config.parameters[paramName]
    const updatedConditions = param.conditions.filter((_, i) => i !== conditionIndex)
    setConfig({
      ...config,
      parameters: {
        ...config.parameters,
        [paramName]: {
          ...param,
          conditions: updatedConditions,
        },
      },
    })
  }

  const updateThreshold = (threshold: 'hot' | 'warm' | 'cold' | 'autoConvertThreshold', value: number) => {
    if (!config) return
    if (threshold === 'autoConvertThreshold') {
      setConfig({
        ...config,
        autoConvertThreshold: Math.max(0, value),
      })
    } else {
      setConfig({
        ...config,
        thresholds: {
          ...config.thresholds,
          [threshold]: Math.max(0, value),
        },
      })
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!config) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lead Scoring Configuration</DialogTitle>
          <DialogDescription>
            Configure how leads are scored by setting weights for each parameter and points for conditions.
            Higher weights make parameters more important in the overall score calculation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Parameters Configuration */}
          <Tabs defaultValue={Object.keys(config.parameters)[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {Object.keys(config.parameters).map((paramName) => (
                <TabsTrigger key={paramName} value={paramName} className="capitalize">
                  {paramName}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(config.parameters).map(([paramName, paramConfig]) => (
              <TabsContent key={paramName} value={paramName} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="capitalize">{paramName} Parameter</CardTitle>
                        <CardDescription>
                          Configure the weight and conditions for {paramName} scoring
                        </CardDescription>
                      </div>
                      <Badge variant="secondary">
                        Weight: {paramConfig.weight}x
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Weight Configuration */}
                    <div className="space-y-2">
                      <Label htmlFor={`weight-${paramName}`}>
                        Parameter Weight
                        <span className="text-xs text-muted-foreground ml-2">
                          (Multiplier applied to all condition points)
                        </span>
                      </Label>
                      <Input
                        id={`weight-${paramName}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={paramConfig.weight}
                        onChange={(e) =>
                          updateParameterWeight(paramName, parseFloat(e.target.value) || 0)
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Example: If a condition gives 10 points and weight is 1.5, the final contribution is 15 points.
                      </p>
                    </div>

                    <Separator />

                    {/* Conditions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Conditions</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addCondition(paramName)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Condition
                        </Button>
                      </div>

                      {paramConfig.conditions.map((condition, index) => (
                        <Card key={index} className="p-4">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-3">
                              <Label className="text-xs">Field</Label>
                              <Input
                                value={condition.field}
                                onChange={(e) => {
                                  const updatedConditions = [...paramConfig.conditions]
                                  updatedConditions[index] = {
                                    ...condition,
                                    field: e.target.value,
                                  }
                                  setConfig({
                                    ...config,
                                    parameters: {
                                      ...config.parameters,
                                      [paramName]: {
                                        ...paramConfig,
                                        conditions: updatedConditions,
                                      },
                                    },
                                  })
                                }}
                                className="text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Operator</Label>
                              <Select
                                value={condition.operator}
                                onValueChange={(value: any) => {
                                  const updatedConditions = [...paramConfig.conditions]
                                  updatedConditions[index] = {
                                    ...condition,
                                    operator: value,
                                  }
                                  setConfig({
                                    ...config,
                                    parameters: {
                                      ...config.parameters,
                                      [paramName]: {
                                        ...paramConfig,
                                        conditions: updatedConditions,
                                      },
                                    },
                                  })
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="equals">Equals</SelectItem>
                                  <SelectItem value="contains">Contains</SelectItem>
                                  <SelectItem value="greater_than">Greater Than</SelectItem>
                                  <SelectItem value="less_than">Less Than</SelectItem>
                                  <SelectItem value="in">In</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3">
                              <Label className="text-xs">Value</Label>
                              <Input
                                value={condition.value}
                                onChange={(e) => {
                                  const updatedConditions = [...paramConfig.conditions]
                                  updatedConditions[index] = {
                                    ...condition,
                                    value: e.target.value,
                                  }
                                  setConfig({
                                    ...config,
                                    parameters: {
                                      ...config.parameters,
                                      [paramName]: {
                                        ...paramConfig,
                                        conditions: updatedConditions,
                                      },
                                    },
                                  })
                                }}
                                className="text-xs"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Points</Label>
                              <Input
                                type="number"
                                min="0"
                                value={condition.points}
                                onChange={(e) =>
                                  updateConditionPoints(
                                    paramName,
                                    index,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="text-xs"
                              />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCondition(paramName, index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Thresholds Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Thresholds</CardTitle>
              <CardDescription>
                Set the score thresholds for HOT, WARM, and COLD ratings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threshold-hot">HOT Rating Threshold</Label>
                  <Input
                    id="threshold-hot"
                    type="number"
                    min="0"
                    value={config.thresholds.hot}
                    onChange={(e) => updateThreshold('hot', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leads with score ≥ this value are rated HOT
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="threshold-warm">WARM Rating Threshold</Label>
                  <Input
                    id="threshold-warm"
                    type="number"
                    min="0"
                    value={config.thresholds.warm}
                    onChange={(e) => updateThreshold('warm', parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leads with score ≥ this value are rated WARM
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold-auto">Auto-Convert Threshold</Label>
                <Input
                  id="threshold-auto"
                  type="number"
                  min="0"
                  value={config.autoConvertThreshold || 0}
                  onChange={(e) =>
                    updateThreshold('autoConvertThreshold', parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leads with score ≥ this value are automatically qualified
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Configuration
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


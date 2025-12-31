'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { ChartConfig, ChartType, ChartAxisConfig, ChartSeriesConfig, getChartDefaultConfig } from '@/lib/reporting-studio/chart-types'
import { X, Plus, Trash2 } from 'lucide-react'

interface ChartConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  config: ChartConfig | null
  availableFields: string[]
  onSave: (config: ChartConfig) => void
}

export function ChartConfigDialog({
  open,
  onOpenChange,
  config: initialConfig,
  availableFields,
  onSave,
}: ChartConfigDialogProps) {
  const [config, setConfig] = useState<ChartConfig>(() => {
    if (initialConfig) {
      return initialConfig
    }
    return {
      type: ChartType.BAR,
      series: [],
      ...getChartDefaultConfig(ChartType.BAR),
    } as ChartConfig
  })

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
    } else {
      setConfig({
        type: ChartType.BAR,
        series: [],
        ...getChartDefaultConfig(ChartType.BAR),
      } as ChartConfig)
    }
  }, [initialConfig, open])

  const handleChartTypeChange = (type: ChartType) => {
    const defaultConfig = getChartDefaultConfig(type)
    setConfig({
      ...config,
      type,
      ...defaultConfig,
      series: config.series.length > 0 ? config.series : [],
    })
  }

  const handleAddSeries = () => {
    setConfig({
      ...config,
      series: [
        ...config.series,
        {
          field: availableFields[0] || '',
          label: '',
        },
      ],
    })
  }

  const handleRemoveSeries = (index: number) => {
    setConfig({
      ...config,
      series: config.series.filter((_, i) => i !== index),
    })
  }

  const handleSeriesChange = (index: number, updates: Partial<ChartSeriesConfig>) => {
    const newSeries = [...config.series]
    newSeries[index] = { ...newSeries[index], ...updates }
    setConfig({ ...config, series: newSeries })
  }

  const handleXAxisChange = (updates: Partial<ChartAxisConfig>) => {
    setConfig({
      ...config,
      xAxis: { ...config.xAxis, ...updates } as ChartAxisConfig,
    })
  }

  const handleYAxisChange = (updates: Partial<ChartAxisConfig>) => {
    setConfig({
      ...config,
      yAxis: { ...config.yAxis, ...updates } as ChartAxisConfig,
    })
  }

  const handleSave = () => {
    onSave(config)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Chart</DialogTitle>
          <DialogDescription>
            Customize your chart appearance and data binding
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="data">Data Binding</TabsTrigger>
            <TabsTrigger value="styling">Styling</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label>Chart Type</Label>
              <Select
                value={config.type}
                onValueChange={(value) => handleChartTypeChange(value as ChartType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ChartType.BAR}>Bar Chart</SelectItem>
                  <SelectItem value={ChartType.COLUMN}>Column Chart</SelectItem>
                  <SelectItem value={ChartType.LINE}>Line Chart</SelectItem>
                  <SelectItem value={ChartType.AREA}>Area Chart</SelectItem>
                  <SelectItem value={ChartType.PIE}>Pie Chart</SelectItem>
                  <SelectItem value={ChartType.SCATTER}>Scatter Chart</SelectItem>
                  <SelectItem value={ChartType.TABLE}>Table</SelectItem>
                  <SelectItem value={ChartType.HEATMAP}>Heatmap</SelectItem>
                  <SelectItem value={ChartType.TREEMAP}>Treemap</SelectItem>
                  <SelectItem value={ChartType.WATERFALL}>Waterfall</SelectItem>
                  <SelectItem value={ChartType.BOX_PLOT}>Box Plot</SelectItem>
                  <SelectItem value={ChartType.SANKEY}>Sankey Diagram</SelectItem>
                  <SelectItem value={ChartType.SUNBURST}>Sunburst</SelectItem>
                  <SelectItem value={ChartType.GANTT}>Gantt Chart</SelectItem>
                  <SelectItem value={ChartType.MAP_CHOROPLETH}>Choropleth Map</SelectItem>
                  <SelectItem value={ChartType.MAP_POINT}>Point Map</SelectItem>
                  <SelectItem value={ChartType.MAP_HEAT}>Heat Map</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={config.title || ''}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                placeholder="Chart title"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={config.description || ''}
                onChange={(e) => setConfig({ ...config, description: e.target.value })}
                placeholder="Chart description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Width (px)</Label>
                <Input
                  type="number"
                  value={config.width || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      width: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="Auto"
                />
              </div>
              <div className="space-y-2">
                <Label>Height (px)</Label>
                <Input
                  type="number"
                  value={config.height || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      height: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  placeholder="400"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            {config.type === ChartType.PIE ? (
              <>
                <div className="space-y-2">
                  <Label>Category Field</Label>
                  <Select
                    value={config.categoryField || ''}
                    onValueChange={(value) =>
                      setConfig({ ...config, categoryField: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Value Field</Label>
                  <Select
                    value={config.valueField || ''}
                    onValueChange={(value) =>
                      setConfig({ ...config, valueField: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select value field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>X-Axis Field</Label>
                  <Select
                    value={config.xAxis?.field || ''}
                    onValueChange={(value) =>
                      handleXAxisChange({ field: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select X-axis field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>X-Axis Label</Label>
                  <Input
                    value={config.xAxis?.label || ''}
                    onChange={(e) => handleXAxisChange({ label: e.target.value })}
                    placeholder="X-axis label"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Y-Axis Field</Label>
                  <Select
                    value={config.yAxis?.field || ''}
                    onValueChange={(value) =>
                      handleYAxisChange({ field: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Y-axis field" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Y-Axis Label</Label>
                  <Input
                    value={config.yAxis?.label || ''}
                    onChange={(e) => handleYAxisChange({ label: e.target.value })}
                    placeholder="Y-axis label"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Data Series</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddSeries}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Series
                    </Button>
                  </div>

                  {config.series.map((series, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Series {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSeries(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Field</Label>
                          <Select
                            value={series.field}
                            onValueChange={(value) =>
                              handleSeriesChange(index, { field: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableFields.map((field) => (
                                <SelectItem key={field} value={field}>
                                  {field}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Label</Label>
                          <Input
                            value={series.label || ''}
                            onChange={(e) =>
                              handleSeriesChange(index, { label: e.target.value })
                            }
                            placeholder={series.field}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="styling" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showGrid"
                checked={config.grid?.show !== false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    grid: { ...config.grid, show: checked as boolean },
                  })
                }
              />
              <Label htmlFor="showGrid">Show Grid</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="showLegend"
                checked={config.legend?.show !== false}
                onCheckedChange={(checked) =>
                  setConfig({
                    ...config,
                    legend: { ...config.legend, show: checked as boolean },
                  })
                }
              />
              <Label htmlFor="showLegend">Show Legend</Label>
            </div>

            {config.legend?.show !== false && (
              <div className="space-y-2">
                <Label>Legend Position</Label>
                <Select
                  value={config.legend?.position || 'top'}
                  onValueChange={(value: 'top' | 'bottom' | 'left' | 'right') =>
                    setConfig({
                      ...config,
                      legend: { ...config.legend, position: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="animation"
                checked={config.animation !== false}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, animation: checked as boolean })
                }
              />
              <Label htmlFor="animation">Enable Animation</Label>
            </div>

            {(config.type === ChartType.BAR ||
              config.type === ChartType.COLUMN ||
              config.type === ChartType.AREA) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="stacked"
                  checked={config.stacked || false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, stacked: checked as boolean })
                  }
                />
                <Label htmlFor="stacked">Stacked</Label>
              </div>
            )}

            {(config.type === ChartType.LINE || config.type === ChartType.AREA) && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smooth"
                  checked={config.smooth || false}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, smooth: checked as boolean })
                  }
                />
                <Label htmlFor="smooth">Smooth Lines</Label>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Chart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


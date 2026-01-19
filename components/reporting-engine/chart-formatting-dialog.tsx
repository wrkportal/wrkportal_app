'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Type, 
  Palette, 
  Layout, 
  BarChart3, 
  Info,
  RotateCw,
  Eye,
  EyeOff,
  X,
  GripVertical
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { ChartFormatting, DEFAULT_FORMATTING } from '@/types/chart-formatting'
import { DEFAULT_FORMATTING as DEFAULT } from '@/types/chart-formatting'

interface ChartFormattingDialogProps {
  open: boolean
  onClose: () => void
  visualization: any
  onFormattingChange: (formatting: ChartFormatting) => void
  onSave?: (formatting: ChartFormatting) => void | Promise<void> // Optional save handler
}

export function ChartFormattingDialog({ 
  open, 
  onClose, 
  visualization, 
  onFormattingChange,
  onSave
}: ChartFormattingDialogProps) {
  const { toast } = useToast()
  const [formatting, setFormatting] = useState<ChartFormatting>(DEFAULT)
  const [isInitialized, setIsInitialized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && visualization) {
      // Load existing formatting or use defaults
      const config = typeof visualization.config === 'string'
        ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
        : (visualization.config || {})
      
      const existingFormatting = config.formatting || {}
      const loadedFormatting = {
        ...DEFAULT,
        ...existingFormatting,
        // Deep merge nested objects
        title: { ...DEFAULT.title, ...existingFormatting.title },
        xAxis: { ...DEFAULT.xAxis, ...existingFormatting.xAxis },
        yAxis: { ...DEFAULT.yAxis, ...existingFormatting.yAxis },
        chartArea: { ...DEFAULT.chartArea, ...existingFormatting.chartArea },
        dataSeries: { ...DEFAULT.dataSeries, ...existingFormatting.dataSeries },
        legend: { ...DEFAULT.legend, ...existingFormatting.legend },
        dataLabels: { ...DEFAULT.dataLabels, ...existingFormatting.dataLabels },
        tooltip: { ...DEFAULT.tooltip, ...existingFormatting.tooltip },
      }
      setFormatting(loadedFormatting)
      setIsInitialized(true)
    } else if (!open) {
      setIsInitialized(false)
    }
  }, [open, visualization])
  
  // Apply formatting changes in real-time (with debouncing)
  useEffect(() => {
    if (!open || !isInitialized) return
    
    // Debounce the updates to avoid too many re-renders
    const timeoutId = setTimeout(() => {
      onFormattingChange(formatting)
    }, 150) // 150ms debounce for smooth real-time updates
    
    return () => clearTimeout(timeoutId)
  }, [formatting, open, isInitialized])

  const updateFormatting = (path: string[], value: any) => {
    setFormatting(prev => {
      const newFormatting = { ...prev }
      let current: any = newFormatting
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {}
        }
        current[path[i]] = { ...current[path[i]] }
        current = current[path[i]]
      }
      
      current[path[path.length - 1]] = value
      return newFormatting
    })
  }

  const handleSave = async () => {
    onFormattingChange(formatting)
    if (onSave) {
      await onSave(formatting)
    }
    onClose()
  }

  const handleReset = () => {
    setFormatting(DEFAULT)
    toast({
      title: 'Reset',
      description: 'Formatting reset to defaults',
    })
  }

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (dialogRef.current) {
      const rect = dialogRef.current.getBoundingClientRect()
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2
      setDragStart({
        x: e.clientX - (centerX + position.x),
        y: e.clientY - (centerY + position.y),
      })
      setIsDragging(true)
      e.preventDefault()
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const centerX = window.innerWidth / 2
        const centerY = window.innerHeight / 2
        const newX = e.clientX - centerX - dragStart.x
        const newY = e.clientY - centerY - dragStart.y
        setPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 })
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        {/* Custom overlay without blur - allows seeing chart changes in real-time */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/10 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          ref={dialogRef}
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl max-h-[90vh] gap-4 border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 rounded-lg overflow-y-auto"
          style={{
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
            cursor: isDragging ? 'grabbing' : 'default',
          }}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <div 
              className="flex items-center gap-2 cursor-move select-none"
              onMouseDown={handleMouseDown}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 flex-1">
                <Palette className="h-5 w-5" />
                Format Chart - {visualization?.name}
              </DialogPrimitive.Title>
            </div>
            <DialogPrimitive.Description className="text-sm text-muted-foreground">
              Customize all aspects of your chart appearance
            </DialogPrimitive.Description>
          </div>

        <Tabs defaultValue="title" className="w-full">
          <TabsList className={`grid w-full ${
            visualization?.type === 'kpi' ? 'grid-cols-5' : 
            visualization?.type === 'text' ? 'grid-cols-3' : 
            'grid-cols-8'
          }`}>
            {visualization?.type === 'text' ? (
              <>
                <TabsTrigger value="text" className="text-xs">
                  <Type className="h-4 w-4 mr-1" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-xs">
                  <Layout className="h-4 w-4 mr-1" />
                  Chart
                </TabsTrigger>
                <TabsTrigger value="labels" className="text-xs">
                  Labels
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="title" className="text-xs">
                  <Type className="h-4 w-4 mr-1" />
                  Title
                </TabsTrigger>
                {visualization?.type !== 'kpi' && (
                  <TabsTrigger value="xaxis" className="text-xs">
                    X-Axis
                  </TabsTrigger>
                )}
                <TabsTrigger value="yaxis" className="text-xs">
                  {visualization?.type === 'kpi' ? 'Value' : 'Y-Axis'}
                </TabsTrigger>
                <TabsTrigger value="chart" className="text-xs">
                  <Layout className="h-4 w-4 mr-1" />
                  Chart
                </TabsTrigger>
                {visualization?.type !== 'kpi' && (
                  <TabsTrigger value="series" className="text-xs">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Series
                  </TabsTrigger>
                )}
                {visualization?.type !== 'kpi' && (
                  <TabsTrigger value="legend" className="text-xs">
                    Legend
                  </TabsTrigger>
                )}
                <TabsTrigger value="labels" className="text-xs">
                  Labels
                </TabsTrigger>
                <TabsTrigger value="tooltip" className="text-xs">
                  <Info className="h-4 w-4 mr-1" />
                  Tooltip
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Title Tab */}
          <TabsContent value="title" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show Title</Label>
                <Switch
                  checked={formatting.title?.visible || false}
                  onCheckedChange={(checked) => 
                    updateFormatting(['title', 'visible'], checked)
                  }
                />
              </div>

              {formatting.title?.visible && (
                <>
                  <div>
                    <Label>Title Text</Label>
                    <Input
                      value={formatting.title?.text || ''}
                      onChange={(e) => 
                        updateFormatting(['title', 'text'], e.target.value)
                      }
                      placeholder="Chart Title"
                    />
                  </div>

                  <FontEditor
                    label="Title Font"
                    font={formatting.title?.font || DEFAULT.title!.font}
                    onChange={(font) => updateFormatting(['title', 'font'], font)}
                  />

                  <div>
                    <Label>Title Position</Label>
                    <Select
                      value={formatting.title?.position || 'top'}
                      onValueChange={(value: any) => 
                        updateFormatting(['title', 'position'], value)
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
                        <SelectItem value="center">Center</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* X-Axis Tab */}
          <TabsContent value="xaxis" className="space-y-2 mt-3">
            <AxisFormattingEditor
              axis={formatting.xAxis || DEFAULT.xAxis!}
              onChange={(axis) => updateFormatting(['xAxis'], axis)}
            />
          </TabsContent>

          {/* Y-Axis Tab */}
          <TabsContent value="yaxis" className="space-y-2 mt-3">
            <AxisFormattingEditor
              axis={formatting.yAxis || DEFAULT.yAxis!}
              onChange={(axis) => updateFormatting(['yAxis'], axis)}
              isYAxis={true}
            />
          </TabsContent>

          {/* Chart Area Tab */}
          <TabsContent value="chart" className="space-y-2 mt-3">
            <ChartAreaFormattingEditor
              chartArea={formatting.chartArea || DEFAULT.chartArea!}
              onChange={(chartArea) => updateFormatting(['chartArea'], chartArea)}
            />
          </TabsContent>

          {/* Data Series Tab */}
          <TabsContent value="series" className="space-y-4 mt-4">
            <DataSeriesFormattingEditor
              dataSeries={formatting.dataSeries || DEFAULT.dataSeries!}
              onChange={(dataSeries) => updateFormatting(['dataSeries'], dataSeries)}
            />
          </TabsContent>

          {/* Legend Tab */}
          <TabsContent value="legend" className="space-y-4 mt-4">
            <LegendFormattingEditor
              legend={formatting.legend || DEFAULT.legend!}
              onChange={(legend) => updateFormatting(['legend'], legend)}
            />
          </TabsContent>

          {/* Data Labels Tab */}
          <TabsContent value="labels" className="space-y-4 mt-4">
            <DataLabelFormattingEditor
              dataLabels={formatting.dataLabels || DEFAULT.dataLabels!}
              onChange={(dataLabels) => updateFormatting(['dataLabels'], dataLabels)}
            />
          </TabsContent>

          {/* Tooltip Tab */}
          <TabsContent value="tooltip" className="space-y-4 mt-4">
            <TooltipFormattingEditor
              tooltip={formatting.tooltip || DEFAULT.tooltip!}
              onChange={(tooltip) => updateFormatting(['tooltip'], tooltip)}
            />
          </TabsContent>

        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply Formatting
            </Button>
          </div>
        </div>
        <DialogPrimitive.Close className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-card shadow-sm">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}

// Sub-components for each formatting section
function FontEditor({ 
  label, 
  font, 
  onChange 
}: { 
  label: string
  font: any
  onChange: (font: any) => void 
}) {
  return (
    <div className="space-y-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Font Family</Label>
          <Select
            value={font.family}
            onValueChange={(value) => onChange({ ...font, family: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Inter, sans-serif">Inter</SelectItem>
              <SelectItem value="Arial, sans-serif">Arial</SelectItem>
              <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
              <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
              <SelectItem value="Georgia, serif">Georgia</SelectItem>
              <SelectItem value="Courier New, monospace">Courier New</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Font Size</Label>
          <Input
            type="number"
            min="8"
            max="72"
            value={font.size}
            onChange={(e) => onChange({ ...font, size: parseInt(e.target.value) || 12 })}
          />
        </div>
        <div>
          <Label className="text-xs">Font Weight</Label>
          <Select
            value={String(font.weight)}
            onValueChange={(value) => onChange({ ...font, weight: value === 'normal' || value === 'bold' || value === 'lighter' ? value : parseInt(value) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="lighter">Light</SelectItem>
              <SelectItem value="600">Semi-bold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Font Style</Label>
          <Select
            value={font.style}
            onValueChange={(value) => onChange({ ...font, style: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="italic">Italic</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs">Font Color</Label>
        <Input
          type="color"
          value={font.color}
          onChange={(e) => onChange({ ...font, color: e.target.value })}
          className="h-10"
        />
      </div>
    </div>
  )
}

function AxisFormattingEditor({ 
  axis, 
  onChange, 
  isYAxis = false 
}: { 
  axis: any
  onChange: (axis: any) => void
  isYAxis?: boolean 
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs mb-1">{isYAxis ? 'Y-Axis' : 'X-Axis'} Label Text</Label>
        <Input
          value={axis.customLabel || ''}
          onChange={(e) => onChange({ ...axis, customLabel: e.target.value })}
          placeholder={isYAxis ? 'Enter Y-axis label' : 'Enter X-axis label'}
          className="h-8 text-sm"
        />
      </div>

      <div>
        <Label className="text-xs mb-1">Label Distance (px)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={axis.labelOffset !== undefined ? axis.labelOffset : 0}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0
              onChange({ ...axis, labelOffset: value })
            }}
            min={-100}
            max={100}
            step={5}
            className="h-8 text-sm w-24"
          />
          <span className="text-xs text-muted-foreground">
            {axis.labelOffset !== undefined ? axis.labelOffset : 0}px
          </span>
        </div>
      </div>

      <FontEditor
        label="Axis Label Font"
        font={axis.labelFont}
        onChange={(font) => onChange({ ...axis, labelFont: font })}
      />

      <div>
        <Label className="text-xs mb-1">Label Rotation</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={axis.labelRotation}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 0
              const clampedValue = Math.max(-90, Math.min(90, value))
              onChange({ ...axis, labelRotation: clampedValue })
            }}
            min={-90}
            max={90}
            step={15}
            className="h-8 text-sm w-24"
          />
          <span className="text-xs text-muted-foreground">{axis.labelRotation}°</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Grid Lines</Label>
          <Switch
            checked={axis.gridLines.visible}
            onCheckedChange={(checked) => 
              onChange({ ...axis, gridLines: { ...axis.gridLines, visible: checked } })
            }
            className="scale-75"
          />
        </div>
        {axis.gridLines.visible && (
          <div className="space-y-1.5 ml-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs w-20">Style</Label>
              <Select
                value={axis.gridLines.style}
                onValueChange={(value) => 
                  onChange({ ...axis, gridLines: { ...axis.gridLines, style: value } })
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs w-20">Color</Label>
              <Input
                type="color"
                value={axis.gridLines.color}
                onChange={(e) => 
                  onChange({ ...axis, gridLines: { ...axis.gridLines, color: e.target.value } })
                }
                className="h-7 w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs w-20">Width</Label>
              <Input
                type="number"
                value={axis.gridLines.width}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  const clampedValue = Math.max(1, Math.min(5, value))
                  onChange({ ...axis, gridLines: { ...axis.gridLines, width: clampedValue } })
                }}
                min={1}
                max={5}
                step={1}
                className="h-7 text-sm w-20"
              />
              <span className="text-xs text-muted-foreground">{axis.gridLines.width}px</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Axis Line</Label>
          <Switch
            checked={axis.axisLine.visible}
            onCheckedChange={(checked) => 
              onChange({ ...axis, axisLine: { ...axis.axisLine, visible: checked } })
            }
            className="scale-75"
          />
        </div>
        {axis.axisLine.visible && (
          <div className="space-y-1.5 ml-2">
            <div className="flex items-center gap-2">
              <Label className="text-xs w-20">Color</Label>
              <Input
                type="color"
                value={axis.axisLine.color}
                onChange={(e) => 
                  onChange({ ...axis, axisLine: { ...axis.axisLine, color: e.target.value } })
                }
                className="h-7 w-16"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs w-20">Width</Label>
              <Input
                type="number"
                value={axis.axisLine.width}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1
                  const clampedValue = Math.max(1, Math.min(5, value))
                  onChange({ ...axis, axisLine: { ...axis.axisLine, width: clampedValue } })
                }}
                min={1}
                max={5}
                step={1}
                className="h-7 text-sm w-20"
              />
              <span className="text-xs text-muted-foreground">{axis.axisLine.width}px</span>
            </div>
          </div>
        )}
      </div>

      <Separator />

      <NumberFormatEditor
        numberFormat={axis.numberFormat}
        onChange={(numberFormat) => onChange({ ...axis, numberFormat })}
      />

      {isYAxis && (
        <>
          <div>
            <Label>Scale Type</Label>
            <Select
              value={axis.scaleType || 'linear'}
              onValueChange={(value) => onChange({ ...axis, scaleType: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="logarithmic">Logarithmic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div>
            <Label className="text-xs mb-1">Value Range</Label>
            <div className="space-y-2">
              <div>
                <Label className="text-xs mb-1">Starting Range (Min)</Label>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={typeof axis.min === 'string' ? 'auto' : 'manual'}
                    onValueChange={(value) => {
                      if (value === 'auto') {
                        onChange({ ...axis, min: 'auto' })
                      } else {
                        onChange({ ...axis, min: typeof axis.min === 'number' ? axis.min : 0 })
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  {typeof axis.min === 'number' && (
                    <Input
                      type="number"
                      value={axis.min}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        onChange({ ...axis, min: value })
                      }}
                      step="any"
                      className="h-7 text-sm flex-1"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1">Maximum Value</Label>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={typeof axis.max === 'string' ? 'auto' : 'manual'}
                    onValueChange={(value) => {
                      if (value === 'auto') {
                        onChange({ ...axis, max: 'auto' })
                      } else {
                        onChange({ ...axis, max: typeof axis.max === 'number' ? axis.max : 100 })
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  {typeof axis.max === 'number' && (
                    <Input
                      type="number"
                      value={axis.max}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 100
                        onChange({ ...axis, max: value })
                      }}
                      step="any"
                      className="h-7 text-sm flex-1"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs mb-1">Gap Between Values</Label>
                <div className="flex items-center gap-1.5">
                  <Select
                    value={typeof axis.interval === 'string' ? 'auto' : 'manual'}
                    onValueChange={(value) => {
                      if (value === 'auto') {
                        onChange({ ...axis, interval: 'auto' })
                      } else {
                        onChange({ ...axis, interval: typeof axis.interval === 'number' ? axis.interval : 10 })
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                  {typeof axis.interval === 'number' && (
                    <Input
                      type="number"
                      value={axis.interval}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 10
                        const clampedValue = Math.max(0.1, value)
                        onChange({ ...axis, interval: clampedValue })
                      }}
                      min={0.1}
                      step="any"
                      className="h-7 text-sm flex-1"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NumberFormatEditor({ 
  numberFormat, 
  onChange 
}: { 
  numberFormat: any
  onChange: (numberFormat: any) => void 
}) {
  return (
    <div className="space-y-3">
      <Label>Number Format</Label>
      <Select
        value={numberFormat.type}
        onValueChange={(value) => onChange({ ...numberFormat, type: value })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto</SelectItem>
          <SelectItem value="number">Number</SelectItem>
          <SelectItem value="currency">Currency</SelectItem>
          <SelectItem value="percentage">Percentage</SelectItem>
          <SelectItem value="date">Date</SelectItem>
          <SelectItem value="custom">Custom</SelectItem>
        </SelectContent>
      </Select>

      {numberFormat.type === 'number' && (
        <div>
          <Label className="text-xs">Decimal Places</Label>
          <Input
            type="number"
            min="0"
            max="10"
            value={numberFormat.decimalPlaces || 0}
            onChange={(e) => 
              onChange({ ...numberFormat, decimalPlaces: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      )}

      {numberFormat.type === 'currency' && (
        <>
          <div>
            <Label className="text-xs">Currency Symbol</Label>
            <Input
              value={numberFormat.currencySymbol || '$'}
              onChange={(e) => 
                onChange({ ...numberFormat, currencySymbol: e.target.value })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Decimal Places</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={numberFormat.decimalPlaces || 2}
              onChange={(e) => 
                onChange({ ...numberFormat, decimalPlaces: parseInt(e.target.value) || 2 })
              }
            />
          </div>
        </>
      )}

      {numberFormat.type === 'custom' && (
        <div>
          <Label className="text-xs">Custom Format</Label>
          <Input
            value={numberFormat.format || ''}
            onChange={(e) => onChange({ ...numberFormat, format: e.target.value })}
            placeholder="e.g., #,##0.00"
          />
        </div>
      )}
    </div>
  )
}

function ChartAreaFormattingEditor({ 
  chartArea, 
  onChange 
}: { 
  chartArea: any
  onChange: (chartArea: any) => void 
}) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs mb-1">Chart Size</Label>
        <div className="space-y-2">
          <div>
            <Label className="text-xs mb-1">Width</Label>
            <div className="flex items-center gap-1.5">
              <Select
                value={typeof chartArea.width === 'string' ? 'auto' : 'manual'}
                onValueChange={(value) => {
                  if (value === 'auto') {
                    onChange({ ...chartArea, width: 'auto' })
                  } else {
                    onChange({ ...chartArea, width: typeof chartArea.width === 'number' ? chartArea.width : 800 })
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              {typeof chartArea.width === 'number' && (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    type="number"
                    value={chartArea.width}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 800
                      const clampedValue = Math.max(200, Math.min(2000, value))
                      onChange({ ...chartArea, width: clampedValue })
                    }}
                    min={200}
                    max={2000}
                    step={50}
                    className="h-7 text-sm flex-1"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1">Height</Label>
            <div className="flex items-center gap-1.5">
              <Select
                value={typeof chartArea.height === 'string' ? 'auto' : 'manual'}
                onValueChange={(value) => {
                  if (value === 'auto') {
                    onChange({ ...chartArea, height: 'auto' })
                  } else {
                    onChange({ ...chartArea, height: typeof chartArea.height === 'number' ? chartArea.height : 300 })
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              {typeof chartArea.height === 'number' && (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input
                    type="number"
                    value={chartArea.height}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 300
                      const clampedValue = Math.max(200, Math.min(1000, value))
                      onChange({ ...chartArea, height: clampedValue })
                    }}
                    min={200}
                    max={1000}
                    step={50}
                    className="h-7 text-sm flex-1"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-xs mb-1">Chart Background Color</Label>
        <Input
          type="color"
          value={chartArea.backgroundColor === 'transparent' ? '#ffffff' : chartArea.backgroundColor}
          onChange={(e) => onChange({ ...chartArea, backgroundColor: e.target.value })}
          className="h-8 w-full"
        />
      </div>

      <div>
        <Label className="text-xs mb-1">Plot Area Background Color</Label>
        <Input
          type="color"
          value={chartArea.plotAreaBackground === 'transparent' ? '#ffffff' : chartArea.plotAreaBackground}
          onChange={(e) => onChange({ ...chartArea, plotAreaBackground: e.target.value })}
          className="h-8 w-full"
        />
      </div>

      <div>
        <Label>Padding</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div>
            <Label className="text-xs">Top</Label>
            <Input
              type="number"
              value={chartArea.padding.top}
              onChange={(e) => 
                onChange({ 
                  ...chartArea, 
                  padding: { ...chartArea.padding, top: parseInt(e.target.value) || 0 } 
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Bottom</Label>
            <Input
              type="number"
              value={chartArea.padding.bottom}
              onChange={(e) => 
                onChange({ 
                  ...chartArea, 
                  padding: { ...chartArea.padding, bottom: parseInt(e.target.value) || 0 } 
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Left</Label>
            <Input
              type="number"
              value={chartArea.padding.left}
              onChange={(e) => 
                onChange({ 
                  ...chartArea, 
                  padding: { ...chartArea.padding, left: parseInt(e.target.value) || 0 } 
                })
              }
            />
          </div>
          <div>
            <Label className="text-xs">Right</Label>
            <Input
              type="number"
              value={chartArea.padding.right}
              onChange={(e) => 
                onChange({ 
                  ...chartArea, 
                  padding: { ...chartArea.padding, right: parseInt(e.target.value) || 0 } 
                })
              }
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Border</Label>
        <div className="space-y-3 mt-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show Border</Label>
            <Switch
              checked={chartArea.border.visible}
              onCheckedChange={(checked) => 
                onChange({ ...chartArea, border: { ...chartArea.border, visible: checked } })
              }
            />
          </div>
          {chartArea.border.visible && (
            <>
              <div>
                <Label className="text-xs">Border Color</Label>
                <Input
                  type="color"
                  value={chartArea.border.color}
                  onChange={(e) => 
                    onChange({ ...chartArea, border: { ...chartArea.border, color: e.target.value } })
                  }
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs">Border Width</Label>
                <Input
                  type="number"
                  value={chartArea.border.width}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1
                    const clampedValue = Math.max(1, Math.min(10, value))
                    onChange({ ...chartArea, border: { ...chartArea.border, width: clampedValue } })
                  }}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">{chartArea.border.width}px</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function DataSeriesFormattingEditor({ 
  dataSeries, 
  onChange 
}: { 
  dataSeries: any
  onChange: (dataSeries: any) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Color Palette</Label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {dataSeries.colors.map((color: string, index: number) => (
            <div key={index} className="space-y-1">
              <Label className="text-xs">Series {index + 1}</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => {
                  const newColors = [...dataSeries.colors]
                  newColors[index] = e.target.value
                  onChange({ ...dataSeries, colors: newColors })
                }}
                className="h-10"
              />
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <Label>Line Style</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Line Style</Label>
            <Select
              value={dataSeries.lineStyle.style}
              onValueChange={(value) => 
                onChange({ ...dataSeries, lineStyle: { ...dataSeries.lineStyle, style: value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid</SelectItem>
                <SelectItem value="dashed">Dashed</SelectItem>
                <SelectItem value="dotted">Dotted</SelectItem>
                <SelectItem value="dashDot">Dash-Dot</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Line Width</Label>
            <Input
              type="number"
              value={dataSeries.lineStyle.width}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 1
                const clampedValue = Math.max(1, Math.min(10, value))
                onChange({ ...dataSeries, lineStyle: { ...dataSeries.lineStyle, width: clampedValue } })
              }}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-1">{dataSeries.lineStyle.width}px</p>
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <Label>Marker Style</Label>
        <div className="space-y-3 mt-2">
          <div>
            <Label className="text-xs">Marker Type</Label>
            <Select
              value={dataSeries.markerStyle.type}
              onValueChange={(value) => 
                onChange({ ...dataSeries, markerStyle: { ...dataSeries.markerStyle, type: value } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="circle">Circle</SelectItem>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="triangle">Triangle</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dataSeries.markerStyle.type !== 'none' && (
            <div>
              <Label className="text-xs">Marker Size</Label>
              <Input
                type="number"
                value={dataSeries.markerStyle.size}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 4
                  const clampedValue = Math.max(4, Math.min(20, value))
                  onChange({ ...dataSeries, markerStyle: { ...dataSeries.markerStyle, size: clampedValue } })
                }}
                min={4}
                max={20}
                step={1}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">{dataSeries.markerStyle.size}px</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      <div>
        <Label>Fill Opacity</Label>
        <Input
          type="number"
          value={Math.round(dataSeries.fillOpacity * 100)}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 0
            const clampedValue = Math.max(0, Math.min(100, value))
            onChange({ ...dataSeries, fillOpacity: clampedValue / 100 })
          }}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground mt-1">{Math.round(dataSeries.fillOpacity * 100)}%</p>
      </div>
    </div>
  )
}

function LegendFormattingEditor({ 
  legend, 
  onChange 
}: { 
  legend: any
  onChange: (legend: any) => void 
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Legend Position</Label>
        <Select
          value={legend.position}
          onValueChange={(value) => onChange({ ...legend, position: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="right">Right</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {legend.position !== 'none' && (
        <>
          <FontEditor
            label="Legend Font"
            font={legend.font}
            onChange={(font) => onChange({ ...legend, font })}
          />

          <div>
            <Label>Legend Layout</Label>
            <Select
              value={legend.layout}
              onValueChange={(value) => onChange({ ...legend, layout: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal</SelectItem>
                <SelectItem value="vertical">Vertical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Legend Background Color</Label>
            <Input
              type="color"
              value={legend.backgroundColor === 'transparent' ? '#ffffff' : legend.backgroundColor}
              onChange={(e) => onChange({ ...legend, backgroundColor: e.target.value })}
              className="h-10"
            />
          </div>
        </>
      )}
    </div>
  )
}

function DataLabelFormattingEditor({ 
  dataLabels, 
  onChange 
}: { 
  dataLabels: any
  onChange: (dataLabels: any) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show Data Labels</Label>
        <Switch
          checked={dataLabels.visible}
          onCheckedChange={(checked) => onChange({ ...dataLabels, visible: checked })}
        />
      </div>

      {dataLabels.visible && (
        <>
          <div>
            <Label>Label Position</Label>
            <Select
              value={dataLabels.position}
              onValueChange={(value) => onChange({ ...dataLabels, position: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="insideEnd">Inside End</SelectItem>
                <SelectItem value="insideBase">Inside Base</SelectItem>
                <SelectItem value="outsideEnd">Outside End</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FontEditor
            label="Label Font"
            font={dataLabels.font}
            onChange={(font) => onChange({ ...dataLabels, font })}
          />

          <div>
            <Label>Label Format</Label>
            <Select
              value={dataLabels.format}
              onValueChange={(value) => onChange({ ...dataLabels, format: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="value">Value</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Decimal Places</Label>
            <Input
              type="number"
              min="0"
              max="10"
              value={dataLabels.decimalPlaces}
              onChange={(e) => 
                onChange({ ...dataLabels, decimalPlaces: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}

function TooltipFormattingEditor({ 
  tooltip, 
  onChange 
}: { 
  tooltip: any
  onChange: (tooltip: any) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Show Tooltip</Label>
        <Switch
          checked={tooltip.visible}
          onCheckedChange={(checked) => onChange({ ...tooltip, visible: checked })}
        />
      </div>

      {tooltip.visible && (
        <>
          <div>
            <Label>Tooltip Background Color</Label>
            <Input
              type="color"
              value={tooltip.backgroundColor}
              onChange={(e) => onChange({ ...tooltip, backgroundColor: e.target.value })}
              className="h-10"
            />
          </div>

          <div>
            <Label>Tooltip Format</Label>
            <Input
              value={tooltip.format}
              onChange={(e) => onChange({ ...tooltip, format: e.target.value })}
              placeholder="default"
            />
          </div>
        </>
      )}
    </div>
  )
}


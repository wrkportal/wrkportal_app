'use client'

import { useState, useCallback, useEffect } from 'react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Save, Trash2, Edit, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface SalesDashboardWidget {
  id: string
  type: 'METRIC' | 'CHART' | 'TABLE' | 'LIST' | 'KPI' | 'FUNNEL' | 'TIMELINE'
  title: string
  config: {
    dataSource?: string
    metric?: string
    chartType?: 'bar' | 'line' | 'pie' | 'area'
    filters?: Record<string, any>
    dateRange?: {
      start: string
      end: string
    }
    [key: string]: any
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

interface SalesDashboardBuilderProps {
  dashboardId?: string
  initialWidgets?: SalesDashboardWidget[]
  onSave?: (widgets: SalesDashboardWidget[], layout: Layouts) => void
}

const WIDGET_TYPES = [
  { value: 'METRIC', label: 'Metric', defaultSize: { w: 3, h: 2 } },
  { value: 'KPI', label: 'KPI Card', defaultSize: { w: 3, h: 3 } },
  { value: 'CHART', label: 'Chart', defaultSize: { w: 6, h: 4 } },
  { value: 'FUNNEL', label: 'Funnel', defaultSize: { w: 6, h: 5 } },
  { value: 'TABLE', label: 'Table', defaultSize: { w: 6, h: 5 } },
  { value: 'LIST', label: 'List', defaultSize: { w: 6, h: 4 } },
]

const METRIC_OPTIONS = [
  { value: 'pipeline_value', label: 'Pipeline Value' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'deals_won', label: 'Deals Won' },
  { value: 'deals_lost', label: 'Deals Lost' },
  { value: 'win_rate', label: 'Win Rate' },
  { value: 'avg_deal_size', label: 'Average Deal Size' },
  { value: 'sales_cycle', label: 'Sales Cycle (Days)' },
  { value: 'leads', label: 'Total Leads' },
  { value: 'opportunities', label: 'Total Opportunities' },
]

export function SalesDashboardBuilder({
  dashboardId,
  initialWidgets = [],
  onSave,
}: SalesDashboardBuilderProps) {
  const { toast } = useToast()
  const [widgets, setWidgets] = useState<SalesDashboardWidget[]>(initialWidgets)
  const [layouts, setLayouts] = useState<Layouts>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
  })
  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
  const [newWidgetType, setNewWidgetType] = useState<string>('METRIC')
  const [newWidgetTitle, setNewWidgetTitle] = useState('')
  const [newWidgetMetric, setNewWidgetMetric] = useState('')

  useEffect(() => {
    if (initialWidgets.length > 0) {
      const initialLayouts: Layouts = {
        lg: [],
        md: [],
        sm: [],
        xs: [],
      }

      initialWidgets.forEach(widget => {
        const layoutItem = {
          i: widget.id,
          x: widget.position.x,
          y: widget.position.y,
          w: widget.position.w,
          h: widget.position.h,
        }
        initialLayouts.lg.push(layoutItem)
        initialLayouts.md.push(layoutItem)
        initialLayouts.sm.push(layoutItem)
        initialLayouts.xs.push(layoutItem)
      })

      setLayouts(initialLayouts)
      setWidgets(initialWidgets)
    }
  }, [initialWidgets])

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    
    // Update widget positions
    setWidgets(prev => prev.map(widget => {
      const lgLayout = allLayouts.lg.find(l => l.i === widget.id)
      if (lgLayout) {
        return {
          ...widget,
          position: {
            x: lgLayout.x,
            y: lgLayout.y,
            w: lgLayout.w,
            h: lgLayout.h,
          },
        }
      }
      return widget
    }))
  }, [])

  const handleAddWidget = () => {
    if (!newWidgetTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Widget title is required',
        variant: 'destructive',
      })
      return
    }

    const widgetType = newWidgetType as SalesDashboardWidget['type']
    const defaultSize = WIDGET_TYPES.find(w => w.value === newWidgetType)?.defaultSize || { w: 3, h: 2 }

    const newWidget: SalesDashboardWidget = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: newWidgetTitle,
      config: {
        metric: newWidgetMetric || undefined,
      },
      position: {
        x: 0,
        y: Infinity,
        w: defaultSize.w,
        h: defaultSize.h,
      },
    }

    setWidgets(prev => [...prev, newWidget])
    
    // Add to layouts
    const layoutItem = {
      i: newWidget.id,
      x: 0,
      y: Infinity,
      w: defaultSize.w,
      h: defaultSize.h,
    }

    setLayouts(prev => ({
      lg: [...prev.lg, layoutItem],
      md: [...prev.md, layoutItem],
      sm: [...prev.sm, layoutItem],
      xs: [...prev.xs, layoutItem],
    }))

    setNewWidgetTitle('')
    setNewWidgetMetric('')
    setAddWidgetDialogOpen(false)
  }

  const handleDeleteWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    setLayouts(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(breakpoint => {
        updated[breakpoint as keyof Layouts] = updated[breakpoint as keyof Layouts].filter(
          l => l.i !== widgetId
        )
      })
      return updated
    })
  }

  const handleSave = () => {
    if (onSave) {
      onSave(widgets, layouts)
    } else {
      toast({
        title: 'Save',
        description: 'Dashboard saved successfully',
      })
    }
  }

  const renderWidget = (widget: SalesDashboardWidget) => {
    switch (widget.type) {
      case 'METRIC':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$0</div>
              <p className="text-xs text-muted-foreground">No data</p>
            </CardContent>
          </Card>
        )
      case 'KPI':
        return (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">No data</p>
            </CardContent>
          </Card>
        )
      case 'CHART':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Chart placeholder
              </div>
            </CardContent>
          </Card>
        )
      case 'FUNNEL':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Funnel placeholder
              </div>
            </CardContent>
          </Card>
        )
      case 'TABLE':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                Table placeholder
              </div>
            </CardContent>
          </Card>
        )
      case 'LIST':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                List placeholder
              </div>
            </CardContent>
          </Card>
        )
      default:
        return (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{widget.title}</p>
            </CardContent>
          </Card>
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dashboard Builder</h3>
        <div className="flex gap-2">
          <Dialog open={addWidgetDialogOpen} onOpenChange={setAddWidgetDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Widget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Widget</DialogTitle>
                <DialogDescription>
                  Choose a widget type to add to your dashboard
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Widget Type</Label>
                  <Select value={newWidgetType} onValueChange={setNewWidgetType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WIDGET_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newWidgetTitle}
                    onChange={(e) => setNewWidgetTitle(e.target.value)}
                    placeholder="Widget title"
                  />
                </div>
                {(newWidgetType === 'METRIC' || newWidgetType === 'KPI') && (
                  <div>
                    <Label>Metric</Label>
                    <Select value={newWidgetMetric} onValueChange={setNewWidgetMetric}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select metric" />
                      </SelectTrigger>
                      <SelectContent>
                        {METRIC_OPTIONS.map(metric => (
                          <SelectItem key={metric.value} value={metric.value}>
                            {metric.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button onClick={handleAddWidget} className="w-full">
                  Add Widget
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Dashboard
          </Button>
        </div>
      </div>

      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4 }}
        rowHeight={60}
        isDraggable={true}
        isResizable={true}
      >
        {widgets.map(widget => (
          <div key={widget.id} className="relative group">
            {renderWidget(widget)}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  onClick={() => setEditingWidgetId(widget.id)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-destructive"
                  onClick={() => handleDeleteWidget(widget.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>

      {widgets.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <p className="text-muted-foreground">No widgets yet. Click "Add Widget" to get started.</p>
        </div>
      )}
    </div>
  )
}


'use client'

import { useState, useCallback, useEffect } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { ChartRenderer } from './charts'
import { ChartConfig, ChartDataPoint } from '@/lib/reporting-studio/chart-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Save, Eye, Trash2, Edit } from 'lucide-react'
import { ChartConfigDialog } from './chart-config-dialog'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

export interface DashboardWidget {
  id: string
  title: string
  chartConfig: ChartConfig
  data: ChartDataPoint[]
  layout: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
  }
}

interface DashboardBuilderProps {
  dashboardId?: string
  onSave?: (widgets: DashboardWidget[]) => void
  initialWidgets?: DashboardWidget[]
  availableFields?: string[]
}

export function DashboardBuilder({
  dashboardId,
  onSave,
  initialWidgets = [],
  availableFields = [],
}: DashboardBuilderProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets)
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({})
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(!onSave) // Preview mode by default if no save handler

  useEffect(() => {
    // Initialize layouts from widgets
    if (initialWidgets.length > 0) {
      const initialLayouts: { [key: string]: Layout[] } = {
        lg: [],
        md: [],
        sm: [],
        xs: [],
        xxs: [],
      }

      initialWidgets.forEach(widget => {
        Object.keys(initialLayouts).forEach(breakpoint => {
          initialLayouts[breakpoint].push({
            i: widget.id,
            ...widget.layout,
          })
        })
      })

      setLayouts(initialLayouts)
      setWidgets(initialWidgets)
    }
  }, [initialWidgets])

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts)
    
    // Update widget layouts
    setWidgets(prev => prev.map(widget => {
      const lgLayout = allLayouts.lg.find(l => l.i === widget.id)
      if (lgLayout) {
        return {
          ...widget,
          layout: {
            x: lgLayout.x,
            y: lgLayout.y,
            w: lgLayout.w,
            h: lgLayout.h,
            minW: widget.layout.minW,
            minH: widget.layout.minH,
            maxW: widget.layout.maxW,
            maxH: widget.layout.maxH,
          },
        }
      }
      return widget
    }))
  }, [])

  const handleAddWidget = (chartConfig: ChartConfig) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      title: chartConfig.title || 'New Chart',
      chartConfig,
      data: generateSampleData(chartConfig),
      layout: {
        x: 0,
        y: 0,
        w: 6,
        h: 4,
        minW: 3,
        minH: 3,
      },
    }

    setWidgets(prev => [...prev, newWidget])
    
    // Add to layouts
    const newLayout = {
      i: newWidget.id,
      x: 0,
      y: Infinity, // Add to bottom
      w: 6,
      h: 4,
      minW: 3,
      minH: 3,
    }

    setLayouts(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(breakpoint => {
        updated[breakpoint] = [...updated[breakpoint], { ...newLayout }]
      })
      return updated
    })

    setConfigDialogOpen(false)
  }

  const handleEditWidget = (widgetId: string, chartConfig: ChartConfig) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId 
        ? { ...w, chartConfig, title: chartConfig.title || w.title }
        : w
    ))
    setEditingWidgetId(null)
    setConfigDialogOpen(false)
  }

  const handleDeleteWidget = (widgetId: string) => {
    if (!confirm('Are you sure you want to delete this widget?')) return

    setWidgets(prev => prev.filter(w => w.id !== widgetId))
    setLayouts(prev => {
      const updated = { ...prev }
      Object.keys(updated).forEach(breakpoint => {
        updated[breakpoint] = updated[breakpoint].filter(l => l.i !== widgetId)
      })
      return updated
    })
  }

  const handleSaveClick = () => {
    if (onSave) {
      onSave(widgets)
    } else {
      console.log('Saving dashboard:', widgets)
      alert('Dashboard saved! (Note: Full save functionality will be integrated with API)')
    }
  }

  const generateSampleData = (config: ChartConfig): ChartDataPoint[] => {
    // In production, this would fetch actual data from the dataset
    if (config.type === 'PIE') {
      return [
        { category: 'A', value: 30 },
        { category: 'B', value: 25 },
        { category: 'C', value: 20 },
        { category: 'D', value: 15 },
        { category: 'E', value: 10 },
      ]
    }

    const categories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    return categories.map(cat => {
      const point: any = {}
      if (config.xAxis?.field) {
        point[config.xAxis.field] = cat
      }
      config.series?.forEach(series => {
        point[series.field] = Math.floor(Math.random() * 100) + 10
      })
      return point
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      {onSave && (
        <div className="border-b p-4 flex items-center justify-between bg-background">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">Dashboard Builder</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingWidgetId(null)
                    setConfigDialogOpen(true)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Widget
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingWidgetId ? 'Edit Widget' : 'Add Widget'}</DialogTitle>
                  <DialogDescription>
                    Configure your chart widget
                  </DialogDescription>
                </DialogHeader>
                <ChartConfigDialog
                  open={configDialogOpen}
                  onOpenChange={setConfigDialogOpen}
                  config={editingWidgetId ? widgets.find(w => w.id === editingWidgetId)?.chartConfig || null : null}
                  availableFields={availableFields}
                  onSave={(config) => {
                    if (editingWidgetId) {
                      handleEditWidget(editingWidgetId, config)
                    } else {
                      handleAddWidget(config)
                    }
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleSaveClick}>
              <Save className="h-4 w-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
        {widgets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    {onSave ? 'No widgets yet. Click "Add Widget" to get started.' : 'This dashboard has no widgets yet.'}
                  </p>
                  {onSave && (
                    <Button onClick={() => setConfigDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Widget
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            isDraggable={!previewMode && !!onSave}
            isResizable={!previewMode && !!onSave}
            draggableCancel=".chart-content"
          >
            {widgets.map(widget => (
              <div key={widget.id} className="bg-background rounded-lg shadow-sm border">
                {/* Widget Header */}
                <div className="flex items-center justify-between p-3 border-b">
                  <h3 className="font-semibold text-sm">{widget.title}</h3>
                  {!previewMode && onSave && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingWidgetId(widget.id)
                          setConfigDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWidget(widget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* Widget Content */}
                <div className="chart-content p-4 h-[calc(100%-3rem)] overflow-auto">
                  <ChartRenderer
                    config={widget.chartConfig}
                    data={widget.data}
                    showExport={false}
                  />
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  )
}

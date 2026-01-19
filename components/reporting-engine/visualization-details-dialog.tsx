'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  Calendar, 
  User, 
  Database,
  Settings,
  Tag,
  Filter
} from 'lucide-react'
import { format } from 'date-fns'

interface VisualizationDetailsDialogProps {
  open: boolean
  onClose: () => void
  visualization: any
}

export function VisualizationDetailsDialog({ open, onClose, visualization }: VisualizationDetailsDialogProps) {
  if (!visualization) return null

  const chartTypeIcons: Record<string, any> = {
    bar: BarChart3,
    line: BarChart3,
    pie: BarChart3,
    area: BarChart3,
    scatter: BarChart3,
    table: Database,
    kpi: BarChart3,
  }

  const ChartIcon = chartTypeIcons[visualization.type] || BarChart3
  const xAxisConfig = visualization.config?.xAxis || visualization.xAxis
  const yAxisConfig = visualization.config?.yAxis || visualization.yAxis

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
              <ChartIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">{visualization.name}</DialogTitle>
              <DialogDescription>
                {visualization.description || 'No description provided'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <Badge variant="secondary">{visualization.type?.toUpperCase() || 'UNKNOWN'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Functional Area</p>
                <Badge variant="outline">{visualization.functionalArea || 'N/A'}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Layout</p>
                <p className="text-sm font-medium">
                  {visualization.defaultWidth} × {visualization.defaultHeight} grid
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge variant={visualization.isPublic ? 'default' : 'secondary'}>
                  {visualization.isPublic ? 'Public' : 'Private'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Axis Configuration */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Chart Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">X-Axis (Categories)</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">
                    {xAxisConfig?.field || 'Not configured'}
                  </p>
                  {xAxisConfig?.label && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Label: {xAxisConfig.label}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Y-Axis (Values)</p>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="space-y-2">
                    {yAxisConfig?.fields && yAxisConfig.fields.length > 0 ? (
                      yAxisConfig.fields.map((field: string, idx: number) => (
                        <div key={field} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{field}</span>
                          <Badge variant="outline" className="text-xs">
                            {yAxisConfig.aggregation?.toUpperCase() || 'SUM'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Not configured</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Chart Filters */}
          {visualization.config?.filters && visualization.config.filters.length > 0 && (
            <>
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Chart Filters
                </h3>
                <div className="space-y-2">
                  {visualization.config.filters.map((filter: any, idx: number) => (
                    <div key={filter.id || idx} className="p-3 bg-muted rounded-lg border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{filter.field}</span>
                            <Badge variant="secondary" className="text-xs">
                              {filter.operator?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'equals'}
                            </Badge>
                          </div>
                          {filter.value !== null && filter.value !== undefined && filter.value !== '' && (
                            <div className="text-xs text-muted-foreground">
                              {Array.isArray(filter.value) 
                                ? `Values: ${filter.value.join(', ')}`
                                : `Value: ${filter.value}`
                              }
                            </div>
                          )}
                          {(filter.operator === 'is_null' || filter.operator === 'is_not_null') && (
                            <div className="text-xs text-muted-foreground">
                              No value required
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Metadata
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm">
                  {visualization.createdAt 
                    ? format(new Date(visualization.createdAt), 'PPp')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm">
                  {visualization.updatedAt 
                    ? format(new Date(visualization.updatedAt), 'PPp')
                    : 'N/A'}
                </p>
              </div>
              {visualization.createdBy && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Created By
                  </p>
                  <p className="text-sm">
                    {visualization.createdBy.name || visualization.createdBy.email || 'Unknown'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {visualization.tags && visualization.tags.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {visualization.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

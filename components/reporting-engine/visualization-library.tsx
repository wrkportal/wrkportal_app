'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  BarChart3,
  LineChart,
  PieChart,
  Table,
  Gauge,
  Map,
  Activity,
  Plus,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Search,
  Filter,
  Grid3x3,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface VisualizationLibraryProps {
  functionalArea: string
  onAddToDashboard?: (visualizationId: string, dashboardId: string) => void
  dashboards?: any[]
}

const CHART_ICONS: Record<string, any> = {
  bar: BarChart3,
  line: LineChart,
  pie: PieChart,
  table: Table,
  kpi: Gauge,
  heatmap: Map,
  area: Activity,
}

export function VisualizationLibrary({ functionalArea, onAddToDashboard, dashboards = [] }: VisualizationLibraryProps) {
  const { toast } = useToast()
  const [visualizations, setVisualizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedType, setSelectedType] = useState<string>('all')

  useEffect(() => {
    fetchVisualizations()
  }, [functionalArea])

  const fetchVisualizations = async () => {
    try {
      const response = await fetch(`/api/reporting-engine/visualizations?functionalArea=${functionalArea}`)
      if (response.ok) {
        const data = await response.json()
        setVisualizations(data.visualizations || [])
      }
    } catch (error) {
      console.error('Error fetching visualizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVisualizations = visualizations.filter((viz) => {
    const matchesSearch = viz.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      viz.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType === 'all' || viz.type === selectedType
    return matchesSearch && matchesType
  })

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visualization?')) return

    try {
      const response = await fetch(`/api/reporting-engine/visualizations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Visualization deleted',
        })
        fetchVisualizations()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete visualization',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicate = async (viz: any) => {
    try {
      const response = await fetch('/api/reporting-engine/visualizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${viz.name} (Copy)`,
          description: viz.description,
          type: viz.type,
          functionalArea: viz.functionalArea,
          queryId: viz.queryId,
          config: viz.config,
          defaultWidth: viz.defaultWidth,
          defaultHeight: viz.defaultHeight,
          tags: viz.tags,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Visualization duplicated',
        })
        fetchVisualizations()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate visualization',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading visualizations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Visualization Library</h2>
          <p className="text-sm text-muted-foreground">
            {filteredVisualizations.length} visualization{filteredVisualizations.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search visualizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {selectedType === 'all' ? 'All Types' : selectedType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setSelectedType('all')}>
              All Types
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedType('bar')}>Bar Chart</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedType('line')}>Line Chart</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedType('pie')}>Pie Chart</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedType('table')}>Table</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSelectedType('kpi')}>KPI Card</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Visualizations Grid/List */}
      {filteredVisualizations.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Visualizations Found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try adjusting your search' : 'Create your first visualization to get started'}
            </p>
          </div>
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
        )}>
          {filteredVisualizations.map((viz) => {
            const Icon = CHART_ICONS[viz.type] || BarChart3
            return (
              <Card
                key={viz.id}
                className={cn(
                  "group hover:shadow-lg transition-all cursor-pointer border-2 hover:border-purple-300",
                  viewMode === 'list' && "flex items-center gap-4"
                )}
              >
                <CardContent className={cn(
                  "p-4",
                  viewMode === 'list' && "flex-1 flex items-center gap-4"
                )}>
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                          <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {dashboards.length > 0 && (
                              <>
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                  Add to Dashboard
                                </DropdownMenuItem>
                                {dashboards.map((dashboard) => (
                                  <DropdownMenuItem
                                    key={dashboard.id}
                                    onClick={() => onAddToDashboard?.(viz.id, dashboard.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {dashboard.name}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(viz)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(viz.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{viz.name}</h3>
                      {viz.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {viz.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {viz.type}
                        </Badge>
                        {viz.tags?.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                        <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1">{viz.name}</h3>
                        {viz.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {viz.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {viz.type}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {dashboards.length > 0 && (
                              <>
                                <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                                  Add to Dashboard
                                </DropdownMenuItem>
                                {dashboards.map((dashboard) => (
                                  <DropdownMenuItem
                                    key={dashboard.id}
                                    onClick={() => onAddToDashboard?.(viz.id, dashboard.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    {dashboard.name}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(viz)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(viz.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

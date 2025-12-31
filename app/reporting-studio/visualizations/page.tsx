'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartConfigDialog } from '@/components/reporting-studio/chart-config-dialog'
import { ChartRenderer } from '@/components/reporting-studio/charts'
import { ChartConfig, ChartType, getChartDefaultConfig } from '@/lib/reporting-studio/chart-types'
import { Plus, BarChart3, Loader2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Visualization {
  id: string
  name: string
  type: string
  description?: string
  datasetId: string
  config: any
  createdAt: string
}

export default function VisualizationsPage() {
  const [visualizations, setVisualizations] = useState<Visualization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [currentConfig, setCurrentConfig] = useState<ChartConfig | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchVisualizations()
  }, [])

  const fetchVisualizations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/visualizations')
      if (response.ok) {
        const data = await response.json()
        setVisualizations(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching visualizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setCurrentConfig({
      type: ChartType.BAR,
      series: [],
      ...getChartDefaultConfig(ChartType.BAR),
    } as ChartConfig)
    setEditingId(null)
    setConfigDialogOpen(true)
  }

  const handleEdit = (viz: Visualization) => {
    // Convert visualization config to ChartConfig format
    const chartConfig: ChartConfig = {
      type: viz.config.chartType || ChartType.BAR,
      title: viz.name,
      description: viz.description,
      series: viz.config.series || [],
      xAxis: viz.config.axes?.x,
      yAxis: viz.config.axes?.y,
      ...getChartDefaultConfig(viz.config.chartType || ChartType.BAR),
      ...viz.config,
    }
    setCurrentConfig(chartConfig)
    setEditingId(viz.id)
    setConfigDialogOpen(true)
  }

  const handleSave = async (config: ChartConfig) => {
    try {
      // For now, just save locally or show message
      // In production, this would save to the API
      console.log('Saving visualization:', config)
      alert('Visualization saved! (Note: Full save functionality will be integrated with dataset selection)')
      setConfigDialogOpen(false)
      fetchVisualizations()
    } catch (error) {
      console.error('Error saving visualization:', error)
      alert('Failed to save visualization')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this visualization?')) return

    try {
      const response = await fetch(`/api/reporting-studio/visualizations/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchVisualizations()
      } else {
        alert('Failed to delete visualization')
      }
    } catch (error) {
      console.error('Error deleting visualization:', error)
      alert('Failed to delete visualization')
    }
  }

  const handleView = (id: string) => {
    router.push(`/reporting-studio/visualizations/${id}`)
  }

  // Get available fields from a sample dataset (in production, this would come from selected dataset)
  const availableFields = ['date', 'value', 'category', 'amount', 'sales', 'revenue']

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Visualizations
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage charts and visualizations
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          New Visualization
        </Button>
      </div>

      {/* Visualizations List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : visualizations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No visualizations yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first visualization to get started
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create Visualization
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visualizations.map((viz) => (
            <Card key={viz.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{viz.name}</CardTitle>
                    {viz.description && (
                      <CardDescription className="mt-1">{viz.description}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(viz.id)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(viz)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(viz.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <div>Type: {viz.type}</div>
                  <div>Created: {new Date(viz.createdAt).toLocaleDateString()}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Configuration Dialog */}
      <ChartConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        config={currentConfig}
        availableFields={availableFields}
        onSave={handleSave}
      />
    </div>
  )
}


'use client'

import { useState, useEffect, Suspense } from 'react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Edit, Trash2, Eye, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SalesDashboardBuilder, SalesDashboardWidget } from '@/components/sales/sales-dashboard-builder'
import { Layouts } from 'react-grid-layout'

interface Dashboard {
  id: string
  name: string
  description?: string
  type: 'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM'
  widgets: SalesDashboardWidget[]
  layout: Layouts
  isDefault: boolean
  owner: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

function SalesDashboardsPageInner() {
  const { toast } = useToast()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedDashboard, setSelectedDashboard] = useState<Dashboard | null>(null)
  const [newDashboardName, setNewDashboardName] = useState('')
  const [newDashboardDescription, setNewDashboardDescription] = useState('')
  const [newDashboardType, setNewDashboardType] = useState<'PERSONAL' | 'TEAM' | 'EXECUTIVE' | 'CUSTOM'>('PERSONAL')

  useEffect(() => {
    fetchDashboards()
  }, [])

  const fetchDashboards = async () => {
    try {
      const response = await fetch('/api/sales/dashboards')
      if (response.ok) {
        const data = await response.json()
        setDashboards(data)
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDashboard = async () => {
    if (!newDashboardName.trim()) {
      toast({
        title: 'Error',
        description: 'Dashboard name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/sales/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDashboardName,
          description: newDashboardDescription,
          type: newDashboardType,
          widgets: [],
          layout: { lg: [], md: [], sm: [], xs: [] },
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Dashboard created successfully',
        })
        setNewDashboardName('')
        setNewDashboardDescription('')
        setCreateDialogOpen(false)
        fetchDashboards()
      } else {
        throw new Error('Failed to create dashboard')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create dashboard',
        variant: 'destructive',
      })
    }
  }

  const handleEditDashboard = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard)
    setEditDialogOpen(true)
  }

  const handleViewDashboard = (dashboard: Dashboard) => {
    setSelectedDashboard(dashboard)
    setViewDialogOpen(true)
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const response = await fetch(`/api/sales/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Dashboard deleted successfully',
        })
        fetchDashboards()
      } else {
        throw new Error('Failed to delete dashboard')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete dashboard',
        variant: 'destructive',
      })
    }
  }

  const handleSaveDashboard = async (widgets: SalesDashboardWidget[], layout: Layouts) => {
    if (!selectedDashboard) return

    try {
      const response = await fetch(`/api/sales/dashboards/${selectedDashboard.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgets,
          layout,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Dashboard saved successfully',
        })
        fetchDashboards()
      } else {
        throw new Error('Failed to save dashboard')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save dashboard',
        variant: 'destructive',
      })
    }
  }

  return (
    <SalesPageLayout
      title="Custom Dashboards"
      description="Create and manage custom sales dashboards"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Dashboards</h2>
            <p className="text-muted-foreground">
              Create custom dashboards with drag-and-drop widgets
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Dashboard</DialogTitle>
                <DialogDescription>
                  Create a custom dashboard for your sales data
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newDashboardName}
                    onChange={(e) => setNewDashboardName(e.target.value)}
                    placeholder="My Dashboard"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newDashboardDescription}
                    onChange={(e) => setNewDashboardDescription(e.target.value)}
                    placeholder="Dashboard description"
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newDashboardType} onValueChange={(v: any) => setNewDashboardType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="TEAM">Team</SelectItem>
                      <SelectItem value="EXECUTIVE">Executive</SelectItem>
                      <SelectItem value="CUSTOM">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateDashboard} className="w-full">
                  Create Dashboard
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : dashboards.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No dashboards yet</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboards.map(dashboard => (
              <Card key={dashboard.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{dashboard.name}</CardTitle>
                      {dashboard.description && (
                        <CardDescription className="mt-1">
                          {dashboard.description}
                        </CardDescription>
                      )}
                    </div>
                    {dashboard.isDefault && (
                      <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">
                      Type: {dashboard.type}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Widgets: {dashboard.widgets?.length || 0}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDashboard(dashboard)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditDashboard(dashboard)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteDashboard(dashboard.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Dashboard: {selectedDashboard?.name}</DialogTitle>
              <DialogDescription>
                Drag and drop widgets to customize your dashboard
              </DialogDescription>
            </DialogHeader>
            {selectedDashboard && (
              <SalesDashboardBuilder
                dashboardId={selectedDashboard.id}
                initialWidgets={selectedDashboard.widgets || []}
                onSave={handleSaveDashboard}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDashboard?.name}</DialogTitle>
              <DialogDescription>
                {selectedDashboard?.description || 'Dashboard view'}
              </DialogDescription>
            </DialogHeader>
            {selectedDashboard && (
              <SalesDashboardBuilder
                dashboardId={selectedDashboard.id}
                initialWidgets={selectedDashboard.widgets || []}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SalesPageLayout>
  )
}

export default function SalesDashboardsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <SalesDashboardsPageInner />
    </Suspense>
  )
}

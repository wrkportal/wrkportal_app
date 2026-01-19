'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, LayoutGrid, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface AddToDashboardDialogProps {
  open: boolean
  onClose: () => void
  visualization: any
  existingDashboards: any[]
  functionalArea: string
  onSuccess: () => void
}

export function AddToDashboardDialog({
  open,
  onClose,
  visualization,
  existingDashboards,
  functionalArea,
  onSuccess,
}: AddToDashboardDialogProps) {
  const { toast } = useToast()
  const [mode, setMode] = useState<'existing' | 'new'>('existing')
  const [selectedDashboard, setSelectedDashboard] = useState<string>('')
  const [newDashboardName, setNewDashboardName] = useState('')
  const [newDashboardDescription, setNewDashboardDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setMode('existing')
      setSelectedDashboard('')
      setNewDashboardName('')
      setNewDashboardDescription('')
    }
  }, [open])

  const handleAdd = async () => {
    if (mode === 'existing') {
      if (!selectedDashboard) {
        toast({
          title: 'Error',
          description: 'Please select a dashboard',
          variant: 'destructive',
        })
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}/visualizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visualizationId: visualization.id,
            position: { x: 0, y: 0, w: visualization.defaultWidth || 6, h: visualization.defaultHeight || 4 },
          }),
        })

        if (response.ok) {
          toast({
            title: 'Success',
            description: 'Visualization added to dashboard',
          })
          onSuccess()
          onClose()
        } else {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to add visualization to dashboard')
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to add visualization to dashboard',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    } else {
      // Create new dashboard
      if (!newDashboardName.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter a dashboard name',
          variant: 'destructive',
        })
        return
      }

      setLoading(true)
      try {
        // Create new dashboard
        const createResponse = await fetch('/api/reporting-engine/dashboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newDashboardName,
            description: newDashboardDescription,
            functionalArea: functionalArea,
            isDefault: false,
          }),
        })

        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to create dashboard')
        }

        const createData = await createResponse.json()
        const dashboardId = createData.dashboard.id

        // Add visualization to the new dashboard
        const addResponse = await fetch(`/api/reporting-engine/dashboards/${dashboardId}/visualizations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visualizationId: visualization.id,
            position: { x: 0, y: 0, w: visualization.defaultWidth || 6, h: visualization.defaultHeight || 4 },
          }),
        })

        if (addResponse.ok) {
          toast({
            title: 'Success',
            description: 'Dashboard created and visualization added',
          })
          onSuccess()
          onClose()
        } else {
          const errorData = await addResponse.json().catch(() => ({}))
          throw new Error(errorData.error || 'Failed to add visualization to new dashboard')
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create dashboard or add visualization',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5" />
            Add to Dashboard - {visualization?.name}
          </DialogTitle>
          <DialogDescription>
            Add this visualization to an existing dashboard or create a new one
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as 'existing' | 'new')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Dashboard</TabsTrigger>
            <TabsTrigger value="new">New Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {!existingDashboards || existingDashboards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No dashboards available</p>
                <p className="text-sm">Create a new dashboard to add this visualization</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Label>Select Dashboard</Label>
                <Select value={selectedDashboard} onValueChange={setSelectedDashboard}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a dashboard" />
                  </SelectTrigger>
                  <SelectContent>
                    {(existingDashboards || []).map((dashboard) => (
                      <SelectItem key={dashboard.id} value={dashboard.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{dashboard.name}</span>
                          {dashboard.isDefault && (
                            <span className="text-xs text-muted-foreground ml-2">(Default)</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedDashboard && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This visualization will be added to{' '}
                      <span className="font-medium">
                        {(existingDashboards || []).find((d) => d.id === selectedDashboard)?.name}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Dashboard Name *</Label>
                <Input
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  placeholder="Enter dashboard name"
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={newDashboardDescription}
                  onChange={(e) => setNewDashboardDescription(e.target.value)}
                  placeholder="Enter dashboard description"
                />
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  A new dashboard will be created and this visualization will be added to it.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={loading}
            style={mode === 'new' ? { backgroundColor: '#ff751f' } : undefined}
            className={mode === 'new' ? 'hover:opacity-90' : ''}
          >
            {loading ? (
              'Adding...'
            ) : mode === 'existing' ? (
              'Add to Dashboard'
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create & Add
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

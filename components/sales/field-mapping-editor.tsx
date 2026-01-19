'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Trash2, Edit2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FieldMapping {
  id: string
  sourceField: string
  targetField: string
  mappingType: string
  transformation?: any
  isActive: boolean
}

interface FieldMappingEditorProps {
  integrationId: string
  provider: string
  entityType?: 'lead' | 'contact' | 'opportunity' | 'account'
}

export function FieldMappingEditor({ integrationId, provider, entityType = 'lead' }: FieldMappingEditorProps) {
  const { toast } = useToast()
  const [mappings, setMappings] = useState<FieldMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null)
  const [sourceFields, setSourceFields] = useState<string[]>([])
  const [targetFields, setTargetFields] = useState<string[]>([])

  const [formData, setFormData] = useState({
    sourceField: '',
    targetField: '',
    mappingType: 'DIRECT' as 'DIRECT' | 'TRANSFORM' | 'LOOKUP' | 'CONCATENATE' | 'CALCULATED' | 'DEFAULT',
    isActive: true,
  })

  useEffect(() => {
    fetchMappings()
    fetchAvailableFields()
  }, [integrationId, entityType])

  const fetchMappings = async () => {
    try {
      const response = await fetch(`/api/sales/integrations/${integrationId}/field-mappings`)
      if (response.ok) {
        const data = await response.json()
        setMappings(data.mappings || [])
      }
    } catch (error) {
      console.error('Error fetching mappings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableFields = async () => {
    try {
      const response = await fetch(
        `/api/sales/integrations/${integrationId}/field-mappings/available-fields?direction=FROM_EXTERNAL&entityType=${entityType}`
      )
      if (response.ok) {
        const data = await response.json()
        setSourceFields(data.sourceFields || [])
        setTargetFields(data.targetFields || [])
      }
    } catch (error) {
      console.error('Error fetching available fields:', error)
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/sales/integrations/${integrationId}/field-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Field mapping saved',
        })
        setDialogOpen(false)
        setEditingMapping(null)
        setFormData({
          sourceField: '',
          targetField: '',
          mappingType: 'DIRECT',
          isActive: true,
        })
        fetchMappings()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to save field mapping',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save field mapping',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (mappingId: string) => {
    if (!confirm('Are you sure you want to delete this mapping?')) {
      return
    }

    try {
      const response = await fetch(
        `/api/sales/integrations/${integrationId}/field-mappings?mappingId=${mappingId}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Field mapping deleted',
        })
        fetchMappings()
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete field mapping',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete field mapping',
        variant: 'destructive',
      })
    }
  }

  const handleEdit = (mapping: FieldMapping) => {
    setEditingMapping(mapping)
    setFormData({
      sourceField: mapping.sourceField,
      targetField: mapping.targetField,
      mappingType: mapping.mappingType as any,
      isActive: mapping.isActive,
    })
    setDialogOpen(true)
  }

  const getMappingTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DIRECT: 'Direct',
      TRANSFORM: 'Transform',
      LOOKUP: 'Lookup',
      CONCATENATE: 'Concatenate',
      CALCULATED: 'Calculated',
      DEFAULT: 'Default',
    }
    return labels[type] || type
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Field Mappings</h3>
          <p className="text-sm text-muted-foreground">
            Map fields from {provider} to your system
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingMapping(null)
            setFormData({
              sourceField: '',
              targetField: '',
              mappingType: 'DIRECT',
              isActive: true,
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMapping ? 'Edit Field Mapping' : 'Add Field Mapping'}
              </DialogTitle>
              <DialogDescription>
                Map a field from {provider} to your system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Source Field ({provider})</Label>
                <Select
                  value={formData.sourceField}
                  onValueChange={(value) => setFormData({ ...formData, sourceField: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source field" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Target Field (Your System)</Label>
                <Select
                  value={formData.targetField}
                  onValueChange={(value) => setFormData({ ...formData, targetField: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target field" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mapping Type</Label>
                <Select
                  value={formData.mappingType}
                  onValueChange={(value) => setFormData({ ...formData, mappingType: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DIRECT">Direct</SelectItem>
                    <SelectItem value="TRANSFORM">Transform</SelectItem>
                    <SelectItem value="LOOKUP">Lookup</SelectItem>
                    <SelectItem value="CONCATENATE">Concatenate</SelectItem>
                    <SelectItem value="CALCULATED">Calculated</SelectItem>
                    <SelectItem value="DEFAULT">Default Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingMapping ? 'Update' : 'Create'} Mapping
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading mappings...</div>
      ) : mappings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No field mappings configured</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Mapping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {mappings.map((mapping) => (
            <Card key={mapping.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mapping.sourceField}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{mapping.targetField}</span>
                    </div>
                    <Badge variant="outline">
                      {getMappingTypeLabel(mapping.mappingType)}
                    </Badge>
                    {!mapping.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(mapping)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(mapping.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


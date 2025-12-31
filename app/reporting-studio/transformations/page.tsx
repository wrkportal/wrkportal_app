/**
 * Phase 5.4: Data Transformation Builder - Main Page
 * 
 * Lists all transformations and allows creating new ones
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Beaker,
  Calendar,
  User,
  Loader2,
  Trash2,
  Edit2,
  Play,
  Eye,
  Database,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export default function TransformationsPage() {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [transformations, setTransformations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTransformationName, setNewTransformationName] = useState('')
  const [newTransformationDescription, setNewTransformationDescription] = useState('')
  const [inputDatasetId, setInputDatasetId] = useState('')
  const [datasets, setDatasets] = useState<any[]>([])
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchTransformations()
    fetchDatasets()
  }, [])

  const fetchTransformations = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/transformations?visual=true')
      if (res.ok) {
        const data = await res.json()
        setTransformations(data.transformations || [])
      }
    } catch (error) {
      console.error('Error fetching transformations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/reporting/datasets')
      if (res.ok) {
        const data = await res.json()
        setDatasets(data.datasets || [])
      }
    } catch (error) {
      console.error('Error fetching datasets:', error)
    }
  }

  const handleCreate = async () => {
    if (!newTransformationName || !inputDatasetId) {
      alert('Please provide a name and select an input dataset')
      return
    }

    setIsCreating(true)
    try {
      const res = await fetch('/api/transformations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTransformationName,
          description: newTransformationDescription,
          inputDatasetId,
          isVisual: true,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsDialogOpen(false)
        setNewTransformationName('')
        setNewTransformationDescription('')
        setInputDatasetId('')
        router.push(`/reporting-studio/transformations/${data.transformation.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create transformation')
      }
    } catch (error) {
      console.error('Error creating transformation:', error)
      alert('Failed to create transformation')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transformation?')) return

    try {
      const res = await fetch(`/api/transformations/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchTransformations()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete transformation')
      }
    } catch (error) {
      console.error('Error deleting transformation:', error)
      alert('Failed to delete transformation')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>
      case 'DRAFT':
        return <Badge variant="secondary">Draft</Badge>
      case 'ERROR':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Data Transformations</h1>
          <p className="text-muted-foreground mt-1">
            Build visual data transformation pipelines
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transformation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Transformation</DialogTitle>
              <DialogDescription>
                Create a new visual data transformation pipeline
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newTransformationName}
                  onChange={(e) => setNewTransformationName(e.target.value)}
                  placeholder="My Transformation"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={newTransformationDescription}
                  onChange={(e) => setNewTransformationDescription(e.target.value)}
                  placeholder="Transform sales data..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Input Dataset</label>
                <select
                  value={inputDatasetId}
                  onChange={(e) => setInputDatasetId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select a dataset...</option>
                  {datasets.map((dataset) => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !newTransformationName || !inputDatasetId}
                className="w-full"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      ) : transformations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Beaker className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No transformations yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first data transformation pipeline
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Transformation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Transformations</CardTitle>
            <CardDescription>
              Manage your data transformation pipelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Input Dataset</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformations.map((transformation) => (
                  <TableRow key={transformation.id}>
                    <TableCell className="font-medium">
                      {transformation.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        {transformation.inputDataset?.name || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {transformation.steps?.length || 0} step(s)
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transformation.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(transformation.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/reporting-studio/transformations/${transformation.id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/reporting-studio/transformations/${transformation.id}?preview=true`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transformation.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


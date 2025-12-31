/**
 * Phase 5.3: Grid Editor - Main Page
 * 
 * Lists all grids and allows creating new ones
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
  FileSpreadsheet,
  Calendar,
  User,
  Loader2,
  Trash2,
  Edit2,
  ExternalLink,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export default function GridsPage() {
  const router = useRouter()
  const currentUser = useAuthStore((state) => state.user)
  const [grids, setGrids] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newGridName, setNewGridName] = useState('')
  const [newGridDescription, setNewGridDescription] = useState('')

  const isAdmin = currentUser?.role === 'ORG_ADMIN' || 
                 currentUser?.role === 'TENANT_SUPER_ADMIN' || 
                 currentUser?.role === 'PLATFORM_OWNER'

  useEffect(() => {
    fetchGrids()
  }, [])

  const fetchGrids = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/grids')
      if (res.ok) {
        const data = await res.json()
        setGrids(data.grids || [])
      }
    } catch (error) {
      console.error('Error fetching grids:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createGrid = async () => {
    if (!newGridName.trim()) {
      alert('Please enter a grid name')
      return
    }

    try {
      const res = await fetch('/api/grids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newGridName,
          description: newGridDescription || undefined,
          rowCount: 1000,
          columnCount: 26,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setIsDialogOpen(false)
        setNewGridName('')
        setNewGridDescription('')
        router.push(`/grids/${data.grid.id}`)
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to create grid')
      }
    } catch (error) {
      console.error('Error creating grid:', error)
      alert('Failed to create grid')
    }
  }

  const deleteGrid = async (gridId: string) => {
    if (!confirm('Are you sure you want to delete this grid?')) {
      return
    }

    try {
      const res = await fetch(`/api/grids/${gridId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchGrids()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to delete grid')
      }
    } catch (error) {
      console.error('Error deleting grid:', error)
      alert('Failed to delete grid')
    }
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              You don't have permission to access this page.
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8" />
            Grid Editor
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage Excel-like spreadsheets
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Grid
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Grid</DialogTitle>
              <DialogDescription>
                Create a new Excel-like spreadsheet
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Grid Name</label>
                <Input
                  placeholder="e.g., Sales Data Q1"
                  value={newGridName}
                  onChange={(e) => setNewGridName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="Brief description..."
                  value={newGridDescription}
                  onChange={(e) => setNewGridDescription(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createGrid}>
                  Create Grid
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Grids</CardTitle>
          <CardDescription>
            All your spreadsheets and data grids
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Cells</TableHead>
                  <TableHead>Formulas</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grids.map((grid) => (
                  <TableRow key={grid.id}>
                    <TableCell className="font-medium">{grid.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {grid.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{grid._count?.cells || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{grid._count?.formulas || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(grid.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {grid.createdBy?.firstName} {grid.createdBy?.lastName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {grid.isPublic ? (
                        <Badge>Public</Badge>
                      ) : (
                        <Badge variant="secondary">Private</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => router.push(`/grids/${grid.id}`)}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteGrid(grid.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {grids.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No grids yet. Click "New Grid" to create your first spreadsheet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


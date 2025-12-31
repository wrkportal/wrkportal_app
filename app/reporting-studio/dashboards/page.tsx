'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, MoreVertical, Eye, Edit, Trash2, LayoutGrid, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Dashboard {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  createdByUser?: {
    name: string
    email: string
  }
  _count?: {
    widgets: number
    datasets: number
    reports: number
  }
}

export default function DashboardsPage() {
  const router = useRouter()
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboards()
  }, [])

  const fetchDashboards = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/dashboards')
      if (response.ok) {
        const data = await response.json()
        setDashboards(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const response = await fetch(`/api/reporting-studio/dashboards/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDashboards()
      } else {
        alert('Failed to delete dashboard')
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error)
      alert('Failed to delete dashboard')
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <LayoutGrid className="h-8 w-8" />
            Dashboards
          </h1>
          <p className="text-muted-foreground mt-2">
            Create and manage interactive dashboards
          </p>
        </div>
        <Button onClick={() => router.push('/reporting-studio/dashboards/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Dashboard
        </Button>
      </div>

      {/* Dashboards List */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : dashboards.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first dashboard to start visualizing your data
              </p>
              <Button onClick={() => router.push('/reporting-studio/dashboards/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Dashboards</CardTitle>
            <CardDescription>View and manage your dashboards</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Widgets</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboards.map((dashboard) => (
                  <TableRow key={dashboard.id}>
                    <TableCell className="font-medium">{dashboard.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dashboard._count?.widgets || 0} widgets
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {dashboard.createdByUser?.name || dashboard.createdByUser?.email || '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(dashboard.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(dashboard.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => router.push(`/reporting-studio/dashboards/${dashboard.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => router.push(`/reporting-studio/dashboards/${dashboard.id}/edit`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(dashboard.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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


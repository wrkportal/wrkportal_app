'use client'

import { useState, useEffect } from 'react'
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
import { MoreVertical, Eye, RefreshCw, Trash2, Database, FileStack } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface Dataset {
  id: string
  name: string
  description?: string
  type: string
  status: string
  rowCount?: number
  columnCount?: number
  lastRefreshedAt?: string
  createdAt: string
  dataSource?: {
    name: string
    type: string
  }
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchDatasets()
  }, [])

  const fetchDatasets = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/datasets')
      if (response.ok) {
        const data = await response.json()
        setDatasets(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching datasets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async (id: string) => {
    try {
      const response = await fetch(`/api/reporting-studio/datasets/${id}/refresh`, {
        method: 'POST',
      })
      if (response.ok) {
        fetchDatasets()
      } else {
        alert('Failed to refresh dataset')
      }
    } catch (error) {
      console.error('Error refreshing dataset:', error)
      alert('Failed to refresh dataset')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this dataset?')) return

    try {
      const response = await fetch(`/api/reporting-studio/datasets/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchDatasets()
      } else {
        alert('Failed to delete dataset')
      }
    } catch (error) {
      console.error('Error deleting dataset:', error)
      alert('Failed to delete dataset')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'ERROR':
        return 'bg-red-500'
      case 'PROCESSING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Datasets
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your data datasets for reporting and analysis
          </p>
        </div>
        <Button onClick={() => router.push('/reporting-studio/data-sources')}>
          <FileStack className="h-4 w-4 mr-2" />
          Create Dataset
        </Button>
      </div>

      {/* Datasets Table */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ) : datasets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No datasets yet</h3>
              <p className="text-muted-foreground mb-4">
                Create datasets from your data sources to start analyzing
              </p>
              <Button onClick={() => router.push('/reporting-studio/data-sources')}>
                <FileStack className="h-4 w-4 mr-2" />
                Go to Data Sources
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Datasets</CardTitle>
            <CardDescription>View and manage your datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Columns</TableHead>
                  <TableHead>Last Refreshed</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow
                    key={dataset.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/reporting-studio/datasets/${dataset.id}`)}
                  >
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{dataset.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getStatusColor(dataset.status)}`}
                        />
                        <span>{dataset.status}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {dataset.rowCount?.toLocaleString() || '—'}
                    </TableCell>
                    <TableCell>{dataset.columnCount || '—'}</TableCell>
                    <TableCell>
                      {dataset.lastRefreshedAt
                        ? new Date(dataset.lastRefreshedAt).toLocaleDateString()
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(dataset.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/reporting-studio/datasets/${dataset.id}`)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRefresh(dataset.id)
                            }}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(dataset.id)
                            }}
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


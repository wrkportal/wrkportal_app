'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Database,
  TestTube,
  Trash2,
  Edit,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { DatabaseConnectionDialog } from './database-connection-dialog'
import { DatabaseTableBrowser } from './database-table-browser'
import { formatDistanceToNow } from 'date-fns'

interface DataSource {
  id: string
  name: string
  description?: string
  type: string
  provider?: string
  status: string
  createdAt: string
  lastTestedAt?: string
  hasConnection: boolean
}

export function DatabaseConnectionList() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | undefined>(undefined)
  const [browsingId, setBrowsingId] = useState<string | undefined>(undefined)
  const [isTesting, setIsTesting] = useState<string | null>(null)

  useEffect(() => {
    fetchDataSources()
  }, [])

  const fetchDataSources = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/data-sources?type=DATABASE')
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this database connection?')) {
      return
    }

    try {
      const response = await fetch(`/api/reporting-studio/data-sources/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDataSources(dataSources.filter((ds) => ds.id !== id))
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete connection')
      }
    } catch (error) {
      console.error('Error deleting data source:', error)
      alert('Failed to delete connection')
    }
  }

  const handleTest = async (id: string) => {
    setIsTesting(id)
    try {
      const response = await fetch(`/api/reporting-studio/data-sources/${id}/test`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the list to show updated status
        await fetchDataSources()
      } else {
        alert(data.message || 'Connection test failed')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      alert('Failed to test connection')
    } finally {
      setIsTesting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case 'ERROR':
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case 'TESTING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Testing
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const getProviderName = (provider?: string) => {
    switch (provider) {
      case 'POSTGRESQL':
        return 'PostgreSQL'
      case 'MYSQL':
        return 'MySQL'
      case 'SQLSERVER':
        return 'SQL Server'
      case 'MONGODB':
        return 'MongoDB'
      default:
        return provider || 'Unknown'
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Database Connections</CardTitle>
          <CardDescription>
            Connect to SQL databases, APIs, and cloud services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : dataSources.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No database connections</p>
              <p className="text-sm mt-2">Click "Connect Database" to add a new connection</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Tested</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataSources.map((ds) => (
                    <TableRow key={ds.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{ds.name}</p>
                          {ds.description && (
                            <p className="text-xs text-muted-foreground">{ds.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getProviderName(ds.provider)}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ds.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {ds.lastTestedAt
                          ? formatDistanceToNow(new Date(ds.lastTestedAt), { addSuffix: true })
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setBrowsingId(ds.id)}
                            title="Browse Tables"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTest(ds.id)}
                            disabled={isTesting === ds.id}
                            title="Test Connection"
                          >
                            {isTesting === ds.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingId(ds.id)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ds.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <DatabaseConnectionDialog
        open={!!editingId}
        onClose={() => setEditingId(undefined)}
        onSuccess={() => {
          setEditingId(undefined)
          fetchDataSources()
        }}
        dataSourceId={editingId}
      />

      {/* Table Browser */}
      {browsingId && (
        <DatabaseTableBrowser
          open={!!browsingId}
          onClose={() => setBrowsingId(undefined)}
          dataSourceId={browsingId}
        />
      )}
    </>
  )
}


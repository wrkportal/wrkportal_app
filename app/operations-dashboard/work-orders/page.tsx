'use client'

import { useState, useEffect } from 'react'
import { OperationsPageLayout } from '@/components/operations/operations-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus, 
  Search, 
  Wrench, 
  Calendar, 
  User, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Package
} from 'lucide-react'

interface WorkOrder {
  id: string
  workOrderNumber: string
  title: string
  description: string
  status: string
  priority: string
  assignedTo: string
  requestedBy: string
  asset: string
  location: string
  scheduledDate: string
  completedDate: string | null
  estimatedCost: string
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assignedTo: '',
    requestedBy: '',
    asset: '',
    location: '',
    scheduledDate: '',
    estimatedCost: '',
  })

  useEffect(() => {
    fetchWorkOrders()
  }, [statusFilter, searchTerm])

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/operations/work-orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch work orders')
      }
      const data = await response.json()
      
      // Transform API data to match component interface
      const transformedWorkOrders: WorkOrder[] = (data.workOrders || []).map((wo: any) => ({
        id: wo.id,
        workOrderNumber: wo.workOrderNumber,
        title: wo.title,
        description: wo.description || '',
        status: wo.status,
        priority: wo.priority,
        assignedTo: wo.assignedTo?.name || wo.assignedToId || 'Unassigned',
        requestedBy: wo.requestedBy?.name || wo.requestedById || 'Unknown',
        asset: wo.assetId || '',
        location: wo.location || '',
        scheduledDate: wo.scheduledDate ? new Date(wo.scheduledDate).toISOString() : '',
        completedDate: wo.completedDate ? new Date(wo.completedDate).toISOString() : null,
        estimatedCost: wo.estimatedCost ? `$${Number(wo.estimatedCost).toLocaleString()}` : '$0',
      }))
      
      setWorkOrders(transformedWorkOrders)
    } catch (error) {
      console.error('Error fetching work orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkOrder = async () => {
    try {
      const response = await fetch('/api/operations/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          location: formData.location,
          scheduledDate: formData.scheduledDate || new Date().toISOString(),
          estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost.replace(/[^0-9.]/g, '')) : 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create work order')
      }

      // Refresh work orders list
      await fetchWorkOrders()
      setIsDialogOpen(false)
      setFormData({
        title: '',
        description: '',
        status: 'OPEN',
        priority: 'MEDIUM',
        assignedTo: '',
        requestedBy: '',
        asset: '',
        location: '',
        scheduledDate: '',
        estimatedCost: '',
      })
    } catch (error) {
      console.error('Error creating work order:', error)
      alert(error instanceof Error ? error.message : 'Failed to create work order')
    }
  }

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || wo.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'SCHEDULED':
        return 'outline'
      case 'OPEN':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
  })

  useEffect(() => {
    // Fetch stats from API
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/operations/work-orders')
        if (response.ok) {
          const data = await response.json()
          if (data.stats) {
            setStats({
              total: data.stats.total || 0,
              open: data.stats.pending || 0,
              inProgress: data.stats.inProgress || 0,
              completed: data.stats.completed || 0,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching work order stats:', error)
      }
    }
    fetchStats()
  }, [])

  return (
    <OperationsPageLayout title="Work Orders" description="Manage maintenance and repair work orders">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All work orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
              <p className="text-xs text-muted-foreground">Pending orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Active orders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search work orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Work Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Work Order</DialogTitle>
                <DialogDescription>
                  Create a new maintenance or repair work order
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="wo-title">Title *</Label>
                  <Input
                    id="wo-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="wo-description">Description</Label>
                  <Textarea
                    id="wo-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="wo-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="wo-priority">Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="wo-assigned">Assigned To</Label>
                    <Input
                      id="wo-assigned"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wo-requested">Requested By</Label>
                    <Input
                      id="wo-requested"
                      value={formData.requestedBy}
                      onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="wo-asset">Asset</Label>
                    <Input
                      id="wo-asset"
                      value={formData.asset}
                      onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wo-location">Location</Label>
                    <Input
                      id="wo-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="wo-scheduled">Scheduled Date</Label>
                    <Input
                      id="wo-scheduled"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="wo-cost">Estimated Cost</Label>
                    <Input
                      id="wo-cost"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWorkOrder}>
                    Create Work Order
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Work Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Work Orders</CardTitle>
            <CardDescription>
              Manage maintenance and repair work orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredWorkOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No work orders found. Create a work order to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Estimated Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((wo) => (
                    <TableRow key={wo.id}>
                      <TableCell className="font-medium">{wo.workOrderNumber}</TableCell>
                      <TableCell>{wo.title}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(wo.status)}>
                          {wo.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(wo.priority)}>
                          {wo.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{wo.assignedTo}</TableCell>
                      <TableCell>{wo.asset}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {wo.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        {wo.scheduledDate ? new Date(wo.scheduledDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell>{wo.estimatedCost}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Work Order
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/operations/work-orders/${wo.id}/complete`, {
                                    method: 'POST',
                                  })
                                  if (response.ok) {
                                    await fetchWorkOrders()
                                  } else {
                                    const errorData = await response.json()
                                    alert(errorData.error || 'Failed to complete work order')
                                  }
                                } catch (error) {
                                  console.error('Error completing work order:', error)
                                  alert('Failed to complete work order')
                                }
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this work order?')) {
                                  try {
                                    const response = await fetch(`/api/operations/work-orders/${wo.id}`, {
                                      method: 'DELETE',
                                    })
                                    if (response.ok) {
                                      await fetchWorkOrders()
                                    } else {
                                      const errorData = await response.json()
                                      alert(errorData.error || 'Failed to delete work order')
                                    }
                                  } catch (error) {
                                    console.error('Error deleting work order:', error)
                                    alert('Failed to delete work order')
                                  }
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </OperationsPageLayout>
  )
}


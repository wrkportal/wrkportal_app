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
  Package, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Repeat
} from 'lucide-react'

interface Maintenance {
  id: string
  maintenanceNumber: string
  asset: string
  type: string
  status: string
  scheduledDate: string
  completedDate: string | null
  technician: string
  description: string
  cost: string
  frequency: string
}

export default function MaintenancePage() {
  const [maintenance, setMaintenance] = useState<Maintenance[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    asset: '',
    type: 'PREVENTIVE',
    status: 'SCHEDULED',
    scheduledDate: '',
    technician: '',
    description: '',
    cost: '',
    frequency: '',
  })

  useEffect(() => {
    fetchMaintenanceRecords()
  }, [statusFilter, searchTerm])

  const fetchMaintenanceRecords = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/operations/maintenance?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match component interface
        const transformedMaintenance = (data.maintenance || []).map((maint: any) => ({
          id: maint.id,
          maintenanceNumber: maint.maintenanceNumber,
          asset: maint.asset?.name || maint.assetId || 'N/A',
          type: maint.type,
          status: maint.status,
          scheduledDate: maint.scheduledDate ? new Date(maint.scheduledDate).toISOString() : new Date().toISOString(),
          completedDate: maint.completedDate ? new Date(maint.completedDate).toISOString() : null,
          technician: maint.technician?.name || maint.technicianName || 'Unassigned',
          description: maint.description || '',
          cost: maint.cost ? `$${Number(maint.cost).toLocaleString()}` : '$0',
          frequency: maint.frequency || '',
        }))
        setMaintenance(transformedMaintenance)
      } else {
        setMaintenance([])
      }
    } catch (error) {
      console.error('Error fetching maintenance:', error)
      setMaintenance([])
    } finally {
      setLoading(false)
    }
  }


  const handleCreateMaintenance = async () => {
    try {
      const response = await fetch('/api/operations/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.asset || 'Maintenance',
          description: formData.description,
          type: formData.type,
          status: formData.status,
          scheduledDate: formData.scheduledDate,
          technicianName: formData.technician,
          cost: formData.cost ? parseFloat(formData.cost.replace(/[^0-9.]/g, '')) : undefined,
          frequency: formData.frequency,
        }),
      })
      if (response.ok) {
        await fetchMaintenanceRecords()
        setIsDialogOpen(false)
        setFormData({
          asset: '',
          type: 'PREVENTIVE',
          status: 'SCHEDULED',
          scheduledDate: '',
          technician: '',
          description: '',
          cost: '',
          frequency: '',
        })
      } else {
        const error = await response.json()
        console.error('Error creating maintenance:', error)
      }
    } catch (error) {
      console.error('Error creating maintenance:', error)
    }
  }

  const filteredMaintenance = maintenance.filter((m) => {
    const matchesSearch = m.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.maintenanceNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || m.status === statusFilter
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
      case 'OVERDUE':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const stats = {
    total: maintenance.length,
    scheduled: maintenance.filter((m) => m.status === 'SCHEDULED').length,
    inProgress: maintenance.filter((m) => m.status === 'IN_PROGRESS').length,
    completed: maintenance.filter((m) => m.status === 'COMPLETED').length,
  }

  return (
    <OperationsPageLayout title="Maintenance" description="Schedule and track asset maintenance">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All maintenance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Finished</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search maintenance..."
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
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
                <DialogDescription>
                  Schedule maintenance for an asset
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="mnt-asset">Asset *</Label>
                  <Input
                    id="mnt-asset"
                    value={formData.asset}
                    onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="mnt-type">Maintenance Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PREVENTIVE">Preventive</SelectItem>
                        <SelectItem value="CORRECTIVE">Corrective</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="mnt-frequency">Frequency</Label>
                    <Input
                      id="mnt-frequency"
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      placeholder="Monthly, Quarterly, etc."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mnt-description">Description</Label>
                  <Textarea
                    id="mnt-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="mnt-scheduled">Scheduled Date</Label>
                    <Input
                      id="mnt-scheduled"
                      type="date"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mnt-technician">Technician/Team</Label>
                    <Input
                      id="mnt-technician"
                      value={formData.technician}
                      onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mnt-cost">Estimated Cost</Label>
                  <Input
                    id="mnt-cost"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="$0"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateMaintenance}>
                    Schedule Maintenance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Maintenance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Schedule</CardTitle>
            <CardDescription>
              Schedule and track asset maintenance
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredMaintenance.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No maintenance records found. Schedule maintenance to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Maintenance #</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Technician</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMaintenance.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.maintenanceNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {m.asset}
                        </div>
                      </TableCell>
                      <TableCell>{m.type}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(m.status)}>
                          {m.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(m.scheduledDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{m.technician}</TableCell>
                      <TableCell>{m.frequency}</TableCell>
                      <TableCell>{m.cost}</TableCell>
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
                              Edit Maintenance
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Repeat className="mr-2 h-4 w-4" />
                              Reschedule
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
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


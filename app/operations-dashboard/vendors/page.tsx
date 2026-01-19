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
  Building2, 
  Phone, 
  Mail, 
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react'

interface Vendor {
  id: string
  name: string
  category: string
  contactPerson: string
  email: string
  phone: string
  address: string
  status: string
  contractValue: string
  contractStartDate: string
  contractEndDate: string
  rating: number
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    status: 'ACTIVE',
    contractValue: '',
    contractStartDate: '',
    contractEndDate: '',
  })

  useEffect(() => {
    fetchVendors()
  }, [statusFilter, searchTerm])

  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/operations/vendors?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        // Transform API data to match component interface
        const transformedVendors = (data.vendors || []).map((vendor: any) => ({
          id: vendor.id,
          name: vendor.name,
          category: vendor.category || 'Uncategorized',
          contactPerson: vendor.contactPerson || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          address: vendor.address || '',
          status: vendor.status,
          contractValue: vendor.contractValue ? `$${Number(vendor.contractValue).toLocaleString()}` : '$0',
          contractStartDate: vendor.contractStartDate ? new Date(vendor.contractStartDate).toISOString() : null,
          contractEndDate: vendor.contractEndDate ? new Date(vendor.contractEndDate).toISOString() : null,
          rating: vendor.rating ? Number(vendor.rating) : 0,
        }))
        setVendors(transformedVendors)
      } else {
        setVendors([])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVendor = async () => {
    try {
      const response = await fetch('/api/operations/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          contractValue: formData.contractValue ? parseFloat(formData.contractValue.replace(/[^0-9.]/g, '')) : undefined,
        }),
      })
      if (response.ok) {
        await fetchVendors()
        setIsDialogOpen(false)
        setFormData({
          name: '',
          category: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          status: 'ACTIVE',
          contractValue: '',
          contractStartDate: '',
          contractEndDate: '',
        })
      } else {
        const error = await response.json()
        console.error('Error creating vendor:', error)
      }
    } catch (error) {
      console.error('Error creating vendor:', error)
    }
  }

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: vendors.length,
    active: vendors.filter((v) => v.status === 'ACTIVE').length,
    inactive: vendors.filter((v) => v.status === 'INACTIVE').length,
    pending: vendors.filter((v) => v.status === 'PENDING').length,
  }

  return (
    <OperationsPageLayout title="Vendors" description="Manage vendor relationships and contracts">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground">Active vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground">Inactive vendors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors..."
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
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Vendor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Vendor</DialogTitle>
                <DialogDescription>
                  Register a new vendor partner
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="vendor-name">Vendor Name *</Label>
                  <Input
                    id="vendor-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="vendor-category">Category</Label>
                    <Input
                      id="vendor-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="vendor-contact">Contact Person</Label>
                  <Input
                    id="vendor-contact"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="vendor-email">Email</Label>
                    <Input
                      id="vendor-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-phone">Phone</Label>
                    <Input
                      id="vendor-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="vendor-address">Address</Label>
                  <Textarea
                    id="vendor-address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="vendor-contractValue">Contract Value</Label>
                    <Input
                      id="vendor-contractValue"
                      value={formData.contractValue}
                      onChange={(e) => setFormData({ ...formData, contractValue: e.target.value })}
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-contractStart">Contract Start</Label>
                    <Input
                      id="vendor-contractStart"
                      type="date"
                      value={formData.contractStartDate}
                      onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="vendor-contractEnd">Contract End</Label>
                    <Input
                      id="vendor-contractEnd"
                      type="date"
                      value={formData.contractEndDate}
                      onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateVendor}>
                    Add Vendor
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors</CardTitle>
            <CardDescription>
              Manage vendor relationships and contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No vendors found. Add a vendor to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contract Value</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell className="font-medium">{vendor.name}</TableCell>
                      <TableCell>{vendor.category}</TableCell>
                      <TableCell>{vendor.contactPerson}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {vendor.email}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {vendor.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={vendor.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {vendor.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{vendor.contractValue}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-yellow-500" />
                          {vendor.rating}/5
                        </div>
                      </TableCell>
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
                              Edit Vendor
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Contracts
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


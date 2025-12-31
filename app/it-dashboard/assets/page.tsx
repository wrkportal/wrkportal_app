'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Plus, 
  Search, 
  HardDrive,
  Laptop,
  Server,
  Monitor,
  Network,
  Printer,
  Smartphone,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface Asset {
  id: string
  name: string
  type: string
  category: string
  brand: string
  model: string
  serialNumber: string
  status: string
  location: string
  assignedTo: string | null
  purchaseDate: string
  warrantyExpiry: string
  cost: number
  notes: string
}

const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#ef4444', '#10b981', '#06b6d4', '#6366f1']

export default function AssetsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [assets, setAssets] = useState<Asset[]>([
    {
      id: 'AST-001',
      name: 'Dell Latitude 7420',
      type: 'Laptop',
      category: 'Computer',
      brand: 'Dell',
      model: 'Latitude 7420',
      serialNumber: 'DL742012345',
      status: 'IN_USE',
      location: 'Floor 3 - Finance',
      assignedTo: 'Sarah Johnson',
      purchaseDate: '2023-01-15',
      warrantyExpiry: '2026-01-15',
      cost: 1200,
      notes: 'Standard issue laptop for finance team',
    },
    {
      id: 'AST-002',
      name: 'HP LaserJet Pro',
      type: 'Printer',
      category: 'Peripheral',
      brand: 'HP',
      model: 'LaserJet Pro M404dn',
      serialNumber: 'HP404987654',
      status: 'AVAILABLE',
      location: 'IT Storage Room',
      assignedTo: null,
      purchaseDate: '2023-06-20',
      warrantyExpiry: '2026-06-20',
      cost: 350,
      notes: 'Backup printer',
    },
    {
      id: 'AST-003',
      name: 'Cisco Catalyst Switch',
      type: 'Network Device',
      category: 'Infrastructure',
      brand: 'Cisco',
      model: 'Catalyst 2960-X',
      serialNumber: 'CS2960X456',
      status: 'IN_USE',
      location: 'Server Room',
      assignedTo: null,
      purchaseDate: '2022-11-10',
      warrantyExpiry: '2025-11-10',
      cost: 2500,
      notes: 'Main network switch for floor 2',
    },
    {
      id: 'AST-004',
      name: 'Apple MacBook Pro',
      type: 'Laptop',
      category: 'Computer',
      brand: 'Apple',
      model: 'MacBook Pro 16" M2',
      serialNumber: 'MBP16M2ABC123',
      status: 'MAINTENANCE',
      location: 'IT Service Desk',
      assignedTo: 'John Doe',
      purchaseDate: '2023-09-01',
      warrantyExpiry: '2026-09-01',
      cost: 2800,
      notes: 'Under repair - screen replacement',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    category: '',
    brand: '',
    model: '',
    serialNumber: '',
    status: 'AVAILABLE',
    location: '',
    assignedTo: '',
    purchaseDate: '',
    warrantyExpiry: '',
    cost: '',
    notes: '',
  })

  const assetStats = {
    total: assets.length,
    inUse: assets.filter(a => a.status === 'IN_USE').length,
    available: assets.filter(a => a.status === 'AVAILABLE').length,
    maintenance: assets.filter(a => a.status === 'MAINTENANCE').length,
    retired: assets.filter(a => a.status === 'RETIRED').length,
  }

  const categoryData = [
    { name: 'Computers', value: assets.filter(a => a.category === 'Computer').length },
    { name: 'Peripherals', value: assets.filter(a => a.category === 'Peripheral').length },
    { name: 'Infrastructure', value: assets.filter(a => a.category === 'Infrastructure').length },
    { name: 'Other', value: assets.filter(a => !['Computer', 'Peripheral', 'Infrastructure'].includes(a.category)).length },
  ]

  const statusData = [
    { name: 'In Use', value: assetStats.inUse },
    { name: 'Available', value: assetStats.available },
    { name: 'Maintenance', value: assetStats.maintenance },
    { name: 'Retired', value: assetStats.retired },
  ]

  const handleCreateAsset = () => {
    const newAsset: Asset = {
      id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name: formData.name,
      type: formData.type,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      serialNumber: formData.serialNumber,
      status: formData.status,
      location: formData.location,
      assignedTo: formData.assignedTo || null,
      purchaseDate: formData.purchaseDate,
      warrantyExpiry: formData.warrantyExpiry,
      cost: parseFloat(formData.cost) || 0,
      notes: formData.notes,
    }
    setAssets([newAsset, ...assets])
    setCreateDialogOpen(false)
    setFormData({
      name: '', type: '', category: '', brand: '', model: '', serialNumber: '',
      status: 'AVAILABLE', location: '', assignedTo: '', purchaseDate: '',
      warrantyExpiry: '', cost: '', notes: ''
    })
  }

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setFormData({
      name: asset.name,
      type: asset.type,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serialNumber: asset.serialNumber,
      status: asset.status,
      location: asset.location,
      assignedTo: asset.assignedTo || '',
      purchaseDate: asset.purchaseDate,
      warrantyExpiry: asset.warrantyExpiry,
      cost: asset.cost.toString(),
      notes: asset.notes,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateAsset = () => {
    if (!selectedAsset) return
    const updatedAssets = assets.map(asset =>
      asset.id === selectedAsset.id
        ? {
            ...asset,
            ...formData,
            cost: parseFloat(formData.cost) || 0,
            assignedTo: formData.assignedTo || null,
          }
        : asset
    )
    setAssets(updatedAssets)
    setEditDialogOpen(false)
    setSelectedAsset(null)
  }

  const handleDeleteAsset = (assetId: string) => {
    setAssets(assets.filter(a => a.id !== assetId))
  }

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset)
    setViewDialogOpen(true)
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return 'default'
      case 'AVAILABLE':
        return 'secondary'
      case 'MAINTENANCE':
        return 'destructive'
      case 'RETIRED':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_USE':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'AVAILABLE':
        return <Package className="h-4 w-4 text-blue-600" />
      case 'MAINTENANCE':
        return <Clock className="h-4 w-4 text-orange-600" />
      case 'RETIRED':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || asset.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter
    const matchesTab = activeTab === 'all' || asset.status === activeTab
    return matchesSearch && matchesStatus && matchesCategory && matchesTab
  })

  return (
    <ITPageLayout 
      title="IT Assets" 
      description="Manage IT hardware, software, and infrastructure assets"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="IN_USE">In Use</TabsTrigger>
          <TabsTrigger value="AVAILABLE">Available</TabsTrigger>
          <TabsTrigger value="MAINTENANCE">Maintenance</TabsTrigger>
          <TabsTrigger value="RETIRED">Retired</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetStats.total}</div>
                <p className="text-xs text-muted-foreground">All assets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Use</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetStats.inUse}</div>
                <p className="text-xs text-muted-foreground">Currently assigned</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetStats.available}</div>
                <p className="text-xs text-muted-foreground">Ready to assign</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assetStats.maintenance}</div>
                <p className="text-xs text-muted-foreground">Under repair</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assets by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Assets by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#9333ea" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assets..."
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
                  <SelectItem value="IN_USE">In Use</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RETIRED">Retired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Computer">Computer</SelectItem>
                  <SelectItem value="Peripheral">Peripheral</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>
                    Register a new IT asset
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Asset Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Dell Latitude 7420"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Asset Type *</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laptop">Laptop</SelectItem>
                          <SelectItem value="Desktop">Desktop</SelectItem>
                          <SelectItem value="Server">Server</SelectItem>
                          <SelectItem value="Printer">Printer</SelectItem>
                          <SelectItem value="Monitor">Monitor</SelectItem>
                          <SelectItem value="Network Device">Network Device</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Computer">Computer</SelectItem>
                          <SelectItem value="Peripheral">Peripheral</SelectItem>
                          <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Input
                        id="brand"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g., Dell"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g., Latitude 7420"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="serialNumber">Serial Number *</Label>
                      <Input
                        id="serialNumber"
                        value={formData.serialNumber}
                        onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                        placeholder="Unique serial number"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AVAILABLE">Available</SelectItem>
                          <SelectItem value="IN_USE">In Use</SelectItem>
                          <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                          <SelectItem value="RETIRED">Retired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g., Floor 3 - Finance"
                      />
                    </div>
                    <div>
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Input
                        id="assignedTo"
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        placeholder="Employee name"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input
                        id="purchaseDate"
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                      <Input
                        id="warrantyExpiry"
                        type="date"
                        value={formData.warrantyExpiry}
                        onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cost">Cost ($)</Label>
                      <Input
                        id="cost"
                        type="number"
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Additional notes about this asset..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAsset}>
                      Add Asset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Assets Table */}
          <Card>
            <CardHeader>
              <CardTitle>IT Assets</CardTitle>
              <CardDescription>
                {filteredAssets.length} asset(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No assets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell className="font-medium">{asset.name}</TableCell>
                        <TableCell>{asset.type}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell className="font-mono text-sm">{asset.serialNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(asset.status)}
                            <Badge variant={getStatusBadgeVariant(asset.status)}>
                              {asset.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>{asset.assignedTo || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewAsset(asset)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteAsset(asset.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Asset Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
            <DialogDescription>
              Asset ID: {selectedAsset?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1 flex items-center gap-2">
                    {getStatusIcon(selectedAsset.status)}
                    <Badge variant={getStatusBadgeVariant(selectedAsset.status)}>
                      {selectedAsset.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="mt-1 text-sm">{selectedAsset.category}</p>
                </div>
                <div>
                  <Label>Brand</Label>
                  <p className="mt-1 text-sm">{selectedAsset.brand}</p>
                </div>
                <div>
                  <Label>Model</Label>
                  <p className="mt-1 text-sm">{selectedAsset.model}</p>
                </div>
                <div>
                  <Label>Serial Number</Label>
                  <p className="mt-1 text-sm font-mono">{selectedAsset.serialNumber}</p>
                </div>
                <div>
                  <Label>Location</Label>
                  <p className="mt-1 text-sm">{selectedAsset.location}</p>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <p className="mt-1 text-sm">{selectedAsset.assignedTo || <span className="text-muted-foreground">Unassigned</span>}</p>
                </div>
                <div>
                  <Label>Cost</Label>
                  <p className="mt-1 text-sm">${selectedAsset.cost.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Purchase Date</Label>
                  <p className="mt-1 text-sm">{new Date(selectedAsset.purchaseDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Warranty Expiry</Label>
                  <p className="mt-1 text-sm">{new Date(selectedAsset.warrantyExpiry).toLocaleDateString()}</p>
                </div>
              </div>
              {selectedAsset.notes && (
                <div>
                  <Label>Notes</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{selectedAsset.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Update asset information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="edit-name">Asset Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="IN_USE">In Use</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateAsset}>
                Update Asset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ITPageLayout>
  )
}


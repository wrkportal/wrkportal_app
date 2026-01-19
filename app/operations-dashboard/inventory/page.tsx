'use client'

import { useState, useEffect } from 'react'
import { OperationsPageLayout } from '@/components/operations/operations-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  MapPin,
  Eye,
  Edit,
  Trash2,
  ArrowUpDown,
  Share2,
  RotateCcw,
  FileText,
  MessageSquare,
  Wrench,
  MoreVertical
} from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

interface InventoryItem {
  id: string
  item: string
  category: string
  quantity: number
  location: string
  status: string
  reorderLevel: number
  notes?: string
  workOrderId?: string
  assignedTo?: string
}

interface DistributionRecord {
  id: string
  itemId: string
  itemName: string
  fromLocation: string
  toLocation: string
  quantity: number
  date: string
  workOrderId?: string
  notes?: string
  status: string
}

interface WorkOrderInventory {
  workOrderId: string
  workOrderName: string
  items: {
    itemId: string
    itemName: string
    quantity: number
    assignedDate: string
  }[]
  status: string
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  const [distribution, setDistribution] = useState<any[]>([])

  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([])

  const [workOrderInventory, setWorkOrderInventory] = useState<WorkOrderInventory[]>([])

  useEffect(() => {
    fetchInventory()
    fetchDistributionHistory()
    fetchDistribution()
  }, [activeTab])

  const fetchDistribution = async () => {
    try {
      // TODO: Create distribution summary API endpoint
      // For now, calculate from inventory items
      const response = await fetch('/api/operations/inventory')
      if (response.ok) {
        const data = await response.json()
        // Group by location and calculate stats
        const locationMap = new Map<string, { items: number, value: number }>()
        ;(data.items || []).forEach((item: any) => {
          const loc = item.location || 'Unknown'
          const current = locationMap.get(loc) || { items: 0, value: 0 }
          locationMap.set(loc, {
            items: current.items + 1,
            value: current.value + (item.unitCost ? Number(item.unitCost) * Number(item.quantity) : 0),
          })
        })
        const distributionData = Array.from(locationMap.entries()).map(([location, stats]) => ({
          location,
          items: stats.items,
          value: stats.value,
          utilization: 0, // Would need capacity data to calculate
        }))
        setDistribution(distributionData)
      } else {
        setDistribution([])
      }
    } catch (error) {
      console.error('Error fetching distribution:', error)
      setDistribution([])
    }
  }

  const fetchInventory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/inventory')
      if (!response.ok) {
        throw new Error('Failed to fetch inventory')
      }
      const data = await response.json()
      
      // Transform API data to match component interface
      const transformedInventory: InventoryItem[] = (data.items || []).map((item: any) => ({
        id: item.id,
        item: item.itemName,
        category: item.category,
        quantity: item.quantity,
        location: item.location,
        status: item.status,
        reorderLevel: item.reorderLevel,
        notes: item.notes || undefined,
        workOrderId: null, // Can be enhanced to fetch from distributions
        assignedTo: null, // Can be enhanced
      }))
      
      setInventory(transformedInventory)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDistributionHistory = async () => {
    try {
      const response = await fetch('/api/operations/inventory/distribution-history')
      if (response.ok) {
        const data = await response.json()
        const transformed: DistributionRecord[] = (data.distributions || []).map((dist: any) => ({
          id: dist.id,
          itemId: dist.itemId,
          itemName: dist.item?.itemName || dist.itemId,
          fromLocation: dist.fromLocation,
          toLocation: dist.toLocation,
          quantity: dist.quantity,
          date: new Date(dist.date).toISOString().split('T')[0],
          workOrderId: dist.workOrderId || undefined,
          notes: dist.notes || undefined,
          status: dist.status,
        }))
        setDistributionHistory(transformed)
      }
    } catch (error) {
      console.error('Error fetching distribution history:', error)
    }
  }

  const [distributeDialogOpen, setDistributeDialogOpen] = useState(false)
  const [redistributeDialogOpen, setRedistributeDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [distributionForm, setDistributionForm] = useState({
    itemId: '',
    fromLocation: '',
    toLocation: '',
    quantity: '',
    workOrderId: '',
    notes: '',
  })
  const [notesForm, setNotesForm] = useState({
    itemId: '',
    notes: '',
  })

  // Calculate category and status data from inventory
  const categoryData = inventory.reduce((acc, item) => {
    const existing = acc.find(c => c.name === item.category)
    if (existing) {
      existing.value += item.quantity
    } else {
      acc.push({ name: item.category, value: item.quantity })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  const statusData = inventory.reduce((acc, item) => {
    const statusName = item.status === 'IN_STOCK' ? 'In Stock' : 
                      item.status === 'LOW_STOCK' ? 'Low Stock' : 
                      'Out of Stock'
    const existing = acc.find(s => s.name === statusName)
    if (existing) {
      existing.value += 1
    } else {
      acc.push({ name: statusName, value: 1 })
    }
    return acc
  }, [] as Array<{ name: string; value: number }>)

  const handleDistribute = async () => {
    if (selectedItem && distributionForm.quantity && distributionForm.toLocation) {
      try {
        const response = await fetch('/api/operations/inventory/distribute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemId: selectedItem.id,
            fromLocation: selectedItem.location,
            toLocation: distributionForm.toLocation,
            quantity: parseInt(distributionForm.quantity),
            workOrderId: distributionForm.workOrderId || undefined,
            notes: distributionForm.notes || undefined,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to distribute inventory')
        }

        // Refresh inventory and distribution history
        await fetchInventory()
        await fetchDistributionHistory()
        
        setDistributeDialogOpen(false)
        setDistributionForm({ itemId: '', fromLocation: '', toLocation: '', quantity: '', workOrderId: '', notes: '' })
        setSelectedItem(null)
      } catch (error) {
        console.error('Error distributing inventory:', error)
        alert(error instanceof Error ? error.message : 'Failed to distribute inventory')
      }
    }
  }

  const handleRedistribute = () => {
    if (selectedItem && distributionForm.fromLocation && distributionForm.toLocation && distributionForm.quantity) {
      const newDistribution: DistributionRecord = {
        id: Date.now().toString(),
        itemId: selectedItem.id,
        itemName: selectedItem.item,
        fromLocation: distributionForm.fromLocation,
        toLocation: distributionForm.toLocation,
        quantity: parseInt(distributionForm.quantity),
        date: new Date().toISOString().split('T')[0],
        workOrderId: distributionForm.workOrderId || undefined,
        notes: distributionForm.notes || undefined,
        status: 'PENDING',
      }
      setDistributionHistory([newDistribution, ...distributionHistory])
      setRedistributeDialogOpen(false)
      setDistributionForm({ itemId: '', fromLocation: '', toLocation: '', quantity: '', workOrderId: '', notes: '' })
      setSelectedItem(null)
    }
  }

  const handleSaveNotes = async () => {
    if (selectedItem && notesForm.notes) {
      try {
        const response = await fetch(`/api/operations/inventory/${selectedItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            notes: notesForm.notes,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update notes')
        }

        // Refresh inventory
        await fetchInventory()
        
        setNotesDialogOpen(false)
        setNotesForm({ itemId: '', notes: '' })
        setSelectedItem(null)
      } catch (error) {
        console.error('Error saving notes:', error)
        alert(error instanceof Error ? error.message : 'Failed to save notes')
      }
    }
  }

  const locations = ['Warehouse A', 'Storage Room B', 'Storage Room C', 'Building A', 'Building B']

  return (
    <OperationsPageLayout 
      title="Inventory Management" 
      description="Track inventory distribution, status, manage stock levels, and work order allocations"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="workorders">Work Orders</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">710</div>
              <p className="text-xs text-muted-foreground">All inventory items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Stock</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">680</div>
              <p className="text-xs text-muted-foreground">95.8% availability</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">25</div>
              <p className="text-xs text-muted-foreground">Requires reorder</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Urgent restock needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Category</CardTitle>
              <CardDescription>Distribution of inventory items</CardDescription>
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
              <CardTitle>Inventory Status</CardTitle>
              <CardDescription>Stock level distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Distribution Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory Distribution</CardTitle>
            <CardDescription>Inventory status across locations</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribution.map((dist, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {dist.location}
                      </div>
                    </TableCell>
                    <TableCell>{dist.items}</TableCell>
                    <TableCell>${dist.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${dist.utilization}%` }} />
                        </div>
                        <span className="text-sm">{dist.utilization}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

            {/* Inventory Items Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Inventory Items</CardTitle>
                    <CardDescription>Manage inventory items and stock levels</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search inventory..."
                        className="pl-8 w-64"
                      />
                    </div>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Work Order</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.item}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.category}</Badge>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'IN_STOCK' ? 'default' : item.status === 'LOW_STOCK' ? 'destructive' : 'secondary'}>
                            {item.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.workOrderId ? (
                            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                              {item.workOrderId}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.notes ? (
                            <div className="flex items-center gap-1 max-w-xs">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground truncate">{item.notes}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => {
                                setSelectedItem(item)
                                setDistributionForm({ ...distributionForm, itemId: item.id, fromLocation: item.location })
                                setDistributeDialogOpen(true)
                              }}>
                                <Share2 className="mr-2 h-4 w-4" />
                                Distribute
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedItem(item)
                                setDistributionForm({ ...distributionForm, itemId: item.id })
                                setRedistributeDialogOpen(true)
                              }}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Redistribute
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedItem(item)
                                setNotesForm({ itemId: item.id, notes: item.notes || '' })
                                setNotesDialogOpen(true)
                              }}>
                                <FileText className="mr-2 h-4 w-4" />
                                Add/Edit Notes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
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
          </div>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Distribution History</CardTitle>
                  <CardDescription>Track all inventory distribution and redistribution activities</CardDescription>
                </div>
                <Button onClick={() => {
                  setSelectedItem(null)
                  setDistributionForm({ itemId: '', fromLocation: '', toLocation: '', quantity: '', workOrderId: '', notes: '' })
                  setDistributeDialogOpen(true)
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Distribution
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>From Location</TableHead>
                    <TableHead>To Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionHistory.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell className="font-medium">{dist.itemName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {dist.fromLocation}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {dist.toLocation}
                        </div>
                      </TableCell>
                      <TableCell>{dist.quantity}</TableCell>
                      <TableCell>
                        {dist.workOrderId ? (
                          <Badge variant="outline">{dist.workOrderId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{dist.date}</TableCell>
                      <TableCell>
                        <Badge variant={dist.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {dist.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dist.notes ? (
                          <div className="flex items-center gap-1 max-w-xs">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{dist.notes}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Orders Tab */}
        <TabsContent value="workorders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory by Work Order</CardTitle>
              <CardDescription>View inventory items allocated to specific work orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order ID</TableHead>
                    <TableHead>Work Order Name</TableHead>
                    <TableHead>Items Allocated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workOrderInventory.map((wo) => (
                    <TableRow key={wo.workOrderId}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-muted-foreground" />
                          {wo.workOrderId}
                        </div>
                      </TableCell>
                      <TableCell>{wo.workOrderName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {wo.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              <span>{item.itemName} (Qty: {item.quantity})</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wo.status === 'ACTIVE' ? 'default' : wo.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                          {wo.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Complete Distribution History</CardTitle>
              <CardDescription>All distribution and redistribution activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>From Location</TableHead>
                    <TableHead>To Location</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distributionHistory.map((dist) => (
                    <TableRow key={dist.id}>
                      <TableCell>{dist.date}</TableCell>
                      <TableCell className="font-medium">{dist.itemName}</TableCell>
                      <TableCell>{dist.fromLocation}</TableCell>
                      <TableCell>{dist.toLocation}</TableCell>
                      <TableCell>{dist.quantity}</TableCell>
                      <TableCell>
                        {dist.workOrderId ? (
                          <Badge variant="outline">{dist.workOrderId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={dist.status === 'COMPLETED' ? 'default' : 'secondary'}>
                          {dist.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {dist.notes ? (
                          <div className="flex items-center gap-1 max-w-xs">
                            <MessageSquare className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground truncate">{dist.notes}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Distribute Dialog */}
      <Dialog open={distributeDialogOpen} onOpenChange={setDistributeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Distribute Inventory</DialogTitle>
            <DialogDescription>
              Distribute inventory items from current location to another location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dist-item">Item</Label>
              <Input
                id="dist-item"
                value={selectedItem?.item || ''}
                disabled
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="dist-from">From Location</Label>
                <Input
                  id="dist-from"
                  value={distributionForm.fromLocation}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="dist-to">To Location *</Label>
                <Select
                  value={distributionForm.toLocation}
                  onValueChange={(value) => setDistributionForm({ ...distributionForm, toLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(loc => loc !== distributionForm.fromLocation).map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="dist-quantity">Quantity *</Label>
                <Input
                  id="dist-quantity"
                  type="number"
                  value={distributionForm.quantity}
                  onChange={(e) => setDistributionForm({ ...distributionForm, quantity: e.target.value })}
                  max={selectedItem?.quantity}
                  min={1}
                />
                {selectedItem && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Available: {selectedItem.quantity}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="dist-workorder">Work Order ID (Optional)</Label>
                <Input
                  id="dist-workorder"
                  value={distributionForm.workOrderId}
                  onChange={(e) => setDistributionForm({ ...distributionForm, workOrderId: e.target.value })}
                  placeholder="e.g., WO-123"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="dist-notes">Notes/Commentary</Label>
              <Textarea
                id="dist-notes"
                value={distributionForm.notes}
                onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                rows={3}
                placeholder="Add any notes or commentary about this distribution..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDistributeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDistribute}>
                Distribute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Redistribute Dialog */}
      <Dialog open={redistributeDialogOpen} onOpenChange={setRedistributeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Redistribute Inventory</DialogTitle>
            <DialogDescription>
              Move inventory items from one location to another
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="redis-item">Item</Label>
              <Input
                id="redis-item"
                value={selectedItem?.item || ''}
                disabled
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="redis-from">From Location *</Label>
                <Select
                  value={distributionForm.fromLocation}
                  onValueChange={(value) => setDistributionForm({ ...distributionForm, fromLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="redis-to">To Location *</Label>
                <Select
                  value={distributionForm.toLocation}
                  onValueChange={(value) => setDistributionForm({ ...distributionForm, toLocation: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.filter(loc => loc !== distributionForm.fromLocation).map((loc) => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="redis-quantity">Quantity *</Label>
                <Input
                  id="redis-quantity"
                  type="number"
                  value={distributionForm.quantity}
                  onChange={(e) => setDistributionForm({ ...distributionForm, quantity: e.target.value })}
                  min={1}
                />
              </div>
              <div>
                <Label htmlFor="redis-workorder">Work Order ID (Optional)</Label>
                <Input
                  id="redis-workorder"
                  value={distributionForm.workOrderId}
                  onChange={(e) => setDistributionForm({ ...distributionForm, workOrderId: e.target.value })}
                  placeholder="e.g., WO-123"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="redis-notes">Notes/Commentary</Label>
              <Textarea
                id="redis-notes"
                value={distributionForm.notes}
                onChange={(e) => setDistributionForm({ ...distributionForm, notes: e.target.value })}
                rows={3}
                placeholder="Add any notes or commentary about this redistribution..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRedistributeDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRedistribute}>
                Redistribute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add/Edit Notes</DialogTitle>
            <DialogDescription>
              Add notes or commentary for {selectedItem?.item}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes-item">Item</Label>
              <Input
                id="notes-item"
                value={selectedItem?.item || ''}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="notes-content">Notes/Commentary</Label>
              <Textarea
                id="notes-content"
                value={notesForm.notes}
                onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                rows={5}
                placeholder="Add any notes, commentary, or observations about this inventory item..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </OperationsPageLayout>
  )
}


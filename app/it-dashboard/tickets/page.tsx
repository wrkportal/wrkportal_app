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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Plus,
  Search,
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  User,
  Calendar,
  FileText,
  MessageSquare,
  MoreVertical,
  Eye,
  Edit,
  Tag,
  ArrowUpDown
} from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description: string
  priority: string
  status: string
  category: string
  requester: string
  assignee: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#ef4444', '#10b981']

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    category: '',
    requester: '',
  })

  const [ticketStats, setTicketStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  })

  useEffect(() => {
    fetchTickets()
  }, [activeTab, statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (activeTab !== 'all') {
        if (activeTab === 'OPEN') params.append('status', 'TO_DO')
        else if (activeTab === 'IN_PROGRESS') params.append('status', 'IN_PROGRESS')
        else if (activeTab === 'RESOLVED') params.append('status', 'DONE')
      }

      const response = await fetch(`/api/it/tickets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch tickets')
      const data = await response.json()
      setTickets(data.tickets || [])
      setTicketStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0 })
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setTickets([])
      setTicketStats({ total: 0, open: 0, inProgress: 0, resolved: 0 })
    } finally {
      setLoading(false)
    }
  }

  const priorityData = [
    { name: 'High', value: tickets.filter(t => t.priority === 'HIGH').length },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Low', value: tickets.filter(t => t.priority === 'LOW').length },
  ]

  const statusData = [
    { name: 'Open', value: ticketStats.open },
    { name: 'In Progress', value: ticketStats.inProgress },
    { name: 'Resolved', value: ticketStats.resolved },
  ]

  const handleCreateTicket = async () => {
    try {
      const response = await fetch('/api/it/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          category: formData.category,
        }),
      })
      if (!response.ok) throw new Error('Failed to create ticket')
      await fetchTickets()
      setCreateDialogOpen(false)
      setFormData({ title: '', description: '', priority: 'MEDIUM', category: '', requester: '' })
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const handleViewTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setViewDialogOpen(true)
  }

  const handleAssignTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setAssignDialogOpen(true)
  }

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase())

    // Map status for filtering
    const ticketStatus = ticket.status === 'TO_DO' ? 'OPEN' : ticket.status === 'DONE' ? 'RESOLVED' : ticket.status
    const matchesStatus = statusFilter === 'all' || ticketStatus === statusFilter
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter
    const matchesTab = activeTab === 'all' || ticketStatus === activeTab
    return matchesSearch && matchesStatus && matchesPriority && matchesTab
  })

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'TO_DO':
      case 'OPEN':
        return 'destructive'
      case 'IN_PROGRESS':
        return 'default'
      case 'DONE':
      case 'RESOLVED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'TO_DO':
        return 'OPEN'
      case 'DONE':
        return 'RESOLVED'
      default:
        return status
    }
  }

  return (
    <ITPageLayout
      title="Service Tickets"
      description="Manage support tickets and service requests"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Tickets</TabsTrigger>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
        </TabsList>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading tickets...</div>
          </div>
        )}

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.total}</div>
                <p className="text-xs text-muted-foreground">All tickets</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.open}</div>
                <p className="text-xs text-muted-foreground">Requiring attention</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.inProgress}</div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketStats.resolved}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Tickets by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
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
                <CardTitle>Tickets by Status</CardTitle>
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
                  placeholder="Search tickets..."
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
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                  <DialogDescription>
                    Submit a new support ticket
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief description of the issue"
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hardware">Hardware</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Network">Network</SelectItem>
                          <SelectItem value="Access Management">Access Management</SelectItem>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Low</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      placeholder="Detailed description of the issue..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="requester">Requester</Label>
                    <Input
                      id="requester"
                      value={formData.requester}
                      onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                      placeholder="Name of the person reporting the issue"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTicket}>
                      Create Ticket
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Tickets Table */}
          <Card>
            <CardHeader>
              <CardTitle>Service Tickets</CardTitle>
              <CardDescription>
                {filteredTickets.length} ticket(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requester</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No tickets found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.id}</TableCell>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        <TableCell>{ticket.category}</TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(ticket.status)}>
                            {formatStatus(ticket.status).replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.requester}</TableCell>
                        <TableCell>{ticket.assignee || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                        <TableCell>{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
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
                              <DropdownMenuItem onClick={() => handleViewTicket(ticket)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAssignTicket(ticket)}>
                                <User className="mr-2 h-4 w-4" />
                                Assign
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="mr-2 h-4 w-4" />
                                Change Status
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

      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.title}</DialogTitle>
            <DialogDescription>
              Ticket ID: {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedTicket.status)}>
                      {selectedTicket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Priority</Label>
                  <div className="mt-1">
                    <Badge variant={getPriorityBadgeVariant(selectedTicket.priority)}>
                      {selectedTicket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <p className="mt-1 text-sm">{selectedTicket.category}</p>
                </div>
                <div>
                  <Label>Requester</Label>
                  <p className="mt-1 text-sm">{selectedTicket.requester}</p>
                </div>
                <div>
                  <Label>Assignee</Label>
                  <p className="mt-1 text-sm">{selectedTicket.assignee || <span className="text-muted-foreground">Unassigned</span>}</p>
                </div>
                <div>
                  <Label>Created</Label>
                  <p className="mt-1 text-sm">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="mt-1 text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Ticket Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Assign ticket {selectedTicket?.id} to a staff member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="assignee">Assignee</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john-doe">John Doe</SelectItem>
                  <SelectItem value="jane-smith">Jane Smith</SelectItem>
                  <SelectItem value="bob-wilson">Bob Wilson</SelectItem>
                  <SelectItem value="alice-brown">Alice Brown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                // Handle assignment
                setAssignDialogOpen(false)
              }}>
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ITPageLayout>
  )
}


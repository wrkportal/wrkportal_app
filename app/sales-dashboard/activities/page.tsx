'use client'

import { useState, useEffect } from 'react'
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
import { Activity, Plus, Search, Phone, Mail, Calendar, CheckCircle2, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { SmartRepliesPanel } from '@/components/sales/smart-replies-panel'
import { useAuthStore } from '@/stores/authStore'

interface ActivityItem {
  id: string
  type: string
  subject: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedDate: string | null
  duration: number | null
  location: string | null
  account: {
    id: string
    name: string
  } | null
  contact: {
    id: string
    firstName: string
    lastName: string
  } | null
  lead: {
    id: string
    firstName: string
    lastName: string
  } | null
  opportunity: {
    id: string
    name: string
  } | null
  assignedTo: {
    id: string
    name: string | null
    email: string
  }
}

export default function ActivitiesPage() {
  const user = useAuthStore((state) => state.user)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const [formData, setFormData] = useState({
    type: 'TASK',
    subject: '',
    description: '',
    status: 'PLANNED',
    priority: 'MEDIUM',
    dueDate: '',
    duration: '',
    location: '',
    accountId: '',
    contactId: '',
    leadId: '',
    opportunityId: '',
  })

  useEffect(() => {
    fetchActivities()
  }, [typeFilter, statusFilter])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/sales/activities?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch activities' }))
        console.error('Error fetching activities:', errorData)
        setActivities([])
        return
      }

      const data = await response.json()
      setActivities(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/sales/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsDialogOpen(false)
        setFormData({
          type: 'TASK',
          subject: '',
          description: '',
          status: 'PLANNED',
          priority: 'MEDIUM',
          dueDate: '',
          duration: '',
          location: '',
          accountId: '',
          contactId: '',
          leadId: '',
          opportunityId: '',
        })
        fetchActivities()
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <Phone className="h-4 w-4" />
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      case 'MEETING':
        return <Calendar className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PLANNED: { variant: 'secondary', label: 'Planned' },
      IN_PROGRESS: { variant: 'default', label: 'In Progress' },
      COMPLETED: { variant: 'default', label: 'Completed' },
      CANCELLED: { variant: 'destructive', label: 'Cancelled' },
      DEFERRED: { variant: 'outline', label: 'Deferred' },
    }
    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-blue-100 text-blue-800',
    }
    return <Badge className={colors[priority]}>{priority}</Badge>
  }

  return (
    <SalesPageLayout
      title="Activity Tracking"
      description="Track calls, emails, meetings, notes, and tasks"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log New Activity</DialogTitle>
              <DialogDescription>
                Record a call, email, meeting, task, or note
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Activity Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CALL">Call</SelectItem>
                      <SelectItem value="EMAIL">Email</SelectItem>
                      <SelectItem value="MEETING">Meeting</SelectItem>
                      <SelectItem value="TASK">Task</SelectItem>
                      <SelectItem value="NOTE">Note</SelectItem>
                      <SelectItem value="EVENT">Event</SelectItem>
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
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                />
              </div>
              {formData.type === 'EMAIL' && (
                <div>
                  <SmartRepliesPanel
                    subject={formData.subject || ''}
                    body={formData.description || ''}
                    from={user?.email || ''}
                    to=""
                    leadId={formData.leadId || undefined}
                    opportunityId={formData.opportunityId || undefined}
                    accountId={formData.accountId || undefined}
                    onSelectReply={(reply) => {
                      setFormData({ ...formData, description: reply })
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Log Activity</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="NOTE">Note</SelectItem>
                <SelectItem value="EVENT">Event</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
                <SelectItem value="DEFERRED">Deferred</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activities ({activities.length})</CardTitle>
          <CardDescription>Track all sales activities and interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found. Log your first activity to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(activity.type)}
                        <span>{activity.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{activity.subject}</TableCell>
                    <TableCell>
                      {activity.account && (
                        <div className="text-sm">Account: {activity.account.name}</div>
                      )}
                      {activity.contact && (
                        <div className="text-sm">
                          Contact: {activity.contact.firstName} {activity.contact.lastName}
                        </div>
                      )}
                      {activity.lead && (
                        <div className="text-sm">
                          Lead: {activity.lead.firstName} {activity.lead.lastName}
                        </div>
                      )}
                      {activity.opportunity && (
                        <div className="text-sm">Opportunity: {activity.opportunity.name}</div>
                      )}
                      {!activity.account && !activity.contact && !activity.lead && !activity.opportunity && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getPriorityBadge(activity.priority)}</TableCell>
                    <TableCell>{getStatusBadge(activity.status)}</TableCell>
                    <TableCell>
                      {activity.dueDate
                        ? format(new Date(activity.dueDate), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>{activity.assignedTo.name || activity.assignedTo.email}</TableCell>
                    <TableCell>
                      {activity.status === 'COMPLETED' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </SalesPageLayout>
  )
}


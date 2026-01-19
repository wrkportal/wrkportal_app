'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  MoreVertical,
  Mail,
  CheckSquare,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Settings,
  FileText,
  Send,
  PhoneCall,
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  Users,
  Target,
  Upload,
  Building2,
} from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

interface Lead {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  mobile: string | null
  company: string | null
  title: string | null
  industry: string | null
  leadSource: string
  status: string
  rating: string
  score: number
  description: string | null
  nextContactDate: string | null
  customFields?: Record<string, any> | null
  createdAt: string
  updatedAt: string
  assignedTo: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  } | null
  owner: {
    id: string
    name: string | null
    email: string
  }
  activities: Array<{
    id: string
    type: string
    subject: string
    description: string | null
    status: string
    dueDate: string | null
    createdAt: string
    assignedTo: {
      id: string
      name: string | null
      email: string
    }
  }>
}

export default function LeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const leadId = params?.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [noteText, setNoteText] = useState('')
  const [creatingNote, setCreatingNote] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [nextContactDateTemp, setNextContactDateTemp] = useState<string>('')
  const [savingNextContactDate, setSavingNextContactDate] = useState(false)
  
  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [callDialogOpen, setCallDialogOpen] = useState(false)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  
  // Form states
  const [activityForm, setActivityForm] = useState({
    subject: '',
    description: '',
    dueDate: '',
    duration: '',
    location: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
  })

  useEffect(() => {
    if (leadId) {
      fetchLead()
    }
  }, [leadId])

  useEffect(() => {
    if (lead?.nextContactDate) {
      setNextContactDateTemp(new Date(lead.nextContactDate).toISOString().slice(0, 16))
    } else {
      setNextContactDateTemp('')
    }
  }, [lead?.nextContactDate])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/leads/${leadId}`)
      if (response.ok) {
        const data = await response.json()
        setLead(data)
      } else {
        console.error('Failed to fetch lead')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateActivity = async (type: string, formData: any) => {
    if (!leadId) return

    try {
      const response = await fetch('/api/sales/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: formData.subject || `${type} with ${lead?.firstName} ${lead?.lastName}`,
          description: formData.description || null,
          status: type === 'NOTE' ? 'COMPLETED' : 'PLANNED',
          priority: formData.priority || 'MEDIUM',
          dueDate: formData.dueDate || null,
          duration: formData.duration || null,
          location: formData.location || null,
          leadId: leadId,
        }),
      })

      if (response.ok) {
        // Close dialog and reset form
        setNoteDialogOpen(false)
        setEmailDialogOpen(false)
        setCallDialogOpen(false)
        setTaskDialogOpen(false)
        setMeetingDialogOpen(false)
        setActivityForm({
          subject: '',
          description: '',
          dueDate: '',
          duration: '',
          location: '',
          priority: 'MEDIUM',
        })
        setNoteText('')
        // Refresh lead data to show new activity
        fetchLead()
      } else {
        console.error('Failed to create activity')
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  const handleCreateNote = async () => {
    if (!noteText.trim() || !leadId) return
    await handleCreateActivity('NOTE', {
      subject: `Note: ${lead?.firstName} ${lead?.lastName}`,
      description: noteText,
    })
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!leadId || !lead) return

    setUpdatingStatus(true)
    try {
      const response = await fetch(`/api/sales/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedLead = await response.json()
        setLead({ ...lead, status: updatedLead.status })
      } else {
        console.error('Failed to update lead status')
        alert('Failed to update lead status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating lead status:', error)
      alert('Error updating lead status. Please try again.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleOpenEmail = () => {
    if (lead?.email) {
      window.location.href = `mailto:${lead.email}`
    }
    setEmailDialogOpen(true)
  }

  const handleOpenCall = () => {
    if (lead?.phone || lead?.mobile) {
      window.location.href = `tel:${lead.phone || lead.mobile}`
    }
    setCallDialogOpen(true)
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NEW: 'default',
      CONTACTED: 'secondary',
      QUALIFIED: 'default',
      CONVERTED: 'success',
      UNQUALIFIED: 'destructive',
      NURTURING: 'outline',
    }
    return <Badge variant={variants[status] as any}>{status}</Badge>
  }

  const getRatingBadge = (rating: string) => {
    const colors: Record<string, string> = {
      HOT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      WARM: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      COLD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    }
    return <Badge className={colors[rating]}>{rating}</Badge>
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      NEW: 'New',
      CONTACTED: 'Contacted',
      QUALIFIED: 'Qualified',
      CONVERTED: 'Converted',
      UNQUALIFIED: 'Unqualified',
      NURTURING: 'Nurturing',
    }
    return labels[status] || status
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <SalesPageLayout title="Lead Details" description="View and manage lead information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium">Loading lead...</div>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  if (!lead) {
    return (
      <SalesPageLayout title="Lead Details" description="View and manage lead information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Lead not found</div>
            <Button onClick={() => router.push('/sales-dashboard/leads')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Leads
            </Button>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  return (
    <SalesPageLayout title="Lead Details" description="View and manage lead information">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/sales-dashboard/leads')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Leads
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenCall}>
                  <PhoneCall className="mr-2 h-4 w-4" />
                  Log Call
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMeetingDialogOpen(true)}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Schedule Meeting
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTaskDialogOpen(true)}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Create Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={lead.assignedTo?.avatar || undefined} />
                      <AvatarFallback className="text-lg">
                        {getInitials(lead.firstName, lead.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">
                        {lead.firstName} {lead.lastName}
                      </CardTitle>
                      {lead.title && (
                        <CardDescription className="text-base mt-1">{lead.title}</CardDescription>
                      )}
                      {lead.email && (
                        <div className="flex items-center gap-2 mt-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {lead.email}
                            <Copy className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Note
                  </Button>
                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Task
                  </Button>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Meeting
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="mr-2 h-4 w-4" />
                    More
                  </Button>
                </div>

                {/* About This Lead */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">About this lead</h3>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <div className="text-sm mt-1">{lead.email || '--'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone number</Label>
                      <div className="text-sm mt-1">{lead.phone || lead.mobile || '--'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Company</Label>
                      <div className="text-sm mt-1">{lead.company || '--'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Industry</Label>
                      <div className="text-sm mt-1">{lead.industry || '--'}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Lead Source</Label>
                      <div className="text-sm mt-1">
                        <Badge variant="outline">{lead.leadSource}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Lead Status</Label>
                      <div className="text-sm mt-1">
                        <Select
                          value={lead.status}
                          onValueChange={handleStatusChange}
                          disabled={updatingStatus}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue>
                              {updatingStatus ? 'Updating...' : getStatusLabel(lead.status)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NEW">New</SelectItem>
                            <SelectItem value="CONTACTED">Contacted</SelectItem>
                            <SelectItem value="QUALIFIED">Qualified</SelectItem>
                            <SelectItem value="CONVERTED">Converted</SelectItem>
                            <SelectItem value="UNQUALIFIED">Unqualified</SelectItem>
                            <SelectItem value="NURTURING">Nurturing</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Rating</Label>
                      <div className="text-sm mt-1">{getRatingBadge(lead.rating)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Score</Label>
                      <div className="text-sm mt-1">
                        <Badge variant="secondary">{lead.score}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Assigned To</Label>
                      <div className="text-sm mt-1">
                        {lead.assignedTo?.name || lead.assignedTo?.email || 'Unassigned'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Create date</Label>
                      <div className="text-sm mt-1">{formatDate(lead.createdAt)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Contact Date</Label>
                      <div className="relative mt-1">
                        <Input
                          type="datetime-local"
                          value={nextContactDateTemp}
                          onChange={(e) => setNextContactDateTemp(e.target.value)}
                          className="pr-20"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs"
                          onClick={async () => {
                            setSavingNextContactDate(true)
                            let newDate: string | null = null
                            if (nextContactDateTemp && nextContactDateTemp.trim() !== '') {
                              try {
                                const dateObj = new Date(nextContactDateTemp)
                                if (!isNaN(dateObj.getTime())) {
                                  newDate = dateObj.toISOString()
                                }
                              } catch (error) {
                                console.error('Invalid date:', error)
                              }
                            }
                            try {
                              const response = await fetch(`/api/sales/leads/${leadId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ nextContactDate: newDate }),
                              })
                            if (response.ok) {
                              const updatedLead = await response.json()
                              setLead({ ...lead, nextContactDate: updatedLead.nextContactDate })
                              // Trigger a custom event to refresh tasks in the sales dashboard
                              if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('refreshSalesTasks'))
                              }
                            } else {
                              const errorData = await response.json().catch(() => ({}))
                              console.error('Error updating next contact date:', errorData)
                              alert(errorData.error || 'Failed to update next contact date')
                            }
                            } catch (error) {
                              console.error('Error updating next contact date:', error)
                            } finally {
                              setSavingNextContactDate(false)
                            }
                          }}
                          disabled={savingNextContactDate}
                        >
                          {savingNextContactDate ? '...' : 'OK'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Custom Fields Section */}
                  {lead.customFields && Object.keys(lead.customFields).length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="text-lg font-semibold mb-4">Custom Fields</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(lead.customFields).map(([key, value]) => (
                          <div key={key}>
                            <Label className="text-xs text-muted-foreground">{key}</Label>
                            <div className="text-sm mt-1 break-words">
                              {String(value) || '--'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Card>
              <CardHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="activities">Activities</TabsTrigger>
                      <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
                    </TabsList>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  </div>

                  <TabsContent value="overview" className="mt-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Description</h3>
                        <p className="text-sm text-muted-foreground">
                          {lead.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activities" className="mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Search activities"
                            className="w-64"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex h-8 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                            <Button variant="ghost" size="sm" className="h-6 text-xs">All</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Notes</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Emails</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Calls</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Tasks</Button>
                            <Button variant="ghost" size="sm" className="h-6 text-xs">Meetings</Button>
                          </div>
                          <Button variant="ghost" size="sm">Collapse all</Button>
                        </div>
                      </div>

                      {/* Create Note Section */}
                      <div className="flex justify-end mb-4">
                        <Button onClick={() => setNoteDialogOpen(true)}>
                          <FileText className="mr-2 h-4 w-4" />
                          Create Note
                        </Button>
                      </div>

                      {/* Notes List */}
                      <div className="space-y-4">
                        {lead.activities && lead.activities.length > 0 ? (
                          lead.activities.map((activity) => (
                            <div key={activity.id} className="border rounded-lg p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <div className="font-medium">
                                    {activity.type} by {activity.assignedTo?.name || 'Unknown'}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {formatDate(activity.createdAt)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm mt-2">{activity.description || activity.subject}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No activities yet. Create your first note or activity.
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="intelligence" className="mt-6">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Intelligence features coming soon.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardHeader>
            </Card>
          </div>

          {/* Right Column - Summary & Related */}
          <div className="space-y-6">
            {/* Lead Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Lead summary</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                  Generated {formatDate(lead.updatedAt)}
                </div>
                <div className="text-sm mb-4">
                  {lead.description
                    ? lead.description
                    : 'There are no associated activities and further details are needed to provide a comprehensive summary.'}
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ask a question
                </Button>
              </CardContent>
            </Card>

            {/* Related Records */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accounts (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push('/sales-dashboard/accounts?create=true')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/sales-dashboard/accounts?upload=true')}
                    title="Upload Accounts"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  See the businesses or organizations associated with this lead.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contacts (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push('/sales-dashboard/contacts?create=true')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/sales-dashboard/contacts?upload=true')}
                    title="Upload Contacts"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Manage contacts associated with this lead.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Opportunities (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/sales-dashboard/opportunities?create=true&leadId=${leadId}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/sales-dashboard/opportunities?upload=true')}
                    title="Upload Opportunities"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Track the revenue opportunities associated with this lead.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quotes (0)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push('/sales-dashboard/quotes/new')}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    disabled
                    title="Quote upload coming soon"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Track the sales documents associated with this lead.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Note</DialogTitle>
            <DialogDescription>
              Add a note about {lead?.firstName} {lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note-subject">Subject</Label>
              <Input
                id="note-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Note subject"
              />
            </div>
            <div>
              <Label htmlFor="note-description">Description</Label>
              <Textarea
                id="note-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter your note..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateActivity('NOTE', activityForm)}>
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Email</DialogTitle>
            <DialogDescription>
              Log an email interaction with {lead?.firstName} {lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="email-description">Description / Notes</Label>
              <Textarea
                id="email-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter email details or notes..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateActivity('EMAIL', activityForm)}>
              Log Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>
              Log a call with {lead?.firstName} {lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="call-subject">Subject</Label>
              <Input
                id="call-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Call subject"
              />
            </div>
            <div>
              <Label htmlFor="call-description">Call Notes</Label>
              <Textarea
                id="call-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter call notes..."
                rows={6}
              />
            </div>
            <div>
              <Label htmlFor="call-duration">Duration (minutes)</Label>
              <Input
                id="call-duration"
                type="number"
                value={activityForm.duration}
                onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                placeholder="e.g., 15"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateActivity('CALL', activityForm)}>
              Log Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Create a task related to {lead?.firstName} {lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-subject">Subject *</Label>
              <Input
                id="task-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Task subject"
                required
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter task description..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input
                  id="task-due-date"
                  type="datetime-local"
                  value={activityForm.dueDate}
                  onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="task-priority">Priority</Label>
                <Select
                  value={activityForm.priority}
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') =>
                    setActivityForm({ ...activityForm, priority: value })
                  }
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateActivity('TASK', activityForm)}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={setMeetingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting with {lead?.firstName} {lead?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-subject">Subject *</Label>
              <Input
                id="meeting-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Meeting subject"
                required
              />
            </div>
            <div>
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter meeting details..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting-date">Date & Time</Label>
                <Input
                  id="meeting-date"
                  type="datetime-local"
                  value={activityForm.dueDate}
                  onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="meeting-duration">Duration (minutes)</Label>
                <Input
                  id="meeting-duration"
                  type="number"
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                  placeholder="e.g., 30"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="meeting-location">Location</Label>
              <Input
                id="meeting-location"
                value={activityForm.location}
                onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
                placeholder="Meeting location or video link"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleCreateActivity('MEETING', activityForm)}>
              Schedule Meeting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SalesPageLayout>
  )
}


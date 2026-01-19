'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
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
  DollarSign,
  TrendingUp,
  Target,
  Building2,
  Upload,
  Package,
} from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { PipelineStagesGuide } from '@/components/sales/pipeline-stages-guide'
import { StageTooltip } from '@/components/sales/stage-tooltip'
import { AIDealScore } from '@/components/sales/ai-deal-score'
import { SmartNotesProcessor } from '@/components/sales/smart-notes-processor'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'

interface Opportunity {
  id: string
  name: string
  description: string | null
  stage: string
  amount: number
  probability: number
  expectedCloseDate: string
  actualCloseDate: string | null
  type: string | null
  leadSource: string | null
  nextStep: string | null
  nextContactDate: string | null
  competitorInfo: string | null
  lossReason: string | null
  status: string
  createdAt: string
  updatedAt: string
  account: {
    id: string
    name: string
    type: string
  } | null
  owner: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  createdBy: {
    id: string
    name: string | null
    email: string
  }
  contacts: Array<{
    contact: {
      id: string
      firstName: string
      lastName: string
      email: string | null
    }
    role: string
    isPrimary: boolean
  }>
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
  quotes: Array<{
    id: string
    name: string
    totalAmount: number
  }>
  products: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    product: {
      id: string
      name: string
    }
  }>
}

export default function OpportunityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const opportunityId = params?.id as string

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [nextContactDateTemp, setNextContactDateTemp] = useState<string>('')
  const [savingNextContactDate, setSavingNextContactDate] = useState(false)
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)
  
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
    if (opportunityId) {
      fetchOpportunity()
    }
  }, [opportunityId])

  useEffect(() => {
    if (opportunity?.nextContactDate) {
      setNextContactDateTemp(new Date(opportunity.nextContactDate).toISOString().slice(0, 16))
    } else {
      setNextContactDateTemp('')
    }
  }, [opportunity?.nextContactDate])

  const fetchOpportunity = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales/opportunities/${opportunityId}`)
      if (response.ok) {
        const data = await response.json()
        setOpportunity(data)
      } else {
        console.error('Failed to fetch opportunity')
      }
    } catch (error) {
      console.error('Error fetching opportunity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStage = async (newStage: string) => {
    if (!opportunityId || !opportunity) return

    setIsUpdatingStage(true)
    try {
      const response = await fetch(`/api/sales/opportunities/${opportunityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage }),
      })

      if (response.ok) {
        const updated = await response.json()
        setOpportunity(updated)
      } else {
        const error = await response.json()
        alert(`Failed to update stage: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error updating stage:', error)
      alert('An error occurred while updating the stage. Please try again.')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  const handleCreateActivity = async (type: string, formData: any) => {
    if (!opportunityId) return

    try {
      const response = await fetch('/api/sales/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject: formData.subject || `${type} for ${opportunity?.name}`,
          description: formData.description || null,
          status: type === 'NOTE' ? 'COMPLETED' : 'PLANNED',
          priority: formData.priority || 'MEDIUM',
          dueDate: formData.dueDate || null,
          duration: formData.duration || null,
          location: formData.location || null,
          opportunityId: opportunityId,
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
        // Refresh opportunity data to show new activity
        fetchOpportunity()
      } else {
        console.error('Failed to create activity')
      }
    } catch (error) {
      console.error('Error creating activity:', error)
    }
  }

  const getInitials = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      PROSPECTING: 'bg-gray-100 text-gray-800',
      QUALIFICATION: 'bg-blue-100 text-blue-800',
      NEEDS_ANALYSIS: 'bg-purple-100 text-purple-800',
      VALUE_PROPOSITION: 'bg-indigo-100 text-indigo-800',
      ID_DECISION_MAKERS: 'bg-yellow-100 text-yellow-800',
      PERCEPTION_ANALYSIS: 'bg-orange-100 text-orange-800',
      PROPOSAL_PRICE_QUOTE: 'bg-pink-100 text-pink-800',
      NEGOTIATION_REVIEW: 'bg-red-100 text-red-800',
      CLOSED_WON: 'bg-green-100 text-green-800',
      CLOSED_LOST: 'bg-gray-100 text-gray-800',
    }
    return colors[stage] || 'bg-gray-100 text-gray-800'
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      OPEN: 'default',
      WON: 'success',
      LOST: 'destructive',
    }
    return <Badge variant={variants[status] as any}>{status}</Badge>
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <SalesPageLayout title="Opportunity Details" description="View and manage opportunity information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium">Loading opportunity...</div>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  if (!opportunity) {
    return (
      <SalesPageLayout title="Opportunity Details" description="View and manage opportunity information">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Opportunity not found</div>
            <Button onClick={() => router.push('/sales-dashboard/opportunities')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Opportunities
            </Button>
          </div>
        </div>
      </SalesPageLayout>
    )
  }

  const primaryContact = opportunity.contacts.find(c => c.isPrimary)?.contact || opportunity.contacts[0]?.contact

  return (
    <SalesPageLayout title="Opportunity Details" description="View and manage opportunity information">
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/sales-dashboard/opportunities')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Opportunities
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <PipelineStagesGuide />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-2">
            <Select
              value={opportunity.stage}
              onValueChange={handleUpdateStage}
              disabled={isUpdatingStage}
            >
              <SelectTrigger className="w-auto border-0 p-0 h-auto bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0">
                <div className="flex items-center gap-2 cursor-pointer">
                  <Badge className={getStageColor(opportunity.stage)}>
                    {opportunity.stage.replace(/_/g, ' ')}
                  </Badge>
                  <StageTooltip stage={opportunity.stage} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PROSPECTING">Prospecting</SelectItem>
                <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                <SelectItem value="VALUE_PROPOSITION">Value Proposition</SelectItem>
                <SelectItem value="ID_DECISION_MAKERS">ID Decision Makers</SelectItem>
                <SelectItem value="PERCEPTION_ANALYSIS">Perception Analysis</SelectItem>
                <SelectItem value="PROPOSAL_PRICE_QUOTE">Proposal/Price Quote</SelectItem>
                <SelectItem value="NEGOTIATION_REVIEW">Negotiation/Review</SelectItem>
                <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
              </SelectContent>
            </Select>
            {getStatusBadge(opportunity.status)}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
                  <Mail className="mr-2 h-4 w-4" />
                  Log Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCallDialogOpen(true)}>
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
          {/* Left Column - Opportunity Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Opportunity Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={opportunity.owner.avatar || undefined} />
                      <AvatarFallback className="text-lg">
                        {opportunity.owner.name ? getInitials(opportunity.owner.name) : 'OP'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{opportunity.name}</CardTitle>
                      {opportunity.account && (
                        <CardDescription className="text-base mt-1 flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {opportunity.account.name}
                        </CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(opportunity.amount)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.probability} className="w-24 h-2" />
                          <span className="text-sm text-muted-foreground">{opportunity.probability}%</span>
                        </div>
                        <AIDealScore opportunityId={opportunityId} compact={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <Button variant="outline" size="sm" onClick={() => setNoteDialogOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Note
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCallDialogOpen(true)}>
                    <PhoneCall className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTaskDialogOpen(true)}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Task
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMeetingDialogOpen(true)}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Meeting
                  </Button>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="mr-2 h-4 w-4" />
                    More
                  </Button>
                </div>

                {/* About This Opportunity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">About this opportunity</h3>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Amount</Label>
                      <div className="text-sm mt-1 font-semibold">{formatCurrency(opportunity.amount)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Probability</Label>
                      <div className="text-sm mt-1">{opportunity.probability}%</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Stage</Label>
                      <div className="text-sm mt-1">
                        <Select
                          value={opportunity.stage}
                          onValueChange={handleUpdateStage}
                          disabled={isUpdatingStage}
                        >
                          <SelectTrigger className="w-full h-8">
                            <div className="flex items-center gap-2">
                              <Badge className={getStageColor(opportunity.stage)}>
                                {opportunity.stage.replace(/_/g, ' ')}
                              </Badge>
                              <StageTooltip stage={opportunity.stage} />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PROSPECTING">Prospecting</SelectItem>
                            <SelectItem value="QUALIFICATION">Qualification</SelectItem>
                            <SelectItem value="NEEDS_ANALYSIS">Needs Analysis</SelectItem>
                            <SelectItem value="VALUE_PROPOSITION">Value Proposition</SelectItem>
                            <SelectItem value="ID_DECISION_MAKERS">ID Decision Makers</SelectItem>
                            <SelectItem value="PERCEPTION_ANALYSIS">Perception Analysis</SelectItem>
                            <SelectItem value="PROPOSAL_PRICE_QUOTE">Proposal/Price Quote</SelectItem>
                            <SelectItem value="NEGOTIATION_REVIEW">Negotiation/Review</SelectItem>
                            <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                            <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="text-sm mt-1">{getStatusBadge(opportunity.status)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Expected Close Date</Label>
                      <div className="text-sm mt-1">{formatDate(opportunity.expectedCloseDate)}</div>
                    </div>
                    {opportunity.actualCloseDate && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Actual Close Date</Label>
                        <div className="text-sm mt-1">{formatDate(opportunity.actualCloseDate)}</div>
                      </div>
                    )}
                    {opportunity.type && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <div className="text-sm mt-1">{opportunity.type}</div>
                      </div>
                    )}
                    {opportunity.leadSource && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Lead Source</Label>
                        <div className="text-sm mt-1">
                          <Badge variant="outline">{opportunity.leadSource}</Badge>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Owner</Label>
                      <div className="text-sm mt-1">
                        {opportunity.owner.name || opportunity.owner.email}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created By</Label>
                      <div className="text-sm mt-1">
                        {opportunity.createdBy?.name || opportunity.createdBy?.email || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created Date</Label>
                      <div className="text-sm mt-1">{formatDate(opportunity.createdAt)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Updated</Label>
                      <div className="text-sm mt-1">{formatDate(opportunity.updatedAt)}</div>
                    </div>
                  </div>
                  {opportunity.nextStep && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Next Step</Label>
                      <div className="text-sm mt-1">{opportunity.nextStep}</div>
                    </div>
                  )}
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
                            const response = await fetch(`/api/sales/opportunities/${opportunity.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nextContactDate: newDate }),
                            })
                            if (response.ok) {
                              const updatedOpportunity = await response.json()
                              setOpportunity({ ...opportunity, nextContactDate: updatedOpportunity.nextContactDate })
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
                  {opportunity.competitorInfo && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Competitor Information</Label>
                      <div className="text-sm mt-1">{opportunity.competitorInfo}</div>
                    </div>
                  )}
                  {opportunity.lossReason && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Loss Reason</Label>
                      <div className="text-sm mt-1 text-red-600">{opportunity.lossReason}</div>
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
                          {opportunity.description || 'No description provided.'}
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

                      {/* Activities List */}
                      <div className="space-y-4">
                        {opportunity.activities && opportunity.activities.length > 0 ? (
                          opportunity.activities.map((activity) => (
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
            {/* AI Deal Score */}
            <AIDealScore opportunityId={opportunityId} />

            {/* Opportunity Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Opportunity summary</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground mb-4">
                  Generated {formatDate(opportunity.updatedAt)}
                </div>
                <div className="text-sm mb-4">
                  {opportunity.description
                    ? opportunity.description
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
                <CardTitle className="text-base">Accounts ({opportunity.account ? 1 : 0})</CardTitle>
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
                {opportunity.account ? (
                  <div className="text-sm">
                    <Link href={`/sales-dashboard/accounts/${opportunity.account.id}`} className="hover:underline">
                      {opportunity.account.name}
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Link an account to this opportunity.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contacts ({opportunity.contacts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/sales-dashboard/contacts?create=true&opportunityId=${opportunityId}`)}
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
                {opportunity.contacts.length > 0 ? (
                  <div className="space-y-2">
                    {opportunity.contacts.map((contactRel) => (
                      <div key={contactRel.contact.id} className="text-sm">
                        {contactRel.contact.firstName} {contactRel.contact.lastName}
                        {contactRel.isPrimary && (
                          <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    See the contacts associated with this opportunity.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quotes ({opportunity.quotes.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/sales-dashboard/quotes/new?opportunityId=${opportunityId}`)}
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
                {opportunity.quotes.length > 0 ? (
                  <div className="space-y-2">
                    {opportunity.quotes.map((quote) => (
                      <div key={quote.id} className="text-sm">
                        {quote.name} - {formatCurrency(quote.totalAmount)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Track the sales quotes associated with this opportunity.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Products ({opportunity.products.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => router.push(`/sales-dashboard/products?create=true&opportunityId=${opportunityId}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => router.push('/sales-dashboard/products?upload=true')}
                    title="Upload Products"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                {opportunity.products.length > 0 ? (
                  <div className="space-y-2">
                    {opportunity.products.map((product) => (
                      <div key={product.id} className="text-sm">
                        {product.product.name} - {product.quantity}x {formatCurrency(product.unitPrice)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Track the products associated with this opportunity.
                  </p>
                )}
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
              Add a note about {opportunity?.name}
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="note-description">Description</Label>
                <SmartNotesProcessor
                  noteContent={activityForm.description}
                  context={{
                    type: 'NOTE',
                    relatedToId: opportunityId,
                    relatedToType: 'OPPORTUNITY',
                  }}
                  onProcessed={(result) => {
                    // Auto-populate fields from processed result
                    if (result.summary && !activityForm.subject) {
                      setActivityForm({ ...activityForm, subject: result.summary.substring(0, 100) })
                    }
                    if (result.keyTakeaways.length > 0 && !activityForm.description) {
                      setActivityForm({
                        ...activityForm,
                        description: result.keyTakeaways.join('\n\n'),
                      })
                    }
                  }}
                />
              </div>
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
              Log an email interaction for {opportunity?.name}
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
              Log a call for {opportunity?.name}
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
              <Label htmlFor="call-description">Description / Notes</Label>
              <Textarea
                id="call-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter call details or notes..."
                rows={6}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="call-duration">Duration (minutes)</Label>
                <Input
                  id="call-duration"
                  type="number"
                  value={activityForm.duration}
                  onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                  placeholder="30"
                />
              </div>
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
              Create a task for {opportunity?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-subject">Subject</Label>
              <Input
                id="task-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Task subject"
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
                  onValueChange={(value: 'LOW' | 'MEDIUM' | 'HIGH') => setActivityForm({ ...activityForm, priority: value })}
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
              Schedule a meeting for {opportunity?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="meeting-subject">Subject</Label>
              <Input
                id="meeting-subject"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                placeholder="Meeting subject"
              />
            </div>
            <div>
              <Label htmlFor="meeting-description">Description</Label>
              <Textarea
                id="meeting-description"
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                placeholder="Enter meeting description..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meeting-due-date">Date & Time</Label>
                <Input
                  id="meeting-due-date"
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
                  placeholder="60"
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


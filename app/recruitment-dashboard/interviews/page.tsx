'use client'

import { useState, useEffect, Suspense } from 'react'
import { Loader2 } from 'lucide-react'
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
import { Calendar, Clock, Video, Users, Plus, Search, Edit, CheckCircle, XCircle, MoreVertical, Eye, RefreshCw, MessageSquare, Mail, User, X } from 'lucide-react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Interview {
  id: string
  candidateId: string
  candidateName: string
  jobTitle: string
  interviewer: string
  type: string
  status: string
  scheduledDate: string
  duration: number
  location: string | null
  notes: string | null
}

function InterviewsPageInner() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ interviewId: '', notes: '', rating: '' })
  const [formData, setFormData] = useState({
    candidateName: '',
    jobTitle: '',
    interviewer: '',
    type: 'PHONE',
    status: 'SCHEDULED',
    scheduledDate: '',
    duration: '60',
    location: '',
    notes: '',
  })

  useEffect(() => {
    fetchInterviews()
  }, [])

  const fetchInterviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recruitment/interviews')
      if (!response.ok) {
        throw new Error('Failed to fetch interviews')
      }
      const data = await response.json()
      setInterviews(data.interviews || [])
    } catch (error) {
      console.error('Error fetching interviews:', error)
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInterview = async () => {
    try {
      const interviewData = {
        candidateId: '1', // TODO: Get actual candidate ID from candidate selection
        candidateName: formData.candidateName,
        jobTitle: formData.jobTitle,
        interviewer: formData.interviewer,
        type: formData.type,
        status: formData.status,
        scheduledDate: formData.scheduledDate,
        duration: parseInt(formData.duration),
        location: formData.location || null,
        notes: formData.notes || null,
      }

      const response = await fetch('/api/recruitment/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create interview')
      }

      const data = await response.json()
      setInterviews([...interviews, data.interview])
      setIsDialogOpen(false)
      setFormData({
        candidateName: '',
        jobTitle: '',
        interviewer: '',
        type: 'PHONE',
        status: 'SCHEDULED',
        scheduledDate: '',
        duration: '60',
        location: '',
        notes: '',
      })
    } catch (error) {
      console.error('Error creating interview:', error)
    }
  }

  const handleRescheduleInterview = (interview: Interview) => {
    setSelectedInterview(interview)
    setFormData({
      candidateName: interview.candidateName,
      jobTitle: interview.jobTitle,
      interviewer: interview.interviewer,
      type: interview.type,
      status: 'SCHEDULED',
      scheduledDate: interview.scheduledDate.split('T')[0],
      duration: interview.duration.toString(),
      location: interview.location || '',
      notes: interview.notes || '',
    })
    setRescheduleDialogOpen(true)
  }

  const handleConfirmReschedule = async () => {
    if (!selectedInterview) return
    try {
      const dateTime = formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : selectedInterview.scheduledDate
      setInterviews(interviews.map(i =>
        i.id === selectedInterview.id
          ? { ...i, scheduledDate: dateTime, duration: parseInt(formData.duration), location: formData.location || null }
          : i
      ))
      setRescheduleDialogOpen(false)
      setSelectedInterview(null)
    } catch (error) {
      console.error('Error rescheduling interview:', error)
    }
  }

  const handleAddFeedback = (interview: Interview) => {
    setSelectedInterview(interview)
    setFeedbackData({ interviewId: interview.id, notes: interview.notes || '', rating: '' })
    setFeedbackDialogOpen(true)
  }

  const handleSaveFeedback = async () => {
    if (!selectedInterview) return
    try {
      setInterviews(interviews.map(i =>
        i.id === selectedInterview.id
          ? { ...i, notes: feedbackData.notes, status: 'COMPLETED' as any }
          : i
      ))
      setFeedbackDialogOpen(false)
      setSelectedInterview(null)
    } catch (error) {
      console.error('Error saving feedback:', error)
    }
  }

  const handleCancelInterview = async () => {
    if (!selectedInterview) return
    try {
      setInterviews(interviews.map(i =>
        i.id === selectedInterview.id
          ? { ...i, status: 'CANCELLED' as any }
          : i
      ))
      setCancelDialogOpen(false)
      setSelectedInterview(null)
    } catch (error) {
      console.error('Error cancelling interview:', error)
    }
  }

  const handleMarkComplete = (interview: Interview) => {
    setInterviews(interviews.map(i =>
      i.id === interview.id
        ? { ...i, status: 'COMPLETED' as any }
        : i
    ))
  }

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.interviewer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || interview.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: interviews.length,
    scheduled: interviews.filter((i) => i.status === 'SCHEDULED').length,
    completed: interviews.filter((i) => i.status === 'COMPLETED').length,
    cancelled: interviews.filter((i) => i.status === 'CANCELLED').length,
  }

  return (
    <RecruitmentPageLayout title="Interviews" description="Schedule and manage candidate interviews">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All interviews</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduled}</div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search interviews..."
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
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
                <DialogDescription>
                  Schedule a new interview with a candidate
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="candidateName">Candidate Name *</Label>
                    <Input
                      id="candidateName"
                      value={formData.candidateName}
                      onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title *</Label>
                    <Input
                      id="jobTitle"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="interviewer">Interviewer *</Label>
                    <Input
                      id="interviewer"
                      value={formData.interviewer}
                      onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Interview Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PHONE">Phone</SelectItem>
                        <SelectItem value="VIDEO">Video</SelectItem>
                        <SelectItem value="ONSITE">Onsite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="scheduledDate">Date & Time *</Label>
                    <Input
                      id="scheduledDate"
                      type="datetime-local"
                      value={formData.scheduledDate}
                      onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                      required
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
                  <Label htmlFor="location">Location / Link</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Office, Zoom link, etc."
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateInterview}>
                    Schedule Interview
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Interviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>Interviews</CardTitle>
            <CardDescription>
              Manage scheduled and completed interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredInterviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No interviews found. Schedule an interview to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Interviewer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInterviews.map((interview) => (
                    <TableRow key={interview.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/recruitment-dashboard/candidates/${interview.candidateId}`}
                          className="hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {interview.candidateName}
                        </Link>
                      </TableCell>
                      <TableCell>{interview.jobTitle}</TableCell>
                      <TableCell>{interview.interviewer}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {interview.type === 'VIDEO' && <Video className="h-3 w-3 mr-1" />}
                          {interview.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(interview.scheduledDate).toLocaleString()}
                      </TableCell>
                      <TableCell>{interview.duration} min</TableCell>
                      <TableCell>{interview.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={interview.status === 'COMPLETED' ? 'default' : interview.status === 'SCHEDULED' ? 'secondary' : 'outline'}>
                          {interview.status}
                        </Badge>
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
                            <DropdownMenuItem onClick={() => setSelectedInterview(interview)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRescheduleInterview(interview)}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Reschedule
                            </DropdownMenuItem>
                            {interview.status === 'SCHEDULED' && (
                              <>
                                <DropdownMenuItem onClick={() => handleMarkComplete(interview)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark Complete
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleAddFeedback(interview)}>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Add Feedback
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedInterview(interview)
                                    setCancelDialogOpen(true)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel Interview
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Mail className="mr-2 h-4 w-4" />
                              Send Reminder
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <User className="mr-2 h-4 w-4" />
                              View Candidate Profile
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

        {/* Reschedule Interview Dialog */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={formData.scheduledDate}
                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Location / Link</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Office, Zoom link, etc."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmReschedule}>Reschedule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Interview Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Feedback Notes</Label>
                <Textarea
                  value={feedbackData.notes}
                  onChange={(e) => setFeedbackData({ ...feedbackData, notes: e.target.value })}
                  rows={6}
                  placeholder="Add your interview feedback and notes here..."
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Select
                  value={feedbackData.rating}
                  onValueChange={(value) => setFeedbackData({ ...feedbackData, rating: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EXCELLENT">Excellent</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="AVERAGE">Average</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveFeedback}>Save Feedback</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Interview Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Interview</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this interview with {selectedInterview?.candidateName}?
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>No, Keep It</Button>
              <Button variant="destructive" onClick={handleCancelInterview}>Yes, Cancel</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}

export default function InterviewsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <InterviewsPageInner />
    </Suspense>
  )
}

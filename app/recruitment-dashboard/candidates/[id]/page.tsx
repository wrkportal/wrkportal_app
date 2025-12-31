'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import {
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  Linkedin,
  Download,
  Calendar,
  Briefcase,
  Target,
  User,
  FileText,
  Award,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  Clock,
  Circle,
  Send,
} from 'lucide-react'

interface Candidate {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  linkedin: string | null
  position: string | null
  status: string
  source: string
  experience: number | null
  rating: string
  resume: string | null
  notes: string | null
  createdAt: string
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const candidateId = params.id as string

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [offerDialogOpen, setOfferDialogOpen] = useState(false)
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    linkedin: '',
    position: '',
    source: 'WEBSITE',
    status: 'APPLIED',
    experience: '',
    rating: 'AVERAGE',
    notes: '',
  })
  const [offerData, setOfferData] = useState({
    jobTitle: '',
    offerAmount: '',
    startDate: '',
    notes: '',
  })
  const [interviewData, setInterviewData] = useState({
    date: '',
    time: '',
    type: 'VIDEO',
    interviewer: '',
    location: '',
    notes: '',
  })
  const [statusData, setStatusData] = useState({ newStatus: '' })
  const [emailData, setEmailData] = useState({ subject: '', body: '' })
  const [notesData, setNotesData] = useState({ notes: '' })

  const candidateStages = [
    { id: 'APPLIED', label: 'Applied' },
    { id: 'SCREENING', label: 'Screening' },
    { id: 'INTERVIEW', label: 'Interview' },
    { id: 'OFFER', label: 'Offer' },
    { id: 'HIRED', label: 'Hired' },
  ]

  useEffect(() => {
    fetchCandidate()
  }, [candidateId])

  useEffect(() => {
    if (candidate) {
      setFormData({
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone || '',
        linkedin: candidate.linkedin || '',
        position: candidate.position || '',
        source: candidate.source,
        status: candidate.status,
        experience: candidate.experience?.toString() || '',
        rating: candidate.rating,
        notes: candidate.notes || '',
      })
    }
  }, [candidate])

  const fetchCandidate = async () => {
    try {
      setLoading(true)
      // Mock data - replace with API call
      const mockCandidates: Candidate[] = [
        {
          id: '1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          linkedin: 'linkedin.com/in/johndoe',
          position: 'Software Engineer',
          status: 'INTERVIEW',
          source: 'LINKEDIN',
          experience: 5,
          rating: 'HIGH',
          resume: null,
          notes: 'Strong technical background',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567891',
          linkedin: 'linkedin.com/in/janesmith',
          position: 'Product Manager',
          status: 'OFFER',
          source: 'REFERRAL',
          experience: 7,
          rating: 'HIGH',
          resume: null,
          notes: 'Excellent communication skills',
          createdAt: new Date().toISOString(),
        },
      ]
      const foundCandidate = mockCandidates.find(c => c.id === candidateId)
      setCandidate(foundCandidate || null)
    } catch (error) {
      console.error('Error fetching candidate:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPLIED':
        return 'default'
      case 'SCREENING':
        return 'secondary'
      case 'INTERVIEW':
        return 'default'
      case 'OFFER':
        return 'default'
      case 'HIRED':
        return 'default'
      case 'REJECTED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getRatingBadgeVariant = (rating: string) => {
    switch (rating) {
      case 'HIGH':
        return 'default'
      case 'AVERAGE':
        return 'secondary'
      case 'LOW':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const handleEditCandidate = () => {
    setEditDialogOpen(true)
  }

  const handleUpdateCandidate = async () => {
    if (!candidate) return
    try {
      // TODO: Update candidate via API
      const updatedCandidate: Candidate = {
        ...candidate,
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
        phone: formData.phone || null,
        linkedin: formData.linkedin || null,
        position: formData.position || null,
        notes: formData.notes || null,
      }
      setCandidate(updatedCandidate)
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating candidate:', error)
    }
  }

  const handleSendOffer = () => {
    setOfferDialogOpen(true)
  }

  const handleSubmitOffer = async () => {
    try {
      // TODO: Create offer via API
      setOfferDialogOpen(false)
      setOfferData({ jobTitle: '', offerAmount: '', startDate: '', notes: '' })
      // Update candidate status to OFFER
      if (candidate) {
        setCandidate({ ...candidate, status: 'OFFER' })
      }
    } catch (error) {
      console.error('Error sending offer:', error)
    }
  }

  const handleScheduleInterview = () => {
    setInterviewDialogOpen(true)
  }

  const handleSubmitInterview = async () => {
    try {
      // TODO: Schedule interview via API
      setInterviewDialogOpen(false)
      setInterviewData({ date: '', time: '', type: 'VIDEO', interviewer: '', location: '', notes: '' })
      // Navigate to interviews page or show success message
      router.push('/recruitment-dashboard/interviews')
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const handleChangeStatus = () => {
    setStatusData({ newStatus: candidate?.status || '' })
    setStatusDialogOpen(true)
  }

  const handleSubmitStatusChange = async () => {
    if (!candidate) return
    try {
      // TODO: Update status via API
      setCandidate({ ...candidate, status: statusData.newStatus as any })
      setStatusDialogOpen(false)
    } catch (error) {
      console.error('Error changing status:', error)
    }
  }

  const handleSendEmail = () => {
    setEmailData({ subject: '', body: '' })
    setEmailDialogOpen(true)
  }

  const handleSubmitEmail = async () => {
    try {
      // TODO: Send email via API
      setEmailDialogOpen(false)
      setEmailData({ subject: '', body: '' })
    } catch (error) {
      console.error('Error sending email:', error)
    }
  }

  const handleAddNotes = () => {
    setNotesData({ notes: candidate?.notes || '' })
    setNotesDialogOpen(true)
  }

  const handleSubmitNotes = async () => {
    if (!candidate) return
    try {
      // TODO: Update notes via API
      setCandidate({ ...candidate, notes: notesData.notes || null })
      setNotesDialogOpen(false)
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const handleDownloadResume = () => {
    if (candidate?.resume) {
      // TODO: Download resume via API
      window.open(candidate.resume, '_blank')
    }
  }

  if (loading) {
    return (
      <RecruitmentPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading candidate details...</div>
        </div>
      </RecruitmentPageLayout>
    )
  }

  if (!candidate) {
    return (
      <RecruitmentPageLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Candidate not found</div>
          <Button onClick={() => router.push('/recruitment-dashboard/candidates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Candidates
          </Button>
        </div>
      </RecruitmentPageLayout>
    )
  }

  const fullName = `${candidate.firstName} ${candidate.lastName}`

  return (
    <RecruitmentPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/recruitment-dashboard/candidates')}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{fullName}</h1>
                  <Badge variant={getStatusBadgeVariant(candidate.status)}>
                    {candidate.status}
                  </Badge>
                  <Badge variant={getRatingBadgeVariant(candidate.rating)}>
                    {candidate.rating} Rating
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {candidate.position && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {candidate.position}
                    </div>
                  )}
                  {candidate.experience !== null && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {candidate.experience} years experience
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    Source: {candidate.source.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <MoreVertical className="mr-2 h-4 w-4" />
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEditCandidate}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Candidate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleScheduleInterview}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendOffer}>
                  <Award className="mr-2 h-4 w-4" />
                  Send Offer Letter
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleChangeStatus}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Change Status
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAddNotes}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Notes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendEmail}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Email
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDownloadResume} disabled={!candidate?.resume}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Resume
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={handleEditCandidate}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Candidate
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={getStatusBadgeVariant(candidate.status)}>
                  {candidate.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Current stage</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <Badge variant={getRatingBadgeVariant(candidate.rating)}>
                  {candidate.rating}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Candidate rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experience</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{candidate.experience || 'N/A'} years</div>
              <p className="text-xs text-muted-foreground">Years of experience</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Added Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(candidate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(candidate.createdAt).toLocaleDateString('en-US', { year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Full Name</Label>
                    <span className="text-sm font-medium">{fullName}</span>
                  </div>
                  {candidate.position && (
                    <div className="flex justify-between">
                      <Label>Position Applied</Label>
                      <span className="text-sm">{candidate.position}</span>
                    </div>
                  )}
                  {candidate.experience !== null && (
                    <div className="flex justify-between">
                      <Label>Experience</Label>
                      <span className="text-sm">{candidate.experience} years</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Label>Status</Label>
                    <Badge variant={getStatusBadgeVariant(candidate.status)}>
                      {candidate.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Label>Rating</Label>
                    <Badge variant={getRatingBadgeVariant(candidate.rating)}>
                      {candidate.rating}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <Label>Source</Label>
                    <span className="text-sm">{candidate.source.replace('_', ' ')}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Added Date</Label>
                    <span className="text-sm">
                      {new Date(candidate.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Status</Label>
                    <Badge variant={getStatusBadgeVariant(candidate.status)}>
                      {candidate.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label className="text-xs text-muted-foreground">Email</Label>
                    <a href={`mailto:${candidate.email}`} className="text-sm hover:underline block">
                      {candidate.email}
                    </a>
                  </div>
                </div>
                {candidate.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <a href={`tel:${candidate.phone}`} className="text-sm hover:underline block">
                        {candidate.phone}
                      </a>
                    </div>
                  </div>
                )}
                {candidate.linkedin && (
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">LinkedIn</Label>
                      <a
                        href={`https://${candidate.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm hover:underline block"
                      >
                        {candidate.linkedin}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.resume ? (
                  <div className="flex items-center justify-between border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Resume</p>
                        <p className="text-xs text-muted-foreground">
                          {candidate.resume.split('/').pop()}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No documents uploaded
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Notes & Comments</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.notes ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {candidate.notes}
                  </p>
                ) : (
                  <div className="text-center text-muted-foreground py-8 text-sm">
                    No notes available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Candidate Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Candidate</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-linkedin">LinkedIn</Label>
                  <Input
                    id="edit-linkedin"
                    value={formData.linkedin}
                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="edit-position">Position</Label>
                  <Input
                    id="edit-position"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-experience">Experience (years)</Label>
                  <Input
                    id="edit-experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
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
                      {candidateStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData({ ...formData, source: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="JOB_BOARD">Job Board</SelectItem>
                      <SelectItem value="RECRUITER">Recruiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-rating">Rating</Label>
                  <Select
                    value={formData.rating}
                    onValueChange={(value) => setFormData({ ...formData, rating: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="AVERAGE">Average</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateCandidate}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Offer Dialog */}
        <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Offer Letter</DialogTitle>
              <DialogDescription>
                Create and send an offer letter to {candidate?.firstName} {candidate?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="offer-jobTitle">Job Title *</Label>
                <Input
                  id="offer-jobTitle"
                  value={offerData.jobTitle}
                  onChange={(e) => setOfferData({ ...offerData, jobTitle: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="offer-amount">Offer Amount *</Label>
                <Input
                  id="offer-amount"
                  value={offerData.offerAmount}
                  onChange={(e) => setOfferData({ ...offerData, offerAmount: e.target.value })}
                  placeholder="$120,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="offer-startDate">Expected Start Date</Label>
                <Input
                  id="offer-startDate"
                  type="date"
                  value={offerData.startDate}
                  onChange={(e) => setOfferData({ ...offerData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="offer-notes">Additional Notes</Label>
                <Textarea
                  id="offer-notes"
                  value={offerData.notes}
                  onChange={(e) => setOfferData({ ...offerData, notes: e.target.value })}
                  rows={4}
                  placeholder="Any additional information about the offer..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOfferDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitOffer}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Offer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Interview Dialog */}
        <Dialog open={interviewDialogOpen} onOpenChange={setInterviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule Interview</DialogTitle>
              <DialogDescription>
                Schedule an interview with {candidate?.firstName} {candidate?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="interview-date">Date *</Label>
                  <Input
                    id="interview-date"
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="interview-time">Time *</Label>
                  <Input
                    id="interview-time"
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="interview-type">Interview Type</Label>
                  <Select
                    value={interviewData.type}
                    onValueChange={(value) => setInterviewData({ ...interviewData, type: value })}
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
                <div>
                  <Label htmlFor="interview-interviewer">Interviewer *</Label>
                  <Input
                    id="interview-interviewer"
                    value={interviewData.interviewer}
                    onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="interview-location">Location / Link</Label>
                <Input
                  id="interview-location"
                  value={interviewData.location}
                  onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                  placeholder="Office address or video call link"
                />
              </div>
              <div>
                <Label htmlFor="interview-notes">Notes</Label>
                <Textarea
                  id="interview-notes"
                  value={interviewData.notes}
                  onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitInterview}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Interview
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Candidate Status</DialogTitle>
              <DialogDescription>
                Update the recruitment stage for {candidate?.firstName} {candidate?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Status</Label>
                <Select
                  value={statusData.newStatus}
                  onValueChange={(value) => setStatusData({ newStatus: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {candidateStages.map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitStatusChange}>
                  Update Status
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Send Email Dialog */}
        <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Email</DialogTitle>
              <DialogDescription>
                Send an email to {candidate?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-subject">Subject *</Label>
                <Input
                  id="email-subject"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email-body">Message *</Label>
                <Textarea
                  id="email-body"
                  value={emailData.body}
                  onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                  rows={8}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitEmail}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Notes Dialog */}
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Notes</DialogTitle>
              <DialogDescription>
                Add or update notes for {candidate?.firstName} {candidate?.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes-content">Notes</Label>
                <Textarea
                  id="notes-content"
                  value={notesData.notes}
                  onChange={(e) => setNotesData({ notes: e.target.value })}
                  rows={8}
                  placeholder="Add your notes about this candidate..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitNotes}>
                  Save Notes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}


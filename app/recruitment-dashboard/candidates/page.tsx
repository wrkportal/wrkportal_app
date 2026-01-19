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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserPlus, Search, Plus, Eye, Edit, Trash2, Mail, Phone, Linkedin, Download, CheckCircle, Circle, Clock, FileText, MoreVertical, Calendar, MessageSquare, X, ArrowRight, Filter, CheckSquare, Square } from 'lucide-react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
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

const candidateStages = [
  { id: 'APPLIED', label: 'Applied', icon: Circle },
  { id: 'SCREENING', label: 'Screening', icon: Circle },
  { id: 'INTERVIEW', label: 'Interview', icon: Clock },
  { id: 'OFFER', label: 'Offer', icon: CheckCircle },
  { id: 'HIRED', label: 'Hired', icon: CheckCircle },
]

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff']

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    query: '',
    status: '',
    source: '',
    rating: '',
    experienceMin: '',
    experienceMax: '',
    department: '',
    location: '',
    dateFrom: '',
    dateTo: '',
  })
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([])
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false)
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusChangeData, setStatusChangeData] = useState({ candidateId: '', newStatus: '' })
  const [interviewData, setInterviewData] = useState({ candidateId: '', candidateName: '', date: '', time: '', type: 'VIDEO', interviewer: '' })
  const [analytics, setAnalytics] = useState({
    totalCandidates: 0,
    newCandidates: 0,
    inInterview: 0,
    hired: 0,
    hireRate: 0,
    candidatesByStatus: [] as any[],
    candidatesBySource: [] as any[],
    candidatesByRating: [] as any[],
  })

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

  useEffect(() => {
    fetchCandidates()
  }, [])

  useEffect(() => {
    calculateAnalytics()
  }, [candidates])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recruitment/candidates')
      if (!response.ok) {
        throw new Error('Failed to fetch candidates')
      }
      const data = await response.json()
      setCandidates(data.candidates || [])
    } catch (error) {
      console.error('Error fetching candidates:', error)
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  const performAdvancedSearch = async () => {
    try {
      setLoading(true)
      const searchParams: any = {
        page: 1,
        limit: 100,
      }
      
      if (searchFilters.query) searchParams.query = searchFilters.query
      if (searchFilters.status) searchParams.status = searchFilters.status
      if (searchFilters.source) searchParams.source = searchFilters.source
      if (searchFilters.rating) searchParams.rating = searchFilters.rating
      if (searchFilters.experienceMin) searchParams.experienceMin = parseInt(searchFilters.experienceMin)
      if (searchFilters.experienceMax) searchParams.experienceMax = parseInt(searchFilters.experienceMax)
      if (searchFilters.department) searchParams.department = searchFilters.department
      if (searchFilters.location) searchParams.location = searchFilters.location
      if (searchFilters.dateFrom) searchParams.dateFrom = searchFilters.dateFrom
      if (searchFilters.dateTo) searchParams.dateTo = searchFilters.dateTo

      const response = await fetch('/api/recruitment/candidates/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchParams),
      })

      if (!response.ok) {
        throw new Error('Failed to search candidates')
      }

      const data = await response.json()
      setCandidates(data.candidates || [])
      setAdvancedSearchOpen(false)
    } catch (error) {
      console.error('Error searching candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkAction = async (action: string, data?: any) => {
    if (selectedCandidates.length === 0) {
      alert('Please select at least one candidate')
      return
    }

    try {
      const response = await fetch('/api/recruitment/candidates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateIds: selectedCandidates,
          action,
          data,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk action')
      }

      const result = await response.json()
      alert(result.message || 'Action completed successfully')
      setSelectedCandidates([])
      setBulkActionDialogOpen(false)
      fetchCandidates()
    } catch (error) {
      console.error('Error performing bulk action:', error)
      alert('Failed to perform bulk action')
    }
  }

  const calculateAnalytics = () => {
    const total = candidates.length
    const newCandidates = candidates.filter((c) => c.status === 'APPLIED').length
    const inInterview = candidates.filter((c) => c.status === 'INTERVIEW').length
    const hired = candidates.filter((c) => c.status === 'HIRED').length
    const hireRate = total > 0 ? (hired / total) * 100 : 0

    const byStatus = candidateStages.map((stage) => ({
      name: stage.label,
      value: candidates.filter((c) => c.status === stage.id).length,
    }))

    const sources = ['LINKEDIN', 'WEBSITE', 'REFERRAL', 'JOB_BOARD', 'RECRUITER']
    const bySource = sources.map((source) => ({
      name: source.replace('_', ' '),
      value: candidates.filter((c) => c.source === source).length,
    }))

    const ratings = ['HIGH', 'AVERAGE', 'LOW']
    const byRating = ratings.map((rating) => ({
      name: rating,
      value: candidates.filter((c) => c.rating === rating).length,
    }))

    setAnalytics({
      totalCandidates: total,
      newCandidates,
      inInterview,
      hired,
      hireRate,
      candidatesByStatus: byStatus,
      candidatesBySource: bySource,
      candidatesByRating: byRating,
    })
  }

  const handleCreateCandidate = async () => {
    try {
      const candidateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        linkedin: formData.linkedin || null,
        position: formData.position || null,
        status: formData.status,
        source: formData.source,
        experience: formData.experience ? parseInt(formData.experience) : null,
        rating: formData.rating,
        resume: null,
        notes: formData.notes || null,
      }

      const response = await fetch('/api/recruitment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create candidate')
      }

      const data = await response.json()
      setCandidates([...candidates, data.candidate])
      setIsDialogOpen(false)
      setFormData({
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
    } catch (error) {
      console.error('Error creating candidate:', error)
    }
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setViewDialogOpen(true)
  }

  const handleEditCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
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
    setEditDialogOpen(true)
  }

  const handleUpdateCandidate = async () => {
    if (!selectedCandidate) return
    try {
      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id
          ? { ...c, ...formData, experience: formData.experience ? parseInt(formData.experience) : null }
          : c
      ))
      setEditDialogOpen(false)
      setSelectedCandidate(null)
    } catch (error) {
      console.error('Error updating candidate:', error)
    }
  }

  const handleStatusChange = (candidateId: string, currentStatus: string) => {
    setStatusChangeData({ candidateId, newStatus: currentStatus })
    setStatusDialogOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    try {
      setCandidates(candidates.map(c =>
        c.id === statusChangeData.candidateId
          ? { ...c, status: statusChangeData.newStatus as any }
          : c
      ))
      setStatusDialogOpen(false)
      setStatusChangeData({ candidateId: '', newStatus: '' })
    } catch (error) {
      console.error('Error changing status:', error)
    }
  }

  const handleScheduleInterview = (candidate: Candidate) => {
    setInterviewData({
      candidateId: candidate.id,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      date: '',
      time: '',
      type: 'VIDEO',
      interviewer: '',
    })
    setInterviewDialogOpen(true)
  }

  const handleConfirmInterview = async () => {
    try {
      // TODO: Create interview via API
      setInterviewDialogOpen(false)
      setInterviewData({ candidateId: '', candidateName: '', date: '', time: '', type: 'VIDEO', interviewer: '' })
    } catch (error) {
      console.error('Error scheduling interview:', error)
    }
  }

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      setCandidates(candidates.filter(c => c.id !== candidateId))
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting candidate:', error)
    }
  }

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || candidate.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'HIRED':
        return 'default'
      case 'OFFER':
        return 'default'
      case 'INTERVIEW':
        return 'secondary'
      case 'SCREENING':
        return 'outline'
      default:
        return 'outline'
    }
  }

  return (
    <RecruitmentPageLayout title="Candidates" description="Manage your candidate pipeline">
      <div className="space-y-6">
        {/* Analytics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Applications</CardTitle>
              <Circle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.newCandidates}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Interview</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.inInterview}</div>
              <p className="text-xs text-muted-foreground">Active interviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.hireRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Conversion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Candidates by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.candidatesByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.candidatesByStatus.map((entry, index) => (
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
              <CardTitle>Candidates by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.candidatesBySource}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Candidates by Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.candidatesByRating}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.candidatesByRating.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
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
                placeholder="Search candidates..."
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
                {candidateStages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Advanced Search
            </Button>
            {selectedCandidates.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setBulkActionDialogOpen(true)}
              >
                Bulk Actions ({selectedCandidates.length})
              </Button>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Candidate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Candidate</DialogTitle>
                <DialogDescription>
                  Add a new candidate to your pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <Input
                      id="linkedin"
                      value={formData.linkedin}
                      onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="source">Source</Label>
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
                    <Label htmlFor="rating">Rating</Label>
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
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCandidate}>
                    Add Candidate
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Advanced Search Panel */}
        {advancedSearchOpen && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Advanced Search</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdvancedSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Search Query</Label>
                  <Input
                    placeholder="Name, email, phone..."
                    value={searchFilters.query}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, query: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={searchFilters.status}
                    onValueChange={(value) =>
                      setSearchFilters({ ...searchFilters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      {candidateStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Source</Label>
                  <Select
                    value={searchFilters.source}
                    onValueChange={(value) =>
                      setSearchFilters({ ...searchFilters, source: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Sources</SelectItem>
                      <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="JOB_BOARD">Job Board</SelectItem>
                      <SelectItem value="RECRUITER">Recruiter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rating</Label>
                  <Select
                    value={searchFilters.rating}
                    onValueChange={(value) =>
                      setSearchFilters({ ...searchFilters, rating: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Ratings</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="AVERAGE">Average</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Min Experience (years)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={searchFilters.experienceMin}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, experienceMin: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Max Experience (years)</Label>
                  <Input
                    type="number"
                    placeholder="20"
                    value={searchFilters.experienceMax}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, experienceMax: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Department</Label>
                  <Input
                    placeholder="Department name"
                    value={searchFilters.department}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, department: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Location"
                    value={searchFilters.location}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, location: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={searchFilters.dateFrom}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, dateFrom: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={searchFilters.dateTo}
                    onChange={(e) =>
                      setSearchFilters({ ...searchFilters, dateTo: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchFilters({
                      query: '',
                      status: '',
                      source: '',
                      rating: '',
                      experienceMin: '',
                      experienceMax: '',
                      department: '',
                      location: '',
                      dateFrom: '',
                      dateTo: '',
                    })
                  }}
                >
                  Clear
                </Button>
                <Button onClick={performAdvancedSearch}>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bulk Actions Dialog */}
        <Dialog open={bulkActionDialogOpen} onOpenChange={setBulkActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Perform actions on {selectedCandidates.length} selected candidates
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const newStatus = prompt('Enter new status (APPLIED, SCREENING, INTERVIEW, OFFER, HIRED, REJECTED):')
                    if (newStatus) {
                      handleBulkAction('UPDATE_STATUS', { status: newStatus })
                    }
                  }}
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const tag = prompt('Enter tag name:')
                    if (tag) {
                      handleBulkAction('ADD_TAG', { tag })
                    }
                  }}
                >
                  Add Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const tag = prompt('Enter tag name to remove:')
                    if (tag) {
                      handleBulkAction('REMOVE_TAG', { tag })
                    }
                  }}
                >
                  Remove Tag
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const templateId = prompt('Enter email template ID (or leave blank for custom):')
                    const subject = prompt('Enter email subject:')
                    if (subject) {
                      handleBulkAction('SEND_EMAIL', { templateId, subject })
                    }
                  }}
                >
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleBulkAction('EXPORT')}
                >
                  Export Candidates
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Candidates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
            <CardDescription>
              Manage and track candidates through the recruitment pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No candidates found. Add a candidate to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (selectedCandidates.length === filteredCandidates.length) {
                            setSelectedCandidates([])
                          } else {
                            setSelectedCandidates(filteredCandidates.map((c) => c.id))
                          }
                        }}
                      >
                        {selectedCandidates.length === filteredCandidates.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidates.map((candidate) => (
                    <TableRow key={candidate.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (selectedCandidates.includes(candidate.id)) {
                              setSelectedCandidates(selectedCandidates.filter((id) => id !== candidate.id))
                            } else {
                              setSelectedCandidates([...selectedCandidates, candidate.id])
                            }
                          }}
                        >
                          {selectedCandidates.includes(candidate.id) ? (
                            <CheckSquare className="h-4 w-4" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {candidate.firstName} {candidate.lastName}
                      </TableCell>
                      <TableCell>{candidate.position || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                            <Mail className="h-4 w-4" />
                          </a>
                          {candidate.phone && (
                            <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                              <Phone className="h-4 w-4" />
                            </a>
                          )}
                          {candidate.linkedin && (
                            <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{candidate.source.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{candidate.experience ? `${candidate.experience} years` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant={candidate.rating === 'HIGH' ? 'default' : 'outline'}>
                          {candidate.rating}
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
                            <DropdownMenuItem onClick={() => handleViewCandidate(candidate)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditCandidate(candidate)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Candidate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleScheduleInterview(candidate)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              Schedule Interview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setNotesDialogOpen(true)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Add Notes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleStatusChange(candidate.id, candidate.status)}>
                              <ArrowRight className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download Resume
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedCandidate(candidate)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive"
                            >
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

        {/* View Candidate Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
            </DialogHeader>
            {selectedCandidate && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedCandidate.firstName} {selectedCandidate.lastName}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="text-sm">{selectedCandidate.email}</p>
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <p className="text-sm">{selectedCandidate.phone || '-'}</p>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <p className="text-sm">{selectedCandidate.position || '-'}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={getStatusBadgeVariant(selectedCandidate.status)}>
                      {selectedCandidate.status}
                    </Badge>
                  </div>
                  <div>
                    <Label>Source</Label>
                    <Badge variant="outline">{selectedCandidate.source.replace('_', ' ')}</Badge>
                  </div>
                  <div>
                    <Label>Experience</Label>
                    <p className="text-sm">{selectedCandidate.experience ? `${selectedCandidate.experience} years` : '-'}</p>
                  </div>
                  <div>
                    <Label>Rating</Label>
                    <Badge variant={selectedCandidate.rating === 'HIGH' ? 'default' : 'outline'}>
                      {selectedCandidate.rating}
                    </Badge>
                  </div>
                </div>
                {selectedCandidate.notes && (
                  <div>
                    <Label>Notes</Label>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.notes}</p>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                  <Button onClick={() => { setViewDialogOpen(false); handleEditCandidate(selectedCandidate); setEditDialogOpen(true); }}>
                    Edit
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateCandidate}>Save Changes</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Candidate Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Status</Label>
                <Select
                  value={statusChangeData.newStatus}
                  onValueChange={(value) => setStatusChangeData({ ...statusChangeData, newStatus: value })}
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
                <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmStatusChange}>Change Status</Button>
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
                Schedule an interview for {interviewData.candidateName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={interviewData.date}
                    onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={interviewData.time}
                    onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Interview Type</Label>
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
                  <Label>Interviewer</Label>
                  <Input
                    value={interviewData.interviewer}
                    onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                    placeholder="Interviewer name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setInterviewDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirmInterview}>Schedule Interview</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Candidate</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {selectedCandidate?.firstName} {selectedCandidate?.lastName}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => selectedCandidate && handleDeleteCandidate(selectedCandidate.id)}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}


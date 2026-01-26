'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Briefcase, Plus, Search, Edit, Trash2, Users, MapPin, DollarSign, Calendar, Clock, MoreVertical, Eye, Copy, X, CheckCircle, Link as LinkIcon, FileText, Target, GraduationCap, Languages, MapPin as MapPinIcon, Globe, Building2 } from 'lucide-react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import Link from 'next/link'

interface Job {
  id: string
  jobCode: string | null
  title: string
  department: string
  location: string
  type: string
  status: string
  candidateCount: number
  salaryRange: string | null
  commission: string | null
  benefits: string | null
  postedDate: string
  expiryDate: string | null
  description: string | null
  responsibilities: string | null
  qualifications: string | null
  requiredSkills: string[]
  preferredSkills: string[]
  experienceMin: number | null
  experienceMax: number | null
  educationLevel: string | null
  certifications: string[]
  languages: string[]
  numberOfPositions: number
  hiringManager: string | null
  assignedRecruiter: string | null
  priority: string
  expectedStartDate: string | null
  applicationDeadline: string | null
  workSchedule: string | null
  travelRequired: boolean
  travelPercentage: number | null
  remoteType: string
  internalNotes: string | null
  postingChannels: string[]
  applicationQuestions: string[]
}

function JobsPageInner() {
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState({
    jobCode: '',
    title: '',
    department: '',
    location: '',
    type: 'FULL_TIME',
    status: 'OPEN',
    salaryRange: '',
    commission: '',
    benefits: '',
    description: '',
    responsibilities: '',
    qualifications: '',
    requiredSkills: '',
    preferredSkills: '',
    experienceMin: '',
    experienceMax: '',
    educationLevel: '',
    certifications: '',
    languages: '',
    numberOfPositions: '1',
    hiringManager: '',
    assignedRecruiter: '',
    priority: 'MEDIUM',
    expectedStartDate: '',
    applicationDeadline: '',
    workSchedule: '',
    travelRequired: false,
    travelPercentage: '',
    remoteType: 'ONSITE',
    internalNotes: '',
    postingChannels: [] as string[],
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recruitment/jobs')
      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (error) {
      console.error('Error fetching jobs:', error)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateJob = async () => {
    try {
      const jobData = {
        jobCode: formData.jobCode || null,
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        salaryRange: formData.salaryRange || null,
        commission: formData.commission || null,
        benefits: formData.benefits || null,
        description: formData.description || null,
        responsibilities: formData.responsibilities || null,
        qualifications: formData.qualifications || null,
        requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
        preferredSkills: formData.preferredSkills ? formData.preferredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
        experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : null,
        experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : null,
        educationLevel: formData.educationLevel || null,
        certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(s => s) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(s => s) : [],
        numberOfPositions: parseInt(formData.numberOfPositions) || 1,
        hiringManager: formData.hiringManager || null,
        assignedRecruiter: formData.assignedRecruiter || null,
        priority: formData.priority,
        expectedStartDate: formData.expectedStartDate || null,
        applicationDeadline: formData.applicationDeadline || null,
        workSchedule: formData.workSchedule || null,
        travelRequired: formData.travelRequired,
        travelPercentage: formData.travelPercentage ? parseInt(formData.travelPercentage) : null,
        remoteType: formData.remoteType,
        internalNotes: formData.internalNotes || null,
        postingChannels: formData.postingChannels,
      }

      const response = await fetch('/api/recruitment/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create job')
      }

      const data = await response.json()
      setJobs([...jobs, { ...data.job, candidateCount: 0, postedDate: new Date().toISOString(), expiryDate: data.job.applicationDeadline, applicationQuestions: [] }])
      setIsDialogOpen(false)
      // Reset form
      setFormData({
        jobCode: '',
        title: '',
        department: '',
        location: '',
        type: 'FULL_TIME',
        status: 'OPEN',
        salaryRange: '',
        commission: '',
        benefits: '',
        description: '',
        responsibilities: '',
        qualifications: '',
        requiredSkills: '',
        preferredSkills: '',
        experienceMin: '',
        experienceMax: '',
        educationLevel: '',
        certifications: '',
        languages: '',
        numberOfPositions: '1',
        hiringManager: '',
        assignedRecruiter: '',
        priority: 'MEDIUM',
        expectedStartDate: '',
        applicationDeadline: '',
        workSchedule: '',
        travelRequired: false,
        travelPercentage: '',
        remoteType: 'ONSITE',
        internalNotes: '',
        postingChannels: [],
      })
    } catch (error) {
      console.error('Error creating job:', error)
    }
  }

  const handleViewJob = (job: Job) => {
    setSelectedJob(job)
    setViewDialogOpen(true)
  }

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    setFormData({
      jobCode: job.jobCode || '',
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.type,
      status: job.status,
      salaryRange: job.salaryRange || '',
      commission: job.commission || '',
      benefits: job.benefits || '',
      description: job.description || '',
      responsibilities: job.responsibilities || '',
      qualifications: job.qualifications || '',
      requiredSkills: job.requiredSkills.join(', '),
      preferredSkills: job.preferredSkills.join(', '),
      experienceMin: job.experienceMin?.toString() || '',
      experienceMax: job.experienceMax?.toString() || '',
      educationLevel: job.educationLevel || '',
      certifications: job.certifications.join(', '),
      languages: job.languages.join(', '),
      numberOfPositions: job.numberOfPositions.toString(),
      hiringManager: job.hiringManager || '',
      assignedRecruiter: job.assignedRecruiter || '',
      priority: job.priority,
      expectedStartDate: job.expectedStartDate ? new Date(job.expectedStartDate).toISOString().split('T')[0] : '',
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : '',
      workSchedule: job.workSchedule || '',
      travelRequired: job.travelRequired,
      travelPercentage: job.travelPercentage?.toString() || '',
      remoteType: job.remoteType,
      internalNotes: job.internalNotes || '',
      postingChannels: job.postingChannels,
    })
    setEditDialogOpen(true)
  }

  const handleUpdateJob = async () => {
    if (!selectedJob) return
    try {
      const updatedJob: Job = {
        ...selectedJob,
        jobCode: formData.jobCode || null,
        title: formData.title,
        department: formData.department,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        salaryRange: formData.salaryRange || null,
        commission: formData.commission || null,
        benefits: formData.benefits || null,
        description: formData.description || null,
        responsibilities: formData.responsibilities || null,
        qualifications: formData.qualifications || null,
        requiredSkills: formData.requiredSkills ? formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
        preferredSkills: formData.preferredSkills ? formData.preferredSkills.split(',').map(s => s.trim()).filter(s => s) : [],
        experienceMin: formData.experienceMin ? parseInt(formData.experienceMin) : null,
        experienceMax: formData.experienceMax ? parseInt(formData.experienceMax) : null,
        educationLevel: formData.educationLevel || null,
        certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()).filter(s => s) : [],
        languages: formData.languages ? formData.languages.split(',').map(s => s.trim()).filter(s => s) : [],
        numberOfPositions: parseInt(formData.numberOfPositions) || 1,
        hiringManager: formData.hiringManager || null,
        assignedRecruiter: formData.assignedRecruiter || null,
        priority: formData.priority,
        expectedStartDate: formData.expectedStartDate || null,
        applicationDeadline: formData.applicationDeadline || null,
        workSchedule: formData.workSchedule || null,
        travelRequired: formData.travelRequired,
        travelPercentage: formData.travelPercentage ? parseInt(formData.travelPercentage) : null,
        remoteType: formData.remoteType,
        internalNotes: formData.internalNotes || null,
        postingChannels: formData.postingChannels,
      }
      setJobs(jobs.map(j => j.id === selectedJob.id ? updatedJob : j))
      setEditDialogOpen(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  const handleDuplicateJob = (job: Job) => {
    const newJob: Job = {
      ...job,
      id: Date.now().toString(),
      jobCode: job.jobCode ? `${job.jobCode}-COPY` : null,
      title: `${job.title} (Copy)`,
      status: 'OPEN',
      candidateCount: 0,
      postedDate: new Date().toISOString(),
    }
    setJobs([...jobs, newJob])
  }

  const handleToggleJobStatus = (job: Job) => {
    setJobs(jobs.map(j =>
      j.id === job.id
        ? { ...j, status: j.status === 'OPEN' ? 'CLOSED' : 'OPEN' }
        : j
    ))
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      setJobs(jobs.filter(j => j.id !== jobId))
      setDeleteDialogOpen(false)
      setSelectedJob(null)
    } catch (error) {
      console.error('Error deleting job:', error)
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === 'OPEN').length,
    closedJobs: jobs.filter((j) => j.status === 'CLOSED').length,
    totalCandidates: jobs.reduce((sum, j) => sum + j.candidateCount, 0),
  }

  return (
    <RecruitmentPageLayout title="Jobs" description="Manage job postings and open positions">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">All positions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openJobs}</div>
              <p className="text-xs text-muted-foreground">Actively hiring</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">Across all jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.closedJobs}</div>
              <p className="text-xs text-muted-foreground">Filled or cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs..."
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
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Post New Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Post New Job</DialogTitle>
                <DialogDescription>
                  Create a comprehensive job posting with all details
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Job Details</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  <TabsTrigger value="hiring">Hiring Info</TabsTrigger>
                  <TabsTrigger value="posting">Posting</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="jobCode">Job Code/Reference</Label>
                      <Input
                        id="jobCode"
                        value={formData.jobCode}
                        onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                        placeholder="JOB-2024-001"
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label htmlFor="type">Job Type</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FULL_TIME">Full Time</SelectItem>
                          <SelectItem value="PART_TIME">Part Time</SelectItem>
                          <SelectItem value="CONTRACT">Contract</SelectItem>
                          <SelectItem value="INTERNSHIP">Internship</SelectItem>
                          <SelectItem value="TEMPORARY">Temporary</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="remoteType">Work Type</Label>
                      <Select
                        value={formData.remoteType}
                        onValueChange={(value) => setFormData({ ...formData, remoteType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ONSITE">Onsite</SelectItem>
                          <SelectItem value="REMOTE">Remote</SelectItem>
                          <SelectItem value="HYBRID">Hybrid</SelectItem>
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
                          <SelectItem value="URGENT">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Job Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      placeholder="Provide a comprehensive job description..."
                      required
                    />
                  </div>
                </TabsContent>

                {/* Job Details Tab */}
                <TabsContent value="details" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="responsibilities">Key Responsibilities</Label>
                    <Textarea
                      id="responsibilities"
                      value={formData.responsibilities}
                      onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                      rows={6}
                      placeholder="List the main responsibilities and duties..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="qualifications">Required Qualifications</Label>
                    <Textarea
                      id="qualifications"
                      value={formData.qualifications}
                      onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                      rows={4}
                      placeholder="List required qualifications..."
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="experienceMin">Min Experience (Years)</Label>
                      <Input
                        id="experienceMin"
                        type="number"
                        value={formData.experienceMin}
                        onChange={(e) => setFormData({ ...formData, experienceMin: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="experienceMax">Max Experience (Years)</Label>
                      <Input
                        id="experienceMax"
                        type="number"
                        value={formData.experienceMax}
                        onChange={(e) => setFormData({ ...formData, experienceMax: e.target.value })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="educationLevel">Education Level</Label>
                    <Select
                      value={formData.educationLevel}
                      onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH_SCHOOL">High School</SelectItem>
                        <SelectItem value="ASSOCIATE">Associate Degree</SelectItem>
                        <SelectItem value="BACHELORS">Bachelor's Degree</SelectItem>
                        <SelectItem value="MASTERS">Master's Degree</SelectItem>
                        <SelectItem value="PHD">PhD</SelectItem>
                        <SelectItem value="NONE">No Specific Requirement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="workSchedule">Work Schedule</Label>
                      <Input
                        id="workSchedule"
                        value={formData.workSchedule}
                        onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                        placeholder="e.g., Monday-Friday, 9 AM - 5 PM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Travel Required</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="travelRequired"
                          checked={formData.travelRequired}
                          onCheckedChange={(checked) => setFormData({ ...formData, travelRequired: checked as boolean })}
                        />
                        <Label htmlFor="travelRequired" className="font-normal">Travel required for this position</Label>
                      </div>
                      {formData.travelRequired && (
                        <Input
                          type="number"
                          value={formData.travelPercentage}
                          onChange={(e) => setFormData({ ...formData, travelPercentage: e.target.value })}
                          placeholder="Travel % (0-100)"
                          min="0"
                          max="100"
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Requirements Tab */}
                <TabsContent value="requirements" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="requiredSkills">Required Skills (comma-separated)</Label>
                    <Input
                      id="requiredSkills"
                      value={formData.requiredSkills}
                      onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                      placeholder="e.g., JavaScript, React, Node.js, SQL"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Separate multiple skills with commas</p>
                  </div>
                  <div>
                    <Label htmlFor="preferredSkills">Preferred Skills (comma-separated)</Label>
                    <Input
                      id="preferredSkills"
                      value={formData.preferredSkills}
                      onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                      placeholder="e.g., TypeScript, AWS, Docker"
                    />
                  </div>
                  <div>
                    <Label htmlFor="certifications">Required Certifications (comma-separated)</Label>
                    <Input
                      id="certifications"
                      value={formData.certifications}
                      onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                      placeholder="e.g., PMP, AWS Certified, CISSP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="languages">Language Requirements (comma-separated)</Label>
                    <Input
                      id="languages"
                      value={formData.languages}
                      onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                      placeholder="e.g., English, Spanish, French"
                    />
                  </div>
                </TabsContent>

                {/* Hiring Info Tab */}
                <TabsContent value="hiring" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="numberOfPositions">Number of Positions</Label>
                      <Input
                        id="numberOfPositions"
                        type="number"
                        value={formData.numberOfPositions}
                        onChange={(e) => setFormData({ ...formData, numberOfPositions: e.target.value })}
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hiringManager">Hiring Manager</Label>
                      <Input
                        id="hiringManager"
                        value={formData.hiringManager}
                        onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                        placeholder="Manager name"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="assignedRecruiter">Assigned Recruiter</Label>
                    <Input
                      id="assignedRecruiter"
                      value={formData.assignedRecruiter}
                      onChange={(e) => setFormData({ ...formData, assignedRecruiter: e.target.value })}
                      placeholder="Recruiter name"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="expectedStartDate">Expected Start Date</Label>
                      <Input
                        id="expectedStartDate"
                        type="date"
                        value={formData.expectedStartDate}
                        onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="applicationDeadline">Application Deadline</Label>
                      <Input
                        id="applicationDeadline"
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Posting & Compensation Tab */}
                <TabsContent value="posting" className="space-y-4 mt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="salaryRange">Salary Range</Label>
                      <Input
                        id="salaryRange"
                        value={formData.salaryRange}
                        onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                        placeholder="$50k - $100k"
                      />
                    </div>
                    <div>
                      <Label htmlFor="commission">Commission/Bonus</Label>
                      <Input
                        id="commission"
                        value={formData.commission}
                        onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                        placeholder="e.g., 10% commission, $5k bonus"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="benefits">Benefits Package</Label>
                    <Textarea
                      id="benefits"
                      value={formData.benefits}
                      onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                      rows={4}
                      placeholder="Health insurance, 401k, PTO, etc."
                    />
                  </div>
                  <div>
                    <Label>Posting Channels</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['LinkedIn', 'Indeed', 'Company Website', 'Glassdoor', 'Monster', 'CareerBuilder', 'Internal Referral', 'Job Boards'].map((channel) => (
                        <div key={channel} className="flex items-center space-x-2">
                          <Checkbox
                            id={`channel-${channel}`}
                            checked={formData.postingChannels.includes(channel)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, postingChannels: [...formData.postingChannels, channel] })
                              } else {
                                setFormData({ ...formData, postingChannels: formData.postingChannels.filter(c => c !== channel) })
                              }
                            }}
                          />
                          <Label htmlFor={`channel-${channel}`} className="font-normal text-sm">{channel}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="internalNotes">Internal Notes</Label>
                    <Textarea
                      id="internalNotes"
                      value={formData.internalNotes}
                      onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                      rows={3}
                      placeholder="Internal notes (not visible to candidates)"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateJob}>
                  Post Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Jobs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Job Postings</CardTitle>
            <CardDescription>
              Manage and track job postings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No jobs found. Post a new job to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Remote Type</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Candidates</TableHead>
                    <TableHead>Salary</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                      if (!router) {
                        console.error('[Jobs] Router not available')
                        return
                      }
                      router.push(`/recruitment-dashboard/jobs/${job.id}`)
                    }}>
                      <TableCell className="font-medium">
                        <Link href={`/recruitment-dashboard/jobs/${job.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {job.title}
                        </Link>
                      </TableCell>
                      <TableCell>{job.department}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          {job.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.type.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{job.remoteType?.toLowerCase() || 'Onsite'}</Badge>
                      </TableCell>
                      <TableCell>{job.numberOfPositions || 1}</TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {job.candidateCount}
                        </div>
                      </TableCell>
                      <TableCell>{job.salaryRange || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={job.priority === 'URGENT' ? 'destructive' : job.priority === 'HIGH' ? 'default' : 'outline'}>
                          {job.priority}
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
                            <DropdownMenuItem onClick={() => handleViewJob(job)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleViewJob(job)}>
                              <Users className="mr-2 h-4 w-4" />
                              View Applications ({job.candidateCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditJob(job)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Job
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Job
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleJobStatus(job)}>
                              {job.status === 'OPEN' ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Close Job
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Reopen Job
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Copy Job Link
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedJob(job)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Job
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

        {/* View Job Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Job Details</DialogTitle>
            </DialogHeader>
            {selectedJob && (
              <>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="hiring">Hiring</TabsTrigger>
                    <TabsTrigger value="posting">Posting</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Job Code</Label>
                        <p className="text-sm font-medium">{selectedJob.jobCode || '-'}</p>
                      </div>
                      <div>
                        <Label>Job Title</Label>
                        <p className="text-sm font-medium">{selectedJob.title}</p>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <p className="text-sm">{selectedJob.department}</p>
                      </div>
                      <div>
                        <Label>Location</Label>
                        <p className="text-sm">{selectedJob.location}</p>
                      </div>
                      <div>
                        <Label>Job Type</Label>
                        <Badge variant="outline">{selectedJob.type.replace('_', ' ')}</Badge>
                      </div>
                      <div>
                        <Label>Work Type</Label>
                        <Badge variant="outline" className="capitalize">{selectedJob.remoteType?.toLowerCase() || 'Onsite'}</Badge>
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Badge variant={selectedJob.status === 'OPEN' ? 'default' : 'secondary'}>
                          {selectedJob.status}
                        </Badge>
                      </div>
                      <div>
                        <Label>Priority</Label>
                        <Badge variant={selectedJob.priority === 'URGENT' ? 'destructive' : selectedJob.priority === 'HIGH' ? 'default' : 'outline'}>
                          {selectedJob.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label>Number of Positions</Label>
                        <p className="text-sm">{selectedJob.numberOfPositions || 1}</p>
                      </div>
                      <div>
                        <Label>Candidates</Label>
                        <p className="text-sm">{selectedJob.candidateCount} applicants</p>
                      </div>
                      <div>
                        <Label>Posted Date</Label>
                        <p className="text-sm">{new Date(selectedJob.postedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <Label>Application Deadline</Label>
                        <p className="text-sm">{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                    {selectedJob.description && (
                      <div>
                        <Label>Description</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    {selectedJob.responsibilities && (
                      <div>
                        <Label>Key Responsibilities</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.responsibilities}</p>
                      </div>
                    )}
                    {selectedJob.qualifications && (
                      <div>
                        <Label>Required Qualifications</Label>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.qualifications}</p>
                      </div>
                    )}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Experience Range</Label>
                        <p className="text-sm">
                          {selectedJob.experienceMin || 0} - {selectedJob.experienceMax || '∞'} years
                        </p>
                      </div>
                      <div>
                        <Label>Education Level</Label>
                        <p className="text-sm">{selectedJob.educationLevel?.replace('_', ' ') || '-'}</p>
                      </div>
                      <div>
                        <Label>Work Schedule</Label>
                        <p className="text-sm">{selectedJob.workSchedule || '-'}</p>
                      </div>
                      <div>
                        <Label>Travel Required</Label>
                        <p className="text-sm">
                          {selectedJob.travelRequired ? `Yes (${selectedJob.travelPercentage || 0}%)` : 'No'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="requirements" className="space-y-4 mt-4">
                    <div>
                      <Label>Required Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJob.requiredSkills.length > 0 ? (
                          selectedJob.requiredSkills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Preferred Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJob.preferredSkills.length > 0 ? (
                          selectedJob.preferredSkills.map((skill, idx) => (
                            <Badge key={idx} variant="outline">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Certifications</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJob.certifications.length > 0 ? (
                          selectedJob.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline">{cert}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>Languages</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJob.languages.length > 0 ? (
                          selectedJob.languages.map((lang, idx) => (
                            <Badge key={idx} variant="outline">{lang}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hiring" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Hiring Manager</Label>
                        <p className="text-sm">{selectedJob.hiringManager || '-'}</p>
                      </div>
                      <div>
                        <Label>Assigned Recruiter</Label>
                        <p className="text-sm">{selectedJob.assignedRecruiter || '-'}</p>
                      </div>
                      <div>
                        <Label>Expected Start Date</Label>
                        <p className="text-sm">{selectedJob.expectedStartDate ? new Date(selectedJob.expectedStartDate).toLocaleDateString() : '-'}</p>
                      </div>
                      <div>
                        <Label>Application Deadline</Label>
                        <p className="text-sm">{selectedJob.applicationDeadline ? new Date(selectedJob.applicationDeadline).toLocaleDateString() : '-'}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="posting" className="space-y-4 mt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label>Salary Range</Label>
                        <p className="text-sm font-semibold">{selectedJob.salaryRange || '-'}</p>
                      </div>
                      <div>
                        <Label>Commission/Bonus</Label>
                        <p className="text-sm">{selectedJob.commission || '-'}</p>
                      </div>
                    </div>
                    {selectedJob.benefits && (
                      <div>
                        <Label>Benefits Package</Label>
                        <p className="text-sm text-muted-foreground">{selectedJob.benefits}</p>
                      </div>
                    )}
                    <div>
                      <Label>Posting Channels</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedJob.postingChannels.length > 0 ? (
                          selectedJob.postingChannels.map((channel, idx) => (
                            <Badge key={idx} variant="outline">{channel}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">-</p>
                        )}
                      </div>
                    </div>
                    {selectedJob.internalNotes && (
                      <div>
                        <Label>Internal Notes</Label>
                        <p className="text-sm text-muted-foreground">{selectedJob.internalNotes}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                  <Button onClick={() => { setViewDialogOpen(false); handleEditJob(selectedJob); setEditDialogOpen(true); }}>
                    Edit Job
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Job Dialog - Same as Create but with Edit title */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Job Posting</DialogTitle>
              <DialogDescription>
                Update job posting details
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="details">Job Details</TabsTrigger>
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="hiring">Hiring Info</TabsTrigger>
                <TabsTrigger value="posting">Posting</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-jobCode">Job Code/Reference</Label>
                    <Input
                      id="edit-jobCode"
                      value={formData.jobCode}
                      onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                      placeholder="JOB-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-title">Job Title *</Label>
                    <Input
                      id="edit-title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-department">Department *</Label>
                    <Input
                      id="edit-department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-location">Location *</Label>
                    <Input
                      id="edit-location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <Label htmlFor="edit-type">Job Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FULL_TIME">Full Time</SelectItem>
                        <SelectItem value="PART_TIME">Part Time</SelectItem>
                        <SelectItem value="CONTRACT">Contract</SelectItem>
                        <SelectItem value="INTERNSHIP">Internship</SelectItem>
                        <SelectItem value="TEMPORARY">Temporary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-remoteType">Work Type</Label>
                    <Select
                      value={formData.remoteType}
                      onValueChange={(value) => setFormData({ ...formData, remoteType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ONSITE">Onsite</SelectItem>
                        <SelectItem value="REMOTE">Remote</SelectItem>
                        <SelectItem value="HYBRID">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
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
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-description">Job Description *</Label>
                  <Textarea
                    id="edit-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
              </TabsContent>

              {/* Job Details Tab */}
              <TabsContent value="details" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-responsibilities">Key Responsibilities</Label>
                  <Textarea
                    id="edit-responsibilities"
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                    rows={6}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-qualifications">Required Qualifications</Label>
                  <Textarea
                    id="edit-qualifications"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-experienceMin">Min Experience (Years)</Label>
                    <Input
                      id="edit-experienceMin"
                      type="number"
                      value={formData.experienceMin}
                      onChange={(e) => setFormData({ ...formData, experienceMin: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-experienceMax">Max Experience (Years)</Label>
                    <Input
                      id="edit-experienceMax"
                      type="number"
                      value={formData.experienceMax}
                      onChange={(e) => setFormData({ ...formData, experienceMax: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-educationLevel">Education Level</Label>
                  <Select
                    value={formData.educationLevel}
                    onValueChange={(value) => setFormData({ ...formData, educationLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH_SCHOOL">High School</SelectItem>
                      <SelectItem value="ASSOCIATE">Associate Degree</SelectItem>
                      <SelectItem value="BACHELORS">Bachelor's Degree</SelectItem>
                      <SelectItem value="MASTERS">Master's Degree</SelectItem>
                      <SelectItem value="PHD">PhD</SelectItem>
                      <SelectItem value="NONE">No Specific Requirement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-workSchedule">Work Schedule</Label>
                    <Input
                      id="edit-workSchedule"
                      value={formData.workSchedule}
                      onChange={(e) => setFormData({ ...formData, workSchedule: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Travel Required</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="edit-travelRequired"
                        checked={formData.travelRequired}
                        onCheckedChange={(checked) => setFormData({ ...formData, travelRequired: checked as boolean })}
                      />
                      <Label htmlFor="edit-travelRequired" className="font-normal">Travel required</Label>
                    </div>
                    {formData.travelRequired && (
                      <Input
                        type="number"
                        value={formData.travelPercentage}
                        onChange={(e) => setFormData({ ...formData, travelPercentage: e.target.value })}
                        placeholder="Travel % (0-100)"
                        min="0"
                        max="100"
                      />
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Requirements Tab */}
              <TabsContent value="requirements" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="edit-requiredSkills">Required Skills (comma-separated)</Label>
                  <Input
                    id="edit-requiredSkills"
                    value={formData.requiredSkills}
                    onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-preferredSkills">Preferred Skills (comma-separated)</Label>
                  <Input
                    id="edit-preferredSkills"
                    value={formData.preferredSkills}
                    onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-certifications">Required Certifications (comma-separated)</Label>
                  <Input
                    id="edit-certifications"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-languages">Language Requirements (comma-separated)</Label>
                  <Input
                    id="edit-languages"
                    value={formData.languages}
                    onChange={(e) => setFormData({ ...formData, languages: e.target.value })}
                  />
                </div>
              </TabsContent>

              {/* Hiring Info Tab */}
              <TabsContent value="hiring" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-numberOfPositions">Number of Positions</Label>
                    <Input
                      id="edit-numberOfPositions"
                      type="number"
                      value={formData.numberOfPositions}
                      onChange={(e) => setFormData({ ...formData, numberOfPositions: e.target.value })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-hiringManager">Hiring Manager</Label>
                    <Input
                      id="edit-hiringManager"
                      value={formData.hiringManager}
                      onChange={(e) => setFormData({ ...formData, hiringManager: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-assignedRecruiter">Assigned Recruiter</Label>
                  <Input
                    id="edit-assignedRecruiter"
                    value={formData.assignedRecruiter}
                    onChange={(e) => setFormData({ ...formData, assignedRecruiter: e.target.value })}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-expectedStartDate">Expected Start Date</Label>
                    <Input
                      id="edit-expectedStartDate"
                      type="date"
                      value={formData.expectedStartDate}
                      onChange={(e) => setFormData({ ...formData, expectedStartDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-applicationDeadline">Application Deadline</Label>
                    <Input
                      id="edit-applicationDeadline"
                      type="date"
                      value={formData.applicationDeadline}
                      onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                    />
                  </div>
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
                      <SelectItem value="OPEN">Open</SelectItem>
                      <SelectItem value="CLOSED">Closed</SelectItem>
                      <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* Posting & Compensation Tab */}
              <TabsContent value="posting" className="space-y-4 mt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="edit-salaryRange">Salary Range</Label>
                    <Input
                      id="edit-salaryRange"
                      value={formData.salaryRange}
                      onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-commission">Commission/Bonus</Label>
                    <Input
                      id="edit-commission"
                      value={formData.commission}
                      onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-benefits">Benefits Package</Label>
                  <Textarea
                    id="edit-benefits"
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Posting Channels</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {['LinkedIn', 'Indeed', 'Company Website', 'Glassdoor', 'Monster', 'CareerBuilder', 'Internal Referral', 'Job Boards'].map((channel) => (
                      <div key={channel} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-channel-${channel}`}
                          checked={formData.postingChannels.includes(channel)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({ ...formData, postingChannels: [...formData.postingChannels, channel] })
                            } else {
                              setFormData({ ...formData, postingChannels: formData.postingChannels.filter(c => c !== channel) })
                            }
                          }}
                        />
                        <Label htmlFor={`edit-channel-${channel}`} className="font-normal text-sm">{channel}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-internalNotes">Internal Notes</Label>
                  <Textarea
                    id="edit-internalNotes"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateJob}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job Posting</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedJob?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => selectedJob && handleDeleteJob(selectedJob.id)}>
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <JobsPageInner />
    </Suspense>
  )
}

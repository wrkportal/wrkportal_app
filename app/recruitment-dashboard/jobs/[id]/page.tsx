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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
} from '@/components/ui/dialog'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import {
  ArrowLeft,
  Edit,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  Target,
  GraduationCap,
  Languages,
  Building2,
  FileText,
  CheckCircle,
  X,
  Mail,
  Phone,
  Linkedin,
  Download,
  MoreVertical,
  Eye,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

interface Candidate {
  id: string
  name: string
  email: string
  phone: string | null
  linkedin: string | null
  position: string
  status: string
  experience: number
  rating: number
  appliedDate: string
  resumeUrl: string | null
}

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.id as string

  const [job, setJob] = useState<Job | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewCandidateDialogOpen, setViewCandidateDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
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
    fetchJob()
    fetchCandidates()
  }, [jobId])

  const fetchJob = async () => {
    try {
      setLoading(true)
      // Mock data - replace with API call
      const mockJobs: Job[] = [
        {
          id: '1',
          jobCode: 'JOB-2024-001',
          title: 'Senior Software Engineer',
          department: 'Engineering',
          location: 'San Francisco, CA',
          type: 'FULL_TIME',
          status: 'OPEN',
          candidateCount: 24,
          salaryRange: '$120k - $180k',
          commission: null,
          benefits: 'Health, Dental, Vision, 401k, PTO',
          postedDate: new Date().toISOString(),
          expiryDate: null,
          description: 'We are looking for a senior software engineer with strong experience in full-stack development...',
          responsibilities: 'Design and develop scalable web applications, Lead technical discussions, Mentor junior developers',
          qualifications: 'Bachelor\'s degree in Computer Science, 5+ years of experience',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL'],
          preferredSkills: ['TypeScript', 'AWS', 'Docker'],
          experienceMin: 5,
          experienceMax: 10,
          educationLevel: 'BACHELORS',
          certifications: [],
          languages: ['English'],
          numberOfPositions: 2,
          hiringManager: 'John Smith',
          assignedRecruiter: 'Jane Doe',
          priority: 'HIGH',
          expectedStartDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          applicationDeadline: null,
          workSchedule: 'Monday-Friday, 9 AM - 5 PM',
          travelRequired: false,
          travelPercentage: null,
          remoteType: 'HYBRID',
          internalNotes: 'Urgent hire, need to fill quickly',
          postingChannels: ['LinkedIn', 'Indeed', 'Company Website'],
          applicationQuestions: [],
        },
        {
          id: '2',
          jobCode: 'JOB-2024-002',
          title: 'Product Manager',
          department: 'Product',
          location: 'Remote',
          type: 'FULL_TIME',
          status: 'OPEN',
          candidateCount: 18,
          salaryRange: '$100k - $150k',
          commission: '10% bonus',
          benefits: 'Health, Dental, Vision, Stock Options',
          postedDate: new Date().toISOString(),
          expiryDate: null,
          description: 'Join our product team to drive innovation...',
          responsibilities: 'Define product roadmap, Work with engineering teams, Conduct user research',
          qualifications: 'MBA preferred, 3+ years product management experience',
          requiredSkills: ['Product Management', 'Agile', 'Analytics'],
          preferredSkills: ['SQL', 'Figma'],
          experienceMin: 3,
          experienceMax: 7,
          educationLevel: 'BACHELORS',
          certifications: [],
          languages: ['English'],
          numberOfPositions: 1,
          hiringManager: 'Sarah Johnson',
          assignedRecruiter: 'Mike Wilson',
          priority: 'MEDIUM',
          expectedStartDate: null,
          applicationDeadline: null,
          workSchedule: 'Flexible',
          travelRequired: true,
          travelPercentage: 20,
          remoteType: 'REMOTE',
          internalNotes: null,
          postingChannels: ['LinkedIn', 'Company Website'],
          applicationQuestions: [],
        },
      ]
      const foundJob = mockJobs.find(j => j.id === jobId)
      setJob(foundJob || null)
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCandidates = async () => {
    try {
      // Mock data - replace with API call
      const mockCandidates: Candidate[] = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0101',
          linkedin: 'linkedin.com/in/johndoe',
          position: 'Senior Software Engineer',
          status: 'APPLIED',
          experience: 7,
          rating: 4.5,
          appliedDate: new Date(Date.now() - 5 * 86400000).toISOString(),
          resumeUrl: '/resumes/john-doe.pdf',
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0102',
          linkedin: 'linkedin.com/in/janesmith',
          position: 'Senior Software Engineer',
          status: 'SCREENING',
          experience: 8,
          rating: 4.8,
          appliedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
          resumeUrl: '/resumes/jane-smith.pdf',
        },
        {
          id: '3',
          name: 'Bob Johnson',
          email: 'bob.johnson@example.com',
          phone: '+1-555-0103',
          linkedin: 'linkedin.com/in/bobjohnson',
          position: 'Senior Software Engineer',
          status: 'INTERVIEW',
          experience: 6,
          rating: 4.2,
          appliedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
          resumeUrl: '/resumes/bob-johnson.pdf',
        },
      ]
      setCandidates(mockCandidates)
    } catch (error) {
      console.error('Error fetching candidates:', error)
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

  const handleEditJob = () => {
    if (!job) return
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
    if (!job) return
    try {
      const updatedJob: Job = {
        ...job,
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
      setJob(updatedJob)
      setEditDialogOpen(false)
      // In a real app, you would call an API here to update the job
      // await fetch(`/api/recruitment/jobs/${jobId}`, { method: 'PATCH', body: JSON.stringify(updatedJob) })
    } catch (error) {
      console.error('Error updating job:', error)
    }
  }

  const handleViewAllCandidates = () => {
    // Navigate to candidates tab or candidates page with job filter
    setActiveTab('candidates')
    // Alternatively, navigate to candidates page with filter:
    // router.push(`/recruitment-dashboard/candidates?jobId=${jobId}`)
  }

  if (loading) {
    return (
      <RecruitmentPageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading job details...</div>
        </div>
      </RecruitmentPageLayout>
    )
  }

  if (!job) {
    return (
      <RecruitmentPageLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="text-muted-foreground">Job not found</div>
          <Button onClick={() => {
            if (!router) {
              console.error('[JobDetail] Router not available')
              return
            }
            router.push('/recruitment-dashboard/jobs')
          }}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
      </RecruitmentPageLayout>
    )
  }

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
                onClick={() => {
                  if (!router) {
                    console.error('[JobDetail] Router not available')
                    return
                  }
                  router.push('/recruitment-dashboard/jobs')
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
                  <Badge variant={job.status === 'OPEN' ? 'default' : 'secondary'}>
                    {job.status}
                  </Badge>
                  <Badge variant={job.priority === 'URGENT' ? 'destructive' : job.priority === 'HIGH' ? 'default' : 'outline'}>
                    {job.priority}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    {job.department}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {job.type.replace('_', ' ')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {job.candidateCount} candidates
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEditJob}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Job
            </Button>
            <Button onClick={handleViewAllCandidates}>
              <Users className="mr-2 h-4 w-4" />
              View All Candidates
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{job.candidateCount}</div>
              <p className="text-xs text-muted-foreground">Candidates applied</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{job.numberOfPositions}</div>
              <p className="text-xs text-muted-foreground">Positions available</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salary Range</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{job.salaryRange || 'Not specified'}</div>
              <p className="text-xs text-muted-foreground">Compensation</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posted Date</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(job.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(job.postedDate).toLocaleDateString('en-US', { year: 'numeric' })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="candidates">Candidates ({candidates.length})</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="details">Job Details</TabsTrigger>
            <TabsTrigger value="posting">Posting Info</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {job.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Key Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Job Code</Label>
                    <span className="text-sm font-medium">{job.jobCode || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Remote Type</Label>
                    <Badge variant="outline" className="capitalize">{job.remoteType?.toLowerCase() || 'Onsite'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <Label>Work Schedule</Label>
                    <span className="text-sm">{job.workSchedule || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Travel Required</Label>
                    <span className="text-sm">
                      {job.travelRequired ? `Yes (${job.travelPercentage || 0}%)` : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Hiring Manager</Label>
                    <span className="text-sm">{job.hiringManager || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Assigned Recruiter</Label>
                    <span className="text-sm">{job.assignedRecruiter || '-'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {job.responsibilities && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {job.responsibilities}
                  </p>
                </CardContent>
              </Card>
            )}

            {job.qualifications && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Qualifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {job.qualifications}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Candidates Tab */}
          <TabsContent value="candidates" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Candidates</CardTitle>
                    <CardDescription>
                      {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} applied for this position
                    </CardDescription>
                  </div>
                  <Button>
                    <Users className="mr-2 h-4 w-4" />
                    Add Candidate
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No candidates have applied yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      candidates.map((candidate) => (
                        <TableRow 
                          key={candidate.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            console.log('Candidate clicked:', candidate)
                            setSelectedCandidate(candidate)
                            setViewCandidateDialogOpen(true)
                          }}
                        >
                          <TableCell className="font-medium">{candidate.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-muted-foreground" />
                                {candidate.email}
                              </div>
                              {candidate.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {candidate.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(candidate.status)}>
                              {candidate.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{candidate.experience} years</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4 text-yellow-500" />
                              {candidate.rating}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(candidate.appliedDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedCandidate(candidate)
                                    setViewCandidateDialogOpen(true)
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Resume
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Schedule Interview
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Move to Next Stage
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
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

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.requiredSkills.length > 0 ? (
                      job.requiredSkills.map((skill, idx) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No required skills specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.preferredSkills.length > 0 ? (
                      job.preferredSkills.map((skill, idx) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No preferred skills specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Experience & Education</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Experience Range</Label>
                    <span className="text-sm font-medium">
                      {job.experienceMin || 0} - {job.experienceMax || '∞'} years
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Education Level</Label>
                    <span className="text-sm">
                      {job.educationLevel?.replace('_', ' ') || 'Not specified'}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Certifications & Languages</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="mb-2 block">Certifications</Label>
                    <div className="flex flex-wrap gap-2">
                      {job.certifications.length > 0 ? (
                        job.certifications.map((cert, idx) => (
                          <Badge key={idx} variant="outline">{cert}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">None required</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">Languages</Label>
                    <div className="flex flex-wrap gap-2">
                      {job.languages.length > 0 ? (
                        job.languages.map((lang, idx) => (
                          <Badge key={idx} variant="outline">{lang}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Not specified</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Job Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Hiring Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Number of Positions</Label>
                    <span className="text-sm font-medium">{job.numberOfPositions}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Hiring Manager</Label>
                    <span className="text-sm">{job.hiringManager || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Assigned Recruiter</Label>
                    <span className="text-sm">{job.assignedRecruiter || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Expected Start Date</Label>
                    <span className="text-sm">
                      {job.expectedStartDate ? new Date(job.expectedStartDate).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Application Deadline</Label>
                    <span className="text-sm">
                      {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'No deadline'}
                    </span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Compensation & Benefits</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <Label>Salary Range</Label>
                    <span className="text-sm font-semibold">{job.salaryRange || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Commission/Bonus</Label>
                    <span className="text-sm">{job.commission || '-'}</span>
                  </div>
                  <div>
                    <Label className="mb-2 block">Benefits Package</Label>
                    <p className="text-sm text-muted-foreground">
                      {job.benefits || 'Not specified'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Work Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex justify-between">
                    <Label>Work Schedule</Label>
                    <span className="text-sm">{job.workSchedule || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <Label>Travel Required</Label>
                    <span className="text-sm">
                      {job.travelRequired ? `Yes (${job.travelPercentage || 0}%)` : 'No'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Posting Info Tab */}
          <TabsContent value="posting" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Posting Channels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {job.postingChannels.length > 0 ? (
                    job.postingChannels.map((channel, idx) => (
                      <Badge key={idx} variant="outline">{channel}</Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No posting channels specified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Posting Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <Label>Posted Date</Label>
                  <span className="text-sm">
                    {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <Label>Expiry Date</Label>
                  <span className="text-sm">
                    {job.expiryDate ? new Date(job.expiryDate).toLocaleDateString() : 'No expiry'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <Label>Job Code</Label>
                  <span className="text-sm font-medium">{job.jobCode || '-'}</span>
                </div>
              </CardContent>
            </Card>

            {job.internalNotes && (
              <Card>
                <CardHeader>
                  <CardTitle>Internal Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{job.internalNotes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Job Dialog */}
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

        {/* View Candidate Dialog */}
        <Dialog open={viewCandidateDialogOpen} onOpenChange={setViewCandidateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
              <DialogDescription>
                Comprehensive candidate information and application details
              </DialogDescription>
            </DialogHeader>
            {selectedCandidate ? (
              <>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="application">Application</TabsTrigger>
                    <TabsTrigger value="interviews">Interviews</TabsTrigger>
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
                        <div>
                          <Label className="text-xs text-muted-foreground">Full Name</Label>
                          <p className="text-sm font-medium">{selectedCandidate.name}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Email</Label>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a href={`mailto:${selectedCandidate.email}`} className="text-sm hover:underline">
                              {selectedCandidate.email}
                            </a>
                          </div>
                        </div>
                        {selectedCandidate.phone && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Phone</Label>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a href={`tel:${selectedCandidate.phone}`} className="text-sm hover:underline">
                                {selectedCandidate.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {selectedCandidate.linkedin && (
                          <div>
                            <Label className="text-xs text-muted-foreground">LinkedIn</Label>
                            <div className="flex items-center gap-2">
                              <Linkedin className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={`https://${selectedCandidate.linkedin}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm hover:underline"
                              >
                                {selectedCandidate.linkedin}
                              </a>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Application Status</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(selectedCandidate.status)}>
                              {selectedCandidate.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Position Applied</Label>
                          <p className="text-sm font-medium">{selectedCandidate.position}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Experience</Label>
                          <p className="text-sm">{selectedCandidate.experience} years</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Rating</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Target className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{selectedCandidate.rating}/5</span>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Applied Date</Label>
                          <p className="text-sm">
                            {new Date(selectedCandidate.appliedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Application Tab */}
                <TabsContent value="application" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Application Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">Application Date</Label>
                          <p className="text-sm font-medium mt-1">
                            {new Date(selectedCandidate.appliedDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Current Status</Label>
                          <div className="mt-1">
                            <Badge variant={getStatusBadgeVariant(selectedCandidate.status)}>
                              {selectedCandidate.status}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Position</Label>
                          <p className="text-sm font-medium mt-1">{selectedCandidate.position}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Years of Experience</Label>
                          <p className="text-sm mt-1">{selectedCandidate.experience} years</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Candidate Rating</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Target
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= selectedCandidate.rating
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{selectedCandidate.rating}/5</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Interviews Tab */}
                <TabsContent value="interviews" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Interview History</CardTitle>
                        <Button size="sm">
                          <Calendar className="mr-2 h-4 w-4" />
                          Schedule Interview
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedCandidate.status === 'INTERVIEW' || selectedCandidate.status === 'SCREENING' ? (
                          <div className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    Screening Interview
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Scheduled for {new Date(Date.now() + 2 * 86400000).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Interviewer: {job?.hiringManager || 'TBD'}
                                </p>
                              </div>
                              <Badge variant="secondary">Upcoming</Badge>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-8 text-sm">
                            No interviews scheduled yet
                          </div>
                        )}
                      </div>
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
                      <div className="space-y-3">
                        {selectedCandidate.resumeUrl ? (
                          <div className="flex items-center justify-between border rounded-lg p-4">
                            <div className="flex items-center gap-3">
                              <FileText className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Resume</p>
                                <p className="text-xs text-muted-foreground">
                                  {selectedCandidate.resumeUrl.split('/').pop()}
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
                      </div>
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
                      <div className="space-y-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium">Initial Application Review</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(selectedCandidate.appliedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Candidate applied for {selectedCandidate.position} position.
                            {selectedCandidate.experience} years of experience. Rating: {selectedCandidate.rating}/5.
                          </p>
                        </div>
                        <Button variant="outline" className="w-full">
                          <FileText className="mr-2 h-4 w-4" />
                          Add Note
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  </TabsContent>
                </Tabs>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setViewCandidateDialogOpen(false)}>
                    Close
                  </Button>
                  <Button>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Candidate
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No candidate selected
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}


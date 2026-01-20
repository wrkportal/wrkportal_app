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
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { UserCheck, Calendar, CheckCircle, Clock, Briefcase, Mail, Phone, MoreVertical, Eye, Plus, CheckSquare, Mail as MailIcon, FileText } from 'lucide-react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'

interface OnboardingTask {
  id: string
  title: string
  status: string
  dueDate: string | null
}

interface Onboarding {
  id: string
  employeeName: string
  jobTitle: string
  startDate: string
  status: string
  progress: number
  tasks: OnboardingTask[]
}

function OnboardingPageInner() {
  const [onboardings, setOnboardings] = useState<Onboarding[]>([])
  const [loading, setLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedOnboarding, setSelectedOnboarding] = useState<Onboarding | null>(null)
  const [formData, setFormData] = useState({
    employeeName: '',
    jobTitle: '',
    startDate: '',
  })

  useEffect(() => {
    fetchOnboardings()
  }, [])

  const fetchOnboardings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recruitment/onboarding')
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding')
      }
      const data = await response.json()
      setOnboardings(data.onboardings || [])
    } catch (error) {
      console.error('Error fetching onboarding:', error)
      setOnboardings([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddOnboarding = async () => {
    try {
      const onboardingData = {
        employeeName: formData.employeeName,
        jobTitle: formData.jobTitle,
        startDate: formData.startDate,
      }

      const response = await fetch('/api/recruitment/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create onboarding')
      }

      const data = await response.json()
      setOnboardings([...onboardings, data.onboarding])
      setAddDialogOpen(false)
      setFormData({ employeeName: '', jobTitle: '', startDate: '' })
    } catch (error) {
      console.error('Error adding onboarding:', error)
    }
  }

  const handleViewOnboarding = (onboarding: Onboarding) => {
    setSelectedOnboarding(onboarding)
    setViewDialogOpen(true)
  }

  const handleCompleteTask = (onboardingId: string, taskId: string) => {
    setOnboardings(onboardings.map(ob => {
      if (ob.id === onboardingId) {
        const updatedTasks = ob.tasks.map(t =>
          t.id === taskId ? { ...t, status: 'COMPLETED' as any } : t
        )
        const completedCount = updatedTasks.filter(t => t.status === 'COMPLETED').length
        const progress = (completedCount / updatedTasks.length) * 100
        const status = progress === 100 ? 'COMPLETED' as any : 'IN_PROGRESS' as any
        return { ...ob, tasks: updatedTasks, progress, status }
      }
      return ob
    }))
  }

  const stats = {
    total: onboardings.length,
    inProgress: onboardings.filter((o) => o.status === 'IN_PROGRESS').length,
    completed: onboardings.filter((o) => o.status === 'COMPLETED').length,
    pending: onboardings.filter((o) => o.status === 'PENDING').length,
  }

  return (
    <RecruitmentPageLayout title="Onboarding" description="Track new employee onboarding progress">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Onboarding</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Active processes</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Ongoing</p>
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
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Not started</p>
            </CardContent>
          </Card>
        </div>

        {/* Add Onboarding Button */}
        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee to Onboarding
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Employee to Onboarding</DialogTitle>
                <DialogDescription>
                  Start the onboarding process for a new employee
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="employeeName">Employee Name *</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
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
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddOnboarding}>Start Onboarding</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Onboarding Table */}
        <Card>
          <CardHeader>
            <CardTitle>Onboarding Progress</CardTitle>
            <CardDescription>
              Track onboarding tasks and progress for new employees
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : onboardings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No onboarding processes found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {onboardings.map((onboarding) => (
                    <TableRow key={onboarding.id}>
                      <TableCell className="font-medium">{onboarding.employeeName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          {onboarding.jobTitle}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(onboarding.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={onboarding.progress} className="w-32" />
                          <span className="text-xs text-muted-foreground">{onboarding.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {onboarding.tasks.filter((t) => t.status === 'COMPLETED').length} / {onboarding.tasks.length} completed
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={onboarding.status === 'COMPLETED' ? 'default' : onboarding.status === 'IN_PROGRESS' ? 'secondary' : 'outline'}>
                          {onboarding.status.replace('_', ' ')}
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
                            <DropdownMenuItem onClick={() => handleViewOnboarding(onboarding)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Checklist
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <CheckSquare className="mr-2 h-4 w-4" />
                              Complete Tasks
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <MailIcon className="mr-2 h-4 w-4" />
                              Send Welcome Email
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="mr-2 h-4 w-4" />
                              View Documents
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

        {/* View Onboarding Checklist Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Onboarding Checklist</DialogTitle>
              <DialogDescription>
                {selectedOnboarding?.employeeName} - {selectedOnboarding?.jobTitle}
              </DialogDescription>
            </DialogHeader>
            {selectedOnboarding && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {selectedOnboarding.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {task.status === 'COMPLETED' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className={task.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}>
                          {task.title}
                        </span>
                      </div>
                      {task.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteTask(selectedOnboarding.id, task.id)}
                        >
                          Mark Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Close</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </RecruitmentPageLayout>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <OnboardingPageInner />
    </Suspense>
  )
}

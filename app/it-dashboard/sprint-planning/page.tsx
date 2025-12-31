'use client'

import { useState } from 'react'
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
  Calendar,
  Users,
  Target,
  Clock,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  Flag
} from 'lucide-react'

interface Sprint {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  team: string
  velocity: number
  plannedPoints: number
  completedPoints: number
}

interface UserStory {
  id: string
  title: string
  description: string
  sprintId: string
  priority: string
  storyPoints: number
  status: string
  assignee: string | null
  tags: string[]
  acceptanceCriteria: string[]
}

const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

export default function SprintPlanningPage() {
  const [activeTab, setActiveTab] = useState('sprints')
  const [sprints] = useState<Sprint[]>([
    {
      id: 'SPRINT-001',
      name: 'Sprint 24.12',
      startDate: '2024-12-09',
      endDate: '2024-12-23',
      status: 'ACTIVE',
      team: 'Development Team Alpha',
      velocity: 42,
      plannedPoints: 45,
      completedPoints: 28,
    },
    {
      id: 'SPRINT-002',
      name: 'Sprint 24.13',
      startDate: '2024-12-24',
      endDate: '2025-01-06',
      status: 'PLANNED',
      team: 'Development Team Alpha',
      velocity: 0,
      plannedPoints: 40,
      completedPoints: 0,
    },
    {
      id: 'SPRINT-003',
      name: 'Sprint 24.11',
      startDate: '2024-11-25',
      endDate: '2024-12-08',
      status: 'COMPLETED',
      team: 'Development Team Alpha',
      velocity: 38,
      plannedPoints: 40,
      completedPoints: 38,
    },
  ])

  const [userStories] = useState<UserStory[]>([
    {
      id: 'US-001',
      title: 'User Authentication Enhancement',
      description: 'Add two-factor authentication for enhanced security',
      sprintId: 'SPRINT-001',
      priority: 'HIGH',
      storyPoints: 8,
      status: 'IN_PROGRESS',
      assignee: 'John Doe',
      tags: ['backend', 'security'],
      acceptanceCriteria: [
        'User can enable 2FA from settings',
        'QR code generation for authenticator apps',
        'SMS backup option',
      ],
    },
    {
      id: 'US-002',
      title: 'Dashboard Performance Optimization',
      description: 'Optimize dashboard loading time to under 2 seconds',
      sprintId: 'SPRINT-001',
      priority: 'MEDIUM',
      storyPoints: 5,
      status: 'TO_DO',
      assignee: 'Jane Smith',
      tags: ['frontend', 'performance'],
      acceptanceCriteria: [
        'Dashboard loads in under 2 seconds',
        'Lazy loading for charts',
        'Caching implementation',
      ],
    },
    {
      id: 'US-003',
      title: 'API Rate Limiting',
      description: 'Implement rate limiting for API endpoints',
      sprintId: 'SPRINT-001',
      priority: 'HIGH',
      storyPoints: 3,
      status: 'DONE',
      assignee: 'Bob Wilson',
      tags: ['backend', 'api'],
      acceptanceCriteria: [
        'Rate limit of 100 requests per minute',
        'Proper error responses',
        'Rate limit headers in response',
      ],
    },
    {
      id: 'US-004',
      title: 'Mobile Responsive Design',
      description: 'Improve mobile responsiveness for user dashboard',
      sprintId: 'SPRINT-002',
      priority: 'MEDIUM',
      storyPoints: 5,
      status: 'TO_DO',
      assignee: null,
      tags: ['frontend', 'mobile'],
      acceptanceCriteria: [
        'Works on screens 320px and above',
        'Touch-friendly interactions',
        'Optimized layouts for mobile',
      ],
    },
  ])

  const sprintStats = {
    active: sprints.filter(s => s.status === 'ACTIVE').length,
    planned: sprints.filter(s => s.status === 'PLANNED').length,
    completed: sprints.filter(s => s.status === 'COMPLETED').length,
    avgVelocity: sprints.filter(s => s.status === 'COMPLETED').reduce((sum, s) => sum + s.velocity, 0) / sprints.filter(s => s.status === 'COMPLETED').length || 0,
  }

  const storyStats = {
    total: userStories.length,
    todo: userStories.filter(s => s.status === 'TO_DO').length,
    inProgress: userStories.filter(s => s.status === 'IN_PROGRESS').length,
    done: userStories.filter(s => s.status === 'DONE').length,
    totalPoints: userStories.reduce((sum, s) => sum + s.storyPoints, 0),
  }

  const statusData = [
    { name: 'To Do', value: storyStats.todo },
    { name: 'In Progress', value: storyStats.inProgress },
    { name: 'Done', value: storyStats.done },
  ]

  const priorityData = [
    { name: 'High', value: userStories.filter(s => s.priority === 'HIGH').length },
    { name: 'Medium', value: userStories.filter(s => s.priority === 'MEDIUM').length },
    { name: 'Low', value: userStories.filter(s => s.priority === 'LOW').length },
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'default'
      case 'COMPLETED':
      case 'DONE':
        return 'secondary'
      case 'PLANNED':
      case 'TO_DO':
        return 'outline'
      default:
        return 'outline'
    }
  }

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

  const activeSprint = sprints.find(s => s.status === 'ACTIVE')
  const activeSprintStories = userStories.filter(s => s.sprintId === activeSprint?.id)

  return (
    <ITPageLayout 
      title="Sprint Planning" 
      description="Plan sprints, manage user stories, and track development work"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sprints">Sprints</TabsTrigger>
          <TabsTrigger value="stories">User Stories</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sprint</CardTitle>
                <Flag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sprintStats.active}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Planned Sprints</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sprintStats.planned}</div>
                <p className="text-xs text-muted-foreground">Upcoming sprints</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Velocity</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sprintStats.avgVelocity.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Story points</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyStats.total}</div>
                <p className="text-xs text-muted-foreground">{storyStats.totalPoints} story points</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {activeTab === 'stories' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Stories by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
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
                  <CardTitle>Stories by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={priorityData}>
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
          )}

          {/* Sprints Table */}
          {activeTab === 'sprints' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Sprints</CardTitle>
                    <CardDescription>
                      {sprints.length} sprint(s) tracked
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Sprint
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Sprint</DialogTitle>
                        <DialogDescription>
                          Plan a new development sprint
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Sprint Name</Label>
                          <Input id="name" placeholder="e.g., Sprint 24.13" />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input id="startDate" type="date" />
                          </div>
                          <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input id="endDate" type="date" />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="team">Team</Label>
                          <Input id="team" placeholder="Team name" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button>Create Sprint</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sprint ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Planned Points</TableHead>
                      <TableHead>Completed Points</TableHead>
                      <TableHead>Velocity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sprints.map((sprint) => (
                      <TableRow key={sprint.id}>
                        <TableCell className="font-medium">{sprint.id}</TableCell>
                        <TableCell className="font-medium">{sprint.name}</TableCell>
                        <TableCell>{new Date(sprint.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(sprint.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{sprint.team}</TableCell>
                        <TableCell>{sprint.plannedPoints}</TableCell>
                        <TableCell>{sprint.completedPoints}</TableCell>
                        <TableCell>{sprint.velocity}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(sprint.status)}>
                            {sprint.status}
                          </Badge>
                        </TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Sprint
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* User Stories Table */}
          {activeTab === 'stories' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>User Stories</CardTitle>
                    <CardDescription>
                      {userStories.length} user story/stories tracked
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Story
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New User Story</DialogTitle>
                        <DialogDescription>
                          Add a new user story to the backlog or sprint
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Story Title *</Label>
                          <Input id="title" placeholder="As a user, I want to..." />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" rows={3} placeholder="Story description..." />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="sprint">Sprint</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select sprint" />
                              </SelectTrigger>
                              <SelectContent>
                                {sprints.map(sprint => (
                                  <SelectItem key={sprint.id} value={sprint.id}>
                                    {sprint.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="points">Story Points</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select points" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1</SelectItem>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="8">8</SelectItem>
                                <SelectItem value="13">13</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="priority">Priority</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="HIGH">High</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="LOW">Low</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
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
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button>Create Story</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Story ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Sprint</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell className="font-medium">{story.id}</TableCell>
                        <TableCell>
                          <div className="font-medium">{story.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-md">
                            {story.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          {sprints.find(s => s.id === story.sprintId)?.name || 'Backlog'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPriorityBadgeVariant(story.priority)}>
                            {story.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{story.storyPoints}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(story.status)}>
                            {story.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{story.assignee || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {story.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        </TableCell>
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
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Story
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Assign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </ITPageLayout>
  )
}


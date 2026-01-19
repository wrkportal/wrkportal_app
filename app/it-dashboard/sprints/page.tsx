'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Plus, 
  Calendar,
  Target,
  Clock,
  CheckCircle,
  MoreVertical,
  Eye,
  Edit,
  User,
  Flag,
  Users,
  TrendingUp
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
}

const COLORS = ['#9333ea', '#ec4899', '#f59e0b', '#10b981', '#ef4444']

export default function SprintsPage() {
  const [activeTab, setActiveTab] = useState('planning')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSprint, setActiveSprint] = useState({
    sprintId: '',
    sprintName: '',
    totalPoints: 0,
    completedPoints: 0,
    remainingPoints: 0,
    teamMembers: 0,
    completedStories: 0,
    inProgressStories: 0,
    todoStories: 0,
  })
  const [burndownData, setBurndownData] = useState<any[]>([])

  useEffect(() => {
    fetchSprints()
  }, [])

  const fetchSprints = async () => {
    try {
      setLoading(true)
      // Fetch sprints for IT projects
      const response = await fetch('/api/sprints?status=all')
      if (!response.ok) throw new Error('Failed to fetch sprints')
      const data = await response.json()
      
      // Filter for IT-related sprints (from SOFTWARE_DEVELOPMENT projects)
      const itSprints = (data.sprints || []).map((sprint: any) => ({
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate ? sprint.startDate.split('T')[0] : '',
        endDate: sprint.endDate ? sprint.endDate.split('T')[0] : '',
        status: sprint.status,
        team: sprint.project?.name || 'Unassigned',
        velocity: sprint.velocity || 0,
        plannedPoints: sprint.storyPoints || 0,
        completedPoints: sprint.completedStoryPoints || 0,
      }))
      
      setSprints(itSprints)
      
      // Get active sprint
      const active = itSprints.find((s: Sprint) => s.status === 'ACTIVE')
      if (active) {
        // Fetch tasks for active sprint
        const tasksResponse = await fetch(`/api/tasks?sprintId=${active.id}`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          const stories = (tasksData.tasks || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            sprintId: task.sprintId,
            priority: task.priority || 'MEDIUM',
            storyPoints: task.estimatedHours || 0,
            status: task.status,
            assignee: task.assignee?.name || null,
            tags: [],
          }))
          setUserStories(stories)
          
          const completed = stories.filter((s: UserStory) => s.status === 'DONE').length
          const inProgress = stories.filter((s: UserStory) => s.status === 'IN_PROGRESS').length
          const todo = stories.filter((s: UserStory) => s.status === 'TO_DO').length
          
          setActiveSprint({
            sprintId: active.id,
            sprintName: active.name,
            totalPoints: active.plannedPoints,
            completedPoints: active.completedPoints,
            remainingPoints: active.plannedPoints - active.completedPoints,
            teamMembers: 0, // Would need to fetch from project team
            completedStories: completed,
            inProgressStories: inProgress,
            todoStories: todo,
          })
        }
      }
    } catch (error) {
      console.error('Error fetching sprints:', error)
      setSprints([])
      setUserStories([])
    } finally {
      setLoading(false)
    }
  }

  const sprintStats = {
    active: sprints.filter(s => s.status === 'ACTIVE').length,
    planned: sprints.filter(s => s.status === 'PLANNED').length,
    avgVelocity: 38,
  }

  const storyStats = {
    total: userStories.length,
    todo: userStories.filter(s => s.status === 'TO_DO').length,
    inProgress: userStories.filter(s => s.status === 'IN_PROGRESS').length,
    done: userStories.filter(s => s.status === 'DONE').length,
  }

  const completionRate = (activeSprint.completedPoints / activeSprint.totalPoints) * 100

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

  return (
    <ITPageLayout 
      title="Sprints" 
      description="Plan and track development sprints"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="planning">Planning</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="space-y-6">
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
                <div className="text-2xl font-bold">{sprintStats.avgVelocity}</div>
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
                <p className="text-xs text-muted-foreground">User stories</p>
              </CardContent>
            </Card>
          </div>

          {/* Sprints Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sprints</CardTitle>
                  <CardDescription>{sprints.length} sprint(s) tracked</CardDescription>
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
                      <DialogDescription>Plan a new development sprint</DialogDescription>
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

          {/* User Stories Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Stories</CardTitle>
                  <CardDescription>{userStories.length} user story/stories tracked</CardDescription>
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
                      <DialogDescription>Add a new user story to the backlog or sprint</DialogDescription>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          {/* Sprint Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sprint</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSprint.sprintName}</div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completionRate.toFixed(0)}%</div>
                <p className="text-xs text-muted-foreground">
                  {activeSprint.completedPoints} / {activeSprint.totalPoints} points
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Remaining Points</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSprint.remainingPoints}</div>
                <p className="text-xs text-muted-foreground">Points remaining</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Size</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSprint.teamMembers}</div>
                <p className="text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>
          </div>

          {/* Burndown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sprint Burndown Chart</CardTitle>
              <CardDescription>Remaining story points over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="ideal" 
                    stroke="#e5e7eb" 
                    fill="#e5e7eb" 
                    fillOpacity={0.3}
                    strokeDasharray="5 5"
                    name="Ideal Burndown"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="remaining" 
                    stroke="#9333ea" 
                    fill="#9333ea" 
                    fillOpacity={0.6}
                    name="Actual Remaining"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Sprint Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Sprint Timeline</CardTitle>
              <CardDescription>
                {activeSprint.sprintName} - Progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Sprint Progress</p>
                    <p className="text-xs text-muted-foreground">
                      {activeSprint.completedPoints} of {activeSprint.totalPoints} story points completed
                    </p>
                  </div>
                  <Badge variant={completionRate >= 100 ? 'default' : completionRate >= 75 ? 'default' : 'destructive'}>
                    {completionRate.toFixed(0)}% Complete
                  </Badge>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div 
                    className="bg-blue-500 h-4 rounded-full transition-all"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="font-medium">{activeSprint.completedStories}</p>
                    <p className="text-muted-foreground">Done</p>
                  </div>
                  <div>
                    <p className="font-medium">{activeSprint.inProgressStories}</p>
                    <p className="text-muted-foreground">In Progress</p>
                  </div>
                  <div>
                    <p className="font-medium">{activeSprint.todoStories}</p>
                    <p className="text-muted-foreground">To Do</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ITPageLayout>
  )
}

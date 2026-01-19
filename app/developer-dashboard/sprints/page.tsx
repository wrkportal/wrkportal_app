'use client'

import { useState, useEffect } from 'react'
import { DeveloperPageLayout } from '@/components/developer/developer-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Progress } from '@/components/ui/progress'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  TrendingUp,
  MoreVertical,
  Edit,
  Play,
  Pause
} from 'lucide-react'

interface Sprint {
  id: string
  name: string
  goal: string
  workspace: string
  startDate: string
  endDate: string
  status: 'planning' | 'active' | 'completed'
  velocity: number
  capacity: number
  stories: number
  completed: number
  progress: number
}

interface UserStory {
  id: string
  title: string
  description: string
  sprint: string
  status: 'backlog' | 'todo' | 'in-progress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  storyPoints: number
  createdAt: string
}

export default function SprintsPage() {
  const [activeTab, setActiveTab] = useState('sprints')
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [userStories, setUserStories] = useState<UserStory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/sprints')
      // const data = await response.json()
      // setSprints(data.sprints || [])
      
      setSprints([])
      setUserStories([])
    } catch (error) {
      console.error('Error fetching data:', error)
      setSprints([])
      setUserStories([])
    } finally {
      setLoading(false)
    }
  }

  const sprintStats = {
    active: sprints.filter(s => s.status === 'active').length,
    completed: sprints.filter(s => s.status === 'completed').length,
    totalStories: userStories.length,
    completedStories: userStories.filter(s => s.status === 'done').length,
  }

  return (
    <DeveloperPageLayout 
      title="Sprints" 
      description="Plan and track sprint progress, user stories, and development work"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sprints</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sprintStats.active}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sprintStats.completed}</div>
              <p className="text-xs text-muted-foreground">This quarter</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stories</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sprintStats.totalStories}</div>
              <p className="text-xs text-muted-foreground">In backlog</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sprintStats.completedStories}</div>
              <p className="text-xs text-muted-foreground">Stories done</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="stories">User Stories</TabsTrigger>
              <TabsTrigger value="planning">Planning</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === 'sprints' ? 'New Sprint' : 'New Story'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {activeTab === 'sprints' ? 'Create Sprint' : 'Create User Story'}
                    </DialogTitle>
                    <DialogDescription>
                      {activeTab === 'sprints' 
                        ? 'Plan a new sprint with goals and timeline'
                        : 'Add a new user story to the backlog'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input placeholder="Enter name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea placeholder="Enter description" />
                    </div>
                    {activeTab === 'sprints' && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" />
                          </div>
                          <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input type="date" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Sprint Goal</Label>
                          <Textarea placeholder="What do you want to achieve in this sprint?" />
                        </div>
                      </>
                    )}
                    {activeTab === 'stories' && (
                      <div className="space-y-2">
                        <Label>Story Points</Label>
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
                    )}
                    <Button className="w-full">Create</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Sprints Tab */}
          <TabsContent value="sprints" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {sprints.map((sprint) => (
                <Card key={sprint.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{sprint.name}</CardTitle>
                        <CardDescription className="mt-1">{sprint.goal}</CardDescription>
                      </div>
                      <Badge variant={sprint.status === 'active' ? 'default' : sprint.status === 'completed' ? 'secondary' : 'outline'}>
                        {sprint.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{sprint.progress}%</span>
                    </div>
                    <Progress value={sprint.progress} />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Stories</div>
                        <div className="font-semibold">{sprint.completed}/{sprint.stories}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Velocity</div>
                        <div className="font-semibold">{sprint.velocity}/{sprint.capacity} pts</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(sprint.startDate).toLocaleDateString()} - {new Date(sprint.endDate).toLocaleDateString()}</span>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* User Stories Tab */}
          <TabsContent value="stories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Stories</CardTitle>
                <CardDescription>
                  Manage user stories, track progress, and assign work
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Sprint</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStories.map((story) => (
                      <TableRow key={story.id}>
                        <TableCell className="font-medium">{story.title}</TableCell>
                        <TableCell>
                          <Badge variant={
                            story.status === 'done' ? 'default' :
                            story.status === 'in-progress' ? 'secondary' :
                            story.status === 'review' ? 'outline' : 'outline'
                          }>
                            {story.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            story.priority === 'critical' ? 'destructive' :
                            story.priority === 'high' ? 'default' :
                            story.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {story.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>{story.assignee}</TableCell>
                        <TableCell>{story.storyPoints}</TableCell>
                        <TableCell>{story.sprint}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sprint Planning</CardTitle>
                <CardDescription>
                  Plan upcoming sprints, estimate capacity, and assign stories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Sprint planning tools coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}

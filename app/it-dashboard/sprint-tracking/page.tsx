'use client'

import { useState } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Calendar
} from 'lucide-react'

interface SprintMetrics {
  sprintId: string
  sprintName: string
  startDate: string
  endDate: string
  totalPoints: number
  completedPoints: number
  remainingPoints: number
  teamMembers: number
  completedStories: number
  inProgressStories: number
  todoStories: number
  velocity: number
}

export default function SprintTrackingPage() {
  const [activeSprint] = useState<SprintMetrics>({
    sprintId: 'SPRINT-001',
    sprintName: 'Sprint 24.12',
    startDate: '2024-12-09',
    endDate: '2024-12-23',
    totalPoints: 45,
    completedPoints: 28,
    remainingPoints: 17,
    teamMembers: 5,
    completedStories: 8,
    inProgressStories: 5,
    todoStories: 3,
    velocity: 42,
  })

  const [burndownData] = useState([
    { day: 'Day 1', remaining: 45, ideal: 45 },
    { day: 'Day 2', remaining: 42, ideal: 40 },
    { day: 'Day 3', remaining: 40, ideal: 35 },
    { day: 'Day 4', remaining: 38, ideal: 30 },
    { day: 'Day 5', remaining: 35, ideal: 25 },
    { day: 'Day 6', remaining: 33, ideal: 20 },
    { day: 'Day 7', remaining: 30, ideal: 15 },
    { day: 'Day 8', remaining: 28, ideal: 10 },
    { day: 'Day 9', remaining: 28, ideal: 5 },
    { day: 'Day 10', remaining: 28, ideal: 0 },
  ])

  const [velocityData] = useState([
    { sprint: 'Sprint 24.09', velocity: 35 },
    { sprint: 'Sprint 24.10', velocity: 38 },
    { sprint: 'Sprint 24.11', velocity: 38 },
    { sprint: 'Sprint 24.12', velocity: 28 },
  ])

  const [teamVelocity] = useState([
    { member: 'John Doe', completed: 12, inProgress: 3, todo: 2 },
    { member: 'Jane Smith', completed: 8, inProgress: 5, todo: 1 },
    { member: 'Bob Wilson', completed: 5, inProgress: 2, todo: 0 },
    { member: 'Alice Brown', completed: 3, inProgress: 3, todo: 0 },
  ])

  const completionRate = (activeSprint.completedPoints / activeSprint.totalPoints) * 100
  const daysRemaining = Math.ceil((new Date(activeSprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const pointsPerDay = activeSprint.remainingPoints / (daysRemaining || 1)

  return (
    <ITPageLayout 
      title="Sprint Tracking" 
      description="Track sprint progress, velocity, and team performance"
    >
      <div className="space-y-6">
        {/* Sprint Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Sprint</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSprint.sprintName}</div>
              <p className="text-xs text-muted-foreground">
                {daysRemaining} days remaining
              </p>
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
              <p className="text-xs text-muted-foreground">
                {pointsPerDay.toFixed(1)} points/day needed
              </p>
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

        {/* Story Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Stories</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeSprint.completedStories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{activeSprint.inProgressStories}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeSprint.todoStories}</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
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

          <Card>
            <CardHeader>
              <CardTitle>Velocity Trend</CardTitle>
              <CardDescription>Team velocity over previous sprints</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="sprint" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="velocity" fill="#9333ea" name="Velocity (Points)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Velocity Table */}
        <Card>
          <CardHeader>
            <CardTitle>Team Member Velocity</CardTitle>
            <CardDescription>
              Individual contribution breakdown for current sprint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead>Completed Points</TableHead>
                  <TableHead>In Progress</TableHead>
                  <TableHead>To Do</TableHead>
                  <TableHead>Total Assigned</TableHead>
                  <TableHead>Completion %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamVelocity.map((member) => {
                  const total = member.completed + member.inProgress + member.todo
                  const completion = total > 0 ? (member.completed / total) * 100 : 0
                  return (
                    <TableRow key={member.member}>
                      <TableCell className="font-medium">{member.member}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-green-600">
                          {member.completed}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-orange-600">
                          {member.inProgress}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.todo}
                        </Badge>
                      </TableCell>
                      <TableCell>{total}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${completion}%` }}
                            />
                          </div>
                          <span className="text-sm">{completion.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Sprint Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Sprint Timeline</CardTitle>
            <CardDescription>
              {activeSprint.sprintName} - {new Date(activeSprint.startDate).toLocaleDateString()} to {new Date(activeSprint.endDate).toLocaleDateString()}
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
      </div>
    </ITPageLayout>
  )
}


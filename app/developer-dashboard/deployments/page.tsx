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
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Search, 
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  GitBranch,
  User,
  Calendar,
  Server,
  Cloud,
  RotateCcw,
  MoreVertical,
  Eye,
  History,
  Activity,
  Code,
  Settings,
  AlertCircle as AlertIcon,
  Play
} from 'lucide-react'

interface Deployment {
  id: string
  environment: string
  application: string
  version: string
  branch: string
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'ROLLED_BACK'
  deployedBy: string
  deployedAt: string
  duration: number
  buildNumber: string
  commitHash: string
  rollbackAvailable: boolean
  pipelineId: string
}

interface TimelineEvent {
  id: string
  type: 'code_change' | 'pipeline_execution' | 'deployment' | 'config_change' | 'alert' | 'incident' | 'manual_action'
  timestamp: string
  actor: string
  action: string
  description: string
  target: string
  environment?: string
  status?: string
  metadata?: Record<string, any>
}

export default function DeploymentsPage() {
  const [activeTab, setActiveTab] = useState('deployments')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/deployments')
      // const data = await response.json()
      // setDeployments(data.deployments || [])
      // setTimelineEvents(data.timelineEvents || [])
      
      setDeployments([])
      setTimelineEvents([])
    } catch (error) {
      console.error('Error fetching data:', error)
      setDeployments([])
      setTimelineEvents([])
    } finally {
      setLoading(false)
    }
  }

  const deploymentStats = {
    total: deployments.length,
    success: deployments.filter(d => d.status === 'SUCCESS').length,
    failed: deployments.filter(d => d.status === 'FAILED').length,
    inProgress: deployments.filter(d => d.status === 'IN_PROGRESS').length,
    avgDuration: deployments.reduce((sum, d) => sum + d.duration, 0) / deployments.length || 0,
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default'
      case 'FAILED':
        return 'destructive'
      case 'IN_PROGRESS':
        return 'default'
      case 'ROLLED_BACK':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'code_change':
        return <Code className="h-4 w-4 text-blue-600" />
      case 'pipeline_execution':
        return <Play className="h-4 w-4 text-purple-600" />
      case 'deployment':
        return <Rocket className="h-4 w-4 text-green-600" />
      case 'config_change':
        return <Settings className="h-4 w-4 text-orange-600" />
      case 'alert':
      case 'incident':
        return <AlertIcon className="h-4 w-4 text-red-600" />
      case 'manual_action':
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'In progress...'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <DeveloperPageLayout 
      title="Deployments" 
      description="Track deployments, manage environments, and monitor activity timeline"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deployments</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deploymentStats.total}</div>
              <p className="text-xs text-muted-foreground">All deployments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{deploymentStats.success}</div>
              <p className="text-xs text-muted-foreground">Successful deploys</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{deploymentStats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed deploys</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(Math.round(deploymentStats.avgDuration))}</div>
              <p className="text-xs text-muted-foreground">Deployment time</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="deployments">Deployments</TabsTrigger>
              <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
              <TabsTrigger value="environments">Environments</TabsTrigger>
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
            </div>
          </div>

          {/* Deployments Tab */}
          <TabsContent value="deployments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Deployments</CardTitle>
                <CardDescription>
                  Track deployment history, status, and rollback capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application</TableHead>
                      <TableHead>Environment</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Deployed By</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Deployed At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-medium">{deployment.application}</TableCell>
                        <TableCell>
                          <Badge variant={deployment.environment === 'Production' ? 'destructive' : deployment.environment === 'Staging' ? 'default' : 'secondary'}>
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell>{deployment.version}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span className="text-sm">{deployment.branch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(deployment.status)}>
                            {deployment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{deployment.deployedBy}</TableCell>
                        <TableCell>{formatDuration(deployment.duration)}</TableCell>
                        <TableCell>{new Date(deployment.deployedAt).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <History className="h-4 w-4 mr-2" />
                                View Logs
                              </DropdownMenuItem>
                              {deployment.rollbackAvailable && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-orange-600">
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Rollback
                                  </DropdownMenuItem>
                                </>
                              )}
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

          {/* Activity Timeline Tab - Critical Feature */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <CardDescription>
                  Chronological, append-only timeline of all system changes, deployments, and events. 
                  Supports incident investigation, auditing, and root cause analysis.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map((event, index) => (
                      <div key={event.id} className="flex gap-4 pb-4 border-b last:border-0">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{event.action}</span>
                              <Badge variant="outline" className="text-xs">
                                {event.type.replace('_', ' ')}
                              </Badge>
                              {event.status && (
                                <Badge variant={event.status === 'SUCCESS' ? 'default' : event.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                  {event.status}
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>By: {event.actor}</span>
                            <span>Target: {event.target}</span>
                            {event.environment && <span>Env: {event.environment}</span>}
                          </div>
                          {event.metadata && Object.keys(event.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer">View Metadata</summary>
                              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environments</CardTitle>
                <CardDescription>
                  Manage deployment environments and their configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  Environment management coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}

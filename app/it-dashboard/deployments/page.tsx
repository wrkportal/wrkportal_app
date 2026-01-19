'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Cloud
} from 'lucide-react'

interface Deployment {
  id: string
  environment: string
  application: string
  version: string
  branch: string
  status: string
  deployedBy: string
  deployedAt: string
  duration: number
  buildNumber: string
  commitHash: string
  rollbackAvailable: boolean
}

export default function DeploymentsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [loading, setLoading] = useState(true)
  const [deploymentStats, setDeploymentStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    inProgress: 0,
    avgDuration: 0,
  })

  useEffect(() => {
    fetchDeployments()
  }, [activeTab])

  const fetchDeployments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/it/deployments')
      if (!response.ok) throw new Error('Failed to fetch deployments')
      const data = await response.json()
      setDeployments(data.deployments || [])
      setDeploymentStats(data.stats || { total: 0, success: 0, failed: 0, inProgress: 0, avgDuration: 0 })
    } catch (error) {
      console.error('Error fetching deployments:', error)
      setDeployments([])
      setDeploymentStats({ total: 0, success: 0, failed: 0, inProgress: 0, avgDuration: 0 })
    } finally {
      setLoading(false)
    }
  }
    {
      id: 'DEP-002',
      environment: 'Staging',
      application: 'workportal-backend',
      version: 'v2.4.2',
      branch: 'develop',
      status: 'SUCCESS',
      deployedBy: 'Jane Smith',
      deployedAt: '2024-12-15T08:30:00',
      duration: 380,
      buildNumber: '1248',
      commitHash: 'def456',
      rollbackAvailable: true,
    },
    {
      id: 'DEP-003',
      environment: 'Production',
      application: 'workportal-api',
      version: 'v2.3.9',
      branch: 'main',
      status: 'FAILED',
      deployedBy: 'Bob Wilson',
      deployedAt: '2024-12-14T16:20:00',
      duration: 1250,
      buildNumber: '1245',
      commitHash: 'ghi789',
      rollbackAvailable: true,
    },
    {
      id: 'DEP-004',
      environment: 'Development',
      application: 'workportal-frontend',
      version: 'v2.4.0',
      branch: 'feature/new-dashboard',
      status: 'IN_PROGRESS',
      deployedBy: 'Alice Brown',
      deployedAt: '2024-12-15T09:45:00',
      duration: 0,
      buildNumber: '1249',
      commitHash: 'jkl012',
      rollbackAvailable: false,
    },
  ])

  // Use stats from API
  const deploymentTrendData = [
    { day: 'Mon', deployments: 0, success: 0, failed: 0 },
    { day: 'Tue', deployments: 0, success: 0, failed: 0 },
    { day: 'Wed', deployments: 0, success: 0, failed: 0 },
    { day: 'Thu', deployments: 0, success: 0, failed: 0 },
    { day: 'Fri', deployments: 0, success: 0, failed: 0 },
  ]

  const environmentData = [
    { environment: 'Production', deployments: deployments.filter(d => d.environment === 'Production').length },
    { environment: 'Staging', deployments: deployments.filter(d => d.environment === 'Staging').length },
    { environment: 'Development', deployments: deployments.filter(d => d.environment === 'Development').length },
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return 'default'
      case 'FAILED':
        return 'destructive'
      case 'IN_PROGRESS':
        return 'default'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'IN_PROGRESS':
        return <Clock className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
  }

  const getEnvironmentBadgeVariant = (env: string) => {
    switch (env) {
      case 'Production':
        return 'destructive'
      case 'Staging':
        return 'default'
      case 'Development':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const filteredDeployments = deployments.filter(d => {
    if (activeTab === 'success') return d.status === 'SUCCESS'
    if (activeTab === 'failed') return d.status === 'FAILED'
    if (activeTab === 'in-progress') return d.status === 'IN_PROGRESS'
    return true
  })

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'In progress...'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <ITPageLayout 
      title="Deployments" 
      description="Track application deployments across environments"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="success">Success</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
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

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Trends</CardTitle>
                <CardDescription>Daily deployment activity this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={deploymentTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#10b981" name="Successful" />
                    <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Deployments by Environment</CardTitle>
                <CardDescription>Distribution across environments</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={environmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="environment" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="deployments" fill="#9333ea" name="Deployments" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Deployments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Deployments</CardTitle>
              <CardDescription>
                {filteredDeployments.length} deployment(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deployment ID</TableHead>
                    <TableHead>Application</TableHead>
                    <TableHead>Environment</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deployed By</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Deployed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeployments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No deployments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-medium">{deployment.id}</TableCell>
                        <TableCell className="font-medium">{deployment.application}</TableCell>
                        <TableCell>
                          <Badge variant={getEnvironmentBadgeVariant(deployment.environment)}>
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deployment.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <GitBranch className="h-3 w-3" />
                            <span className="font-mono">{deployment.branch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.status)}
                            <Badge variant={getStatusBadgeVariant(deployment.status)}>
                              {deployment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{deployment.deployedBy}</TableCell>
                        <TableCell>{formatDuration(deployment.duration)}</TableCell>
                        <TableCell>
                          {new Date(deployment.deployedAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ITPageLayout>
  )
}


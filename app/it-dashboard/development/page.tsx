'use client'

import { useState } from 'react'
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
  LineChart,
  Line,
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
  GitBranch,
  GitCommit,
  GitPullRequest,
  Rocket,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Eye,
  GitMerge,
  GitBranch as BranchIcon,
  Code,
  TrendingUp
} from 'lucide-react'

interface Repository {
  id: string
  name: string
  description: string
  branch: string
  lastCommit: string
  commits: number
  contributors: number
  language: string
  updatedAt: string
}

interface PullRequest {
  id: string
  title: string
  author: string
  sourceBranch: string
  targetBranch: string
  status: string
  approvals: number
  comments: number
  createdAt: string
  filesChanged: number
  additions: number
  deletions: number
}

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
}

const COLORS = ['#9333ea', '#10b981', '#ef4444', '#f59e0b']

export default function DevelopmentPage() {
  const [activeTab, setActiveTab] = useState('repository')
  const [repositories] = useState<Repository[]>([
    {
      id: 'REPO-001',
      name: 'workportal-frontend',
      description: 'Main frontend application',
      branch: 'main',
      lastCommit: 'feat: Add IT dashboard',
      commits: 1247,
      contributors: 8,
      language: 'TypeScript',
      updatedAt: '2024-12-15T10:30:00',
    },
    {
      id: 'REPO-002',
      name: 'workportal-backend',
      description: 'Backend API and services',
      branch: 'develop',
      lastCommit: 'fix: Resolve auth token expiration',
      commits: 892,
      contributors: 6,
      language: 'Python',
      updatedAt: '2024-12-15T09:15:00',
    },
  ])

  const [pullRequests] = useState<PullRequest[]>([
    {
      id: 'PR-001',
      title: 'feat: Add IT dashboard with sprint planning',
      author: 'John Doe',
      sourceBranch: 'feature/it-dashboard',
      targetBranch: 'develop',
      status: 'OPEN',
      approvals: 1,
      comments: 3,
      createdAt: '2024-12-14T10:00:00',
      filesChanged: 25,
      additions: 1200,
      deletions: 150,
    },
    {
      id: 'PR-002',
      title: 'fix: Resolve authentication token expiration',
      author: 'Jane Smith',
      sourceBranch: 'fix/auth-token',
      targetBranch: 'main',
      status: 'APPROVED',
      approvals: 1,
      comments: 1,
      createdAt: '2024-12-13T14:20:00',
      filesChanged: 8,
      additions: 80,
      deletions: 45,
    },
  ])

  const [deployments] = useState<Deployment[]>([
    {
      id: 'DEP-001',
      environment: 'Production',
      application: 'workportal-frontend',
      version: 'v2.4.1',
      branch: 'main',
      status: 'SUCCESS',
      deployedBy: 'John Doe',
      deployedAt: '2024-12-15T10:00:00',
      duration: 420,
    },
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
    },
  ])

  const devStats = {
    totalRepos: repositories.length,
    openPRs: pullRequests.filter(pr => pr.status === 'OPEN').length,
    mergedPRs: pullRequests.filter(pr => pr.status === 'MERGED').length,
    totalDeployments: deployments.length,
    successfulDeployments: deployments.filter(d => d.status === 'SUCCESS').length,
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'SUCCESS':
        return 'default'
      case 'APPROVED':
        return 'default'
      case 'CHANGES_REQUESTED':
      case 'FAILED':
        return 'destructive'
      case 'MERGED':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'APPROVED':
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CHANGES_REQUESTED':
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'MERGED':
        return <GitMerge className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  return (
    <ITPageLayout 
      title="Development" 
      description="Manage code repositories, pull requests, and deployments"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="repository">Repository</TabsTrigger>
          <TabsTrigger value="pull-requests">Pull Requests</TabsTrigger>
          <TabsTrigger value="deployments">Deployments</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Repositories</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devStats.totalRepos}</div>
                <p className="text-xs text-muted-foreground">Code repositories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open PRs</CardTitle>
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devStats.openPRs}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merged PRs</CardTitle>
                <GitMerge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devStats.mergedPRs}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployments</CardTitle>
                <Rocket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{devStats.successfulDeployments}</div>
                <p className="text-xs text-muted-foreground">Successful</p>
              </CardContent>
            </Card>
          </div>

          {/* Repository Tab */}
          {activeTab === 'repository' && (
            <Card>
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>{repositories.length} repository/repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Commits</TableHead>
                      <TableHead>Contributors</TableHead>
                      <TableHead>Last Commit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell className="font-medium">{repo.name}</TableCell>
                        <TableCell>{repo.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <BranchIcon className="mr-1 h-3 w-3" />
                            {repo.branch}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{repo.language}</Badge>
                        </TableCell>
                        <TableCell>{repo.commits.toLocaleString()}</TableCell>
                        <TableCell>{repo.contributors}</TableCell>
                        <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                          {repo.lastCommit}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Pull Requests Tab */}
          {activeTab === 'pull-requests' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pull Requests</CardTitle>
                    <CardDescription>{pullRequests.length} pull request(s)</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New PR
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Pull Request</DialogTitle>
                        <DialogDescription>Create a new pull request</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input id="title" placeholder="PR title" />
                        </div>
                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" rows={4} placeholder="Describe your changes..." />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="sourceBranch">Source Branch</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="feature/new-feature">feature/new-feature</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="targetBranch">Target Branch</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="develop">develop</SelectItem>
                                <SelectItem value="main">main</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button>Create PR</Button>
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
                      <TableHead>PR ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Branches</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approvals</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pullRequests.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.id}</TableCell>
                        <TableCell className="font-medium max-w-md">{pr.title}</TableCell>
                        <TableCell>{pr.author}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <BranchIcon className="h-3 w-3" />
                            <span className="font-mono">{pr.sourceBranch}</span>
                            <span>→</span>
                            <span className="font-mono">{pr.targetBranch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(pr.status)}
                            <Badge variant={getStatusBadgeVariant(pr.status)}>
                              {pr.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{pr.approvals}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600"> -{pr.deletions}</span>
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
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <GitMerge className="mr-2 h-4 w-4" />
                                Merge
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

          {/* Deployments Tab */}
          {activeTab === 'deployments' && (
            <Card>
              <CardHeader>
                <CardTitle>Deployments</CardTitle>
                <CardDescription>
                  {deployments.length} deployment(s) tracked
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
                      <TableHead>Deployed At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deployments.map((deployment) => (
                      <TableRow key={deployment.id}>
                        <TableCell className="font-medium">{deployment.id}</TableCell>
                        <TableCell className="font-medium">{deployment.application}</TableCell>
                        <TableCell>
                          <Badge variant={deployment.environment === 'Production' ? 'destructive' : 'default'}>
                            {deployment.environment}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{deployment.version}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <BranchIcon className="h-3 w-3" />
                            <span className="font-mono">{deployment.branch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(deployment.status)}
                            <Badge variant={getStatusBadgeVariant(deployment.status)}>
                              {deployment.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{deployment.deployedBy}</TableCell>
                        <TableCell>
                          {new Date(deployment.deployedAt).toLocaleString()}
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


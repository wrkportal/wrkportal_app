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
  GitPullRequest,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  GitMerge,
  User,
  MoreVertical,
  Eye,
  MessageSquare,
  GitBranch
} from 'lucide-react'

interface PullRequest {
  id: string
  title: string
  description: string
  author: string
  sourceBranch: string
  targetBranch: string
  status: string
  reviewers: string[]
  approvals: number
  requestedChanges: number
  comments: number
  createdAt: string
  updatedAt: string
  mergedAt?: string
  filesChanged: number
  additions: number
  deletions: number
}

const COLORS = ['#9333ea', '#10b981', '#ef4444', '#f59e0b']

export default function PullRequestsPage() {
  const [activeTab, setActiveTab] = useState('open')
  const [pullRequests] = useState<PullRequest[]>([
    {
      id: 'PR-001',
      title: 'feat: Add IT dashboard with sprint planning',
      description: 'Implements IT dashboard with sprint planning and tracking features',
      author: 'John Doe',
      sourceBranch: 'feature/it-dashboard',
      targetBranch: 'develop',
      status: 'OPEN',
      reviewers: ['Jane Smith', 'Bob Wilson'],
      approvals: 1,
      requestedChanges: 0,
      comments: 3,
      createdAt: '2024-12-14T10:00:00',
      updatedAt: '2024-12-15T09:30:00',
      filesChanged: 25,
      additions: 1200,
      deletions: 150,
    },
    {
      id: 'PR-002',
      title: 'fix: Resolve authentication token expiration',
      description: 'Fixes issue where tokens expire too quickly',
      author: 'Jane Smith',
      sourceBranch: 'fix/auth-token',
      targetBranch: 'main',
      status: 'APPROVED',
      reviewers: ['John Doe'],
      approvals: 1,
      requestedChanges: 0,
      comments: 1,
      createdAt: '2024-12-13T14:20:00',
      updatedAt: '2024-12-14T16:45:00',
      filesChanged: 8,
      additions: 80,
      deletions: 45,
    },
    {
      id: 'PR-003',
      title: 'refactor: Optimize database queries',
      description: 'Improve query performance in user management module',
      author: 'Bob Wilson',
      sourceBranch: 'refactor/db-queries',
      targetBranch: 'develop',
      status: 'CHANGES_REQUESTED',
      reviewers: ['John Doe', 'Jane Smith'],
      approvals: 0,
      requestedChanges: 2,
      comments: 5,
      createdAt: '2024-12-12T09:15:00',
      updatedAt: '2024-12-13T11:20:00',
      filesChanged: 12,
      additions: 200,
      deletions: 120,
    },
    {
      id: 'PR-004',
      title: 'chore: Update dependencies',
      description: 'Update npm packages to latest versions',
      author: 'Alice Brown',
      sourceBranch: 'chore/update-deps',
      targetBranch: 'main',
      status: 'MERGED',
      reviewers: ['John Doe'],
      approvals: 1,
      requestedChanges: 0,
      comments: 0,
      createdAt: '2024-12-10T16:30:00',
      updatedAt: '2024-12-11T10:15:00',
      mergedAt: '2024-12-11T10:15:00',
      filesChanged: 5,
      additions: 500,
      deletions: 300,
    },
  ])

  const prStats = {
    open: pullRequests.filter(pr => pr.status === 'OPEN').length,
    approved: pullRequests.filter(pr => pr.status === 'APPROVED').length,
    changesRequested: pullRequests.filter(pr => pr.status === 'CHANGES_REQUESTED').length,
    merged: pullRequests.filter(pr => pr.status === 'MERGED').length,
    total: pullRequests.length,
  }

  const statusData = [
    { name: 'Open', value: prStats.open },
    { name: 'Approved', value: prStats.approved },
    { name: 'Changes Requested', value: prStats.changesRequested },
    { name: 'Merged', value: prStats.merged },
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'default'
      case 'APPROVED':
        return 'default'
      case 'CHANGES_REQUESTED':
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
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'CHANGES_REQUESTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'MERGED':
        return <GitMerge className="h-4 w-4 text-purple-600" />
      default:
        return null
    }
  }

  const filteredPRs = pullRequests.filter(pr => {
    if (activeTab === 'open') return pr.status === 'OPEN'
    if (activeTab === 'approved') return pr.status === 'APPROVED'
    if (activeTab === 'merged') return pr.status === 'MERGED'
    return true
  })

  return (
    <ITPageLayout 
      title="Pull Requests" 
      description="Review and manage code pull requests"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="merged">Merged</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open PRs</CardTitle>
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prStats.open}</div>
                <p className="text-xs text-muted-foreground">Awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prStats.approved}</div>
                <p className="text-xs text-muted-foreground">Ready to merge</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Changes Requested</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prStats.changesRequested}</div>
                <p className="text-xs text-muted-foreground">Need updates</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Merged</CardTitle>
                <GitMerge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{prStats.merged}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Pull Requests by Status</CardTitle>
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

          {/* Pull Requests Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pull Requests</CardTitle>
                  <CardDescription>
                    {filteredPRs.length} pull request(s) found
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      New Pull Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Pull Request</DialogTitle>
                      <DialogDescription>
                        Create a new pull request to merge code changes
                      </DialogDescription>
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
                    <TableHead>Reviewers</TableHead>
                    <TableHead>Approvals</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPRs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No pull requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPRs.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.id}</TableCell>
                        <TableCell>
                          <div className="font-medium max-w-md">{pr.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {pr.description}
                          </div>
                        </TableCell>
                        <TableCell>{pr.author}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <GitBranch className="h-3 w-3" />
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
                          <div className="flex flex-wrap gap-1">
                            {pr.reviewers.map(reviewer => (
                              <Badge key={reviewer} variant="outline" className="text-xs">
                                {reviewer.split(' ')[0]}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span>{pr.approvals}</span>
                            {pr.requestedChanges > 0 && (
                              <>
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>{pr.requestedChanges}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600"> -{pr.deletions}</span>
                            <div className="text-muted-foreground">
                              {pr.filesChanged} files
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(pr.createdAt).toLocaleDateString()}
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
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Comment
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


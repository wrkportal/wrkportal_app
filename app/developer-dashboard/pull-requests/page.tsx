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
  MessageSquare,
  MoreVertical,
  Eye,
  GitBranch
} from 'lucide-react'

interface PullRequest {
  id: string
  title: string
  description: string
  author: string
  sourceBranch: string
  targetBranch: string
  status: 'OPEN' | 'APPROVED' | 'CHANGES_REQUESTED' | 'MERGED'
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
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPullRequests()
  }, [activeTab])

  const fetchPullRequests = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/pull-requests')
      // const data = await response.json()
      // setPullRequests(data.pullRequests || [])
      
      setPullRequests([])
    } catch (error) {
      console.error('Error fetching pull requests:', error)
      setPullRequests([])
    } finally {
      setLoading(false)
    }
  }

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

  const filteredPRs = pullRequests.filter(pr => {
    if (activeTab === 'open') return pr.status === 'OPEN'
    if (activeTab === 'approved') return pr.status === 'APPROVED'
    if (activeTab === 'merged') return pr.status === 'MERGED'
    return true
  })

  return (
    <DeveloperPageLayout 
      title="Pull Requests" 
      description="Review and manage pull requests, code reviews, and merges"
    >
      <div className="space-y-6">
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="merged">Merged</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search PRs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>

          <TabsContent value={activeTab} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pull Requests</CardTitle>
                <CardDescription>
                  Review code changes, manage approvals, and track merge status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Branches</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reviewers</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPRs.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{pr.title}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">{pr.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>{pr.author}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <GitBranch className="h-3 w-3" />
                            <span className="text-muted-foreground">{pr.sourceBranch}</span>
                            <span>→</span>
                            <span>{pr.targetBranch}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(pr.status)}>
                            {pr.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs">{pr.reviewers.length} reviewers</span>
                            </div>
                            {pr.approvals > 0 && (
                              <Badge variant="outline" className="text-xs w-fit">
                                {pr.approvals} approved
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600">-{pr.deletions}</span>
                            <span className="text-muted-foreground">({pr.filesChanged} files)</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(pr.updatedAt).toLocaleDateString()}</TableCell>
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
                                View PR
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Review
                              </DropdownMenuItem>
                              {pr.status === 'APPROVED' && (
                                <DropdownMenuItem>
                                  <GitMerge className="h-4 w-4 mr-2" />
                                  Merge
                                </DropdownMenuItem>
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
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}

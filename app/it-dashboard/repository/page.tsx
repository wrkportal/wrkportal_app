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
  GitBranch,
  GitCommit,
  Code,
  User,
  Clock,
  FileText,
  TrendingUp,
  GitMerge,
  GitPullRequest
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
  size: string
  updatedAt: string
}

interface Commit {
  id: string
  message: string
  author: string
  branch: string
  timestamp: string
  filesChanged: number
  additions: number
  deletions: number
}

export default function RepositoryPage() {
  const [activeTab, setActiveTab] = useState('repositories')
  const [repositories] = useState<Repository[]>([
    {
      id: 'REPO-001',
      name: 'workportal-frontend',
      description: 'Main frontend application for WorkPortal',
      branch: 'main',
      lastCommit: 'feat: Add IT dashboard with sprint planning',
      commits: 1247,
      contributors: 8,
      language: 'TypeScript',
      size: '45.2 MB',
      updatedAt: '2024-12-15T10:30:00',
    },
    {
      id: 'REPO-002',
      name: 'workportal-backend',
      description: 'Backend API and services',
      branch: 'develop',
      lastCommit: 'fix: Resolve authentication token expiration',
      commits: 892,
      contributors: 6,
      language: 'Python',
      size: '32.8 MB',
      updatedAt: '2024-12-15T09:15:00',
    },
    {
      id: 'REPO-003',
      name: 'workportal-mobile',
      description: 'Mobile application for iOS and Android',
      branch: 'main',
      lastCommit: 'chore: Update dependencies',
      commits: 456,
      contributors: 4,
      language: 'Dart',
      size: '28.5 MB',
      updatedAt: '2024-12-14T16:45:00',
    },
  ])

  const [commits] = useState<Commit[]>([
    {
      id: 'abc123',
      message: 'feat: Add IT dashboard with sprint planning',
      author: 'John Doe',
      branch: 'main',
      timestamp: '2024-12-15T10:30:00',
      filesChanged: 15,
      additions: 450,
      deletions: 120,
    },
    {
      id: 'def456',
      message: 'fix: Resolve authentication token expiration',
      author: 'Jane Smith',
      branch: 'develop',
      timestamp: '2024-12-15T09:15:00',
      filesChanged: 8,
      additions: 50,
      deletions: 35,
    },
    {
      id: 'ghi789',
      message: 'chore: Update dependencies',
      author: 'Bob Wilson',
      branch: 'main',
      timestamp: '2024-12-14T16:45:00',
      filesChanged: 3,
      additions: 200,
      deletions: 150,
    },
  ])

  const commitStats = {
    total: commits.length,
    today: commits.filter(c => new Date(c.timestamp).toDateString() === new Date().toDateString()).length,
    thisWeek: commits.filter(c => {
      const commitDate = new Date(c.timestamp)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return commitDate >= weekAgo
    }).length,
    totalAdditions: commits.reduce((sum, c) => sum + c.additions, 0),
    totalDeletions: commits.reduce((sum, c) => sum + c.deletions, 0),
  }

  const commitTrendData = [
    { day: 'Mon', commits: 12 },
    { day: 'Tue', commits: 18 },
    { day: 'Wed', commits: 15 },
    { day: 'Thu', commits: 22 },
    { day: 'Fri', commits: 16 },
    { day: 'Sat', commits: 8 },
    { day: 'Sun', commits: 5 },
  ]

  const languageData = [
    { language: 'TypeScript', lines: 45000, percentage: 45 },
    { language: 'Python', lines: 32000, percentage: 32 },
    { language: 'CSS', lines: 15000, percentage: 15 },
    { language: 'Other', lines: 8000, percentage: 8 },
  ]

  return (
    <ITPageLayout 
      title="Code Repository" 
      description="Manage code repositories, commits, and version control"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="repositories">Repositories</TabsTrigger>
          <TabsTrigger value="commits">Commits</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{repositories.length}</div>
                <p className="text-xs text-muted-foreground">Code repositories</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commits Today</CardTitle>
                <GitCommit className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commitStats.today}</div>
                <p className="text-xs text-muted-foreground">{commitStats.thisWeek} this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Additions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{commitStats.totalAdditions.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Lines added</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Contributors</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(repositories.map(r => r.contributors)).size}
                </div>
                <p className="text-xs text-muted-foreground">Team members</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          {activeTab === 'commits' && (
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Commit Activity</CardTitle>
                  <CardDescription>Commits per day this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={commitTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="commits" fill="#9333ea" name="Commits" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Code by Language</CardTitle>
                  <CardDescription>Lines of code by programming language</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={languageData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="language" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="lines" fill="#10b981" name="Lines of Code" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Repositories Table */}
          {activeTab === 'repositories' && (
            <Card>
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>
                  {repositories.length} repository/repositories
                </CardDescription>
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
                      <TableHead>Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell className="font-medium">{repo.name}</TableCell>
                        <TableCell>{repo.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <GitBranch className="mr-1 h-3 w-3" />
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
                        <TableCell>
                          {new Date(repo.updatedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Commits Table */}
          {activeTab === 'commits' && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Commits</CardTitle>
                <CardDescription>
                  Latest commits across all repositories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commit ID</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commits.map((commit) => (
                      <TableRow key={commit.id}>
                        <TableCell className="font-mono text-sm">{commit.id.substring(0, 7)}</TableCell>
                        <TableCell className="font-medium max-w-md">{commit.message}</TableCell>
                        <TableCell>{commit.author}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            <GitBranch className="mr-1 h-3 w-3" />
                            {commit.branch}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">+{commit.additions}</span>
                            <span className="text-red-600">-{commit.deletions}</span>
                            <span className="text-muted-foreground">
                              ({commit.filesChanged} files)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(commit.timestamp).toLocaleString()}
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


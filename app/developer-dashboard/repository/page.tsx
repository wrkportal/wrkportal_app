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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
  GitBranch,
  GitCommit,
  Code,
  User,
  Clock,
  FileText,
  TrendingUp,
  GitMerge,
  Plus,
  MoreVertical,
  Eye,
  Settings
} from 'lucide-react'

interface Repository {
  id: string
  name: string
  description: string
  branch: string
  defaultBranch: string
  lastCommit: string
  commits: number
  contributors: number
  language: string
  size: string
  updatedAt: string
  visibility: 'public' | 'private'
  url: string
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
  hash: string
}

interface Branch {
  id: string
  name: string
  repository: string
  lastCommit: string
  ahead: number
  behind: number
  protected: boolean
}

export default function RepositoryPage() {
  const [activeTab, setActiveTab] = useState('repositories')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [commits, setCommits] = useState<Commit[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/repositories')
      // const data = await response.json()
      // setRepositories(data.repositories || [])
      
      setRepositories([])
      setCommits([])
      setBranches([])
    } catch (error) {
      console.error('Error fetching data:', error)
      setRepositories([])
      setCommits([])
      setBranches([])
    } finally {
      setLoading(false)
    }
  }

  const repoStats = {
    total: repositories.length,
    totalCommits: commits.length,
    totalBranches: branches.length,
    totalContributors: repositories.reduce((sum, repo) => sum + repo.contributors, 0),
  }

  return (
    <DeveloperPageLayout 
      title="Repository" 
      description="Manage code repositories, branches, and commits"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.total}</div>
              <p className="text-xs text-muted-foreground">Total repos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commits</CardTitle>
              <GitCommit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.totalCommits}</div>
              <p className="text-xs text-muted-foreground">Recent commits</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Branches</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.totalBranches}</div>
              <p className="text-xs text-muted-foreground">Active branches</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contributors</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{repoStats.totalContributors}</div>
              <p className="text-xs text-muted-foreground">Active developers</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="repositories">Repositories</TabsTrigger>
              <TabsTrigger value="commits">Commits</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
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
              {activeTab === 'repositories' && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Repository
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Repository</DialogTitle>
                      <DialogDescription>
                        Connect a new code repository to track
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Repository URL</Label>
                        <Input placeholder="https://github.com/org/repo" />
                      </div>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input placeholder="Repository name" />
                      </div>
                      <Button className="w-full">Connect Repository</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Repositories Tab */}
          <TabsContent value="repositories" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Repositories</CardTitle>
                <CardDescription>
                  Manage code repositories and track development activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Default Branch</TableHead>
                      <TableHead>Commits</TableHead>
                      <TableHead>Contributors</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repositories.map((repo) => (
                      <TableRow key={repo.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{repo.name}</span>
                            <span className="text-xs text-muted-foreground">{repo.description}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{repo.language}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            <span>{repo.defaultBranch}</span>
                          </div>
                        </TableCell>
                        <TableCell>{repo.commits}</TableCell>
                        <TableCell>{repo.contributors}</TableCell>
                        <TableCell>{new Date(repo.updatedAt).toLocaleDateString()}</TableCell>
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
                                View Repository
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
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

          {/* Commits Tab */}
          <TabsContent value="commits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Commits</CardTitle>
                <CardDescription>
                  Track code changes and commit history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Commit</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commits.map((commit) => (
                      <TableRow key={commit.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{commit.message}</span>
                            <span className="text-xs text-muted-foreground font-mono">{commit.hash}</span>
                          </div>
                        </TableCell>
                        <TableCell>{commit.author}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{commit.branch}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-green-600">+{commit.additions}</span>
                            <span className="text-red-600">-{commit.deletions}</span>
                            <span className="text-muted-foreground">({commit.filesChanged} files)</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(commit.timestamp).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branches Tab */}
          <TabsContent value="branches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
                <CardDescription>
                  Manage branches and track branch status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Commit</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GitBranch className="h-4 w-4" />
                            <span className="font-medium">{branch.name}</span>
                            {branch.protected && (
                              <Badge variant="secondary" className="text-xs">Protected</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{branch.repository}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm">
                            {branch.ahead > 0 && (
                              <span className="text-green-600">+{branch.ahead} ahead</span>
                            )}
                            {branch.behind > 0 && (
                              <span className="text-red-600">-{branch.behind} behind</span>
                            )}
                            {branch.ahead === 0 && branch.behind === 0 && (
                              <span className="text-muted-foreground">Up to date</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(branch.lastCommit).toLocaleString()}</TableCell>
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
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}

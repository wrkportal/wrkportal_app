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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  FolderKanban,
  Server,
  Users,
  Settings,
  GitBranch,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Code,
  Cloud,
  Database
} from 'lucide-react'

interface Workspace {
  id: string
  name: string
  description: string
  team: string
  projects: number
  environments: string[]
  status: 'active' | 'archived'
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
  workspace: string
  type: 'service' | 'library' | 'infrastructure'
  repository: string
  environments: string[]
  lastDeployment: string
  status: 'healthy' | 'degraded' | 'down'
}

interface Environment {
  id: string
  name: string
  workspace: string
  project: string
  type: 'dev' | 'staging' | 'prod'
  status: 'active' | 'inactive'
  deployments: number
  lastDeployment: string
}

export default function DevelopmentPage() {
  const [activeTab, setActiveTab] = useState('workspaces')
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [environments, setEnvironments] = useState<Environment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [teams, setTeams] = useState<Array<{ id: string; name: string }>>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'dev',
    team: '',
    environments: ['dev', 'staging', 'prod'] as string[],
  })
  const [configData, setConfigData] = useState({
    team: '',
    environments: [] as string[],
  })

  useEffect(() => {
    fetchData()
    fetchTeams()
  }, [activeTab])

  const fetchTeams = async () => {
    try {
      // TODO: Replace with actual API call
      // Example: const response = await fetch('/api/teams')
      // const data = await response.json()
      // setTeams(data.teams || [])

      // For now, using empty array - teams will be fetched from API
      setTeams([])
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeams([])
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // TODO: Replace with actual API calls
      // Example: const response = await fetch('/api/developer/workspaces')
      // const data = await response.json()
      // setWorkspaces(data.workspaces || [])

      setWorkspaces([])
      setProjects([])
      setEnvironments([])
    } catch (error) {
      console.error('Error fetching data:', error)
      setWorkspaces([])
      setProjects([])
      setEnvironments([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    if (!formData.name.trim()) return

    if (activeTab === 'workspaces') {
      const selectedTeam = teams.find(t => t.id === formData.team)
      const newWorkspace: Workspace = {
        id: `ws-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        team: selectedTeam?.name || formData.team || 'Unassigned', // Use selected team or fallback
        projects: 0,
        environments: formData.environments.length > 0 ? formData.environments : ['dev', 'staging', 'prod'], // Use selected environments or defaults
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setWorkspaces([...workspaces, newWorkspace])
    } else if (activeTab === 'projects') {
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: formData.name,
        workspace: workspaces[0]?.id || 'ws-1', // Default to first workspace
        type: 'service', // Default type
        repository: `github.com/org/${formData.name.toLowerCase().replace(/\s+/g, '-')}`,
        environments: ['dev', 'staging', 'prod'],
        lastDeployment: new Date().toISOString(),
        status: 'healthy',
      }
      setProjects([...projects, newProject])
    } else if (activeTab === 'environments') {
      const newEnvironment: Environment = {
        id: `env-${Date.now()}`,
        name: formData.name,
        workspace: workspaces[0]?.id || 'ws-1',
        project: projects[0]?.id || 'proj-1',
        type: formData.type as 'dev' | 'staging' | 'prod',
        status: 'active',
        deployments: 0,
        lastDeployment: new Date().toISOString(),
      }
      setEnvironments([...environments, newEnvironment])
    }

    // Reset form and close dialog
    setFormData({ name: '', description: '', type: 'dev', team: '', environments: ['dev', 'staging', 'prod'] })
    setDialogOpen(false)
  }

  const handleConfigureWorkspace = () => {
    if (!selectedWorkspace) return

    // TODO: Replace with actual API call
    // Example: await fetch(`/api/developer/workspaces/${selectedWorkspace.id}`, { 
    //   method: 'PATCH', 
    //   body: JSON.stringify({ team: configData.team, environments: configData.environments })
    // })

    setWorkspaces(workspaces.map(w =>
      w.id === selectedWorkspace.id
        ? {
          ...w,
          team: teams.find(t => t.id === configData.team)?.name || configData.team || w.team,
          environments: configData.environments.length > 0 ? configData.environments : w.environments,
          updatedAt: new Date().toISOString()
        }
        : w
    ))

    setConfigData({ team: '', environments: [] })
    setSelectedWorkspace(null)
    setConfigureDialogOpen(false)
  }

  const toggleEnvironment = (env: string) => {
    setConfigData(prev => ({
      ...prev,
      environments: prev.environments.includes(env)
        ? prev.environments.filter(e => e !== env)
        : [...prev.environments, env]
    }))
  }

  const handleUpdateWorkspace = () => {
    if (!selectedWorkspace || !formData.name.trim()) return

    // TODO: Replace with actual API call
    // Example: await fetch(`/api/developer/workspaces/${selectedWorkspace.id}`, { method: 'PUT', body: JSON.stringify(formData) })

    setWorkspaces(workspaces.map(w =>
      w.id === selectedWorkspace.id
        ? { ...w, name: formData.name, description: formData.description, updatedAt: new Date().toISOString() }
        : w
    ))

    // Reset form and close dialog
    setFormData({ name: '', description: '', type: 'dev', team: '', environments: ['dev', 'staging', 'prod'] })
    setSelectedWorkspace(null)
    setEditDialogOpen(false)
  }

  const handleArchiveWorkspace = (workspaceId: string) => {
    // TODO: Replace with actual API call
    // Example: await fetch(`/api/developer/workspaces/${workspaceId}/archive`, { method: 'POST' })

    setWorkspaces(workspaces.map(w =>
      w.id === workspaceId
        ? { ...w, status: 'archived' as const, updatedAt: new Date().toISOString() }
        : w
    ))
  }

  const workspaceStats = {
    total: workspaces.length,
    active: workspaces.filter(w => w.status === 'active').length,
    totalProjects: projects.length,
    totalEnvironments: environments.length,
  }

  return (
    <DeveloperPageLayout
      title="Development"
      description="Manage workspaces, projects, services, and environments"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaceStats.total}</div>
              <p className="text-xs text-muted-foreground">{workspaceStats.active} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projects</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaceStats.totalProjects}</div>
              <p className="text-xs text-muted-foreground">Services & libraries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Environments</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workspaceStats.totalEnvironments}</div>
              <p className="text-xs text-muted-foreground">Active environments</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">Active developers</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
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
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {activeTab === 'workspaces' ? 'New Workspace' : activeTab === 'projects' ? 'New Project' : 'New Environment'}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {activeTab === 'workspaces' ? 'Create Workspace' : activeTab === 'projects' ? 'Create Project' : 'Create Environment'}
                    </DialogTitle>
                    <DialogDescription>
                      {activeTab === 'workspaces'
                        ? 'Create a new workspace for your team'
                        : activeTab === 'projects'
                          ? 'Add a new project or service'
                          : 'Configure a new environment'}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    handleCreate()
                  }} className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        placeholder="Enter name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Enter description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    {activeTab === 'workspaces' && (
                      <>
                        <div className="space-y-2">
                          <Label>Team</Label>
                          <Select
                            value={formData.team}
                            onValueChange={(value) => setFormData({ ...formData, team: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a team (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                  {team.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            {teams.length === 0 ? 'No teams available. Teams will be fetched from your organization.' : 'Select a team for this workspace (optional)'}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>Environments</Label>
                          <div className="flex flex-wrap gap-2">
                            {['dev', 'staging', 'prod'].map((env) => (
                              <div key={env} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id={`env-${env}`}
                                  checked={formData.environments.includes(env)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData({
                                        ...formData,
                                        environments: [...formData.environments, env]
                                      })
                                    } else {
                                      setFormData({
                                        ...formData,
                                        environments: formData.environments.filter(e => e !== env)
                                      })
                                    }
                                  }}
                                  className="h-4 w-4 rounded border-gray-300"
                                />
                                <Label htmlFor={`env-${env}`} className="text-sm font-normal cursor-pointer">
                                  {env.charAt(0).toUpperCase() + env.slice(1)}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select which environments this workspace will support (default: all selected)
                          </p>
                        </div>
                      </>
                    )}
                    {activeTab === 'environments' && (
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select environment type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dev">Development</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="prod">Production</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button type="submit" className="w-full">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* View Details Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Workspace Details</DialogTitle>
                <DialogDescription>
                  View detailed information about the workspace
                </DialogDescription>
              </DialogHeader>
              {selectedWorkspace && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <p className="text-sm font-medium">{selectedWorkspace.name}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <p className="text-sm text-muted-foreground">{selectedWorkspace.description || 'No description'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <p className="text-sm">{selectedWorkspace.team}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Badge variant={selectedWorkspace.status === 'active' ? 'default' : 'secondary'}>
                      {selectedWorkspace.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label>Projects</Label>
                    <p className="text-sm">{selectedWorkspace.projects}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Environments</Label>
                    <div className="flex gap-1">
                      {selectedWorkspace.environments.map((env) => (
                        <Badge key={env} variant="outline">{env}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <p className="text-sm">{new Date(selectedWorkspace.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <p className="text-sm">{new Date(selectedWorkspace.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Workspace Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Workspace</DialogTitle>
                <DialogDescription>
                  Update workspace information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                handleUpdateWorkspace()
              }} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Enter description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Update Workspace</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Configure Workspace Dialog */}
          <Dialog open={configureDialogOpen} onOpenChange={setConfigureDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Workspace</DialogTitle>
                <DialogDescription>
                  Manage workspace settings, team assignment, and environments
                </DialogDescription>
              </DialogHeader>
              {selectedWorkspace && (
                <form onSubmit={(e) => {
                  e.preventDefault()
                  handleConfigureWorkspace()
                }} className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Team Assignment</Label>
                    <Select
                      value={configData.team}
                      onValueChange={(value) => setConfigData({ ...configData, team: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Assign this workspace to a team. Current: {selectedWorkspace.team}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Environments</Label>
                    <div className="flex flex-wrap gap-2">
                      {['dev', 'staging', 'prod'].map((env) => (
                        <div key={env} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`config-env-${env}`}
                            checked={configData.environments.includes(env)}
                            onChange={() => toggleEnvironment(env)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`config-env-${env}`} className="text-sm font-normal cursor-pointer">
                            {env.charAt(0).toUpperCase() + env.slice(1)}
                          </Label>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which environments this workspace supports. Current: {selectedWorkspace.environments.join(', ')}
                    </p>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Workspace Information</Label>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p><span className="font-medium">Name:</span> {selectedWorkspace.name}</p>
                        <p><span className="font-medium">Projects:</span> {selectedWorkspace.projects}</p>
                        <p><span className="font-medium">Status:</span> {selectedWorkspace.status}</p>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full">Save Configuration</Button>
                </form>
              )}
            </DialogContent>
          </Dialog>

          {/* Workspaces Tab */}
          <TabsContent value="workspaces" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workspaces</CardTitle>
                <CardDescription>
                  Workspaces are organizational units that contain projects, services, and environments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Environments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workspaces.map((workspace) => (
                      <TableRow key={workspace.id}>
                        <TableCell className="font-medium">{workspace.name}</TableCell>
                        <TableCell>{workspace.team}</TableCell>
                        <TableCell>{workspace.projects}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {workspace.environments.map((env) => (
                              <Badge key={env} variant="outline">{env}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={workspace.status === 'active' ? 'default' : 'secondary'}>
                            {workspace.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(workspace.updatedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => {
                                setSelectedWorkspace(workspace)
                                setViewDialogOpen(true)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedWorkspace(workspace)
                                setFormData({
                                  name: workspace.name,
                                  description: workspace.description,
                                  type: 'dev',
                                  team: workspace.team || '',
                                  environments: workspace.environments ? [...workspace.environments] : [],
                                })
                                setEditDialogOpen(true)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Workspace
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedWorkspace(workspace)
                                // Find team ID if team name exists in teams list
                                const teamId = teams.find(t => t.name === workspace.team)?.id || ''
                                setConfigData({
                                  team: teamId,
                                  environments: [...workspace.environments]
                                })
                                setConfigureDialogOpen(true)
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive" onClick={() => {
                                if (confirm(`Are you sure you want to archive "${workspace.name}"?`)) {
                                  handleArchiveWorkspace(workspace.id)
                                }
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {workspaces.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No workspaces found. Create your first workspace to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Projects & Services</CardTitle>
                <CardDescription>
                  Manage projects, services, libraries, and infrastructure components
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Repository</TableHead>
                      <TableHead>Environments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Deployment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{project.type}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {project.repository}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {project.environments.map((env) => (
                              <Badge key={env} variant="secondary" className="text-xs">{env}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.status === 'healthy' ? 'default' : project.status === 'degraded' ? 'secondary' : 'destructive'}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(project.lastDeployment).toLocaleString()}</TableCell>
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
                                <GitBranch className="h-4 w-4 mr-2" />
                                View Repository
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Activity className="h-4 w-4 mr-2" />
                                View Activity
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
                {projects.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No projects found. Create your first project to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Environments</CardTitle>
                <CardDescription>
                  Manage deployment environments (dev, staging, production)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Deployments</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Deployment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {environments.map((env) => (
                      <TableRow key={env.id}>
                        <TableCell className="font-medium">{env.name}</TableCell>
                        <TableCell>
                          <Badge variant={env.type === 'prod' ? 'default' : env.type === 'staging' ? 'secondary' : 'outline'}>
                            {env.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{env.project}</TableCell>
                        <TableCell>{env.deployments}</TableCell>
                        <TableCell>
                          <Badge variant={env.status === 'active' ? 'default' : 'secondary'}>
                            {env.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(env.lastDeployment).toLocaleString()}</TableCell>
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
                                <Activity className="h-4 w-4 mr-2" />
                                View Deployments
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
                {environments.length === 0 && !loading && (
                  <div className="text-center py-12 text-muted-foreground">
                    No environments found. Create your first environment to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DeveloperPageLayout>
  )
}

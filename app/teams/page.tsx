'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate, cn, getInitials } from "@/lib/utils"
import { Filter, Grid3x3, List, Plus, Loader2, Users, UserPlus, Briefcase } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamMember {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    avatar?: string
    allocation: number
    projects: number
    tasks: number
}

interface Team {
    id: string
    name: string
    description: string
    department?: string
    members: TeamMember[]
    projects: number
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
    createdAt: string
}

export default function TeamsPage() {
    const router = useRouter()
    const pathname = usePathname()
    const [view, setView] = useState<'list' | 'grid'>('list')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch teams
    const fetchTeams = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/teams')
            if (response.ok) {
                const data = await response.json()
                const apiTeams = data.teams || []
                
                // Transform API data to match Team interface
                const transformedTeams: Team[] = apiTeams.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    description: t.description || '',
                    department: t.department,
                    status: t.status,
                    projects: t.projects || 0,
                    createdAt: t.createdAt,
                    members: t.members || [],
                }))
                
                setTeams(transformedTeams)
                setLoading(false)
                return
            }
            
            // Fallback to empty array if API fails
            setTeams([])
            setLoading(false)
        } catch (error) {
            console.error('Error fetching teams:', error)
            setTeams([])
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTeams()
    }, [])

    // Filter teams
    const filteredTeams = filterStatus === 'all'
        ? teams
        : teams.filter(t => t.status === filterStatus)

    const getStatusColor = (status: string) => {
        const colors = {
            ACTIVE: 'bg-green-500',
            INACTIVE: 'bg-slate-500',
            ARCHIVED: 'bg-gray-500',
        }
        return colors[status as keyof typeof colors] || 'bg-gray-500'
    }

    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0)
    const activeTeams = teams.filter(t => t.status === 'ACTIVE').length
    const totalProjects = teams.reduce((sum, team) => sum + team.projects, 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Teams
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage teams, view team members, and track team assignments
                        </p>
                    </div>

                    <button 
                        onClick={() => router.push('/teams/new')}
                        className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0"
                    >
                        + New Team
                    </button>
                </div>

                {/* SCROLL CONTENT */}
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Teams</div>
                            <div className="text-lg font-semibold">{teams.length}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Active Teams</div>
                            <div className="text-lg font-semibold">{activeTeams}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Team Members</div>
                            <div className="text-lg font-semibold">{totalMembers}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5">
                            <div className="text-[10px] uppercase text-muted-foreground">Total Projects</div>
                            <div className="text-lg font-semibold">{totalProjects}</div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                            </div>
                        </div>
                    </div>

                    {/* Filters and View Toggle */}
                    <div className="rounded-2xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Filter className="h-5 w-5 text-muted-foreground" />
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant={view === 'list' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('list')}
                                >
                                    <List className="h-4 w-4 mr-2" />
                                    List
                                </Button>
                                <Button
                                    variant={view === 'grid' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setView('grid')}
                                >
                                    <Grid3x3 className="h-4 w-4 mr-2" />
                                    Grid
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Teams Content */}
                    {teams.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-base font-semibold mb-1">No teams yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Create your first team to start organizing team members and projects.
                                </p>
                                <Button onClick={() => router.push('/teams/new')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Your First Team
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {view === 'list' ? (
                                <Card>
                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {filteredTeams.map((team) => (
                                                <div
                                                    key={team.id}
                                                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                                                    onClick={() => router.push(`/teams/${team.id}`)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className={cn("h-2 w-2 rounded-full mt-2", getStatusColor(team.status))} />
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h4 className="text-base font-semibold">{team.name}</h4>
                                                                    {team.department && (
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {team.department}
                                                                        </Badge>
                                                                    )}
                                                                    <Badge 
                                                                        variant="outline" 
                                                                        className={cn(
                                                                            "text-xs",
                                                                            team.status === 'ACTIVE' && "border-green-500 text-green-600",
                                                                            team.status === 'INACTIVE' && "border-slate-500 text-slate-600",
                                                                            team.status === 'ARCHIVED' && "border-gray-500 text-gray-600"
                                                                        )}
                                                                    >
                                                                        {team.status}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mb-2">{team.description}</p>
                                                                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {team.members.length} members
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1">
                                                                        <Briefcase className="h-3 w-3" />
                                                                        {team.projects} projects
                                                                    </span>
                                                                    <span>•</span>
                                                                    <span>Created: {formatDate(team.createdAt)}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {team.members.slice(0, 5).map((member) => (
                                                                        <div key={member.id} className="flex items-center gap-1">
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarImage src={member.avatar} />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {getInitials(`${member.firstName} ${member.lastName}`)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </div>
                                                                    ))}
                                                                    {team.members.length > 5 && (
                                                                        <span className="text-xs text-muted-foreground">
                                                                            +{team.members.length - 5} more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm">
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Members</div>
                                                                <div className="font-semibold">{team.members.length}</div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-xs text-muted-foreground">Projects</div>
                                                                <div className="font-semibold">{team.projects}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredTeams.map((team) => (
                                        <Card key={team.id} className="hover-lift cursor-pointer" onClick={() => router.push(`/teams/${team.id}`)}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <CardTitle className="text-base">{team.name}</CardTitle>
                                                        <CardDescription className="text-xs line-clamp-2 mt-1">{team.description}</CardDescription>
                                                    </div>
                                                    <div className={cn("h-3 w-3 rounded-full", getStatusColor(team.status))} />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {team.department && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {team.department}
                                                            </Badge>
                                                        )}
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn(
                                                                "text-xs",
                                                                team.status === 'ACTIVE' && "border-green-500 text-green-600",
                                                                team.status === 'INACTIVE' && "border-slate-500 text-slate-600",
                                                                team.status === 'ARCHIVED' && "border-gray-500 text-gray-600"
                                                            )}
                                                        >
                                                            {team.status}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {team.members.slice(0, 6).map((member) => (
                                                            <Avatar key={member.id} className="h-8 w-8">
                                                                <AvatarImage src={member.avatar} />
                                                                <AvatarFallback className="text-xs">
                                                                    {getInitials(`${member.firstName} ${member.lastName}`)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                        {team.members.length > 6 && (
                                                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                                                                +{team.members.length - 6}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <span>Members</span>
                                                            <span className="font-medium">{team.members.length}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span>Projects</span>
                                                            <span className="font-medium">{team.projects}</span>
                                                        </div>
                                                        <div className="pt-2 border-t">
                                                            <span className="text-slate-400">Created {formatDate(team.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
        </div>
    )
}


'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { getInitials } from "@/lib/utils"
import { Plus, Users, Calendar, TrendingUp, Loader2 } from "lucide-react"
import { ResourceDialog } from "@/components/dialogs/resource-dialog"

export default function ResourcesPage() {
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false)
    const [users, setUsers] = useState<any[]>([])
    const [skillsMatrix, setSkillsMatrix] = useState<any>({ users: [], allSkills: [] })
    const [capacityData, setCapacityData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [skillsLoading, setSkillsLoading] = useState(true)
    const [capacityLoading, setCapacityLoading] = useState(true)

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/users/onboarded')
                if (response.ok) {
                    const data = await response.json()
                    setUsers(data.users || [])
                } else {
                    console.error('Failed to fetch users')
                }
            } catch (error) {
                console.error('Error fetching users:', error)
            } finally {
                setLoading(false)
            }
        }

        const fetchSkillsMatrix = async () => {
            try {
                setSkillsLoading(true)
                const response = await fetch('/api/resources/skills')
                if (response.ok) {
                    const data = await response.json()
                    setSkillsMatrix(data)
                } else {
                    console.error('Failed to fetch skills matrix')
                }
            } catch (error) {
                console.error('Error fetching skills matrix:', error)
            } finally {
                setSkillsLoading(false)
            }
        }

        const fetchCapacity = async () => {
            try {
                setCapacityLoading(true)
                const response = await fetch('/api/resources/capacity')
                if (response.ok) {
                    const data = await response.json()
                    setCapacityData(data)
                } else {
                    console.error('Failed to fetch capacity data')
                }
            } catch (error) {
                console.error('Error fetching capacity data:', error)
            } finally {
                setCapacityLoading(false)
            }
        }

        fetchUsers()
        fetchSkillsMatrix()
        fetchCapacity()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Resource Management</h1>
                    <p className="text-muted-foreground">
                        Manage team capacity, skills, and allocations
                    </p>
                </div>
                <Button onClick={() => setResourceDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Resource
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? '...' : users.length}</div>
                        <p className="text-xs text-muted-foreground">Active team members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {capacityLoading ? '...' : capacityData?.summary?.avgUtilization?.toFixed(1) || 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Across all resources</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Over-allocated</CardTitle>
                        <Calendar className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">
                            {capacityLoading ? '...' : capacityData?.summary?.overAllocated || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Need reallocation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {capacityLoading ? '...' : capacityData?.summary?.available || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Ready for assignment</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="workload">
                <TabsList>
                    <TabsTrigger value="workload">Workload</TabsTrigger>
                    <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
                    <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
                </TabsList>

                <TabsContent value="workload" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Workload</CardTitle>
                            <CardDescription>Current allocation and capacity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading || capacityLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {(capacityData?.capacity || []).map((user: any) => {
                                        const utilization = user.totalAllocation
                                        const isOverAllocated = user.isOverAllocated

                                        return (
                                            <div key={user.userId} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <Avatar>
                                                    <AvatarFallback>
                                                        {getInitials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{user.name}</p>
                                                        <Badge variant="outline">{user.role.replace(/_/g, ' ')}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>
                                                            Utilization: <span className={isOverAllocated ? 'text-destructive font-medium' : 'font-medium'}>{utilization}%</span>
                                                        </span>
                                                        <span>•</span>
                                                        <span>Available: {user.availableCapacity}%</span>
                                                        {user.activeProjects.length > 0 && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{user.activeProjects.length} active project{user.activeProjects.length !== 1 ? 's' : ''}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {user.activeProjects.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {user.activeProjects.map((project: any) => (
                                                                <Badge key={project.projectId} variant="secondary" className="text-xs">
                                                                    {project.projectName} ({project.allocation}%)
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <Button variant="outline" size="sm">View Schedule</Button>
                                            </div>
                                        )
                                    })}
                                    {(!capacityData?.capacity || capacityData.capacity.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No capacity data available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Skills Matrix</CardTitle>
                            <CardDescription>Team competencies and expertise</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {skillsLoading ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {skillsMatrix.users.map((user: any) => (
                                        <div key={user.userId} className="p-4 border rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {getInitials(user.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {user.skills.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {user.skills.map((skill: any) => (
                                                        <Badge key={skill.id} variant="secondary">
                                                            {skill.name} - {skill.level}
                                                            {skill.yearsOfExperience && ` (${skill.yearsOfExperience} yrs)`}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No skills recorded</p>
                                            )}
                                        </div>
                                    ))}
                                    {skillsMatrix.users.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No skills data available</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="capacity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Capacity Planning</CardTitle>
                            <CardDescription>Future capacity and hiring needs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {capacityLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : capacityData ? (
                                <div className="space-y-6">
                                    {/* Capacity Summary */}
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        {capacityData.capacity.map((user: any) => (
                                            <Card key={user.userId} className={user.isOverAllocated ? 'border-destructive' : ''}>
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm font-medium">{user.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">Allocation:</span>
                                                            <span className={`text-sm font-medium ${user.isOverAllocated ? 'text-destructive' : ''}`}>
                                                                {user.totalAllocation}%
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">Available:</span>
                                                            <span className="text-sm font-medium text-blue-600">{user.availableCapacity}%</span>
                                                        </div>
                                                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                                                            <div
                                                                className={`h-2 rounded-full ${user.isOverAllocated ? 'bg-destructive' : 'bg-green-600'}`}
                                                                style={{ width: `${Math.min(user.totalAllocation, 100)}%` }}
                                                            />
                                                        </div>
                                                        {user.activeProjects.length > 0 && (
                                                            <div className="text-xs text-muted-foreground mt-2">
                                                                {user.activeProjects.length} active project{user.activeProjects.length !== 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>

                                    {/* Weekly Capacity View */}
                                    {capacityData.weeklyCapacity && capacityData.weeklyCapacity.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">Weekly Capacity Forecast</h3>
                                            <div className="space-y-2">
                                                {capacityData.weeklyCapacity.slice(0, 8).map((week: any, idx: number) => (
                                                    <div key={idx} className="p-3 border rounded-lg">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-sm font-medium">{week.week}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {week.data.filter((u: any) => u.available > 20).length} available
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                            {week.data.slice(0, 4).map((user: any) => (
                                                                <div key={user.userId} className="text-xs">
                                                                    <span className="font-medium">{user.name.split(' ')[0]}:</span>
                                                                    <span className={`ml-1 ${user.allocation > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                                                        {user.allocation}% ({user.available}% avail)
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                    <div className="text-center">
                                        <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No capacity data available</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Resource Dialog */}
            <ResourceDialog
                open={resourceDialogOpen}
                onClose={() => setResourceDialogOpen(false)}
                onSubmit={(data) => {
                    console.log('Resource allocated:', data)
                    alert('✅ Resource allocated successfully!')
                    setResourceDialogOpen(false)
                }}
            />
        </div>
    )
}


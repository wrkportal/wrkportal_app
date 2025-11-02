'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatDate, getInitials } from "@/lib/utils"
import { Plus, Users, Calendar, ChevronRight } from "lucide-react"
import { ResourceDialog } from "@/components/dialogs/resource-dialog"

interface ResourcesTabProps {
    project: any
}

export function ResourcesTab({ project }: ResourcesTabProps) {
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false)

    if (!project) return <div>Project not found</div>

    const teamMembers = project.teamMembers || []

    return (
        <div className="space-y-6">
            {/* Team Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamMembers.length}</div>
                        <p className="text-xs text-muted-foreground">Active on project</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Allocation</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {teamMembers.length > 0 ? Math.round(teamMembers.reduce((sum: number, m: any) => sum + (m.allocation || 0), 0) / teamMembers.length) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Per team member</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {teamMembers.length > 0 ? teamMembers.reduce((sum: number, m: any) => sum + (m.allocation || 0), 0) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Combined allocation</p>
                    </CardContent>
                </Card>
            </div>

            {/* Sub-tabs for detailed views */}
            <Tabs defaultValue="team">
                <TabsList>
                    <TabsTrigger value="team">Team Members</TabsTrigger>
                    <TabsTrigger value="workload">Workload</TabsTrigger>
                    <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
                    <TabsTrigger value="capacity">Capacity Planning</TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Team Members</CardTitle>
                                    <CardDescription>Resource allocation for {project.name}</CardDescription>
                                </div>
                                <Button onClick={() => setResourceDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Resource
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {teamMembers.length > 0 ? teamMembers.map((member: any, index: number) => {
                                    const user = member.user
                                    return (
                                        <div key={member.id} className="p-4 border rounded-lg space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium">
                                                        {user ? `${user.firstName} ${user.lastName}` : `Team Member ${index + 1}`}
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground">{member.role || 'Team Member'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold">{member.allocation || 0}%</p>
                                                    <p className="text-xs text-muted-foreground">Allocation</p>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-muted-foreground">Capacity</span>
                                                    <span className="font-medium">{member.allocation || 0}%</span>
                                                </div>
                                                <Progress value={member.allocation || 0} className="h-2" />
                                            </div>
                                            {member.joinedAt && (
                                                <div className="text-xs text-muted-foreground">
                                                    Joined: {formatDate(member.joinedAt)}
                                                </div>
                                            )}
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No team members assigned yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="workload" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Workload Distribution</CardTitle>
                            <CardDescription>Current allocation across team members</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {teamMembers.length > 0 ? (
                                <div className="space-y-4">
                                    {teamMembers.map((member: any) => {
                                        const user = member.user
                                        if (!user) return null

                                        return (
                                            <div key={member.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                                <Avatar>
                                                    <AvatarImage src={user.avatar} alt={user.firstName} />
                                                    <AvatarFallback>
                                                        {getInitials(user.firstName, user.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                        <Badge variant="outline" className="text-xs">{user.role?.replace(/_/g, ' ')}</Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span>Allocation: <span className="font-medium">{member.allocation || 0}%</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                    <div className="text-center">
                                        <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No team members to display workload</p>
                                    </div>
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
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Skills matrix coming soon</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="capacity" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Capacity Planning</CardTitle>
                            <CardDescription>Future capacity and resource needs for {project.name}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Capacity planning coming soon</p>
                                </div>
                            </div>
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


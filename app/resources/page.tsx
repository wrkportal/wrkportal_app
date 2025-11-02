'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { mockUsers } from "@/lib/mock-data"
import { getInitials } from "@/lib/utils"
import { Plus, Users, Calendar, TrendingUp } from "lucide-react"
import { ResourceDialog } from "@/components/dialogs/resource-dialog"

export default function ResourcesPage() {
    const [resourceDialogOpen, setResourceDialogOpen] = useState(false)

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
                        <div className="text-2xl font-bold">{mockUsers.length}</div>
                        <p className="text-xs text-muted-foreground">Active team members</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Utilization</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">78%</div>
                        <p className="text-xs text-muted-foreground">Across all resources</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Over-allocated</CardTitle>
                        <Calendar className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">2</div>
                        <p className="text-xs text-muted-foreground">Need reallocation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">5</div>
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
                            <div className="space-y-4">
                                {mockUsers.map((user) => {
                                    const utilization = Math.floor(Math.random() * 40) + 60 // Mock data
                                    const isOverAllocated = utilization > 100

                                    return (
                                        <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                            <Avatar>
                                                <AvatarFallback>
                                                    {getInitials(user.firstName, user.lastName)}
                                                </AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                    <Badge variant="outline">{user.role.replace(/_/g, ' ')}</Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span>Utilization: <span className={isOverAllocated ? 'text-destructive font-medium' : 'font-medium'}>{utilization}%</span></span>
                                                    <span>•</span>
                                                    <span>{user.skills.length} skills</span>
                                                </div>
                                            </div>

                                            <Button variant="outline" size="sm">View Schedule</Button>
                                        </div>
                                    )
                                })}
                            </div>
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
                            <div className="space-y-4">
                                {mockUsers.map((user) => (
                                    <div key={user.id} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>
                                                        {getInitials(user.firstName, user.lastName)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                    <p className="text-sm text-muted-foreground">{user.role.replace(/_/g, ' ')}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {user.skills.map((skill) => (
                                                <Badge key={skill.id} variant="secondary">
                                                    {skill.name} - {skill.level}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
                                <div className="text-center">
                                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">Capacity heatmap coming soon</p>
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


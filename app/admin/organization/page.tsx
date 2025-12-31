'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Plus,
    Building2,
    Users,
    Search,
    Filter,
    UserPlus,
    Briefcase,
    TrendingUp,
    Shield,
    Mail,
    Phone,
    MapPin,
    Loader2,
} from 'lucide-react'
import { AddUserDialog } from '@/components/dialogs/add-user-dialog'
import { AddOrgUnitDialog } from '@/components/dialogs/add-org-unit-dialog'
import { ConfirmDeleteDialog } from '@/components/dialogs/confirm-delete-dialog'
import { EditUserDialog } from '@/components/dialogs/edit-user-dialog'
import { OrgChart } from '@/components/organization/org-chart'
import { OrgChartVisual } from '@/components/organization/org-chart-visual'
import { useAuthStore } from '@/stores/authStore'

export default function AdminOrganizationPage() {
    const currentUser = useAuthStore((state) => state.user)
    const [activeTab, setActiveTab] = useState('users')
    const [isLoading, setIsLoading] = useState(true)
    const [orgInfo, setOrgInfo] = useState<{ id: string; name: string } | null>(null)
    const [users, setUsers] = useState<any[]>([])
    const [orgUnits, setOrgUnits] = useState<any[]>([])
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        departments: 0,
        roleCounts: {} as Record<string, number>,
    })
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
    const [addOrgUnitDialogOpen, setAddOrgUnitDialogOpen] = useState(false)
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ type: 'user' | 'orgUnit'; id: string; name: string } | null>(null)
    const [userToEdit, setUserToEdit] = useState<any>(null)

    // Check if current user is admin
    const isAdmin = currentUser?.role === 'ORG_ADMIN' || currentUser?.role === 'TENANT_SUPER_ADMIN'

    useEffect(() => {
        fetchOrg()
        fetchData()
    }, [roleFilter, statusFilter])

    const fetchOrg = async () => {
        try {
            const res = await fetch('/api/organization/info')
            if (res.ok) {
                const data = await res.json()
                setOrgInfo({ id: data.organization.id, name: data.organization.name })
            }
        } catch (e) {
            console.error('Error fetching org info', e)
        }
    }

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const params = new URLSearchParams()
            if (roleFilter !== 'ALL') params.append('role', roleFilter)
            if (statusFilter !== 'ALL') params.append('status', statusFilter)

            const [usersRes, orgUnitsRes] = await Promise.all([
                fetch(`/api/organization/users?${params}`),
                fetch('/api/organization/org-units'),
            ])

            if (usersRes.ok) {
                const data = await usersRes.json()
                setUsers(data.users || [])

                // Calculate stats
                const roleCounts: Record<string, number> = {}
                data.roleCounts?.forEach((rc: any) => {
                    roleCounts[rc.role] = rc._count
                })

                setStats({
                    totalUsers: data.totalUsers || 0,
                    activeUsers: data.users?.filter((u: any) => u.status === 'ACTIVE').length || 0,
                    departments: new Set(data.users?.map((u: any) => u.department).filter(Boolean)).size,
                    roleCounts,
                })
            }

            if (orgUnitsRes.ok) {
                const data = await orgUnitsRes.json()
                setOrgUnits(data.orgUnits || [])
            }
        } catch (error) {
            console.error('Error fetching organization data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
    }

    const getRoleBadgeColor = (role: string) => {
        const colorMap: Record<string, string> = {
            TENANT_SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            ORG_ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
            PMO_LEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
            PROJECT_MANAGER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            RESOURCE_MANAGER: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            TEAM_MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
        return colorMap[role] || 'bg-gray-100 text-gray-800'
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            ACTIVE: <Badge className="bg-green-100 text-green-800">Active</Badge>,
            INACTIVE: <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>,
            INVITED: <Badge className="bg-blue-100 text-blue-800">Invited</Badge>,
            SUSPENDED: <Badge className="bg-red-100 text-red-800">Suspended</Badge>,
        }
        return variants[status as keyof typeof variants] || <Badge>{status}</Badge>
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.department?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const handleEditUser = (user: any) => {
        setUserToEdit(user)
        setEditUserDialogOpen(true)
    }

    const handleDeleteUser = (userId: string, userName: string) => {
        setItemToDelete({ type: 'user', id: userId, name: userName })
        setDeleteDialogOpen(true)
    }

    const handleDeleteOrgUnit = (orgUnitId: string, orgUnitName: string) => {
        setItemToDelete({ type: 'orgUnit', id: orgUnitId, name: orgUnitName })
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!itemToDelete) return

        try {
            const endpoint = itemToDelete.type === 'user'
                ? `/api/organization/users?userId=${itemToDelete.id}`
                : `/api/organization/org-units?orgUnitId=${itemToDelete.id}`

            const response = await fetch(endpoint, {
                method: 'DELETE',
            })

            if (response.ok) {
                await fetchData()
                setDeleteDialogOpen(false)
                setItemToDelete(null)
            } else {
                const error = await response.json()
                alert(error.error || `Failed to delete ${itemToDelete.type}`)
            }
        } catch (error) {
            console.error('Error deleting:', error)
            alert(`Failed to delete ${itemToDelete?.type}`)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header - Sticky */}
            <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Organization Management
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Manage users, teams, roles, and organizational structure
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                    {/* Organization name and ID */}
                    <div className="px-3 py-2 rounded-md border text-xs text-muted-foreground bg-white dark:bg-gray-900">
                        <span className="font-medium mr-1">Organization:</span>
                        <span className="mr-2">{orgInfo?.name || '—'}</span>
                        <span className="font-medium mr-1">ID:</span>
                        <span className="font-mono select-all">{orgInfo?.id || currentUser?.tenantId || '—'}</span>
                    </div>
                    <Button onClick={() => setAddOrgUnitDialogOpen(true)} variant="outline">
                        <Building2 className="mr-2 h-4 w-4" />
                        Add Org Unit
                    </Button>
                    <Button onClick={() => setAddUserDialogOpen(true)} className="bg-gradient-to-r from-purple-600 to-blue-600">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.activeUsers} active
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.departments}</div>
                        <p className="text-xs text-muted-foreground">
                            Across organization
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Org Units</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orgUnits.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Organizational units
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Managers</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(stats.roleCounts['PROJECT_MANAGER'] || 0) + (stats.roleCounts['RESOURCE_MANAGER'] || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            PM + RM roles
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4 mr-2" />
                        Users Directory
                    </TabsTrigger>
                    <TabsTrigger value="org-chart">
                        <Building2 className="h-4 w-4 mr-2" />
                        Org Chart (Hierarchy)
                    </TabsTrigger>
                    <TabsTrigger value="org-chart-visual">
                        <Building2 className="h-4 w-4 mr-2" />
                        Org Chart (Visual)
                    </TabsTrigger>
                    <TabsTrigger value="teams">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Teams & Projects
                    </TabsTrigger>
                </TabsList>

                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Users Directory</CardTitle>
                                    <CardDescription>Manage all users in your organization</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search users..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 w-64"
                                        />
                                    </div>
                                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Roles</SelectItem>
                                            <SelectItem value="PROJECT_MANAGER">PM</SelectItem>
                                            <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                                            <SelectItem value="RESOURCE_MANAGER">RM</SelectItem>
                                            <SelectItem value="ORG_ADMIN">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">All Status</SelectItem>
                                            <SelectItem value="ACTIVE">Active</SelectItem>
                                            <SelectItem value="INVITED">Invited</SelectItem>
                                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Tasks/Projects</TableHead>
                                            {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar>
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
                                                                {getInitials(user.firstName, user.lastName)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium">
                                                                {user.firstName} {user.lastName}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getRoleBadgeColor(user.role)}>
                                                        {user.role.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.department || (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-sm">
                                                        {user.phone && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Phone className="h-3 w-3" />
                                                                {user.phone}
                                                            </div>
                                                        )}
                                                        {user.location && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <MapPin className="h-3 w-3" />
                                                                {user.location}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(user.status)}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{user._count.assignedTasks} tasks</div>
                                                        <div className="text-muted-foreground">
                                                            {user._count.managedProjects} projects
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                {isAdmin && (
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditUser(user)}
                                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                                                disabled={user.id === currentUser?.id}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Org Chart Tab - Unit Hierarchy */}
                <TabsContent value="org-chart" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organizational Units</CardTitle>
                            <CardDescription>Department and team hierarchy structure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <OrgChart
                                    data={orgUnits}
                                    isAdmin={isAdmin}
                                    onDelete={handleDeleteOrgUnit}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Org Chart Tab - Visual People Hierarchy */}
                <TabsContent value="org-chart-visual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Organization Chart</CardTitle>
                            <CardDescription>Visual hierarchy of people and reporting structure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                                </div>
                            ) : (
                                <OrgChartVisual
                                    users={users}
                                    isAdmin={isAdmin}
                                    onDelete={handleDeleteUser}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Teams Tab */}
                <TabsContent value="teams" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Teams & Projects</CardTitle>
                            <CardDescription>Project assignments and team structures</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12">
                                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">Project team management coming soon</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add User Dialog */}
            <AddUserDialog
                open={addUserDialogOpen}
                onClose={() => setAddUserDialogOpen(false)}
                onSuccess={fetchData}
            />

            {/* Edit User Dialog */}
            <EditUserDialog
                open={editUserDialogOpen}
                onClose={() => {
                    setEditUserDialogOpen(false)
                    setUserToEdit(null)
                }}
                onSuccess={fetchData}
                user={userToEdit}
            />

            {/* Add Org Unit Dialog */}
            <AddOrgUnitDialog
                open={addOrgUnitDialogOpen}
                onClose={() => setAddOrgUnitDialogOpen(false)}
                onSuccess={fetchData}
            />

            {/* Confirm Delete Dialog */}
            <ConfirmDeleteDialog
                open={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false)
                    setItemToDelete(null)
                }}
                onConfirm={confirmDelete}
                title={`Delete ${itemToDelete?.type === 'user' ? 'User' : 'Org Unit'}?`}
                description={
                    itemToDelete?.type === 'user'
                        ? 'This will permanently remove this user from your organization. All their data will be deleted.'
                        : 'This will permanently delete this organizational unit. Make sure no users or sub-units are assigned to it.'
                }
                itemName={itemToDelete?.name || ''}
            />
        </div>
    )
}

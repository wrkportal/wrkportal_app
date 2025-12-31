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
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Shield,
    Search,
    Plus,
    Edit,
    Trash2,
    Filter,
    FileText,
    User,
    Building2,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Clock,
    Eye,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'

interface OrganizationPermission {
    id: string
    orgUnitId: string | null
    userId: string | null
    role: string | null
    resource: string
    actions: string[]
    conditions: any
    inheritance: boolean
    expiresAt: string | null
    createdAt: string
    orgUnit?: { id: string; name: string } | null
    user?: { id: string; email: string; firstName: string; lastName: string } | null
}

interface FunctionPermission {
    id: string
    orgUnitId: string | null
    userId: string | null
    role: string | null
    function: string
    allowed: boolean
    conditions: any
    inheritance: boolean
    expiresAt: string | null
    createdAt: string
    orgUnit?: { id: string; name: string } | null
    user?: { id: string; email: string; firstName: string; lastName: string } | null
}

interface AuditLog {
    id: string
    userId: string
    resource: string
    resourceId: string | null
    action: string
    result: 'GRANTED' | 'DENIED' | 'ERROR'
    reason: string | null
    ipAddress: string | null
    createdAt: string
    user?: { id: string; email: string; firstName: string; lastName: string } | null
}

export default function AdminPermissionsPage() {
    const currentUser = useAuthStore((state) => state.user)
    const [activeTab, setActiveTab] = useState('organization')
    const [isLoading, setIsLoading] = useState(true)
    
    // Organization Permissions
    const [orgPermissions, setOrgPermissions] = useState<OrganizationPermission[]>([])
    const [orgDialogOpen, setOrgDialogOpen] = useState(false)
    const [editingOrgPerm, setEditingOrgPerm] = useState<OrganizationPermission | null>(null)
    
    // Function Permissions
    const [funcPermissions, setFuncPermissions] = useState<FunctionPermission[]>([])
    const [funcDialogOpen, setFuncDialogOpen] = useState(false)
    const [editingFuncPerm, setEditingFuncPerm] = useState<FunctionPermission | null>(null)
    
    // Audit Logs
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [auditPage, setAuditPage] = useState(1)
    const [auditTotal, setAuditTotal] = useState(0)
    
    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [resourceFilter, setResourceFilter] = useState('ALL')
    const [resultFilter, setResultFilter] = useState('ALL')
    
    // Form state
    const [assignTo, setAssignTo] = useState<'user' | 'orgUnit' | 'role'>('role')
    const [selectedUserId, setSelectedUserId] = useState('')
    const [selectedOrgUnitId, setSelectedOrgUnitId] = useState('')
    const [selectedRole, setSelectedRole] = useState('')
    const [resource, setResource] = useState('')
    const [actions, setActions] = useState<string[]>(['READ'])
    const [functionName, setFunctionName] = useState('')
    const [functionAllowed, setFunctionAllowed] = useState(true)
    const [inheritance, setInheritance] = useState(true)
    const [expiresAt, setExpiresAt] = useState('')
    
    const [users, setUsers] = useState<any[]>([])
    const [orgUnits, setOrgUnits] = useState<any[]>([])

    const isAdmin = currentUser?.role === 'ORG_ADMIN' || currentUser?.role === 'TENANT_SUPER_ADMIN' || currentUser?.role === 'PLATFORM_OWNER'

    const availableActions = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'CONFIGURE']
    const availableResources = ['projects', 'finance', 'reporting', 'users', 'settings', 'audit-logs', 'dashboards', 'datasets']
    const availableFunctions = ['export_reports', 'create_dashboard', 'approve_budget', 'manage_users', 'configure_settings']

    useEffect(() => {
        if (isAdmin) {
            fetchData()
            fetchUsers()
            fetchOrgUnits()
        }
    }, [activeTab, resourceFilter, resultFilter, auditPage])

    const fetchData = async () => {
        setIsLoading(true)
        try {
            if (activeTab === 'organization') {
                const params = new URLSearchParams()
                if (resourceFilter !== 'ALL') params.append('resource', resourceFilter)
                const res = await fetch(`/api/permissions/organization?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrgPermissions(data.permissions || [])
                }
            } else if (activeTab === 'functions') {
                const res = await fetch('/api/permissions/functions')
                if (res.ok) {
                    const data = await res.json()
                    setFuncPermissions(data.permissions || [])
                }
            } else if (activeTab === 'audit') {
                const params = new URLSearchParams()
                if (resourceFilter !== 'ALL') params.append('resource', resourceFilter)
                if (resultFilter !== 'ALL') params.append('result', resultFilter)
                params.append('page', auditPage.toString())
                params.append('limit', '50')
                const res = await fetch(`/api/permissions/audit-logs?${params}`)
                if (res.ok) {
                    const data = await res.json()
                    setAuditLogs(data.logs || [])
                    setAuditTotal(data.pagination?.total || 0)
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/organization/users')
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users || [])
            }
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const fetchOrgUnits = async () => {
        try {
            const res = await fetch('/api/organization/org-units')
            if (res.ok) {
                const data = await res.json()
                setOrgUnits(data.orgUnits || [])
            }
        } catch (error) {
            console.error('Error fetching org units:', error)
        }
    }

    const handleCreateOrgPermission = async () => {
        try {
            const payload: any = {
                resource,
                actions,
                inheritance,
            }

            if (assignTo === 'user') {
                payload.userId = selectedUserId
            } else if (assignTo === 'orgUnit') {
                payload.orgUnitId = selectedOrgUnitId
            } else {
                payload.role = selectedRole
            }

            if (expiresAt) {
                payload.expiresAt = new Date(expiresAt).toISOString()
            }

            const url = editingOrgPerm
                ? `/api/permissions/organization/${editingOrgPerm.id}`
                : '/api/permissions/organization'
            const method = editingOrgPerm ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                setOrgDialogOpen(false)
                resetForm()
                fetchData()
            }
        } catch (error) {
            console.error('Error saving permission:', error)
        }
    }

    const handleCreateFunctionPermission = async () => {
        try {
            const payload: any = {
                function: functionName,
                allowed: functionAllowed,
                inheritance,
            }

            if (assignTo === 'user') {
                payload.userId = selectedUserId
            } else if (assignTo === 'orgUnit') {
                payload.orgUnitId = selectedOrgUnitId
            } else {
                payload.role = selectedRole
            }

            if (expiresAt) {
                payload.expiresAt = new Date(expiresAt).toISOString()
            }

            const url = editingFuncPerm
                ? `/api/permissions/functions/${editingFuncPerm.id}`
                : '/api/permissions/functions'
            const method = editingFuncPerm ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                setFuncDialogOpen(false)
                resetForm()
                fetchData()
            }
        } catch (error) {
            console.error('Error saving function permission:', error)
        }
    }

    const handleDeleteOrgPermission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this permission?')) return

        try {
            const res = await fetch(`/api/permissions/organization/${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting permission:', error)
        }
    }

    const handleDeleteFunctionPermission = async (id: string) => {
        if (!confirm('Are you sure you want to delete this permission?')) return

        try {
            const res = await fetch(`/api/permissions/functions/${id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                fetchData()
            }
        } catch (error) {
            console.error('Error deleting function permission:', error)
        }
    }

    const resetForm = () => {
        setEditingOrgPerm(null)
        setEditingFuncPerm(null)
        setAssignTo('role')
        setSelectedUserId('')
        setSelectedOrgUnitId('')
        setSelectedRole('')
        setResource('')
        setActions(['READ'])
        setFunctionName('')
        setFunctionAllowed(true)
        setInheritance(true)
        setExpiresAt('')
    }

    const openEditOrgDialog = (perm: OrganizationPermission) => {
        setEditingOrgPerm(perm)
        setAssignTo(perm.userId ? 'user' : perm.orgUnitId ? 'orgUnit' : 'role')
        setSelectedUserId(perm.userId || '')
        setSelectedOrgUnitId(perm.orgUnitId || '')
        setSelectedRole(perm.role || '')
        setResource(perm.resource)
        setActions(perm.actions)
        setInheritance(perm.inheritance)
        setExpiresAt(perm.expiresAt || '')
        setOrgDialogOpen(true)
    }

    const openEditFuncDialog = (perm: FunctionPermission) => {
        setEditingFuncPerm(perm)
        setAssignTo(perm.userId ? 'user' : perm.orgUnitId ? 'orgUnit' : 'role')
        setSelectedUserId(perm.userId || '')
        setSelectedOrgUnitId(perm.orgUnitId || '')
        setSelectedRole(perm.role || '')
        setFunctionName(perm.function)
        setFunctionAllowed(perm.allowed)
        setInheritance(perm.inheritance)
        setExpiresAt(perm.expiresAt || '')
        setFuncDialogOpen(true)
    }

    const toggleAction = (action: string) => {
        setActions(prev =>
            prev.includes(action)
                ? prev.filter(a => a !== action)
                : [...prev, action]
        )
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            You don't have permission to access this page.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const filteredOrgPermissions = orgPermissions.filter(p =>
        searchQuery === '' ||
        p.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orgUnit?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredFuncPermissions = funcPermissions.filter(p =>
        searchQuery === '' ||
        p.function.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orgUnit?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8" />
                        Permissions Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage organization-level and function-level permissions
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="organization">Organization Permissions</TabsTrigger>
                    <TabsTrigger value="functions">Function Permissions</TabsTrigger>
                    <TabsTrigger value="audit">Access Audit Logs</TabsTrigger>
                </TabsList>

                {/* Organization Permissions Tab */}
                <TabsContent value="organization" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Organization Permissions</CardTitle>
                                    <CardDescription>
                                        Manage resource-level permissions for users, org units, and roles
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { resetForm(); setOrgDialogOpen(true) }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Permission
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by resource" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Resources</SelectItem>
                                        {availableResources.map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Resource</TableHead>
                                            <TableHead>Actions</TableHead>
                                            <TableHead>Inheritance</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrgPermissions.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    {perm.user ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            <span>{perm.user.email}</span>
                                                        </div>
                                                    ) : perm.orgUnit ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4" />
                                                            <span>{perm.orgUnit.name}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge>{perm.role}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{perm.resource}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {perm.actions.map(action => (
                                                            <Badge key={action} variant="secondary" className="text-xs">
                                                                {action}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {perm.inheritance ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            Yes
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {perm.expiresAt ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(perm.expiresAt)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Never</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditOrgDialog(perm)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteOrgPermission(perm.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredOrgPermissions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No permissions found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Function Permissions Tab */}
                <TabsContent value="functions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Function Permissions</CardTitle>
                                    <CardDescription>
                                        Manage fine-grained function-level permissions
                                    </CardDescription>
                                </div>
                                <Button onClick={() => { resetForm(); setFuncDialogOpen(true) }}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Permission
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search permissions..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Assigned To</TableHead>
                                            <TableHead>Function</TableHead>
                                            <TableHead>Allowed</TableHead>
                                            <TableHead>Inheritance</TableHead>
                                            <TableHead>Expires</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredFuncPermissions.map((perm) => (
                                            <TableRow key={perm.id}>
                                                <TableCell>
                                                    {perm.user ? (
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4" />
                                                            <span>{perm.user.email}</span>
                                                        </div>
                                                    ) : perm.orgUnit ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="h-4 w-4" />
                                                            <span>{perm.orgUnit.name}</span>
                                                        </div>
                                                    ) : (
                                                        <Badge>{perm.role}</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-sm">{perm.function}</code>
                                                </TableCell>
                                                <TableCell>
                                                    {perm.allowed ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            Allowed
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="destructive">Denied</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {perm.inheritance ? (
                                                        <Badge variant="default" className="bg-green-600">
                                                            Yes
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">No</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {perm.expiresAt ? (
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(perm.expiresAt)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">Never</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditFuncDialog(perm)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteFunctionPermission(perm.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {filteredFuncPermissions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No permissions found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Access Audit Logs</CardTitle>
                            <CardDescription>
                                View access attempts and permission checks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-4">
                                <Select value={resourceFilter} onValueChange={setResourceFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by resource" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Resources</SelectItem>
                                        {availableResources.map(r => (
                                            <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={resultFilter} onValueChange={setResultFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by result" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Results</SelectItem>
                                        <SelectItem value="GRANTED">Granted</SelectItem>
                                        <SelectItem value="DENIED">Denied</SelectItem>
                                        <SelectItem value="ERROR">Error</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>User</TableHead>
                                                <TableHead>Resource</TableHead>
                                                <TableHead>Action</TableHead>
                                                <TableHead>Result</TableHead>
                                                <TableHead>IP Address</TableHead>
                                                <TableHead>Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditLogs.map((log) => (
                                                <TableRow key={log.id}>
                                                    <TableCell>
                                                        {log.user?.email || 'Unknown'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{log.resource}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <code className="text-sm">{log.action}</code>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.result === 'GRANTED' ? (
                                                            <Badge variant="default" className="bg-green-600">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                                Granted
                                                            </Badge>
                                                        ) : log.result === 'DENIED' ? (
                                                            <Badge variant="destructive">
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Denied
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary">
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Error
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {log.ipAddress || 'N/A'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(log.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {auditLogs.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                        No audit logs found
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>

                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {auditLogs.length} of {auditTotal} logs
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                                disabled={auditPage === 1}
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAuditPage(p => p + 1)}
                                                disabled={auditPage * 50 >= auditTotal}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create/Edit Organization Permission Dialog */}
            <Dialog open={orgDialogOpen} onOpenChange={setOrgDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingOrgPerm ? 'Edit' : 'Create'} Organization Permission
                        </DialogTitle>
                        <DialogDescription>
                            Assign resource-level permissions to users, org units, or roles
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Assign To</Label>
                            <Select value={assignTo} onValueChange={(v: any) => setAssignTo(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="role">Role</SelectItem>
                                    <SelectItem value="orgUnit">Org Unit</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {assignTo === 'user' && (
                            <div>
                                <Label>User</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {assignTo === 'orgUnit' && (
                            <div>
                                <Label>Org Unit</Label>
                                <Select value={selectedOrgUnitId} onValueChange={setSelectedOrgUnitId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select org unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orgUnits.map(ou => (
                                            <SelectItem key={ou.id} value={ou.id}>
                                                {ou.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {assignTo === 'role' && (
                            <div>
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                        <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                                        <SelectItem value="FINANCE_CONTROLLER">Finance Controller</SelectItem>
                                        <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
                                        <SelectItem value="PMO_LEAD">PMO Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label>Resource</Label>
                            <Select value={resource} onValueChange={setResource}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select resource" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableResources.map(r => (
                                        <SelectItem key={r} value={r}>{r}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Actions</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {availableActions.map(action => (
                                    <div key={action} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={action}
                                            checked={actions.includes(action)}
                                            onCheckedChange={() => toggleAction(action)}
                                        />
                                        <label
                                            htmlFor={action}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {action}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="inheritance"
                                checked={inheritance}
                                onCheckedChange={setInheritance}
                            />
                            <Label htmlFor="inheritance">Enable inheritance to child org units</Label>
                        </div>

                        <div>
                            <Label>Expiration Date (optional)</Label>
                            <Input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setOrgDialogOpen(false); resetForm() }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateOrgPermission}>
                            {editingOrgPerm ? 'Update' : 'Create'} Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create/Edit Function Permission Dialog */}
            <Dialog open={funcDialogOpen} onOpenChange={setFuncDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingFuncPerm ? 'Edit' : 'Create'} Function Permission
                        </DialogTitle>
                        <DialogDescription>
                            Assign function-level permissions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Assign To</Label>
                            <Select value={assignTo} onValueChange={(v: any) => setAssignTo(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="role">Role</SelectItem>
                                    <SelectItem value="orgUnit">Org Unit</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {assignTo === 'user' && (
                            <div>
                                <Label>User</Label>
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select user" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {assignTo === 'orgUnit' && (
                            <div>
                                <Label>Org Unit</Label>
                                <Select value={selectedOrgUnitId} onValueChange={setSelectedOrgUnitId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select org unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orgUnits.map(ou => (
                                            <SelectItem key={ou.id} value={ou.id}>
                                                {ou.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {assignTo === 'role' && (
                            <div>
                                <Label>Role</Label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PROJECT_MANAGER">Project Manager</SelectItem>
                                        <SelectItem value="TEAM_MEMBER">Team Member</SelectItem>
                                        <SelectItem value="FINANCE_CONTROLLER">Finance Controller</SelectItem>
                                        <SelectItem value="ORG_ADMIN">Org Admin</SelectItem>
                                        <SelectItem value="PMO_LEAD">PMO Lead</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label>Function</Label>
                            <Select value={functionName} onValueChange={setFunctionName}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select function" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableFunctions.map(f => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="allowed"
                                checked={functionAllowed}
                                onCheckedChange={setFunctionAllowed}
                            />
                            <Label htmlFor="allowed">Allow this function</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="inheritance-func"
                                checked={inheritance}
                                onCheckedChange={setInheritance}
                            />
                            <Label htmlFor="inheritance-func">Enable inheritance to child org units</Label>
                        </div>

                        <div>
                            <Label>Expiration Date (optional)</Label>
                            <Input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setFuncDialogOpen(false); resetForm() }}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateFunctionPermission}>
                            {editingFuncPerm ? 'Update' : 'Create'} Permission
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


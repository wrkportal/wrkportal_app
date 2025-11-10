'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Database, Plus, Trash2, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DatabaseConnection {
    id: string
    name: string
    type: 'mysql' | 'postgresql' | 'sqlserver' | 'mongodb'
    host: string
    port: number
    database: string
    username: string
    status: 'connected' | 'disconnected' | 'error'
    createdAt: string
    lastTested?: string
}

export function ExternalDatabaseConnection() {
    const [connections, setConnections] = useState<DatabaseConnection[]>([])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    
    // Form state
    const [formData, setFormData] = useState({
        name: '',
        type: 'postgresql' as 'mysql' | 'postgresql' | 'sqlserver' | 'mongodb',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
    })

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleTestConnection = async () => {
        setIsTestingConnection(true)
        setTestResult(null)

        try {
            const response = await fetch('/api/reporting-studio/test-connection', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const result = await response.json()

            if (response.ok) {
                setTestResult({ success: true, message: 'Connection successful!' })
            } else {
                setTestResult({ success: false, message: result.error || 'Connection failed' })
            }
        } catch (error) {
            setTestResult({ success: false, message: 'Failed to test connection' })
        } finally {
            setIsTestingConnection(false)
        }
    }

    const handleSaveConnection = async () => {
        try {
            const response = await fetch('/api/reporting-studio/external-connections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                const newConnection = await response.json()
                setConnections(prev => [...prev, newConnection])
                setShowAddDialog(false)
                setFormData({
                    name: '',
                    type: 'postgresql',
                    host: '',
                    port: '',
                    database: '',
                    username: '',
                    password: '',
                })
                setTestResult(null)
            } else {
                alert('Failed to save connection')
            }
        } catch (error) {
            alert('Error saving connection')
        }
    }

    const handleDeleteConnection = async (id: string) => {
        if (!confirm('Are you sure you want to delete this connection?')) return

        try {
            const response = await fetch(`/api/reporting-studio/external-connections/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setConnections(prev => prev.filter(c => c.id !== id))
            }
        } catch (error) {
            alert('Error deleting connection')
        }
    }

    const getDatabaseIcon = (type: string) => {
        return <Database className="h-4 w-4" />
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'connected':
                return (
                    <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                    </Badge>
                )
            case 'disconnected':
                return (
                    <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Disconnected
                    </Badge>
                )
            case 'error':
                return (
                    <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        Error
                    </Badge>
                )
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                External Database Connections
                            </CardTitle>
                            <CardDescription className="mt-2">
                                Connect your own SQL databases to import and analyze data
                            </CardDescription>
                        </div>
                        <Button onClick={() => setShowAddDialog(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Connection
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {connections.length === 0 ? (
                        <div className="text-center py-12">
                            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No database connections yet</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Connect your MySQL, PostgreSQL, SQL Server, or MongoDB database to start importing data
                            </p>
                            <Button onClick={() => setShowAddDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Your First Connection
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {connections.map((connection) => (
                                <Card key={connection.id} className="overflow-hidden">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                {getDatabaseIcon(connection.type)}
                                                <div>
                                                    <CardTitle className="text-base">{connection.name}</CardTitle>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {connection.type.toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            {getStatusBadge(connection.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div className="text-sm space-y-1">
                                            <p className="text-muted-foreground">
                                                <span className="font-medium">Host:</span> {connection.host}:{connection.port}
                                            </p>
                                            <p className="text-muted-foreground">
                                                <span className="font-medium">Database:</span> {connection.database}
                                            </p>
                                            <p className="text-muted-foreground">
                                                <span className="font-medium">User:</span> {connection.username}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <Button variant="outline" size="sm" className="flex-1">
                                                <TestTube className="mr-1 h-3 w-3" />
                                                Test
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDeleteConnection(connection.id)}
                                            >
                                                <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add Connection Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Database Connection</DialogTitle>
                        <DialogDescription>
                            Enter your database connection details. We'll securely store your credentials.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Connection Name</Label>
                                <Input
                                    id="name"
                                    placeholder="My Production DB"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Database Type</Label>
                                <Select value={formData.type} onValueChange={(value: any) => handleInputChange('type', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="postgresql">PostgreSQL</SelectItem>
                                        <SelectItem value="mysql">MySQL</SelectItem>
                                        <SelectItem value="sqlserver">SQL Server</SelectItem>
                                        <SelectItem value="mongodb">MongoDB</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="host">Host</Label>
                                <Input
                                    id="host"
                                    placeholder="localhost or database.example.com"
                                    value={formData.host}
                                    onChange={(e) => handleInputChange('host', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="port">Port</Label>
                                <Input
                                    id="port"
                                    placeholder="5432"
                                    value={formData.port}
                                    onChange={(e) => handleInputChange('port', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="database">Database Name</Label>
                            <Input
                                id="database"
                                placeholder="myapp_production"
                                value={formData.database}
                                onChange={(e) => handleInputChange('database', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="db_user"
                                    value={formData.username}
                                    onChange={(e) => handleInputChange('username', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Test Connection Button & Result */}
                        <div className="space-y-2">
                            <Button
                                onClick={handleTestConnection}
                                disabled={isTestingConnection || !formData.host || !formData.database}
                                className="w-full"
                                variant="outline"
                            >
                                {isTestingConnection ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Testing Connection...
                                    </>
                                ) : (
                                    <>
                                        <TestTube className="mr-2 h-4 w-4" />
                                        Test Connection
                                    </>
                                )}
                            </Button>

                            {testResult && (
                                <div
                                    className={cn(
                                        'flex items-center gap-2 p-3 rounded-md text-sm',
                                        testResult.success
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-red-50 text-red-700 border border-red-200'
                                    )}
                                >
                                    {testResult.success ? (
                                        <CheckCircle className="h-4 w-4" />
                                    ) : (
                                        <XCircle className="h-4 w-4" />
                                    )}
                                    {testResult.message}
                                </div>
                            )}
                        </div>

                        <div className="bg-muted p-3 rounded-md text-xs text-muted-foreground">
                            <strong>Note:</strong> Your database credentials are encrypted and stored securely. 
                            We recommend using read-only database users for reporting connections.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveConnection}
                            disabled={!testResult?.success || isTestingConnection}
                        >
                            Save Connection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}


'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, Plus, Trash2, TestTube, CheckCircle, XCircle, Loader2, PlayCircle, Save, FileDown, Code } from 'lucide-react'
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

interface QueryResult {
    columns: string[]
    rows: any[][]
    rowCount: number
    executionTime: number
}

export function ExternalDatabaseConnection() {
    const [connections, setConnections] = useState<DatabaseConnection[]>([])
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
    
    // SQL Query state
    const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null)
    const [sqlQuery, setSqlQuery] = useState('')
    const [isExecutingQuery, setIsExecutingQuery] = useState(false)
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
    const [queryError, setQueryError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'connections' | 'query'>('connections')
    const [autoRefresh, setAutoRefresh] = useState(false)
    const [refreshInterval, setRefreshInterval] = useState(30) // seconds
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
    
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

    // Load connections on mount
    useEffect(() => {
        fetchConnections()
    }, [])

    // Auto-refresh effect
    useEffect(() => {
        if (!autoRefresh || !selectedConnection || !sqlQuery.trim()) {
            return
        }

        const interval = setInterval(() => {
            handleExecuteQuery()
        }, refreshInterval * 1000)

        return () => clearInterval(interval)
    }, [autoRefresh, refreshInterval, selectedConnection, sqlQuery])

    const fetchConnections = async () => {
        try {
            const response = await fetch('/api/reporting-studio/external-connections')
            if (response.ok) {
                const data = await response.json()
                setConnections(data.connections || [])
            }
        } catch (error) {
            console.error('Error fetching connections:', error)
        }
    }

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
                fetchConnections()
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
                if (selectedConnection?.id === id) {
                    setSelectedConnection(null)
                }
            }
        } catch (error) {
            alert('Error deleting connection')
        }
    }

    const handleExecuteQuery = async () => {
        if (!selectedConnection || !sqlQuery.trim()) {
            alert('Please select a connection and enter a SQL query')
            return
        }

        setIsExecutingQuery(true)
        setQueryResult(null)
        setQueryError(null)

        try {
            const response = await fetch('/api/reporting-studio/execute-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    connectionId: selectedConnection.id,
                    query: sqlQuery,
                }),
            })

            const result = await response.json()

            if (response.ok) {
                setQueryResult(result)
                setLastRefreshed(new Date())
            } else {
                setQueryError(result.error || 'Query execution failed')
            }
        } catch (error) {
            setQueryError('Failed to execute query')
        } finally {
            setIsExecutingQuery(false)
        }
    }

    const handleSaveAsDataset = async () => {
        if (!queryResult) return

        const datasetName = prompt('Enter a name for this dataset:')
        if (!datasetName) return

        try {
            const response = await fetch('/api/reporting-studio/save-query-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: datasetName,
                    connectionId: selectedConnection?.id,
                    query: sqlQuery,
                    columns: queryResult.columns,
                    rows: queryResult.rows,
                }),
            })

            if (response.ok) {
                alert('Dataset saved successfully! You can now find it in the Uploads tab.')
            } else {
                alert('Failed to save dataset')
            }
        } catch (error) {
            alert('Error saving dataset')
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
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="connections">
                    <Database className="h-4 w-4 mr-2" />
                    Connections
                </TabsTrigger>
                <TabsTrigger value="query">
                    <Code className="h-4 w-4 mr-2" />
                    SQL Query
                </TabsTrigger>
            </TabsList>

            <TabsContent value="connections" className="space-y-6">
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
            </TabsContent>

            {/* SQL Query Tab */}
            <TabsContent value="query" className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                    {/* Left Panel - Query Editor */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Code className="h-5 w-5" />
                                        SQL Query Editor
                                    </span>
                                    {selectedConnection && getStatusBadge(selectedConnection.status)}
                                </CardTitle>
                                <CardDescription>
                                    Write and execute SQL queries against your connected database
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Connection Selector */}
                                <div className="space-y-2">
                                    <Label>Select Database Connection</Label>
                                    <Select 
                                        value={selectedConnection?.id || ''} 
                                        onValueChange={(id) => setSelectedConnection(connections.find(c => c.id === id) || null)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Choose a connection..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {connections.map((conn) => (
                                                <SelectItem key={conn.id} value={conn.id}>
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-4 w-4" />
                                                        {conn.name} ({conn.database})
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {connections.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            No connections available. Add a connection in the Connections tab first.
                                        </p>
                                    )}
                                </div>

                                {/* SQL Query Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="sql-query">SQL Query</Label>
                                    <Textarea
                                        id="sql-query"
                                        placeholder="SELECT * FROM your_table WHERE condition = 'value' LIMIT 100"
                                        value={sqlQuery}
                                        onChange={(e) => setSqlQuery(e.target.value)}
                                        rows={10}
                                        className="font-mono text-sm"
                                        disabled={!selectedConnection}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Tip: Use LIMIT clause to control the number of rows returned
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleExecuteQuery}
                                        disabled={!selectedConnection || !sqlQuery.trim() || isExecutingQuery}
                                        className="flex-1"
                                    >
                                        {isExecutingQuery ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Executing...
                                            </>
                                        ) : (
                                            <>
                                                <PlayCircle className="mr-2 h-4 w-4" />
                                                Execute Query
                                            </>
                                        )}
                                    </Button>
                                    {queryResult && (
                                        <Button
                                            variant="outline"
                                            onClick={handleSaveAsDataset}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Save as Dataset
                                        </Button>
                                    )}
                                </div>

                                {/* Auto-Refresh Controls */}
                                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-md border">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="auto-refresh"
                                            checked={autoRefresh}
                                            onChange={(e) => setAutoRefresh(e.target.checked)}
                                            className="rounded"
                                        />
                                        <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
                                            Auto-refresh
                                        </Label>
                                    </div>
                                    {autoRefresh && (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="refresh-interval" className="text-sm">Every</Label>
                                                <Select 
                                                    value={String(refreshInterval)} 
                                                    onValueChange={(value) => setRefreshInterval(Number(value))}
                                                >
                                                    <SelectTrigger className="w-24 h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="10">10 sec</SelectItem>
                                                        <SelectItem value="30">30 sec</SelectItem>
                                                        <SelectItem value="60">1 min</SelectItem>
                                                        <SelectItem value="300">5 min</SelectItem>
                                                        <SelectItem value="600">10 min</SelectItem>
                                                        <SelectItem value="1800">30 min</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {lastRefreshed && (
                                                <span className="text-xs text-muted-foreground ml-auto">
                                                    Last: {lastRefreshed.toLocaleTimeString()}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* Query Error */}
                                {queryError && (
                                    <div className="flex items-start gap-2 p-3 rounded-md text-sm bg-red-50 text-red-700 border border-red-200">
                                        <XCircle className="h-4 w-4 mt-0.5" />
                                        <div>
                                            <p className="font-medium">Query Error</p>
                                            <p className="text-xs mt-1">{queryError}</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Query Results */}
                        {queryResult && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                            Query Results
                                            {autoRefresh && (
                                                <Badge variant="secondary" className="ml-2 animate-pulse">
                                                    <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
                                                    Live
                                                </Badge>
                                            )}
                                        </CardTitle>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <span>{queryResult.rowCount} rows</span>
                                            <span>•</span>
                                            <span>{queryResult.executionTime}ms</span>
                                            {lastRefreshed && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-xs">Updated {lastRefreshed.toLocaleTimeString()}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px] w-full rounded-md border">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted sticky top-0">
                                                <tr>
                                                    {queryResult.columns.map((col, idx) => (
                                                        <th key={idx} className="px-4 py-2 text-left font-medium border-b">
                                                            {col}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {queryResult.rows.map((row, rowIdx) => (
                                                    <tr key={rowIdx} className="border-b hover:bg-accent/50">
                                                        {row.map((cell, cellIdx) => (
                                                            <td key={cellIdx} className="px-4 py-2">
                                                                {cell === null ? <span className="text-muted-foreground italic">NULL</span> : String(cell)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Panel - Quick Reference */}
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">SQL Quick Reference</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium mb-1">Select Data</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                                        SELECT * FROM table_name LIMIT 100
                                    </code>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Filter Data</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                                        WHERE column = 'value' AND date > '2024-01-01'
                                    </code>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Join Tables</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                                        JOIN other_table ON table.id = other_table.fk_id
                                    </code>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Aggregate</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                                        SELECT COUNT(*), SUM(amount) FROM table GROUP BY category
                                    </code>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Order Results</p>
                                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                                        ORDER BY column DESC
                                    </code>
                                </div>
                            </CardContent>
                        </Card>

                        {selectedConnection && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Connection Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div>
                                        <span className="font-medium">Name:</span>
                                        <p className="text-muted-foreground">{selectedConnection.name}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Type:</span>
                                        <p className="text-muted-foreground">{selectedConnection.type.toUpperCase()}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Database:</span>
                                        <p className="text-muted-foreground">{selectedConnection.database}</p>
                                    </div>
                                    <div>
                                        <span className="font-medium">Host:</span>
                                        <p className="text-muted-foreground">{selectedConnection.host}:{selectedConnection.port}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    )
}


'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TestTube, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { DataSourceType, DataSourceProvider } from '@/types/reporting-studio'

interface DatabaseConnectionDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  dataSourceId?: string // If provided, editing existing connection
}

interface ConnectionConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  connectionString?: string
}

export function DatabaseConnectionDialog({
  open,
  onClose,
  onSuccess,
  dataSourceId,
}: DatabaseConnectionDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<DataSourceType>('DATABASE')
  const [provider, setProvider] = useState<DataSourceProvider>('POSTGRESQL')
  const [config, setConfig] = useState<ConnectionConfig>({
    host: '',
    port: 5432,
    database: '',
    username: '',
    password: '',
    ssl: false,
  })
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing data source if editing
  useEffect(() => {
    if (open && dataSourceId) {
      loadDataSource()
    } else if (open && !dataSourceId) {
      resetForm()
    }
  }, [open, dataSourceId])

  const loadDataSource = async () => {
    try {
      const response = await fetch(`/api/reporting-studio/data-sources/${dataSourceId}`)
      if (response.ok) {
        const data = await response.json()
        setName(data.name || '')
        setDescription(data.description || '')
        setType(data.type || 'DATABASE')
        setProvider(data.provider || 'POSTGRESQL')
        // Note: connection config is not returned for security
      }
    } catch (error) {
      console.error('Error loading data source:', error)
      setError('Failed to load data source')
    }
  }

  const resetForm = () => {
    setName('')
    setDescription('')
    setType('DATABASE')
    setProvider('POSTGRESQL')
    setConfig({
      host: '',
      port: 5432,
      database: '',
      username: '',
      password: '',
      ssl: false,
    })
    setTestResult(null)
    setError(null)
  }

  const getDefaultPort = (provider: DataSourceProvider): number => {
    switch (provider) {
      case 'POSTGRESQL':
        return 5432
      case 'MYSQL':
        return 3306
      case 'SQLSERVER':
        return 1433
      case 'MONGODB':
        return 27017
      default:
        return 5432
    }
  }

  const handleProviderChange = (newProvider: DataSourceProvider) => {
    setProvider(newProvider)
    setConfig((prev) => ({
      ...prev,
      port: getDefaultPort(newProvider),
    }))
  }

  const handleTestConnection = async () => {
    if (!config.host || !config.database || !config.username || !config.password) {
      setError('Please fill in all connection details')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setError(null)

    try {
      const testConfig = {
        ...config,
        port: parseInt(String(config.port)) || getDefaultPort(provider),
      }

      // For new connections, we need to save first before testing
      // For existing connections, we can test directly
      if (!dataSourceId) {
        // Save the connection first (as a draft)
        const saveResponse = await fetch('/api/reporting-studio/data-sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim() || `Test Connection ${Date.now()}`,
            description: description.trim() || undefined,
            type,
            provider,
            connectionConfig: testConfig,
          }),
        })

        if (!saveResponse.ok) {
          const error = await saveResponse.json()
          throw new Error(error.error || 'Failed to save connection for testing')
        }

        const savedData = await saveResponse.json()

        // Test the connection
        const testResponse = await fetch(`/api/reporting-studio/data-sources/${savedData.id}/test`, {
          method: 'POST',
        })

        const testData = await testResponse.json()

        setTestResult({
          success: testData.success,
          message: testData.message || (testData.success ? 'Connection successful' : 'Connection failed'),
        })

        // If test succeeded, we can keep it. If failed, delete the test connection
        if (!testData.success) {
          await fetch(`/api/reporting-studio/data-sources/${savedData.id}`, {
            method: 'DELETE',
          })
        } else {
          // Update the dataSourceId so user can edit this connection
          // Note: This requires the component to handle this case
          // For now, we'll just show success
        }
      } else {
        // Test existing connection
        const response = await fetch(`/api/reporting-studio/data-sources/${dataSourceId}/test`, {
          method: 'POST',
        })

        const data = await response.json()
        setTestResult({
          success: data.success,
          message: data.message || (data.success ? 'Connection successful' : 'Connection failed'),
        })
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Connection test failed',
      })
      setError(error.message || 'Failed to test connection')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for the connection')
      return
    }

    if (!config.host || !config.database || !config.username || !config.password) {
      setError('Please fill in all connection details')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const connectionConfig = {
        ...config,
        port: parseInt(String(config.port)) || getDefaultPort(provider),
      }

      const url = dataSourceId
        ? `/api/reporting-studio/data-sources/${dataSourceId}`
        : '/api/reporting-studio/data-sources'

      const method = dataSourceId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          provider,
          connectionConfig,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save connection')
      }

      if (onSuccess) {
        onSuccess()
      }

      resetForm()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Failed to save connection')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving && !isTesting) {
      resetForm()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {dataSourceId ? 'Edit Database Connection' : 'New Database Connection'}
          </DialogTitle>
          <DialogDescription>
            Connect to a database to use as a data source for reporting
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Connection Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Connection Name *</Label>
            <Input
              id="name"
              placeholder="Production Database"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Database Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">Database Type *</Label>
            <Select value={provider} onValueChange={(value) => handleProviderChange(value as DataSourceProvider)}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="POSTGRESQL">PostgreSQL</SelectItem>
                <SelectItem value="MYSQL">MySQL</SelectItem>
                <SelectItem value="SQLSERVER">SQL Server</SelectItem>
                <SelectItem value="MONGODB">MongoDB</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Connection Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Connection Details</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="host">Host *</Label>
                <Input
                  id="host"
                  placeholder="localhost or database.example.com"
                  value={config.host}
                  onChange={(e) => setConfig((prev) => ({ ...prev, host: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">Port *</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder={String(getDefaultPort(provider))}
                  value={config.port}
                  onChange={(e) => setConfig((prev) => ({ ...prev, port: parseInt(e.target.value) || getDefaultPort(provider) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="database">Database Name *</Label>
              <Input
                id="database"
                placeholder="myapp_production"
                value={config.database}
                onChange={(e) => setConfig((prev) => ({ ...prev, database: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input
                  id="username"
                  placeholder="database_user"
                  value={config.username}
                  onChange={(e) => setConfig((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={config.password}
                  onChange={(e) => setConfig((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ssl"
                checked={config.ssl || false}
                onChange={(e) => setConfig((prev) => ({ ...prev, ssl: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="ssl" className="font-normal cursor-pointer">
                Use SSL/TLS
              </Label>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting || isSaving}
            >
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>

            {testResult && (
              <div className={`flex items-center gap-2 ${testResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <span className="text-sm">{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving || isTesting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isTesting}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Connection'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


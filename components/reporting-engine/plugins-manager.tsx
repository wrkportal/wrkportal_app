'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Package, CheckCircle2, XCircle, Info } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Plugin {
  name: string
  version: string
  description?: string
  enabled?: boolean
  functions?: Array<{ name: string }>
}

export function PluginsManager() {
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInstallDialog, setShowInstallDialog] = useState(false)
  const [pluginJson, setPluginJson] = useState('')

  useEffect(() => {
    loadPlugins()
  }, [])

  const loadPlugins = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reporting-engine/plugins')
      if (!response.ok) throw new Error('Failed to load plugins')
      const data = await response.json()
      setPlugins(data.plugins || [])
      setError(null)
    } catch (err: any) {
      setError(err.message)
      console.error('Failed to load plugins:', err)
    } finally {
      setLoading(false)
    }
  }

  const togglePlugin = async (pluginName: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/reporting-engine/plugins/${pluginName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: enabled ? 'enable' : 'disable' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle plugin')
      }

      loadPlugins() // Reload list
    } catch (err: any) {
      alert(`Failed to toggle plugin: ${err.message}`)
      console.error('Failed to toggle plugin:', err)
    }
  }

  const handleInstallPlugin = async () => {
    try {
      let plugin
      try {
        plugin = JSON.parse(pluginJson)
      } catch (e) {
        throw new Error('Invalid JSON format')
      }

      const response = await fetch('/api/reporting-engine/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plugin)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Failed to install plugin')
      }

      setShowInstallDialog(false)
      setPluginJson('')
      loadPlugins()
      alert('Plugin installed successfully!')
    } catch (err: any) {
      alert(`Failed to install plugin: ${err.message}`)
    }
  }

  const handleUninstallPlugin = async (pluginName: string) => {
    if (!confirm(`Are you sure you want to uninstall "${pluginName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/reporting-engine/plugins/${pluginName}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to uninstall plugin')
      }

      loadPlugins()
      alert('Plugin uninstalled successfully!')
    } catch (err: any) {
      alert(`Failed to uninstall plugin: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading plugins...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Plugins</CardTitle>
              <CardDescription>
                Manage custom plugins and extensions
              </CardDescription>
            </div>
            <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Install Plugin
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Install Plugin</DialogTitle>
                  <DialogDescription>
                    Paste the plugin JSON definition below
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Plugin JSON</Label>
                    <Textarea
                      value={pluginJson}
                      onChange={(e) => setPluginJson(e.target.value)}
                      placeholder='{"name": "my-plugin", "version": "1.0.0", ...}'
                      rows={15}
                      className="font-mono text-sm"
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      See the example plugin at <code>plugins/example-financial-metrics/index.ts</code> for the format.
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInstallPlugin}>
                      Install Plugin
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {plugins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No plugins installed</p>
              <p className="text-sm mt-2">Install a plugin to extend functionality</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {plugins.map(plugin => (
                <Card key={plugin.name}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{plugin.name}</CardTitle>
                          <Badge variant="outline">v{plugin.version}</Badge>
                          {plugin.enabled ? (
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Enabled
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Disabled
                            </Badge>
                          )}
                        </div>
                        {plugin.description && (
                          <CardDescription>{plugin.description}</CardDescription>
                        )}
                        {plugin.functions && plugin.functions.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">
                              Functions: {plugin.functions.map(f => f.name).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Enabled</span>
                          <Switch
                            checked={plugin.enabled}
                            onCheckedChange={(checked) => togglePlugin(plugin.name, checked)}
                          />
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUninstallPlugin(plugin.name)}
                        >
                          Uninstall
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
















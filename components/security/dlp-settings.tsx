'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"

interface DLPConfig {
  enabled: boolean
  maxExportRows?: number
  requireApprovalForExports?: boolean
  blockSensitiveFields?: boolean
  allowedExportFormats?: string[]
  requireWatermark?: boolean
}

export function DLPSettings() {
  const [config, setConfig] = useState<DLPConfig>({
    enabled: false,
    maxExportRows: 10000,
    requireApprovalForExports: false,
    blockSensitiveFields: true,
    allowedExportFormats: ['csv', 'xlsx', 'pdf'],
    requireWatermark: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDLPConfig()
  }, [])

  const fetchDLPConfig = async () => {
    try {
      const response = await fetch('/api/security/dlp')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Error fetching DLP config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/security/dlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      if (response.ok) {
        // Show success message
      }
    } catch (error) {
      console.error('Error saving DLP config:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Loss Prevention (DLP)</CardTitle>
        <CardDescription>
          Prevent unauthorized data exports and protect sensitive information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Enable DLP</p>
            <p className="text-sm text-muted-foreground">
              Activate data loss prevention policies
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
          />
        </div>

        {config.enabled && (
          <>
            <div className="space-y-4">
              <div>
                <Label>Maximum Export Rows</Label>
                <Input
                  type="number"
                  value={config.maxExportRows || 10000}
                  onChange={(e) => setConfig({ ...config, maxExportRows: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum number of rows that can be exported in a single request
                </p>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Require Approval for Exports</p>
                  <p className="text-sm text-muted-foreground">
                    All exports require admin approval before execution
                  </p>
                </div>
                <Switch
                  checked={config.requireApprovalForExports || false}
                  onCheckedChange={(value) => setConfig({ ...config, requireApprovalForExports: value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Block Sensitive Fields</p>
                  <p className="text-sm text-muted-foreground">
                    Prevent export of sensitive fields (SSN, credit cards, etc.)
                  </p>
                </div>
                <Switch
                  checked={config.blockSensitiveFields !== false}
                  onCheckedChange={(value) => setConfig({ ...config, blockSensitiveFields: value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Require Watermark</p>
                  <p className="text-sm text-muted-foreground">
                    Add watermark to exported data for tracking
                  </p>
                </div>
                <Switch
                  checked={config.requireWatermark !== false}
                  onCheckedChange={(value) => setConfig({ ...config, requireWatermark: value })}
                />
              </div>

              <div>
                <Label>Allowed Export Formats</Label>
                <div className="flex gap-2 mt-2">
                  {['csv', 'xlsx', 'pdf', 'json'].map((format) => (
                    <Badge
                      key={format}
                      variant={config.allowedExportFormats?.includes(format) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const formats = config.allowedExportFormats || []
                        if (formats.includes(format)) {
                          setConfig({
                            ...config,
                            allowedExportFormats: formats.filter(f => f !== format)
                          })
                        } else {
                          setConfig({
                            ...config,
                            allowedExportFormats: [...formats, format]
                          })
                        }
                      }}
                    >
                      {format.toUpperCase()}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}


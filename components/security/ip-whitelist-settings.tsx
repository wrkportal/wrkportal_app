'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface IPWhitelistRule {
  id: string
  name: string
  ipAddress?: string
  ipRange?: string
  isActive: boolean
}

interface IPWhitelistData {
  enabled: boolean
  rules: IPWhitelistRule[]
  currentIP: string
  currentIPAllowed: boolean
}

export function IPWhitelistSettings() {
  const [data, setData] = useState<IPWhitelistData>({
    enabled: false,
    rules: [],
    currentIP: '0.0.0.0',
    currentIPAllowed: true
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newRule, setNewRule] = useState({
    name: '',
    ipAddress: '',
    ipRange: '',
    isActive: true
  })

  useEffect(() => {
    fetchIPWhitelist()
  }, [])

  const fetchIPWhitelist = async () => {
    try {
      const response = await fetch('/api/security/ip-whitelist')
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching IP whitelist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (enabled: boolean) => {
    try {
      const response = await fetch('/api/security/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', enabled })
      })
      if (response.ok) {
        setData(prev => ({ ...prev, enabled }))
      }
    } catch (error) {
      console.error('Error toggling IP whitelist:', error)
    }
  }

  const handleAddRule = async () => {
    if (!newRule.name || (!newRule.ipAddress && !newRule.ipRange)) {
      return
    }

    try {
      const response = await fetch('/api/security/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...newRule })
      })
      if (response.ok) {
        setNewRule({ name: '', ipAddress: '', ipRange: '', isActive: true })
        setDialogOpen(false)
        fetchIPWhitelist()
      }
    } catch (error) {
      console.error('Error adding rule:', error)
    }
  }

  const handleRemoveRule = async (ruleId: string) => {
    try {
      const response = await fetch('/api/security/ip-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', ruleId })
      })
      if (response.ok) {
        fetchIPWhitelist()
      }
    } catch (error) {
      console.error('Error removing rule:', error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Whitelisting</CardTitle>
        <CardDescription>
          Restrict access to your organization by IP address or IP range
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">IP Whitelisting</p>
            <p className="text-sm text-muted-foreground">
              {data.enabled 
                ? 'Only whitelisted IP addresses can access the system'
                : 'All IP addresses are allowed'}
            </p>
          </div>
          <Switch
            checked={data.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {data.enabled && (
          <>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-medium text-sm">Your Current IP</p>
                <Badge variant="outline">{data.currentIP}</Badge>
                {data.currentIPAllowed ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.currentIPAllowed 
                  ? 'This IP is whitelisted and can access the system'
                  : 'This IP is not whitelisted. Add it to continue accessing the system.'}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Whitelist Rules</Label>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add IP Whitelist Rule</DialogTitle>
                      <DialogDescription>
                        Add a single IP address or IP range (CIDR notation)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Rule Name</Label>
                        <Input
                          value={newRule.name}
                          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                          placeholder="e.g., Office Network"
                        />
                      </div>
                      <div>
                        <Label>IP Address (single)</Label>
                        <Input
                          value={newRule.ipAddress}
                          onChange={(e) => setNewRule({ ...newRule, ipAddress: e.target.value, ipRange: '' })}
                          placeholder="e.g., 192.168.1.100"
                        />
                      </div>
                      <div>
                        <Label>IP Range (CIDR)</Label>
                        <Input
                          value={newRule.ipRange}
                          onChange={(e) => setNewRule({ ...newRule, ipRange: e.target.value, ipAddress: '' })}
                          placeholder="e.g., 192.168.1.0/24"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddRule}>Add Rule</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {data.rules.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No rules configured. Add a rule to start restricting access.
                </p>
              ) : (
                <div className="space-y-2">
                  {data.rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {rule.ipAddress || rule.ipRange}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}


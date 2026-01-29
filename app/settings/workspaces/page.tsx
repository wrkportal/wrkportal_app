'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Building2, Check, Loader2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Tenant {
  id: string
  name: string
  domain?: string | null
  type?: string | null
  logo?: string | null
  isPrimary?: boolean
  isActive?: boolean
  role?: string
}

export default function WorkspacesPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/user/tenants')
      if (response.ok) {
        const data = await response.json()
        if (data.tenants && data.tenants.length > 0) {
          setTenants(data.tenants)
          setActiveTenantId(data.activeTenantId || null)
        }
      }
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const switchTenant = async (tenantId: string) => {
    if (tenantId === activeTenantId) return

    setSwitching(true)
    try {
      const response = await fetch('/api/user/tenants/switch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      })

      if (response.ok) {
        setActiveTenantId(tenantId)
        router.refresh()
        window.location.href = '/'
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to switch workspace')
      }
    } catch (error) {
      console.error('Error switching tenant:', error)
      alert('Failed to switch workspace')
    } finally {
      setSwitching(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Manage Workspaces
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Switch between workspaces you have access to
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Workspaces</CardTitle>
          <CardDescription>
            You have access to {tenants.length} workspace{tenants.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">No workspaces found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg transition-colors',
                    tenant.id === activeTenantId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {tenant.logo ? (
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={tenant.logo} alt={tenant.name} />
                        <AvatarFallback>
                          {tenant.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{tenant.name}</span>
                        {tenant.isPrimary && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            Primary
                          </span>
                        )}
                        {tenant.id === activeTenantId && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      {tenant.domain && (
                        <p className="text-sm text-muted-foreground truncate">
                          {tenant.domain}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant={tenant.id === activeTenantId ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => switchTenant(tenant.id)}
                    disabled={switching || tenant.id === activeTenantId}
                  >
                    {switching && tenant.id === activeTenantId ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Switching...
                      </>
                    ) : tenant.id === activeTenantId ? (
                      'Active'
                    ) : (
                      'Switch'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

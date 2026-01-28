'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

export function WorkspaceSwitcher() {
  const { data: session, update } = useSession()
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
        console.log('[WorkspaceSwitcher] Fetched tenants:', {
          count: data.tenants?.length || 0,
          tenants: data.tenants?.map((t: any) => ({ id: t.id, name: t.name })),
          activeTenantId: data.activeTenantId,
        })
        setTenants(data.tenants || [])
        setActiveTenantId(data.activeTenantId || session?.user?.tenantId || null)
      } else {
        console.error('[WorkspaceSwitcher] Failed to fetch tenants:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('[WorkspaceSwitcher] Error fetching tenants:', error)
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
        // Update session with new tenantId
        await update({
          tenantId,
        })

        setActiveTenantId(tenantId)
        
        // Reload page to refresh all tenant-scoped data
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

  const activeTenant = tenants.find((t) => t.id === activeTenantId) || tenants[0]

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    )
  }

  if (tenants.length === 0) {
    return null
  }

  // Always show workspace name, but only show dropdown if multiple tenants
  // This helps users understand which workspace they're in
  if (tenants.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">{activeTenant?.name || 'Workspace'}</span>
      </div>
    )
  }
  
  // If no tenants, don't show anything
  if (tenants.length === 0) {
    console.warn('[WorkspaceSwitcher] No tenants found for user')
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          disabled={switching}
        >
          {switching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
          <span className="truncate max-w-[150px]">
            {activeTenant?.name || 'Select Workspace'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {tenant.logo ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={tenant.logo} alt={tenant.name} />
                  <AvatarFallback>
                    {tenant.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate font-medium">{tenant.name}</span>
                {tenant.domain && (
                  <span className="text-xs text-muted-foreground truncate">
                    {tenant.domain}
                  </span>
                )}
              </div>
            </div>
            {tenant.id === activeTenantId && (
              <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-muted-foreground cursor-pointer"
          onClick={() => router.push('/settings/workspaces')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Manage Workspaces
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

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
  const [cachedTenantName, setCachedTenantName] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCachedTenantName(localStorage.getItem('lastTenantName'))
    }
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/user/tenants')
      if (response.ok) {
        const data = await response.json()
        console.log('[WorkspaceSwitcher] Fetched tenants:', {
          count: data.tenants?.length || 0,
          tenants: data.tenants?.map((t: any) => ({ id: t.id, name: t.name, isPrimary: t.isPrimary })),
          activeTenantId: data.activeTenantId,
          hasActiveTenantAccess: !!data.activeTenantAccess,
        })
        
        if (data.tenants && data.tenants.length > 0) {
          setTenants(data.tenants)
          const nextActiveTenantId = data.activeTenantId || session?.user?.tenantId || null
          setActiveTenantId(nextActiveTenantId)
          const activeTenantName =
            data.tenants.find((tenant: Tenant) => tenant.id === nextActiveTenantId)?.name ||
            data.tenants[0]?.name
          if (activeTenantName && typeof window !== 'undefined') {
            localStorage.setItem('lastTenantName', activeTenantName)
            setCachedTenantName(activeTenantName)
          }
        } else {
          console.warn('[WorkspaceSwitcher] No tenants returned from API')
          setTenants([])
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('[WorkspaceSwitcher] Failed to fetch tenants:', response.status, response.statusText, errorData)
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
  const displayTenantName = activeTenant?.name || cachedTenantName || 'Workspace'

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="truncate max-w-[150px] text-xs">{displayTenantName}</span>
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
      <div className="flex items-center gap-2 px-3 py-2">
        <Building2 className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{displayTenantName}</span>
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
          <span className="truncate max-w-[150px] text-xs">
            {displayTenantName || 'Select Workspace'}
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
                <span className="truncate font-medium text-xs">{tenant.name}</span>
                {tenant.domain && (
                  <span className="text-[10px] text-muted-foreground truncate">
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

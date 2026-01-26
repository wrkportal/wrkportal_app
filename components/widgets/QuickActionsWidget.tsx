'use client'

/**
 * QuickActionsWidget
 * 
 * Reusable widget for displaying quick action buttons across all dashboards.
 * Supports role-based visibility and dashboard-specific actions.
 * 
 * Features:
 * - Configurable action buttons
 * - Role-based visibility per action
 * - Permission-based access control
 * - Fullscreen support
 * - Accessible design
 * - Responsive grid layout
 */

import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Maximize, Minimize } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuickAction } from '@/types/widgets'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface QuickActionsWidgetProps {
  /** Array of quick actions to display */
  actions: QuickAction[]
  /** Widget ID for fullscreen functionality */
  widgetId?: string
  /** Whether widget is in fullscreen mode */
  fullscreen?: boolean
  /** Callback when fullscreen is toggled */
  onToggleFullscreen?: (widgetId: string) => void
  /** Custom title */
  title?: string
  /** Custom description */
  description?: string
  /** Grid columns (default: 3) */
  columns?: number
  /** Optional CSS class */
  className?: string
  /** Dashboard type for filtering actions */
  dashboardType?: string
}

export function QuickActionsWidget({
  actions,
  widgetId = 'quickActions',
  fullscreen = false,
  onToggleFullscreen,
  title = 'Quick Actions',
  description = 'Fast access to common tasks',
  columns = 3,
  className,
  dashboardType,
}: QuickActionsWidgetProps) {
  const user = useAuthStore((state) => state.user)
  const hasPermission = useAuthStore((state) => state.hasPermission)
  const router = useRouter()

  // Filter actions based on role and permissions
  const visibleActions = actions.filter((action) => {
    // Check dashboard type filter
    if (action.dashboardType && dashboardType) {
      if (!action.dashboardType.includes(dashboardType)) {
        return false
      }
    }

    // Check role requirements
    if (action.requiredRole && user) {
      const requiredRoles = Array.isArray(action.requiredRole)
        ? action.requiredRole
        : [action.requiredRole]
      
      if (!requiredRoles.includes(user.role)) {
        return false
      }
    }

    // Check permission requirements
    if (action.requiredPermission && user) {
      if (
        !hasPermission(
          action.requiredPermission.resource,
          action.requiredPermission.action
        )
      ) {
        return false
      }
    }

    return true
  })

  // Don't render if no visible actions
  if (visibleActions.length === 0) {
    return null
  }

  const handleActionClick = (action: QuickAction) => {
    if (action.onClick) {
      action.onClick()
    } else if (action.href) {
      if (!router) {
        console.error('[QuickActionsWidget] Router not available')
        return
      }
      router.push(action.href)
    }
  }

  return (
    <Card
      className={cn(
        "h-full flex flex-col overflow-hidden",
        fullscreen && "fixed inset-0 z-[9999] m-0 rounded-none",
        className
      )}
      style={
        fullscreen
          ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9999,
              margin: 0,
              borderRadius: 0,
            }
          : undefined
      }
    >
      <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs">{description}</CardDescription>
          </div>
          {onToggleFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFullscreen(widgetId)}
              title={fullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="h-7 w-7 p-0"
              aria-label={fullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
            >
              {fullscreen ? (
                <Minimize className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Maximize className="h-3 w-3" aria-hidden="true" />
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-4">
        <div
          className={`grid gap-2`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          role="list"
          aria-label="Quick actions"
        >
          {visibleActions.map((action) => {
            const Icon = action.icon
            const buttonContent = (
              <>
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-center">{action.label}</span>
                {action.description && (
                  <span className="text-xs text-muted-foreground text-center">
                    {action.description}
                  </span>
                )}
              </>
            )

            // Use Link component if href is provided, otherwise use Button
            if (action.href && !action.onClick) {
              return (
                <Link
                  key={action.id}
                  href={action.href}
                  className="h-auto flex-col gap-1.5 py-3 transition-all"
                >
                  <Button
                    variant={action.variant || 'outline'}
                    className="h-auto w-full flex-col gap-1.5 py-3"
                    asChild
                  >
                    <span>{buttonContent}</span>
                  </Button>
                </Link>
              )
            }

            return (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                className="h-auto flex-col gap-1.5 py-3 transition-all"
                onClick={() => handleActionClick(action)}
                aria-label={action.description || action.label}
              >
                {buttonContent}
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

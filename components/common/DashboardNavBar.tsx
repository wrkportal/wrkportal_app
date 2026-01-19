'use client'

/**
 * DashboardNavBar
 * 
 * Unified navigation bar component for all dashboards.
 * Replaces duplicate nav bar implementations across sales, operations, IT, finance, etc.
 * 
 * Features:
 * - Configurable navigation items
 * - Widget gallery integration
 * - Active state management
 * - Role-based access
 * - Accessible design
 */

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'
import type { Widget } from '@/types/widgets'

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Optional role restrictions */
  allowedRoles?: string[]
  /** Optional permission check */
  requiredPermission?: { resource: string; action: string }
  /** Optional dashboard type filter */
  dashboardType?: string[]
}

export interface DashboardNavBarProps {
  /** Navigation items to display */
  navItems: NavItem[]
  /** Base path for the dashboard (e.g., '/sales-dashboard') */
  basePath: string
  /** Widgets for the widget gallery */
  widgets?: Widget[]
  /** Callback to toggle widget visibility */
  toggleWidget?: (widgetId: string) => void
  /** Dashboard type for filtering */
  dashboardType?: string
  /** Optional CSS class */
  className?: string
}

export function DashboardNavBar({
  navItems,
  basePath,
  widgets,
  toggleWidget,
  dashboardType,
  className,
}: DashboardNavBarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

  // Filter nav items based on dashboard type
  const visibleNavItems = navItems.filter((item) => {
    if (item.dashboardType && dashboardType) {
      return item.dashboardType.includes(dashboardType)
    }
    return true
  })

  // Determine if a nav item is active
  const isNavItemActive = (item: NavItem): boolean => {
    if (item.href === basePath) {
      // Exact match for dashboard root
      return pathname === basePath
    }

    // Check for special cases (like sprints, development)
    if (item.href === `${basePath}/sprints`) {
      return pathname?.startsWith(`${basePath}/sprint`) || pathname === `${basePath}/sprints`
    }

    if (item.href === `${basePath}/development`) {
      return (
        pathname?.startsWith(`${basePath}/repository`) ||
        pathname?.startsWith(`${basePath}/pull-requests`) ||
        pathname?.startsWith(`${basePath}/deployments`) ||
        pathname === `${basePath}/development`
      )
    }

    // Default: check if pathname starts with href
    return pathname === item.href || pathname?.startsWith(item.href + '/')
  }

  return (
    <>
      <div
        className={cn(
          "border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0",
          className
        )}
        style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}
      >
        <div className="pr-4 lg:pr-8">
          <nav className="flex items-center gap-1 text-sm">
            {/* Navigation tabs */}
            {visibleNavItems.map((item) => {
              const isActive = isNavItemActive(item)
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors border-b-2 border-transparent",
                    isActive
                      ? "text-[#ff751f] border-[#ff751f] font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              )
            })}

            {/* Widget Gallery Button */}
            {widgets && toggleWidget && (
              <div className="ml-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 relative z-10"
                  onClick={() => setWidgetGalleryOpen(true)}
                  aria-label="Open widget gallery"
                >
                  <LayoutGrid className="h-4 w-4 mr-2" aria-hidden="true" />
                  <span className="hidden sm:inline">Widgets</span>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Widget Gallery Dialog */}
      {widgets && toggleWidget && (
        <WidgetGalleryDialog
          open={widgetGalleryOpen}
          onOpenChange={setWidgetGalleryOpen}
          widgets={widgets}
          toggleWidget={toggleWidget}
        />
      )}
    </>
  )
}

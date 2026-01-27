'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Wrench, Users, Warehouse, TrendingUp, Shield, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface OperationsNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function OperationsNavBar({ widgets, toggleWidget }: OperationsNavBarProps = {}) {
  const pathname = usePathname()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/operations-dashboard/dashboard", icon: LayoutGrid },
    { label: "Work Orders", href: "/operations-dashboard/work-orders", icon: Wrench },
    { label: "Resources", href: "/operations-dashboard/resources", icon: Users },
    { label: "Inventory", href: "/operations-dashboard/inventory", icon: Warehouse },
    { label: "Performance", href: "/operations-dashboard/performance", icon: TrendingUp },
    { label: "Compliance", href: "/operations-dashboard/compliance", icon: Shield },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0 h-12" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8 h-full">
        <nav className="flex items-center gap-1 text-sm h-full">
          {/* Title on the left - removed */}

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Each tab is only active when on its specific page
            // Dashboard tab should be active when on any functional tab (first time user)
            let isActive = false
            if (item.href === '/operations-dashboard/dashboard') {
              // Dashboard is active when on dashboard OR when on any other functional tab
              const isOnFunctionalTab = pathname.startsWith('/operations-dashboard/') && 
                                       pathname !== '/operations-dashboard/dashboard' &&
                                       pathname !== '/operations-dashboard'
              isActive = pathname === '/operations-dashboard/dashboard' || 
                        pathname === '/operations-dashboard' ||
                        pathname === '/operations-dashboard/' ||
                        isOnFunctionalTab
            } else if (item.href === '/operations-dashboard') {
              isActive = pathname === '/operations-dashboard'
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            }
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 h-full whitespace-nowrap transition-colors border-b-2 border-transparent",
                  isActive
                    ? "text-[#ff751f] border-[#ff751f] font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}

          {/* Widget Gallery Button */}
          <div className="ml-auto">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-3 relative z-10"
              onClick={() => {
                if (widgets && toggleWidget) {
                  setWidgetGalleryOpen(true)
                }
              }}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Widgets</span>
            </Button>
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
        </nav>
      </div>
    </div>
  )
}


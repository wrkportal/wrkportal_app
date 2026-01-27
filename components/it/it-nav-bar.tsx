'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Ticket, Package, FileText, Activity, LayoutGrid, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface ITNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function ITNavBar({ widgets, toggleWidget }: ITNavBarProps = {}) {
  const pathname = usePathname()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/it-dashboard/dashboard", icon: LayoutGrid },
    { label: "Tickets", href: "/it-dashboard/tickets", icon: Ticket },
    { label: "Assets", href: "/it-dashboard/assets", icon: Package },
    { label: "Access Control", href: "/it-dashboard/access-control", icon: Shield },
    { label: "Monitoring", href: "/it-dashboard/monitoring", icon: Activity },
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
            if (item.href === '/it-dashboard') {
              // Dashboard is active when on dashboard OR when on any other functional tab
              const isOnFunctionalTab = pathname.startsWith('/it-dashboard/') && 
                                       pathname !== '/it-dashboard'
              isActive = pathname === '/it-dashboard' ||
                        pathname === '/it-dashboard/' ||
                        isOnFunctionalTab
            } else {
              isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
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


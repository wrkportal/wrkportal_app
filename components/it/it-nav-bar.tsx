'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Ticket, Package, Briefcase, Calendar, Code, FileText, Activity, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/finance/widget-gallery-dialog'

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
    { label: "Dashboard", href: "/it-dashboard", icon: LayoutDashboard },
    { label: "Tickets", href: "/it-dashboard/tickets", icon: Ticket },
    { label: "Assets", href: "/it-dashboard/assets", icon: Package },
    { label: "Projects", href: "/it-dashboard/projects", icon: Briefcase },
    { label: "Sprints", href: "/it-dashboard/sprints", icon: Calendar },
    { label: "Development", href: "/it-dashboard/development", icon: Code },
    { label: "Documentation", href: "/it-dashboard/documentation", icon: FileText },
    { label: "Monitoring", href: "/it-dashboard/monitoring", icon: Activity },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8">
        <nav className="flex items-center gap-1 text-sm">
          {/* Title on the left */}
          <div className="flex items-center gap-2 pl-4 pr-4 py-3 mr-4">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">IT Services</span>
          </div>

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Dashboard tab should be active when on /it-dashboard or any /it-dashboard/ page
            let isActive = false
            if (item.href === '/it-dashboard') {
              isActive = pathname === '/it-dashboard' || pathname.startsWith('/it-dashboard/')
            } else if (item.href === '/it-dashboard/sprints') {
              isActive = pathname?.startsWith('/it-dashboard/sprint') || pathname === '/it-dashboard/sprints'
            } else if (item.href === '/it-dashboard/development') {
              isActive = pathname?.startsWith('/it-dashboard/repository') || pathname?.startsWith('/it-dashboard/pull-requests') || pathname?.startsWith('/it-dashboard/deployments') || pathname === '/it-dashboard/development'
            } else {
              isActive = item.href === pathname
            }
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors border-b-2 border-transparent",
                  isActive
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 font-medium"
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


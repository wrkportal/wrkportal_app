'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, UserPlus, Target, Building2, Users, Calendar, FileText, ShoppingCart, TrendingUp, Plug, LayoutGrid } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/finance/widget-gallery-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface SalesNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function SalesNavBar({ widgets, toggleWidget }: SalesNavBarProps = {}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab')
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/sales-dashboard", icon: LayoutDashboard },
    { label: "Leads", href: "/sales-dashboard/leads", icon: UserPlus },
    { label: "Opportunities", href: "/sales-dashboard/opportunities", icon: Target },
    { label: "Accounts", href: "/sales-dashboard/accounts", icon: Building2 },
    { label: "Contacts", href: "/sales-dashboard/contacts", icon: Users },
    { label: "Activities", href: "/sales-dashboard/activities", icon: Calendar },
    { label: "Quotes", href: "/sales-dashboard/quotes", icon: FileText },
    { label: "Orders", href: "/sales-dashboard/orders", icon: ShoppingCart },
    { label: "Forecast", href: "/sales-dashboard/forecast", icon: TrendingUp },
    { label: "Integrations", href: "/sales-dashboard/integrations", icon: Plug },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8">
        <nav className="flex items-center gap-1 text-sm">
          {/* Title on the left */}
          <div className="flex items-center gap-2 pl-4 pr-4 py-3 mr-4">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Sales</span>
          </div>

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Dashboard tab should be active when on /sales-dashboard or any /sales-dashboard/ page
            let isActive = false
            if (item.href === '/sales-dashboard') {
              isActive = pathname === '/sales-dashboard' || pathname.startsWith('/sales-dashboard/')
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


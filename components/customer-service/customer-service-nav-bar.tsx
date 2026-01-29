'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutGrid, Ticket, FolderOpen, Phone, Clock, BookOpen, LayoutDashboard, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'
import { FunctionalHelpDialog } from '@/components/help/functional-help-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface CustomerServiceNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function CustomerServiceNavBar({ widgets, toggleWidget }: CustomerServiceNavBarProps = {}) {
  const pathname = usePathname()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/customer-service-dashboard", icon: LayoutGrid },
    { label: "Tickets", href: "/customer-service-dashboard/tickets", icon: Ticket },
    { label: "Cases", href: "/customer-service-dashboard/cases", icon: FolderOpen },
    { label: "Contact Center", href: "/customer-service-dashboard/contact-center", icon: Phone },
    { label: "SLAs", href: "/customer-service-dashboard/slas", icon: Clock },
    { label: "Knowledge Base", href: "/customer-service-dashboard/knowledge-base", icon: BookOpen },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8">
        <nav className="flex items-center gap-1 text-sm">
          {/* Title on the left - removed */}

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Each tab is only active when on its specific page
            let isActive = false
            if (item.href === '/customer-service-dashboard') {
              isActive = pathname === '/customer-service-dashboard' || pathname === '/customer-service-dashboard/'
            } else {
              isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            }
            const Icon = item.icon

            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-colors border-b-2 border-transparent",
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

          {/* Widget Gallery Button & Help Button */}
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-3 relative z-10"
              onClick={() => setHelpDialogOpen(true)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Help</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 px-3 relative z-10"
              onClick={() => {
                setWidgetGalleryOpen(true)
              }}
              disabled={!widgets || !toggleWidget}
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

          {/* Help Dialog */}
          <FunctionalHelpDialog
            open={helpDialogOpen}
            onOpenChange={setHelpDialogOpen}
            area="customer-service"
          />
        </nav>
      </div>
    </div>
  )
}

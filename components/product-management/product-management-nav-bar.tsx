'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Map as MapIcon, Users, ClipboardList, Briefcase, Package, Calendar, GitBranch, LayoutGrid, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'
import { FunctionalHelpDialog } from '@/components/help/functional-help-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface ProductManagementNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function ProductManagementNavBar({ widgets, toggleWidget }: ProductManagementNavBarProps = {}) {
  const pathname = usePathname()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/product-management/dashboard", icon: LayoutGrid },
    { label: "Roadmap", href: "/roadmap", icon: MapIcon },
    { label: "Projects", href: "/projects", icon: Briefcase },
    { label: "Releases", href: "/releases", icon: Package },
    { label: "Sprints", href: "/sprints", icon: Calendar },
    { label: "Backlog", href: "/backlog", icon: ClipboardList },
    { label: "Dependencies", href: "/dependencies", icon: GitBranch },
    { label: "Teams", href: "/teams", icon: Users },
  ]

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 shadow-lg -mx-0 h-10" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8 h-full">
        <nav className="flex items-center gap-1 text-sm h-full">
          {/* Title on the left - removed */}

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Each tab is only active when on its specific page
            // Dashboard tab should be active when on any functional tab (like developer section)
            let isActive = false
            if (item.href === '/product-management/dashboard') {
              // Dashboard is active when on dashboard OR when on any other functional tab (first time user)
              // Check if we're on a functional tab (not dashboard itself)
              const isOnFunctionalTab = pathname.startsWith('/product-management/') && 
                                       pathname !== '/product-management/dashboard' &&
                                       pathname !== '/product-management'
              isActive = pathname === '/product-management/dashboard' || 
                        pathname === '/product-management' ||
                        pathname === '/product-management/' ||
                        isOnFunctionalTab
            } else if (item.href === '/product-management') {
              isActive = pathname === '/product-management'
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

          {/* Widget Gallery Button & Help Button */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={() => setHelpDialogOpen(true)}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Help</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
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
            area="product-management"
          />
        </nav>
      </div>
    </div>
  )
}


'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutGrid, Code, Calendar, GitBranch, GitPullRequest, Rocket, FileText, LayoutDashboard, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'
import { FunctionalHelpDialog } from '@/components/help/functional-help-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface DeveloperNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function DeveloperNavBar({ widgets, toggleWidget }: DeveloperNavBarProps = {}) {
  const pathname = usePathname()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  const [helpDialogOpen, setHelpDialogOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/developer-dashboard", icon: LayoutGrid },
    { label: "Development", href: "/developer-dashboard/development", icon: Code },
    { label: "Sprints", href: "/developer-dashboard/sprints", icon: Calendar },
    { label: "Repository", href: "/developer-dashboard/repository", icon: GitBranch },
    { label: "Pull Requests", href: "/developer-dashboard/pull-requests", icon: GitPullRequest },
    { label: "Deployments", href: "/developer-dashboard/deployments", icon: Rocket },
    { label: "Documentation", href: "/developer-dashboard/documentation", icon: FileText },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0 h-10" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8 h-full">
        <nav className="flex items-center gap-1 text-sm h-full">
          {/* Title on the left - removed */}

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Each tab is only active when on its specific page
            let isActive = false
            if (item.href === '/developer-dashboard') {
              isActive = pathname === '/developer-dashboard' || pathname === '/developer-dashboard/'
            } else if (item.href === '/developer-dashboard/sprints') {
              isActive = pathname?.startsWith('/developer-dashboard/sprint') || pathname === '/developer-dashboard/sprints'
            } else if (item.href === '/developer-dashboard/development') {
              isActive = pathname?.startsWith('/developer-dashboard/repository') || pathname?.startsWith('/developer-dashboard/pull-requests') || pathname?.startsWith('/developer-dashboard/deployments') || pathname === '/developer-dashboard/development'
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
            area="developer"
          />
        </nav>
      </div>
    </div>
  )
}

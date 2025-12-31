'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, BarChart3, Map as MapIcon, TrendingUp, AlertTriangle, Users, ClipboardList, Network, Palette, Link as LinkIcon, Briefcase, CheckCircle2, Target, UserCheck, LayoutDashboard, Package, Calendar, GitBranch, LayoutGrid } from 'lucide-react'
import { WidgetGalleryDialog } from '@/components/finance/widget-gallery-dialog'

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
  const router = useRouter()
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)

  const navItems = [
    { label: "Dashboard", href: "/product-management", icon: LayoutDashboard },
    { label: "Roadmap", href: "/roadmap", icon: MapIcon },
    { label: "Projects", href: "/projects", icon: Briefcase },
    { label: "Releases", href: "/releases", icon: Package },
    { label: "Sprints", href: "/sprints", icon: Calendar },
    { label: "Backlog", href: "/backlog", icon: ClipboardList },
    { label: "Dependencies", href: "/dependencies", icon: GitBranch },
    { label: "Teams", href: "/teams", icon: Users },
  ]

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/80 sticky top-16 z-40 shadow-lg -mx-0" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8">
        <nav className="flex items-center gap-1 text-sm">
          {/* Title on the left */}
          <div className="flex items-center gap-2 pl-4 pr-4 py-3 mr-4">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Projects</span>
          </div>

          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Dashboard tab should be active when on /product-management or any /product-management/ page
            let isActive = false
            if (item.href === '/product-management') {
              isActive = pathname === '/product-management' || pathname.startsWith('/product-management/')
            } else {
              isActive = pathname === item.href || pathname.startsWith(item.href + '/')
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

          {/* Right side actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button
              onClick={() => router.push('/backlog')}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600 shrink-0 h-8"
            >
              + New Requirement
            </Button>

            {/* Widget Gallery Button */}
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

            {/* Widget Visibility Dropdown */}
            {widgets && toggleWidget && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">Widget Visibility</div>
                  <DropdownMenuSeparator />
                  {widgets.map((widget) => (
                    <DropdownMenuCheckboxItem
                      key={widget.id}
                      checked={widget.visible}
                      onCheckedChange={() => toggleWidget(widget.id)}
                    >
                      <div className="flex items-center gap-2">
                        {widget.type === 'stats' && (
                          <>
                            <BarChart3 className="h-4 w-4" />
                            <span>Stats</span>
                          </>
                        )}
                        {widget.type === 'roadmap' && (
                          <>
                            <MapIcon className="h-4 w-4" />
                            <span>Roadmap Items</span>
                          </>
                        )}
                        {widget.type === 'metrics' && (
                          <>
                            <TrendingUp className="h-4 w-4" />
                            <span>Key Delivery Metrics</span>
                          </>
                        )}
                        {widget.type === 'blockers' && (
                          <>
                            <AlertTriangle className="h-4 w-4" />
                            <span>Top Blockers</span>
                          </>
                        )}
                        {widget.type === 'teamCapacity' && (
                          <>
                            <Users className="h-4 w-4" />
                            <span>Team Capacity & Load</span>
                          </>
                        )}
                        {widget.type === 'recentProjects' && (
                          <>
                            <Briefcase className="h-4 w-4" />
                            <span>Recent Projects</span>
                          </>
                        )}
                        {widget.type === 'myTasks' && (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            <span>My Tasks</span>
                          </>
                        )}
                        {widget.type === 'assignedToOthers' && (
                          <>
                            <UserCheck className="h-4 w-4" />
                            <span>Assigned to Others</span>
                          </>
                        )}
                        {widget.type === 'activeOKRs' && (
                          <>
                            <Target className="h-4 w-4" />
                            <span>Active OKRs</span>
                          </>
                        )}
                        {widget.type === 'usefulLinks' && (
                          <>
                            <LinkIcon className="h-4 w-4" />
                            <span>Useful Links</span>
                          </>
                        )}
                        {widget.type === 'forms' && (
                          <>
                            <ClipboardList className="h-4 w-4" />
                            <span>Forms</span>
                          </>
                        )}
                        {widget.type === 'mindMap' && (
                          <>
                            <Network className="h-4 w-4" />
                            <span>Mind Map</span>
                          </>
                        )}
                        {widget.type === 'canvas' && (
                          <>
                            <Palette className="h-4 w-4" />
                            <span>Canvas</span>
                          </>
                        )}
                        {widget.type === 'ganttChart' && (
                          <>
                            <BarChart3 className="h-4 w-4" />
                            <span>Gantt Chart</span>
                          </>
                        )}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
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


'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, UserPlus, Target, FileText, ShoppingCart, TrendingUp, LayoutGrid, BarChart3, Zap, GitBranch } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface SalesNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

// Default sales widgets when not provided by the page
// These match the widget types defined in the widget gallery metadata
const defaultSalesWidgets: Widget[] = [
  // Sales Metrics
  { id: 'metric-totalSales', type: 'metric-totalSales', visible: false },
  { id: 'metric-winRate', type: 'metric-winRate', visible: false },
  { id: 'metric-closeRate', type: 'metric-closeRate', visible: false },
  { id: 'metric-avgDaysToClose', type: 'metric-avgDaysToClose', visible: false },
  { id: 'metric-pipelineValue', type: 'metric-pipelineValue', visible: false },
  { id: 'metric-openDeals', type: 'metric-openDeals', visible: false },
  { id: 'metric-weightedValue', type: 'metric-weightedValue', visible: false },
  { id: 'metric-avgOpenDealAge', type: 'metric-avgOpenDealAge', visible: false },
  // Sales Charts
  { id: 'chart-wonDeals', type: 'chart-wonDeals', visible: false },
  { id: 'chart-projection', type: 'chart-projection', visible: false },
  { id: 'chart-pipeline', type: 'chart-pipeline', visible: false },
  { id: 'chart-lossReasons', type: 'chart-lossReasons', visible: false },
  // Analytics Widgets
  { id: 'forecast', type: 'forecast', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
  // Finance Widgets
  { id: 'invoices', type: 'invoices', visible: false },
  { id: 'expenses', type: 'expenses', visible: false },
  // Sales Tools
  { id: 'filters', type: 'filters', visible: false },
  { id: 'schedule', type: 'schedule', visible: false },
  { id: 'help', type: 'help', visible: false },
  // General Widgets
  { id: 'stats', type: 'stats', visible: false },
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'assignedToOthers', type: 'assignedToOthers', visible: false },
  { id: 'activeOKRs', type: 'activeOKRs', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'forms', type: 'forms', visible: false },
  // Planning Widgets
  { id: 'roadmap', type: 'roadmap', visible: false },
  { id: 'ganttChart', type: 'ganttChart', visible: false },
  // Issues Widgets
  { id: 'blockers', type: 'blockers', visible: false },
  // Resources Widgets
  { id: 'teamCapacity', type: 'teamCapacity', visible: false },
  // Projects Widgets
  { id: 'recentProjects', type: 'recentProjects', visible: false },
  // Tools Widgets
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
]

export function SalesNavBar({ widgets, toggleWidget }: SalesNavBarProps = {}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab')
  const [widgetGalleryOpen, setWidgetGalleryOpen] = useState(false)
  
  // Use provided widgets or default sales widgets
  const displayWidgets = widgets && widgets.length > 0 ? widgets : defaultSalesWidgets
  const displayToggleWidget = toggleWidget || (() => {
    // Default toggle that saves to localStorage if no toggle function provided
    console.log('Toggle widget (no-op)')
  })

  const navItems = [
    { label: "Dashboard", href: "/sales-dashboard/dashboard", icon: LayoutGrid },
    { label: "Leads", href: "/sales-dashboard/leads", icon: UserPlus },
    { label: "Opportunities", href: "/sales-dashboard/opportunities", icon: Target },
    { label: "Quotes", href: "/sales-dashboard/quotes", icon: FileText },
    { label: "Orders", href: "/sales-dashboard/orders", icon: ShoppingCart },
    { label: "Invoices", href: "/sales-dashboard/invoices", icon: FileText },
    { label: "Forecast", href: "/sales-dashboard/forecast", icon: TrendingUp },
    { label: "Analytics", href: "/sales-dashboard/analytics", icon: BarChart3 },
    { label: "Reports", href: "/sales-dashboard/reports", icon: FileText },
    { label: "Attribution", href: "/sales-dashboard/attribution", icon: TrendingUp },
    { label: "Automation", href: "/sales-dashboard/automation", icon: Zap },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0 h-12" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className="pr-4 lg:pr-8 h-full">
        <nav className="flex items-center gap-1 text-sm h-full">
          {/* Navigation tabs */}
          {navItems.map((item) => {
            // Dashboard tab should only be active when exactly on /sales-dashboard
            // Other tabs should be active when pathname starts with their href (to handle detail pages)
            let isActive = false
            if (item.href === '/sales-dashboard') {
              isActive = pathname === '/sales-dashboard'
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
                setWidgetGalleryOpen(true)
              }}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Widgets</span>
            </Button>
          </div>

          {/* Widget Gallery Dialog */}
          <WidgetGalleryDialog
            open={widgetGalleryOpen}
            onOpenChange={setWidgetGalleryOpen}
            widgets={displayWidgets}
            toggleWidget={displayToggleWidget}
          />
        </nav>
      </div>
    </div>
  )
}


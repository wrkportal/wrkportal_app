'use client'

import { useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { LayoutDashboard, DollarSign, TrendingUp, FileText, TrendingDown, Target, CreditCard, Building2, ChevronDown, LayoutGrid, BarChart3, AlertTriangle, Users, Briefcase, CheckCircle2, UserCheck, Link as LinkIcon, ClipboardList, Network, Palette, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WidgetGalleryDialog } from '@/components/common/widget-gallery-dialog'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface FinanceNavBarProps {
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
  widgetGalleryOpen?: boolean
  onWidgetGalleryOpenChange?: (open: boolean) => void
}

export function FinanceNavBar({ widgets, toggleWidget, widgetGalleryOpen: externalWidgetGalleryOpen, onWidgetGalleryOpenChange }: FinanceNavBarProps = {}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams?.get('tab') // Used for home button active state
  const [internalWidgetGalleryOpen, setInternalWidgetGalleryOpen] = useState(false)
  const widgetGalleryOpen = externalWidgetGalleryOpen !== undefined ? externalWidgetGalleryOpen : internalWidgetGalleryOpen
  const setWidgetGalleryOpen = onWidgetGalleryOpenChange || setInternalWidgetGalleryOpen
  const isWrkboard = pathname === '/wrkboard'

  const navItems = [
    { label: "Dashboard", href: "/finance-dashboard/dashboard", icon: LayoutGrid, hasDropdown: false },
    { label: "Budgets", href: "/workflows/finance/budgets", icon: DollarSign, hasDropdown: false },
    { label: "Forecasting", href: "/workflows/finance/forecasting", icon: TrendingUp, hasDropdown: false },
    { label: "Revenue", href: "/workflows/finance/revenue", icon: TrendingUp, hasDropdown: false },
    { label: "Expenses", href: "/workflows/finance/expenses", icon: TrendingDown, hasDropdown: false },
    { label: "Profitability", href: "/workflows/finance/profitability", icon: Target, hasDropdown: false },
    { label: "Rate Cards", href: "/workflows/finance/rate-cards", icon: CreditCard, hasDropdown: false },
    { label: "Vendors", href: "/workflows/finance/invoices", icon: Building2, hasDropdown: false },
  ]

  return (
    <div className="border-b border-border bg-background sticky top-16 z-20 shadow-lg -mx-0" style={{ width: 'calc(100% + 0px)', marginLeft: 0, marginRight: 0, left: 0 }}>
      <div className={`pr-4 lg:pr-8 ${isWrkboard ? 'py-1' : ''}`}>
        <nav className="flex items-center gap-1 text-sm">
          {/* Title on the left - removed */}

          {/* Navigation tabs - hidden on wrkboard */}
          {!isWrkboard && navItems.map((item) => {
            // Each tab is only active when on its specific page
            const isActive = item.href === pathname
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
                {item.hasDropdown && (
                  <ChevronDown className="h-3 w-3 ml-1" />
                )}
              </Link>
            )
          })}

          {/* Widget Gallery Button */}
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3"
              onClick={() => setWidgetGalleryOpen(true)}
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
        </nav>
      </div>
    </div>
  )
}


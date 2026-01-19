# Migration Example: Sales Dashboard

This document shows a complete example of migrating the sales dashboard to use all the new optimized components.

## Before Migration

**File:** `app/sales-dashboard/page.tsx`
- ~4,344 lines of code
- Duplicate widget implementations
- Duplicate state management
- Duplicate filtering logic
- Custom nav bar implementation

## After Migration

**File:** `app/sales-dashboard/page.tsx`
- ~800-1,000 lines of code (70% reduction)
- Reusable components
- Centralized hooks
- Unified architecture

## Complete Migration Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

// New optimized components
import { DashboardNavBar } from '@/components/common/DashboardNavBar'
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'
import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'

// New hooks
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { useFullscreenWidget } from '@/hooks/useFullscreenWidget'

// Widget registry (optional, for dynamic rendering)
import { renderWidget } from '@/lib/widgets/registry'

// Types
import type { Widget } from '@/types/widgets'
import type { Layouts } from 'react-grid-layout'

// Icons
import {
  LayoutDashboard,
  UserPlus,
  Target,
  FileText,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  Zap,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
} from 'lucide-react'

// Default widgets configuration
const defaultWidgets: Widget[] = [
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'myTasks', type: 'myTasks', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  // Add more widgets as needed
]

// Default layouts
const defaultLayouts: Layouts = {
  lg: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'myTasks', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'usefulLinks', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'quickActions', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 4 },
    { i: 'myTasks', x: 5, y: 0, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'usefulLinks', x: 0, y: 8, w: 10, h: 4, minW: 3, minH: 4 },
  ],
  sm: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 4, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'usefulLinks', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 4 },
  ],
}

// Navigation items
const salesNavItems = [
  { label: "Pinboard", href: "/sales-dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/sales-dashboard/leads", icon: UserPlus },
  { label: "Opportunities", href: "/sales-dashboard/opportunities", icon: Target },
  { label: "Quotes", href: "/sales-dashboard/quotes", icon: FileText },
  { label: "Orders", href: "/sales-dashboard/orders", icon: ShoppingCart },
  { label: "Invoices", href: "/sales-dashboard/invoices", icon: FileText },
  { label: "Forecast", href: "/sales-dashboard/forecast", icon: TrendingUp },
  { label: "Analytics", href: "/sales-dashboard/analytics", icon: BarChart3 },
  { label: "Pinboards", href: "/sales-dashboard/dashboards", icon: LayoutDashboard },
  { label: "Reports", href: "/sales-dashboard/reports", icon: FileText },
  { label: "Attribution", href: "/sales-dashboard/attribution", icon: TrendingUp },
  { label: "Automation", href: "/sales-dashboard/automation", icon: Zap },
]

// Quick actions configuration
const salesQuickActions = [
  {
    id: 'new-lead',
    label: 'New Lead',
    icon: UserPlus,
    href: '/sales-dashboard/leads?create=true',
  },
  {
    id: 'new-deal',
    label: 'New Deal',
    icon: Target,
    href: '/sales-dashboard/opportunities?create=true',
  },
  {
    id: 'new-contact',
    label: 'New Contact',
    icon: Users,
    href: '/sales-dashboard/contacts?create=true',
  },
  {
    id: 'new-account',
    label: 'New Account',
    icon: Building2,
    href: '/sales-dashboard/accounts?create=true',
  },
  {
    id: 'log-activity',
    label: 'Log Activity',
    icon: Calendar,
    href: '/sales-dashboard/activities?create=true',
  },
  {
    id: 'new-task',
    label: 'New Task',
    icon: CheckCircle2,
    onClick: () => {
      // Will be handled by MyTasksWidget
    },
  },
]

export default function SalesDashboardPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [userTasks, setUserTasks] = useState<any[]>([])

  // Use new hooks for state management
  const {
    widgets,
    layouts,
    toggleWidget,
    setLayouts,
    isMobile,
  } = useDashboardLayout(defaultWidgets, defaultLayouts, {
    layoutStorageKey: 'sales-dashboard-layouts',
  })

  const { fullscreenWidget, toggleFullscreen } = useFullscreenWidget()

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('/api/tasks?assigneeId=' + user?.id)
        if (response.ok) {
          const data = await response.json()
          setUserTasks(data.tasks || [])
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchTasks()
    }
  }, [user?.id])

  // Handle layout changes
  const handleLayoutChange = (layouts: Layouts, allLayouts: any[]) => {
    setLayouts(layouts)
  }

  // Render widget based on type
  const renderWidget = (widgetId: string) => {
    const widget = widgets.find((w) => w.id === widgetId)
    if (!widget || !widget.visible) return null

    switch (widget.type) {
      case 'quickActions':
        return (
          <QuickActionsWidget
            actions={salesQuickActions}
            widgetId="quickActions"
            fullscreen={fullscreenWidget === 'quickActions'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="sales"
            columns={3}
          />
        )

      case 'myTasks':
        return (
          <MyTasksWidget
            tasks={userTasks}
            widgetId="myTasks"
            fullscreen={fullscreenWidget === 'myTasks'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="sales"
            basePath="/sales-dashboard"
            showTimer={true}
            showCreateButton={true}
          />
        )

      case 'usefulLinks':
        return (
          <UsefulLinksWidget
            storageKey="sales-useful-links"
            widgetId="usefulLinks"
            fullscreen={fullscreenWidget === 'usefulLinks'}
            onToggleFullscreen={toggleFullscreen}
          />
        )

      // You can also use the widget registry for dynamic rendering:
      // return renderWidget(widget.type, { ...props })

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Unified Navigation Bar */}
      <DashboardNavBar
        navItems={salesNavItems}
        basePath="/sales-dashboard"
        widgets={widgets}
        toggleWidget={toggleWidget}
        dashboardType="sales"
      />

      {/* Dashboard Content */}
      <div className="p-4 lg:p-8">
        <ResponsiveGridLayout
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          className="layout"
        >
          {widgets
            .filter((w) => w.visible)
            .map((widget) => (
              <div key={widget.id} data-grid={{ i: widget.id }}>
                {renderWidget(widget.id)}
              </div>
            ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}
```

## Key Changes

### 1. State Management
**Before:**
```tsx
const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)
// ... 50+ more lines of state management
```

**After:**
```tsx
const { widgets, layouts, toggleWidget, setLayouts } = useDashboardLayout(
  defaultWidgets,
  defaultLayouts,
  { layoutStorageKey: 'sales-dashboard-layouts' }
)
const { fullscreenWidget, toggleFullscreen } = useFullscreenWidget()
```

### 2. Navigation Bar
**Before:**
```tsx
// 100+ lines of custom nav bar implementation
```

**After:**
```tsx
<DashboardNavBar
  navItems={salesNavItems}
  basePath="/sales-dashboard"
  widgets={widgets}
  toggleWidget={toggleWidget}
  dashboardType="sales"
/>
```

### 3. Widget Rendering
**Before:**
```tsx
// 300+ lines for MyTasks widget
const renderMyTasksWidget = () => { /* ... */ }

// 100+ lines for QuickActions widget
const renderQuickActionsWidget = () => { /* ... */ }

// 150+ lines for UsefulLinks widget
const renderUsefulLinksWidget = () => { /* ... */ }
```

**After:**
```tsx
case 'myTasks':
  return <MyTasksWidget tasks={userTasks} {...props} />

case 'quickActions':
  return <QuickActionsWidget actions={salesQuickActions} {...props} />

case 'usefulLinks':
  return <UsefulLinksWidget storageKey="sales-useful-links" {...props} />
```

### 4. Grid Layout
**Before:**
```tsx
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
const ResponsiveGridLayout = WidthProvider(Responsive)
```

**After:**
```tsx
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'
```

## Benefits

1. **Code Reduction:** ~3,000+ lines removed
2. **Maintainability:** Single source of truth
3. **Consistency:** Same UI/UX as other dashboards
4. **Type Safety:** Shared types prevent errors
5. **Performance:** Dynamic imports reduce bundle size
6. **Accessibility:** Built-in ARIA labels

## Testing Checklist

- [ ] Navigation works correctly
- [ ] Active states are correct
- [ ] Widgets render properly
- [ ] Fullscreen mode works
- [ ] Layout persistence works
- [ ] Mobile responsiveness
- [ ] Role-based access
- [ ] Task filtering
- [ ] Timer functionality
- [ ] Widget gallery

## Rollback Plan

If issues occur:
1. Keep old implementation alongside new one
2. Use feature flag to switch
3. Gradually migrate widgets one at a time
4. Revert specific commits if needed

---

**Status:** Ready for Migration
**Estimated Time:** 2-4 hours
**Risk Level:** Low (can be done incrementally)

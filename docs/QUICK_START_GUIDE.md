# Quick Start Guide - Using Optimized Components

This guide shows you how to quickly start using the new optimized components in your dashboards.

## 1. Import the Components

```tsx
// Common components
import { DashboardNavBar } from '@/components/common/DashboardNavBar'
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'

// Widgets
import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'

// Hooks
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { useFullscreenWidget } from '@/hooks/useFullscreenWidget'
import { useTaskFilters } from '@/hooks/useTaskFilters'

// Types
import type { Widget } from '@/types/widgets'
```

## 2. Set Up Navigation

```tsx
const navItems = [
  { label: "Dashboard", href: "/your-dashboard", icon: LayoutDashboard },
  { label: "Section 1", href: "/your-dashboard/section1", icon: Icon1 },
  { label: "Section 2", href: "/your-dashboard/section2", icon: Icon2 },
]

<DashboardNavBar
  navItems={navItems}
  basePath="/your-dashboard"
  widgets={widgets}
  toggleWidget={toggleWidget}
  dashboardType="your-type"
/>
```

## 3. Set Up Dashboard State

```tsx
const defaultWidgets: Widget[] = [
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'myTasks', type: 'myTasks', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
]

const defaultLayouts: Layouts = {
  lg: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4 },
    { i: 'myTasks', x: 6, y: 0, w: 6, h: 8 },
  ],
  // ... md, sm breakpoints
}

const { widgets, layouts, toggleWidget, setLayouts } = useDashboardLayout(
  defaultWidgets,
  defaultLayouts,
  { layoutStorageKey: 'your-dashboard-layouts' }
)

const { fullscreenWidget, toggleFullscreen } = useFullscreenWidget()
```

## 4. Add Quick Actions

```tsx
const quickActions = [
  {
    id: 'action-1',
    label: 'Action 1',
    icon: YourIcon,
    href: '/your-dashboard/action1',
  },
  {
    id: 'action-2',
    label: 'Action 2',
    icon: YourIcon,
    onClick: () => handleAction(),
  },
]

<QuickActionsWidget
  actions={quickActions}
  widgetId="quickActions"
  fullscreen={fullscreenWidget === 'quickActions'}
  onToggleFullscreen={toggleFullscreen}
  dashboardType="your-type"
/>
```

## 5. Add My Tasks Widget

```tsx
<MyTasksWidget
  tasks={userTasks}
  widgetId="myTasks"
  fullscreen={fullscreenWidget === 'myTasks'}
  onToggleFullscreen={toggleFullscreen}
  dashboardType="your-type"
  basePath="/your-dashboard"
  showTimer={true}
  showCreateButton={true}
/>
```

## 6. Add Useful Links Widget

```tsx
<UsefulLinksWidget
  storageKey="your-dashboard-useful-links"
  widgetId="usefulLinks"
  fullscreen={fullscreenWidget === 'usefulLinks'}
  onToggleFullscreen={toggleFullscreen}
/>
```

## 7. Set Up Grid Layout

```tsx
<ResponsiveGridLayout
  layouts={layouts}
  onLayoutChange={(layouts) => setLayouts(layouts)}
>
  {widgets
    .filter((w) => w.visible)
    .map((widget) => (
      <div key={widget.id} data-grid={{ i: widget.id }}>
        {renderWidget(widget.id)}
      </div>
    ))}
</ResponsiveGridLayout>
```

## Complete Minimal Example

```tsx
'use client'

import { useState, useEffect } from 'react'
import { DashboardNavBar } from '@/components/common/DashboardNavBar'
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'
import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { useDashboardLayout } from '@/hooks/useDashboardLayout'
import { useFullscreenWidget } from '@/hooks/useFullscreenWidget'
import type { Widget } from '@/types/widgets'
import type { Layouts } from 'react-grid-layout'
import { LayoutDashboard } from 'lucide-react'

const defaultWidgets: Widget[] = [
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'myTasks', type: 'myTasks', visible: true },
]

const defaultLayouts: Layouts = {
  lg: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4 },
    { i: 'myTasks', x: 6, y: 0, w: 6, h: 8 },
  ],
}

export default function YourDashboard() {
  const [tasks, setTasks] = useState([])
  
  const { widgets, layouts, toggleWidget, setLayouts } = useDashboardLayout(
    defaultWidgets,
    defaultLayouts,
    { layoutStorageKey: 'your-dashboard-layouts' }
  )
  
  const { fullscreenWidget, toggleFullscreen } = useFullscreenWidget()

  return (
    <div>
      <DashboardNavBar
        navItems={[{ label: "Dashboard", href: "/your-dashboard", icon: LayoutDashboard }]}
        basePath="/your-dashboard"
        widgets={widgets}
        toggleWidget={toggleWidget}
      />
      
      <ResponsiveGridLayout
        layouts={layouts}
        onLayoutChange={setLayouts}
      >
        {widgets
          .filter((w) => w.visible)
          .map((widget) => (
            <div key={widget.id} data-grid={{ i: widget.id }}>
              {widget.type === 'myTasks' && (
                <MyTasksWidget
                  tasks={tasks}
                  fullscreen={fullscreenWidget === 'myTasks'}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}
              {widget.type === 'quickActions' && (
                <QuickActionsWidget
                  actions={[]}
                  fullscreen={fullscreenWidget === 'quickActions'}
                  onToggleFullscreen={toggleFullscreen}
                />
              )}
            </div>
          ))}
      </ResponsiveGridLayout>
    </div>
  )
}
```

## Common Patterns

### Filtering Tasks
```tsx
const { filteredTasks, filters, setStatusFilter } = useTaskFilters(tasks)
```

### Widget Visibility
```tsx
const { isWidgetVisible, showWidget, hideWidget } = useWidgetState(defaultWidgets)
```

### Dynamic Widget Rendering
```tsx
import { renderWidget } from '@/lib/widgets/registry'

const widget = renderWidget('myTasks', { tasks, ...props })
```

## Tips

1. **Start Small:** Begin with one widget (e.g., QuickActions)
2. **Test Incrementally:** Add widgets one at a time
3. **Use Types:** Import types from `@/types/widgets`
4. **Check Examples:** See `MIGRATION_EXAMPLE_SALES_DASHBOARD.md`
5. **Monitor Performance:** Use browser dev tools to check bundle size

## Need Help?

- Check `OPTIMIZATION_MIGRATION_GUIDE.md` for detailed steps
- See `MIGRATION_EXAMPLE_SALES_DASHBOARD.md` for complete example
- Review component source code (all are well-documented)

---

**Ready to start?** Pick one dashboard and begin migrating! 🚀

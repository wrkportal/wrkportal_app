# Optimization Migration Guide

This guide shows how to migrate existing dashboard pages to use the new optimized components.

## Phase 1: Quick Wins Migration

### Step 1: Update Imports

**Before:**
```typescript
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}
```

**After:**
```typescript
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'
import { useWidgetState } from '@/hooks/useWidgetState'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import type { Widget } from '@/types/widgets'
```

### Step 2: Replace Grid Layout

**Before:**
```tsx
<ResponsiveGridLayout
  layouts={layouts}
  onLayoutChange={handleLayoutChange}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
>
  {widgets.map((widget) => (
    <div key={widget.id}>
      {renderWidget(widget.type)}
    </div>
  ))}
</ResponsiveGridLayout>
```

**After:**
```tsx
<ResponsiveGridLayout
  layouts={layouts}
  onLayoutChange={handleLayoutChange}
>
  {widgets.map((widget) => (
    <div key={widget.id}>
      {renderWidget(widget.type)}
    </div>
  ))}
</ResponsiveGridLayout>
```

### Step 3: Use Widget State Hook

**Before:**
```typescript
const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)

const toggleWidget = (widgetId: string) => {
  setWidgets((prev) =>
    prev.map((w) =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    )
  )
}
```

**After:**
```typescript
const { widgets, toggleWidget, isWidgetVisible } = useWidgetState(
  defaultWidgets,
  { storageKey: 'sales-dashboard-widgets' }
)
```

### Step 4: Replace UsefulLinks Widget

**Before:**
```tsx
// 150+ lines of duplicate code
const renderUsefulLinksWidget = () => {
  // ... implementation
}
```

**After:**
```tsx
<UsefulLinksWidget
  storageKey="sales-useful-links"
  widgetId="usefulLinks"
  fullscreen={fullscreenWidget === 'usefulLinks'}
  onToggleFullscreen={toggleFullscreen}
  allowedRoles={['SALES_MANAGER', 'SALES_REP']} // Optional
  requiredPermission={{ resource: 'links', action: 'READ' }} // Optional
/>
```

### Step 5: Replace QuickActions Widget

**Before:**
```tsx
// 100+ lines of duplicate code
const renderQuickActionsWidget = () => {
  return (
    <Card>
      <Button onClick={() => router.push('/sales-dashboard/leads?create=true')}>
        New Lead
      </Button>
      {/* ... more buttons */}
    </Card>
  )
}
```

**After:**
```tsx
import { UserPlus, Target, Users, Building2, Calendar, CheckCircle2 } from 'lucide-react'

const salesQuickActions = [
  {
    id: 'new-lead',
    label: 'New Lead',
    icon: UserPlus,
    href: '/sales-dashboard/leads?create=true',
    requiredRole: 'SALES_REP', // Optional role restriction
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
    onClick: () => setTaskDialogOpen(true),
  },
]

<QuickActionsWidget
  actions={salesQuickActions}
  widgetId="quickActions"
  fullscreen={fullscreenWidget === 'quickActions'}
  onToggleFullscreen={toggleFullscreen}
  dashboardType="sales"
  columns={3}
/>
```

## Complete Example: Sales Dashboard Migration

### Before (Partial)
```tsx
'use client'

import { useState } from 'react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

export default function SalesDashboardPage() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [usefulLinks, setUsefulLinks] = useState([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')

  // 150+ lines for usefulLinks widget
  const renderUsefulLinksWidget = () => { /* ... */ }
  
  // 100+ lines for quickActions widget
  const renderQuickActionsWidget = () => { /* ... */ }

  return (
    <ResponsiveGridLayout layouts={layouts} onLayoutChange={handleLayoutChange}>
      {/* ... */}
    </ResponsiveGridLayout>
  )
}
```

### After
```tsx
'use client'

import { useState } from 'react'
import { ResponsiveGridLayout } from '@/components/common/ResponsiveGridLayout'
import { useWidgetState } from '@/hooks/useWidgetState'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import type { Widget } from '@/types/widgets'
import { UserPlus, Target, Users, Building2, Calendar, CheckCircle2 } from 'lucide-react'

const defaultWidgets: Widget[] = [
  { id: 'quickActions', type: 'quickActions', visible: true },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  // ... more widgets
]

const salesQuickActions = [
  {
    id: 'new-lead',
    label: 'New Lead',
    icon: UserPlus,
    href: '/sales-dashboard/leads?create=true',
  },
  // ... more actions
]

export default function SalesDashboardPage() {
  const { widgets, toggleWidget } = useWidgetState(defaultWidgets, {
    storageKey: 'sales-dashboard-widgets',
  })
  const [fullscreenWidget, setFullscreenWidget] = useState<string | null>(null)

  const toggleFullscreen = (widgetId: string) => {
    setFullscreenWidget((prev) => (prev === widgetId ? null : widgetId))
  }

  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      case 'quickActions':
        return (
          <QuickActionsWidget
            actions={salesQuickActions}
            widgetId="quickActions"
            fullscreen={fullscreenWidget === 'quickActions'}
            onToggleFullscreen={toggleFullscreen}
            dashboardType="sales"
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
      // ... other widgets
    }
  }

  return (
    <ResponsiveGridLayout layouts={layouts} onLayoutChange={handleLayoutChange}>
      {widgets
        .filter((w) => w.visible)
        .map((widget) => (
          <div key={widget.id}>{renderWidget(widget.id)}</div>
        ))}
    </ResponsiveGridLayout>
  )
}
```

## Benefits

1. **Code Reduction:** ~250 lines removed per dashboard
2. **Type Safety:** Shared types ensure consistency
3. **Maintainability:** Fix bugs once, works everywhere
4. **Role Support:** Built-in role and permission checks
5. **Accessibility:** ARIA labels and semantic HTML
6. **Performance:** Dynamic imports reduce bundle size

## Role-Based Access Example

```tsx
// Show widget only to sales managers
<UsefulLinksWidget
  storageKey="sales-useful-links"
  allowedRoles={['SALES_MANAGER', 'ORG_ADMIN']}
/>

// Show action only with permission
<QuickActionsWidget
  actions={[
    {
      id: 'approve-deal',
      label: 'Approve Deal',
      icon: CheckCircle2,
      requiredPermission: { resource: 'deals', action: 'APPROVE' },
      onClick: handleApprove,
    },
  ]}
/>
```

## Testing Checklist

- [ ] Widgets render correctly
- [ ] Role-based access works
- [ ] Permission checks work
- [ ] Fullscreen mode works
- [ ] localStorage persistence works
- [ ] No console errors
- [ ] Accessibility (screen reader test)
- [ ] Mobile responsiveness
- [ ] All dashboard types tested

## Rollback Plan

If issues occur, you can:
1. Keep old implementation alongside new one
2. Use feature flag to switch between old/new
3. Gradually migrate widgets one at a time
4. Revert specific commits if needed

## Next Steps

After Phase 1 is complete:
- Phase 2: Create MyTasksWidget (biggest win)
- Phase 3: Create DashboardContainer wrapper
- Phase 4: Implement widget registry system

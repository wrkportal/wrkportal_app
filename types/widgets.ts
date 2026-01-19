/**
 * Shared Widget Types
 * 
 * Centralized type definitions for dashboard widgets across all modules.
 * This ensures type safety and consistency across sales, operations, IT, 
 * product management, finance, and other dashboards.
 */

/**
 * Base widget interface used across all dashboards
 */
export interface Widget {
  id: string
  type: string
  visible: boolean
}

/**
 * Widget layout configuration for react-grid-layout
 */
export interface WidgetLayout {
  i: string // widget id
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

/**
 * Dashboard-specific widget configuration
 * Allows dashboards to customize widget behavior while maintaining type safety
 */
export interface DashboardWidgetConfig {
  widgetId: string
  dashboardType: 'sales' | 'operations' | 'it' | 'product' | 'finance' | 'recruitment' | 'general'
  role?: string // Optional role restriction
  permissions?: string[] // Required permissions to show widget
  customProps?: Record<string, any> // Dashboard-specific props
}

/**
 * Quick action item for QuickActionsWidget
 */
export interface QuickAction {
  id: string
  label: string
  description?: string
  icon: React.ComponentType<{ className?: string }>
  href?: string
  onClick?: () => void
  variant?: 'default' | 'outline' | 'ghost'
  // Role-based visibility
  requiredRole?: string | string[]
  requiredPermission?: { resource: string; action: string }
  // Dashboard-specific customization
  dashboardType?: string[]
}

/**
 * Useful link item for UsefulLinksWidget
 */
export interface UsefulLink {
  id: string
  title: string
  url: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  category?: string
  // Role-based visibility
  requiredRole?: string | string[]
  requiredPermission?: { resource: string; action: string }
}

/**
 * Widget renderer props - passed to widget components
 */
export interface WidgetRendererProps {
  widgetId: string
  dashboardType?: string
  userRole?: string
  fullscreen?: boolean
  onToggleFullscreen?: (widgetId: string) => void
  customProps?: Record<string, any>
}

/**
 * Widget state management hook return type
 */
export interface UseWidgetStateReturn {
  widgets: Widget[]
  setWidgets: (widgets: Widget[] | ((prev: Widget[]) => Widget[])) => void
  toggleWidget: (widgetId: string) => void
  isWidgetVisible: (widgetId: string) => boolean
  showWidget: (widgetId: string) => void
  hideWidget: (widgetId: string) => void
}

/**
 * Navigation item for DashboardNavBar
 */
export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  allowedRoles?: string[]
  requiredPermission?: { resource: string; action: string }
  dashboardType?: string[]
}

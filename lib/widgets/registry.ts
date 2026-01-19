/**
 * Widget Registry
 * 
 * Centralized registry for mapping widget types to their React components.
 * Enables dynamic widget loading and rendering across all dashboards.
 * 
 * Usage:
 * ```tsx
 * import { renderWidget } from '@/lib/widgets/registry'
 * 
 * const widget = renderWidget('myTasks', { tasks, ...props })
 * ```
 */

import { MyTasksWidget } from '@/components/widgets/MyTasksWidget'
import { QuickActionsWidget } from '@/components/widgets/QuickActionsWidget'
import { UsefulLinksWidget } from '@/components/widgets/UsefulLinksWidget'
import type { WidgetRendererProps } from '@/types/widgets'

export type WidgetComponent = React.ComponentType<any>

export interface WidgetRegistryEntry {
  component: WidgetComponent
  /** Optional display name */
  name?: string
  /** Optional description */
  description?: string
  /** Optional category */
  category?: string
}

/**
 * Widget registry mapping widget types to components
 */
export const widgetRegistry: Record<string, WidgetRegistryEntry> = {
  // Task widgets
  myTasks: {
    component: MyTasksWidget,
    name: 'My Tasks',
    description: 'Tasks assigned to you',
    category: 'Tasks',
  },
  'my-tasks': {
    component: MyTasksWidget,
    name: 'My Tasks',
    description: 'Tasks assigned to you',
    category: 'Tasks',
  },

  // Action widgets
  quickActions: {
    component: QuickActionsWidget,
    name: 'Quick Actions',
    description: 'Fast access to common tasks',
    category: 'Actions',
  },
  'quick-actions': {
    component: QuickActionsWidget,
    name: 'Quick Actions',
    description: 'Fast access to common tasks',
    category: 'Actions',
  },

  // Link widgets
  usefulLinks: {
    component: UsefulLinksWidget,
    name: 'Useful Links',
    description: 'Your frequently visited links',
    category: 'Resources',
  },
  'useful-links': {
    component: UsefulLinksWidget,
    name: 'Useful Links',
    description: 'Your frequently visited links',
    category: 'Resources',
  },
}

/**
 * Register a new widget type
 */
export function registerWidget(
  type: string,
  component: WidgetComponent,
  metadata?: {
    name?: string
    description?: string
    category?: string
  }
): void {
  widgetRegistry[type] = {
    component,
    ...metadata,
  }
}

/**
 * Get widget component by type
 */
export function getWidgetComponent(type: string): WidgetComponent | null {
  const entry = widgetRegistry[type]
  return entry?.component || null
}

/**
 * Get widget metadata by type
 */
export function getWidgetMetadata(type: string): Omit<WidgetRegistryEntry, 'component'> | null {
  const entry = widgetRegistry[type]
  if (!entry) return null
  const { component, ...metadata } = entry
  return metadata
}

/**
 * Render a widget by type
 */
export function renderWidget(
  type: string,
  props: Record<string, any>
): React.ReactElement | null {
  const Component = getWidgetComponent(type)
  if (!Component) {
    console.warn(`Widget type "${type}" not found in registry`)
    return null
  }
  return <Component {...props} />
}

/**
 * Check if a widget type is registered
 */
export function isWidgetRegistered(type: string): boolean {
  return type in widgetRegistry
}

/**
 * Get all registered widget types
 */
export function getRegisteredWidgetTypes(): string[] {
  return Object.keys(widgetRegistry)
}

/**
 * Get widgets by category
 */
export function getWidgetsByCategory(category: string): string[] {
  return Object.entries(widgetRegistry)
    .filter(([_, entry]) => entry.category === category)
    .map(([type]) => type)
}

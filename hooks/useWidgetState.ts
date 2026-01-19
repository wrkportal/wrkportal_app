/**
 * useWidgetState Hook
 * 
 * Centralized hook for managing widget state across all dashboards.
 * Handles widget visibility, toggling, and persistence.
 * 
 * Usage:
 * ```tsx
 * const { widgets, toggleWidget, isWidgetVisible } = useWidgetState(
 *   defaultWidgets,
 *   'sales-dashboard-widgets'
 * )
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import type { Widget, UseWidgetStateReturn } from '@/types/widgets'

export interface UseWidgetStateOptions {
  /** Storage key for persisting widget state (localStorage) */
  storageKey?: string
  /** Whether to persist state to localStorage (default: true) */
  persist?: boolean
  /** Callback when widgets change */
  onWidgetsChange?: (widgets: Widget[]) => void
}

export function useWidgetState(
  defaultWidgets: Widget[],
  options: UseWidgetStateOptions = {}
): UseWidgetStateReturn {
  const { storageKey, persist = true, onWidgetsChange } = options

  // Initialize state from localStorage or defaults
  const [widgets, setWidgetsState] = useState<Widget[]>(() => {
    if (persist && storageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
      } catch (error) {
        console.error('Error loading widget state:', error)
      }
    }
    return defaultWidgets
  })

  // Persist to localStorage whenever widgets change
  useEffect(() => {
    if (persist && storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(widgets))
        onWidgetsChange?.(widgets)
      } catch (error) {
        console.error('Error saving widget state:', error)
      }
    } else {
      onWidgetsChange?.(widgets)
    }
  }, [widgets, storageKey, persist, onWidgetsChange])

  const setWidgets = useCallback(
    (newWidgets: Widget[] | ((prev: Widget[]) => Widget[])) => {
      setWidgetsState(newWidgets)
    },
    []
  )

  const toggleWidget = useCallback(
    (widgetId: string) => {
      setWidgetsState((prev) =>
        prev.map((widget) =>
          widget.id === widgetId
            ? { ...widget, visible: !widget.visible }
            : widget
        )
      )
    },
    []
  )

  const isWidgetVisible = useCallback(
    (widgetId: string) => {
      const widget = widgets.find((w) => w.id === widgetId)
      return widget?.visible ?? false
    },
    [widgets]
  )

  const showWidget = useCallback(
    (widgetId: string) => {
      setWidgetsState((prev) =>
        prev.map((widget) =>
          widget.id === widgetId ? { ...widget, visible: true } : widget
        )
      )
    },
    []
  )

  const hideWidget = useCallback(
    (widgetId: string) => {
      setWidgetsState((prev) =>
        prev.map((widget) =>
          widget.id === widgetId ? { ...widget, visible: false } : widget
        )
      )
    },
    []
  )

  return {
    widgets,
    setWidgets,
    toggleWidget,
    isWidgetVisible,
    showWidget,
    hideWidget,
  }
}

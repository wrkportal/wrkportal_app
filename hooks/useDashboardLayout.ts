/**
 * useDashboardLayout Hook
 * 
 * Centralized hook for managing dashboard layout state (widgets and grid layouts).
 * Handles widget visibility, layout persistence, and mobile detection.
 * 
 * Usage:
 * ```tsx
 * const {
 *   widgets,
 *   layouts,
 *   toggleWidget,
 *   setLayouts,
 *   isMobile,
 * } = useDashboardLayout(defaultWidgets, defaultLayouts, 'sales-dashboard-widgets')
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import type { Layouts } from 'react-grid-layout'
import { useWidgetState } from './useWidgetState'
import type { Widget } from '@/types/widgets'

export interface UseDashboardLayoutOptions {
  /** Storage key for persisting layout state */
  layoutStorageKey?: string
  /** Whether to persist layout to localStorage */
  persistLayout?: boolean
  /** Callback when layouts change */
  onLayoutsChange?: (layouts: Layouts) => void
  /** Callback when widgets change */
  onWidgetsChange?: (widgets: Widget[]) => void
}

export interface UseDashboardLayoutReturn {
  /** Widget state management */
  widgets: Widget[]
  setWidgets: (widgets: Widget[] | ((prev: Widget[]) => Widget[])) => void
  toggleWidget: (widgetId: string) => void
  isWidgetVisible: (widgetId: string) => boolean
  showWidget: (widgetId: string) => void
  hideWidget: (widgetId: string) => void
  /** Layout state management */
  layouts: Layouts
  setLayouts: (layouts: Layouts | ((prev: Layouts) => Layouts)) => void
  /** Mobile detection */
  isMobile: boolean
  /** Initial mount flag (to prevent hydration issues) */
  isInitialMount: boolean
}

export function useDashboardLayout(
  defaultWidgets: Widget[],
  defaultLayouts: Layouts,
  options: UseDashboardLayoutOptions = {}
): UseDashboardLayoutReturn {
  const {
    layoutStorageKey,
    persistLayout = true,
    onLayoutsChange,
    onWidgetsChange,
  } = options

  // Widget state management
  const widgetState = useWidgetState(defaultWidgets, {
    storageKey: layoutStorageKey?.replace('-layouts', '-widgets'),
    persist: persistLayout,
    onWidgetsChange,
  })

  // Layout state management
  const [layouts, setLayoutsState] = useState<Layouts>(() => {
    if (persistLayout && layoutStorageKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(layoutStorageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && typeof parsed === 'object') {
            return parsed
          }
        }
      } catch (error) {
        console.error('Error loading layout state:', error)
      }
    }
    return defaultLayouts
  })

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)

  // Persist layouts to localStorage
  useEffect(() => {
    if (persistLayout && layoutStorageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(layoutStorageKey, JSON.stringify(layouts))
        onLayoutsChange?.(layouts)
      } catch (error) {
        console.error('Error saving layout state:', error)
      }
    } else {
      onLayoutsChange?.(layouts)
    }
  }, [layouts, layoutStorageKey, persistLayout, onLayoutsChange])

  // Handle layout changes
  const setLayouts = useCallback(
    (newLayouts: Layouts | ((prev: Layouts) => Layouts)) => {
      setLayoutsState(newLayouts)
    },
    []
  )

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  // Set initial mount flag
  useEffect(() => {
    setIsInitialMount(false)
  }, [])

  return {
    // Widget state
    widgets: widgetState.widgets,
    setWidgets: widgetState.setWidgets,
    toggleWidget: widgetState.toggleWidget,
    isWidgetVisible: widgetState.isWidgetVisible,
    showWidget: widgetState.showWidget,
    hideWidget: widgetState.hideWidget,
    // Layout state
    layouts,
    setLayouts,
    // Mobile detection
    isMobile,
    isInitialMount,
  }
}

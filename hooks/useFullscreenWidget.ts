/**
 * useFullscreenWidget Hook
 * 
 * Centralized hook for managing fullscreen widget state across all dashboards.
 * 
 * Usage:
 * ```tsx
 * const { fullscreenWidget, toggleFullscreen, isFullscreen } = useFullscreenWidget()
 * ```
 */

import { useState, useCallback } from 'react'

export interface UseFullscreenWidgetReturn {
  /** Currently fullscreen widget ID or null */
  fullscreenWidget: string | null
  /** Toggle fullscreen for a widget */
  toggleFullscreen: (widgetId: string) => void
  /** Check if a widget is fullscreen */
  isFullscreen: (widgetId: string) => boolean
  /** Set fullscreen widget directly */
  setFullscreenWidget: (widgetId: string | null) => void
  /** Exit fullscreen */
  exitFullscreen: () => void
}

export function useFullscreenWidget(): UseFullscreenWidgetReturn {
  const [fullscreenWidget, setFullscreenWidgetState] = useState<string | null>(null)

  const toggleFullscreen = useCallback((widgetId: string) => {
    setFullscreenWidgetState((prev) => (prev === widgetId ? null : widgetId))
  }, [])

  const isFullscreen = useCallback(
    (widgetId: string) => {
      return fullscreenWidget === widgetId
    },
    [fullscreenWidget]
  )

  const exitFullscreen = useCallback(() => {
    setFullscreenWidgetState(null)
  }, [])

  return {
    fullscreenWidget,
    toggleFullscreen,
    isFullscreen,
    setFullscreenWidget: setFullscreenWidgetState,
    exitFullscreen,
  }
}

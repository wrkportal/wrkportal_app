/**
 * Shared Default Widget Layouts
 * 
 * Centralized configuration for default widget sizes and positions across all dashboards.
 * This prevents duplication and ensures consistency.
 */

import { Layouts } from 'react-grid-layout'

/**
 * Common widget default layouts
 * These can be reused across different dashboards
 */
export const commonWidgetLayouts = {
  // My Tasks widget - common across all dashboards
  myTasks: {
    lg: { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
    md: { i: 'myTasks', x: 0, y: 4, w: 5, h: 6, minW: 3, minH: 6 },
    sm: { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
  },
  
  // Quick Actions widget
  quickActions: {
    lg: { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    md: { i: 'quickActions', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 4 },
    sm: { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
  },
  
  // Useful Links widget
  usefulLinks: {
    lg: { i: 'usefulLinks', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    md: { i: 'usefulLinks', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 4 },
    sm: { i: 'usefulLinks', x: 0, y: 6, w: 6, h: 4, minW: 3, minH: 4 },
  },
  
  // Metrics widget
  metrics: {
    lg: { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    md: { i: 'metrics', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 2 },
    sm: { i: 'metrics', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
  },
  
  // Mind Map widget - consistent minW: 16, minH: 12 across all
  mindMap: {
    lg: { i: 'mindMap', x: 0, y: 22, w: 6, h: 8, minW: 16, minH: 12 },
    md: { i: 'mindMap', x: 0, y: 22, w: 5, h: 8, minW: 16, minH: 12 },
    sm: { i: 'mindMap', x: 0, y: 28, w: 6, h: 8, minW: 16, minH: 12 },
  },
  
  // Canvas widget
  canvas: {
    lg: { i: 'canvas', x: 6, y: 22, w: 6, h: 8, minW: 3, minH: 8 },
    md: { i: 'canvas', x: 5, y: 22, w: 5, h: 8, minW: 3, minH: 8 },
    sm: { i: 'canvas', x: 0, y: 36, w: 6, h: 8, minW: 3, minH: 8 },
  },
}

/**
 * Build default layouts for a dashboard
 */
export function buildDefaultLayouts(widgets: Array<{ id: string; y?: number }>): Layouts {
  const layouts: Layouts = { lg: [], md: [], sm: [] }
  
  widgets.forEach((widget) => {
    const widgetLayout = commonWidgetLayouts[widget.id as keyof typeof commonWidgetLayouts]
    if (widgetLayout) {
      // Use custom y position if provided, otherwise use default
      const lgLayout = { ...widgetLayout.lg }
      const mdLayout = { ...widgetLayout.md }
      const smLayout = { ...widgetLayout.sm }
      
      if (widget.y !== undefined) {
        lgLayout.y = widget.y
        mdLayout.y = widget.y
        smLayout.y = widget.y
      }
      
      layouts.lg.push(lgLayout)
      layouts.md.push(mdLayout)
      layouts.sm.push(smLayout)
    }
  })
  
  return layouts
}

/**
 * Finance/Wrkboard Dashboard default layouts
 */
export const financeDefaultLayouts: Layouts = {
  lg: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'metrics', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'myTasks', x: 0, y: 4, w: 6, h: 6, minW: 3, minH: 6 },
  ],
  md: [
    { i: 'quickActions', x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 4 },
    { i: 'metrics', x: 5, y: 0, w: 5, h: 4, minW: 3, minH: 2 },
    { i: 'myTasks', x: 0, y: 4, w: 5, h: 6, minW: 3, minH: 6 },
  ],
  sm: [
    { i: 'quickActions', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 4 },
    { i: 'metrics', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 2 },
    { i: 'myTasks', x: 0, y: 8, w: 6, h: 6, minW: 3, minH: 6 },
  ],
}

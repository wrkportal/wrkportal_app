'use client'

/**
 * ResponsiveGridLayout Wrapper
 * 
 * Pre-configured wrapper for react-grid-layout to eliminate duplication
 * across dashboard pages. Handles CSS imports and WidthProvider setup.
 * 
 * Usage:
 * ```tsx
 * <ResponsiveGridLayout
 *   layouts={layouts}
 *   onLayoutChange={handleLayoutChange}
 *   breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
 *   cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
 * >
 *   {children}
 * </ResponsiveGridLayout>
 * ```
 */

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { Layouts, Layout } from 'react-grid-layout'

// Dynamically import react-grid-layout to reduce initial bundle size
const ResponsiveGridLayoutComponent = dynamic(
  () => import('react-grid-layout').then((mod) => {
    const { WidthProvider, Responsive } = mod
    return WidthProvider(Responsive)
  }),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
  }
)

// Import CSS (only once for the entire app)
if (typeof window !== 'undefined') {
  import('react-grid-layout/css/styles.css')
  import('react-resizable/css/styles.css')
}

export interface ResponsiveGridLayoutProps {
  layouts: Layouts
  onLayoutChange?: (layouts: Layouts, allLayouts: Layout[]) => void
  children: React.ReactNode
  className?: string
  breakpoints?: { lg?: number; md?: number; sm?: number; xs?: number; xxs?: number }
  cols?: { lg?: number; md?: number; sm?: number; xs?: number; xxs?: number }
  rowHeight?: number
  isDraggable?: boolean
  isResizable?: boolean
  compactType?: 'vertical' | 'horizontal' | null
  preventCollision?: boolean
  margin?: [number, number]
  containerPadding?: [number, number]
  useCSSTransforms?: boolean
  transformScale?: number
}

export function ResponsiveGridLayout({
  layouts,
  onLayoutChange,
  children,
  className = '',
  breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  rowHeight = 30,
  isDraggable = true,
  isResizable = true,
  compactType = 'vertical',
  preventCollision = false,
  margin = [10, 10],
  containerPadding = [10, 10],
  useCSSTransforms = true,
  transformScale = 1,
}: ResponsiveGridLayoutProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <ResponsiveGridLayoutComponent
      layouts={layouts}
      onLayoutChange={onLayoutChange}
      breakpoints={breakpoints}
      cols={cols}
      rowHeight={rowHeight}
      isDraggable={isDraggable}
      isResizable={isResizable}
      compactType={compactType}
      preventCollision={preventCollision}
      margin={margin}
      containerPadding={containerPadding}
      useCSSTransforms={useCSSTransforms}
      transformScale={transformScale}
      className={className}
    >
      {children}
    </ResponsiveGridLayoutComponent>
  )
}

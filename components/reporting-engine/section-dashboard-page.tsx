'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toPng } from 'html-to-image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  RefreshCw,
  Settings,
  MoreVertical,
  LayoutGrid,
  Sparkles,
  Clock,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share2,
  X,
  Filter,
  Palette,
  GripVertical,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Type,
  FileDown,
  Layers
} from 'lucide-react'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { VisualizationBuilder } from '@/components/reporting-engine/visualization-builder'
import { VisualizationLibrary } from '@/components/reporting-engine/visualization-library'
import { VisualizationRenderer } from '@/components/reporting-engine/visualization-renderer'
import { VisualizationDetailsDialog } from '@/components/reporting-engine/visualization-details-dialog'
import { FilterBuilder, FilterCondition } from '@/components/reporting-engine/filter-builder'
import { ChartFormattingDialog } from '@/components/reporting-engine/chart-formatting-dialog'
import { AddToDashboardDialog } from '@/components/reporting-engine/add-to-dashboard-dialog'
import { DashboardExportDialog } from '@/components/reporting-engine/dashboard-export-dialog'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const ResponsiveGridLayout = WidthProvider(Responsive)

// Export context for re-rendering charts at export size
export const ExportContext = createContext<{ exporting: boolean }>({ exporting: false })

interface SectionDashboardPageProps {
  functionalArea: string
}

// Helper function to build page-specific layouts
function buildPageLayouts(
  pageId: string,
  visualizations: any[],
  textWidgets: any[],
  pages: any[]
): Layouts {
  const firstPageId = pages[0]?.id
  const layout: Layout[] = []

  visualizations.forEach(viz => {
    if (
      (!viz.pageId && pageId === firstPageId) ||
      viz.pageId === pageId
    ) {
      const pos = viz.position || { x: 0, y: 0, w: 6, h: 4 }
      layout.push({
        i: viz.id,
        x: pos.x ?? 0,
        y: pos.y ?? 0,
        w: pos.w ?? 6,
        h: pos.h ?? 4
      })
    }
  })

  textWidgets.forEach(w => {
    if (
      (!w.pageId && pageId === firstPageId) ||
      w.pageId === pageId
    ) {
      const pos = w.position || { x: 0, y: 0, w: 6, h: 3 }
      layout.push({
        i: w.id,
        x: pos.x ?? 0,
        y: pos.y ?? 0,
        w: pos.w ?? 6,
        h: pos.h ?? 3
      })
    }
  })

  return { lg: layout }
}

// Slide Thumbnail Component - Lightweight preview using react-grid-layout
interface SlideThumbnailProps {
  layouts: Layouts
  items: Array<{
    id: string
    type: 'viz' | 'text'
    name?: string
  }>
}

function SlideThumbnail({ layouts, items }: SlideThumbnailProps) {
  return (
    <div
      className="origin-top-left scale-[0.25] pointer-events-none"
      style={{ width: 1200, height: 800 }}
    >
      <ResponsiveGridLayout
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        isDraggable={false}
        isResizable={false}
        compactType={null}
        margin={[16, 16]}
        className="layout"
      >
        {items.map(item => (
          <div key={item.id} className="border border-border bg-background rounded shadow-sm">
            {item.type === 'viz' ? (
              <div className="p-2 text-xs font-semibold truncate flex items-center gap-1">
                <span>📊</span>
                <span className="truncate">{item.name || 'Chart'}</span>
              </div>
            ) : (
              <div className="p-2 text-[10px] italic text-muted-foreground flex items-center gap-1">
                <span>📝</span>
                <span>Text Widget</span>
              </div>
            )}
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  )
}

export function SectionDashboardPage({ functionalArea }: SectionDashboardPageProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()

  const [dashboards, setDashboards] = useState<any[]>([])
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null)
  const [currentDashboard, setCurrentDashboard] = useState<any | null>(null)
  const [visualizations, setVisualizations] = useState<any[]>([])
  const [textWidgets, setTextWidgets] = useState<any[]>([])
  const [layouts, setLayouts] = useState<Layouts>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isPending, startTransition] = useTransition()
  const layoutSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isUserLayoutChangeRef = useRef(false) // Flag to prevent useEffect from overwriting user changes

  // Export ref registry - maps chart/widget IDs to DOM elements
  const exportRefMap = useRef<Record<string, HTMLElement>>({})

  // Export image cache - stores high-res images for export
  const exportImageCache = useRef<Record<string, string>>({})

  // Register export ref for a chart/widget
  const registerExportRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) {
      exportRefMap.current[id] = el
    } else {
      delete exportRefMap.current[id]
    }
  }, [])

  // Capture chart at export resolution using ref (PPT resolution)
  // forceHighRes: if true, always capture fresh (don't use cache)
  const captureChartById = useCallback(async (id: string, forceHighRes: boolean = false): Promise<string | null> => {
    // Check cache first (skip if forcing high-res)
    if (!forceHighRes && exportImageCache.current[id]) {
      return exportImageCache.current[id]
    }

    // Get element from ref registry (no DOM searching)
    const el = exportRefMap.current[id]
    if (!el) {
      console.warn(`Export ref not found for ${id}`)
      return null
    }

    try {
      // Export dimensions (PPT resolution - fixed size, no scaling)
      const EXPORT_WIDTH = 1200
      const EXPORT_HEIGHT = 700

      // Wait for chart to re-render at export size (if exporting flag is set)
      if (forceHighRes) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Capture at fixed export resolution (not screen size)
      // Note: This still captures the rendered UI, but charts should re-render at export size
      // via ExportContext when forceHighRes is true
      const dataUrl = await toPng(el, {
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        },
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        quality: 1.0,
      })

      // Only cache if forcing high-res (export quality)
      if (forceHighRes) {
        exportImageCache.current[id] = dataUrl
      }

      return dataUrl
    } catch (error) {
      console.error(`Error capturing chart ${id}:`, error)
      return null
    }
  }, [])

  // Capture and cache chart at export resolution (wrapper for consistency)
  const captureAndCacheChart = useCallback(async (id: string, itemType: 'visualization' | 'text') => {
    return captureChartById(id)
  }, [captureChartById])
  const [showVisualizationBuilder, setShowVisualizationBuilder] = useState(false)
  const [editingVisualization, setEditingVisualization] = useState<any>(null)
  const [viewingVisualization, setViewingVisualization] = useState<any>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState(300) // 5 minutes
  const [showLibrary, setShowLibrary] = useState(false)
  const [dashboardFilters, setDashboardFilters] = useState<FilterCondition[]>([])
  const [availableFieldsForFilters, setAvailableFieldsForFilters] = useState<Array<{ name: string; type: string }>>([])
  const [showDashboardFilters, setShowDashboardFilters] = useState(false)
  const [showTopBottomFilter, setShowTopBottomFilter] = useState(false)
  const [topBottomFilter, setTopBottomFilter] = useState<{ type: 'top' | 'bottom'; n: number; field: string } | null>(null)
  const [formattingChart, setFormattingChart] = useState<any>(null)
  const [sortingChart, setSortingChart] = useState<any>(null)
  const [addingToDashboardChart, setAddingToDashboardChart] = useState<any>(null)
  const [fullscreenChart, setFullscreenChart] = useState<any>(null)
  const [editingTextWidget, setEditingTextWidget] = useState<any>(null)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [isExporting, setIsExporting] = useState(false) // Export mode flag for chart re-rendering
  const [pages, setPages] = useState<Array<{ id: string; name: string; order: number; thumbnail?: string }>>([])
  const [currentPageId, setCurrentPageId] = useState<string>('')
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [editingPageName, setEditingPageName] = useState<string>('')
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null)
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboards()
  }, [functionalArea])

  useEffect(() => {
    if (selectedDashboard) {
      fetchDashboard(selectedDashboard)
    }
  }, [selectedDashboard])

  // Handler for page changes with transition
  const handlePageChange = useCallback((pageId: string) => {
    if (pageId === currentPageId) return // Don't change if already on this page
    
    startTransition(() => {
      setCurrentPageId(pageId)
    })
  }, [currentPageId, startTransition])

  // Filter visualizations and text widgets by current page when page changes
  useEffect(() => {
    if (!currentPageId || !currentDashboard || pages.length === 0) return

    // Update layouts to show only items for current page
    const dashboardLayout = typeof currentDashboard.layout === 'string'
      ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
      : (currentDashboard.layout || {})

    const gridLayouts: Layouts = {}
    const breakpoint = 'lg'
    if (!gridLayouts[breakpoint]) {
      gridLayouts[breakpoint] = []
    }

    // Get first page ID for items without pageId
    const firstPageId = pages.length > 0 ? pages[0].id : null

    // Filter visualizations by current page
    visualizations
      .filter((viz: any) => {
        // If no pageId, only show on first page
        if (!viz.pageId) {
          return currentPageId === firstPageId
        }
        // Otherwise show only on assigned page
        return viz.pageId === currentPageId
      })
      .forEach((viz: any) => {
        const isKPI = viz.type === 'kpi'
        const layoutItem: any = {
          i: viz.id,
          x: viz.position?.x || 0,
          y: viz.position?.y || 0,
          w: viz.position?.w || viz.defaultWidth || 6,
          h: viz.position?.h || viz.defaultHeight || 4,
        }

        if (isKPI) {
          layoutItem.minW = 3
          layoutItem.minH = 3
          if (layoutItem.w < layoutItem.minW) layoutItem.w = layoutItem.minW
          if (layoutItem.h < layoutItem.minH) layoutItem.h = layoutItem.minH
        }

        gridLayouts[breakpoint].push(layoutItem)
      })

    // Filter text widgets by current page
    const textWidgetsForPage = textWidgets.filter((item: any) => {
      // If no pageId, only show on first page
      if (!item.pageId) {
        return currentPageId === firstPageId
      }
      // Otherwise show only on assigned page
      return item.pageId === currentPageId
    })
    textWidgetsForPage.forEach((item: any) => {
      gridLayouts[breakpoint].push({
        i: item.id,
        x: item.x || 0,
        y: item.y || 0,
        w: item.w || 4,
        h: item.h || 3,
      })
    })

    // Use startTransition to keep UI responsive during layout updates
    startTransition(() => {
      setLayouts(gridLayouts)
    })
  }, [currentPageId, visualizations, textWidgets, currentDashboard, pages, startTransition])


  useEffect(() => {
    if (autoRefresh && currentDashboard) {
      const interval = setInterval(() => {
        refreshDashboard()
      }, refreshInterval * 1000)

      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, currentDashboard])

  const fetchDashboards = async () => {
    try {
      const response = await fetch(`/api/reporting-engine/dashboards?functionalArea=${functionalArea}`)
      if (response.ok) {
        const data = await response.json()
        setDashboards(data.dashboards || [])
      }
    } catch (error) {
      console.error('Error fetching dashboards:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboard = async (dashboardId: string) => {
    try {
      const response = await fetch(`/api/reporting-engine/dashboards/${dashboardId}`)
      if (response.ok) {
        const data = await response.json()
        setCurrentDashboard(data.dashboard)

        // Build visualizations and layouts - store all visualizations with their pageId
        const vizList = data.dashboard.visualizations.map((dv: any) => {
          // Extract pageId from customConfig if it exists
          const customConfig = dv.customConfig || {}
          const pageId = customConfig.pageId || null

          const viz = {
            ...dv.visualization,
            position: dv.position,
            order: dv.order,
            customConfig: dv.customConfig,
            pageId: pageId, // Get pageId from customConfig
          }

          // Ensure config is properly parsed if it's a string
          if (viz.config && typeof viz.config === 'string') {
            try {
              viz.config = JSON.parse(viz.config)
            } catch (e) {
              console.error('Error parsing visualization config:', e)
            }
          }

          return viz
        })
        // Store all visualizations - we'll filter by page when rendering
        setVisualizations(vizList)

        // Parse dashboard layout once
        const dashboardLayout = typeof data.dashboard.layout === 'string'
          ? (() => { try { return JSON.parse(data.dashboard.layout) } catch { return {} } })()
          : (data.dashboard.layout || {})

        // Load pages from layout, or create default page if none exists
        const layoutPages = dashboardLayout.pages || []
        if (layoutPages.length === 0) {
          // Create default page
          const defaultPageId = `page-${Date.now()}`
          layoutPages.push({
            id: defaultPageId,
            name: 'Page 1',
            order: 0
          })
          // Save default page to layout
          const updatedLayout = {
            ...dashboardLayout,
            pages: layoutPages
          }
          // Save to dashboard
          try {
            await fetch(`/api/reporting-engine/dashboards/${dashboardId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ layout: updatedLayout }),
            })
          } catch (e) {
            console.error('Error saving default page:', e)
          }
        }
        setPages(layoutPages)

        // Set current page (default to first page)
        const firstPageId = layoutPages.length > 0 ? layoutPages[0].id : null
        const activePageId = currentPageId && layoutPages.find((p: any) => p.id === currentPageId)
          ? currentPageId
          : firstPageId

        if (activePageId !== currentPageId) {
          setCurrentPageId(activePageId)
        }

        // Build grid layouts from positions (filtered by current page)
        const gridLayouts: Layouts = {}
        const breakpoint = 'lg'
        if (!gridLayouts[breakpoint]) {
          gridLayouts[breakpoint] = []
        }

        // Add visualizations to layout (filtered by page)
        // Items without pageId will only show on the first page
        const currentPage = activePageId
        vizList
          .filter((viz: any) => {
            // If no pageId, only show on first page
            if (!viz.pageId) {
              return currentPage === firstPageId
            }
            // Otherwise show only on assigned page
            return viz.pageId === currentPage
          })
          .forEach((viz: any) => {
            const isKPI = viz.type === 'kpi'
            const layoutItem: any = {
              i: viz.id,
              x: viz.position?.x || 0,
              y: viz.position?.y || 0,
              w: viz.position?.w || viz.defaultWidth || 6,
              h: viz.position?.h || viz.defaultHeight || 4,
            }

            // Set minimum size for KPI cards to ensure value always fits
            if (isKPI) {
              layoutItem.minW = 3  // Minimum 3 columns wide
              layoutItem.minH = 3  // Minimum 3 rows high
              // Ensure current size is at least minimum
              if (layoutItem.w < layoutItem.minW) {
                layoutItem.w = layoutItem.minW
              }
              if (layoutItem.h < layoutItem.minH) {
                layoutItem.h = layoutItem.minH
              }
            }

            gridLayouts[breakpoint].push(layoutItem)
          })

        // Load all text widgets from layout.items - we'll filter by page when rendering
        const allTextWidgets = (dashboardLayout.items || []).filter((item: any) => item.type === 'text')
        setTextWidgets(allTextWidgets)

        // Filter text widgets for current page to add to grid
        // Items without pageId will only show on the first page
        const textWidgetsForPage = allTextWidgets.filter((item: any) => {
          // If no pageId, only show on first page
          if (!item.pageId) {
            return currentPage === firstPageId
          }
          // Otherwise show only on assigned page
          return item.pageId === currentPage
        })
        textWidgetsForPage.forEach((item: any) => {
          gridLayouts[breakpoint].push({
            i: item.id,
            x: item.x || 0,
            y: item.y || 0,
            w: item.w || 4,
            h: item.h || 3,
          })
        })

        setLayouts(gridLayouts)

        // Set auto-refresh settings
        setAutoRefresh(data.dashboard.autoRefresh || false)
        setRefreshInterval(data.dashboard.refreshInterval || 300)

        // Load dashboard filters from layout
        const savedFilters = dashboardLayout.filters || []
        setDashboardFilters(savedFilters)

        // Load top/bottom N filter from layout
        const savedTopBottomFilter = dashboardLayout.topBottomFilter || null
        setTopBottomFilter(savedTopBottomFilter)

        // Collect available fields from all visualizations for filter builder
        const fieldsMap = new Map<string, string>()

        vizList.forEach((viz: any) => {
          // Get fields from query data source schema
          if (viz.query?.dataSource?.schema?.columns) {
            viz.query.dataSource.schema.columns.forEach((col: any) => {
              const fieldName = col.name
              if (fieldName) {
                if (!fieldsMap.has(fieldName)) {
                  fieldsMap.set(fieldName, col.type || 'string')
                }
              }
            })
          }

          // Also get fields from X-axis and Y-axis config
          const config = typeof viz.config === 'string'
            ? (() => { try { return JSON.parse(viz.config) } catch { return {} } })()
            : (viz.config || {})

          if (config.xAxis?.field) {
            if (!fieldsMap.has(config.xAxis.field)) {
              fieldsMap.set(config.xAxis.field, 'string')
            }
          }

          if (config.yAxis?.fields) {
            config.yAxis.fields.forEach((field: string) => {
              if (field && !fieldsMap.has(field)) {
                fieldsMap.set(field, 'number')
              }
            })
          }

          // For dual-axis charts, get fields from both axes
          if (config.dualAxis) {
            if (config.dualAxis.leftAxis?.fields) {
              config.dualAxis.leftAxis.fields.forEach((field: string) => {
                if (field && !fieldsMap.has(field)) {
                  fieldsMap.set(field, 'number')
                }
              })
            }
            if (config.dualAxis.rightAxis?.fields) {
              config.dualAxis.rightAxis.fields.forEach((field: string) => {
                if (field && !fieldsMap.has(field)) {
                  fieldsMap.set(field, 'number')
                }
              })
            }
          }
        })

        // Convert to array format
        const fieldsArray = Array.from(fieldsMap.entries()).map(([name, type]) => ({
          name,
          type
        }))

        setAvailableFieldsForFilters(fieldsArray)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard',
        variant: 'destructive',
      })
    }
  }

  const refreshDashboard = async () => {
    if (!selectedDashboard) return

    setRefreshing(true)
    try {
      await fetchDashboard(selectedDashboard)
      toast({
        title: 'Refreshed',
        description: 'Dashboard data updated',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handlePageRename = async (pageId: string, newName: string) => {
    if (!selectedDashboard || !currentDashboard || !newName.trim()) {
      setEditingPageId(null)
      setEditingPageName('')
      return
    }

    try {
      const currentLayout = typeof currentDashboard.layout === 'string'
        ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
        : (currentDashboard.layout || {})

      const updatedPages = (currentLayout.pages || []).map((p: any) =>
        p.id === pageId ? { ...p, name: newName.trim() } : p
      )

      const layoutData = {
        ...currentLayout,
        pages: updatedPages,
      }

      const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: layoutData }),
      })

      if (response.ok) {
        await fetchDashboard(selectedDashboard)
        setEditingPageId(null)
        setEditingPageName('')
      } else {
        throw new Error('Failed to rename page')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to rename page',
        variant: 'destructive',
      })
      setEditingPageId(null)
      setEditingPageName('')
    }
  }

  // Helper function to check if all charts on a page are loaded
  const checkAllChartsLoaded = useCallback((pageId: string): boolean => {
    const slideNode = document.getElementById(`slide-${pageId}`)
    if (!slideNode) return false

    // Get all visualization containers on this page
    const pageVisualizations = visualizations.filter((viz: any) => {
      if (!viz.pageId) {
        return pages.length > 0 && pages[0].id === pageId
      }
      return viz.pageId === pageId
    })

    // If no visualizations, consider it loaded
    if (pageVisualizations.length === 0) return true

    // Check for loading indicators within the slide
    const allText = slideNode.textContent || ''
    const hasLoadingText = allText.includes('Loading chart data') ||
      allText.includes('Loading...')

    // Check for spinners
    const hasSpinner = slideNode.querySelector('[class*="animate-spin"]') !== null

    // Check if charts have rendered content
    // Look for Recharts SVG elements (they render charts)
    const svgs = slideNode.querySelectorAll('svg.recharts-surface')
    const hasChartsWithContent = Array.from(svgs).some(svg => {
      const hasContent = svg.querySelectorAll('path, rect, circle, line, text').length > 0
      const hasSize = svg.getBoundingClientRect().width > 10 && svg.getBoundingClientRect().height > 10
      return hasContent && hasSize
    })

    // If we have visualizations, at least some should have rendered
    // For KPI cards, check for numeric values
    const hasKPIContent = Array.from(slideNode.querySelectorAll('.text-2xl, .text-3xl, .text-4xl')).length > 0

    // Consider loaded if no loading indicators AND (charts rendered OR KPI content visible)
    const isLoaded = !hasLoadingText && !hasSpinner && (hasChartsWithContent || hasKPIContent || pageVisualizations.length === 0)

    return isLoaded
  }, [visualizations, pages])

  // Capture slide thumbnail (low resolution for sidebar)
  const captureSlideThumbnail = useCallback(async (pageId: string) => {
    if (!selectedDashboard || !currentDashboard) return

    try {
      const node = document.getElementById(`slide-${pageId}`)
      if (!node) {
        console.warn(`Slide container not found for page ${pageId}`)
        return
      }

      // Wait for all charts to finish loading
      const maxWaitTime = 15000 // 15 seconds max
      const checkInterval = 500 // Check every 500ms
      const startTime = Date.now()

      while (Date.now() - startTime < maxWaitTime) {
        if (checkAllChartsLoaded(pageId)) {
          break // All charts loaded
        }
        await new Promise(resolve => setTimeout(resolve, checkInterval))
      }

      // Wait a bit more for final rendering
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(node, {
        pixelRatio: 0.3, // Lower quality for smaller file size (sidebar thumbnails)
        cacheBust: true,
        quality: 0.8
      })

      // Save thumbnail to dashboard layout
      const currentLayout = typeof currentDashboard.layout === 'string'
        ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
        : (currentDashboard.layout || {})

      const updatedPages = (currentLayout.pages || []).map((p: any) => {
        if (p.id === pageId) {
          return { ...p, thumbnail: dataUrl }
        }
        return p
      })

      const layoutData = {
        ...currentLayout,
        pages: updatedPages,
      }

      // Update local state immediately for better UX
      setPages(prevPages => prevPages.map(p =>
        p.id === pageId ? { ...p, thumbnail: dataUrl } : p
      ))

      // Save to backend
      const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: layoutData }),
      })

      if (!response.ok) {
        console.error('Failed to save thumbnail')
      }
    } catch (error) {
      console.error('Error capturing slide thumbnail:', error)
    }
  }, [selectedDashboard, currentDashboard, checkAllChartsLoaded])

  // Capture high-resolution image for export
  const captureHighResImage = useCallback(async (pageId: string): Promise<string | null> => {
    try {
      const node = document.getElementById(`slide-${pageId}`)
      if (!node) {
        console.warn(`Slide container not found for page ${pageId}`)
        return null
      }

      // Capture full page at very high resolution for export (4x for maximum quality)
      const dataUrl = await toPng(node, {
        pixelRatio: 4, // Very high quality (4x resolution for crisp export)
        cacheBust: true,
        quality: 1.0, // Maximum quality
        backgroundColor: '#ffffff', // White background
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      })

      return dataUrl
    } catch (error) {
      console.error('Error capturing high-res image:', error)
      return null
    }
  }, [checkAllChartsLoaded])


  // Capture thumbnail when page switches or content updates
  useEffect(() => {
    if (!currentPageId || !selectedDashboard || pages.length === 0) return

    // Check if thumbnail already exists
    const page = pages.find(p => p.id === currentPageId)
    // Always capture when switching pages to ensure thumbnails are up-to-date
    // But wait longer to ensure charts have time to load
    const timeoutId = setTimeout(() => {
      captureSlideThumbnail(currentPageId)
    }, 2000) // Increased delay to allow charts to start loading

    return () => clearTimeout(timeoutId)
  }, [currentPageId, visualizations.length, textWidgets.length, selectedDashboard, pages, captureSlideThumbnail])

  // Force grid to recalculate width when sidebar or layout changes
  useEffect(() => {
    // Trigger a resize event for react-grid-layout to recalculate width
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'))
    }, 100)
    return () => clearTimeout(timer)
  }, [pages.length, layouts, sidebarCollapsed]) // Recalculate when pages change, sidebar toggles, or layouts change

  const handlePageReorder = async (draggedPageId: string, targetPageId: string) => {
    if (!selectedDashboard || !currentDashboard || draggedPageId === targetPageId) {
      setDraggedPageId(null)
      setDragOverPageId(null)
      return
    }

    try {
      const currentLayout = typeof currentDashboard.layout === 'string'
        ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
        : (currentDashboard.layout || {})

      const sortedPages = [...(currentLayout.pages || [])].sort((a, b) => a.order - b.order)
      const draggedIndex = sortedPages.findIndex((p: any) => p.id === draggedPageId)
      const targetIndex = sortedPages.findIndex((p: any) => p.id === targetPageId)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedPageId(null)
        setDragOverPageId(null)
        return
      }

      // Remove dragged page and insert at target position
      const [draggedPage] = sortedPages.splice(draggedIndex, 1)
      sortedPages.splice(targetIndex, 0, draggedPage)

      // Update order values
      const updatedPages = sortedPages.map((p: any, index: number) => ({
        ...p,
        order: index
      }))

      const layoutData = {
        ...currentLayout,
        pages: updatedPages,
      }

      const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: layoutData }),
      })

      if (response.ok) {
        await fetchDashboard(selectedDashboard)
        // Capture thumbnail after layout save
        if (currentPageId) {
          setTimeout(() => captureSlideThumbnail(currentPageId), 500)
        }
      } else {
        throw new Error('Failed to reorder pages')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reorder pages',
        variant: 'destructive',
      })
    } finally {
      setDraggedPageId(null)
      setDragOverPageId(null)
    }
  }

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: Layouts) => {
    // Set flag to prevent useEffect from overwriting user changes
    isUserLayoutChangeRef.current = true

    setLayouts(allLayouts)

    // Clear flag after a short delay to allow useEffect to run again for page changes
    setTimeout(() => {
      isUserLayoutChangeRef.current = false
    }, 1000)

    // Save layout to dashboard (which will also update visualization positions)
    const saveLayout = async () => {
      if (!selectedDashboard || !currentDashboard) return

      const currentLayout = typeof currentDashboard.layout === 'string'
        ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
        : (currentDashboard.layout || {})

      // Collect all items (visualizations + text widgets) from layout
      const layoutItems: any[] = []

      // Add visualization positions to layout items
      // IMPORTANT: Include ALL visualizations with their current positions from layout
      visualizations.forEach((viz: any) => {
        const layoutItem = layout.find(l => l.i === viz.id)
        if (layoutItem) {
          // Use position from layout (which reflects any drag/resize operations)
          layoutItems.push({
            id: viz.id, // API expects 'id' to match visualizationId
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          })
        } else {
          // If visualization is not in layout (shouldn't happen, but preserve position just in case)
          const currentPosition = viz.position || {}
          layoutItems.push({
            id: viz.id,
            x: currentPosition.x ?? 0,
            y: currentPosition.y ?? 0,
            w: currentPosition.w ?? viz.defaultWidth ?? 6,
            h: currentPosition.h ?? viz.defaultHeight ?? 4,
          })
        }
      })

      // Update text widget positions from layout
      const existingTextWidgets = currentLayout.items || []
      existingTextWidgets.forEach((item: any) => {
        if (item.type === 'text') {
          const layoutItem = layout.find(l => l.i === item.id)
          if (layoutItem) {
            layoutItems.push({
              id: item.id,
              type: 'text',
              content: item.content,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
              formatting: item.formatting || {},
            })
          } else {
            // Preserve text widget if not in layout
            layoutItems.push(item)
          }
        }
      })

      // Add any new text widgets from layout that aren't in existingTextWidgets
      layout.forEach((layoutItem) => {
        const isTextWidget = textWidgets.some((tw: any) => tw.id === layoutItem.i)
        const isVisualization = visualizations.some((viz: any) => viz.id === layoutItem.i)
        if (!isTextWidget && !isVisualization) {
          // This might be a text widget that was just added, check if it exists
          const existingTextWidget = existingTextWidgets.find((tw: any) => tw.id === layoutItem.i)
          if (existingTextWidget) {
            layoutItems.push({
              ...existingTextWidget,
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            })
          }
        }
      })

      const layoutData = {
        ...currentLayout,
        columns: 24, // Updated for 1920px width (24 columns)
        rowHeight: 60, // Updated for 1080px height
        items: layoutItems, // Include both visualization positions and text widgets
        // Preserve filters if they exist
        filters: currentLayout.filters || [],
      }

      // Save layout which will update visualization positions via API
      try {
        const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layout: layoutData }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Error saving layout:', errorText)
          throw new Error(`Failed to save layout: ${errorText}`)
        }

        const result = await response.json()
        console.log('Layout saved successfully, positions should be persisted')

        // Update currentDashboard with the saved layout
        if (currentDashboard && result.dashboard) {
          setCurrentDashboard(result.dashboard)

          // Also update visualizations with saved positions to ensure they match database
          // This prevents the useEffect from overwriting with old positions
          if (result.dashboard.visualizations) {
            setVisualizations((prevViz) => {
              return prevViz.map((viz: any) => {
                const savedViz = result.dashboard.visualizations.find((dv: any) => dv.visualization.id === viz.id)
                if (savedViz && savedViz.position) {
                  return {
                    ...viz,
                    position: savedViz.position
                  }
                }
                return viz
              })
            })
          }
        }
      } catch (error) {
        console.error('Error saving layout:', error)
        throw error
      }
    }

    // Update visualization positions in state immediately to prevent useEffect from overwriting
    // Use setState to ensure React detects the changes
    setVisualizations((prevViz) => {
      const updated = prevViz.map((viz: any) => {
        const layoutItem = layout.find((l) => l.i === viz.id)
        if (layoutItem) {
          return {
            ...viz,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          }
        }
        return viz
      })

      // Log if any visualizations weren't found in layout
      const missingViz = prevViz.filter((viz: any) => !layout.find((l) => l.i === viz.id))
      if (missingViz.length > 0) {
        console.warn('Visualizations not found in layout:', missingViz.map((v: any) => ({ id: v.id, name: v.name })))
      }

      return updated
    })

    // Update text widget positions in state immediately
    setTextWidgets((prevWidgets) => {
      return prevWidgets.map((widget: any) => {
        const layoutItem = layout.find((l) => l.i === widget.id)
        if (layoutItem) {
          return {
            ...widget,
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }
        }
        return widget
      })
    })

    // Debounce layout saving to prevent rapid saves during drag/resize
    if (layoutSaveTimeoutRef.current) {
      clearTimeout(layoutSaveTimeoutRef.current)
    }

    layoutSaveTimeoutRef.current = setTimeout(() => {
      saveLayout()
        .then(() => {
          console.log('Layout save completed successfully')
          // Capture thumbnail after layout changes
          if (currentPageId) {
            setTimeout(() => captureSlideThumbnail(currentPageId), 500)
          }
        })
        .catch((error) => {
          console.error('Layout save failed:', error)
          toast({
            title: 'Error',
            description: 'Failed to save chart positions. Please try again.',
            variant: 'destructive',
          })
        })
    }, 500) // Wait 500ms before saving to allow drag/resize to complete
  }, [selectedDashboard, currentDashboard, visualizations, textWidgets, currentPageId, captureSlideThumbnail, layoutSaveTimeoutRef])

  const handleCreateDashboard = async () => {
    const name = prompt('Enter dashboard name:')
    if (!name) return

    try {
      const response = await fetch('/api/reporting-engine/dashboards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          functionalArea,
          layout: { columns: 24, rowHeight: 60, items: [] },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchDashboards()
        setSelectedDashboard(data.dashboard.id)
      } else {
        throw new Error('Failed to create dashboard')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create dashboard',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (!confirm('Are you sure you want to delete this dashboard?')) return

    try {
      const response = await fetch(`/api/reporting-engine/dashboards/${dashboardId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchDashboards()
        if (selectedDashboard === dashboardId) {
          setSelectedDashboard(null)
          setCurrentDashboard(null)
          setVisualizations([])
          setLayouts({})
        }
        toast({
          title: 'Success',
          description: 'Dashboard deleted',
        })
      } else {
        throw new Error('Failed to delete dashboard')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete dashboard',
        variant: 'destructive',
      })
    }
  }

  const handleSaveFormatting = async (visualization: any, formatting: any) => {
    try {
      const currentConfig = typeof visualization.config === 'string'
        ? (() => { try { return JSON.parse(visualization.config) } catch { return {} } })()
        : (visualization.config || {})

      // For text charts, save textContent from formatting.text.text
      if (visualization.type === 'text' && formatting.text?.text) {
        currentConfig.textContent = formatting.text.text
      }

      const response = await fetch(`/api/reporting-engine/visualizations/${visualization.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...visualization,
          config: {
            ...currentConfig,
            formatting,
          },
        }),
      })

      if (response.ok) {
        // Refresh the dashboard to get updated visualization
        if (selectedDashboard) {
          await fetchDashboard(selectedDashboard)
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save formatting',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {!selectedDashboard ? (
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Dashboards</h1>
              <p className="text-muted-foreground">Manage your {functionalArea} dashboards</p>
            </div>
            <Button
              onClick={handleCreateDashboard}
              style={{ backgroundColor: '#ff751f' }}
              className="hover:opacity-90"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dashboards.map((dashboard) => {
              // Extract dashboard content summary with item details
              const getDashboardSummary = (dashboard: any) => {
                try {
                  const layout = typeof dashboard.layout === 'string'
                    ? JSON.parse(dashboard.layout)
                    : (dashboard.layout || {})

                  const items = layout.items || []
                  const pages = layout.pages || []

                  // Get first 6 items with their positions for layout preview
                  const previewItems = items.slice(0, 6).map((item: any) => ({
                    id: item.id,
                    type: item.type || 'chart',
                    x: item.x || 0,
                    y: item.y || 0,
                    w: item.w || 4,
                    h: item.h || 3,
                  }))

                  // Count by type
                  const chartCount = items.filter((item: any) => item.type !== 'text').length
                  const textCount = items.filter((item: any) => item.type === 'text').length

                  return {
                    totalItems: items.length,
                    chartCount,
                    textCount,
                    pageCount: pages.length || 1,
                    hasContent: items.length > 0,
                    previewItems
                  }
                } catch (error) {
                  return {
                    totalItems: 0,
                    chartCount: 0,
                    textCount: 0,
                    pageCount: 1,
                    hasContent: false,
                    previewItems: []
                  }
                }
              }

              const summary = getDashboardSummary(dashboard)

              // Mini chart component
              const MiniBarChart = () => (
                <svg width="100%" height="100%" viewBox="0 0 40 30" className="overflow-visible">
                  <rect x="2" y="20" width="5" height="8" fill="#8b5cf6" rx="1" />
                  <rect x="9" y="15" width="5" height="13" fill="#3b82f6" rx="1" />
                  <rect x="16" y="18" width="5" height="10" fill="#10b981" rx="1" />
                  <rect x="23" y="12" width="5" height="16" fill="#f59e0b" rx="1" />
                  <rect x="30" y="22" width="5" height="6" fill="#ef4444" rx="1" />
                </svg>
              )

              const MiniLineChart = () => (
                <svg width="100%" height="100%" viewBox="0 0 40 30" className="overflow-visible">
                  <polyline
                    points="2,25 8,20 14,15 20,12 26,18 32,22 36,20"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="2" cy="25" r="1.5" fill="#3b82f6" />
                  <circle cx="8" cy="20" r="1.5" fill="#3b82f6" />
                  <circle cx="14" cy="15" r="1.5" fill="#3b82f6" />
                  <circle cx="20" cy="12" r="1.5" fill="#3b82f6" />
                  <circle cx="26" cy="18" r="1.5" fill="#3b82f6" />
                  <circle cx="32" cy="22" r="1.5" fill="#3b82f6" />
                  <circle cx="36" cy="20" r="1.5" fill="#3b82f6" />
                </svg>
              )

              const MiniPieChart = () => (
                <svg width="100%" height="100%" viewBox="0 0 30 30" className="overflow-visible">
                  <circle cx="15" cy="15" r="12" fill="none" stroke="#e5e7eb" strokeWidth="2" />
                  <path
                    d="M 15 3 A 12 12 0 0 1 25 10 L 15 15 Z"
                    fill="#8b5cf6"
                  />
                  <path
                    d="M 25 10 A 12 12 0 0 1 15 27 L 15 15 Z"
                    fill="#3b82f6"
                  />
                  <path
                    d="M 15 27 A 12 12 0 0 1 3 15 L 15 15 Z"
                    fill="#10b981"
                  />
                  <path
                    d="M 3 15 A 12 12 0 0 1 15 3 L 15 15 Z"
                    fill="#f59e0b"
                  />
                </svg>
              )

              const MiniKPI = () => (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">$12.5K</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">+12.5%</div>
                </div>
              )

              const getMiniChart = (index: number, itemType: string) => {
                const chartTypes = ['bar', 'line', 'pie', 'kpi', 'bar', 'line']
                const type = chartTypes[index % chartTypes.length]

                if (itemType === 'text') {
                  return (
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <div className="w-full h-full bg-muted/50 rounded border border-border/30 flex items-center justify-center">
                        <span className="text-[8px] text-muted-foreground">Text</span>
                      </div>
                    </div>
                  )
                }

                switch (type) {
                  case 'bar':
                    return <MiniBarChart />
                  case 'line':
                    return <MiniLineChart />
                  case 'pie':
                    return <MiniPieChart />
                  case 'kpi':
                    return <MiniKPI />
                  default:
                    return <MiniBarChart />
                }
              }

              return (
                <Card
                  key={dashboard.id}
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2 hover:border-purple-400 dark:hover:border-purple-600 overflow-hidden bg-gradient-to-br from-background to-muted/20"
                  onDoubleClick={() => setSelectedDashboard(dashboard.id)}
                >
                  {/* Dashboard Preview - Realistic Layout */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-slate-50 via-blue-50/50 to-purple-50/50 dark:from-slate-950 dark:via-blue-950/20 dark:to-purple-950/20 overflow-hidden border-b">
                    {summary.hasContent ? (
                      <div className="p-3 h-full relative">
                        {/* Mini dashboard grid - scaled layout preview */}
                        <div className="relative w-full h-full" style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                          <div className="absolute inset-0 grid grid-cols-12 gap-1">
                            {summary.previewItems.map((item: any, index: number) => {
                              const colSpan = Math.min(item.w || 4, 12)
                              const rowSpan = item.h || 3
                              const left = ((item.x || 0) / 24) * 100 // Assuming 24 column grid
                              const top = ((item.y || 0) / 18) * 100 // Approximate row calculation

                              return (
                                <div
                                  key={item.id || index}
                                  className="absolute bg-background/95 dark:bg-background/90 rounded-sm border border-border/40 shadow-sm p-1.5 overflow-hidden"
                                  style={{
                                    left: `${left}%`,
                                    top: `${top}%`,
                                    width: `${(colSpan / 24) * 100}%`,
                                    height: `${(rowSpan / 18) * 100}%`,
                                    minWidth: '20%',
                                    minHeight: '15%',
                                  }}
                                >
                                  {getMiniChart(index, item.type)}
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* Stats overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-2 bg-background/90 dark:bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">
                            {summary.chartCount > 0 && (
                              <span className="flex items-center gap-1 text-muted-foreground font-medium">
                                <span className="text-purple-600 dark:text-purple-400">●</span>
                                <span>{summary.chartCount}</span>
                              </span>
                            )}
                            {summary.textCount > 0 && (
                              <span className="flex items-center gap-1 text-muted-foreground font-medium">
                                <span className="text-blue-600 dark:text-blue-400">●</span>
                                <span>{summary.textCount}</span>
                              </span>
                            )}
                          </div>
                          {summary.pageCount > 1 && (
                            <div className="bg-background/90 dark:bg-background/80 px-2 py-1 rounded-full backdrop-blur-sm">
                              <span className="text-muted-foreground font-medium">
                                {summary.pageCount} pages
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                            <LayoutGrid className="h-8 w-8 text-purple-600 dark:text-purple-400 opacity-60" />
                          </div>
                          <p className="text-xs text-muted-foreground font-medium">Empty Dashboard</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Add charts to get started</p>
                        </div>
                      </div>
                    )}

                    {/* Hover overlay with shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none">
                      <div className="w-1/3 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    </div>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 truncate">{dashboard.name}</h3>
                        {dashboard.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {dashboard.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedDashboard(dashboard.id)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDashboard(dashboard.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>{summary.totalItems > 0 ? `${summary.totalItems} item${summary.totalItems !== 1 ? 's' : ''}` : 'Empty'}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Page Preview Sidebar - PowerPoint Style */}
          {pages.length > 0 && (
            <>
              {/* Collapsed Sidebar - Just toggle button */}
              {sidebarCollapsed ? (
                <div className="w-12 border-r bg-muted/20 flex flex-col items-center py-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarCollapsed(false)}
                    className="mb-2"
                    title="Expand sidebar"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-[380px] border-r bg-muted/20 overflow-y-auto relative">
                  <div className="p-4 border-b bg-background sticky top-0 z-10 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Slide Preview</h3>
                      <p className="text-xs text-muted-foreground mt-1">Click to switch slides</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarCollapsed(true)}
                      className="h-8 w-8"
                      title="Collapse sidebar"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="p-3 space-y-4">
                    {pages
                      .sort((a, b) => a.order - b.order)
                      .map((page, index) => {
                        // Get items for this page
                        const pageVisualizations = visualizations.filter((viz: any) => {
                          if (!viz.pageId) {
                            return pages.length > 0 && pages[0].id === page.id
                          }
                          return viz.pageId === page.id
                        })
                        const pageTextWidgets = textWidgets.filter((widget: any) => {
                          if (!widget.pageId) {
                            return pages.length > 0 && pages[0].id === page.id
                          }
                          return widget.pageId === page.id
                        })
                        const totalItems = pageVisualizations.length + pageTextWidgets.length

                        // Build page-specific layout using the same grid system
                        const pageLayouts = buildPageLayouts(
                          page.id,
                          visualizations,
                          textWidgets,
                          pages
                        )

                        return (
                          <div
                            key={page.id}
                            onClick={() => handlePageChange(page.id)}
                            className={cn(
                              "rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg bg-background overflow-hidden relative",
                              currentPageId === page.id
                                ? "border-primary shadow-md ring-2 ring-primary ring-offset-2"
                                : "border-border hover:border-primary/50",
                              isPending && currentPageId === page.id && "opacity-50"
                            )}
                          >
                            {/* Slide Number Badge - PPT Style */}
                            <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded z-10">
                              {index + 1}
                            </span>

                            {/* Page Header */}
                            <div className="px-3 py-2 bg-muted/50 border-b flex items-center justify-between">
                              <h4 className="text-sm font-semibold truncate">{page.name}</h4>
                              {totalItems > 0 && (
                                <Badge variant="secondary" className="text-xs h-5 px-2">
                                  {totalItems}
                                </Badge>
                              )}
                            </div>

                            {/* Slide Thumbnail Image - PowerPoint Style */}
                            {totalItems === 0 ? (
                              <div className="text-xs text-muted-foreground italic text-center py-8 border border-dashed border-border rounded m-2">
                                Empty slide
                              </div>
                            ) : page.thumbnail ? (
                              <img
                                src={page.thumbnail}
                                alt={`${page.name} preview`}
                                className="w-full h-auto rounded-b"
                              />
                            ) : (
                              <div className="relative overflow-hidden bg-muted/20 p-4 text-center">
                                <div className="text-xs text-muted-foreground">Generating preview...</div>
                                {/* Fallback: Use SlideThumbnail if thumbnail not yet captured */}
                                <div className="scale-[0.2] origin-top-left pointer-events-none" style={{ width: 1200, height: 200 }}>
                                  <SlideThumbnail
                                    layouts={pageLayouts}
                                    items={[
                                      ...pageVisualizations.map(v => ({
                                        id: v.id,
                                        type: 'viz' as const,
                                        name: v.name
                                      })),
                                      ...pageTextWidgets.map(t => ({
                                        id: t.id,
                                        type: 'text' as const
                                      }))
                                    ]}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </>
          )}
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto min-w-0">
            <div className="p-4 border-b bg-background sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedDashboard(null)
                      setCurrentDashboard(null)
                      setVisualizations([])
                      setLayouts({})
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-xl font-semibold">{currentDashboard?.name}</h1>
                    {currentDashboard?.description && (
                      <p className="text-sm text-muted-foreground">{currentDashboard.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTopBottomFilter(true)}
                    className={cn(topBottomFilter && "bg-primary/10 border-primary")}
                  >
                    {topBottomFilter?.type === 'top' ? (
                      <TrendingUp className={cn("h-4 w-4 mr-2", topBottomFilter && "text-primary")} />
                    ) : topBottomFilter?.type === 'bottom' ? (
                      <TrendingDown className={cn("h-4 w-4 mr-2", topBottomFilter && "text-primary")} />
                    ) : (
                      <TrendingUp className="h-4 w-4 mr-2" />
                    )}
                    {topBottomFilter ? `${topBottomFilter.type === 'top' ? 'Top' : 'Bottom'} ${topBottomFilter.n}` : 'Top/Bottom N'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!selectedDashboard) {
                        toast({
                          title: 'Error',
                          description: 'Please select a dashboard first',
                          variant: 'destructive',
                        })
                        return
                      }

                      try {
                        // Create a text widget visualization
                        const textWidgetId = `text-${Date.now()}`
                        const textWidget = {
                          id: textWidgetId,
                          name: 'Text Widget',
                          type: 'text',
                          config: {
                            textContent: 'Enter your text here',
                            formatting: {
                              text: {
                                text: 'Enter your text here',
                                fontSize: 16,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                                fontFamily: 'inherit',
                                color: '#000000',
                                textAlign: 'left',
                              }
                            }
                          },
                          position: { x: 0, y: 0, w: 4, h: 3 },
                          defaultWidth: 4,
                          defaultHeight: 3,
                        }

                        // Add to dashboard layout
                        const currentLayout = typeof currentDashboard.layout === 'string'
                          ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                          : (currentDashboard.layout || {})

                        const layoutData = {
                          ...currentLayout,
                          columns: 24,
                          rowHeight: 60,
                          items: [
                            ...(currentLayout.items || []),
                            {
                              id: textWidgetId,
                              type: 'text',
                              content: 'Enter your text here',
                              x: 0,
                              y: 0,
                              w: 4,
                              h: 3,
                              pageId: currentPageId || pages[0]?.id, // Assign to current page or first page
                              formatting: {
                                fontSize: 14,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                                color: '#000000',
                                textAlign: 'left',
                                backgroundColor: 'transparent',
                              },
                            }
                          ],
                          filters: currentLayout.filters || [],
                        }

                        // Update dashboard with new layout item
                        const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ layout: layoutData }),
                        })

                        if (response.ok) {
                          // Refresh dashboard to show new text widget
                          await fetchDashboard(selectedDashboard)
                          // Open edit dialog for the text widget
                          setEditingTextWidget({
                            id: textWidgetId,
                            content: 'Enter your text here',
                          })
                        } else {
                          throw new Error('Failed to add text widget')
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to add text widget',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    <Type className="h-4 w-4 mr-2" />
                    Add Text
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!selectedDashboard || !currentDashboard) {
                        toast({
                          title: 'Error',
                          description: 'Please select a dashboard first',
                          variant: 'destructive',
                        })
                        return
                      }

                      try {
                        // Create a new page
                        const newPageId = `page-${Date.now()}`
                        const newPageName = `Page ${pages.length + 1}`

                        const currentLayout = typeof currentDashboard.layout === 'string'
                          ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                          : (currentDashboard.layout || {})

                        const updatedPages = [
                          ...(currentLayout.pages || []),
                          {
                            id: newPageId,
                            name: newPageName,
                            order: (currentLayout.pages || []).length
                          }
                        ]

                        const layoutData = {
                          ...currentLayout,
                          pages: updatedPages,
                        }

                        // Update dashboard with new page
                        const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ layout: layoutData }),
                        })

                        if (response.ok) {
                          // Refresh dashboard to show new page
                          await fetchDashboard(selectedDashboard)
                          // Switch to new page
                          setCurrentPageId(newPageId)
                          toast({
                            title: 'Success',
                            description: 'New page added successfully',
                          })
                        } else {
                          throw new Error('Failed to add page')
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to add page',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    Add Page
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDashboardFilters(true)}
                    className={cn(dashboardFilters.length > 0 && "bg-primary/10 border-primary")}
                  >
                    <Filter className={cn("h-4 w-4 mr-2", dashboardFilters.length > 0 && "text-primary")} />
                    Filters
                    {dashboardFilters.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                        {dashboardFilters.length}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshDashboard}
                    disabled={refreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVisualizationBuilder(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Chart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLibrary(true)}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Library
                  </Button>
                </div>
              </div>

              {/* Page Tabs Navigation */}
              {pages.length > 0 && (
                <div className="border-b bg-background sticky top-[64px] z-10">
                  <Tabs value={currentPageId} onValueChange={setCurrentPageId}>
                    <TabsList className="w-full justify-start rounded-none h-auto p-2 bg-transparent">
                      {pages
                        .sort((a, b) => a.order - b.order)
                        .map((page) => (
                          <div
                            key={page.id}
                            className={cn(
                              "relative inline-block",
                              draggedPageId === page.id && "opacity-50",
                              dragOverPageId === page.id && "border-t-2 border-primary"
                            )}
                          >
                            {editingPageId === page.id ? (
                              <Input
                                value={editingPageName}
                                onChange={(e) => setEditingPageName(e.target.value)}
                                onBlur={() => {
                                  if (editingPageName.trim()) {
                                    handlePageRename(page.id, editingPageName)
                                  } else {
                                    setEditingPageId(null)
                                    setEditingPageName('')
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.currentTarget.blur()
                                  } else if (e.key === 'Escape') {
                                    setEditingPageId(null)
                                    setEditingPageName('')
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="h-8 px-3 text-sm min-w-[100px]"
                                autoFocus
                              />
                            ) : (
                              <TabsTrigger
                                value={page.id}
                                draggable
                                onDragStart={(e) => {
                                  setDraggedPageId(page.id)
                                  e.dataTransfer.effectAllowed = 'move'
                                  e.dataTransfer.setData('text/plain', '')
                                  if (e.currentTarget instanceof HTMLElement) {
                                    e.currentTarget.style.opacity = '0.5'
                                  }
                                }}
                                onDragEnd={(e) => {
                                  if (e.currentTarget instanceof HTMLElement) {
                                    e.currentTarget.style.opacity = '1'
                                  }
                                  if (dragOverPageId && draggedPageId) {
                                    handlePageReorder(draggedPageId, dragOverPageId)
                                  } else {
                                    setDraggedPageId(null)
                                    setDragOverPageId(null)
                                  }
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  e.dataTransfer.dropEffect = 'move'
                                  if (draggedPageId && draggedPageId !== page.id) {
                                    setDragOverPageId(page.id)
                                  }
                                }}
                                onDragLeave={() => {
                                  setDragOverPageId(null)
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (draggedPageId && draggedPageId !== page.id) {
                                    handlePageReorder(draggedPageId, page.id)
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setEditingPageId(page.id)
                                  setEditingPageName(page.name)
                                }}
                                className={cn(
                                  "data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md cursor-move",
                                  dragOverPageId === page.id && "border-t-2 border-primary"
                                )}
                              >
                                {page.name}
                              </TabsTrigger>
                            )}
                          </div>
                        ))}
                    </TabsList>
                  </Tabs>
                </div>
              )}

              <div className="p-4 w-full flex justify-center overflow-auto">
                {currentDashboard && currentPageId && (visualizations.length > 0 || textWidgets.length > 0) ? (
                  <div
                    id={`slide-${currentPageId}`}
                    className="slide-container"
                    style={{
                      width: '1920px',
                      height: '1080px',
                      minWidth: '1920px',
                      minHeight: '1080px',
                      position: 'relative'
                    }}
                  >
                    {/* Loading overlay during page transitions */}
                    {isPending && (
                      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">Loading page...</p>
                        </div>
                      </div>
                    )}
                    <ExportContext.Provider value={{ exporting: isExporting }}>
                      <ResponsiveGridLayout
                        compactType={null}
                        className="layout"
                        style={{ width: '1920px', height: '1080px' }}
                        layouts={layouts}
                        onLayoutChange={handleLayoutChange}
                        breakpoints={{ lg: 1920, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 24, md: 10, sm: 6, xs: 4, xxs: 2 }}
                        rowHeight={60}
                        isDraggable={true}
                        isResizable={true}
                        margin={[16, 16]}
                        draggableHandle=".drag-handle"
                        useCSSTransforms={true}
                        preventCollision={false}
                        allowOverlap={false}
                      >
                        {(() => {
                          // Get first page ID for items without pageId
                          const firstPageId = pages.length > 0 ? pages[0].id : null

                          return visualizations
                            .filter((viz: any) => {
                              // If no pageId, only show on first page
                              if (!viz.pageId) {
                                return currentPageId === firstPageId
                              }
                              // Otherwise show only on assigned page
                              return viz.pageId === currentPageId
                            })
                            .map((viz) => (
                              <div
                                key={viz.id}
                                ref={(el) => registerExportRef(viz.id, el)}
                                data-viz-id={viz.id}
                                className="relative group"
                              >
                                <Card className="h-full shadow-lg hover:shadow-xl transition-shadow border-2">
                                  <CardContent className="p-4 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-3 relative">
                                      <div className="flex-1 flex items-center gap-2 drag-handle" style={{ cursor: 'move', userSelect: 'none' }}>
                                        {/* Drag Handle - Visual indicator */}
                                        <div className="cursor-move flex items-center text-muted-foreground">
                                          <GripVertical className="h-4 w-4" />
                                        </div>
                                        <h3 className="font-semibold text-sm cursor-move">{viz.name}</h3>
                                        {viz.description && (
                                          <p className="text-xs text-muted-foreground">{viz.description}</p>
                                        )}
                                      </div>
                                      {/* Action Buttons - Positioned absolutely to avoid grid interference */}
                                      <div className="flex items-center gap-1" style={{ position: 'absolute', right: 0, top: 0 }}>
                                        {/* Fullscreen Button */}
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            try {
                                              const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                              if (response.ok) {
                                                const data = await response.json()
                                                setFullscreenChart(data.visualization)
                                              } else {
                                                throw new Error('Failed to fetch visualization')
                                              }
                                            } catch (error: any) {
                                              console.error('Error fetching visualization:', error)
                                              toast({
                                                title: 'Error',
                                                description: error.message || 'Failed to load visualization',
                                                variant: 'destructive',
                                              })
                                            }
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                          }}
                                          title="View in fullscreen"
                                        >
                                          <Maximize className="h-4 w-4" />
                                        </button>
                                        {/* 3-dots Menu */}
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <button
                                              type="button"
                                              className="inline-flex items-center justify-center rounded-md p-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                              }}
                                              onMouseDown={(e) => {
                                                e.stopPropagation()
                                                e.preventDefault()
                                              }}
                                            >
                                              <MoreVertical className="h-4 w-4" />
                                            </button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" style={{ zIndex: 10002 }}>
                                            <DropdownMenuItem
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                                  if (response.ok) {
                                                    const data = await response.json()
                                                    setEditingVisualization(data.visualization)
                                                    setShowVisualizationBuilder(true)
                                                  } else {
                                                    throw new Error('Failed to fetch visualization')
                                                  }
                                                } catch (error: any) {
                                                  console.error('Error fetching visualization:', error)
                                                  toast({
                                                    title: 'Error',
                                                    description: error.message || 'Failed to load visualization for editing',
                                                    variant: 'destructive',
                                                  })
                                                }
                                              }}
                                            >
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit Fields
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  console.log('Format Chart clicked for viz:', viz.id)
                                                  const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                                  if (response.ok) {
                                                    const data = await response.json()
                                                    console.log('Fetched visualization data for formatting:', data.visualization)
                                                    setFormattingChart(data.visualization)
                                                    console.log('Set formattingChart state')
                                                  } else {
                                                    console.error('Failed to fetch visualization:', response.status)
                                                  }
                                                } catch (error) {
                                                  console.error('Error fetching visualization:', error)
                                                }
                                              }}
                                            >
                                              <Palette className="h-4 w-4 mr-2" />
                                              Format Chart
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={async (e) => {
                                                e.stopPropagation()
                                                try {
                                                  console.log('Opening sort dialog for visualization:', viz.id)
                                                  const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                                  if (response.ok) {
                                                    const data = await response.json()
                                                    console.log('Fetched visualization for sorting:', data.visualization)
                                                    // Ensure config is parsed
                                                    if (data.visualization.config && typeof data.visualization.config === 'string') {
                                                      try {
                                                        data.visualization.config = JSON.parse(data.visualization.config)
                                                      } catch (e) {
                                                        console.error('Error parsing config:', e)
                                                      }
                                                    }
                                                    setSortingChart(data.visualization)
                                                  } else {
                                                    console.error('Failed to fetch visualization:', response.status)
                                                    toast({
                                                      title: 'Error',
                                                      description: 'Failed to load visualization',
                                                      variant: 'destructive',
                                                    })
                                                  }
                                                } catch (error: any) {
                                                  console.error('Error fetching visualization:', error)
                                                  toast({
                                                    title: 'Error',
                                                    description: error.message || 'Failed to load visualization',
                                                    variant: 'destructive',
                                                  })
                                                }
                                              }}
                                            >
                                              <ArrowUpDown className="h-4 w-4 mr-2" />
                                              Sort Data
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                try {
                                                  const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                                  if (response.ok) {
                                                    const data = await response.json()
                                                    setAddingToDashboardChart(data.visualization)
                                                  }
                                                } catch (error) {
                                                  console.error('Error fetching visualization:', error)
                                                }
                                              }}
                                            >
                                              <LayoutGrid className="h-4 w-4 mr-2" />
                                              Add to Dashboard
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                try {
                                                  const response = await fetch(`/api/reporting-engine/visualizations/${viz.id}`)
                                                  if (!response.ok) throw new Error('Failed to fetch visualization')

                                                  const data = await response.json()
                                                  const originalViz = data.visualization

                                                  // Create duplicate
                                                  const duplicateResponse = await fetch('/api/reporting-engine/visualizations', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                      name: `${originalViz.name} (Copy)`,
                                                      type: originalViz.type,
                                                      functionalArea: originalViz.functionalArea,
                                                      queryId: originalViz.queryId,
                                                      config: originalViz.config,
                                                    }),
                                                  })

                                                  if (!duplicateResponse.ok) throw new Error('Failed to duplicate visualization')

                                                  const duplicateData = await duplicateResponse.json()

                                                  // Add to current dashboard
                                                  await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}/visualizations`, {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({
                                                      visualizationId: duplicateData.visualization.id,
                                                      position: { x: 0, y: 0, w: originalViz.defaultWidth || 6, h: originalViz.defaultHeight || 4 },
                                                      pageId: currentPageId || pages[0]?.id, // Assign to current page
                                                    }),
                                                  })

                                                  await fetchDashboard(selectedDashboard)
                                                  toast({
                                                    title: 'Success',
                                                    description: 'Chart duplicated',
                                                  })
                                                } catch (error: any) {
                                                  toast({
                                                    title: 'Error',
                                                    description: error.message || 'Failed to duplicate chart',
                                                    variant: 'destructive',
                                                  })
                                                }
                                              }}
                                            >
                                              <Copy className="h-4 w-4 mr-2" />
                                              Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={async () => {
                                                try {
                                                  const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}/visualizations`, {
                                                    method: 'DELETE',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ visualizationId: viz.id }),
                                                  }
                                                  )

                                                  if (!response.ok) throw new Error('Failed to remove visualization')

                                                  await fetchDashboard(selectedDashboard)
                                                  toast({
                                                    title: 'Success',
                                                    description: 'Chart removed from dashboard',
                                                  })
                                                } catch (error: any) {
                                                  toast({
                                                    title: 'Error',
                                                    description: error.message || 'Failed to remove visualization',
                                                    variant: 'destructive',
                                                  })
                                                }
                                              }}
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    {/* Show active filters */}
                                    {(() => {
                                      const config = typeof viz.config === 'string'
                                        ? (() => { try { return JSON.parse(viz.config) } catch { return {} } })()
                                        : (viz.config || {})
                                      const filters = config.filters || []
                                      if (filters.length > 0) {
                                        return (
                                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                                            <Filter className="h-3 w-3 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground">Filtered by:</span>
                                            {filters.map((filter: any, idx: number) => (
                                              <Badge key={idx} variant="secondary" className="text-xs h-5 px-1.5">
                                                {filter.field}
                                              </Badge>
                                            ))}
                                          </div>
                                        )
                                      }
                                      return null
                                    })()}
                                    <div className="flex-1 bg-muted/30 rounded-lg overflow-hidden relative" style={{ pointerEvents: 'auto', minHeight: '200px' }}>
                                      <VisualizationRenderer
                                        key={`${viz.id}-${JSON.stringify(viz.config)}`}
                                        visualization={viz}
                                        height={undefined}
                                        dashboardFilters={dashboardFilters}
                                        topBottomFilter={topBottomFilter}
                                        onDateHierarchyChange={async (visualizationId: string, level: 'year' | 'month' | 'day') => {
                                          try {
                                            const response = await fetch(`/api/reporting-engine/visualizations/${visualizationId}`)
                                            if (!response.ok) throw new Error('Failed to fetch visualization')

                                            const data = await response.json()
                                            const viz = data.visualization
                                            const config = typeof viz.config === 'string'
                                              ? (() => { try { return JSON.parse(viz.config) } catch { return {} } })()
                                              : (viz.config || {})

                                            // Update date hierarchy level
                                            const updatedConfig = {
                                              ...config,
                                              xAxis: {
                                                ...config.xAxis,
                                                dateHierarchyLevel: level
                                              }
                                            }

                                            const updateResponse = await fetch(`/api/reporting-engine/visualizations/${visualizationId}`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                ...viz,
                                                config: updatedConfig
                                              }),
                                            })

                                            if (updateResponse.ok) {
                                              if (selectedDashboard) {
                                                await fetchDashboard(selectedDashboard)
                                              }
                                            }
                                          } catch (error: any) {
                                            console.error('Error updating date hierarchy:', error)
                                            toast({
                                              title: 'Error',
                                              description: error.message || 'Failed to update date hierarchy',
                                              variant: 'destructive',
                                            })
                                          }
                                        }}
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ))
                        })()}
                        {/* Render text widgets */}
                        {(() => {
                          // Get first page ID for items without pageId
                          const firstPageId = pages.length > 0 ? pages[0].id : null

                          return textWidgets
                            .filter((widget: any) => {
                              // If no pageId, only show on first page
                              if (!widget.pageId) {
                                return currentPageId === firstPageId
                              }
                              // Otherwise show only on assigned page
                              return widget.pageId === currentPageId
                            })
                            .map((widget: any) => {
                              const dashboardLayout = typeof currentDashboard.layout === 'string'
                                ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                                : (currentDashboard.layout || {})
                              const widgetData = (dashboardLayout.items || []).find((item: any) => item.id === widget.id) || widget

                              const formatting = widgetData.formatting || {
                                fontSize: 14,
                                fontWeight: 'normal',
                                fontStyle: 'normal',
                                color: '#000000',
                                textAlign: 'left',
                                backgroundColor: 'transparent',
                              }

                              return (
                                <div
                                  key={widget.id}
                                  ref={(el) => registerExportRef(widget.id, el)}
                                  data-widget-id={widget.id}
                                  className="relative group h-full w-full"
                                >
                                  <Card className="h-full shadow-lg hover:shadow-xl transition-shadow border-2">
                                    <CardContent className="p-0 h-full flex flex-col relative">
                                      {/* Action buttons - only visible on hover */}
                                      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-md p-1.5 bg-background/80 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            setEditingTextWidget(widgetData)
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                          }}
                                          title="Edit text"
                                        >
                                          <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center rounded-md p-1.5 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground transition-colors shadow-sm"
                                          onClick={async (e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                            try {
                                              const currentLayout = typeof currentDashboard.layout === 'string'
                                                ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                                                : (currentDashboard.layout || {})

                                              const updatedItems = (currentLayout.items || []).filter((item: any) => item.id !== widget.id)

                                              const layoutData = {
                                                ...currentLayout,
                                                items: updatedItems,
                                              }

                                              const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ layout: layoutData }),
                                              })

                                              if (response.ok) {
                                                await fetchDashboard(selectedDashboard)
                                                toast({
                                                  title: 'Success',
                                                  description: 'Text widget removed',
                                                })
                                              } else {
                                                throw new Error('Failed to remove text widget')
                                              }
                                            } catch (error: any) {
                                              toast({
                                                title: 'Error',
                                                description: error.message || 'Failed to remove text widget',
                                                variant: 'destructive',
                                              })
                                            }
                                          }}
                                          onMouseDown={(e) => {
                                            e.stopPropagation()
                                            e.preventDefault()
                                          }}
                                          title="Remove text widget"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      </div>
                                      {/* Drag handle - invisible but functional */}
                                      <div className="absolute inset-0 drag-handle" style={{ cursor: 'move', zIndex: 1 }} />
                                      {/* Text content - touches boundaries */}
                                      <div
                                        className="h-full w-full overflow-auto"
                                        style={{
                                          fontSize: `${formatting.fontSize || 14}px`,
                                          fontWeight: formatting.fontWeight || 'normal',
                                          fontStyle: formatting.fontStyle || 'normal',
                                          color: formatting.color || '#000000',
                                          textAlign: formatting.textAlign || 'left',
                                          backgroundColor: formatting.backgroundColor === 'transparent' ? 'transparent' : (formatting.backgroundColor || 'transparent'),
                                          whiteSpace: 'pre-wrap',
                                          padding: '0',
                                        }}
                                      >
                                        {widgetData.content || 'Enter your text here'}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </div>
                              )
                            })
                        })()}
                      </ResponsiveGridLayout>
                    </ExportContext.Provider>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No charts yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add charts from the library or create new ones
                    </p>
                    <Button onClick={() => setShowLibrary(true)}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Browse Library
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Visualization Builder Modal */}
          {showVisualizationBuilder && (
            <VisualizationBuilder
              functionalArea={functionalArea}
              visualization={editingVisualization}
              onSave={async (viz) => {
                try {
                  // The VisualizationBuilder already handles the save
                  // If we have a selected dashboard and this is a new visualization (not editing), add it to the dashboard
                  if (selectedDashboard && viz && !editingVisualization) {
                    try {
                      // Get the saved visualization ID
                      const vizId = viz.id || (typeof viz === 'object' && viz.id)

                      if (vizId) {
                        // Add visualization to the current dashboard
                        const addResponse = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}/visualizations`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            visualizationId: vizId,
                            position: {
                              x: 0,
                              y: 0,
                              w: (typeof viz === 'object' && viz.defaultWidth) || 6,
                              h: (typeof viz === 'object' && viz.defaultHeight) || 4
                            },
                            pageId: currentPageId, // Assign to current page
                          }),
                        })

                        if (!addResponse.ok) {
                          const errorData = await addResponse.json().catch(() => ({}))
                          console.error('Failed to add visualization to dashboard:', errorData)
                          // Don't throw - visualization was created, just not added to dashboard
                          toast({
                            title: 'Visualization Created',
                            description: 'Visualization created but could not be added to dashboard. Please add it manually.',
                          })
                        }
                      }
                    } catch (addError) {
                      console.error('Error adding visualization to dashboard:', addError)
                      // Don't throw - visualization was created, just not added to dashboard
                      toast({
                        title: 'Visualization Created',
                        description: 'Visualization created but could not be added to dashboard. Please add it manually.',
                      })
                    }
                  }

                  setShowVisualizationBuilder(false)
                  setEditingVisualization(null)

                  // Refresh dashboard to show the new visualization
                  if (selectedDashboard) {
                    await fetchDashboard(selectedDashboard)
                  } else {
                    await fetchDashboards()
                  }
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to save visualization',
                    variant: 'destructive',
                  })
                }
              }}
              onCancel={() => {
                setShowVisualizationBuilder(false)
                setEditingVisualization(null)
              }}
            />
          )}

          {/* Visualization Details Dialog */}
          {viewingVisualization && (
            <VisualizationDetailsDialog
              open={!!viewingVisualization}
              visualization={viewingVisualization}
              onClose={() => setViewingVisualization(null)}
            />
          )}

          {/* Top/Bottom N Filter Dialog */}
          {showTopBottomFilter && (
            <Dialog open={showTopBottomFilter} onOpenChange={setShowTopBottomFilter}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Top/Bottom N Filter</DialogTitle>
                  <DialogDescription>
                    Filter all charts to show only the top or bottom N values based on a field
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Filter Type</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={topBottomFilter?.type === 'top' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setTopBottomFilter(prev => ({ type: 'top', n: prev?.n || 10, field: prev?.field || '' }))}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Top N
                      </Button>
                      <Button
                        type="button"
                        variant={topBottomFilter?.type === 'bottom' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setTopBottomFilter(prev => ({ type: 'bottom', n: prev?.n || 10, field: prev?.field || '' }))}
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Bottom N
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Number (N)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={topBottomFilter?.n || 10}
                      onChange={(e) => {
                        const n = parseInt(e.target.value) || 10
                        setTopBottomFilter(prev => ({ ...prev, n, type: prev?.type || 'top', field: prev?.field || '' }))
                      }}
                      placeholder="Enter number"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium mb-2 block">Field to Sort By</Label>
                    <Select
                      value={topBottomFilter?.field || ''}
                      onValueChange={(value) => {
                        setTopBottomFilter(prev => ({ ...prev, field: value, type: prev?.type || 'top', n: prev?.n || 10 }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFieldsForFilters.length > 0 ? (
                          availableFieldsForFilters.map((field) => (
                            <SelectItem key={field.name} value={field.name}>
                              {field.name}
                              {field.type && (
                                <span className="text-muted-foreground ml-2">({field.type})</span>
                              )}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No fields available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        setTopBottomFilter(null)
                        // Clear top/bottom filter from dashboard layout
                        if (selectedDashboard && currentDashboard) {
                          try {
                            const currentLayout = typeof currentDashboard.layout === 'string'
                              ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                              : (currentDashboard.layout || {})

                            const layoutWithoutTopBottom = {
                              ...currentLayout,
                              topBottomFilter: null,
                            }

                            await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ layout: layoutWithoutTopBottom }),
                            })

                            // Refresh dashboard
                            await fetchDashboard(selectedDashboard)
                          } catch (error: any) {
                            console.error('Error clearing top/bottom filter:', error)
                          }
                        }
                        setShowTopBottomFilter(false)
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={async () => {
                        if (topBottomFilter && topBottomFilter.field && topBottomFilter.n > 0) {
                          // Save top/bottom filter to dashboard layout
                          if (selectedDashboard && currentDashboard) {
                            try {
                              const currentLayout = typeof currentDashboard.layout === 'string'
                                ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                                : (currentDashboard.layout || {})

                              const layoutWithTopBottom = {
                                ...currentLayout,
                                topBottomFilter: topBottomFilter,
                              }

                              const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ layout: layoutWithTopBottom }),
                              })

                              if (response.ok) {
                                setShowTopBottomFilter(false)
                                // Refresh dashboard to apply filter
                                await fetchDashboard(selectedDashboard)
                              } else {
                                throw new Error('Failed to save top/bottom filter')
                              }
                            } catch (error: any) {
                              toast({
                                title: 'Error',
                                description: error.message || 'Failed to save top/bottom filter',
                                variant: 'destructive',
                              })
                            }
                          } else {
                            setShowTopBottomFilter(false)
                          }
                        }
                      }}
                      disabled={!topBottomFilter?.field || !topBottomFilter?.n || topBottomFilter.n <= 0}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Sort Chart Dialog */}
          {sortingChart && (
            <Dialog open={!!sortingChart} onOpenChange={(open) => {
              console.log('Sort dialog open state changed:', open)
              if (!open) setSortingChart(null)
            }}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Sort Chart Data</DialogTitle>
                  <DialogDescription>
                    Sort the chart data by a field in ascending or descending order
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  {(() => {
                    const config = typeof sortingChart.config === 'string'
                      ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                      : (sortingChart.config || {})
                    const xAxisField = config.xAxis?.field
                    const yAxisFields = config.yAxis?.fields || []
                    const dualAxisConfig = config.dualAxis
                    const allFields: string[] = []

                    if (xAxisField) allFields.push(xAxisField)
                    if (yAxisFields.length > 0) allFields.push(...yAxisFields)
                    if (dualAxisConfig) {
                      if (dualAxisConfig.leftAxis?.fields) allFields.push(...dualAxisConfig.leftAxis.fields)
                      if (dualAxisConfig.rightAxis?.fields) allFields.push(...dualAxisConfig.rightAxis.fields)
                    }

                    console.log('Sort dialog - available fields:', allFields, 'current config:', config)

                    if (allFields.length === 0) {
                      return (
                        <div className="text-sm text-muted-foreground p-4 text-center">
                          No fields available for sorting. Please configure X-axis or Y-axis fields first.
                        </div>
                      )
                    }

                    return null
                  })()}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Sort By Field</Label>
                    <Select
                      value={(() => {
                        const config = typeof sortingChart.config === 'string'
                          ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                          : (sortingChart.config || {})
                        return config.sort?.field || undefined
                      })()}
                      onValueChange={(value) => {
                        console.log('Sort field selected:', value)
                        const config = typeof sortingChart.config === 'string'
                          ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                          : (sortingChart.config || {})
                        const updatedConfig = {
                          ...config,
                          sort: {
                            ...config.sort,
                            field: value,
                            order: config.sort?.order || 'asc'
                          }
                        }
                        console.log('Updating sort config:', updatedConfig.sort)
                        setSortingChart({
                          ...sortingChart,
                          config: updatedConfig
                        })
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field to sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const config = typeof sortingChart.config === 'string'
                            ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                            : (sortingChart.config || {})
                          const xAxisField = config.xAxis?.field
                          const yAxisFields = config.yAxis?.fields || []
                          const dualAxisConfig = config.dualAxis
                          const allFields: string[] = []

                          if (xAxisField) allFields.push(xAxisField)
                          if (yAxisFields.length > 0) allFields.push(...yAxisFields)
                          if (dualAxisConfig) {
                            if (dualAxisConfig.leftAxis?.fields) allFields.push(...dualAxisConfig.leftAxis.fields)
                            if (dualAxisConfig.rightAxis?.fields) allFields.push(...dualAxisConfig.rightAxis.fields)
                          }

                          return allFields.map((field) => (
                            <SelectItem key={field} value={field}>
                              {field}
                            </SelectItem>
                          ))
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  {(() => {
                    const config = typeof sortingChart.config === 'string'
                      ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                      : (sortingChart.config || {})
                    const sortField = config.sort?.field

                    if (!sortField) return null

                    return (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Sort Order</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={config.sort?.order === 'asc' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => {
                              const config = typeof sortingChart.config === 'string'
                                ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                                : (sortingChart.config || {})
                              setSortingChart({
                                ...sortingChart,
                                config: {
                                  ...config,
                                  sort: {
                                    ...config.sort,
                                    field: config.sort?.field || '',
                                    order: 'asc'
                                  }
                                }
                              })
                            }}
                          >
                            <TrendingUp className="h-4 w-4 mr-2" />
                            Ascending
                          </Button>
                          <Button
                            type="button"
                            variant={config.sort?.order === 'desc' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => {
                              const config = typeof sortingChart.config === 'string'
                                ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                                : (sortingChart.config || {})
                              setSortingChart({
                                ...sortingChart,
                                config: {
                                  ...config,
                                  sort: {
                                    ...config.sort,
                                    field: config.sort?.field || '',
                                    order: 'desc'
                                  }
                                }
                              })
                            }}
                          >
                            <TrendingDown className="h-4 w-4 mr-2" />
                            Descending
                          </Button>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        // Clear sort
                        const config = typeof sortingChart.config === 'string'
                          ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                          : (sortingChart.config || {})
                        const { sort, ...configWithoutSort } = config

                        try {
                          const response = await fetch(`/api/reporting-engine/visualizations/${sortingChart.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              ...sortingChart,
                              config: configWithoutSort,
                            }),
                          })

                          if (response.ok) {
                            setSortingChart(null)
                            if (selectedDashboard) {
                              await fetchDashboard(selectedDashboard)
                            }
                          }
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to clear sort',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          // Ensure config is properly formatted
                          const config = typeof sortingChart.config === 'string'
                            ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                            : (sortingChart.config || {})

                          const payload = {
                            ...sortingChart,
                            config: config, // Send as object, API will handle serialization
                          }

                          console.log('Saving sort config:', {
                            visualizationId: sortingChart.id,
                            sortConfig: config.sort,
                            fullConfig: config
                          })

                          const response = await fetch(`/api/reporting-engine/visualizations/${sortingChart.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(payload),
                          })

                          if (response.ok) {
                            const result = await response.json()
                            console.log('Sort saved successfully:', result)
                            setSortingChart(null)
                            if (selectedDashboard) {
                              await fetchDashboard(selectedDashboard)
                            }
                          } else {
                            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                            console.error('Failed to save sort:', errorData)
                            throw new Error(errorData.error || 'Failed to save sort')
                          }
                        } catch (error: any) {
                          console.error('Error saving sort:', error)
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to save sort',
                            variant: 'destructive',
                          })
                        }
                      }}
                      disabled={!(() => {
                        const config = typeof sortingChart.config === 'string'
                          ? (() => { try { return JSON.parse(sortingChart.config) } catch { return {} } })()
                          : (sortingChart.config || {})
                        return config.sort?.field
                      })()}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Dashboard Filter Dialog */}
          {showDashboardFilters && (
            <Dialog open={showDashboardFilters} onOpenChange={setShowDashboardFilters}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Dashboard Filters
                  </DialogTitle>
                  <DialogDescription>
                    Add filters that will be applied to all charts in this dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <FilterBuilder
                    availableFields={availableFieldsForFilters}
                    filters={dashboardFilters}
                    onFiltersChange={setDashboardFilters}
                    title="Dashboard Filters"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDashboardFilters([])
                      setShowDashboardFilters(false)
                    }}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDashboardFilters(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        // Store filters in layout (preserving existing layout structure)
                        const currentLayout = typeof currentDashboard?.layout === 'string'
                          ? (() => {
                            try {
                              return JSON.parse(currentDashboard.layout)
                            } catch {
                              return { columns: 12, rowHeight: 80, items: [] }
                            }
                          })()
                          : (currentDashboard?.layout || { columns: 24, rowHeight: 60, items: [] })

                        // Preserve layout structure and add filters
                        const layoutWithFilters = {
                          ...currentLayout,
                          filters: dashboardFilters,
                        }

                        const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            layout: layoutWithFilters,
                          }),
                        })

                        if (response.ok) {
                          setShowDashboardFilters(false)
                          // Refresh dashboard to apply filters
                          if (selectedDashboard) {
                            await fetchDashboard(selectedDashboard)
                          }
                          toast({
                            title: 'Success',
                            description: 'Dashboard filters saved',
                          })
                        } else {
                          throw new Error('Failed to save filters')
                        }
                      } catch (error: any) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to save dashboard filters',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    Save Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Chart Formatting Dialog */}
          {formattingChart && (
            <ChartFormattingDialog
              open={!!formattingChart}
              visualization={formattingChart}
              onClose={async () => {
                setFormattingChart(null)
              }}
              onSave={async (formatting) => {
                // Save formatting when Apply button is clicked
                if (formattingChart) {
                  await handleSaveFormatting(formattingChart, formatting)
                  if (selectedDashboard) {
                    await fetchDashboard(selectedDashboard)
                  }
                }
              }}
              onFormattingChange={(formatting) => {
                // Update local state for live preview
                setVisualizations((prev) =>
                  prev.map((viz) =>
                    viz.id === formattingChart.id
                      ? {
                        ...viz,
                        config: {
                          ...(typeof viz.config === 'string'
                            ? (() => {
                              try {
                                return JSON.parse(viz.config)
                              } catch {
                                return {}
                              }
                            })()
                            : viz.config || {}),
                          formatting,
                        },
                      }
                      : viz
                  )
                )
              }}
            />
          )}

          {/* Fullscreen Chart Dialog */}
          {fullscreenChart && (
            <Dialog open={!!fullscreenChart} onOpenChange={(open) => !open && setFullscreenChart(null)}>
              <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <DialogTitle className="text-lg font-semibold">{fullscreenChart.name}</DialogTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setFullscreenChart(null)}
                      className="h-8 w-8"
                    >
                      <Minimize className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex-1 overflow-auto p-4">
                    <div className="h-full min-h-[600px]">
                      <VisualizationRenderer
                        visualization={fullscreenChart}
                        height={undefined}
                        dashboardFilters={dashboardFilters}
                        topBottomFilter={topBottomFilter}
                      />
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Add to Dashboard Dialog */}
          {addingToDashboardChart && (
            <AddToDashboardDialog
              open={!!addingToDashboardChart}
              visualization={addingToDashboardChart}
              existingDashboards={dashboards}
              functionalArea={functionalArea}
              onSuccess={async () => {
                if (selectedDashboard) {
                  await fetchDashboard(selectedDashboard)
                } else {
                  await fetchDashboards()
                }
              }}
              onClose={() => setAddingToDashboardChart(null)}
            />
          )}

          {/* Visualization Library */}
          {showLibrary && (
            <VisualizationLibrary
              functionalArea={functionalArea}
            />
          )}

          {/* Export Dialog */}
          {showExportDialog && (
            <DashboardExportDialog
              open={showExportDialog}
              onOpenChange={setShowExportDialog}
              dashboardName={currentDashboard?.name || 'Dashboard'}
              visualizations={visualizations}
              textWidgets={textWidgets}
              pages={pages}
              onExport={async (format, slides) => {
                try {
                  if (!selectedDashboard) {
                    toast({
                      title: 'Error',
                      description: 'Please select a dashboard first',
                      variant: 'destructive',
                    })
                    return
                  }

                  // Show loading toast
                  const loadingToast = toast({
                    title: 'Preparing export...',
                    description: 'Re-rendering charts at export resolution',
                  })

                  // Store original page to restore later
                  const originalPageId = currentPageId

                  // Capture one high-quality snapshot per page
                  const slidesWithImages = []

                  for (const slide of slides) {
                    // Switch to this slide's page
                    if (slide.id !== currentPageId) {
                      setCurrentPageId(slide.id)
                      // Wait for React to mount the page
                      await new Promise(resolve => setTimeout(resolve, 1000))
                    }

                    // Wait for charts to load on this page
                    const maxWaitTime = 15000
                    const checkInterval = 500
                    const startTime = Date.now()
                    while (Date.now() - startTime < maxWaitTime) {
                      if (checkAllChartsLoaded(slide.id)) {
                        break
                      }
                      await new Promise(resolve => setTimeout(resolve, checkInterval))
                    }
                    // Final wait for rendering
                    await new Promise(resolve => setTimeout(resolve, 500))

                    // Capture high-resolution full page image
                    const highResImage = await captureHighResImage(slide.id)

                    // Build items with positions (for reference, but we'll use full page image)
                    const pageLayouts = buildPageLayouts(slide.id, visualizations, textWidgets, pages)
                    const pageLayout = pageLayouts.lg || []

                    const itemsWithImages = slide.items.map((item) => {
                      const layoutItem = pageLayout.find(l => l.i === item.id)
                      const position = layoutItem
                        ? { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h }
                        : undefined
                      return {
                        ...item,
                        position,
                      }
                    })

                    slidesWithImages.push({
                      ...slide,
                      items: itemsWithImages,
                      exportImage: highResImage || undefined, // Full page high-res image
                    })
                  }

                  // Restore original page
                  if (originalPageId !== currentPageId) {
                    setCurrentPageId(originalPageId)
                    await new Promise(resolve => setTimeout(resolve, 300))
                  }

                  // Toast will auto-dismiss

                  // Call the export API with high-res images
                  const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}/export`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      format,
                      slides: slidesWithImages,
                    }),
                  })

                  if (!response.ok) {
                    const error = await response.json()
                    throw new Error(error.error || 'Failed to export dashboard')
                  }

                  // Get the blob and download it
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  const extension = format === 'pdf' ? 'pdf' : 'pptx'
                  a.download = `${currentDashboard?.name || 'dashboard'}-${new Date().toISOString().split('T')[0]}.${extension}`
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)

                  toast({
                    title: 'Success',
                    description: `Dashboard exported as ${format.toUpperCase()}`,
                  })
                } catch (error: any) {
                  toast({
                    title: 'Error',
                    description: error.message || 'Failed to export dashboard',
                    variant: 'destructive',
                  })
                }
              }}
            />
          )}

          {/* Edit Text Widget Dialog */}
          {editingTextWidget && (
            <Dialog open={!!editingTextWidget} onOpenChange={(open) => !open && setEditingTextWidget(null)}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Text Widget</DialogTitle>
                  <DialogDescription>
                    Enter or edit the text content and formatting for this widget
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div>
                    <Label htmlFor="text-content">Text Content</Label>
                    <Textarea
                      id="text-content"
                      value={editingTextWidget.content || ''}
                      onChange={(e) => {
                        setEditingTextWidget({
                          ...editingTextWidget,
                          content: e.target.value,
                        })
                      }}
                      rows={10}
                      className="mt-2"
                      placeholder="Enter your text here..."
                    />
                  </div>

                  {/* Formatting Options */}
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="text-sm font-semibold">Formatting Options</h3>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="font-size">Font Size (px)</Label>
                        <Input
                          id="font-size"
                          type="number"
                          min="8"
                          max="72"
                          value={editingTextWidget.formatting?.fontSize || 14}
                          onChange={(e) => {
                            setEditingTextWidget({
                              ...editingTextWidget,
                              formatting: {
                                ...(editingTextWidget.formatting || {}),
                                fontSize: parseInt(e.target.value) || 14,
                              },
                            })
                          }}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="text-align">Text Alignment</Label>
                        <Select
                          value={editingTextWidget.formatting?.textAlign || 'left'}
                          onValueChange={(value) => {
                            setEditingTextWidget({
                              ...editingTextWidget,
                              formatting: {
                                ...(editingTextWidget.formatting || {}),
                                textAlign: value,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="left">Left</SelectItem>
                            <SelectItem value="center">Center</SelectItem>
                            <SelectItem value="right">Right</SelectItem>
                            <SelectItem value="justify">Justify</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="font-weight">Font Weight</Label>
                        <Select
                          value={editingTextWidget.formatting?.fontWeight || 'normal'}
                          onValueChange={(value) => {
                            setEditingTextWidget({
                              ...editingTextWidget,
                              formatting: {
                                ...(editingTextWidget.formatting || {}),
                                fontWeight: value,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="300">Light</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semi Bold</SelectItem>
                            <SelectItem value="700">Bold</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="font-style">Font Style</Label>
                        <Select
                          value={editingTextWidget.formatting?.fontStyle || 'normal'}
                          onValueChange={(value) => {
                            setEditingTextWidget({
                              ...editingTextWidget,
                              formatting: {
                                ...(editingTextWidget.formatting || {}),
                                fontStyle: value,
                              },
                            })
                          }}
                        >
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="italic">Italic</SelectItem>
                            <SelectItem value="oblique">Oblique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="text-color">Text Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id="text-color"
                            type="color"
                            value={editingTextWidget.formatting?.color || '#000000'}
                            onChange={(e) => {
                              setEditingTextWidget({
                                ...editingTextWidget,
                                formatting: {
                                  ...(editingTextWidget.formatting || {}),
                                  color: e.target.value,
                                },
                              })
                            }}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={editingTextWidget.formatting?.color || '#000000'}
                            onChange={(e) => {
                              setEditingTextWidget({
                                ...editingTextWidget,
                                formatting: {
                                  ...(editingTextWidget.formatting || {}),
                                  color: e.target.value,
                                },
                              })
                            }}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="bg-color">Background Color</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Input
                            id="bg-color"
                            type="color"
                            value={editingTextWidget.formatting?.backgroundColor === 'transparent' ? '#ffffff' : (editingTextWidget.formatting?.backgroundColor || '#ffffff')}
                            onChange={(e) => {
                              setEditingTextWidget({
                                ...editingTextWidget,
                                formatting: {
                                  ...(editingTextWidget.formatting || {}),
                                  backgroundColor: e.target.value === '#ffffff' ? 'transparent' : e.target.value,
                                },
                              })
                            }}
                            className="w-16 h-10"
                          />
                          <Input
                            type="text"
                            value={editingTextWidget.formatting?.backgroundColor === 'transparent' ? 'transparent' : (editingTextWidget.formatting?.backgroundColor || 'transparent')}
                            onChange={(e) => {
                              setEditingTextWidget({
                                ...editingTextWidget,
                                formatting: {
                                  ...(editingTextWidget.formatting || {}),
                                  backgroundColor: e.target.value === 'transparent' || e.target.value === '' ? 'transparent' : e.target.value,
                                },
                              })
                            }}
                            placeholder="transparent or #hex"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setEditingTextWidget(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!selectedDashboard) return

                        try {
                          const currentLayout = typeof currentDashboard.layout === 'string'
                            ? (() => { try { return JSON.parse(currentDashboard.layout) } catch { return {} } })()
                            : (currentDashboard.layout || {})

                          const items = currentLayout.items || []
                          const updatedItems = items.map((item: any) =>
                            item.id === editingTextWidget.id
                              ? {
                                ...item,
                                content: editingTextWidget.content,
                                formatting: editingTextWidget.formatting || {},
                              }
                              : item
                          )

                          const layoutData = {
                            ...currentLayout,
                            items: updatedItems,
                          }

                          const response = await fetch(`/api/reporting-engine/dashboards/${selectedDashboard}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ layout: layoutData }),
                          })

                          if (response.ok) {
                            await fetchDashboard(selectedDashboard)
                            setEditingTextWidget(null)
                            toast({
                              title: 'Success',
                              description: 'Text widget updated',
                            })
                          } else {
                            throw new Error('Failed to update text widget')
                          }
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to update text widget',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}
    </div>
  )
}
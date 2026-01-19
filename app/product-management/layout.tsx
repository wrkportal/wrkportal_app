/**
 * Layout
 * 
 * This layout ensures the navbar appears on all pages
 */

'use client'

import { ProductManagementNavBar } from '@/components/product-management/product-management-nav-bar'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface Widget {
  id: string
  type: string
  visible: boolean
}

export default function ProductManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [widgets, setWidgets] = useState<Widget[]>([])

  // Determine if the current path is the main product-management dashboard
  const isProductManagementDashboard = pathname === '/product-management'

  // Load widgets from localStorage or default (only for main dashboard)
  useEffect(() => {
    if (isProductManagementDashboard) {
      const defaultWidgets: Widget[] = [
        { id: 'stats', type: 'stats', visible: true },
        { id: 'roadmap', type: 'roadmap', visible: true },
        { id: 'metrics', type: 'metrics', visible: true },
        { id: 'blockers', type: 'blockers', visible: true },
        { id: 'teamCapacity', type: 'teamCapacity', visible: true },
        { id: 'recentProjects', type: 'recentProjects', visible: false },
        { id: 'myTasks', type: 'myTasks', visible: false },
        { id: 'assignedToOthers', type: 'assignedToOthers', visible: false },
        { id: 'activeOKRs', type: 'activeOKRs', visible: false },
        { id: 'quickActions', type: 'quickActions', visible: false },
        { id: 'usefulLinks', type: 'usefulLinks', visible: false },
        { id: 'forms', type: 'forms', visible: false },
        { id: 'mindMap', type: 'mindMap', visible: false },
        { id: 'canvas', type: 'canvas', visible: false },
        { id: 'ganttChart', type: 'ganttChart', visible: false },
      ]

      const saved = localStorage.getItem('pm-widgets')
      if (saved) {
        try {
          const savedWidgets: Widget[] = JSON.parse(saved)
          const mergedWidgets = defaultWidgets.map(defaultWidget => {
            const savedWidget = savedWidgets.find(w => w.id === defaultWidget.id)
            return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
          })
          setWidgets(mergedWidgets)
        } catch (e) {
          console.error('Failed to load widget preferences', e)
          setWidgets(defaultWidgets)
        }
      } else {
        setWidgets(defaultWidgets)
      }
    }
  }, [isProductManagementDashboard])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (isProductManagementDashboard && widgets.length > 0) {
      localStorage.setItem('pm-widgets', JSON.stringify(widgets))
    }
  }, [widgets, isProductManagementDashboard])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar - appears on all pages */}
        {isProductManagementDashboard ? (
          // Pass widgets and toggleWidget only to the main dashboard's navbar
          <ProductManagementNavBar widgets={widgets} toggleWidget={toggleWidget} />
        ) : (
          // For subpages, render the navbar without widget controls
          <ProductManagementNavBar />
        )}
        
        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

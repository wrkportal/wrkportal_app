/**
 * Reporting Studio Layout
 * 
 * This layout ensures the navbar appears on all Reporting Studio pages
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ReportingStudioNavBar } from '@/components/reporting-studio/reporting-studio-nav-bar'

interface Widget {
  id: string
  type: string
  visible: boolean
}

export default function ReportingStudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [widgets, setWidgets] = useState<Widget[]>([])

  // Determine if the current path is the main reporting-studio dashboard
  const isReportingStudioDashboard = pathname === '/reporting-studio'

  // Load widgets from localStorage or default (only for main dashboard)
  useEffect(() => {
    if (isReportingStudioDashboard) {
      const defaultWidgets: Widget[] = [
        { id: 'stats', type: 'stats', visible: true },
        { id: 'invoices', type: 'invoices', visible: false },
        { id: 'forecast', type: 'forecast', visible: false },
        { id: 'expenses', type: 'expenses', visible: false },
        { id: 'roadmap', type: 'roadmap', visible: false },
        { id: 'metrics', type: 'metrics', visible: false },
        { id: 'blockers', type: 'blockers', visible: false },
        { id: 'teamCapacity', type: 'teamCapacity', visible: false },
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

      const saved = localStorage.getItem('reporting-studio-widgets')
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
  }, [isReportingStudioDashboard])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (isReportingStudioDashboard && widgets.length > 0) {
      localStorage.setItem('reporting-studio-widgets', JSON.stringify(widgets))
    }
  }, [widgets, isReportingStudioDashboard])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar - appears on all Reporting Studio pages */}
      {isReportingStudioDashboard ? (
        // Pass widgets and toggleWidget only to the main dashboard's navbar
        <ReportingStudioNavBar widgets={widgets} toggleWidget={toggleWidget} />
      ) : (
        // For subpages, render the navbar without widget controls
        <ReportingStudioNavBar />
      )}
      
      {/* Page content with proper spacing */}
      <div className="pt-4 sm:pt-6 lg:pt-8">
        {children}
      </div>
    </div>
  )
}


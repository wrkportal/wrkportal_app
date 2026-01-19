'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DeveloperPageLayout } from '@/components/developer/developer-page-layout'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Code, Plus } from 'lucide-react'

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultDeveloperWidgets: Widget[] = [
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'stats', type: 'stats', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
]

export default function DeveloperDashboardLandingPage() {
  const router = useRouter()
  const [widgets, setWidgets] = useState<Widget[]>(defaultDeveloperWidgets)

  useEffect(() => {
    const saved = localStorage.getItem('developer-widgets')
    if (saved) {
      try {
        const savedWidgets: Widget[] = JSON.parse(saved)
        setWidgets(savedWidgets)
      } catch (error) {
        console.error('Error loading developer widgets:', error)
      }
    }
  }, [])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets => {
      const updatedWidgets = prevWidgets.map(w =>
        w.id === widgetId ? { ...w, visible: !w.visible } : w
      )
      localStorage.setItem('developer-widgets', JSON.stringify(updatedWidgets))
      return updatedWidgets
    })
  }

  const hasVisibleWidgets = widgets.some(w => w.visible)

  // Empty State Component
  const EmptyState = () => {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="max-w-lg">
          <div className="mb-6">
            <LayoutGrid className="h-20 w-20 mx-auto text-muted-foreground/30" />
          </div>
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Developer Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Get started by adding widgets to track your development work.
          </p>
          <p className="text-muted-foreground mb-8">
            Add widgets to track sprints, repositories, pull requests, deployments, and more.
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                // Scroll to top to see the Widgets button in navbar, user can click it
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DeveloperPageLayout 
      widgets={widgets} 
      toggleWidget={toggleWidget}
    >
      {!hasVisibleWidgets ? (
        <EmptyState />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Developer Dashboard widgets coming soon...
        </div>
      )}
    </DeveloperPageLayout>
  )
}

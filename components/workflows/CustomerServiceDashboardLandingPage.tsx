'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerServicePageLayout } from '@/components/customer-service/customer-service-page-layout'
import { Button } from '@/components/ui/button'
import { LayoutGrid, Plus } from 'lucide-react'

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultCustomerServiceWidgets: Widget[] = [
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'stats', type: 'stats', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
]

export default function CustomerServiceDashboardLandingPage() {
  const router = useRouter()
  const [widgets, setWidgets] = useState<Widget[]>(defaultCustomerServiceWidgets)

  useEffect(() => {
    const saved = localStorage.getItem('customer-service-widgets')
    if (saved) {
      try {
        const savedWidgets: Widget[] = JSON.parse(saved)
        setWidgets(savedWidgets)
      } catch (error) {
        console.error('Error loading customer service widgets:', error)
      }
    }
  }, [])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets => {
      const existingWidget = prevWidgets.find(w => w.id === widgetId)
      let updatedWidgets: Widget[]
      
      if (existingWidget) {
        updatedWidgets = prevWidgets.map(w =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        )
      } else {
        updatedWidgets = [...prevWidgets, { id: widgetId, type: widgetId, visible: true }]
      }
      
      localStorage.setItem('customer-service-widgets', JSON.stringify(updatedWidgets))
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
          <h3 className="text-2xl font-semibold mb-3">Welcome to Your Customer Service Dashboard</h3>
          <p className="text-muted-foreground mb-2 text-lg">
            Get started by adding widgets to track customer support and service management.
          </p>
          <p className="text-muted-foreground mb-8">
            Add widgets to track tickets, cases, contact center activities, SLAs, and more.
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
    <CustomerServicePageLayout 
      widgets={widgets} 
      toggleWidget={toggleWidget}
    >
      {!hasVisibleWidgets ? (
        <EmptyState />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Customer Service Dashboard widgets coming soon...
        </div>
      )}
    </CustomerServicePageLayout>
  )
}

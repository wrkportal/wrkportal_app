'use client'

import { ReactNode } from 'react'
import { OperationsNavBar } from './operations-nav-bar'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface OperationsPageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function OperationsPageLayout({ children, title, description, widgets, toggleWidget }: OperationsPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar with Title and Tabs */}
        <OperationsNavBar widgets={widgets} toggleWidget={toggleWidget} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          {title && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}


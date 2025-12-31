'use client'

import { ReactNode } from 'react'
import { ITNavBar } from './it-nav-bar'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface ITPageLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  widgets?: Widget[]
  toggleWidget?: (widgetId: string) => void
}

export function ITPageLayout({ children, title, description, widgets, toggleWidget }: ITPageLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar with Title and Tabs */}
        <ITNavBar widgets={widgets} toggleWidget={toggleWidget} />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          {title && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}


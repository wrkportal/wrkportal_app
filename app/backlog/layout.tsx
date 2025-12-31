/**
 * Backlog Layout
 * 
 * This layout ensures the ProductManagementNavBar appears on all Backlog pages
 */

'use client'

import { ProductManagementNavBar } from '@/components/product-management/product-management-nav-bar'

export default function BacklogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar - appears on all Backlog pages */}
        <ProductManagementNavBar />
        
        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}


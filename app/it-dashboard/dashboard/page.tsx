'use client'

import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { ITNavBar } from '@/components/it/it-nav-bar'

export default function ITDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        <ITNavBar />
        <div className="flex-1 overflow-y-auto">
          <SectionDashboardPage functionalArea="IT" />
        </div>
      </main>
    </div>
  )
}

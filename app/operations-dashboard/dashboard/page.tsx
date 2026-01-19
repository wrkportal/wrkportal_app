'use client'

import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { OperationsNavBar } from '@/components/operations/operations-nav-bar'

export default function OperationsDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        <OperationsNavBar />
        <div className="flex-1 overflow-y-auto">
          <SectionDashboardPage functionalArea="OPERATIONS" />
        </div>
      </main>
    </div>
  )
}

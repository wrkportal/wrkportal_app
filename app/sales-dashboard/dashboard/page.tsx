'use client'

import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { SalesNavBar } from '@/components/sales/sales-nav-bar'

export default function SalesDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        <SalesNavBar />
        <div className="flex-1 overflow-y-auto">
          <SectionDashboardPage functionalArea="SALES" />
        </div>
      </main>
    </div>
  )
}

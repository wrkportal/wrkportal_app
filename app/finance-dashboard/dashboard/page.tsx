'use client'

import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'

export default function FinanceDashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        <FinanceNavBar />
        <div className="flex-1 overflow-y-auto">
          <SectionDashboardPage functionalArea="FINANCE" />
        </div>
      </main>
    </div>
  )
}

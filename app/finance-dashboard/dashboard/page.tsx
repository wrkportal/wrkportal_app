'use client'

import { Suspense } from 'react'
import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { Loader2 } from 'lucide-react'

function FinanceDashboardPageInner() {
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

export default function FinanceDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <FinanceDashboardPageInner />
    </Suspense>
  )
}

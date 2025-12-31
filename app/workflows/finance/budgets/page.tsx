'use client'

import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { BudgetsTab } from '@/components/finance/budgets-tab'

export default function BudgetsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <FinanceNavBar />

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 lg:py-6" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box', paddingLeft: '1rem', paddingRight: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '100%', overflow: 'hidden' }}>
            <BudgetsTab />
          </div>
        </div>
      </main>
    </div>
  )
}
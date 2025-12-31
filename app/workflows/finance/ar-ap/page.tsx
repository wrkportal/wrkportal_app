'use client'

import { FinanceNavBar } from '@/components/finance/finance-nav-bar'

export default function ARAPPage() {

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <FinanceNavBar />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">AR & AP Overview</h2>
            <p className="text-sm text-muted-foreground">
              Accounts Receivable and Accounts Payable tracking will be displayed here.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}


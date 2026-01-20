'use client'

import { Suspense } from 'react'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { InvoicesTab } from '@/components/finance/invoices-tab'
import { Loader2 } from 'lucide-react'

function InvoicesPageInner() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <FinanceNavBar />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          <InvoicesTab />
        </div>
      </main>
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <InvoicesPageInner />
    </Suspense>
  )
}

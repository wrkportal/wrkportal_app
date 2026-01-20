'use client'

import { Suspense } from 'react'
import { FinanceNavBar } from '@/components/finance/finance-nav-bar'
import { RateCardsTab } from '@/components/finance/rate-cards-tab'
import { Loader2 } from 'lucide-react'

function RateCardsPageInner() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full">
        {/* Top Bar */}
        <FinanceNavBar />

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          <RateCardsTab />
        </div>
      </main>
    </div>
  )
}

export default function RateCardsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <RateCardsPageInner />
    </Suspense>
  )
}

'use client'

import { Suspense } from 'react'
import FinanceDashboardLandingPage from '@/components/workflows/FinanceDashboardLandingPage'
import { Loader2 } from 'lucide-react'

function WrkboardPageInner() {
  return <FinanceDashboardLandingPage />
}

export default function WrkboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <WrkboardPageInner />
    </Suspense>
  )
}

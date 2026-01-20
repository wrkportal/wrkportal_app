'use client'

import { Suspense } from 'react'
import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { RecruitmentNavBar } from '@/components/recruitment/recruitment-nav-bar'
import { Loader2 } from 'lucide-react'

function RecruitmentDashboardPageInner() {
  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        <RecruitmentNavBar />
        <div className="flex-1 overflow-y-auto">
          <SectionDashboardPage functionalArea="RECRUITMENT" />
        </div>
      </main>
    </div>
  )
}

export default function RecruitmentDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <RecruitmentDashboardPageInner />
    </Suspense>
  )
}

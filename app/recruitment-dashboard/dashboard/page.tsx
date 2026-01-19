'use client'

import { SectionDashboardPage } from '@/components/reporting-engine/section-dashboard-page'
import { RecruitmentNavBar } from '@/components/recruitment/recruitment-nav-bar'

export default function RecruitmentDashboardPage() {
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

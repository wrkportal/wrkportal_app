'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { itSupportNavItems } from '@/lib/workflows/navigation'

export default function ITDeploymentsPage() {
  const stats = [
    { label: "Deployments Today", value: "6" },
    { label: "Failed", value: "1" },
    { label: "Rollback Triggered", value: "0" },
    { label: "Avg Deploy Time", value: "4.7 min" },
  ]

  const envs = ["Production", "Staging", "QA", "Dev"]

  const deployments = [
    {
      id: "DEP-2093",
      app: "Web Portal",
      env: "Production",
      version: "v3.18.4",
      status: "Success",
      time: "4 min",
      by: "Arjun",
    },
    {
      id: "DEP-2088",
      app: "API Gateway",
      env: "Staging",
      version: "v2.9.1",
      status: "In Progress",
      time: "—",
      by: "Priya",
    },
    {
      id: "DEP-2083",
      app: "Notifications Service",
      env: "QA",
      version: "v1.4.0",
      status: "Failed",
      time: "2 min",
      by: "You",
    },
    {
      id: "DEP-2079",
      app: "Mobile App",
      env: "Dev",
      version: "v5.2.7",
      status: "Success",
      time: "3 min",
      by: "Rohit",
    },
  ]

  const schedule = [
    { app: "Billing Service", env: "Production", at: "Today 7:30 PM" },
    { app: "Analytics Engine", env: "Staging", at: "Tomorrow 11:00 AM" },
    { app: "CRM Backend", env: "QA", at: "Tomorrow 3:45 PM" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkflowNavigation 
        items={itSupportNavItems}
        workflowName="Your systems. Your network. All under control."
        greeting="Hello IT Team,"
      />
      <div className="p-6 space-y-6">
        {/* Header - Sticky */}
        <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Deployment Center</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track live deployments, history, and schedules.</p>
            </div>

            <button className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-600">
              + New Deployment
            </button>
          </div>
        </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-xs shadow-sm">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
            <div className="text-lg font-semibold mt-1">{s.value}</div>
            <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
            </div>
          </div>
        ))}
      </section>

      {/* Deployments */}
      <section className="grid gap-4 xl:grid-cols-[2fr_1.2fr]">
        {/* Left: Deployment List */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent Deployments</h2>
            <div className="flex items-center gap-2 text-[11px] overflow-x-auto">
              {envs.map((e) => (
                <button
                  key={e}
                  className="px-2.5 py-1 rounded-full border border-border text-xs whitespace-nowrap hover:bg-muted text-muted-foreground"
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {deployments.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full border border-border text-[11px] bg-muted text-foreground">
                      {d.id}
                    </span>
                    <span className="text-foreground font-medium text-sm">{d.app}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] border ${
                      d.status === "Success"
                        ? "border-emerald-500/60 text-emerald-600 dark:text-emerald-300 bg-emerald-500/10"
                        : d.status === "In Progress"
                        ? "border-sky-500/60 text-sky-600 dark:text-sky-300 bg-sky-500/10"
                        : "border-rose-500/60 text-rose-600 dark:text-rose-300 bg-rose-500/10"
                    }`}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span>Env: {d.env}</span>
                    <span>Version: {d.version}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Time: {d.time}</span>
                    <span className="px-2 py-0.5 rounded-full border border-border bg-muted text-[10px]">
                      By: {d.by}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Schedule */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold">Upcoming Scheduled Deployments</h2>

          <div className="space-y-3 text-xs">
            {schedule.map((s) => (
              <div key={s.app} className="rounded-xl border border-border bg-muted/50 p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">{s.app}</span>
                  <span className="px-2 py-0.5 rounded-full border border-border bg-muted text-[10px]">{s.env}</span>
                </div>
                <span className="text-muted-foreground text-[11px]">Scheduled at: {s.at}</span>
              </div>
            ))}
          </div>

          <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
            [Deployment Calendar Placeholder]
          </div>
        </div>
      </section>

      <footer className="pt-2 pb-4 text-[11px] text-muted-foreground text-center">
        Safer deploys. Faster releases. Zero drama.
      </footer>
      </div>
    </div>
  )
}


'use client'

import Link from 'next/link'

export default function OperationalDashboardLandingPage() {
  const stats = [
    { label: "Open Tickets", value: "128" },
    { label: "SLA Breaches (24h)", value: "3" },
    { label: "Avg. Resolution Time", value: "3.4 hrs" },
    { label: "Automation Coverage", value: "42%" },
  ]

  const actions = [
    {
      title: "Review high-priority incident queue",
      type: "Incident",
      due: "Next 1 hour",
      priority: "High",
    },
    {
      title: "Approve changes for tonight's deployment",
      type: "Change",
      due: "Today, 6:00 PM",
      priority: "Medium",
    },
    {
      title: "Verify backlog clean-up for Ops Team B",
      type: "Review",
      due: "Tomorrow",
      priority: "Low",
    },
  ]

  const processHealth = [
    {
      stage: "Intake",
      count: 54,
      metric: "Avg: 12m",
    },
    {
      stage: "In Progress",
      count: 39,
      metric: "Avg: 2.1h",
    },
    {
      stage: "Waiting on Customer",
      count: 18,
      metric: "Avg: 7.3h",
    },
    {
      stage: "Pending Change",
      count: 9,
      metric: "Avg: 1.8h",
    },
    {
      stage: "Resolved (Today)",
      count: 31,
      metric: "Avg: 3.0h",
    },
  ]

  const criticalAccounts = [
    {
      name: "Acme Corp",
      status: "At Risk",
      activity: "2 open P1 incidents",
      sla: "SLA: 4h / 2.8h avg",
    },
    {
      name: "Nimbus Tech",
      status: "Stable",
      activity: "High ticket volume (32 this week)",
      sla: "SLA: 8h / 3.5h avg",
    },
    {
      name: "ZenFin Solutions",
      status: "Observe",
      activity: "Spike in login issues today",
      sla: "SLA: 2h / 1.6h avg",
    },
  ]

  const teamPerformance = [
    { name: "Ops Team A", metric: "SLA 96%", workload: 72 },
    { name: "Ops Team B", metric: "SLA 91%", workload: 63 },
    { name: "Ops Team C", metric: "SLA 88%", workload: 55 },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-16 z-10 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex flex-col gap-1 mr-auto">
            <div className="text-xs text-muted-foreground">Good afternoon,</div>
            <div className="text-base font-semibold tracking-tight">
              Running smooth, predictable operations today? ⚙️
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm overflow-x-auto pb-1">
            {[
              "Operations",
              "Workflows",
              "SLAs",
              "Queues",
              "Incidents",
              "Capacity",
              "Reports",
              "Teams",
              "Settings",
            ].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                className="px-3 py-1.5 rounded-xl hover:bg-muted text-muted-foreground whitespace-nowrap border border-border"
              >
                {item}
              </a>
            ))}
          </nav>
          <button className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-600">
            + New Work Item
          </button>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 space-y-6">
          {/* Row 1: Stats + Capacity / Risk Forecast */}
          <section className="grid gap-4 xl:gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg lg:text-xl font-semibold tracking-tight">
                    Today&apos;s operations snapshot
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Quick pulse on workload, risk, and SLA performance.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    Majority queues stable
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5 shadow-sm"
                  >
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-3/4 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Process health</h2>
                    <p className="text-xs text-muted-foreground">
                      Where your work is sitting along the lifecycle.
                    </p>
                  </div>
                  <button className="text-[11px] rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted">
                    View full workflow
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-5 text-xs">
                  {processHealth.map((p) => (
                    <div
                      key={p.stage}
                      className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col gap-1"
                    >
                      <div className="text-[11px] text-muted-foreground">{p.stage}</div>
                      <div className="text-sm font-semibold">{p.count} items</div>
                      <div className="text-[11px] text-muted-foreground">{p.metric}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-2/3 bg-indigo-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Capacity & risk (next 7 days)</h2>
                    <p className="text-xs text-muted-foreground">
                      Based on current queues, patterns, and staffing.
                    </p>
                  </div>
                </div>
                <div className="h-32 rounded-xl bg-muted border border-border flex items-center justify-center text-[11px] text-muted-foreground">
                  <span className="hidden sm:inline">
                    [Capacity & risk heatmap placeholder] — plug in Recharts / D3 in real app
                  </span>
                  <span className="sm:hidden">Capacity & risk chart</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div className="rounded-xl bg-muted/50 border border-border p-2">
                    <div className="text-muted-foreground">Peak Load</div>
                    <div className="text-sm font-semibold">Thu / 140%</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 border border-border p-2">
                    <div className="text-muted-foreground">Underutilised</div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      Sun / 58%
                    </div>
                  </div>
                  <div className="rounded-xl bg-muted/50 border border-border p-2">
                    <div className="text-muted-foreground">High Risk Queues</div>
                    <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                      3 queues
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">Smart operational nudges</div>
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 text-[10px] text-indigo-600 dark:text-indigo-300">
                    AI powered
                  </span>
                </div>
                <ul className="space-y-2">
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    <div>
                      <div className="text-foreground">
                        Queue &quot;Priority Incidents&quot; clears 40% faster with 1 extra analyst.
                      </div>
                      <div className="text-muted-foreground">
                        Consider reallocating 1 L1 from &quot;General Support&quot; for 4 hours.
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                    <div>
                      <div className="text-foreground">
                        SLA breach risk for &quot;Acme Corp&quot; increased in the last 2 hours.
                      </div>
                      <div className="text-muted-foreground">
                        Prioritise their open P1s before new intake.
                      </div>
                    </div>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-fuchsia-500 dark:bg-fuchsia-400" />
                    <div>
                      <div className="text-foreground">
                        Automation could handle ~23% of repetitive password reset tickets.
                      </div>
                      <div className="text-muted-foreground">
                        Set up a rule in the workflow engine this week.
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Row 2: Actions + Tools + Accounts + Teams */}
          <section className="grid gap-4 xl:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Today&apos;s operational actions</h2>
                    <p className="text-xs text-muted-foreground">
                      Move the needle by tackling these first.
                    </p>
                  </div>
                  <button className="text-[11px] rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted">
                    View full work queue
                  </button>
                </div>
                <div className="space-y-2">
                  {actions.map((a) => (
                    <div
                      key={a.title}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 flex items-start gap-3 text-xs"
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{a.title}</div>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] ${
                              a.priority === "High"
                                ? "border-rose-500/60 text-rose-600 dark:text-rose-300 bg-rose-500/10"
                                : a.priority === "Medium"
                                ? "border-amber-500/60 text-amber-600 dark:text-amber-300 bg-amber-500/10"
                                : "border-border text-muted-foreground bg-muted"
                            }`}
                          >
                            {a.priority} priority
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="rounded-full border border-border bg-muted px-2 py-0.5">
                            {a.type}
                          </span>
                          <span>{a.due}</span>
                        </div>
                      </div>
                      <button className="mt-1 text-[11px] rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20">
                        Mark done
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Ops tools</h2>
                    <p className="text-xs text-muted-foreground">
                      One-click utilities for day-to-day operations.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                  {[
                    "Reassign tickets",
                    "Create incident",
                    "Run playbook",
                    "Pause queue",
                    "Change calendar",
                    "View audit log",
                    "Export report",
                    "Edit workflow",
                  ].map((tool) => (
                    <button
                      key={tool}
                      className="rounded-xl border border-border bg-muted/50 px-2.5 py-2 text-left hover:bg-muted"
                    >
                      <div className="font-medium">{tool}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        1-tap access
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Critical accounts & queues</h2>
                    <p className="text-xs text-muted-foreground">
                      Where escalation and attention matter most.
                    </p>
                  </div>
                  <button className="text-[11px] rounded-full border border-border px-2.5 py-1 text-muted-foreground hover:bg-muted">
                    View all accounts
                  </button>
                </div>
                <div className="space-y-2 text-xs">
                  {criticalAccounts.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{c.name}</div>
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">{c.activity}</div>
                      <div className="text-[11px] text-muted-foreground">{c.sla}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Team load & SLA</h2>
                    <p className="text-xs text-muted-foreground">
                      Balance capacity while keeping promises to customers.
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/40 px-2 py-0.5 text-[10px] text-emerald-600 dark:text-emerald-300">
                    This week
                  </span>
                </div>
                <div className="space-y-2">
                  {teamPerformance.map((t, idx) => (
                    <div
                      key={t.name}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 flex items-center gap-3"
                    >
                      <div className="h-7 w-7 rounded-full bg-muted border border-border flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium flex items-center gap-1.5">
                            {t.name}
                          </div>
                          <div className="text-[11px]">{t.metric}</div>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                              style={{ width: `${t.workload}%` }}
                            />
                          </div>
                          <span>{t.workload}% load</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <footer className="pt-2 pb-4 text-[11px] text-muted-foreground flex items-center justify-between gap-2">
            <span>Built for Operational Leaders — not just dashboards.</span>
            <span className="hidden sm:inline">
              Plug this page into your Next.js app as <code>app/operations/page.tsx</code>.
            </span>
          </footer>
        </div>
      </main>
    </div>
  )
}



'use client'

export default function DeveloperDashboardLandingPage() {
  const stats = [
    { label: "Open PRs", value: "7" },
    { label: "Tickets Assigned", value: "14" },
    { label: "Build Success Rate", value: "94%" },
    { label: "Pending Code Reviews", value: "5" },
  ]

  const tasks = [
    {
      title: "Fix API throttling issue in User Service",
      type: "Bug",
      due: "Today, 4:00 PM",
      priority: "High",
    },
    {
      title: "Review PR #112 — Auth Refactor",
      type: "Code Review",
      due: "Today, 6:00 PM",
      priority: "Medium",
    },
    {
      title: "Write unit tests for Billing Module",
      type: "Task",
      due: "Tomorrow",
      priority: "Low",
    },
  ]

  const sprint = [
    {
      stage: "Backlog",
      count: 23,
      metric: "Untriaged",
    },
    {
      stage: "In Progress",
      count: 11,
      metric: "Avg: 2.8d",
    },
    {
      stage: "In Review",
      count: 5,
      metric: "Avg: 1.2d",
    },
    {
      stage: "QA Testing",
      count: 3,
      metric: "Avg: 3.4d",
    },
    {
      stage: "Ready to Deploy",
      count: 4,
      metric: "Waiting",
    },
  ]

  const repos = [
    {
      name: "Frontend Web App",
      activity: "2 open PRs • Last commit: 1 hr ago",
      branch: "main",
      health: "Stable",
    },
    {
      name: "Backend API Service",
      activity: "3 warnings in CI • 1 flaky test",
      branch: "develop",
      health: "Attention",
    },
    {
      name: "Mobile App",
      activity: "Build failing for 6 hrs",
      branch: "release",
      health: "Critical",
    },
  ]

  const leaderboard = [
    { name: "Priya", commits: 42, reviews: 18 },
    { name: "Arjun", commits: 35, reviews: 22 },
    { name: "You", commits: 29, reviews: 26 },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="sticky top-16 z-10 border-b border-border bg-background/80 backdrop-blur px-4 lg:px-8 py-3 flex items-center gap-6 flex-wrap">
          <div className="flex flex-col gap-1 mr-auto">
            <div className="text-xs text-muted-foreground">Hello Developer,</div>
            <div className="text-base font-semibold tracking-tight">
              Ready to ship something awesome today? 🚀
            </div>
          </div>
          <nav className="flex items-center gap-4 text-sm overflow-x-auto pb-1">
            {[
              "Dashboard",
              "Commits",
              "Code Reviews",
              "Tickets",
              "Sprint",
              "Deployments",
              "Errors",
              "Monitoring",
              "Docs",
              "Settings",
            ].map((item) => (
              <a
                key={item}
                href={`/${item.toLowerCase().replace(/ /g, "-")}`}
                className="px-3 py-1.5 rounded-xl hover:bg-muted text-muted-foreground whitespace-nowrap border border-border"
              >
                {item}
              </a>
            ))}
          </nav>
          <button className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white shadow-md hover:bg-indigo-600">
            + New Branch
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 space-y-6">
          {/* Row 1 — Stats + Build Health */}
          <section className="grid gap-4 xl:gap-6 xl:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
            <div className="space-y-4">
              <div>
                <h1 className="text-lg font-semibold">Dev Snapshot</h1>
                <p className="text-xs text-muted-foreground">Your engineering pulse for today.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5"
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Sprint Progress</h2>
                <p className="text-xs text-muted-foreground">Work items by stage.</p>
                <div className="grid gap-3 md:grid-cols-5 mt-3 text-xs">
                  {sprint.map((p) => (
                    <div
                      key={p.stage}
                      className="rounded-xl border border-border bg-muted/50 p-3 flex flex-col gap-1"
                    >
                      <div className="text-[11px] text-muted-foreground">{p.stage}</div>
                      <div className="text-sm font-semibold">{p.count} items</div>
                      <div className="text-[11px] text-muted-foreground">{p.metric}</div>
                      <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-1/2 bg-indigo-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Build / CI Status */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <h2 className="text-sm font-semibold">Build & CI Status</h2>
              <p className="text-xs text-muted-foreground">Latest runs from your pipelines.</p>
              <div className="h-32 rounded-xl border border-border bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                [CI/CD Chart Placeholder]
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="rounded-xl bg-muted/50 border border-border p-2">
                  <div className="text-muted-foreground">Builds (today)</div>
                  <div className="text-sm font-semibold">17</div>
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-2">
                  <div className="text-muted-foreground">Failures</div>
                  <div className="text-sm font-semibold text-rose-600 dark:text-rose-400">2</div>
                </div>
                <div className="rounded-xl bg-muted/50 border border-border p-2">
                  <div className="text-muted-foreground">Avg Runtime</div>
                  <div className="text-sm font-semibold">4.2m</div>
                </div>
              </div>
            </div>
          </section>

          {/* Row 2 — Tasks + Repo Health + Leaderboard */}
          <section className="grid gap-4 xl:gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
            {/* Tasks */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Today&apos;s Dev Tasks</h2>
                <div className="space-y-2 mt-2">
                  {tasks.map((t) => (
                    <div
                      key={t.title}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 flex items-start gap-3 text-xs"
                    >
                      <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{t.title}</div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              t.priority === "High"
                                ? "border border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                                : t.priority === "Medium"
                                ? "border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                : "border border-border bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex gap-2">
                          <span className="border border-border bg-muted px-2 py-0.5 rounded-full">
                            {t.type}
                          </span>
                          <span>{t.due}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Micro Tools */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Dev Tools</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] mt-2">
                  {[
                    "Open terminal",
                    "Run tests",
                    "Create branch",
                    "Lint code",
                    "Format repo",
                    "Scan security",
                    "Generate docs",
                    "View logs",
                  ].map((tool) => (
                    <button
                      key={tool}
                      className="rounded-xl border border-border bg-muted/50 px-2.5 py-2 text-left hover:bg-muted"
                    >
                      <div className="font-medium">{tool}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">1-tap access</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Repos + Leaderboard */}
            <div className="space-y-4">
              {/* Repo Health */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Repository Health</h2>
                <div className="space-y-2 mt-2">
                  {repos.map((r) => (
                    <div
                      key={r.name}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{r.name}</div>
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px]">
                          {r.health}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-1">{r.activity}</div>
                      <div className="text-muted-foreground text-[11px]">Branch: {r.branch}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard */}
              <div className="rounded-2xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Team Leaderboard</h2>
                <div className="space-y-2 mt-2 text-xs">
                  {leaderboard.map((dev, idx) => (
                    <div
                      key={dev.name}
                      className="rounded-xl border border-border bg-muted/50 px-3 py-2.5 flex items-center gap-3 text-xs"
                    >
                      <div className="h-7 w-7 border border-border rounded-full bg-muted flex items-center justify-center">
                        #{idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium flex items-center gap-2">
                            {dev.name}
                            {dev.name === "You" && (
                              <span className="text-[10px] rounded-full bg-indigo-500/20 border border-indigo-500/40 px-1.5 text-indigo-600 dark:text-indigo-300">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[11px]">
                            {dev.commits} commits
                          </div>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                              style={{ width: `${70 - idx * 15}%` }}
                            />
                          </div>
                          <span>{dev.reviews} reviews</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}



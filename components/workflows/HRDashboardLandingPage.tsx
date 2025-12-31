'use client'

export default function HRLandingPage() {
  const stats = [
    { label: "Total Employees", value: "110" },
    { label: "Open Roles", value: "14" },
    { label: "New Joiners (30d)", value: "9" },
    { label: "Attrition (QTD)", value: "3.8%" },
  ]

  const quickLinks = [
    "Employee Directory",
    "Hiring Pipeline",
    "Attendance",
    "Engagement",
    "Performance Mgmt",
    "Payroll",
    "Leaves & WFH",
    "Compliance",
    "HR Policies",
  ]

  const alerts = [
    {
      title: "5 background checks pending",
      detail: "Clear these before onboarding next week.",
      level: "High",
    },
    {
      title: "Policy update rollout in 3 days",
      detail: "Draft reviewed, awaiting approval.",
      level: "Medium",
    },
    {
      title: "3 employees nearing burnout risk",
      detail: "Flagged via engagement analytics.",
      level: "High",
    },
  ]

  const tasks = [
    { task: "Schedule L&D training", due: "Today" },
    { task: "Send offer letter to Ananya", due: "Tomorrow" },
    { task: "Prepare payroll inputs", due: "Friday" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      {/* Header - Sticky */}
      <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">HR Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your people. Your culture. All in one place.</p>
          </div>

        {/* Top Navigation */}
        <nav className="flex items-center gap-3 text-xs overflow-x-auto pb-1">
          {[
            "Dashboard",
            "Directory",
            "Hiring",
            "Attendance",
            "Engagement",
            "Performance",
            "Payroll",
            "Policies",
            "HR Ops",
          ].map((item) => (
            <a
              key={item}
              href={`/workflows/human-resources/${item.toLowerCase().replace(/ /g, "-")}`}
              className="px-3 py-1.5 rounded-xl hover:bg-muted text-muted-foreground whitespace-nowrap border border-border"
            >
              {item}
            </a>
          ))}
        </nav>

        <button className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-600">
          + Add Employee
        </button>
        </div>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm text-xs">
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</div>
            <div className="text-lg font-semibold mt-1">{s.value}</div>
            <div className="h-1.5 mt-2 rounded-full bg-muted overflow-hidden">
              <div className="w-3/4 h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
            </div>
          </div>
        ))}
      </section>

      {/* Alerts */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Important Alerts</h2>
        {alerts.map((a) => (
          <div
            key={a.title}
            className="rounded-xl border border-border bg-muted/50 p-4 text-xs flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <div className="text-foreground font-medium">{a.title}</div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] border ${
                  a.level === "High"
                    ? "border-rose-500/60 text-rose-600 dark:text-rose-300 bg-rose-500/10"
                    : a.level === "Medium"
                    ? "border-amber-500/60 text-amber-600 dark:text-amber-300 bg-amber-500/10"
                    : "border-slate-500 text-slate-600 dark:text-slate-300 bg-slate-700/20"
                }`}
              >
                {a.level}
              </span>
            </div>
            <div className="text-muted-foreground text-[11px]">{a.detail}</div>
          </div>
        ))}
      </section>

      {/* Quick Links */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          {quickLinks.map((l) => (
            <button
              key={l}
              className="rounded-xl border border-border bg-muted/50 px-3 py-3 text-left hover:bg-muted transition-colors"
            >
              <div className="text-foreground text-sm font-medium">{l}</div>
              <div className="text-[10px] text-muted-foreground">Open section</div>
            </button>
          ))}
        </div>
      </section>

      {/* Tasks */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Today's HR Tasks</h2>
        {tasks.map((t) => (
          <div
            key={t.task}
            className="rounded-xl border border-border bg-muted/50 p-4 text-xs flex justify-between items-center"
          >
            <div>
              <div className="text-foreground font-medium">{t.task}</div>
              <div className="text-muted-foreground text-[11px]">Due: {t.due}</div>
            </div>
            <button className="px-2 py-1 text-[11px] rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20">
              Mark Done
            </button>
          </div>
        ))}
      </section>

      <footer className="pt-4 pb-6 text-[11px] text-muted-foreground text-center">
        HR made simple, smart, and people-first.
      </footer>
    </div>
  )
}


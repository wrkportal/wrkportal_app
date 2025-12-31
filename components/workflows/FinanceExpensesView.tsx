'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { financeNavItems } from '@/lib/workflows/navigation'

export default function FinanceExpensesView() {
  const expenses = [
    { category: "Salaries", amount: "₹12.4L", trend: "Stable" },
    { category: "Marketing", amount: "₹4.8L", trend: "Increasing" },
    { category: "Cloud Infra", amount: "₹3.2L", trend: "Over Budget" },
    { category: "Travel & Events", amount: "₹1.4L", trend: "Increasing" },
    { category: "Software Subscriptions", amount: "₹2.1L", trend: "Stable" },
  ]

  const vendors = [
    { name: "AWS", spend: "₹1.8L", status: "High Usage" },
    { name: "Google Workspace", spend: "₹42K", status: "Normal" },
    { name: "HubSpot", spend: "₹58K", status: "High Usage" },
  ]

  const forecasts = [
    { label: "Next 30 Days", expected: "₹22.6L", risk: "Medium" },
    { label: "Quarter End", expected: "₹68.4L", risk: "High" },
    { label: "Year End", expected: "₹2.41Cr", risk: "Stable" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <WorkflowNavigation 
        items={financeNavItems}
        workflowName="Let's keep the money flowing—wisely. 💰📊"
        greeting="Hello Finance Team,"
      />
      <div className="p-8 space-y-6">
        {/* Header - Sticky */}
        <div className="sticky top-0 md:top-12 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-2 md:pt-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Expenses Overview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track expense categories, vendor spend, and budget forecast.</p>
            </div>
          </div>
        </div>

      {/* Expense Categories */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Expense Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {expenses.map((e) => (
            <div key={e.category} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-2">
              <div className="text-foreground text-sm font-medium">{e.category}</div>
              <div className="text-rose-600 dark:text-rose-300 text-base font-bold">{e.amount}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      e.trend === "Stable"
                        ? "bg-sky-500 dark:bg-sky-400"
                        : e.trend === "Increasing"
                        ? "bg-amber-500 dark:bg-amber-400"
                        : "bg-rose-500 dark:bg-rose-400"
                    }`}
                    style={{
                      width: e.trend === "Stable" ? "45%" : e.trend === "Increasing" ? "70%" : "85%",
                    }}
                  ></div>
                </div>
                <span className="text-[11px] text-muted-foreground">{e.trend}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Expenses Bar Chart Placeholder]
        </div>
      </section>

      {/* Vendor Spend */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Vendor Spend Overview</h2>
        {vendors.map((v) => (
          <div key={v.name} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{v.name}</span>
              <span className="text-foreground">{v.spend}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    v.status === "High Usage"
                      ? "bg-rose-500 dark:bg-rose-400"
                      : "bg-emerald-500 dark:bg-emerald-400"
                  }`}
                  style={{ width: v.status === "High Usage" ? "80%" : "50%" }}
                ></div>
              </div>
              <span>{v.status}</span>
            </div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Vendor Spend Chart Placeholder]
        </div>
      </section>

      {/* Expense Forecast */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Expense Forecast</h2>
        {forecasts.map((f) => (
          <div key={f.label} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{f.label}</span>
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full border ${
                  f.risk === "Low"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : f.risk === "Medium"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                }`}
              >
                {f.risk}
              </span>
            </div>
            <div className="mt-1 text-muted-foreground text-[11px]">Expected: {f.expected}</div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Forecast Curve Placeholder]
        </div>
      </section>
      </div>
    </div>
  )
}


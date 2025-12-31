'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { financeNavItems } from '@/lib/workflows/navigation'

export default function FinanceForecastingView() {
  const forecasts = [
    { period: "Next 30 Days", revenue: "₹61.8L", expenses: "₹22.6L", profit: "₹39.2L", risk: "Low" },
    { period: "Quarter End", revenue: "₹1.82Cr", expenses: "₹68.4L", profit: "₹1.14Cr", risk: "Medium" },
    { period: "Year End", revenue: "₹7.46Cr", expenses: "₹2.41Cr", profit: "₹5.05Cr", risk: "Stable" },
  ]

  const scenarios = [
    { name: "Optimistic", revenue: "₹8.2Cr", probability: 25 },
    { name: "Base Case", revenue: "₹7.46Cr", probability: 50 },
    { name: "Pessimistic", revenue: "₹6.8Cr", probability: 25 },
  ]

  const assumptions = [
    { factor: "Customer Growth Rate", value: "+12% MoM", impact: "High" },
    { factor: "Churn Rate", value: "3.2%", impact: "Medium" },
    { factor: "Average Revenue Per User", value: "₹8.4K", impact: "High" },
    { factor: "Market Conditions", value: "Stable", impact: "Low" },
  ]

  const milestones = [
    { date: "Q2 Launch", revenue: "₹2.1Cr", status: "On Track" },
    { date: "Q3 Expansion", revenue: "₹2.8Cr", status: "At Risk" },
    { date: "Q4 Scale", revenue: "₹3.2Cr", status: "On Track" },
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Financial Forecasting</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Revenue projections, scenario planning, and key assumptions.</p>
            </div>
          </div>
        </div>

      {/* Forecast Periods */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Forecast Periods</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecasts.map((f) => (
            <div key={f.period} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground text-sm font-medium">{f.period}</span>
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
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Revenue:</span>
                  <span className="text-foreground font-medium">{f.revenue}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Expenses:</span>
                  <span className="text-foreground font-medium">{f.expenses}</span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-border">
                  <span className="text-emerald-600 dark:text-emerald-300 font-medium">Profit:</span>
                  <span className="text-emerald-600 dark:text-emerald-300 font-bold">{f.profit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Forecast Timeline Chart Placeholder]
        </div>
      </section>

      {/* Scenario Planning */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Scenario Planning</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-2">
              <div className="text-foreground text-sm font-medium">{s.name}</div>
              <div className="text-indigo-600 dark:text-indigo-300 text-base font-bold">{s.revenue}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                    style={{ width: `${s.probability}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-muted-foreground">{s.probability}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Scenario Comparison Chart Placeholder]
        </div>
      </section>

      {/* Key Assumptions */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Key Assumptions</h2>
        {assumptions.map((a) => (
          <div key={a.factor} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{a.factor}</span>
              <span className="text-foreground">{a.value}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    a.impact === "High"
                      ? "bg-rose-500 dark:bg-rose-400"
                      : a.impact === "Medium"
                      ? "bg-amber-500 dark:bg-amber-400"
                      : "bg-emerald-500 dark:bg-emerald-400"
                  }`}
                  style={{ width: a.impact === "High" ? "80%" : a.impact === "Medium" ? "55%" : "35%" }}
                ></div>
              </div>
              <span>Impact: {a.impact}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Key Milestones */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Key Milestones</h2>
        {milestones.map((m) => (
          <div key={m.date} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{m.date}</span>
              <span className="text-foreground">{m.revenue}</span>
            </div>
            <div className="mt-2 flex items-center justify-end">
              <span
                className={`px-2 py-0.5 text-[10px] rounded-full border ${
                  m.status === "On Track"
                    ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                    : "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                }`}
              >
                {m.status}
              </span>
            </div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Milestone Timeline Chart Placeholder]
        </div>
      </section>
      </div>
    </div>
  )
}


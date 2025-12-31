'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { financeNavItems } from '@/lib/workflows/navigation'

export default function FinanceProfitabilityView() {
  const metrics = [
    { label: "Gross Margin", value: "68%" },
    { label: "Net Margin", value: "24%" },
    { label: "EBITDA", value: "₹18.6L" },
    { label: "COGS", value: "₹12.4L" },
  ]

  const products = [
    { name: "Sales CRM Suite", revenue: "₹18.1L", cost: "₹7.2L", margin: 60 },
    { name: "AI Outreach Add-on", revenue: "₹9.6L", cost: "₹3.9L", margin: 59 },
    { name: "Enterprise Suite", revenue: "₹12.3L", cost: "₹4.8L", margin: 61 },
  ]

  const departments = [
    { dept: "Engineering", spend: "₹8.2L", roi: "High" },
    { dept: "Sales", spend: "₹6.1L", roi: "Medium" },
    { dept: "Marketing", spend: "₹4.8L", roi: "Low" },
  ]

  const trends = [
    { month: "Jan", profit: "₹14.8L" },
    { month: "Feb", profit: "₹16.1L" },
    { month: "Mar", profit: "₹18.4L" },
    { month: "Apr", profit: "₹17.9L" },
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Profitability Overview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track net margins, product profitability, ROI, and trends.</p>
            </div>
          </div>
        </div>

      {/* Key Metrics */}
      <section className="rounded-2xl border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-1">
            <div className="text-muted-foreground text-[11px] uppercase">{m.label}</div>
            <div className="text-emerald-600 dark:text-emerald-300 text-lg font-bold">{m.value}</div>
          </div>
        ))}
      </section>

      {/* Product Profitability */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Product Profitability</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-2">
              <div className="text-foreground text-sm font-medium">{p.name}</div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Revenue: {p.revenue}</span>
                <span>Cost: {p.cost}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                    style={{ width: `${p.margin}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-muted-foreground">{p.margin}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Profit Contribution Pie Chart Placeholder]
        </div>
      </section>

      {/* Department ROI */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Department ROI</h2>
        {departments.map((d) => (
          <div key={d.dept} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{d.dept}</span>
              <span className="text-foreground">{d.spend}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    d.roi === "High"
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : d.roi === "Medium"
                      ? "bg-amber-500 dark:bg-amber-400"
                      : "bg-rose-500 dark:bg-rose-400"
                  }`}
                  style={{ width: d.roi === "High" ? "75%" : d.roi === "Medium" ? "55%" : "35%" }}
                ></div>
              </div>
              <span>{d.roi}</span>
            </div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [ROI Comparison Bar Chart Placeholder]
        </div>
      </section>

      {/* Profit Trends */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Profit Trends</h2>
        <div className="grid grid-cols-4 gap-4 text-xs">
          {trends.map((t) => (
            <div key={t.month} className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="text-foreground text-sm font-semibold">{t.month}</div>
              <div className="text-emerald-600 dark:text-emerald-300 text-lg font-bold">{t.profit}</div>
            </div>
          ))}
        </div>
        <div className="h-44 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Profit Line Chart Placeholder]
        </div>
      </section>
      </div>
    </div>
  )
}


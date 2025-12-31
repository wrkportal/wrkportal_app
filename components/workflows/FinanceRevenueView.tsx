'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { financeNavItems } from '@/lib/workflows/navigation'

export default function FinanceRevenueView() {
  const revenue = [
    { month: "Jan", amount: "₹38.4L", growth: "+12%" },
    { month: "Feb", amount: "₹41.2L", growth: "+7%" },
    { month: "Mar", amount: "₹46.8L", growth: "+14%" },
    { month: "Apr", amount: "₹44.1L", growth: "-5%" },
  ]

  const topClients = [
    { name: "Acme Corp", value: "₹12.4L", trend: "Up" },
    { name: "Nimbus Tech", value: "₹9.8L", trend: "Stable" },
    { name: "ZenFin Solutions", value: "₹7.2L", trend: "Up" },
  ]

  const products = [
    { name: "Sales CRM Suite", revenue: "₹18.1L", share: 42 },
    { name: "AI Outreach Add-on", revenue: "₹9.6L", share: 22 },
    { name: "Enterprise Suite", revenue: "₹12.3L", share: 36 },
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Revenue Overview</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Revenue trends, top clients, and product contribution insights.</p>
            </div>
          </div>
        </div>

      {/* Monthly Revenue */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-sm font-semibold mb-4">Monthly Revenue Trend</h2>
        <div className="grid grid-cols-4 gap-4 text-xs">
          {revenue.map((r) => (
            <div key={r.month} className="rounded-xl border border-border bg-muted/50 p-4">
              <div className="text-foreground text-sm font-semibold">{r.month}</div>
              <div className="text-indigo-600 dark:text-indigo-300 text-lg font-bold">{r.amount}</div>
              <div
                className={`text-[11px] ${
                  r.growth.startsWith("+")
                    ? "text-emerald-600 dark:text-emerald-300"
                    : "text-rose-600 dark:text-rose-300"
                }`}
              >
                {r.growth}
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 mt-4 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Revenue Line Chart Placeholder]
        </div>
      </section>

      {/* Top Clients */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Top Revenue Clients</h2>
        {topClients.map((c) => (
          <div key={c.name} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{c.name}</span>
              <span className="text-foreground">{c.value}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    c.trend === "Up"
                      ? "bg-emerald-500 dark:bg-emerald-400"
                      : "bg-slate-400 dark:bg-slate-500"
                  }`}
                  style={{ width: c.trend === "Up" ? "70%" : "45%" }}
                ></div>
              </div>
              <span>{c.trend}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Product Contribution */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-sm font-semibold">Product Revenue Contribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((p) => (
            <div key={p.name} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-2">
              <div className="text-foreground text-sm font-medium">{p.name}</div>
              <div className="text-indigo-600 dark:text-indigo-300 text-base font-bold">{p.revenue}</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                    style={{ width: `${p.share}%` }}
                  ></div>
                </div>
                <span className="text-[11px] text-muted-foreground">{p.share}%</span>
              </div>
            </div>
          ))}
        </div>
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Product Contribution Pie Chart Placeholder]
        </div>
      </section>
      </div>
    </div>
  )
}


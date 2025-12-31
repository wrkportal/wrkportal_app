'use client'

import { WorkflowNavigation } from '@/components/workflows/WorkflowNavigation'
import { financeNavItems } from '@/lib/workflows/navigation'

export default function FinanceARAPView() {
  const receivables = [
    { client: "Acme Corp", amount: "₹4.2L", due: "Overdue", age: "32 days" },
    { client: "Nimbus Tech", amount: "₹2.1L", due: "Due Soon", age: "5 days" },
    { client: "ZenFin", amount: "₹1.8L", due: "On Time", age: "1 day" },
  ]

  const payables = [
    { vendor: "AWS", amount: "₹1.2L", due: "In 3 days", priority: "High" },
    { vendor: "HubSpot", amount: "₹58K", due: "In 5 days", priority: "Medium" },
    { vendor: "Google Workspace", amount: "₹42K", due: "On Time", priority: "Low" },
  ]

  const summary = [
    { label: "Total Receivables", value: "₹42.6L" },
    { label: "Total Payables", value: "₹19.3L" },
    { label: "Net Cash Position", value: "₹23.3L" },
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
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Accounts Receivable & Accounts Payable</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Track receivables, payables, priority payments & cash position.</p>
            </div>
          </div>
        </div>

      {/* Summary */}
      <section className="rounded-2xl border border-border bg-card p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {summary.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-muted/50 p-4 text-xs space-y-1">
            <div className="text-muted-foreground text-[11px] uppercase">{s.label}</div>
            <div className="text-emerald-600 dark:text-emerald-300 text-lg font-bold">{s.value}</div>
          </div>
        ))}
      </section>

      {/* Accounts Receivable */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Accounts Receivable (AR)</h2>
        {receivables.map((r) => (
          <div key={r.client} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{r.client}</span>
              <span className="text-foreground">{r.amount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 text-muted-foreground">
              <span>{r.age}</span>
              <span
                className={`px-2 py-0.5 rounded-full border ${
                  r.due === "Overdue"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                    : r.due === "Due Soon"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                }`}
              >
                {r.due}
              </span>
            </div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Aging Buckets Chart Placeholder]
        </div>
      </section>

      {/* Accounts Payable */}
      <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <h2 className="text-sm font-semibold">Accounts Payable (AP)</h2>
        {payables.map((p) => (
          <div key={p.vendor} className="rounded-xl border border-border bg-muted/50 p-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground text-sm font-medium">{p.vendor}</span>
              <span className="text-foreground">{p.amount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-2 text-muted-foreground">
              <span>{p.due}</span>
              <span
                className={`px-2 py-0.5 rounded-full border ${
                  p.priority === "High"
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                    : p.priority === "Medium"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                    : "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                }`}
              >
                {p.priority}
              </span>
            </div>
          </div>
        ))}
        <div className="h-40 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground text-[11px]">
          [Upcoming Payments Timeline Placeholder]
        </div>
      </section>
      </div>
    </div>
  )
}


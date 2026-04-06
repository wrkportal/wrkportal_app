'use client'

import * as React from "react"
import { Command } from "cmdk"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, FolderKanban, Target, ListTodo, Users, Calendar,
  DollarSign, TrendingUp, Wrench, Monitor, Headphones, UserPlus,
  Brain, Settings, Search, Plus, Bell, FileText, BarChart3, Zap,
  MessagesSquare, Clock, Shield, BookOpen
} from "lucide-react"

interface CommandItem {
  id: string
  label: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
  category: string
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = (path: string) => {
    router.push(path)
    setOpen(false)
  }

  const commands: CommandItem[] = [
    // Quick Actions
    { id: "new-project", label: "Create New Project", icon: <Plus className="h-4 w-4" />, shortcut: "Ctrl+Shift+P", action: () => navigate("/projects/new"), category: "Quick Actions", keywords: ["add", "project", "create"] },
    { id: "new-task", label: "Create New Task", icon: <Plus className="h-4 w-4" />, shortcut: "Ctrl+Shift+T", action: () => navigate("/backlog/new"), category: "Quick Actions", keywords: ["add", "task", "todo"] },
    { id: "new-sprint", label: "Create New Sprint", icon: <Plus className="h-4 w-4" />, action: () => navigate("/sprints/new"), category: "Quick Actions", keywords: ["sprint", "iteration"] },
    { id: "search", label: "Search Everything", icon: <Search className="h-4 w-4" />, shortcut: "/", action: () => navigate("/search"), category: "Quick Actions", keywords: ["find", "search", "query"] },

    // Navigation — Dashboards
    { id: "home", label: "Home Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, action: () => navigate("/"), category: "Navigation", keywords: ["home", "main", "wrkboard"] },
    { id: "finance", label: "Finance Dashboard", icon: <DollarSign className="h-4 w-4" />, action: () => navigate("/finance-dashboard"), category: "Navigation", keywords: ["finance", "money", "budget", "accounting"] },
    { id: "sales", label: "Sales Dashboard", icon: <TrendingUp className="h-4 w-4" />, action: () => navigate("/sales-dashboard"), category: "Navigation", keywords: ["sales", "crm", "deals", "pipeline"] },
    { id: "operations", label: "Operations Dashboard", icon: <Wrench className="h-4 w-4" />, action: () => navigate("/operations-dashboard"), category: "Navigation", keywords: ["ops", "operations", "maintenance"] },
    { id: "it", label: "IT Services Dashboard", icon: <Monitor className="h-4 w-4" />, action: () => navigate("/it-dashboard"), category: "Navigation", keywords: ["it", "tech", "infrastructure"] },
    { id: "cs", label: "Customer Service", icon: <Headphones className="h-4 w-4" />, action: () => navigate("/customer-service-dashboard"), category: "Navigation", keywords: ["support", "customer", "tickets"] },
    { id: "recruitment", label: "Recruitment Dashboard", icon: <UserPlus className="h-4 w-4" />, action: () => navigate("/recruitment-dashboard"), category: "Navigation", keywords: ["hr", "hiring", "recruit", "jobs"] },
    { id: "developer", label: "Developer Dashboard", icon: <Monitor className="h-4 w-4" />, action: () => navigate("/developer-dashboard"), category: "Navigation", keywords: ["dev", "code", "engineering"] },

    // Navigation — Core
    { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" />, action: () => navigate("/projects"), category: "Navigation", keywords: ["project", "portfolio"] },
    { id: "okrs", label: "OKRs & Goals", icon: <Target className="h-4 w-4" />, action: () => navigate("/okrs"), category: "Navigation", keywords: ["okr", "goals", "objectives"] },
    { id: "tasks", label: "Backlog", icon: <ListTodo className="h-4 w-4" />, action: () => navigate("/backlog"), category: "Navigation", keywords: ["tasks", "backlog", "todo"] },
    { id: "sprints", label: "Sprints", icon: <Zap className="h-4 w-4" />, action: () => navigate("/sprints"), category: "Navigation", keywords: ["sprint", "iteration", "agile"] },
    { id: "teams", label: "Teams", icon: <Users className="h-4 w-4" />, action: () => navigate("/teams"), category: "Navigation", keywords: ["team", "people", "members"] },
    { id: "timesheets", label: "Timesheets", icon: <Clock className="h-4 w-4" />, action: () => navigate("/timesheets"), category: "Navigation", keywords: ["time", "hours", "log"] },
    { id: "reports", label: "Reports", icon: <BarChart3 className="h-4 w-4" />, action: () => navigate("/reports"), category: "Navigation", keywords: ["report", "analytics", "data"] },
    { id: "collaborate", label: "Collaborate", icon: <MessagesSquare className="h-4 w-4" />, action: () => navigate("/collaborate"), category: "Navigation", keywords: ["chat", "message", "collaborate"] },
    { id: "automations", label: "Automations", icon: <Zap className="h-4 w-4" />, action: () => navigate("/automations"), category: "Navigation", keywords: ["automation", "workflow", "rules"] },

    // AI Tools
    { id: "ai-assistant", label: "AI Assistant", icon: <Brain className="h-4 w-4" />, action: () => navigate("/ai-assistant"), category: "AI Tools", keywords: ["ai", "chat", "assistant", "help"] },
    { id: "ai-meeting", label: "Meeting Notes AI", icon: <FileText className="h-4 w-4" />, action: () => navigate("/ai-tools/meeting-notes"), category: "AI Tools", keywords: ["meeting", "notes", "summarize"] },
    { id: "ai-risk", label: "Risk Predictor", icon: <Shield className="h-4 w-4" />, action: () => navigate("/ai-tools/risk-predictor"), category: "AI Tools", keywords: ["risk", "predict", "alert"] },
    { id: "ai-status", label: "Status Report Generator", icon: <FileText className="h-4 w-4" />, action: () => navigate("/ai-tools/status-reports"), category: "AI Tools", keywords: ["status", "report", "generate"] },

    // Settings
    { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" />, action: () => navigate("/settings"), category: "Settings", keywords: ["settings", "preferences", "config"] },
    { id: "notifications", label: "Notifications", icon: <Bell className="h-4 w-4" />, action: () => navigate("/notifications"), category: "Settings", keywords: ["notifications", "alerts"] },
    { id: "profile", label: "My Profile", icon: <Users className="h-4 w-4" />, action: () => navigate("/profile"), category: "Settings", keywords: ["profile", "account", "me"] },
  ]

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-full max-w-[640px] px-4">
        <Command
          className="rounded-xl border shadow-2xl bg-popover text-popover-foreground overflow-hidden"
          loop
        >
          <div className="flex items-center border-b px-4">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Command.Input
              placeholder="Type a command or search..."
              className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              autoFocus
            />
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              ESC
            </kbd>
          </div>

          <Command.List className="max-h-[400px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </Command.Empty>

            {["Quick Actions", "Navigation", "AI Tools", "Settings"].map((category) => {
              const items = commands.filter((c) => c.category === category)
              if (items.length === 0) return null
              return (
                <Command.Group key={category} heading={category} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground">
                  {items.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                      onSelect={item.action}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm cursor-pointer aria-selected:bg-accent aria-selected:text-accent-foreground"
                    >
                      <span className="text-muted-foreground">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
                          {item.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>
              )
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  )
}

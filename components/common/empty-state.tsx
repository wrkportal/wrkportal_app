'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  FolderKanban, ListTodo, Users, Target, Calendar, FileText,
  Zap, BarChart3, MessagesSquare, Plus, ArrowRight, Lightbulb,
  TrendingUp, DollarSign, Headphones, UserPlus, Monitor, Wrench,
  BookOpen, Shield, Clock, Inbox, Search, Bell
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  secondaryActionLabel?: string
  secondaryActionHref?: string
  onSecondaryAction?: () => void
  tip?: string
  template?: string
  className?: string
}

// Pre-built icon map for common empty states
const emptyStateIcons: Record<string, React.ReactNode> = {
  projects: <FolderKanban className="h-12 w-12" />,
  tasks: <ListTodo className="h-12 w-12" />,
  teams: <Users className="h-12 w-12" />,
  okrs: <Target className="h-12 w-12" />,
  sprints: <Zap className="h-12 w-12" />,
  reports: <BarChart3 className="h-12 w-12" />,
  collaborate: <MessagesSquare className="h-12 w-12" />,
  timesheets: <Clock className="h-12 w-12" />,
  calendar: <Calendar className="h-12 w-12" />,
  documents: <FileText className="h-12 w-12" />,
  sales: <TrendingUp className="h-12 w-12" />,
  finance: <DollarSign className="h-12 w-12" />,
  support: <Headphones className="h-12 w-12" />,
  recruitment: <UserPlus className="h-12 w-12" />,
  it: <Monitor className="h-12 w-12" />,
  operations: <Wrench className="h-12 w-12" />,
  notifications: <Bell className="h-12 w-12" />,
  search: <Search className="h-12 w-12" />,
  inbox: <Inbox className="h-12 w-12" />,
  wiki: <BookOpen className="h-12 w-12" />,
  security: <Shield className="h-12 w-12" />,
  automations: <Zap className="h-12 w-12" />,
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  tip,
  template,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-6 text-center",
      className
    )}>
      {/* Icon with gradient background */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-xl scale-150" />
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 text-primary/60">
          {icon || <Inbox className="h-12 w-12" />}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-6 text-sm leading-relaxed">
        {description}
      </p>

      {/* Actions */}
      <div className="flex items-center gap-3 mb-6">
        {actionLabel && (
          <Button
            onClick={onAction}
            {...(actionHref ? { asChild: true } : {})}
          >
            <Plus className="h-4 w-4 mr-2" />
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
          >
            {secondaryActionLabel}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Template suggestion */}
      {template && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-2 mb-4">
          <FileText className="h-4 w-4" />
          <span>Start from a template: <strong className="text-foreground">{template}</strong></span>
        </div>
      )}

      {/* Pro tip */}
      {tip && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lightbulb className="h-3.5 w-3.5 text-yellow-500" />
          <span>{tip}</span>
        </div>
      )}
    </div>
  )
}

// Pre-configured empty states for common sections
export const emptyStates = {
  projects: {
    icon: emptyStateIcons.projects,
    title: "No projects yet",
    description: "Projects help you organize work, track progress, and collaborate with your team. Create your first project to get started.",
    actionLabel: "Create Project",
    actionHref: "/projects/new",
    template: "Agile Sprint Board",
    tip: "Use Ctrl+Shift+P to quickly create a new project",
  },
  tasks: {
    icon: emptyStateIcons.tasks,
    title: "Your backlog is empty",
    description: "Tasks and stories live here. Add items to your backlog, then prioritize and assign them to sprints.",
    actionLabel: "Create Task",
    actionHref: "/backlog/new",
    tip: "Use Ctrl+Shift+T to quickly create a new task",
  },
  sprints: {
    icon: emptyStateIcons.sprints,
    title: "No sprints planned",
    description: "Sprints help your team focus on a set of work for a fixed period. Plan your first sprint and assign tasks from the backlog.",
    actionLabel: "Plan Sprint",
    actionHref: "/sprints/new",
    tip: "Typical sprints are 1-2 weeks long",
  },
  okrs: {
    icon: emptyStateIcons.okrs,
    title: "No OKRs defined",
    description: "Objectives and Key Results align your team around measurable goals. Set organizational objectives and track progress with key results.",
    actionLabel: "Create OKR",
    tip: "Start with 3-5 objectives per quarter for best results",
  },
  teams: {
    icon: emptyStateIcons.teams,
    title: "No teams created",
    description: "Teams help you organize people and manage capacity. Create teams that mirror your organization structure.",
    actionLabel: "Create Team",
    actionHref: "/teams/new",
  },
  timesheets: {
    icon: emptyStateIcons.timesheets,
    title: "No time entries this week",
    description: "Log your time against projects and tasks to track effort, billable hours, and team capacity.",
    actionLabel: "Log Time",
    tip: "Submit timesheets weekly for accurate reporting",
  },
  reports: {
    icon: emptyStateIcons.reports,
    title: "No reports generated",
    description: "Generate reports to analyze project progress, team performance, financial metrics, and more.",
    actionLabel: "Create Report",
    template: "Weekly Status Report",
  },
  collaborate: {
    icon: emptyStateIcons.collaborate,
    title: "No collaboration spaces",
    description: "Create spaces for your teams to communicate, share files, and stay aligned on work.",
    actionLabel: "Create Space",
    tip: "Create channels for projects, departments, or topics",
  },
  notifications: {
    icon: emptyStateIcons.notifications,
    title: "All caught up!",
    description: "You have no new notifications. We'll let you know when something needs your attention.",
  },
  search: {
    icon: emptyStateIcons.search,
    title: "No results found",
    description: "Try different keywords or check your spelling. You can also use filters to narrow down your search.",
    tip: "Use Ctrl+K to open the command palette for quick navigation",
  },
  leads: {
    icon: emptyStateIcons.sales,
    title: "No leads yet",
    description: "Leads are potential customers interested in your product. Add leads manually or import them from a CSV file.",
    actionLabel: "Add Lead",
    template: "B2B Lead Template",
  },
  opportunities: {
    icon: emptyStateIcons.sales,
    title: "No opportunities in pipeline",
    description: "Opportunities represent potential deals. Move qualified leads here to track them through your sales pipeline.",
    actionLabel: "Create Opportunity",
  },
  tickets: {
    icon: emptyStateIcons.support,
    title: "No open tickets",
    description: "Great news! There are no open support tickets. New tickets from customers will appear here.",
  },
  candidates: {
    icon: emptyStateIcons.recruitment,
    title: "No candidates yet",
    description: "Candidates will appear here as they apply for your open positions. You can also add candidates manually.",
    actionLabel: "Add Candidate",
  },
  automations: {
    icon: emptyStateIcons.automations,
    title: "No automations running",
    description: "Automations save time by handling repetitive tasks. Set rules like 'When a task is overdue, notify the assignee'.",
    actionLabel: "Create Automation",
    template: "Overdue Task Alerts",
  },
}

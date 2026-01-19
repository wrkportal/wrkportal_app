'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  LayoutGrid, 
  Search, 
  BarChart3, 
  TrendingUp, 
  FileText, 
  TrendingDown, 
  Map, 
  AlertTriangle, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  UserCheck, 
  Target, 
  Link as LinkIcon, 
  ClipboardList, 
  Network, 
  Palette,
  DollarSign,
  Calendar,
  Clock,
  Filter,
  PieChart,
  Calendar as CalendarIcon,
  HelpCircle,
} from 'lucide-react'

interface Widget {
  id: string
  type: string
  visible: boolean
}

interface WidgetGalleryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  widgets: Widget[]
  toggleWidget: (widgetId: string) => void
}

// Widget metadata with icons, descriptions, and color themes
const widgetMetadata: Record<string, { 
  icon: any; 
  title: string; 
  description: string; 
  category: string;
  color: string; // Tailwind color class for the card border/background
  iconBg: string; // Tailwind color class for icon background
}> = {
  stats: {
    icon: BarChart3,
    title: 'Summary Statistics',
    description: 'Key financial metrics and KPIs at a glance',
    category: 'Overview',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  },
  invoices: {
    icon: FileText,
    title: 'Invoices',
    description: 'Track pending and overdue invoices',
    category: 'Overview',
    color: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    iconBg: 'bg-green-500/15 text-green-600 dark:text-green-400'
  },
  forecast: {
    icon: TrendingUp,
    title: 'Forecast',
    description: 'AI-powered revenue and expense forecasting',
    category: 'Analytics',
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
  },
  expenses: {
    icon: TrendingDown,
    title: 'Expenses Breakdown',
    description: 'Detailed expense analysis by category',
    category: 'Overview',
    color: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    iconBg: 'bg-red-500/15 text-red-600 dark:text-red-400'
  },
  roadmap: {
    icon: Map,
    title: 'Roadmap Items',
    description: 'Strategic initiatives and milestones',
    category: 'Planning',
    color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
  },
  metrics: {
    icon: TrendingUp,
    title: 'Key Delivery Metrics',
    description: 'Performance indicators and benchmarks',
    category: 'Analytics',
    color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
  },
  blockers: {
    icon: AlertTriangle,
    title: 'Top Blockers',
    description: 'Critical issues requiring attention',
    category: 'Issues',
    color: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
    iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
  },
  teamCapacity: {
    icon: Users,
    title: 'Team Capacity & Load',
    description: 'Resource utilization and availability',
    category: 'Resources',
    color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/30',
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
  },
  recentProjects: {
    icon: Briefcase,
    title: 'Recent Projects',
    description: 'Latest project updates and status',
    category: 'Projects',
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  },
  myTasks: {
    icon: CheckCircle2,
    title: 'My Tasks',
    description: 'Tasks assigned to you',
    category: 'Tasks',
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  assignedToOthers: {
    icon: UserCheck,
    title: 'Assigned to Others',
    description: 'Tasks you assigned to team members',
    category: 'Tasks',
    color: 'border-pink-500 bg-pink-50 dark:bg-pink-950/30',
    iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400'
  },
  activeOKRs: {
    icon: Target,
    title: 'Active OKRs',
    description: 'Objectives and key results tracking',
    category: 'Goals',
    color: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
  },
  quickActions: {
    icon: LayoutGrid,
    title: 'Quick Actions',
    description: 'Common actions and shortcuts',
    category: 'Tools',
    color: 'border-slate-500 bg-slate-50 dark:bg-slate-950/30',
    iconBg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
  },
  usefulLinks: {
    icon: LinkIcon,
    title: 'Useful Links',
    description: 'Quick access to frequently used resources',
    category: 'Tools',
    color: 'border-sky-500 bg-sky-50 dark:bg-sky-950/30',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
  },
  forms: {
    icon: ClipboardList,
    title: 'Forms',
    description: 'Create and manage custom forms',
    category: 'Tools',
    color: 'border-lime-500 bg-lime-50 dark:bg-lime-950/30',
    iconBg: 'bg-lime-500/15 text-lime-600 dark:text-lime-400'
  },
  mindMap: {
    icon: Network,
    title: 'Mind Map',
    description: 'Visual brainstorming and idea mapping',
    category: 'Tools',
    color: 'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-950/30',
    iconBg: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400'
  },
  canvas: {
    icon: Palette,
    title: 'Canvas',
    description: 'Interactive drawing and annotation board',
    category: 'Tools',
    color: 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  },
  ganttChart: {
    icon: BarChart3,
    title: 'Gantt Chart',
    description: 'Project timeline and schedule visualization',
    category: 'Planning',
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
  },
  // Sales Metrics
  'metric-totalSales': {
    icon: DollarSign,
    title: 'Total Sales',
    description: 'Total revenue from won deals',
    category: 'Sales',
    color: 'border-green-500 bg-green-50 dark:bg-green-950/30',
    iconBg: 'bg-green-500/15 text-green-600 dark:text-green-400'
  },
  'metric-winRate': {
    icon: TrendingUp,
    title: 'Win Rate',
    description: 'Percentage of deals won vs lost',
    category: 'Sales',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  },
  'metric-closeRate': {
    icon: Target,
    title: 'Close Rate',
    description: 'Percentage of deals closed',
    category: 'Sales',
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
  },
  'metric-avgDaysToClose': {
    icon: Calendar,
    title: 'Avg Days to Close',
    description: 'Average time to close a deal',
    category: 'Sales',
    color: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30',
    iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400'
  },
  'metric-pipelineValue': {
    icon: Briefcase,
    title: 'Pipeline Value',
    description: 'Total value of open opportunities',
    category: 'Sales',
    color: 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30',
    iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
  },
  'metric-openDeals': {
    icon: Target,
    title: 'Open Deals',
    description: 'Number of active opportunities',
    category: 'Sales',
    color: 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30',
    iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
  },
  'metric-weightedValue': {
    icon: TrendingUp,
    title: 'Weighted Value',
    description: 'Pipeline value weighted by probability',
    category: 'Sales',
    color: 'border-teal-500 bg-teal-50 dark:bg-teal-950/30',
    iconBg: 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
  },
  'metric-avgOpenDealAge': {
    icon: Clock,
    title: 'Avg Open Deal Age',
    description: 'Average age of open opportunities',
    category: 'Sales',
    color: 'border-pink-500 bg-pink-50 dark:bg-pink-950/30',
    iconBg: 'bg-pink-500/15 text-pink-600 dark:text-pink-400'
  },
  // Sales Charts
  'chart-wonDeals': {
    icon: BarChart3,
    title: 'Won Deals',
    description: 'Won deals trend over the last 12 months',
    category: 'Sales',
    color: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
  },
  'chart-projection': {
    icon: TrendingUp,
    title: 'Deals Projection',
    description: 'Future revenue projection for next 12 months',
    category: 'Sales',
    color: 'border-violet-500 bg-violet-50 dark:bg-violet-950/30',
    iconBg: 'bg-violet-500/15 text-violet-600 dark:text-violet-400'
  },
  'chart-pipeline': {
    icon: PieChart,
    title: 'Sales Pipeline',
    description: 'Pipeline distribution by stage',
    category: 'Sales',
    color: 'border-rose-500 bg-rose-50 dark:bg-rose-950/30',
    iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
  },
  'chart-lossReasons': {
    icon: AlertTriangle,
    title: 'Deal Loss Reasons',
    description: 'Analysis of why deals were lost',
    category: 'Sales',
    color: 'border-red-500 bg-red-50 dark:bg-red-950/30',
    iconBg: 'bg-red-500/15 text-red-600 dark:text-red-400'
  },
  // Sales Tools
  'filters': {
    icon: Filter,
    title: 'Filters',
    description: 'Filter dashboard data by various criteria',
    category: 'Tools',
    color: 'border-slate-500 bg-slate-50 dark:bg-slate-950/30',
    iconBg: 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
  },
  'schedule': {
    icon: CalendarIcon,
    title: 'Schedule',
    description: 'View and manage your meetings and activities',
    category: 'Tools',
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
  },
  'help': {
    icon: HelpCircle,
    title: 'Help & Support',
    description: 'Get help and access support resources',
    category: 'Tools',
    color: 'border-gray-500 bg-gray-50 dark:bg-gray-950/30',
    iconBg: 'bg-gray-500/15 text-gray-600 dark:text-gray-400'
  },
}

const categories = ['All', 'Overview', 'Sales', 'Analytics', 'Planning', 'Projects', 'Tasks', 'Goals', 'Resources', 'Issues', 'Tools']

export function WidgetGalleryDialog({ open, onOpenChange, widgets, toggleWidget }: WidgetGalleryDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Filter widgets based on search and category
  const filteredWidgets = widgets.filter((widget) => {
    const metadata = widgetMetadata[widget.type]
    if (!metadata) return false

    const matchesSearch = 
      metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metadata.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = selectedCategory === 'All' || metadata.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group widgets by category
  const widgetsByCategory = filteredWidgets.reduce((acc, widget) => {
    const metadata = widgetMetadata[widget.type]
    if (!metadata) return acc

    const category = metadata.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({ widget, metadata })
    return acc
  }, {} as Record<string, Array<{ widget: Widget; metadata: any }>>)

  // Sort categories by number of widgets (descending - most widgets first)
  const sortedCategories = Object.entries(widgetsByCategory).sort((a, b) => b[1].length - a[1].length)

  const visibleCount = widgets.filter(w => w.visible).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Customize Dashboard
          </DialogTitle>
          <DialogDescription className="text-sm mt-2">
            Choose which widgets to display on your dashboard. {visibleCount} of {widgets.length} widgets are currently visible.
          </DialogDescription>
        </DialogHeader>

        {/* Search and Filter */}
        <div className="space-y-3 px-6 pt-4 pb-3 border-b bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 bg-background text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="h-7 text-xs px-2.5"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="flex-1 overflow-y-auto px-6">
          {selectedCategory === 'All' ? (
            // Show widgets grouped by category
            <div className="space-y-6 py-4">
              {sortedCategories.map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {items.map(({ widget, metadata }) => {
                      const Icon = metadata.icon
                      return (
                        <div
                          key={widget.id}
                          className={`
                            relative p-2 border-2 rounded-lg transition-all cursor-pointer group flex flex-col
                            ${widget.visible 
                              ? `border-primary ${metadata.color} shadow-md hover:shadow-lg` 
                              : 'border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm'
                            }
                          `}
                          onClick={() => toggleWidget(widget.id)}
                        >
                          <div className="flex items-center justify-between gap-1.5 mb-1">
                            <h4 className="font-semibold text-xs leading-tight flex-1 min-w-0">{metadata.title}</h4>
                            <Switch
                              checked={widget.visible}
                              onCheckedChange={() => toggleWidget(widget.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 scale-[0.5]"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                            {metadata.description}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Show widgets for selected category only
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 py-4">
              {filteredWidgets.map((widget) => {
                const metadata = widgetMetadata[widget.type]
                if (!metadata) return null
                const Icon = metadata.icon
                
                return (
                  <div
                    key={widget.id}
                    className={`
                      relative p-2 border-2 rounded-lg transition-all cursor-pointer group flex flex-col
                      ${widget.visible 
                        ? `border-primary ${metadata.color} shadow-md hover:shadow-lg` 
                        : 'border-border hover:border-primary/50 hover:bg-accent/50 hover:shadow-sm'
                      }
                    `}
                    onClick={() => toggleWidget(widget.id)}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1">
                      <h4 className="font-semibold text-xs leading-tight flex-1 min-w-0">{metadata.title}</h4>
                      <Switch
                        checked={widget.visible}
                        onCheckedChange={() => toggleWidget(widget.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0 scale-[0.5]"
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2">
                      {metadata.description}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {filteredWidgets.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center py-8">
              <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">No widgets found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/30">
          <div className="text-sm text-muted-foreground">
            {visibleCount} widget{visibleCount !== 1 ? 's' : ''} visible
          </div>
          <Button onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


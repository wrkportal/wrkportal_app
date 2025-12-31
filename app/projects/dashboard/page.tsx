'use client'

import React, { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  Filter,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  DollarSign,
  Sparkles,
  Loader2,
  BarChart3,
  Kanban,
  Calendar,
  FileText,
  RefreshCw,
  Download,
  X,
  Plus,
  List,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { formatDate, formatCurrency } from "@/lib/utils"
import { GanttChart } from "@/components/roadmap/gantt-chart"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { GripVertical, Eye, EyeOff, Maximize2, Settings2 } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { useWorkflowTerminology } from "@/hooks/useWorkflowTerminology"
import { WorkflowType } from "@/lib/workflows/terminology"
import { MethodologyType } from "@/lib/workflows/methodologies"
import { getAvailableWidgets, getDefaultWidgetsForWorkflow, getWidgetConfig } from "@/lib/workflows/widgets"
import { SprintBoardWidget, SalesPipelineWidget, CampaignPerformanceWidget, TicketQueueWidget } from "@/components/workflows/widgets"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  name: string
  visible: boolean
}

export default function ProjectDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const { workflowType: contextWorkflowType } = useWorkflowTerminology()
  const [isLoading, setIsLoading] = useState(true)
  const [projects, setProjects] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [selectedView, setSelectedView] = useState<'overview' | 'gantt' | 'kanban'>('overview')

  // Workflow state
  const currentWorkflowType = (user?.primaryWorkflowType as WorkflowType) || contextWorkflowType || WorkflowType.GENERAL

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [ragStatusFilter, setRagStatusFilter] = useState<string>('all')
  const [programFilter, setProgramFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // AI Briefing
  const [dailyBriefing, setDailyBriefing] = useState<string | null>(null)
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [approvals, setApprovals] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showWidgetSelector, setShowWidgetSelector] = useState(false)

  // My Tasks widget state
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL')
  const [taskDueDateFilter, setTaskDueDateFilter] = useState<string>('ALL')
  const [showTaskFilters, setShowTaskFilters] = useState(false)
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Widget configuration - workflow-aware
  const getDefaultWidgets = (): Widget[] => {
    const availableWidgets = getAvailableWidgets(currentWorkflowType)
    const defaultWidgetIds = getDefaultWidgetsForWorkflow(currentWorkflowType)

    // Create widget list from available widgets, marking defaults as visible
    const widgetList = availableWidgets.map(widget => ({
      id: widget.id,
      name: widget.name,
      visible: defaultWidgetIds.includes(widget.id),
    }))

    console.log('Default widgets for workflow:', currentWorkflowType, widgetList)
    return widgetList
  }

  const [widgets, setWidgets] = useState<Widget[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`project-dashboard-widgets-${currentWorkflowType}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Validate that saved widgets are still available for current workflow
          const availableWidgets = getAvailableWidgets(currentWorkflowType)
          const availableWidgetIds = availableWidgets.map(w => w.id)
          const savedWidgets = parsed.filter((w: Widget) => availableWidgetIds.includes(w.id))

          // Add any new available widgets that aren't in saved list
          const savedWidgetIds = savedWidgets.map((w: Widget) => w.id)
          const newWidgets = availableWidgets
            .filter(w => !savedWidgetIds.includes(w.id))
            .map(w => ({
              id: w.id,
              name: w.name,
              visible: false, // New widgets start as hidden
            }))

          return [...savedWidgets, ...newWidgets]
        } catch (e) {
          return getDefaultWidgets()
        }
      }
    }
    return getDefaultWidgets()
  })

  // Update widgets when workflow changes
  useEffect(() => {
    const availableWidgetIds = getAvailableWidgets(currentWorkflowType).map(w => w.id)
    setWidgets(prev => {
      // Keep existing widgets that are still available, add new defaults
      const existing = prev.filter(w => availableWidgetIds.includes(w.id))
      const existingIds = existing.map(w => w.id)
      const defaultIds = getDefaultWidgetsForWorkflow(currentWorkflowType)
      const newWidgets = getAvailableWidgets(currentWorkflowType)
        .filter(w => !existingIds.includes(w.id))
        .map(w => ({
          id: w.id,
          name: w.name,
          visible: defaultIds.includes(w.id),
        }))
      return [...existing, ...newWidgets]
    })
  }, [currentWorkflowType])

  // Handle widget selection from URL parameter
  useEffect(() => {
    if (!isLoading) { // Only run after initial load
      const widgetParam = searchParams?.get('widget')
      if (widgetParam) {
        console.log('Processing widget from URL:', widgetParam, 'for workflow:', currentWorkflowType)
        // Check if widget is available for current workflow
        const availableWidgets = getAvailableWidgets(currentWorkflowType)
        console.log('Available widgets:', availableWidgets.map(w => w.id))
        const widgetExists = availableWidgets.some(w => w.id === widgetParam)
        console.log('Widget exists:', widgetExists)

        if (widgetExists) {
          // Make sure widget is in the list and visible
          setWidgets(prev => {
            const existingWidget = prev.find(w => w.id === widgetParam)

            // If widget already exists and is visible, no need to update
            if (existingWidget && existingWidget.visible) {
              return prev
            }

            let updated: Widget[]

            if (existingWidget) {
              // Widget exists but not visible, make it visible
              updated = prev.map(w =>
                w.id === widgetParam ? { ...w, visible: true } : w
              )
            } else {
              // Widget doesn't exist, add it as visible
              const widgetConfig = getWidgetConfig(widgetParam, currentWorkflowType)
              if (widgetConfig) {
                updated = [...prev, {
                  id: widgetConfig.id,
                  name: widgetConfig.name,
                  visible: true,
                }]
              } else {
                return prev
              }
            }

            // Save to localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem(`project-dashboard-widgets-${currentWorkflowType}`, JSON.stringify(updated))
            }

            console.log('Updated widgets list:', updated)
            return updated
          })

          // Ensure layout includes the widget - update layouts immediately
          setLayouts(prev => {
            const currentLayout = prev.lg || []
            const widgetInLayout = currentLayout.some(l => l.i === widgetParam)

            if (!widgetInLayout) {
              // Add widget to layout
              const maxY = currentLayout.length > 0
                ? Math.max(...currentLayout.map(l => l.y + l.h), 0)
                : 0

              const newLayoutItem: Layout = {
                i: widgetParam,
                x: 0,
                y: maxY + 1,
                w: 12,
                h: 3,
                minW: 6,
                minH: 2,
              }

              const updated = {
                ...prev,
                lg: [...currentLayout, newLayoutItem]
              }

              // Save to localStorage
              if (typeof window !== 'undefined') {
                localStorage.setItem(`project-dashboard-layouts-${currentWorkflowType}`, JSON.stringify(updated))
              }

              console.log('Updated layouts with widget:', updated)
              return updated
            }
            console.log('Widget already in layout')
            return prev
          })

          // Open widget selector to show the widget is selected
          setTimeout(() => {
            setShowWidgetSelector(true)
          }, 100)

          // Remove widget param from URL after handling
          setTimeout(() => {
            const url = new URL(window.location.href)
            url.searchParams.delete('widget')
            router.replace(url.pathname + url.search)
          }, 1500) // Give time for state to update and widget to render
        }
      }
    }
  }, [searchParams, currentWorkflowType, router, isLoading])

  // Layout configuration - workflow-aware defaults
  const getDefaultLayouts = (): Layouts => {
    const defaultWidgetIds = getDefaultWidgetsForWorkflow(currentWorkflowType)
    const layouts: Layout[] = []
    let y = 0

    defaultWidgetIds.forEach((widgetId, index) => {
      const widgetConfig = getWidgetConfig(widgetId)
      if (widgetConfig) {
        // Determine size based on widget type
        let w = 12
        let h = 3

        // Special sizing for certain widgets
        if (widgetId === 'summary-stats') {
          h = 2
        } else if (widgetId.includes('chart') || widgetId.includes('board')) {
          h = 4
        } else if (widgetId === 'project-cards' || widgetId === 'daily-briefing') {
          h = 5
        }

        layouts.push({
          i: widgetId,
          x: 0,
          y: y,
          w: w,
          h: h,
          minW: 6,
          minH: 2,
        })
        y += h + 1 // Add spacing
      }
    })

    return { lg: layouts }
  }

  const defaultLayouts = getDefaultLayouts()

  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`project-dashboard-layouts-${currentWorkflowType}`)
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch (e) {
          return defaultLayouts
        }
      }
    }
    return defaultLayouts
  })

  // Update layouts when workflow changes
  useEffect(() => {
    const saved = localStorage.getItem(`project-dashboard-layouts-${currentWorkflowType}`)
    if (!saved) {
      setLayouts(getDefaultLayouts())
    }
  }, [currentWorkflowType])

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save widget visibility to localStorage (workflow-specific)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`project-dashboard-widgets-${currentWorkflowType}`, JSON.stringify(widgets))
    }
  }, [widgets, currentWorkflowType])

  // Save layouts to localStorage (workflow-specific)
  const handleLayoutChange = (layout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    if (typeof window !== 'undefined') {
      localStorage.setItem(`project-dashboard-layouts-${currentWorkflowType}`, JSON.stringify(allLayouts))
    }
  }

  // Compute complete layout ensuring all visible widgets have entries
  const computedLayouts = useMemo(() => {
    const visibleWidgetIds = widgets.filter(w => w.visible).map(w => w.id)
    const currentLayout = layouts.lg || []
    const layoutWidgetIds = currentLayout.map(item => item.i)

    // Find widgets that are visible but don't have layout entries
    const missingWidgets = visibleWidgetIds.filter(id => !layoutWidgetIds.includes(id))

    if (missingWidgets.length === 0) {
      return layouts
    }

    const newLayoutItems: Layout[] = []
    const currentMaxY = currentLayout.length > 0
      ? Math.max(...currentLayout.map(item => item.y + item.h), 0)
      : 0

    missingWidgets.forEach((widgetId, index) => {
      // Check if widget has a default layout
      const defaultLayout = defaultLayouts.lg?.find(item => item.i === widgetId)
      if (defaultLayout) {
        newLayoutItems.push({
          ...defaultLayout,
          y: currentMaxY + (index * 4) // Stack them with spacing
        })
      } else {
        // Default size matching filter section: w: 12, h: 3 (360px with rowHeight 120)
        newLayoutItems.push({
          i: widgetId,
          x: 0,
          y: currentMaxY + (index * 4),
          w: 12,
          h: 3,
          minW: 6,
          minH: 2
        })
      }
    })

    return {
      ...layouts,
      lg: [...currentLayout, ...newLayoutItems]
    }
  }, [widgets, layouts, defaultLayouts])

  // Save computed layout to state when it includes new widgets
  useEffect(() => {
    const currentLayoutCount = (layouts.lg || []).length
    const computedLayoutCount = (computedLayouts.lg || []).length

    if (computedLayoutCount > currentLayoutCount) {
      setLayouts(computedLayouts)
      if (typeof window !== 'undefined') {
        localStorage.setItem('project-dashboard-layouts', JSON.stringify(computedLayouts))
      }
    }
  }, [computedLayouts, layouts])

  // Toggle widget visibility
  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ))
  }

  // Reset layout to default (workflow-specific)
  const resetLayout = () => {
    const newLayouts = getDefaultLayouts()
    setLayouts(newLayouts)
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`project-dashboard-layouts-${currentWorkflowType}`)
    }
  }

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (ragStatusFilter !== 'all') params.append('ragStatus', ragStatusFilter)
      if (programFilter !== 'all') params.append('programId', programFilter)

      const response = await fetch(`/api/projects/dashboard?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
        setSummary(data.summary || {})
        setPrograms(data.programs || [])
        setApprovals(data.approvals || [])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, ragStatusFilter, programFilter])

  // Fetch user's tasks for My Tasks widget
  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks?includeCreated=true')
      if (response.ok) {
        const data = await response.json()
        setUserTasks(data.tasks || [])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  useEffect(() => {
    if (user) {
      fetchTasks()
    }
  }, [user])

  const generateDailyBriefing = async (projectId?: string) => {
    setIsGeneratingBriefing(true)
    try {
      const response = await fetch('/api/ai/projects/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      })

      if (response.ok) {
        const data = await response.json()
        if (typeof data.briefing === 'string') {
          setDailyBriefing(data.briefing)
        } else if (data.briefing && typeof data.briefing === 'object') {
          const briefing = data.briefing
          let formattedBriefing = `Overview:\n${briefing.overview || 'No overview available.'}\n\n`

          if (briefing.keyChanges && briefing.keyChanges.length > 0) {
            formattedBriefing += `Key Changes:\n${briefing.keyChanges.map((item: string) => `• ${item}`).join('\n')}\n\n`
          }

          if (briefing.upcomingDeadlines && briefing.upcomingDeadlines.length > 0) {
            formattedBriefing += `Upcoming Deadlines:\n${briefing.upcomingDeadlines.map((item: string) => `• ${item}`).join('\n')}\n\n`
          }

          if (briefing.risksAndIssues && briefing.risksAndIssues.length > 0) {
            formattedBriefing += `Risks & Issues:\n${briefing.risksAndIssues.map((item: string) => `• ${item}`).join('\n')}\n\n`
          }

          if (briefing.actionItems && briefing.actionItems.length > 0) {
            formattedBriefing += `Action Items:\n${briefing.actionItems.map((item: string) => `• ${item}`).join('\n')}`
          }

          setDailyBriefing(formattedBriefing)
        } else {
          setDailyBriefing('No briefing data available.')
        }
        setSelectedProjectId(projectId || null)
      }
    } catch (error) {
      console.error('Error generating briefing:', error)
      alert('Failed to generate daily briefing. Please try again.')
    } finally {
      setIsGeneratingBriefing(false)
    }
  }

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      project.name.toLowerCase().includes(query) ||
      project.code.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    )
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-slate-100 text-slate-700 border-slate-300',
      IN_PROGRESS: 'bg-blue-100 text-blue-700 border-blue-300',
      ON_HOLD: 'bg-amber-100 text-amber-700 border-amber-300',
      COMPLETED: 'bg-green-100 text-green-700 border-green-300',
      CANCELLED: 'bg-red-100 text-red-700 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getRAGColor = (ragStatus: string) => {
    switch (ragStatus) {
      case 'GREEN': return 'bg-green-500'
      case 'AMBER': return 'bg-amber-500'
      case 'RED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  // Render widget function
  function renderWidget(widgetId: string) {
    switch (widgetId) {
      case 'summary-stats':
        if (!summary) return null
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalProjects}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.activeProjects} active
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalTasks}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.overdueTasks} overdue
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Risks</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRisks}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.criticalRisks} critical
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalIssues}</div>
                <p className="text-xs text-muted-foreground">
                  {summary.openIssues} open
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'daily-briefing':
        return (
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <CardTitle>AI Daily Briefing</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateDailyBriefing()}
                    disabled={isGeneratingBriefing}
                  >
                    {isGeneratingBriefing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        All Projects
                      </>
                    )}
                  </Button>
                  {dailyBriefing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDailyBriefing(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <CardDescription>
                Get AI-generated summary of what changed across all your projects today
              </CardDescription>
            </CardHeader>
            {dailyBriefing && (
              <CardContent>
                <div className="prose max-w-none p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="whitespace-pre-wrap text-sm">{dailyBriefing}</div>
                </div>
              </CardContent>
            )}
          </Card>
        )

      case 'project-cards':
        if (filteredProjects.length > 0) {
          return (
            <div className="space-y-4 h-full overflow-auto">
              {filteredProjects.map(project => (
                <Card
                  key={project.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">{project.name}</CardTitle>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <div className={`w-3 h-3 rounded-full ${getRAGColor(project.ragStatus)}`} />
                        </div>
                        <CardDescription>{project.code}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Tasks</span>
                          </div>
                          <div className="font-semibold">
                            {project.stats.tasks.completed}/{project.stats.tasks.total}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Risks</span>
                          </div>
                          <div className="font-semibold">
                            {project.stats.risks.total}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        }
        return (
          <Card>
            <CardContent className="py-12 text-center">
              <LayoutDashboard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
            </CardContent>
          </Card>
        )

      case 'budget-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Overview
              </CardTitle>
              <CardDescription>
                Budget allocation and utilization across projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetChart projects={filteredProjects} summary={summary} />
            </CardContent>
          </Card>
        )

      case 'risk-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Risk Distribution
              </CardTitle>
              <CardDescription>
                Risk levels and status across all projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RiskChart projects={filteredProjects} />
            </CardContent>
          </Card>
        )

      case 'issues-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Challenges & Issues
              </CardTitle>
              <CardDescription>
                Open issues and challenges by severity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IssuesChart projects={filteredProjects} />
            </CardContent>
          </Card>
        )

      case 'actions-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Actions Taken
              </CardTitle>
              <CardDescription>
                Approval actions and change requests status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActionsChart projects={filteredProjects} summary={summary} />
            </CardContent>
          </Card>
        )

      case 'burndown-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Burndown Chart
              </CardTitle>
              <CardDescription>
                Task completion progress over time across all projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BurndownChart projects={filteredProjects} />
            </CardContent>
          </Card>
        )

      case 'status-chart':
        return (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Project Status Distribution
              </CardTitle>
              <CardDescription>
                Projects grouped by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectStatusChart projects={filteredProjects} />
            </CardContent>
          </Card>
        )

      // Workflow-specific widgets
      case 'sprint-board':
        return <SprintBoardWidget workflowType={currentWorkflowType} />

      case 'sales-pipeline':
        return <SalesPipelineWidget workflowType={currentWorkflowType} />

      case 'campaign-performance':
        return <CampaignPerformanceWidget workflowType={currentWorkflowType} />

      case 'ticket-queue':
        return <TicketQueueWidget workflowType={currentWorkflowType} />

      case 'my-tasks':
      case 'myTasks':
        // Filter tasks based on selected filters
        const getFilteredTasks = () => {
          let filtered = [...userTasks]

          // Status filter
          if (taskStatusFilter !== 'ALL') {
            filtered = filtered.filter(task => task.status === taskStatusFilter)
          }

          // Priority filter
          if (taskPriorityFilter !== 'ALL') {
            filtered = filtered.filter(task => task.priority === taskPriorityFilter)
          }

          // Due date filter
          if (taskDueDateFilter !== 'ALL') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            filtered = filtered.filter(task => {
              if (!task.dueDate) return taskDueDateFilter === 'NO_DUE_DATE'

              const dueDate = new Date(task.dueDate)
              dueDate.setHours(0, 0, 0, 0)

              switch (taskDueDateFilter) {
                case 'OVERDUE':
                  return dueDate < today
                case 'TODAY':
                  return dueDate.getTime() === today.getTime()
                case 'THIS_WEEK':
                  const weekEnd = new Date(today)
                  weekEnd.setDate(weekEnd.getDate() + 7)
                  return dueDate >= today && dueDate <= weekEnd
                case 'THIS_MONTH':
                  return dueDate.getMonth() === today.getMonth() &&
                    dueDate.getFullYear() === today.getFullYear()
                case 'NO_DUE_DATE':
                  return false
                default:
                  return true
              }
            })
          }

          return filtered
        }

        const filteredTasks = getFilteredTasks()

        return (
          <Card className="h-full w-full flex flex-col overflow-hidden relative">
            <CardHeader className="pb-3 sticky top-0 z-10 bg-card border-b">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base truncate">My Tasks</CardTitle>
                  <CardDescription className="text-xs truncate">Tasks assigned to you</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTaskViewMode(taskViewMode === 'list' ? 'calendar' : 'list')}
                    className="text-xs"
                    title={taskViewMode === 'list' ? 'Switch to Calendar View' : 'Switch to List View'}
                  >
                    {taskViewMode === 'list' ? (
                      <>
                        <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden lg:inline ml-1">Calendar</span>
                      </>
                    ) : (
                      <>
                        <List className="h-3 w-3 md:h-4 md:w-4" />
                        <span className="hidden lg:inline ml-1">List</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant={showTaskFilters ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowTaskFilters(!showTaskFilters)}
                    className="text-xs"
                    title="Toggle Filters"
                  >
                    <Filter className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden lg:inline ml-1">Filters</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/tasks/new')}
                    className="text-xs"
                    title="Add New Task"
                  >
                    <Plus className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden lg:inline ml-1">Add Task</span>
                  </Button>
                </div>
              </div>

              {/* Filters Panel */}
              {showTaskFilters && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTaskStatusFilter('ALL')
                        setTaskPriorityFilter('ALL')
                        setTaskDueDateFilter('ALL')
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                      <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                        <SelectTrigger className="h-9 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="TODO">To Do</SelectItem>
                          <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                          <SelectItem value="IN_REVIEW">In Review</SelectItem>
                          <SelectItem value="BLOCKED">Blocked</SelectItem>
                          <SelectItem value="DONE">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
                      <Select value={taskPriorityFilter} onValueChange={setTaskPriorityFilter}>
                        <SelectTrigger className="h-9 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="CRITICAL">Critical</SelectItem>
                          <SelectItem value="HIGH">High</SelectItem>
                          <SelectItem value="MEDIUM">Medium</SelectItem>
                          <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                      <label className="text-xs text-muted-foreground mb-1 block">Due Date</label>
                      <Select value={taskDueDateFilter} onValueChange={setTaskDueDateFilter}>
                        <SelectTrigger className="h-9 text-xs w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All</SelectItem>
                          <SelectItem value="OVERDUE">Overdue</SelectItem>
                          <SelectItem value="TODAY">Today</SelectItem>
                          <SelectItem value="THIS_WEEK">This Week</SelectItem>
                          <SelectItem value="THIS_MONTH">This Month</SelectItem>
                          <SelectItem value="NO_DUE_DATE">No Due Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Showing {filteredTasks.length} of {userTasks.length} tasks
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-auto pt-4">
              {taskViewMode === 'list' ? (
                <div className="space-y-3">
                  {filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.project && (
                            <p className="text-xs text-muted-foreground">
                              {task.project.name}
                            </p>
                          )}
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {task.status}
                            </Badge>
                            <Badge variant={task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'destructive' : task.priority === 'MEDIUM' ? 'secondary' : 'default'} className="text-[10px] px-1.5 py-0">
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : userTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">No tasks yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/tasks/new')}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Create Your First Task
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Filter className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground mb-2">No tasks match your filters</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTaskStatusFilter('ALL')
                          setTaskPriorityFilter('ALL')
                          setTaskDueDateFilter('ALL')
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                /* Calendar View */
                <div className="h-full">
                  {(() => {
                    // Group tasks by due date
                    const tasksByDate: { [key: string]: any[] } = {}

                    filteredTasks.forEach(task => {
                      if (task.dueDate) {
                        const dateKey = new Date(task.dueDate).toISOString().split('T')[0]
                        if (!tasksByDate[dateKey]) {
                          tasksByDate[dateKey] = []
                        }
                        tasksByDate[dateKey].push(task)
                      }
                    })

                    // Get current month and year from calendarDate state
                    const currentMonth = calendarDate.getMonth()
                    const currentYear = calendarDate.getFullYear()

                    // Get first day of month and number of days
                    const firstDay = new Date(currentYear, currentMonth, 1)
                    const lastDay = new Date(currentYear, currentMonth + 1, 0)
                    const daysInMonth = lastDay.getDate()
                    const startingDayOfWeek = firstDay.getDay() // 0 = Sunday

                    // Create calendar grid
                    const calendarDays = []
                    const now = new Date()
                    const today = now.getDate()
                    const isCurrentMonth = now.getMonth() === currentMonth && now.getFullYear() === currentYear

                    // Add empty cells for days before month starts
                    for (let i = 0; i < startingDayOfWeek; i++) {
                      calendarDays.push(null)
                    }

                    // Add days of month
                    for (let day = 1; day <= daysInMonth; day++) {
                      calendarDays.push(day)
                    }

                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December']
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

                    // Navigation functions
                    const goToPreviousMonth = () => {
                      setCalendarDate(new Date(currentYear, currentMonth - 1, 1))
                    }

                    const goToNextMonth = () => {
                      setCalendarDate(new Date(currentYear, currentMonth + 1, 1))
                    }

                    const goToToday = () => {
                      setCalendarDate(new Date())
                    }

                    return (
                      <div className="flex flex-col h-full">
                        {/* Calendar Header with Navigation */}
                        <div className="mb-3 pb-2 border-b flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToPreviousMonth}
                            className="h-7 px-2"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold">
                              {monthNames[currentMonth]} {currentYear}
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={goToToday}
                              className="h-6 px-2 text-xs"
                            >
                              Today
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={goToNextMonth}
                            className="h-7 px-2"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Day Names */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-1">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 flex-1 overflow-auto">
                          {calendarDays.map((day, index) => {
                            if (day === null) {
                              return <div key={`empty-${index}`} className="bg-muted/20 rounded-lg" />
                            }

                            const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                            const tasksForDay = tasksByDate[dateKey] || []
                            const isToday = isCurrentMonth && day === today
                            const isPast = new Date(dateKey) < new Date(now.toISOString().split('T')[0])

                            return (
                              <div
                                key={day}
                                className={`border rounded-lg p-2 min-h-[80px] flex flex-col ${
                                  isToday ? 'border-primary bg-primary/5 border-2' : ''
                                } ${isPast && tasksForDay.length > 0 ? 'bg-destructive/5' : ''} ${
                                  !isToday && !isPast ? 'hover:bg-accent' : ''
                                }`}
                              >
                                {/* Date number */}
                                <div className={`text-sm font-semibold mb-1 ${
                                  isToday ? 'text-primary' : isPast ? 'text-muted-foreground' : ''
                                }`}>
                                  {day}
                                </div>

                                {/* Tasks for this day */}
                                <div className="space-y-1 flex-1 overflow-y-auto">
                                  {tasksForDay.map(task => (
                                    <div
                                      key={task.id}
                                      className={`text-[10px] px-1.5 py-1 rounded cursor-pointer truncate ${
                                        task.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                                        task.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                                        task.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                        task.priority === 'LOW' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                                      } hover:opacity-80 transition-opacity`}
                                      onClick={() => router.push(`/tasks/${task.id}`)}
                                      title={task.title}
                                    >
                                      {task.title}
                                    </div>
                                  ))}
                                </div>

                                {/* Task count badge */}
                                {tasksForDay.length > 0 && (
                                  <div className="text-[10px] text-muted-foreground text-center mt-1">
                                    {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        {/* Tasks without due date */}
                        {filteredTasks.some(t => !t.dueDate) && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              No Due Date ({filteredTasks.filter(t => !t.dueDate).length})
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {filteredTasks.filter(t => !t.dueDate).map(task => (
                                <div
                                  key={task.id}
                                  className={`text-[10px] px-2 py-1 rounded cursor-pointer ${
                                    task.priority === 'CRITICAL' ? 'bg-red-500 text-white' :
                                    task.priority === 'HIGH' ? 'bg-orange-500 text-white' :
                                    task.priority === 'MEDIUM' ? 'bg-yellow-500 text-white' :
                                    task.priority === 'LOW' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                                  } hover:opacity-80`}
                                  onClick={() => router.push(`/tasks/${task.id}`)}
                                >
                                  {task.title}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        // Check if it's a workflow widget that should be rendered
        const widgetConfig = getWidgetConfig(widgetId, currentWorkflowType)
        if (widgetConfig) {
          return (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>{widgetConfig.name}</CardTitle>
                {widgetConfig.description && (
                  <CardDescription>{widgetConfig.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center p-6">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <LayoutDashboard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm font-medium mb-2">
                    {widgetConfig.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    This widget is available for your workflow but not yet fully implemented.
                    <br />
                    Coming soon!
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        }
        return (
          <Card className="h-full">
            <CardContent className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-muted-foreground text-sm">
                Widget "{widgetId}" not found
              </p>
            </CardContent>
          </Card>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8 text-purple-600" />
            Project Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive overview of all your projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isMobile && (
            <DropdownMenu open={showWidgetSelector} onOpenChange={setShowWidgetSelector}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Settings2 className="h-4 w-4 mr-2" />
                  Configure Widgets
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Show/Hide Widgets</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {widgets.map((widget) => (
                  <DropdownMenuCheckboxItem
                    key={widget.id}
                    checked={widget.visible}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  >
                    {widget.visible ? (
                      <Eye className="h-4 w-4 mr-2" />
                    ) : (
                      <EyeOff className="h-4 w-4 mr-2" />
                    )}
                    {widget.name}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={resetLayout}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Reset Layout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PLANNED">Planned</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">RAG Status</label>
              <Select value={ragStatusFilter} onValueChange={setRagStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All RAG Status</SelectItem>
                  <SelectItem value="GREEN">Green</SelectItem>
                  <SelectItem value="AMBER">Amber</SelectItem>
                  <SelectItem value="RED">Red</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Program</label>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map(program => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="gantt">
            <Calendar className="h-4 w-4 mr-2" />
            Gantt Timeline
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Kanban className="h-4 w-4 mr-2" />
            Kanban Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          {isMobile ? (
            <div className="space-y-4">
              {widgets
                .filter(w => w.visible)
                .map(widget => (
                  <div key={widget.id} className="w-full">
                    {renderWidget(widget.id)}
                  </div>
                ))}
            </div>
          ) : (
            <div className="project-dashboard-grid">
              <ResponsiveGridLayout
                className="layout"
                layouts={computedLayouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={120}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                isDraggable={true}
                isResizable={true}
              >
                {widgets
                  .filter(w => w.visible)
                  .map(widget => (
                    <div key={widget.id} className="grid-item bg-background">
                      <div className="drag-handle absolute top-2 left-2 right-2 h-6 cursor-move opacity-0 hover:opacity-100 transition-opacity z-10 bg-background/80 backdrop-blur-sm rounded flex items-center justify-center">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="h-full overflow-auto">
                        {renderWidget(widget.id)}
                      </div>
                    </div>
                  ))}
              </ResponsiveGridLayout>
            </div>
          )}
        </TabsContent>

        <TabsContent value="gantt">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Smart Timeline / Gantt View
              </CardTitle>
              <CardDescription>
                Visual timeline of all projects with tasks and milestones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredProjects.length > 0 ? (
                <GanttChart projects={filteredProjects.map(p => ({
                  id: p.id,
                  name: p.name,
                  code: p.code,
                  status: p.status as any,
                  ragStatus: p.ragStatus as any,
                  startDate: new Date(p.startDate),
                  endDate: new Date(p.endDate),
                  progress: p.progress,
                }))} />
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  No projects to display
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Kanban className="h-5 w-5" />
                Kanban Board View
              </CardTitle>
              <CardDescription>
                All tasks across projects organized by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KanbanBoard projects={filteredProjects} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

// Burndown Chart Component
function BurndownChart({ projects }: { projects: any[] }) {
  const now = new Date()
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now)
    date.setDate(date.getDate() - (29 - i))
    return date
  })

  const allTasks: any[] = []
  projects.forEach(project => {
    if (project.tasks && Array.isArray(project.tasks)) {
      project.tasks.forEach((task: any) => {
        allTasks.push({
          ...task,
          projectId: project.id,
        })
      })
    }
  })

  if (allTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <TrendingDown className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No tasks available</p>
        <p className="text-xs mt-1">Task completion data will appear here once projects have tasks</p>
      </div>
    )
  }

  const totalTasks = allTasks.length
  const burndownData = last30Days.map(date => {
    const dateStr = date.toISOString().split('T')[0]
    const todayStr = new Date().toISOString().split('T')[0]

    const completedByDate = allTasks.filter(task => {
      if (task.status === 'DONE') {
        if (task.updatedAt) {
          const updatedDate = new Date(task.updatedAt).toISOString().split('T')[0]
          return updatedDate <= dateStr
        }
        return dateStr >= todayStr
      }
      return false
    }).length

    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      remaining: Math.max(0, totalTasks - completedByDate),
      completed: completedByDate,
    }
  })

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={burndownData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="#8884d8"
            name="Tasks Remaining"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="completed"
            stroke="#82ca9d"
            name="Tasks Completed"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Kanban Board Component
function KanbanBoard({ projects }: { projects: any[] }) {
  const columns = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE']

  const getTasksByStatus = (status: string) => {
    const tasks: any[] = []
    projects.forEach(project => {
      project.tasks?.forEach((task: any) => {
        if (task.status === status) {
          tasks.push({ ...task, projectName: project.name, projectId: project.id })
        }
      })
    })
    return tasks
  }

  return (
    <div className="grid grid-cols-5 gap-4 overflow-x-auto">
      {columns.map(status => {
        const tasks = getTasksByStatus(status)
        return (
          <div key={status} className="min-w-[200px]">
            <div className="font-semibold mb-3 flex items-center justify-between">
              <span>{status.replace('_', ' ')}</span>
              <Badge>{tasks.length}</Badge>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {tasks.map(task => (
                <Card
                  key={task.id}
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => window.location.href = `/projects/${task.projectId}`}
                >
                  <div className="text-sm font-medium mb-1">{task.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {task.projectName}
                  </div>
                  {task.dueDate && (
                    <div className="text-xs text-muted-foreground">
                      Due: {formatDate(task.dueDate)}
                    </div>
                  )}
                </Card>
              ))}
              {tasks.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No tasks
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Budget Chart Component
function BudgetChart({ projects, summary }: { projects: any[]; summary: any }) {
  const budgetData = projects
    .filter(p => (p.stats?.budget?.total || 0) > 0)
    .map(p => ({
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      total: p.stats.budget.total || 0,
      spent: p.stats.budget.spent || 0,
      committed: p.stats.budget.committed || 0,
      available: (p.stats.budget.total || 0) - (p.stats.budget.spent || 0) - (p.stats.budget.committed || 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  if (budgetData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <DollarSign className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No budget data available</p>
        <p className="text-xs mt-1">Budget information will appear here once projects have budget data</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={budgetData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
          <YAxis />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="spent" fill="#ef4444" name="Spent" />
          <Bar dataKey="committed" fill="#f59e0b" name="Committed" />
          <Bar dataKey="available" fill="#10b981" name="Available" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Risk Chart Component
function RiskChart({ projects }: { projects: any[] }) {
  const riskData = {
    critical: projects.reduce((sum, p) => sum + (p.stats?.risks?.critical || 0), 0),
    high: projects.reduce((sum, p) => sum + (p.stats?.risks?.high || 0), 0),
    medium: projects.reduce((sum, p) => {
      const total = p.stats?.risks?.total || 0
      const critical = p.stats?.risks?.critical || 0
      const high = p.stats?.risks?.high || 0
      return sum + Math.max(0, total - critical - high)
    }, 0),
    mitigated: projects.reduce((sum, p) => {
      const risks = p.risks || []
      return sum + risks.filter((r: any) => r.status === 'MITIGATED' || r.status === 'CLOSED').length
    }, 0),
  }

  const pieData = [
    { name: 'Critical', value: riskData.critical, color: '#ef4444' },
    { name: 'High', value: riskData.high, color: '#f59e0b' },
    { name: 'Medium', value: riskData.medium, color: '#eab308' },
    { name: 'Mitigated', value: riskData.mitigated, color: '#10b981' },
  ].filter(item => item.value > 0)

  if (pieData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <AlertTriangle className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No risks identified</p>
        <p className="text-xs mt-1">Risk data will appear here once risks are added to projects</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Issues Chart Component
function IssuesChart({ projects }: { projects: any[] }) {
  const issuesData = {
    critical: projects.reduce((sum, p) => sum + (p.stats?.issues?.critical || 0), 0),
    high: 0,
    medium: 0,
    low: 0,
    resolved: projects.reduce((sum, p) => {
      const issues = p.issues || []
      return sum + issues.filter((i: any) => i.status === 'RESOLVED' || i.status === 'CLOSED').length
    }, 0),
  }

  projects.forEach(project => {
    const issues = project.issues || []
    issues.forEach((issue: any) => {
      if (issue.status === 'OPEN' || issue.status === 'IN_PROGRESS') {
        if (issue.severity === 'HIGH') issuesData.high++
        else if (issue.severity === 'MEDIUM') issuesData.medium++
        else if (issue.severity === 'LOW') issuesData.low++
      }
    })
  })

  const barData = [
    { name: 'Critical', value: issuesData.critical, color: '#ef4444' },
    { name: 'High', value: issuesData.high, color: '#f59e0b' },
    { name: 'Medium', value: issuesData.medium, color: '#eab308' },
    { name: 'Low', value: issuesData.low, color: '#84cc16' },
    { name: 'Resolved', value: issuesData.resolved, color: '#10b981' },
  ].filter(item => item.value > 0)

  if (barData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <AlertTriangle className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No issues reported</p>
        <p className="text-xs mt-1">Issue data will appear here once issues are added to projects</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8">
            {barData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Actions Chart Component
function ActionsChart({ projects, summary }: { projects: any[]; summary: any }) {
  const actionsData = summary?.approvals ? [
    { name: 'Approved', value: summary.approvals.approved || 0, color: '#10b981' },
    { name: 'Rejected', value: summary.approvals.rejected || 0, color: '#ef4444' },
    { name: 'Pending', value: summary.approvals.pending || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0) : []

  const changeData = summary?.changeRequests ? [
    { name: 'Approved', value: summary.changeRequests.approved || 0, color: '#10b981' },
    { name: 'Pending', value: summary.changeRequests.pending || 0, color: '#f59e0b' },
  ].filter(item => item.value > 0) : []

  const combinedData = [
    ...actionsData.map(a => ({ ...a, category: 'Approvals' })),
    ...changeData.map(c => ({ ...c, category: 'Change Requests' })),
  ]

  if (combinedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <CheckCircle2 className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No actions taken yet</p>
        <p className="text-xs mt-1">Approval and change request data will appear here</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8">
            {combinedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Project Status Chart Component
function ProjectStatusChart({ projects }: { projects: any[] }) {
  const statusCounts: Record<string, number> = {}

  projects.forEach(project => {
    const status = project.status || 'UNKNOWN'
    statusCounts[status] = (statusCounts[status] || 0) + 1
  })

  const chartData = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
    color: getStatusColorForChart(name),
  }))

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm font-medium">No projects available</p>
        <p className="text-xs mt-1">Project status distribution will appear here once projects are created</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function getStatusColorForChart(status: string): string {
  const colors: Record<string, string> = {
    PLANNED: '#64748b',
    IN_PROGRESS: '#3b82f6',
    ON_HOLD: '#f59e0b',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
  }
  return colors[status] || '#94a3b8'
}

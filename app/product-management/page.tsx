'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, BarChart3, Map as MapIcon, TrendingUp, AlertTriangle, Users, ClipboardList, Network, Palette, Link as LinkIcon, Briefcase, CheckCircle2, Target, Plus, MessageSquare, FileText, X, UserCheck, Calendar, Clock, GripVertical, List, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore, fetchAuthenticatedUser } from '@/stores/authStore'
import { getInitials } from '@/lib/utils'
import { AdvancedFormsWidget } from '@/components/widgets/AdvancedFormsWidget'
import { AdvancedMindMapWidget } from '@/components/widgets/AdvancedMindMapWidget'
import { AdvancedCanvasWidget } from '@/components/widgets/AdvancedCanvasWidget'
import { GanttChartWidget } from '@/components/widgets/GanttChartWidget'
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface Widget {
  id: string
  type: string
  visible: boolean
}

const defaultWidgets: Widget[] = [
  { id: 'stats', type: 'stats', visible: true },
  { id: 'roadmap', type: 'roadmap', visible: true },
  { id: 'metrics', type: 'metrics', visible: true },
  { id: 'blockers', type: 'blockers', visible: true },
  { id: 'teamCapacity', type: 'teamCapacity', visible: true },
  { id: 'recentProjects', type: 'recentProjects', visible: false },
  { id: 'myTasks', type: 'myTasks', visible: false },
  { id: 'assignedToOthers', type: 'assignedToOthers', visible: false },
  { id: 'activeOKRs', type: 'activeOKRs', visible: false },
  { id: 'quickActions', type: 'quickActions', visible: false },
  { id: 'usefulLinks', type: 'usefulLinks', visible: false },
  { id: 'forms', type: 'forms', visible: false },
  { id: 'mindMap', type: 'mindMap', visible: false },
  { id: 'canvas', type: 'canvas', visible: false },
  { id: 'ganttChart', type: 'ganttChart', visible: false },
]

const defaultLayouts: Layouts = {
  lg: [
    { i: 'stats', x: 0, y: 0, w: 6, h: 6, minW: 3, minH: 3 },
    { i: 'roadmap', x: 6, y: 0, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'metrics', x: 0, y: 6, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'blockers', x: 6, y: 8, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'teamCapacity', x: 0, y: 14, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'recentProjects', x: 6, y: 16, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 22, w: 6, h: 10, minW: 3, minH: 6 },
    { i: 'assignedToOthers', x: 6, y: 24, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'activeOKRs', x: 0, y: 32, w: 6, h: 8, minW: 3, minH: 3 },
    { i: 'quickActions', x: 6, y: 32, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 40, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'forms', x: 6, y: 38, w: 6, h: 8, minW: 3, minH: 4 },
    { i: 'mindMap', x: 0, y: 46, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 6, y: 46, w: 6, h: 8, minW: 3, minH: 8 },
    { i: 'ganttChart', x: 0, y: 54, w: 12, h: 10, minW: 4, minH: 8 },
  ],
  md: [
    { i: 'stats', x: 0, y: 0, w: 5, h: 6, minW: 3, minH: 3 },
    { i: 'roadmap', x: 5, y: 0, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'metrics', x: 0, y: 6, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'blockers', x: 5, y: 8, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'teamCapacity', x: 0, y: 14, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'recentProjects', x: 5, y: 16, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'myTasks', x: 0, y: 22, w: 5, h: 10, minW: 3, minH: 6 },
    { i: 'assignedToOthers', x: 5, y: 24, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'activeOKRs', x: 0, y: 32, w: 5, h: 8, minW: 3, minH: 3 },
    { i: 'quickActions', x: 5, y: 32, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 40, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'forms', x: 5, y: 38, w: 5, h: 8, minW: 3, minH: 4 },
    { i: 'mindMap', x: 0, y: 46, w: 5, h: 8, minW: 3, minH: 6 },
    { i: 'canvas', x: 5, y: 46, w: 5, h: 8, minW: 3, minH: 8 },
    { i: 'ganttChart', x: 0, y: 54, w: 10, h: 10, minW: 4, minH: 8 },
  ],
  sm: [
    { i: 'stats', x: 0, y: 0, w: 3, h: 6, minW: 2, minH: 3 },
    { i: 'roadmap', x: 3, y: 0, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'metrics', x: 0, y: 6, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'blockers', x: 3, y: 8, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'teamCapacity', x: 0, y: 14, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'recentProjects', x: 3, y: 16, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'myTasks', x: 0, y: 22, w: 3, h: 10, minW: 2, minH: 6 },
    { i: 'assignedToOthers', x: 3, y: 24, w: 3, h: 8, minW: 2, minH: 6 },
    { i: 'activeOKRs', x: 0, y: 32, w: 3, h: 8, minW: 2, minH: 3 },
    { i: 'quickActions', x: 3, y: 32, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'usefulLinks', x: 0, y: 40, w: 3, h: 6, minW: 2, minH: 4 },
    { i: 'forms', x: 3, y: 38, w: 3, h: 8, minW: 2, minH: 4 },
    { i: 'mindMap', x: 0, y: 46, w: 3, h: 8, minW: 2, minH: 6 },
    { i: 'canvas', x: 3, y: 46, w: 3, h: 8, minW: 2, minH: 8 },
    { i: 'ganttChart', x: 0, y: 54, w: 6, h: 10, minW: 2, minH: 8 },
  ],
}

export default function PMDashboardLandingPage() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [usefulLinks, setUsefulLinks] = useState<Array<{ id: string; title: string; url: string }>>([])
  const [newLinkTitle, setNewLinkTitle] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [userProjects, setUserProjects] = useState<any[]>([])
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [userGoals, setUserGoals] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<any[]>([])
  const [roadmap, setRoadmap] = useState<any[]>([])
  const [blockers, setBlockers] = useState<any[]>([])
  const [teamStatus, setTeamStatus] = useState<any[]>([])
  const [metrics, setMetrics] = useState<any[]>([])
  
  // My Tasks widget state
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL')
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL')
  const [taskDueDateFilter, setTaskDueDateFilter] = useState<string>('ALL')
  const [showTaskFilters, setShowTaskFilters] = useState(false)
  const [taskViewMode, setTaskViewMode] = useState<'list' | 'calendar'>('calendar')
  const [calendarDate, setCalendarDate] = useState(new Date())


  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true)
      const authenticatedUser = await fetchAuthenticatedUser()
      if (authenticatedUser) {
        setUser(authenticatedUser)
      }
      setIsLoading(false)
    }
    loadUser()
  }, [setUser])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch projects
        const projectsRes = await fetch('/api/projects')
        let projects: any[] = []
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          projects = projectsData.projects || projectsData || []
          setUserProjects(projects)
        }

        // Fetch tasks
        const tasksRes = await fetch('/api/tasks?includeCreated=true')
        let tasks: any[] = []
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          tasks = tasksData.tasks || tasksData || []
          setUserTasks(tasks)
        }

        // Fetch OKRs/Goals
        const goalsRes = await fetch('/api/okrs')
        let goals: any[] = []
        if (goalsRes.ok) {
          const goalsData = await goalsRes.json()
          goals = goalsData.goals || goalsData || []
          setUserGoals(goals)
        }

        // Calculate stats from real data
        const activeProjects = projects.filter((p: any) =>
          p.status === 'IN_PROGRESS' || p.status === 'PLANNING'
        ).length
        const delayedTasks = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
          return new Date(t.dueDate) < new Date()
        }).length
        const blockedTasks = tasks.filter((t: any) => t.status === 'BLOCKED').length

        setStats([
          { label: "Active Projects", value: activeProjects.toString() },
          { label: "Upcoming Releases", value: "0" }, // Will be updated when releases API is available
          { label: "Delayed Tasks", value: delayedTasks.toString() },
          { label: "Blocked Tasks", value: blockedTasks.toString() },
        ])

        // Calculate roadmap items from projects
        const roadmapItems = projects
          .filter((p: any) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED')
          .slice(0, 4)
          .map((p: any) => ({
            title: p.name,
            status: p.status === 'IN_PROGRESS' ? 'In Progress' :
              p.status === 'PLANNING' ? 'Planning' :
                p.status === 'PLANNED' ? 'Planned' : 'Draft',
            eta: p.endDate ? new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD',
          }))
        setRoadmap(roadmapItems)

        // Calculate blockers from blocked tasks
        const blockerItems = tasks
          .filter((t: any) => t.status === 'BLOCKED')
          .slice(0, 3)
          .map((t: any) => ({
            title: t.title,
            team: t.project?.name || 'Unassigned',
            impact: t.priority === 'CRITICAL' ? 'Blocks release' :
              t.priority === 'HIGH' ? 'Delays feature' : 'Minor delay',
            severity: t.priority === 'CRITICAL' ? 'High' :
              t.priority === 'HIGH' ? 'Medium' : 'Low',
          }))
        setBlockers(blockerItems)

        // Calculate team capacity from actual task assignments
        const teamMap = new Map<string, { tasks: number, load: number, name: string }>()
        tasks.forEach((t: any) => {
          if (t.assigneeId && t.status !== 'DONE' && t.status !== 'CANCELLED') {
            const current = teamMap.get(t.assigneeId) || { tasks: 0, load: 0, name: t.assignee?.name || `User ${t.assigneeId.slice(0, 8)}` }
            teamMap.set(t.assigneeId, { 
              tasks: current.tasks + 1, 
              load: current.load + 1,
              name: current.name
            })
          }
        })

        // Calculate load percentage (simplified - max 10 tasks = 100% load)
        const teamStatusItems: any[] = []
        teamMap.forEach((value, userId) => {
          const load = Math.min(100, (value.tasks / 10) * 100)
          teamStatusItems.push({
            name: value.name,
            load: Math.round(load),
            status: load > 80 ? 'Overloaded' : load > 60 ? 'Busy' : 'Stable',
          })
        })

        // If no team data, show placeholder
        if (teamStatusItems.length === 0) {
          setTeamStatus([
            { name: "No active tasks", load: 0, status: "Available" },
          ])
        } else {
          setTeamStatus(teamStatusItems.slice(0, 4))
        }

        // Calculate metrics from real data
        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t: any) => t.status === 'DONE').length
        const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0'

        const overdueTasks = tasks.filter((t: any) => {
          if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
          return new Date(t.dueDate) < new Date()
        }).length
        const overdueRate = totalTasks > 0 ? ((overdueTasks / totalTasks) * 100).toFixed(1) : '0'

        setMetrics([
          { label: "Task Completion Rate", value: `${completionRate}%` },
          { label: "Overdue Tasks Rate", value: `${overdueRate}%` },
          { label: "Active Projects", value: activeProjects.toString() },
          { label: "Total Tasks", value: totalTasks.toString() },
        ])

      } catch (error) {
        console.error('Failed to fetch data', error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('pm-widgets')
    if (saved) {
      try {
        const savedWidgets: Widget[] = JSON.parse(saved)
        // Merge saved widgets with defaults to ensure all widgets are present
        const mergedWidgets = defaultWidgets.map(defaultWidget => {
          const savedWidget = savedWidgets.find(w => w.id === defaultWidget.id)
          // Use saved visibility preference if exists, otherwise use default
          return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
        })
        setWidgets(mergedWidgets)
        // Save merged widgets back to localStorage to include any new widgets
        localStorage.setItem('pm-widgets', JSON.stringify(mergedWidgets))
      } catch (e) {
        console.error('Failed to load widget preferences', e)
        setWidgets(defaultWidgets)
      }
    } else {
      setWidgets(defaultWidgets)
    }

    const savedLayouts = localStorage.getItem('pm-layouts')
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts))
      } catch (e) {
        console.error('Failed to load layouts', e)
        setLayouts(defaultLayouts)
      }
    } else {
      setLayouts(defaultLayouts)
    }

    const savedLinks = localStorage.getItem('pm-useful-links')
    if (savedLinks) {
      try {
        setUsefulLinks(JSON.parse(savedLinks))
      } catch (e) {
        console.error('Failed to load useful links', e)
      }
    }
  }, [])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    setLayouts(allLayouts)
    localStorage.setItem('pm-layouts', JSON.stringify(allLayouts))
  }

  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = widgets.map(w =>
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    )
    setWidgets(updatedWidgets)
    localStorage.setItem('pm-widgets', JSON.stringify(updatedWidgets))
  }


  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'stats':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Stats</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-2xl border border-border bg-card px-3 py-3 flex flex-col gap-1.5"
                  >
                    <div className="text-[10px] uppercase text-muted-foreground">
                      {s.label}
                    </div>
                    <div className="text-lg font-semibold">{s.value}</div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full w-2/3 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'roadmap':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Roadmap Items</CardTitle>
              <CardDescription className="text-xs">What's shipping next?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {roadmap.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {roadmap.map((r) => (
                    <div
                      key={r.title}
                      className="rounded-xl border border-border bg-background px-3 py-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{r.title}</div>
                        <span className="rounded-full px-2 py-0.5 bg-muted border border-border text-[10px] text-muted-foreground">
                          {r.status}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-[11px] mt-1">ETA: {r.eta}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <MapIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No roadmap items yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'metrics':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Key Delivery Metrics</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-border bg-background p-3"
                  >
                    <div className="text-muted-foreground">{m.label}</div>
                    <div className="text-sm font-semibold mt-1">{m.value}</div>
                  </div>
                ))}
              </div>
              <div className="h-32 rounded-xl bg-muted border border-border flex items-center justify-center text-[11px] text-muted-foreground mt-4">
                [Velocity / Burndown Chart Placeholder]
              </div>
            </CardContent>
          </Card>
        )

      case 'blockers':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Top Blockers</CardTitle>
              <CardDescription className="text-xs">What's slowing us down?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {blockers.length > 0 ? (
                <div className="space-y-3">
                  {blockers.map((b) => (
                    <div
                      key={b.title}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{b.title}</div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${b.severity === "High"
                            ? "border border-rose-500/60 bg-rose-500/10 text-rose-600 dark:text-rose-300"
                            : b.severity === "Medium"
                              ? "border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-300"
                              : "border border-border bg-muted text-muted-foreground"
                            }`}
                        >
                          {b.severity}
                        </span>
                      </div>
                      <div className="text-muted-foreground mt-1">{b.team} Team</div>
                      <div className="text-muted-foreground text-[11px]">{b.impact}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No blockers found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'teamCapacity':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Team Capacity & Load</CardTitle>
              <CardDescription className="text-xs">Who's overloaded? Who's free?</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {teamStatus.length > 0 ? (
                <div className="space-y-3">
                  {teamStatus.map((t) => (
                    <div
                      key={t.name}
                      className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">{t.name}</div>
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {t.status}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400"
                            style={{ width: `${t.load}%` }}
                          />
                        </div>
                        <span>{t.load}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No team data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'recentProjects':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Recent Projects</CardTitle>
                  <CardDescription className="text-xs">Your latest projects</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/projects/new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userProjects.length > 0 ? (
                <div className="space-y-3">
                  {userProjects
                    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                    .slice(0, 5)
                    .map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${project.ragStatus === 'GREEN' ? 'bg-green-500' :
                                project.ragStatus === 'AMBER' ? 'bg-yellow-500' :
                                  project.ragStatus === 'RED' ? 'bg-red-500' : 'bg-gray-400'
                                }`}
                            />
                            <p className="font-medium text-sm">{project.name}</p>
                          </div>
                          {project.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                          {project.progress !== undefined && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">{project.progress}%</span>
                              </div>
                              <Progress value={project.progress} className="h-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No projects yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/projects/new')}
                  >
                    Create your first project →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'myTasks':
      case 'my-tasks':
        // Filter tasks based on selected filters
        const getFilteredTasks = () => {
          let filtered = userTasks.filter(task => task.assigneeId === user?.id)

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
                    Showing {filteredTasks.length} of {userTasks.filter(task => task.assigneeId === user?.id).length} tasks
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
                  ) : userTasks.filter(task => task.assigneeId === user?.id).length === 0 ? (
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

      case 'assignedToOthers':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div>
                <CardTitle className="text-base">Assigned to Others</CardTitle>
                <CardDescription className="text-xs">Tasks you assigned to team members</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userTasks.filter(task => task.createdById === user?.id && task.assigneeId !== user?.id && task.assigneeId).length > 0 ? (
                <div className="space-y-3">
                  {userTasks
                    .filter(task => task.createdById === user?.id && task.assigneeId !== user?.id && task.assigneeId)
                    .slice(0, 5)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      >
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.project && (
                            <p className="text-xs text-muted-foreground">{task.project.name}</p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {task.status}
                            </Badge>
                            <Badge
                              variant={
                                task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'destructive' :
                                  task.priority === 'MEDIUM' ? 'secondary' : 'default'
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {task.priority}
                            </Badge>
                            {task.dueDate && (
                              <span className="text-xs text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.assignee && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={task.assignee.image || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(task.assignee.name || task.assignee.firstName || 'U')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {task.assignee.name || `${task.assignee.firstName || ''} ${task.assignee.lastName || ''}`.trim()}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <UserCheck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No tasks assigned to others</p>
                  <p className="text-xs text-muted-foreground">
                    Tasks you create and assign to team members will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'activeOKRs':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Active OKRs</CardTitle>
                  <CardDescription className="text-xs">Your objectives and key results</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/okrs')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              {userGoals.length > 0 ? (
                <div className="space-y-4">
                  {userGoals.slice(0, 3).map((goal) => (
                    <div
                      key={goal.id}
                      className="space-y-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => router.push('/okrs')}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{goal.title}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {goal.level}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {goal.quarter} {goal.year}
                          </p>
                        </div>
                      </div>
                      {goal.keyResults && goal.keyResults.length > 0 && (
                        <div className="space-y-2">
                          {goal.keyResults.slice(0, 2).map((kr: any) => {
                            const progress = ((Number(kr.currentValue) - Number(kr.startValue)) / (Number(kr.targetValue) - Number(kr.startValue))) * 100
                            const clampedProgress = Math.max(0, Math.min(progress, 100))
                            return (
                              <div key={kr.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground truncate flex-1">{kr.title}</span>
                                  <span className="font-medium ml-2">{Math.round(clampedProgress)}%</span>
                                </div>
                                <Progress value={clampedProgress} className="h-1" />
                              </div>
                            )
                          })}
                          {goal.keyResults.length > 2 && (
                            <p className="text-xs text-muted-foreground text-center pt-1">
                              +{goal.keyResults.length - 2} more key result{goal.keyResults.length - 2 > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {userGoals.length > 3 && (
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => router.push('/okrs')}
                    >
                      View all {userGoals.length} goals →
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground mb-2">No active OKRs yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/okrs')}
                  >
                    Set your first goal →
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )

      case 'quickActions':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Quick Actions</CardTitle>
              <CardDescription className="text-xs">Fast access to common tasks</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/projects/new')}>
                  <Plus className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Project</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/releases/new')}>
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Release</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/roadmap')}>
                  <MapIcon className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">Roadmap</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/teams/new')}>
                  <Users className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">New Team</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-1.5 py-3 transition-all" onClick={() => router.push('/backlog')}>
                  <Briefcase className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-medium text-center">Backlog</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )

      case 'usefulLinks':
        return (
          <Card className="h-full">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base">Useful Links</CardTitle>
              <CardDescription className="text-xs">Quick access to frequently visited resources</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pt-0 pb-6">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Link title"
                    value={newLinkTitle}
                    onChange={(e) => setNewLinkTitle(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="URL"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (newLinkTitle && newLinkUrl) {
                        const newLink = {
                          id: Date.now().toString(),
                          title: newLinkTitle,
                          url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
                        }
                        const updated = [...usefulLinks, newLink]
                        setUsefulLinks(updated)
                        localStorage.setItem('pm-useful-links', JSON.stringify(updated))
                        setNewLinkTitle('')
                        setNewLinkUrl('')
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {usefulLinks.length > 0 ? (
                  <div className="space-y-2">
                    {usefulLinks.map((link) => (
                      <div key={link.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-accent group">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 flex-1 text-sm"
                        >
                          <LinkIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate">{link.title}</span>
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => {
                            const updated = usefulLinks.filter(l => l.id !== link.id)
                            setUsefulLinks(updated)
                            localStorage.setItem('pm-useful-links', JSON.stringify(updated))
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-center py-8">
                    <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No links saved yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Add your frequently visited links above</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )

      case 'forms':
        return <AdvancedFormsWidget />

      case 'mindMap':
        return <AdvancedMindMapWidget />

      case 'canvas':
        return <AdvancedCanvasWidget />

      case 'ganttChart':
        return <GanttChartWidget />

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex w-full">
      <main className="flex-1 flex flex-col w-full m-0 p-0">
        {/* Navigation Bar is now handled by layout.tsx */}

        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6">
          {isMobile ? (
            /* Mobile: Simple Stacked Layout */
            <div className="space-y-4">
              {widgets.map((widget) =>
                widget.visible ? (
                  <div key={widget.id} className="w-full">
                    {renderWidget(widget)}
                  </div>
                ) : null
              )}
            </div>
          ) : (
            /* Desktop: Draggable Grid Layout */
            <div className="pm-grid">
              <ResponsiveGridLayout
                key={JSON.stringify(layouts.lg?.map(l => l.i))}
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={80}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                isDraggable={true}
                isResizable={true}
              >
                {widgets.map((widget) =>
                  widget.visible ? (
                    <div key={widget.id} className="relative group">
                      {/* Drag Handle - appears on hover */}
                      <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                        <GripVertical className="h-3.5 w-3.5 text-white" />
                      </div>
                      {renderWidget(widget)}
                    </div>
                  ) : null
                )}
              </ResponsiveGridLayout>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}


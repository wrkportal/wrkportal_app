'use client'

import { useState, useEffect } from 'react'
import { RecruitmentPageLayout } from '@/components/recruitment/recruitment-page-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Users, Briefcase, UserCheck, TrendingUp, Clock, Calendar, Award, Target, GripVertical } from 'lucide-react'
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
  { id: 'invoices', type: 'invoices', visible: false },
  { id: 'forecast', type: 'forecast', visible: false },
  { id: 'expenses', type: 'expenses', visible: false },
  { id: 'roadmap', type: 'roadmap', visible: false },
  { id: 'metrics', type: 'metrics', visible: false },
  { id: 'blockers', type: 'blockers', visible: false },
  { id: 'teamCapacity', type: 'teamCapacity', visible: false },
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

interface DashboardStats {
  totalCandidates: number
  activeJobs: number
  scheduledInterviews: number
  hireRate: number
  avgTimeToHire: number
  openPositions: number
  offersExtended: number
  onboardingCount: number
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a28dff', '#ff6b9d', '#8dd1e1', '#d084d0']

const defaultLayouts: Layouts = {
  lg: [
    { i: 'metric-totalCandidates', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-activeJobs', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-scheduledInterviews', x: 6, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-hireRate', x: 9, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgTimeToHire', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openPositions', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-offersExtended', x: 6, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-onboardingCount', x: 9, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-candidates', x: 0, y: 6, w: 8, h: 8, minW: 4, minH: 6 },
    { i: 'chart-jobs', x: 8, y: 6, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'chart-sources', x: 0, y: 14, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-stages', x: 6, y: 14, w: 6, h: 6, minW: 3, minH: 4 },
  ],
  md: [
    { i: 'metric-totalCandidates', x: 0, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-activeJobs', x: 5, y: 0, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-scheduledInterviews', x: 0, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-hireRate', x: 5, y: 3, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgTimeToHire', x: 0, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openPositions', x: 5, y: 6, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-offersExtended', x: 0, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'metric-onboardingCount', x: 5, y: 9, w: 5, h: 3, minW: 2, minH: 2 },
    { i: 'chart-candidates', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-jobs', x: 6, y: 12, w: 4, h: 8, minW: 3, minH: 6 },
    { i: 'chart-sources', x: 0, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
    { i: 'chart-stages', x: 5, y: 20, w: 5, h: 6, minW: 3, minH: 4 },
  ],
  sm: [
    { i: 'metric-totalCandidates', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-activeJobs', x: 3, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-scheduledInterviews', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-hireRate', x: 3, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-avgTimeToHire', x: 0, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-openPositions', x: 3, y: 6, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-offersExtended', x: 0, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'metric-onboardingCount', x: 3, y: 9, w: 3, h: 3, minW: 2, minH: 2 },
    { i: 'chart-candidates', x: 0, y: 12, w: 6, h: 8, minW: 3, minH: 6 },
    { i: 'chart-jobs', x: 0, y: 20, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-sources', x: 0, y: 26, w: 6, h: 6, minW: 3, minH: 4 },
    { i: 'chart-stages', x: 0, y: 32, w: 6, h: 6, minW: 3, minH: 4 },
  ],
}

export default function RecruitmentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCandidates: 0,
    activeJobs: 0,
    scheduledInterviews: 0,
    hireRate: 0,
    avgTimeToHire: 0,
    openPositions: 0,
    offersExtended: 0,
    onboardingCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [candidatesData, setCandidatesData] = useState<any[]>([])
  const [jobsData, setJobsData] = useState<any[]>([])
  const [sourcesData, setSourcesData] = useState<any[]>([])
  const [stagesData, setStagesData] = useState<any[]>([])
  const [layouts, setLayouts] = useState<Layouts>(defaultLayouts)
  const [isMobile, setIsMobile] = useState(false)
  const [isInitialMount, setIsInitialMount] = useState(true)
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets)

  useEffect(() => {
    // Load saved widgets
    const savedWidgets = localStorage.getItem('recruitment-widgets')
    if (savedWidgets) {
      try {
        const parsed: Widget[] = JSON.parse(savedWidgets)
        const mergedWidgets = defaultWidgets.map(defaultWidget => {
          const savedWidget = parsed.find(w => w.id === defaultWidget.id)
          return savedWidget ? { ...defaultWidget, visible: savedWidget.visible } : defaultWidget
        })
        setWidgets(mergedWidgets)
      } catch (e) {
        console.error('Failed to load widget preferences', e)
        setWidgets(defaultWidgets)
      }
    } else {
      setWidgets(defaultWidgets)
    }

    const savedLayouts = localStorage.getItem('recruitment-dashboard-layouts')
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts))
      } catch (error) {
        console.error('Error loading saved layouts:', error)
      }
    }

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    setIsInitialMount(false)
    fetchDashboardData()

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Save widgets to localStorage whenever they change
  useEffect(() => {
    if (widgets.length > 0) {
      localStorage.setItem('recruitment-widgets', JSON.stringify(widgets))
    }
  }, [widgets])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId ? { ...widget, visible: !widget.visible } : widget
      )
    )
  }

  useEffect(() => {
    if (isInitialMount) {
      const timer = setTimeout(() => setIsInitialMount(false), 100)
      return () => clearTimeout(timer)
    }
  }, [isInitialMount])

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
    if (isInitialMount) {
      return
    }
    setLayouts(allLayouts)
    localStorage.setItem('recruitment-dashboard-layouts', JSON.stringify(allLayouts))
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // For now, use mock data. Later, replace with actual API calls
      // const response = await fetch('/api/recruitment/stats')
      // const data = await response.json()

      // Mock data
      setStats({
        totalCandidates: 156,
        activeJobs: 28,
        scheduledInterviews: 42,
        hireRate: 68,
        avgTimeToHire: 24,
        openPositions: 15,
        offersExtended: 12,
        onboardingCount: 8,
      })

      // Generate mock chart data
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
      const candidatesChart = months.map((month, idx) => ({
        name: month,
        candidates: Math.floor(Math.random() * 30) + 20,
        hires: Math.floor(Math.random() * 10) + 5,
      }))
      setCandidatesData(candidatesChart)

      const jobsChart = [
        { name: 'Engineering', value: 8 },
        { name: 'Sales', value: 5 },
        { name: 'Marketing', value: 4 },
        { name: 'Operations', value: 3 },
        { name: 'HR', value: 2 },
      ]
      setJobsData(jobsChart)

      const sourcesChart = [
        { name: 'LinkedIn', value: 45 },
        { name: 'Website', value: 28 },
        { name: 'Referral', value: 32 },
        { name: 'Job Boards', value: 22 },
        { name: 'Recruiter', value: 15 },
      ]
      setSourcesData(sourcesChart)

      const stagesChart = [
        { name: 'Applied', value: 85 },
        { name: 'Screening', value: 42 },
        { name: 'Interview', value: 28 },
        { name: 'Offer', value: 12 },
        { name: 'Hired', value: 8 },
      ]
      setStagesData(stagesChart)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderWidget = (id: string) => {
    switch (id) {
      case 'metric-totalCandidates':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCandidates}</div>
              <p className="text-xs text-muted-foreground">In pipeline</p>
            </CardContent>
          </Card>
        )

      case 'metric-activeJobs':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Open positions</p>
            </CardContent>
          </Card>
        )

      case 'metric-scheduledInterviews':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.scheduledInterviews}</div>
              <p className="text-xs text-muted-foreground">Scheduled this week</p>
            </CardContent>
          </Card>
        )

      case 'metric-hireRate':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hire Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.hireRate}%</div>
              <p className="text-xs text-muted-foreground">Conversion rate</p>
            </CardContent>
          </Card>
        )

      case 'metric-avgTimeToHire':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Time to Hire</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgTimeToHire}</div>
              <p className="text-xs text-muted-foreground">Days</p>
            </CardContent>
          </Card>
        )

      case 'metric-openPositions':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.openPositions}</div>
              <p className="text-xs text-muted-foreground">Unfilled roles</p>
            </CardContent>
          </Card>
        )

      case 'metric-offersExtended':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offers Extended</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.offersExtended}</div>
              <p className="text-xs text-muted-foreground">Pending acceptance</p>
            </CardContent>
          </Card>
        )

      case 'metric-onboardingCount':
        return (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.onboardingCount}</div>
              <p className="text-xs text-muted-foreground">New hires</p>
            </CardContent>
          </Card>
        )

      case 'chart-candidates':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Candidates & Hires Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={candidatesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="candidates" stroke="#8884d8" name="Candidates" />
                  <Line type="monotone" dataKey="hires" stroke="#82ca9d" name="Hires" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-jobs':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Jobs by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-sources':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Candidates by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourcesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourcesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      case 'chart-stages':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={stagesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  const widgetIds = [
    'metric-totalCandidates',
    'metric-activeJobs',
    'metric-scheduledInterviews',
    'metric-hireRate',
    'metric-avgTimeToHire',
    'metric-openPositions',
    'metric-offersExtended',
    'metric-onboardingCount',
    'chart-candidates',
    'chart-jobs',
    'chart-sources',
    'chart-stages',
  ]

  return (
    <RecruitmentPageLayout widgets={widgets} toggleWidget={toggleWidget}>
      {isMobile ? (
        /* Mobile: Simple Stacked Layout */
        <div className="space-y-4">
          {widgetIds.map((widgetId) => (
            <div key={widgetId} className="w-full">
              {renderWidget(widgetId)}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: Draggable Grid Layout */
        <div className="recruitment-dashboard-grid">
          <ResponsiveGridLayout
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
            {widgetIds.map((widgetId) => (
              <div key={widgetId} className="relative group">
                {/* Drag Handle - appears on hover */}
                <div className="drag-handle absolute top-1 right-1 z-20 cursor-move bg-purple-500/90 backdrop-blur-sm rounded p-1.5 hover:bg-purple-600 transition-all shadow-md opacity-0 group-hover:opacity-100">
                  <GripVertical className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="h-full overflow-auto">
                  {renderWidget(widgetId)}
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}
    </RecruitmentPageLayout>
  )
}

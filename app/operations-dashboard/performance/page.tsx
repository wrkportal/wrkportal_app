'use client'

import { useState, useEffect } from 'react'
import { OperationsPageLayout } from '@/components/operations/operations-page-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Plus, 
  Search, 
  TrendingUp,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Award,
  Gift,
  Star,
  Clock,
  FileText,
  BarChart3,
  Eye
} from 'lucide-react'

export default function PerformancePage() {
  const [activeTab, setActiveTab] = useState('kpis')

  return (
    <OperationsPageLayout 
      title="Performance Management" 
      description="Monitor operational KPIs, quality control, incentives, R&R programs, and recognitions"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="incentives">Incentives & R&R</TabsTrigger>
          <TabsTrigger value="recognitions">Recognitions</TabsTrigger>
        </TabsList>

        {/* KPIs Tab */}
        <TabsContent value="kpis" className="space-y-6">
          <KPIMonitoring />
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="quality" className="space-y-6">
          <QualityControl />
        </TabsContent>

        {/* Incentives & R&R Tab */}
        <TabsContent value="incentives" className="space-y-6">
          <IncentivesAndRR />
        </TabsContent>

        {/* Recognitions Tab */}
        <TabsContent value="recognitions" className="space-y-6">
          <Recognitions />
        </TabsContent>
      </Tabs>
    </OperationsPageLayout>
  )
}

// KPI Monitoring Component
function KPIMonitoring() {
  const [kpis, setKpis] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPIs()
  }, [])

  const fetchKPIs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/performance/kpis')
      if (!response.ok) {
        throw new Error('Failed to fetch KPIs')
      }
      const data = await response.json()
      setKpis(data.kpis || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  const kpiData = [
    { month: 'Jan', TAT: 3.2, Backlog: 52, Leakage: 1.5, Errors: 1.2 },
    { month: 'Feb', TAT: 2.8, Backlog: 48, Leakage: 1.3, Errors: 1.0 },
    { month: 'Mar', TAT: 2.6, Backlog: 45, Leakage: 1.2, Errors: 0.9 },
    { month: 'Apr', TAT: 2.5, Backlog: 45, Leakage: 1.2, Errors: 0.8 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg TAT</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTAT || 0}h</div>
            <p className="text-xs text-muted-foreground">Average TAT</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total KPIs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">Active KPIs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Track</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onTrack || 0}</div>
            <p className="text-xs text-muted-foreground">Meeting targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atRisk || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>KPI Trends</CardTitle>
          <CardDescription>Monthly performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kpiData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="TAT" stroke="#3b82f6" name="TAT (hours)" />
              <Line type="monotone" dataKey="Backlog" stroke="#10b981" name="Backlog" />
              <Line type="monotone" dataKey="Leakage" stroke="#f59e0b" name="Leakage (%)" />
              <Line type="monotone" dataKey="Errors" stroke="#ef4444" name="Error Rate (%)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Operational KPIs</CardTitle>
          <CardDescription>Current performance against targets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading KPIs...</div>
          ) : kpis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No KPIs found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>KPI Name</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kpis.map((kpi) => (
                  <TableRow key={kpi.id}>
                    <TableCell className="font-medium">{kpi.name}</TableCell>
                    <TableCell>{kpi.currentValue} {kpi.unit || ''}</TableCell>
                    <TableCell>{kpi.targetValue} {kpi.unit || ''}</TableCell>
                    <TableCell>
                      {kpi.trend === 'IMPROVING' ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : kpi.trend === 'DECREASING' || kpi.trend === 'INCREASING' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <BarChart3 className="h-4 w-4 text-yellow-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={kpi.status === 'ON_TRACK' ? 'default' : 'destructive'}>
                        {kpi.status?.replace('_', ' ') || kpi.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Target className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Quality Control Component
function QualityControl() {
  const [quality, setQuality] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuality()
  }, [])

  const fetchQuality = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/performance/quality')
      if (!response.ok) {
        throw new Error('Failed to fetch quality checks')
      }
      const data = await response.json()
      setQuality(data.qualityChecks || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching quality checks:', error)
    } finally {
      setLoading(false)
    }
  }

  const qualityData = [
    { month: 'Jan', Compliance: 92, Quality: 85, Documentation: 70 },
    { month: 'Feb', Compliance: 93, Quality: 87, Documentation: 72 },
    { month: 'Mar', Compliance: 94, Quality: 88, Documentation: 74 },
    { month: 'Apr', Compliance: 95, Quality: 88, Documentation: 75 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Quality</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPassRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Average quality score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.passed || 0}</div>
            <p className="text-xs text-muted-foreground">Total passed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Checks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Checks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All checks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Trends</CardTitle>
          <CardDescription>Monthly quality metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={qualityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Compliance" fill="#3b82f6" name="Compliance %" />
              <Bar dataKey="Quality" fill="#10b981" name="Quality %" />
              <Bar dataKey="Documentation" fill="#f59e0b" name="Documentation %" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quality Control Checks</CardTitle>
              <CardDescription>Quality metrics and compliance tracking</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Check
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading quality checks...</div>
          ) : quality.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No quality checks found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Check Type</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Failed</TableHead>
                  <TableHead>Pass Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quality.map((check) => {
                  const passed = check.passedCount || 0
                  const failed = check.failedCount || 0
                  const total = passed + failed
                  const rate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0
                  return (
                    <TableRow key={check.id}>
                      <TableCell className="font-medium">{check.checkType || check.name || 'Unknown'}</TableCell>
                      <TableCell>{passed}</TableCell>
                      <TableCell>{failed}</TableCell>
                      <TableCell>{rate}%</TableCell>
                      <TableCell>
                        <Badge variant={check.status === 'PASS' ? 'default' : 'destructive'}>
                          {check.status || 'PENDING'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Target className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Incentives & R&R Component
function IncentivesAndRR() {
  const [incentives, setIncentives] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIncentives()
  }, [])

  const fetchIncentives = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/performance/incentives')
      if (!response.ok) {
        throw new Error('Failed to fetch incentives')
      }
      const data = await response.json()
      setIncentives(data.incentives || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching incentives:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incentives</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalAmount || 0}</div>
            <p className="text-xs text-muted-foreground">Total incentives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved || 0}</div>
            <p className="text-xs text-muted-foreground">Approved incentives</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All incentives</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incentive Calculations</CardTitle>
              <CardDescription>Performance-based incentives</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Calculate Incentive
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading incentives...</div>
          ) : incentives.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No incentives found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incentives.map((incentive) => (
                  <TableRow key={incentive.id}>
                    <TableCell className="font-medium">{incentive.employee?.name || 'Unknown'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{incentive.type}</Badge>
                    </TableCell>
                    <TableCell>${incentive.amount}</TableCell>
                    <TableCell>{incentive.month || new Date(incentive.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</TableCell>
                    <TableCell>
                      <Badge variant={incentive.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {incentive.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Recognitions Component
function Recognitions() {
  const [recognitions, setRecognitions] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecognitions()
  }, [])

  const fetchRecognitions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/performance/recognitions')
      if (!response.ok) {
        throw new Error('Failed to fetch recognitions')
      }
      const data = await response.json()
      setRecognitions(data.recognitions || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching recognitions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recognitions</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total recognitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.published || 0}</div>
            <p className="text-xs text-muted-foreground">Publicly recognized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft || 0}</div>
            <p className="text-xs text-muted-foreground">Draft recognitions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">Recognitions this month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employee Recognitions</CardTitle>
              <CardDescription>Track and manage employee achievements and recognitions</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Recognition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading recognitions...</div>
          ) : recognitions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No recognitions found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Achievement</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recognitions.map((recognition) => (
                  <TableRow key={recognition.id}>
                    <TableCell className="font-medium">{recognition.employee?.name || 'Unknown'}</TableCell>
                    <TableCell>{recognition.achievement || recognition.description || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{recognition.category}</Badge>
                    </TableCell>
                    <TableCell>{new Date(recognition.recognitionDate || recognition.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={recognition.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {recognition.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


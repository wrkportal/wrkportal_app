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
  const [kpis, setKpis] = useState([
    { id: '1', name: 'Turnaround Time (TAT)', current: 2.5, target: 2.0, unit: 'hours', trend: 'IMPROVING', status: 'ON_TRACK' },
    { id: '2', name: 'Backlog', current: 45, target: 30, unit: 'items', trend: 'INCREASING', status: 'AT_RISK' },
    { id: '3', name: 'Leakage Rate', current: 1.2, target: 1.0, unit: '%', trend: 'STABLE', status: 'ON_TRACK' },
    { id: '4', name: 'Error Rate', current: 0.8, target: 0.5, unit: '%', trend: 'IMPROVING', status: 'ON_TRACK' },
  ])

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
            <div className="text-2xl font-bold">2.5h</div>
            <p className="text-xs text-muted-foreground">Target: 2.0h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Backlog</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45</div>
            <p className="text-xs text-muted-foreground">Target: 30</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leakage Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <p className="text-xs text-muted-foreground">Target: 1.0%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0.8%</div>
            <p className="text-xs text-muted-foreground">Target: 0.5%</p>
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
                  <TableCell>{kpi.current} {kpi.unit}</TableCell>
                  <TableCell>{kpi.target} {kpi.unit}</TableCell>
                  <TableCell>
                    {kpi.trend === 'IMPROVING' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : kpi.trend === 'INCREASING' ? (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-yellow-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={kpi.status === 'ON_TRACK' ? 'default' : 'destructive'}>
                      {kpi.status.replace('_', ' ')}
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
        </CardContent>
      </Card>
    </div>
  )
}

// Quality Control Component
function QualityControl() {
  const [quality, setQuality] = useState([
    { id: '1', check: 'Process Compliance', passed: 95, failed: 5, rate: 95.0, status: 'PASS' },
    { id: '2', check: 'Output Quality', passed: 88, failed: 12, rate: 88.0, status: 'PASS' },
    { id: '3', check: 'Documentation', passed: 75, failed: 25, rate: 75.0, status: 'FAIL' },
  ])

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
            <div className="text-2xl font-bold">86%</div>
            <p className="text-xs text-muted-foreground">Average quality score</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Passed Checks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">258</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Checks</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
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
              {quality.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="font-medium">{check.check}</TableCell>
                  <TableCell>{check.passed}</TableCell>
                  <TableCell>{check.failed}</TableCell>
                  <TableCell>{check.rate}%</TableCell>
                  <TableCell>
                    <Badge variant={check.status === 'PASS' ? 'default' : 'destructive'}>
                      {check.status}
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
        </CardContent>
      </Card>
    </div>
  )
}

// Incentives & R&R Component
function IncentivesAndRR() {
  const [incentives, setIncentives] = useState([
    { id: '1', employee: 'John Doe', type: 'PERFORMANCE', amount: 500, month: '2024-12', status: 'APPROVED' },
    { id: '2', employee: 'Jane Smith', type: 'QUALITY', amount: 300, month: '2024-12', status: 'PENDING' },
    { id: '3', employee: 'Bob Wilson', type: 'PRODUCTIVITY', amount: 400, month: '2024-12', status: 'APPROVED' },
  ])

  const [rrPrograms, setRrPrograms] = useState([
    { id: '1', name: 'Employee of the Month', type: 'RECOGNITION', participants: 45, budget: 1000, status: 'ACTIVE' },
    { id: '2', name: 'Quality Excellence Award', type: 'REWARD', participants: 30, budget: 2000, status: 'ACTIVE' },
    { id: '3', name: 'Team Performance Bonus', type: 'REWARD', participants: 120, budget: 5000, status: 'ACTIVE' },
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incentives</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1,200</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$300</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active R&R Programs</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$8,000</div>
            <p className="text-xs text-muted-foreground">Monthly allocation</p>
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
                  <TableCell className="font-medium">{incentive.employee}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{incentive.type}</Badge>
                  </TableCell>
                  <TableCell>${incentive.amount}</TableCell>
                  <TableCell>{incentive.month}</TableCell>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Rewards & Recognition Programs</CardTitle>
              <CardDescription>Manage R&R programs and initiatives</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Program Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rrPrograms.map((program) => (
                <TableRow key={program.id}>
                  <TableCell className="font-medium">{program.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{program.type}</Badge>
                  </TableCell>
                  <TableCell>{program.participants}</TableCell>
                  <TableCell>${program.budget}</TableCell>
                  <TableCell>
                    <Badge variant={program.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {program.status}
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
        </CardContent>
      </Card>
    </div>
  )
}

// Recognitions Component
function Recognitions() {
  const [recognitions, setRecognitions] = useState([
    { id: '1', employee: 'John Doe', achievement: 'Exceeded Quality Targets', category: 'QUALITY', date: '2024-12-10', status: 'PUBLISHED' },
    { id: '2', employee: 'Jane Smith', achievement: 'Zero Errors This Month', category: 'EXCELLENCE', date: '2024-12-08', status: 'PUBLISHED' },
    { id: '3', employee: 'Bob Wilson', achievement: 'Top Performer - Productivity', category: 'PRODUCTIVITY', date: '2024-12-05', status: 'DRAFT' },
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recognitions</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">25</div>
            <p className="text-xs text-muted-foreground">Publicly recognized</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Recognition types</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
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
                  <TableCell className="font-medium">{recognition.employee}</TableCell>
                  <TableCell>{recognition.achievement}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{recognition.category}</Badge>
                  </TableCell>
                  <TableCell>{recognition.date}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  )
}


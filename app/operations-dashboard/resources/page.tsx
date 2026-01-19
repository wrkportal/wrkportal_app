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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  Search,
  Users,
  Calendar,
  Briefcase,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  User,
  Mail,
  Phone,
  TrendingDown,
  FileText,
  GraduationCap,
  Package,
  UserPlus,
  UserCheck
} from 'lucide-react'

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState('capacity')

  return (
    <OperationsPageLayout
      title="Resources Management"
      description="Manage capacity, absenteeism, attritions, assets, shifts, trainings, new hires, onboarding, and timesheets"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="capacity">Capacity</TabsTrigger>
          <TabsTrigger value="attendance">Attendance & Absenteeism</TabsTrigger>
          <TabsTrigger value="attrition">Attrition</TabsTrigger>
          <TabsTrigger value="assets">Asset Management</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="trainings">Process Trainings</TabsTrigger>
          <TabsTrigger value="newhires">New Hires</TabsTrigger>
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>

        {/* Capacity Tab */}
        <TabsContent value="capacity" className="space-y-6">
          <CapacityManagement />
        </TabsContent>

        {/* Attendance & Absenteeism Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceManagement />
        </TabsContent>

        {/* Attrition Tab */}
        <TabsContent value="attrition" className="space-y-6">
          <AttritionManagement />
        </TabsContent>

        {/* Asset Management Tab */}
        <TabsContent value="assets" className="space-y-6">
          <AssetManagement />
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-6">
          <ShiftsManagement />
        </TabsContent>

        {/* Process Trainings Tab */}
        <TabsContent value="trainings" className="space-y-6">
          <TrainingsManagement />
        </TabsContent>

        {/* New Hires Tab */}
        <TabsContent value="newhires" className="space-y-6">
          <NewHiresManagement />
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          <OnboardingManagement />
        </TabsContent>

        {/* Timesheets Tab */}
        <TabsContent value="timesheets" className="space-y-6">
          <TimesheetsManagement />
        </TabsContent>
      </Tabs>
    </OperationsPageLayout>
  )
}

// Capacity Management Component
function CapacityManagement() {
  const [capacity, setCapacity] = useState<any[]>([])
  const [totals, setTotals] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCapacity()
  }, [])

  const fetchCapacity = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/capacity')
      if (!response.ok) {
        throw new Error('Failed to fetch capacity data')
      }
      const data = await response.json()
      setCapacity(data.byDepartment || [])
      setTotals(data.totals || {})
    } catch (error) {
      console.error('Error fetching capacity:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total || 0}</div>
            <p className="text-xs text-muted-foreground">Total employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.available || 0}</div>
            <p className="text-xs text-muted-foreground">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.utilization || 0}%</div>
            <p className="text-xs text-muted-foreground">Average utilization</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.onLeave || 0}</div>
            <p className="text-xs text-muted-foreground">Currently on leave</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Capacity by Department</CardTitle>
          <CardDescription>Current capacity utilization across departments</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Available</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>On Leave</TableHead>
                <TableHead>On Training</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {capacity.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell>{dept.total}</TableCell>
                  <TableCell>{dept.available}</TableCell>
                  <TableCell>
                    <Badge variant={dept.utilized > 85 ? 'destructive' : dept.utilized > 70 ? 'default' : 'secondary'}>
                      {dept.utilized}%
                    </Badge>
                  </TableCell>
                  <TableCell>{dept.onLeave}</TableCell>
                  <TableCell>{dept.onTraining}</TableCell>
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

// Attendance & Absenteeism Component
function AttendanceManagement() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [absenteeism, setAbsenteeism] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttendance()
  }, [])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/attendance')
      if (!response.ok) {
        throw new Error('Failed to fetch attendance')
      }
      const data = await response.json()

      // Transform API data
      const transformed = (data.records || []).map((record: any) => ({
        id: record.id,
        employee: record.employee?.name || 'Unknown',
        department: record.employee?.department || 'Unknown',
        date: new Date(record.date).toISOString().split('T')[0],
        status: record.status,
        checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
        checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      }))

      setAttendance(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">{stats.present || 0} of {stats.total || 0} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent || 0}</div>
            <p className="text-xs text-muted-foreground">Absent employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late || 0}</div>
            <p className="text-xs text-muted-foreground">Late arrivals today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading attendance data...</div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No attendance records for today</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employee}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'PRESENT' ? 'default' : record.status === 'ABSENT' ? 'destructive' : 'secondary'}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{record.checkIn}</TableCell>
                    <TableCell>{record.checkOut}</TableCell>
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

      {/* Absenteeism tracking can be added later with a dedicated API endpoint */}
      <Card>
        <CardHeader>
          <CardTitle>Absenteeism Tracking</CardTitle>
          <CardDescription>Employees with high absenteeism rates</CardDescription>
        </CardHeader>
        <CardContent>
          {absenteeism.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No absenteeism records</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Days Absent</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {absenteeism.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employee}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.daysAbsent}</TableCell>
                    <TableCell>{record.reason}</TableCell>
                    <TableCell>
                      <Badge variant={record.trend === 'INCREASING' ? 'destructive' : 'secondary'}>
                        {record.trend}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
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

// Attrition Management Component
function AttritionManagement() {
  const [attrition, setAttrition] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAttrition()
  }, [])

  const fetchAttrition = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/attrition')
      if (!response.ok) {
        throw new Error('Failed to fetch attrition data')
      }
      const data = await response.json()

      const transformed = (data.attritions || []).map((att: any) => ({
        id: att.id,
        employee: att.employee?.name || 'Unknown',
        department: att.employee?.department || 'Unknown',
        exitDate: new Date(att.exitDate).toISOString().split('T')[0],
        reason: att.reason || 'Not specified',
        type: att.type,
      }))

      setAttrition(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching attrition:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Attrition</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyAttritionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">{stats.monthlyAttrition || 0} employees this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voluntary</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.voluntary || 0}</div>
            <p className="text-xs text-muted-foreground">Voluntary exits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Involuntary</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.involuntary || 0}</div>
            <p className="text-xs text-muted-foreground">Involuntary exits</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Tenure</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTenure || 0}</div>
            <p className="text-xs text-muted-foreground">Months average</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Attritions</CardTitle>
              <CardDescription>Employees who have left or are leaving</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Exit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Exit Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attrition.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employee}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.exitDate}</TableCell>
                  <TableCell>{record.reason}</TableCell>
                  <TableCell>
                    <Badge variant={record.type === 'VOLUNTARY' ? 'default' : 'destructive'}>
                      {record.type}
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

// Asset Management Component
function AssetManagement() {
  const [assets, setAssets] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      const data = await response.json()
      setAssets(data.assets || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned || 0}</div>
            <p className="text-xs text-muted-foreground">Assigned assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available || 0}</div>
            <p className="text-xs text-muted-foreground">Available assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Maintenance</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maintenance || 0}</div>
            <p className="text-xs text-muted-foreground">In maintenance</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Inventory</CardTitle>
              <CardDescription>Track and manage all organizational assets</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No assets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Name</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Purchase Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset: any) => (
                  <TableRow key={asset.id}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>{asset.assignedTo?.name || asset.assignedToId || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={asset.status === 'ASSIGNED' ? 'default' : asset.status === 'AVAILABLE' ? 'secondary' : 'destructive'}>
                        {asset.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{asset.location || '-'}</TableCell>
                    <TableCell>{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</TableCell>
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

// Shifts Management Component
function ShiftsManagement() {
  const [shifts, setShifts] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchShifts()
  }, [])

  const fetchShifts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/shifts?includeAssignments=true')
      if (!response.ok) {
        throw new Error('Failed to fetch shifts')
      }
      const data = await response.json()

      const transformed = (data.shifts || []).map((shift: any) => ({
        id: shift.id,
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        employees: shift.employees || 0,
        status: shift.status,
      }))

      setShifts(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Shifts</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active || 0}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees || 0}</div>
            <p className="text-xs text-muted-foreground">Across all shifts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shifts</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All shifts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shift Schedule</CardTitle>
              <CardDescription>Manage shift timings and assignments</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading shifts...</div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No shifts found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift Name</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">{shift.name}</TableCell>
                    <TableCell>{shift.startTime}</TableCell>
                    <TableCell>{shift.endTime}</TableCell>
                    <TableCell>{shift.employees}</TableCell>
                    <TableCell>
                      <Badge variant={shift.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {shift.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
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

// Trainings Management Component
function TrainingsManagement() {
  const [trainings, setTrainings] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainings()
  }, [])

  const fetchTrainings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/trainings?includeEnrollments=true')
      if (!response.ok) {
        throw new Error('Failed to fetch trainings')
      }
      const data = await response.json()
      setTrainings(data.trainings || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching trainings:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trainings</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active || 0}</div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEnrolled || 0}</div>
            <p className="text-xs text-muted-foreground">Total enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All trainings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Process Trainings</CardTitle>
              <CardDescription>Track training programs and employee progress</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading trainings...</div>
          ) : trainings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No trainings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainings.map((training) => (
                  <TableRow key={training.id}>
                    <TableCell className="font-medium">{training.name}</TableCell>
                    <TableCell>
                      <Badge variant={training.type === 'MANDATORY' ? 'destructive' : 'secondary'}>
                        {training.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{training.enrolled || training.employees || 0}</TableCell>
                    <TableCell>{training.completed || 0}</TableCell>
                    <TableCell>
                      <Badge variant={training.status === 'COMPLETED' ? 'default' : training.status === 'ONGOING' ? 'secondary' : 'outline'}>
                        {training.status}
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

// New Hires Management Component
function NewHiresManagement() {
  const [newHires, setNewHires] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNewHires()
  }, [])

  const fetchNewHires = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/new-hires')
      if (!response.ok) {
        throw new Error('Failed to fetch new hires')
      }
      const data = await response.json()

      const transformed = (data.newHires || []).map((hire: any) => ({
        id: hire.id,
        name: hire.name,
        department: hire.department,
        joinDate: new Date(hire.joinDate).toISOString().split('T')[0],
        status: hire.status,
        offerAccepted: hire.offerAccepted,
      }))

      setNewHires(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching new hires:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed || 0}</div>
            <p className="text-xs text-muted-foreground">Confirmed hires</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Offer Accepted</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.offerAccepted || 0}</div>
            <p className="text-xs text-muted-foreground">Offers accepted</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>New Hires</CardTitle>
              <CardDescription>Track upcoming and recent new hires</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Hire
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading new hires...</div>
          ) : newHires.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No new hires found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Offer Accepted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newHires.map((hire) => (
                  <TableRow key={hire.id}>
                    <TableCell className="font-medium">{hire.name}</TableCell>
                    <TableCell>{hire.department}</TableCell>
                    <TableCell>{hire.joinDate}</TableCell>
                    <TableCell>
                      <Badge variant={hire.status === 'CONFIRMED' ? 'default' : 'secondary'}>
                        {hire.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={hire.offerAccepted ? 'default' : 'secondary'}>
                        {hire.offerAccepted ? 'Yes' : 'No'}
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

// Onboarding Management Component
function OnboardingManagement() {
  const [onboarding, setOnboarding] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOnboarding()
  }, [])

  const fetchOnboarding = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/onboarding')
      if (!response.ok) {
        throw new Error('Failed to fetch onboarding records')
      }
      const data = await response.json()

      const transformed = (data.onboarding || []).map((onboard: any) => ({
        id: onboard.id,
        employee: onboard.newHire?.name || 'Unknown',
        department: onboard.newHire?.department || 'Unknown',
        startDate: new Date(onboard.startDate).toISOString().split('T')[0],
        progress: onboard.progress,
        status: onboard.status,
      }))

      setOnboarding(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching onboarding:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Onboarding</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground">Currently onboarding</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgProgress || 0}%</div>
            <p className="text-xs text-muted-foreground">Average completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Total completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All records</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Onboarding Progress</CardTitle>
              <CardDescription>Track new hire onboarding status</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Start Onboarding
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading onboarding records...</div>
          ) : onboarding.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No onboarding records found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboarding.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.employee}</TableCell>
                    <TableCell>{record.department}</TableCell>
                    <TableCell>{record.startDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${record.progress}%` }} />
                        </div>
                        <span className="text-sm">{record.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={record.status === 'IN_PROGRESS' ? 'default' : record.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {record.status}
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

// Timesheets Management Component
function TimesheetsManagement() {
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimesheets()
  }, [])

  const fetchTimesheets = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/operations/resources/timesheets')
      if (!response.ok) {
        throw new Error('Failed to fetch timesheets')
      }
      const data = await response.json()

      const transformed = (data.timesheets || []).map((ts: any) => ({
        id: ts.id,
        employee: ts.employee?.name || 'Unknown',
        week: new Date(ts.weekStartDate).toISOString().split('T')[0],
        hours: ts.totalHours,
        status: ts.status,
        approved: ts.status === 'APPROVED',
      }))

      setTimesheets(transformed)
      setStats(data.stats || {})
    } catch (error) {
      console.error('Error fetching timesheets:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved || 0}</div>
            <p className="text-xs text-muted-foreground">Total approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draft || 0}</div>
            <p className="text-xs text-muted-foreground">Not submitted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <p className="text-xs text-muted-foreground">All timesheets</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timesheets</CardTitle>
              <CardDescription>Review and approve employee timesheets</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Timesheet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading timesheets...</div>
          ) : timesheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No timesheets found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timesheets.map((timesheet) => (
                  <TableRow key={timesheet.id}>
                    <TableCell className="font-medium">{timesheet.employee}</TableCell>
                    <TableCell>{timesheet.week}</TableCell>
                    <TableCell>{timesheet.hours}</TableCell>
                    <TableCell>
                      <Badge variant={timesheet.status === 'SUBMITTED' ? 'default' : timesheet.status === 'APPROVED' ? 'default' : 'secondary'}>
                        {timesheet.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={timesheet.approved ? 'default' : 'secondary'}>
                        {timesheet.approved ? 'Yes' : 'No'}
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

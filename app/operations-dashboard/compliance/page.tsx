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
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  TrendingUp,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState('trainings')

  return (
    <OperationsPageLayout 
      title="Compliance Management" 
      description="Track pending trainings, compliance issues, risk identification, and incidents"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trainings">Pending Trainings</TabsTrigger>
          <TabsTrigger value="issues">Compliance Issues</TabsTrigger>
          <TabsTrigger value="risks">Risk Identification</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        {/* Pending Trainings Tab */}
        <TabsContent value="trainings" className="space-y-6">
          <PendingTrainings />
        </TabsContent>

        {/* Compliance Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <ComplianceIssues />
        </TabsContent>

        {/* Risk Identification Tab */}
        <TabsContent value="risks" className="space-y-6">
          <RiskIdentification />
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents" className="space-y-6">
          <IncidentsTracking />
        </TabsContent>
      </Tabs>
    </OperationsPageLayout>
  )
}

// Pending Trainings Component
function PendingTrainings() {
  const [trainings, setTrainings] = useState([
    { id: '1', employee: 'John Doe', training: 'Safety Protocols', dueDate: '2024-12-20', status: 'OVERDUE', priority: 'HIGH' },
    { id: '2', employee: 'Jane Smith', training: 'Data Privacy', dueDate: '2024-12-25', status: 'PENDING', priority: 'MEDIUM' },
    { id: '3', employee: 'Bob Wilson', training: 'Quality Standards', dueDate: '2024-12-30', status: 'PENDING', priority: 'LOW' },
    { id: '4', employee: 'Alice Brown', training: 'Compliance Regulations', dueDate: '2024-12-18', status: 'OVERDUE', priority: 'HIGH' },
  ])

  const trainingData = [
    { month: 'Jan', Completed: 45, Pending: 12, Overdue: 3 },
    { month: 'Feb', Completed: 52, Pending: 8, Overdue: 2 },
    { month: 'Mar', Completed: 48, Pending: 15, Overdue: 5 },
    { month: 'Apr', Completed: 55, Pending: 10, Overdue: 4 },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Trainings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">200</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.2%</div>
            <p className="text-xs text-muted-foreground">On-time completion</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Training Completion Trends</CardTitle>
          <CardDescription>Monthly training completion statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trainingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completed" fill="#10b981" name="Completed" />
              <Bar dataKey="Pending" fill="#f59e0b" name="Pending" />
              <Bar dataKey="Overdue" fill="#ef4444" name="Overdue" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Trainings</CardTitle>
              <CardDescription>Track training completion status</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Assign Training
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Training</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trainings.map((training) => (
                <TableRow key={training.id}>
                  <TableCell className="font-medium">{training.employee}</TableCell>
                  <TableCell>{training.training}</TableCell>
                  <TableCell>{training.dueDate}</TableCell>
                  <TableCell>
                    <Badge variant={training.status === 'OVERDUE' ? 'destructive' : 'secondary'}>
                      {training.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={training.priority === 'HIGH' ? 'destructive' : training.priority === 'MEDIUM' ? 'default' : 'secondary'}>
                      {training.priority}
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

// Compliance Issues Component
function ComplianceIssues() {
  const [issues, setIssues] = useState([
    { id: '1', type: 'PROCESS_VIOLATION', description: 'Non-compliance with safety protocols', severity: 'HIGH', status: 'OPEN', reportedDate: '2024-12-10', assignedTo: 'Compliance Team' },
    { id: '2', type: 'DOCUMENTATION', description: 'Missing required documentation', severity: 'MEDIUM', status: 'IN_PROGRESS', reportedDate: '2024-12-12', assignedTo: 'Quality Team' },
    { id: '3', type: 'TRAINING', description: 'Employee working without required certification', severity: 'HIGH', status: 'OPEN', reportedDate: '2024-12-14', assignedTo: 'HR Team' },
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Critical issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Being addressed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Compliance Issues</CardTitle>
              <CardDescription>Track and manage compliance violations and issues</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Report Issue
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported Date</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell>
                    <Badge variant="outline">{issue.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{issue.description}</TableCell>
                  <TableCell>
                    <Badge variant={issue.severity === 'HIGH' ? 'destructive' : 'default'}>
                      {issue.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={issue.status === 'OPEN' ? 'destructive' : issue.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{issue.reportedDate}</TableCell>
                  <TableCell>{issue.assignedTo}</TableCell>
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

// Risk Identification Component
function RiskIdentification() {
  const [risks, setRisks] = useState([
    { id: '1', category: 'OPERATIONAL', description: 'High employee turnover risk', likelihood: 'MEDIUM', impact: 'HIGH', riskLevel: 'MEDIUM', mitigation: 'In Progress' },
    { id: '2', category: 'COMPLIANCE', description: 'Potential regulatory changes', likelihood: 'LOW', impact: 'HIGH', riskLevel: 'LOW', mitigation: 'Planned' },
    { id: '3', category: 'TECHNICAL', description: 'System downtime risk', likelihood: 'LOW', impact: 'MEDIUM', riskLevel: 'LOW', mitigation: 'Mitigated' },
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Identified Risks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Total risks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mitigated</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Risks addressed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Being assessed</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Risk Register</CardTitle>
              <CardDescription>Identify, assess, and mitigate operational risks</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Identify Risk
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Likelihood</TableHead>
                <TableHead>Impact</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Mitigation</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map((risk) => (
                <TableRow key={risk.id}>
                  <TableCell>
                    <Badge variant="outline">{risk.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{risk.description}</TableCell>
                  <TableCell>
                    <Badge variant={risk.likelihood === 'HIGH' ? 'destructive' : risk.likelihood === 'MEDIUM' ? 'default' : 'secondary'}>
                      {risk.likelihood}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={risk.impact === 'HIGH' ? 'destructive' : risk.impact === 'MEDIUM' ? 'default' : 'secondary'}>
                      {risk.impact}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={risk.riskLevel === 'HIGH' ? 'destructive' : risk.riskLevel === 'MEDIUM' ? 'default' : 'secondary'}>
                      {risk.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={risk.mitigation === 'Mitigated' ? 'default' : risk.mitigation === 'In Progress' ? 'default' : 'secondary'}>
                      {risk.mitigation}
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

// Incidents Tracking Component
function IncidentsTracking() {
  const [incidents, setIncidents] = useState([
    { id: '1', type: 'SAFETY', description: 'Minor injury in workplace', severity: 'LOW', status: 'RESOLVED', reportedDate: '2024-12-10', reportedBy: 'John Doe' },
    { id: '2', type: 'QUALITY', description: 'Product defect identified', severity: 'MEDIUM', status: 'INVESTIGATING', reportedDate: '2024-12-12', reportedBy: 'Jane Smith' },
    { id: '3', type: 'SECURITY', description: 'Unauthorized access attempt', severity: 'HIGH', status: 'OPEN', reportedDate: '2024-12-14', reportedBy: 'Bob Wilson' },
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incidents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Under investigation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10</div>
            <p className="text-xs text-muted-foreground">83% resolution rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Severity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Critical incidents</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>Track and manage all operational incidents</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Incident
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported Date</TableHead>
                <TableHead>Reported By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>
                    <Badge variant="outline">{incident.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{incident.description}</TableCell>
                  <TableCell>
                    <Badge variant={incident.severity === 'HIGH' ? 'destructive' : incident.severity === 'MEDIUM' ? 'default' : 'secondary'}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={incident.status === 'OPEN' ? 'destructive' : incident.status === 'INVESTIGATING' ? 'default' : 'secondary'}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.reportedDate}</TableCell>
                  <TableCell>{incident.reportedBy}</TableCell>
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


'use client'

import { useState, useEffect } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
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
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText
} from 'lucide-react'

interface SecurityAlert {
  id: string
  type: string
  severity: string
  description: string
  source: string
  detectedAt: string
  status: string
  resolvedAt?: string
}

interface Vulnerability {
  id: string
  title: string
  severity: string
  affectedSystems: string
  discoveredDate: string
  status: string
  patchAvailable: boolean
}

interface Incident {
  id: string
  title: string
  type: string
  severity: string
  description: string
  reportedAt: string
  status: string
  assignee: string
}

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('alerts')
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [securityStats, setSecurityStats] = useState({
    totalAlerts: 0,
    openAlerts: 0,
    resolvedAlerts: 0,
    totalVulnerabilities: 0,
    criticalVulnerabilities: 0,
    totalIncidents: 0,
    activeIncidents: 0,
  })

  useEffect(() => {
    fetchSecurityData()
  }, [])

  const fetchSecurityData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/it/security')
      if (!response.ok) throw new Error('Failed to fetch security data')
      const data = await response.json()
      setAlerts(data.alerts || [])
      setVulnerabilities(data.vulnerabilities || [])
      setIncidents(data.incidents || [])
      setSecurityStats(data.stats || {
        totalAlerts: 0,
        openAlerts: 0,
        resolvedAlerts: 0,
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        totalIncidents: 0,
        activeIncidents: 0,
      })
    } catch (error) {
      console.error('Error fetching security data:', error)
      setAlerts([])
      setVulnerabilities([])
      setIncidents([])
      setSecurityStats({
        totalAlerts: 0,
        openAlerts: 0,
        resolvedAlerts: 0,
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        totalIncidents: 0,
        activeIncidents: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const threatData = [
    { month: 'Jan', Blocked: 125, Detected: 8 },
    { month: 'Feb', Blocked: 138, Detected: 6 },
    { month: 'Mar', Blocked: 145, Detected: 5 },
    { month: 'Apr', Blocked: 142, Detected: 7 },
  ]

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive'
      case 'HIGH':
        return 'destructive'
      case 'MEDIUM':
        return 'default'
      case 'LOW':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  return (
    <ITPageLayout 
      title="Security" 
      description="Monitor security alerts, vulnerabilities, and incidents"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts">Security Alerts</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats.openAlerts}</div>
                <p className="text-xs text-muted-foreground">Active alerts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats.vulnerabilities}</div>
                <p className="text-xs text-muted-foreground">{securityStats.criticalVulns} critical</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats.activeIncidents}</div>
                <p className="text-xs text-muted-foreground">Being investigated</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threats Blocked</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{securityStats.blockedThreats}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          {/* Threat Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Threat Trends</CardTitle>
              <CardDescription>Blocked threats and detected incidents over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={threatData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Blocked" fill="#10b981" name="Blocked Threats" />
                  <Bar dataKey="Detected" fill="#ef4444" name="Detected Incidents" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Alerts Table */}
          {activeTab === 'alerts' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>Active security alerts requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alert ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Detected At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="font-medium">{alert.id}</TableCell>
                        <TableCell>{alert.type}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{alert.description}</TableCell>
                        <TableCell className="font-mono text-sm">{alert.source}</TableCell>
                        <TableCell>{new Date(alert.detectedAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={alert.status === 'RESOLVED' ? 'secondary' : 'default'}>
                            {alert.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Vulnerabilities Table */}
          {activeTab === 'vulnerabilities' && (
            <Card>
              <CardHeader>
                <CardTitle>Vulnerabilities</CardTitle>
                <CardDescription>Security vulnerabilities identified in systems</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vulnerability ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Affected Systems</TableHead>
                      <TableHead>Discovered</TableHead>
                      <TableHead>Patch Available</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vulnerabilities.map((vuln) => (
                      <TableRow key={vuln.id}>
                        <TableCell className="font-medium">{vuln.id}</TableCell>
                        <TableCell className="font-medium">{vuln.title}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(vuln.severity)}>
                            {vuln.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{vuln.affectedSystems}</TableCell>
                        <TableCell>{new Date(vuln.discoveredDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {vuln.patchAvailable ? (
                            <Badge variant="default">Yes</Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={vuln.status === 'OPEN' ? 'destructive' : 'default'}>
                            {vuln.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Incidents Table */}
          {activeTab === 'incidents' && (
            <Card>
              <CardHeader>
                <CardTitle>Security Incidents</CardTitle>
                <CardDescription>Security incidents and investigations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Reported At</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="font-medium">{incident.id}</TableCell>
                        <TableCell className="font-medium">{incident.title}</TableCell>
                        <TableCell>{incident.type}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(incident.severity)}>
                            {incident.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-md truncate">{incident.description}</TableCell>
                        <TableCell>{new Date(incident.reportedAt).toLocaleString()}</TableCell>
                        <TableCell>{incident.assignee}</TableCell>
                        <TableCell>
                          <Badge variant={incident.status === 'RESOLVED' ? 'secondary' : 'default'}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </ITPageLayout>
  )
}


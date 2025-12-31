'use client'

import { useState } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { 
  Activity,
  Server,
  Database,
  Cloud,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  HardDrive
} from 'lucide-react'

interface ServerStatus {
  id: string
  name: string
  type: string
  status: string
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  uptime: number
  lastUpdated: string
}

export default function MonitoringPage() {
  const [servers] = useState<ServerStatus[]>([
    {
      id: 'SRV-001',
      name: 'Web Server - Production',
      type: 'Web Server',
      status: 'HEALTHY',
      cpuUsage: 45,
      memoryUsage: 62,
      diskUsage: 58,
      uptime: 99.9,
      lastUpdated: '2024-12-15T10:30:00',
    },
    {
      id: 'SRV-002',
      name: 'Database Server - Primary',
      type: 'Database',
      status: 'HEALTHY',
      cpuUsage: 38,
      memoryUsage: 71,
      diskUsage: 45,
      uptime: 99.95,
      lastUpdated: '2024-12-15T10:30:00',
    },
    {
      id: 'SRV-003',
      name: 'Application Server - App01',
      type: 'Application',
      status: 'WARNING',
      cpuUsage: 78,
      memoryUsage: 85,
      diskUsage: 52,
      uptime: 99.5,
      lastUpdated: '2024-12-15T10:30:00',
    },
    {
      id: 'SRV-004',
      name: 'File Server - Storage',
      type: 'File Server',
      status: 'HEALTHY',
      cpuUsage: 25,
      memoryUsage: 48,
      diskUsage: 82,
      uptime: 99.8,
      lastUpdated: '2024-12-15T10:30:00',
    },
  ])

  const systemStats = {
    totalServers: servers.length,
    healthy: servers.filter(s => s.status === 'HEALTHY').length,
    warning: servers.filter(s => s.status === 'WARNING').length,
    critical: servers.filter(s => s.status === 'CRITICAL').length,
    avgCpu: servers.reduce((sum, s) => sum + s.cpuUsage, 0) / servers.length,
    avgMemory: servers.reduce((sum, s) => sum + s.memoryUsage, 0) / servers.length,
    avgDisk: servers.reduce((sum, s) => sum + s.diskUsage, 0) / servers.length,
  }

  const cpuData = [
    { time: '00:00', Usage: 42 },
    { time: '06:00', Usage: 38 },
    { time: '12:00', Usage: 65 },
    { time: '18:00', Usage: 58 },
    { time: '24:00', Usage: 45 },
  ]

  const memoryData = [
    { time: '00:00', Usage: 55 },
    { time: '06:00', Usage: 58 },
    { time: '12:00', Usage: 72 },
    { time: '18:00', Usage: 68 },
    { time: '24:00', Usage: 62 },
  ]

  const diskData = [
    { time: '00:00', Usage: 48 },
    { time: '06:00', Usage: 50 },
    { time: '12:00', Usage: 52 },
    { time: '18:00', Usage: 54 },
    { time: '24:00', Usage: 58 },
  ]

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'default'
      case 'WARNING':
        return 'default'
      case 'CRITICAL':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getUsageColor = (usage: number) => {
    if (usage > 80) return 'bg-red-500'
    if (usage > 60) return 'bg-orange-500'
    return 'bg-green-500'
  }

  return (
    <ITPageLayout 
      title="System Monitoring" 
      description="Monitor server performance, resource usage, and system health"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.totalServers}</div>
              <p className="text-xs text-muted-foreground">Monitored servers</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.healthy}</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CPU</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.avgCpu.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">CPU usage</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Memory</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemStats.avgMemory.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Memory usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Charts */}
        <Tabs defaultValue="cpu" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cpu">CPU Usage</TabsTrigger>
            <TabsTrigger value="memory">Memory Usage</TabsTrigger>
            <TabsTrigger value="disk">Disk Usage</TabsTrigger>
          </TabsList>
          <TabsContent value="cpu">
            <Card>
              <CardHeader>
                <CardTitle>CPU Usage Over Time</CardTitle>
                <CardDescription>Average CPU utilization across all servers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={cpuData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Usage" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} name="CPU %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="memory">
            <Card>
              <CardHeader>
                <CardTitle>Memory Usage Over Time</CardTitle>
                <CardDescription>Average memory utilization across all servers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={memoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Usage" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Memory %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="disk">
            <Card>
              <CardHeader>
                <CardTitle>Disk Usage Over Time</CardTitle>
                <CardDescription>Average disk utilization across all servers</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={diskData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="Usage" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Disk %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Servers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Server Status</CardTitle>
            <CardDescription>
              Real-time status and resource usage for all servers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Server ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CPU Usage</TableHead>
                  <TableHead>Memory Usage</TableHead>
                  <TableHead>Disk Usage</TableHead>
                  <TableHead>Uptime</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">{server.id}</TableCell>
                    <TableCell className="font-medium">{server.name}</TableCell>
                    <TableCell>{server.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(server.status)}>
                        {server.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUsageColor(server.cpuUsage)}`}
                            style={{ width: `${server.cpuUsage}%` }}
                          />
                        </div>
                        <span className="text-sm">{server.cpuUsage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUsageColor(server.memoryUsage)}`}
                            style={{ width: `${server.memoryUsage}%` }}
                          />
                        </div>
                        <span className="text-sm">{server.memoryUsage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getUsageColor(server.diskUsage)}`}
                            style={{ width: `${server.diskUsage}%` }}
                          />
                        </div>
                        <span className="text-sm">{server.diskUsage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{server.uptime.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ITPageLayout>
  )
}


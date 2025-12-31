'use client'

import { useState } from 'react'
import { ITPageLayout } from '@/components/it/it-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Network,
  Server,
  Wifi,
  Activity,
  CheckCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react'

interface NetworkDevice {
  id: string
  name: string
  type: string
  ipAddress: string
  status: string
  uptime: number
  bandwidthUsage: number
  location: string
}

export default function NetworksPage() {
  const [devices] = useState<NetworkDevice[]>([
    {
      id: 'NET-001',
      name: 'Main Router',
      type: 'Router',
      ipAddress: '192.168.1.1',
      status: 'ONLINE',
      uptime: 99.8,
      bandwidthUsage: 68,
      location: 'Server Room',
    },
    {
      id: 'NET-002',
      name: 'Core Switch - Floor 1',
      type: 'Switch',
      ipAddress: '192.168.1.10',
      status: 'ONLINE',
      uptime: 99.5,
      bandwidthUsage: 45,
      location: 'Floor 1 - Network Closet',
    },
    {
      id: 'NET-003',
      name: 'Core Switch - Floor 2',
      type: 'Switch',
      ipAddress: '192.168.1.11',
      status: 'ONLINE',
      uptime: 99.9,
      bandwidthUsage: 52,
      location: 'Floor 2 - Network Closet',
    },
    {
      id: 'NET-004',
      name: 'Wireless Access Point - Lobby',
      type: 'Access Point',
      ipAddress: '192.168.1.20',
      status: 'ONLINE',
      uptime: 98.5,
      bandwidthUsage: 35,
      location: 'Lobby',
    },
  ])

  const networkStats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'ONLINE').length,
    offlineDevices: devices.filter(d => d.status === 'OFFLINE').length,
    avgUptime: devices.reduce((sum, d) => sum + d.uptime, 0) / devices.length,
    totalBandwidth: devices.reduce((sum, d) => sum + d.bandwidthUsage, 0),
  }

  const bandwidthData = [
    { time: '00:00', Usage: 45, Capacity: 100 },
    { time: '06:00', Usage: 52, Capacity: 100 },
    { time: '12:00', Usage: 68, Capacity: 100 },
    { time: '18:00', Usage: 65, Capacity: 100 },
    { time: '24:00', Usage: 48, Capacity: 100 },
  ]

  const uptimeData = [
    { month: 'Jan', Uptime: 99.9 },
    { month: 'Feb', Uptime: 99.8 },
    { month: 'Mar', Uptime: 99.95 },
    { month: 'Apr', Uptime: 99.8 },
  ]

  const getStatusBadgeVariant = (status: string) => {
    return status === 'ONLINE' ? 'default' : 'destructive'
  }

  return (
    <ITPageLayout 
      title="Networks & Infrastructure" 
      description="Monitor network devices, performance, and infrastructure"
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{networkStats.totalDevices}</div>
              <p className="text-xs text-muted-foreground">Network devices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{networkStats.onlineDevices}</div>
              <p className="text-xs text-muted-foreground">Active devices</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{networkStats.avgUptime.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bandwidth Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{networkStats.totalBandwidth}%</div>
              <p className="text-xs text-muted-foreground">Current usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Usage</CardTitle>
              <CardDescription>Network bandwidth utilization over 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={bandwidthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="Usage" stroke="#9333ea" fill="#9333ea" fillOpacity={0.6} name="Usage %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Network Uptime Trend</CardTitle>
              <CardDescription>Monthly uptime percentage</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={uptimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[99, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Uptime" stroke="#10b981" strokeWidth={2} name="Uptime %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <Card>
          <CardHeader>
            <CardTitle>Network Devices</CardTitle>
            <CardDescription>
              {devices.length} device(s) monitored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Bandwidth Usage</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.id}</TableCell>
                    <TableCell className="font-medium">{device.name}</TableCell>
                    <TableCell>{device.type}</TableCell>
                    <TableCell className="font-mono text-sm">{device.ipAddress}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(device.status)}>
                        {device.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{device.uptime.toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              device.bandwidthUsage > 80 ? 'bg-red-500' :
                              device.bandwidthUsage > 60 ? 'bg-orange-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${device.bandwidthUsage}%` }}
                          />
                        </div>
                        <span className="text-sm">{device.bandwidthUsage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{device.location}</TableCell>
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


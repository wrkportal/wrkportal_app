'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/stores/authStore'
import { Settings, TrendingUp, Users, CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react'

export default function OperationsDashboardLandingPage() {
  const user = useAuthStore((state) => state.user)
  const router = useRouter()
  const [stats, setStats] = useState({
    activeProcesses: 0,
    efficiency: 0,
    teamMembers: 0,
    compliance: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/operations/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          // Calculate active processes from work orders
          const workOrdersResponse = await fetch('/api/operations/work-orders')
          let activeProcesses = 0
          if (workOrdersResponse.ok) {
            const woData = await workOrdersResponse.json()
            activeProcesses = woData.workOrders?.filter((wo: any) => 
              ['OPEN', 'SCHEDULED', 'IN_PROGRESS'].includes(wo.status)
            ).length || 0
          }
          
          setStats({
            activeProcesses,
            efficiency: data.capacityUtilization || 0,
            teamMembers: data.totalResources || 0,
            compliance: data.complianceRate || 0,
          })
        }
      } catch (error) {
        console.error('Error fetching operations stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Operations management and process optimization
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold">{stats.activeProcesses}</div>
            )}
            <p className="text-xs text-muted-foreground">Running operations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold">{stats.efficiency}%</div>
            )}
            <p className="text-xs text-muted-foreground">Process efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold">{stats.teamMembers}</div>
            )}
            <p className="text-xs text-muted-foreground">Operations team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold">...</div>
            ) : (
              <div className="text-2xl font-bold">{stats.compliance}%</div>
            )}
            <p className="text-xs text-muted-foreground">Compliance rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operations Management</CardTitle>
          <CardDescription>Manage operations, processes, and workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Operations dashboard coming soon</p>
              <Button onClick={() => router.push('/operations-dashboard')}>
                Go to Full Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}



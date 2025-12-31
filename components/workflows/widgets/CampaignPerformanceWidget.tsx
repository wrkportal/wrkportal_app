'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { Megaphone, TrendingUp, Users, DollarSign } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface CampaignPerformanceWidgetProps {
  workflowType?: string
}

export function CampaignPerformanceWidget({ workflowType }: CampaignPerformanceWidgetProps) {
  const { getTerm } = useWorkflowTerminology()
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch(`/api/marketing/campaigns/performance?workflowType=${workflowType}`)
        // if (response.ok) {
        //   const data = await response.json()
        //   setPerformanceData(data.performance || [])
        // }
        setPerformanceData([]) // Empty state
      } catch (error) {
        console.error('Error fetching campaign performance:', error)
        setPerformanceData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchPerformanceData()
  }, [workflowType])

  const totalRevenue = performanceData.reduce((sum, d) => sum + d.revenue, 0)
  const totalConversions = performanceData.reduce((sum, d) => sum + d.conversions, 0)
  const avgROI = totalRevenue > 0 ? ((totalRevenue - 40000) / 40000) * 100 : 0

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">Loading campaign data...</div>
        </CardContent>
      </Card>
    )
  }

  if (performanceData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Campaign Performance
          </CardTitle>
          <CardDescription>No campaign data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No campaign performance data available.</p>
            <p className="text-sm mt-2">Create {getTerm('projects')} to see performance metrics.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Campaign Performance
            </CardTitle>
            <CardDescription>
              Performance metrics for active {getTerm('projects').toLowerCase()}
            </CardDescription>
          </div>
          <Badge variant={avgROI > 0 ? 'default' : 'destructive'}>
            {avgROI > 0 ? '+' : ''}{avgROI.toFixed(1)}% ROI
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="conversions"
                stroke="#9333ea"
                name="Conversions"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="revenue"
                stroke="#ec4899"
                name="Revenue ($)"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <DollarSign className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <div className="text-xs text-muted-foreground">Total Revenue</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{totalConversions}</div>
              <div className="text-xs text-muted-foreground">Conversions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">
                {((totalConversions / performanceData.reduce((s, d) => s + d.clicks, 0)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}


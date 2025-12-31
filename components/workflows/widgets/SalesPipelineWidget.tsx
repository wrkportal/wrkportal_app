'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { TrendingUp, DollarSign } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface SalesPipelineWidgetProps {
  workflowType?: string
}

export function SalesPipelineWidget({ workflowType }: SalesPipelineWidgetProps) {
  const { getTerm } = useWorkflowTerminology()
  const [pipelineData, setPipelineData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch(`/api/sales/pipeline?workflowType=${workflowType}`)
        // if (response.ok) {
        //   const data = await response.json()
        //   setPipelineData(data.pipeline || [])
        // }
        setPipelineData([]) // Empty state
      } catch (error) {
        console.error('Error fetching pipeline data:', error)
        setPipelineData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchPipelineData()
  }, [workflowType])

  const totalValue = pipelineData.reduce((sum, stage) => sum + stage.value, 0)
  const wonValue = pipelineData.find((s) => s.stage === 'Won')?.value || 0
  const winRate = totalValue > 0 ? (wonValue / totalValue) * 100 : 0

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">Loading pipeline data...</div>
        </CardContent>
      </Card>
    )
  }

  if (pipelineData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sales Pipeline
          </CardTitle>
          <CardDescription>No {getTerm('projects')} in pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No sales data available.</p>
            <p className="text-sm mt-2">Create {getTerm('projects')} to see pipeline metrics.</p>
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
              <TrendingUp className="h-5 w-5" />
              Sales Pipeline
            </CardTitle>
            <CardDescription>
              {getTerm('projects')} by stage • Total: {formatCurrency(totalValue)}
            </CardDescription>
          </div>
          <Badge variant="outline">{Math.round(winRate)}% Win Rate</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="stage" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar dataKey="value" fill="#9333ea" name="Deal Value" />
              <Bar dataKey="count" fill="#ec4899" name="Number of Deals" />
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total {getTerm('projects')}</div>
              <div className="text-2xl font-bold">
                {pipelineData.reduce((sum, s) => sum + s.count, 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Value</div>
              <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
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


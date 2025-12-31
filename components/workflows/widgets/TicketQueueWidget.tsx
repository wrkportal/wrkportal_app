'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWorkflowTerminology } from '@/hooks/useWorkflowTerminology'
import { Headphones, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

interface TicketQueueWidgetProps {
  workflowType?: string
}

export function TicketQueueWidget({ workflowType }: TicketQueueWidgetProps) {
  const { getTerm } = useWorkflowTerminology()
  const [ticketData, setTicketData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [avgResponseTime, setAvgResponseTime] = useState<string>('0 hours')
  const [slaCompliance, setSlaCompliance] = useState<number>(0)

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        // TODO: Replace with actual API endpoint when available
        // const response = await fetch(`/api/support/tickets/queue?workflowType=${workflowType}`)
        // if (response.ok) {
        //   const data = await response.json()
        //   setTicketData(data.tickets || [])
        //   setAvgResponseTime(data.avgResponseTime || '0 hours')
        //   setSlaCompliance(data.slaCompliance || 0)
        // }
        setTicketData([]) // Empty state
        setAvgResponseTime('0 hours')
        setSlaCompliance(0)
      } catch (error) {
        console.error('Error fetching ticket data:', error)
        setTicketData([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchTicketData()
  }, [workflowType])

  const totalTickets = ticketData.reduce((sum, t) => sum + t.count, 0)
  const chartData = ticketData.map((t) => ({
    name: t.status,
    value: t.count,
    color: t.color,
  }))

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">Loading ticket data...</div>
        </CardContent>
      </Card>
    )
  }

  if (ticketData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Ticket Queue
          </CardTitle>
          <CardDescription>No tickets available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No support tickets available.</p>
            <p className="text-sm mt-2">Create {getTerm('tasks')} to see ticket metrics.</p>
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
              <Headphones className="h-5 w-5" />
              Ticket Queue
            </CardTitle>
            <CardDescription>
              Support {getTerm('tasks').toLowerCase()} overview
            </CardDescription>
          </div>
          <Badge variant="outline">{totalTickets} Total</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Avg Response</div>
                <div className="font-semibold">{avgResponseTime}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-sm text-muted-foreground">SLA Compliance</div>
                <div className="font-semibold">{slaCompliance}%</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {ticketData.map((ticket) => (
              <div key={ticket.status} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ticket.color }}
                  />
                  <span className="text-sm">{ticket.status}</span>
                </div>
                <Badge variant="secondary">{ticket.count}</Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


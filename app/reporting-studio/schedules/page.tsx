/**
 * Phase 5.6: Schedule Management UI
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Play,
  Pause,
  Edit,
  Trash2,
  Clock,
  Mail,
  Calendar,
  FileText,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import ScheduleForm from '@/components/scheduling/schedule-form'
import { HelpDialog } from '@/components/help/help-dialog'
import { LoadingState } from '@/components/ui/loading-state'
import { ErrorMessage } from '@/components/ui/error-message'

export default function SchedulesPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/schedules')
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules || [])
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Failed to load schedules')
      }
    } catch (error: any) {
      console.error('Error fetching schedules:', error)
      setError(error.message || 'Failed to load schedules')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (schedule: any) => {
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: !schedule.isActive,
        }),
      })

      if (res.ok) {
        fetchSchedules()
      }
    } catch (error) {
      console.error('Error toggling schedule:', error)
    }
  }

  const handleRunNow = async (schedule: any) => {
    try {
      const res = await fetch(`/api/schedules/${schedule.id}/run`, {
        method: 'POST',
      })

      if (res.ok) {
        alert('Schedule executed successfully!')
        fetchSchedules()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to run schedule')
      }
    } catch (error) {
      console.error('Error running schedule:', error)
      alert('Failed to run schedule')
    }
  }

  const handleDelete = async (schedule: any) => {
    if (!confirm(`Are you sure you want to delete "${schedule.name}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        fetchSchedules()
      }
    } catch (error) {
      console.error('Error deleting schedule:', error)
    }
  }

  const getStatusBadge = (schedule: any) => {
    if (!schedule.isActive) {
      return <Badge variant="secondary">Paused</Badge>
    }
    switch (schedule.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500">Active</Badge>
      case 'PAUSED':
        return <Badge variant="secondary">Paused</Badge>
      case 'COMPLETED':
        return <Badge variant="outline">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{schedule.status}</Badge>
    }
  }

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      ONCE: 'Once',
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly',
      CUSTOM: 'Custom',
    }
    return labels[frequency] || frequency
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Schedules</h1>
            <p className="text-muted-foreground mt-1">
              Schedule automated delivery of reports and dashboards
            </p>
          </div>
          <HelpDialog page="schedules" />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create Schedule</DialogTitle>
              <DialogDescription>
                Schedule automated delivery of reports or dashboards
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              onSuccess={() => {
                setIsCreateDialogOpen(false)
                fetchSchedules()
              }}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage
          title="Error Loading Schedules"
          message={error}
          onRetry={fetchSchedules}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Schedules Table */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <LoadingState message="Loading schedules..." />
          </CardContent>
        </Card>
      ) : error ? null : schedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No schedules yet</p>
            <p className="text-sm text-muted-foreground mt-2 mb-4">
              Create your first schedule to automate report delivery
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Deliveries</CardTitle>
            <CardDescription>
              Manage automated delivery schedules for reports and dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Channels</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell className="font-medium">{schedule.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{schedule.resourceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{getFrequencyLabel(schedule.frequency)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {schedule.deliveryChannels.slice(0, 3).map((channel: string) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                        {schedule.deliveryChannels.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{schedule.deliveryChannels.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule)}</TableCell>
                    <TableCell>
                      {schedule.nextRunAt ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatDate(schedule.nextRunAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {schedule.lastRunAt ? (
                        <span className="text-sm">
                          {formatDate(schedule.lastRunAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {schedule.successCount || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {schedule.failureCount || 0}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRunNow(schedule)}
                          title="Run Now"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(schedule)}
                          title={schedule.isActive ? 'Pause' : 'Resume'}
                        >
                          {schedule.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSchedule(schedule)
                            setIsCreateDialogOpen(true)
                          }}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(schedule)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


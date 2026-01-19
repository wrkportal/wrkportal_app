'use client'

import { useState, useEffect } from 'react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash2, Download, Calendar, Share2, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ReportBuilder } from '@/components/sales/report-builder'

interface Report {
  id: string
  name: string
  description?: string
  config: {
    type: 'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'CUSTOM'
    dataSource: string
    filters?: Record<string, any>
    dateRange?: {
      start: string
      end: string
    }
  }
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
    dayOfWeek?: number
    dayOfMonth?: number
    time?: string
    recipients: string[]
    format: 'PDF' | 'EXCEL' | 'CSV' | 'JSON'
  } | null
  sharedWith: string[]
  createdBy: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}

export default function SalesReportsPage() {
  const { toast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<'list' | 'builder'>('list')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/sales/reports')
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return

    try {
      const response = await fetch(`/api/sales/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Report deleted successfully',
        })
        fetchReports()
      } else {
        throw new Error('Failed to delete report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete report',
        variant: 'destructive',
      })
    }
  }

  const handleGenerateReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/sales/reports/${reportId}?generate=true`)
      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: 'Report generated successfully',
        })
        // Could open a preview dialog or download the report
        return data
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      })
    }
  }

  const handleEditReport = (report: Report) => {
    setSelectedReport(report)
    setEditDialogOpen(true)
    setActiveTab('builder')
  }

  return (
    <SalesPageLayout
      title="Reports"
      description="Create and manage sales reports"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Reports</h2>
            <p className="text-muted-foreground">
              Create custom reports with scheduling and sharing
            </p>
          </div>
          <Button onClick={() => {
            setSelectedReport(null)
            setCreateDialogOpen(true)
            setActiveTab('builder')
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'builder')}>
          <TabsList>
            <TabsTrigger value="list">My Reports</TabsTrigger>
            <TabsTrigger value="builder">Report Builder</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">No reports yet</p>
                  <Button onClick={() => {
                    setSelectedReport(null)
                    setCreateDialogOpen(true)
                    setActiveTab('builder')
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Report
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reports.map(report => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{report.name}</CardTitle>
                          {report.description && (
                            <CardDescription className="mt-1">
                              {report.description}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant="outline">{report.config.type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">
                          Data Source: {report.config.dataSource}
                        </div>
                        {report.schedule && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {report.schedule.frequency}
                            {report.schedule.time && ` at ${report.schedule.time}`}
                          </div>
                        )}
                        {report.sharedWith.length > 0 && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Share2 className="h-3 w-3" />
                            Shared with {report.sharedWith.length} user(s)
                          </div>
                        )}
                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateReport(report.id)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Generate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditReport(report)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="builder">
            <ReportBuilder
              report={selectedReport}
              onSave={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
                fetchReports()
                setActiveTab('list')
              }}
            />
          </TabsContent>
        </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
          setCreateDialogOpen(open)
          setEditDialogOpen(open)
          if (!open) setSelectedReport(null)
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedReport ? 'Edit Report' : 'Create New Report'}
              </DialogTitle>
              <DialogDescription>
                Configure your report settings and schedule
              </DialogDescription>
            </DialogHeader>
            <ReportBuilder
              report={selectedReport}
              onSave={() => {
                setCreateDialogOpen(false)
                setEditDialogOpen(false)
                fetchReports()
                setActiveTab('list')
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </SalesPageLayout>
  )
}


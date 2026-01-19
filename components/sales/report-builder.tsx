'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Clock, Users, FileText, Sparkles } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Report {
  id?: string
  name?: string
  description?: string
  config?: {
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
  sharedWith?: string[]
}

interface ReportBuilderProps {
  report?: Report | null
  onSave?: () => void
}

export function ReportBuilder({ report, onSave }: ReportBuilderProps) {
  const { toast } = useToast()
  const [name, setName] = useState(report?.name || '')
  const [description, setDescription] = useState(report?.description || '')
  const [reportType, setReportType] = useState<'ANALYTICS' | 'PERFORMANCE' | 'FORECAST' | 'CUSTOM'>(
    report?.config?.type || 'ANALYTICS'
  )
  const [dataSource, setDataSource] = useState(report?.config?.dataSource || 'opportunities')
  const [dateRange, setDateRange] = useState({
    start: report?.config?.dateRange?.start || '',
    end: report?.config?.dateRange?.end || '',
  })
  const [scheduled, setScheduled] = useState(!!report?.schedule)
  const [schedule, setSchedule] = useState({
    frequency: report?.schedule?.frequency || 'WEEKLY',
    dayOfWeek: report?.schedule?.dayOfWeek || 1,
    dayOfMonth: report?.schedule?.dayOfMonth || 1,
    time: report?.schedule?.time || '09:00',
    format: report?.schedule?.format || 'PDF',
    recipients: report?.schedule?.recipients || [],
  })
  const [sharedWith, setSharedWith] = useState<string[]>(report?.sharedWith || [])
  const [newRecipient, setNewRecipient] = useState('')
  const [newSharedUser, setNewSharedUser] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [templatesDialogOpen, setTemplatesDialogOpen] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Report name is required',
        variant: 'destructive',
      })
      return
    }

    try {
      const reportData = {
        name,
        description,
        config: {
          type: reportType,
          dataSource,
          dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        },
        schedule: scheduled ? schedule : null,
        sharedWith,
      }

      const url = report?.id ? `/api/sales/reports/${report.id}` : '/api/sales/reports'
      const method = report?.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: report?.id ? 'Report updated successfully' : 'Report created successfully',
        })
        if (onSave) onSave()
      } else {
        throw new Error('Failed to save report')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save report',
        variant: 'destructive',
      })
    }
  }

  const addRecipient = () => {
    if (newRecipient.trim() && !schedule.recipients.includes(newRecipient)) {
      setSchedule({
        ...schedule,
        recipients: [...schedule.recipients, newRecipient],
      })
      setNewRecipient('')
    }
  }

  const removeRecipient = (recipient: string) => {
    setSchedule({
      ...schedule,
      recipients: schedule.recipients.filter(r => r !== recipient),
    })
  }

  const addSharedUser = () => {
    if (newSharedUser.trim() && !sharedWith.includes(newSharedUser)) {
      setSharedWith([...sharedWith, newSharedUser])
      setNewSharedUser('')
    }
  }

  const removeSharedUser = (userId: string) => {
    setSharedWith(sharedWith.filter(u => u !== userId))
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/sales/reports/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const applyTemplate = (template: any) => {
    setName(template.name)
    setDescription(template.description)
    setReportType(template.config.type)
    setDataSource(template.config.dataSource)
    if (template.config.dateRange) {
      setDateRange({
        start: template.config.dateRange.start,
        end: template.config.dateRange.end,
      })
    }
    if (template.schedule) {
      setScheduled(true)
      setSchedule(template.schedule)
    }
    setTemplatesDialogOpen(false)
    toast({
      title: 'Template Applied',
      description: `Applied "${template.name}" template`,
    })
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="config" className="w-full">
        <TabsList>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="sharing">Sharing</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Report Configuration</Label>
              <p className="text-sm text-muted-foreground">
                Configure your report settings or start from a template
              </p>
            </div>
            <Dialog open={templatesDialogOpen} onOpenChange={setTemplatesDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Use Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Report Templates</DialogTitle>
                  <DialogDescription>
                    Choose a pre-built template to get started quickly
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => applyTemplate(template)}
                    >
                      <CardHeader>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div>
            <Label>Report Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Sales Report"
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Report description"
            />
          </div>

          <div>
            <Label>Report Type</Label>
            <Select value={reportType} onValueChange={(v: any) => setReportType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANALYTICS">Analytics</SelectItem>
                <SelectItem value="PERFORMANCE">Performance</SelectItem>
                <SelectItem value="FORECAST">Forecast</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Data Source</Label>
            <Select value={dataSource} onValueChange={setDataSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opportunities">Opportunities</SelectItem>
                <SelectItem value="leads">Leads</SelectItem>
                <SelectItem value="activities">Activities</SelectItem>
                <SelectItem value="forecast">Forecast</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Scheduling</Label>
              <p className="text-sm text-muted-foreground">
                Automatically generate and send reports
              </p>
            </div>
            <Switch
              checked={scheduled}
              onCheckedChange={setScheduled}
            />
          </div>

          {scheduled && (
            <>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={schedule.frequency}
                  onValueChange={(v: any) => setSchedule({ ...schedule, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {schedule.frequency === 'WEEKLY' && (
                <div>
                  <Label>Day of Week</Label>
                  <Select
                    value={schedule.dayOfWeek?.toString()}
                    onValueChange={(v) => setSchedule({ ...schedule, dayOfWeek: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sunday</SelectItem>
                      <SelectItem value="1">Monday</SelectItem>
                      <SelectItem value="2">Tuesday</SelectItem>
                      <SelectItem value="3">Wednesday</SelectItem>
                      <SelectItem value="4">Thursday</SelectItem>
                      <SelectItem value="5">Friday</SelectItem>
                      <SelectItem value="6">Saturday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(schedule.frequency === 'MONTHLY' || schedule.frequency === 'QUARTERLY') && (
                <div>
                  <Label>Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={schedule.dayOfMonth}
                    onChange={(e) => setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value) })}
                  />
                </div>
              )}

              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={schedule.time}
                  onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
                />
              </div>

              <div>
                <Label>Export Format</Label>
                <Select
                  value={schedule.format}
                  onValueChange={(v: any) => setSchedule({ ...schedule, format: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="EXCEL">Excel</SelectItem>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="JSON">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Email address"
                    onKeyPress={(e) => e.key === 'Enter' && addRecipient()}
                  />
                  <Button type="button" onClick={addRecipient}>Add</Button>
                </div>
                <div className="mt-2 space-y-1">
                  {schedule.recipients.map((recipient, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{recipient}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeRecipient(recipient)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="sharing" className="space-y-4">
          <div>
            <Label>Share With Users</Label>
            <div className="flex gap-2">
              <Input
                value={newSharedUser}
                onChange={(e) => setNewSharedUser(e.target.value)}
                placeholder="User ID or email"
                onKeyPress={(e) => e.key === 'Enter' && addSharedUser()}
              />
              <Button type="button" onClick={addSharedUser}>Add</Button>
            </div>
            <div className="mt-2 space-y-1">
              {sharedWith.map((userId, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">{userId}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSharedUser(userId)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onSave && onSave()}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {report?.id ? 'Update Report' : 'Create Report'}
        </Button>
      </div>
    </div>
  )
}


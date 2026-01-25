/**
 * Phase 5.6: Schedule Form Component
 */

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
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { ContextualHelp } from '@/components/help/contextual-help'

interface ScheduleFormProps {
  schedule?: any
  onSuccess: () => void
  onCancel: () => void
}

export default function ScheduleForm({ schedule, onSuccess, onCancel }: ScheduleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    description: schedule?.description || '',
    resourceType: schedule?.resourceType || 'REPORT',
    resourceId: schedule?.resourceId || '',
    frequency: schedule?.frequency || 'DAILY',
    cronExpression: schedule?.cronExpression || '',
    timezone: schedule?.timezone || 'UTC',
    startDate: schedule?.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : '',
    endDate: schedule?.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : '',
    exportFormat: schedule?.exportFormat || 'PDF',
    includeCharts: schedule?.includeCharts ?? true,
    includeData: schedule?.includeData ?? true,
    pageSize: schedule?.pageSize || 'A4',
    orientation: schedule?.orientation || 'portrait',
    deliveryChannels: schedule?.deliveryChannels || ['EMAIL'],
    recipients: schedule?.recipients?.join(',') || '',
    subject: schedule?.subject || '',
    message: schedule?.message || '',
    attachFile: schedule?.attachFile ?? true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        recipients: formData.recipients.split(',').map((r: string) => r.trim()).filter(Boolean),
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
        cronExpression: formData.frequency === 'CUSTOM' ? formData.cronExpression : undefined,
      }

      const url = schedule ? `/api/schedules/${schedule.id}` : '/api/schedules'
      const method = schedule ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to save schedule')
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="name">Schedule Name *</Label>
              <ContextualHelp content="Give your schedule a descriptive name that helps you identify it later" />
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Daily Sales Report"
              aria-label="Schedule name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Schedule description..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="resourceType">Resource Type *</Label>
              <Select
                value={formData.resourceType}
                onValueChange={(value) => setFormData({ ...formData, resourceType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REPORT">Report</SelectItem>
                  <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                  <SelectItem value="DATASET">Dataset</SelectItem>
                  <SelectItem value="TRANSFORMATION">Transformation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="resourceId">Resource ID *</Label>
              <Input
                id="resourceId"
                value={formData.resourceId}
                onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                required
                placeholder="Resource ID"
              />
            </div>
          </div>
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="frequency">Frequency *</Label>
                <ContextualHelp content="Choose how often the report should be generated and delivered. Use Custom for advanced cron expressions." />
              </div>
              <Select
                value={formData.frequency}
                onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                aria-label="Schedule frequency"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">Once</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="CUSTOM">Custom (Cron)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone *</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="UTC"
              />
            </div>
          </div>

          {formData.frequency === 'CUSTOM' && (
            <div>
              <Label htmlFor="cronExpression">Cron Expression *</Label>
              <Input
                id="cronExpression"
                value={formData.cronExpression}
                onChange={(e) => setFormData({ ...formData, cronExpression: e.target.value })}
                placeholder="0 9 * * * (9 AM daily)"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: minute hour day month weekday
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="exportFormat">Export Format *</Label>
              <Select
                value={formData.exportFormat}
                onValueChange={(value) => setFormData({ ...formData, exportFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="PNG">PNG</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pageSize">Page Size</Label>
              <Select
                value={formData.pageSize}
                onValueChange={(value) => setFormData({ ...formData, pageSize: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="Letter">Letter</SelectItem>
                  <SelectItem value="Legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="orientation">Orientation</Label>
            <Select
              value={formData.orientation}
              onValueChange={(value) => setFormData({ ...formData, orientation: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeCharts"
                checked={formData.includeCharts}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, includeCharts: !!checked })
                }
              />
              <Label htmlFor="includeCharts">Include Charts</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeData"
                checked={formData.includeData}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, includeData: !!checked })
                }
              />
              <Label htmlFor="includeData">Include Data Tables</Label>
            </div>
          </div>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-4">
          <div>
            <Label>Delivery Channels *</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['EMAIL', 'SLACK', 'TEAMS', 'WEBHOOK', 'GOOGLE_DRIVE', 'DROPBOX', 'ONEDRIVE', 'S3'].map(
                (channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={channel}
                      checked={formData.deliveryChannels.includes(channel)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            deliveryChannels: [...formData.deliveryChannels, channel],
                          })
                        } else {
                          setFormData({
                            ...formData,
                            deliveryChannels: formData.deliveryChannels.filter((c: string) => c !== channel),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={channel}>{channel}</Label>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="recipients">Recipients *</Label>
            <Textarea
              id="recipients"
              value={formData.recipients}
              onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
              placeholder="email1@example.com, email2@example.com or #channel-name"
              required
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Comma-separated email addresses, Slack channels, or webhook URLs
            </p>
          </div>

          <div>
            <Label htmlFor="subject">Email Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Scheduled Report: {name}"
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Optional message to include with the delivery"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="attachFile"
              checked={formData.attachFile}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, attachFile: !!checked })
              }
            />
            <Label htmlFor="attachFile">Attach File</Label>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            schedule ? 'Update Schedule' : 'Create Schedule'
          )}
        </Button>
      </div>
    </form>
  )
}


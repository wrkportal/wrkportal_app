'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Globe,
  Mail,
  Calendar,
  Linkedin,
  CalendarDays,
  Settings,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
} from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'

export default function IntegrationsPage() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [calendarStatus, setCalendarStatus] = useState<any>(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [eventUrl, setEventUrl] = useState('')
  const [emailConfig, setEmailConfig] = useState({
    host: '',
    port: 993,
    secure: true,
    user: '',
    password: '',
    filters: {
      ignore: [] as string[],
    },
  })

  useEffect(() => {
    fetchIntegrationStatus()
  }, [])

  const fetchIntegrationStatus = async () => {
    try {
      // Fetch webhook URL
      const webhookRes = await fetch('/api/sales/integrations/webhook')
      if (webhookRes.ok) {
        const webhookData = await webhookRes.json()
        setWebhookUrl(webhookData.webhookUrl)
      }

      // Fetch email-to-lead status
      const emailRes = await fetch('/api/sales/integrations/email-to-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      })
      if (emailRes.ok) {
        const emailData = await emailRes.json()
        setEmailStatus(emailData)
      }

      // Fetch calendar status
      const calendarRes = await fetch('/api/sales/integrations/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status', provider: 'gmail' }),
      })
      if (calendarRes.ok) {
        const calendarData = await calendarRes.json()
        setCalendarStatus(calendarData)
      }

      // Fetch LinkedIn URL
      const linkedinRes = await fetch('/api/sales/integrations/linkedin')
      if (linkedinRes.ok) {
        const linkedinData = await linkedinRes.json()
        setLinkedinUrl(linkedinData.webhookUrl)
      }

      // Fetch Event URL
      const eventRes = await fetch('/api/sales/integrations/events')
      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEventUrl(eventData.webhookUrl)
      }
    } catch (error) {
      console.error('Error fetching integration status:', error)
    }
  }

  const handleEmailConnect = async () => {
    try {
      const response = await fetch('/api/sales/integrations/email-to-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          config: emailConfig,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email connection established',
        })
        fetchIntegrationStatus()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to connect email',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to connect email',
        variant: 'destructive',
      })
    }
  }

  const handleEmailDisconnect = async () => {
    try {
      const response = await fetch('/api/sales/integrations/email-to-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Email disconnected',
        })
        fetchIntegrationStatus()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect email',
        variant: 'destructive',
      })
    }
  }

  const handleCalendarSync = async (provider: 'gmail' | 'outlook') => {
    try {
      const response = await fetch('/api/sales/integrations/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          provider,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Success',
          description: data.message || 'Calendar synced successfully',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to sync calendar',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync calendar',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Success',
      description: 'Copied to clipboard',
    })
  }

  return (
    <SalesPageLayout
      title="Integrations"
      description="Connect external services to automatically capture and sync leads"
    >
      <Tabs defaultValue="website" className="space-y-6">
        <TabsList>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="email">Email-to-Lead</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Sync</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        {/* Website Integration */}
        <TabsContent value="website" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <CardTitle>Website Integration</CardTitle>
              </div>
              <CardDescription>
                Capture leads from your website "Show Demo" or "Contact Us" buttons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(webhookUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Add this URL to your website buttons to automatically create leads
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Example Implementation:</h4>
                <pre className="text-xs overflow-x-auto">
                  {`<button onclick="captureLead()">Show Demo</button>

<script>
async function captureLead() {
  await fetch('${webhookUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      company: 'Acme Corp',
      source: 'WEBSITE_DEMO',
      campaign: 'Q1-2024'
    })
  })
}
</script>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email-to-Lead */}
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <CardTitle>Email-to-Lead</CardTitle>
              </div>
              <CardDescription>
                Automatically create leads from emails sent to your sales inbox
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailStatus?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Connected</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Connected at: {new Date(emailStatus.connectedAt).toLocaleString()}
                  </div>
                  <Button variant="destructive" onClick={handleEmailDisconnect}>
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="emailHost">Email Host</Label>
                    <Select
                      value={emailConfig.host}
                      onValueChange={(value) =>
                        setEmailConfig({
                          ...emailConfig,
                          host: value,
                          port: value.includes('gmail') ? 993 : value.includes('outlook') ? 993 : 993,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="imap.gmail.com">Gmail</SelectItem>
                        <SelectItem value="outlook.office365.com">Outlook/Office 365</SelectItem>
                        <SelectItem value="custom">Custom IMAP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {emailConfig.host === 'custom' && (
                    <>
                      <div>
                        <Label htmlFor="customHost">IMAP Host</Label>
                        <Input
                          id="customHost"
                          value={emailConfig.host}
                          onChange={(e) =>
                            setEmailConfig({ ...emailConfig, host: e.target.value })
                          }
                          placeholder="imap.example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="port">Port</Label>
                        <Input
                          id="port"
                          type="number"
                          value={emailConfig.port}
                          onChange={(e) =>
                            setEmailConfig({
                              ...emailConfig,
                              port: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="emailUser">Email Address</Label>
                    <Input
                      id="emailUser"
                      type="email"
                      value={emailConfig.user}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, user: e.target.value })
                      }
                      placeholder="sales@yourcompany.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailPassword">App Password / Password</Label>
                    <Input
                      id="emailPassword"
                      type="password"
                      value={emailConfig.password}
                      onChange={(e) =>
                        setEmailConfig({ ...emailConfig, password: e.target.value })
                      }
                      placeholder="Enter app password"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      For Gmail, use an App Password. For Outlook, use your regular password or App Password.
                    </p>
                  </div>

                  <Button onClick={handleEmailConnect}>Connect Email</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Sync */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <CardTitle>Calendar Sync</CardTitle>
              </div>
              <CardDescription>
                Sync Gmail or Outlook calendar to automatically create meeting activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gmail Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCalendarSync('gmail')}
                      className="w-full"
                    >
                      Sync Gmail Calendar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Syncs meetings from your Gmail calendar
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Outlook Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleCalendarSync('outlook')}
                      className="w-full"
                    >
                      Sync Outlook Calendar
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Syncs meetings from your Outlook calendar
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LinkedIn Integration */}
        <TabsContent value="linkedin" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Linkedin className="h-5 w-5" />
                <CardTitle>LinkedIn Integration</CardTitle>
              </div>
              <CardDescription>
                Capture leads from LinkedIn Lead Gen Forms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>LinkedIn Webhook URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={linkedinUrl} readOnly className="font-mono text-sm" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(linkedinUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure LinkedIn Lead Gen Forms to send submissions to this URL
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Integration */}
        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <CardTitle>Event Registration Sync</CardTitle>
              </div>
              <CardDescription>
                Capture leads from event registrations (Eventbrite, Zoom, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Event Webhook URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={eventUrl} readOnly className="font-mono text-sm" />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(eventUrl)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Configure your event platform to send registration data to this URL
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SalesPageLayout>
  )
}


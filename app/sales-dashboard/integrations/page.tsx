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
  Plus,
} from 'lucide-react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/hooks/use-toast'
import { FieldMappingEditor } from '@/components/sales/field-mapping-editor'
import { OAuthConnectionWizard } from '@/components/sales/oauth-connection-wizard'

export default function IntegrationsPage() {
  const user = useAuthStore((state) => state.user)
  const { toast } = useToast()
  const [webhookUrl, setWebhookUrl] = useState('')
  const [emailStatus, setEmailStatus] = useState<any>(null)
  const [calendarStatus, setCalendarStatus] = useState<any>(null)
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [eventUrl, setEventUrl] = useState('')
  const [oauthProvider, setOauthProvider] = useState<string | null>(null)
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
      <Tabs defaultValue="crm" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="crm">CRM</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          <TabsTrigger value="email">Email-to-Lead</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* OAuth Connection Wizard */}
        {oauthProvider && (
          <OAuthConnectionWizard
            provider={oauthProvider}
            onComplete={(integrationId) => {
              setOauthProvider(null)
              toast({
                title: 'Success',
                description: 'Integration connected successfully',
              })
            }}
            onCancel={() => {
              setOauthProvider(null)
            }}
          />
        )}

        {/* CRM Integrations */}
        <TabsContent value="crm" className="space-y-4">
          <CRMTab onOAuthConnect={setOauthProvider} />
        </TabsContent>

        {/* Communication Integrations */}
        <TabsContent value="communication" className="space-y-4">
          <CommunicationTab onOAuthConnect={setOauthProvider} />
        </TabsContent>

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

        {/* Other Integrations */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Integrations</CardTitle>
              <CardDescription>
                LinkedIn, Events, and other webhook-based integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* LinkedIn */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5" />
                      <span className="font-semibold">LinkedIn</span>
                    </div>
                    <Badge variant="secondary">Webhook</Badge>
                  </div>
                  <div className="mt-2">
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
                  </div>
                </div>

                {/* Events */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5" />
                      <span className="font-semibold">Event Registration</span>
                    </div>
                    <Badge variant="secondary">Webhook</Badge>
                  </div>
                  <div className="mt-2">
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </SalesPageLayout>
  )
}

function CRMTab({ onOAuthConnect }: { onOAuthConnect: (provider: string) => void }) {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/sales/integrations/manage')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations?.filter((i: any) => i.type === 'CRM') || [])
      }
    } catch (error) {
      console.error('Error fetching CRM integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const crmProviders = [
    { id: 'salesforce', name: 'Salesforce', icon: '☁️', description: 'Bi-directional sync with Salesforce CRM' },
    { id: 'hubspot', name: 'HubSpot', icon: '🟠', description: 'Sync leads, contacts, and deals with HubSpot' },
    { id: 'dynamics', name: 'Microsoft Dynamics', icon: '🔷', description: 'Full integration with Dynamics 365' },
  ]

  const oauthProviders = ['salesforce', 'hubspot', 'dynamics']

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">CRM Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect your CRM to sync leads, opportunities, and contacts
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedProvider(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add CRM Integration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Connect CRM</DialogTitle>
              <DialogDescription>
                Select a CRM provider to connect
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              {crmProviders.map(provider => (
                <Card
                  key={provider.id}
                  className="cursor-pointer hover:border-blue-500"
                  onClick={() => setSelectedProvider(provider.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{provider.icon}</span>
                      <div className="flex-1">
                        <div className="font-semibold">{provider.name}</div>
                        <div className="text-sm text-muted-foreground">{provider.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>

      </div>

      {loading ? (
        <div className="text-center py-8">Loading integrations...</div>
      ) : integrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No CRM integrations connected</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Connect Your First CRM
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                    <CardDescription>{integration.provider}</CardDescription>
                  </div>
                  <Badge variant={integration.status === 'CONNECTED' ? 'default' : 'secondary'}>
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/sales/integrations/manage/${integration.id}/sync`, {
                          method: 'POST',
                        })
                        if (response.ok) {
                          toast({
                            title: 'Success',
                            description: 'Sync started',
                          })
                          fetchIntegrations()
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to sync',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    Sync Now
                  </Button>
                  {integration.lastSyncAt && (
                    <span className="text-sm text-muted-foreground">
                      Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Sync Frequency</Label>
                    <Select
                      value={integration.syncFrequency || 'MANUAL'}
                      onValueChange={async (value) => {
                        try {
                          const response = await fetch(`/api/sales/integrations/manage/${integration.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncFrequency: value }),
                          })
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: 'Sync frequency updated',
                            })
                            fetchIntegrations()
                          }
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to update sync frequency',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual Only</SelectItem>
                        <SelectItem value="REAL_TIME">Real-time (5 min)</SelectItem>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-xs">Sync Direction</Label>
                    <Select
                      value={integration.syncDirection || 'BIDIRECTIONAL'}
                      onValueChange={async (value) => {
                        try {
                          const response = await fetch(`/api/sales/integrations/manage/${integration.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncDirection: value }),
                          })
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: 'Sync direction updated',
                            })
                            fetchIntegrations()
                          }
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to update sync direction',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FROM_EXTERNAL">From External</SelectItem>
                        <SelectItem value="TO_EXTERNAL">To External</SelectItem>
                        <SelectItem value="BIDIRECTIONAL">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function CommunicationTab({ onOAuthConnect }: { onOAuthConnect: (provider: string) => void }) {
  const [integrations, setIntegrations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/sales/integrations/manage')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations?.filter((i: any) => i.type === 'COMMUNICATION') || [])
      }
    } catch (error) {
      console.error('Error fetching communication integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const communicationProviders = [
    { id: 'slack', name: 'Slack', icon: '💬', description: 'Send notifications to Slack channels' },
    { id: 'teams', name: 'Microsoft Teams', icon: '👥', description: 'Send updates to Teams channels' },
    { id: 'zoom', name: 'Zoom', icon: '📹', description: 'Schedule and join Zoom meetings' },
    { id: 'webex', name: 'Webex', icon: '💻', description: 'Schedule and join Webex meetings' },
  ]

  const oauthProviders = ['slack', 'teams', 'zoom', 'webex']

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Communication Integrations</h3>
        <p className="text-sm text-muted-foreground">
          Connect communication tools for notifications and meetings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {communicationProviders.map(provider => (
          <Card key={provider.id} className="cursor-pointer hover:border-blue-500">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{provider.icon}</span>
                <CardTitle className="text-base">{provider.name}</CardTitle>
              </div>
              <CardDescription>{provider.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (oauthProviders.includes(provider.id)) {
                    onOAuthConnect(provider.id)
                  } else {
                    // For non-OAuth providers, show API key dialog
                    toast({
                      title: 'Coming Soon',
                      description: `${provider.name} integration setup will be available soon`,
                    })
                  }
                }}
              >
                Connect
              </Button>
              {oauthProviders.includes(provider.id) && (
                <Badge variant="outline" className="mt-2">OAuth</Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length > 0 && (
        <div className="space-y-4 mt-4">
          <h4 className="font-semibold">Connected Integrations</h4>
          {integrations.map((integration) => (
            <Card key={integration.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription>{integration.provider}</CardDescription>
                  </div>
                  <Badge variant={integration.status === 'CONNECTED' ? 'default' : 'secondary'}>
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/sales/integrations/manage/${integration.id}/sync`, {
                          method: 'POST',
                        })
                        if (response.ok) {
                          toast({
                            title: 'Success',
                            description: 'Sync started',
                          })
                          fetchIntegrations()
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: 'Failed to sync',
                          variant: 'destructive',
                        })
                      }
                    }}
                  >
                    Sync Now
                  </Button>
                  {integration.lastSyncAt && (
                    <span className="text-sm text-muted-foreground">
                      Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-xs">Sync Frequency</Label>
                    <Select
                      value={integration.syncFrequency || 'MANUAL'}
                      onValueChange={async (value) => {
                        try {
                          const response = await fetch(`/api/sales/integrations/manage/${integration.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncFrequency: value }),
                          })
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: 'Sync frequency updated',
                            })
                            fetchIntegrations()
                          }
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to update sync frequency',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual Only</SelectItem>
                        <SelectItem value="REAL_TIME">Real-time (5 min)</SelectItem>
                        <SelectItem value="HOURLY">Hourly</SelectItem>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <Label className="text-xs">Sync Direction</Label>
                    <Select
                      value={integration.syncDirection || 'BIDIRECTIONAL'}
                      onValueChange={async (value) => {
                        try {
                          const response = await fetch(`/api/sales/integrations/manage/${integration.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ syncDirection: value }),
                          })
                          if (response.ok) {
                            toast({
                              title: 'Success',
                              description: 'Sync direction updated',
                            })
                            fetchIntegrations()
                          }
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: 'Failed to update sync direction',
                            variant: 'destructive',
                          })
                        }
                      }}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FROM_EXTERNAL">From External</SelectItem>
                        <SelectItem value="TO_EXTERNAL">To External</SelectItem>
                        <SelectItem value="BIDIRECTIONAL">Bidirectional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}


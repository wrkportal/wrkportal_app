'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, ExternalLink, Check, Plus, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Integration {
  id: string
  name: string
  description: string
  category: string
  icon: string
  connected: boolean
  popular?: boolean
}

const integrations: Integration[] = [
  { id: 'slack', name: 'Slack', description: 'Send notifications, create tasks from messages, and sync channels with collaboration spaces.', category: 'Communication', icon: '💬', connected: false, popular: true },
  { id: 'teams', name: 'Microsoft Teams', description: 'Bi-directional sync for chats, meetings, and task updates across Teams and wrkportal.', category: 'Communication', icon: '👥', connected: false, popular: true },
  { id: 'google', name: 'Google Workspace', description: 'Sync with Google Calendar, Drive, and Gmail. Auto-create tasks from emails.', category: 'Productivity', icon: '📧', connected: false, popular: true },
  { id: 'microsoft365', name: 'Microsoft 365', description: 'Connect Outlook, OneDrive, and SharePoint for seamless document management.', category: 'Productivity', icon: '📎', connected: false },
  { id: 'github', name: 'GitHub', description: 'Link PRs and commits to tasks. Auto-update task status from branch activity.', category: 'Development', icon: '🐙', connected: false, popular: true },
  { id: 'gitlab', name: 'GitLab', description: 'Full DevOps integration — issues, MRs, pipelines, and deployments synced in real-time.', category: 'Development', icon: '🦊', connected: false },
  { id: 'jira', name: 'Jira', description: 'Import issues, sync statuses, and maintain bi-directional links with Jira projects.', category: 'Development', icon: '🔷', connected: false },
  { id: 'zapier', name: 'Zapier', description: 'Connect wrkportal to 5,000+ apps with no-code automation workflows.', category: 'Automation', icon: '⚡', connected: false, popular: true },
  { id: 'quickbooks', name: 'QuickBooks', description: 'Sync invoices, expenses, and financial data for accurate budget tracking.', category: 'Finance', icon: '💰', connected: false },
  { id: 'stripe', name: 'Stripe', description: 'Track subscription revenue, payment status, and customer billing data.', category: 'Finance', icon: '💳', connected: false },
  { id: 'salesforce', name: 'Salesforce', description: 'Bi-directional CRM sync for leads, opportunities, and account data.', category: 'Sales', icon: '☁️', connected: false },
  { id: 'hubspot', name: 'HubSpot', description: 'Sync contacts, deals, and marketing data with the sales dashboard.', category: 'Sales', icon: '🧡', connected: false },
  { id: 'figma', name: 'Figma', description: 'Embed design files in tasks and auto-notify when designs are updated.', category: 'Design', icon: '🎨', connected: false },
  { id: 'docusign', name: 'DocuSign', description: 'Send and track contracts within the sales pipeline. Auto-update deal status on signature.', category: 'Sales', icon: '✍️', connected: false },
]

const categories = ['All', 'Communication', 'Productivity', 'Development', 'Automation', 'Finance', 'Sales', 'Design']

export default function IntegrationMarketplace() {
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('All')

  const filtered = integrations.filter((i) => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = category === 'All' || i.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect your favorite tools to wrkportal</p>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategory(cat)}
              className="shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Integration grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((integration) => (
          <Card key={integration.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      {integration.name}
                      {integration.popular && (
                        <Badge variant="secondary" className="text-[10px]">Popular</Badge>
                      )}
                    </h3>
                    <Badge variant="outline" className="text-[10px] mt-0.5">{integration.category}</Badge>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{integration.description}</p>
              <Button
                size="sm"
                variant={integration.connected ? 'outline' : 'default'}
                className="w-full"
              >
                {integration.connected ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Connect
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p>No integrations found matching your search.</p>
        </div>
      )}
    </div>
  )
}

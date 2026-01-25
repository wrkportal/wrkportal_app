'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Plug,
    Plus,
    Settings,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Loader2,
    ExternalLink,
    Trash2,
    Store,
    Star,
    Download,
    Search,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { formatDate } from '@/lib/utils'
import { IntegrationType, IntegrationStatus } from '@prisma/client'

const INTEGRATION_INFO: Record<IntegrationType, { name: string; description: string; color: string }> = {
    SALESFORCE: {
        name: 'Salesforce',
        description: 'Sync contacts, accounts, opportunities, and deals',
        color: 'bg-blue-500',
    },
    HUBSPOT: {
        name: 'HubSpot',
        description: 'Sync contacts, companies, deals, and marketing data',
        color: 'bg-orange-500',
    },
    QUICKBOOKS: {
        name: 'QuickBooks',
        description: 'Sync invoices, customers, and financial data',
        color: 'bg-green-500',
    },
    STRIPE: {
        name: 'Stripe',
        description: 'Sync payments, customers, and subscription data',
        color: 'bg-purple-500',
    },
    GOOGLE_ANALYTICS: {
        name: 'Google Analytics',
        description: 'Import analytics and traffic data',
        color: 'bg-yellow-500',
    },
    ZENDESK: {
        name: 'Zendesk',
        description: 'Sync tickets, users, and support metrics',
        color: 'bg-indigo-500',
    },
    JIRA: {
        name: 'Jira',
        description: 'Sync issues, projects, and work items',
        color: 'bg-blue-600',
    },
    MAILCHIMP: {
        name: 'Mailchimp',
        description: 'Sync email campaigns and subscriber data',
        color: 'bg-yellow-600',
    },
    SLACK: {
        name: 'Slack',
        description: 'Sync messages and team collaboration data',
        color: 'bg-pink-500',
    },
    MICROSOFT_TEAMS: {
        name: 'Microsoft Teams',
        description: 'Sync Teams data and collaboration metrics',
        color: 'bg-blue-700',
    },
    SHOPIFY: {
        name: 'Shopify',
        description: 'Sync orders, products, and e-commerce data',
        color: 'bg-green-600',
    },
    CUSTOM: {
        name: 'Custom Integration',
        description: 'Custom integration via API',
        color: 'bg-gray-500',
    },
}

export default function IntegrationsPage() {
    const currentUser = useAuthStore((state) => state.user)
    const [integrations, setIntegrations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedIntegration, setSelectedIntegration] = useState<any>(null)
    const [syncHistory, setSyncHistory] = useState<any[]>([])
    const [activeView, setActiveView] = useState<'integrations' | 'marketplace'>('integrations')

    // Marketplace
    const [templates, setTemplates] = useState<any[]>([])
    const [marketplaceLoading, setMarketplaceLoading] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
    const [templateDetails, setTemplateDetails] = useState<any>(null)
    const [loadingTemplateDetails, setLoadingTemplateDetails] = useState(false)
    const [installingTemplateId, setInstallingTemplateId] = useState<string | null>(null)
    const [marketplaceSearch, setMarketplaceSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('ALL')

    // New integration form
    const [newIntegrationType, setNewIntegrationType] = useState<IntegrationType | ''>('')
    const [newIntegrationName, setNewIntegrationName] = useState('')
    const [configClientId, setConfigClientId] = useState('')
    const [configClientSecret, setConfigClientSecret] = useState('')
    const [configRedirectUri, setConfigRedirectUri] = useState('')

    const isAdmin = currentUser?.role === 'ORG_ADMIN' ||
        currentUser?.role === 'TENANT_SUPER_ADMIN' ||
        currentUser?.role === 'PLATFORM_OWNER'

    useEffect(() => {
        if (isAdmin) {
            if (activeView === 'integrations') {
                fetchIntegrations()
            } else {
                fetchMarketplace()
            }
        }
    }, [isAdmin, activeView])

    const fetchIntegrations = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/integrations')
            const data = await res.json()
            console.log('Fetched integrations:', data)

            if (res.ok) {
                setIntegrations(data.integrations || [])

                // Log if empty to help debug
                if (!data.integrations || data.integrations.length === 0) {
                    console.log('No integrations found in response')
                } else {
                    console.log(`Found ${data.integrations.length} integration(s)`)
                }
            } else {
                console.error('Error response from API:', data)
                alert(data.error || 'Failed to fetch integrations')
            }
        } catch (error) {
            console.error('Error fetching integrations:', error)
            alert('Failed to fetch integrations. Please check the console for details.')
        } finally {
            setIsLoading(false)
        }
    }

    const createIntegration = async () => {
        if (!newIntegrationType || !newIntegrationName) {
            alert('Please fill in all required fields')
            return
        }

        try {
            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: newIntegrationType,
                    name: newIntegrationName,
                    configuration: {
                        clientId: configClientId,
                        clientSecret: configClientSecret,
                        redirectUri: configRedirectUri || `${window.location.origin}/api/integrations/callback`,
                    },
                    isActive: false,
                }),
            })

            if (res.ok) {
                await fetchIntegrations()
                setIsDialogOpen(false)
                resetForm()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to create integration')
            }
        } catch (error) {
            console.error('Error creating integration:', error)
            alert('Failed to create integration')
        }
    }

    const connectIntegration = async (integrationId: string) => {
        try {
            const res = await fetch(`/api/integrations/${integrationId}/oauth?action=auth-url`)
            if (res.ok) {
                const data = await res.json()
                // Redirect to OAuth URL
                window.location.href = data.authUrl
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to generate OAuth URL')
            }
        } catch (error) {
            console.error('Error connecting integration:', error)
            alert('Failed to connect integration')
        }
    }

    const triggerSync = async (integrationId: string) => {
        try {
            const res = await fetch(`/api/integrations/${integrationId}/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    syncType: 'MANUAL',
                    configuration: {
                        resourceType: 'contacts',
                        direction: 'pull',
                    },
                }),
            })

            if (res.ok) {
                alert('Sync triggered successfully')
                fetchSyncHistory(integrationId)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to trigger sync')
            }
        } catch (error) {
            console.error('Error triggering sync:', error)
            alert('Failed to trigger sync')
        }
    }

    const fetchSyncHistory = async (integrationId: string) => {
        try {
            const res = await fetch(`/api/integrations/${integrationId}/sync?logs=true`)
            if (res.ok) {
                const data = await res.json()
                setSyncHistory(data.jobs || [])
            }
        } catch (error) {
            console.error('Error fetching sync history:', error)
        }
    }

    const deleteIntegration = async (integrationId: string) => {
        if (!confirm('Are you sure you want to delete this integration?')) {
            return
        }

        try {
            const res = await fetch(`/api/integrations/${integrationId}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                await fetchIntegrations()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to delete integration')
            }
        } catch (error) {
            console.error('Error deleting integration:', error)
            alert('Failed to delete integration')
        }
    }

    const resetForm = () => {
        setNewIntegrationType('')
        setNewIntegrationName('')
        setConfigClientId('')
        setConfigClientSecret('')
        setConfigRedirectUri('')
    }

    const fetchMarketplace = async () => {
        setMarketplaceLoading(true)
        try {
            const params = new URLSearchParams()
            if (marketplaceSearch) params.append('search', marketplaceSearch)
            if (selectedCategory !== 'ALL') params.append('category', selectedCategory)
            if (!marketplaceSearch && selectedCategory === 'ALL') params.append('featured', 'true')

            const res = await fetch(`/api/integrations/marketplace?${params}`)
            if (res.ok) {
                const data = await res.json()
                setTemplates(data.templates || [])
            }
        } catch (error) {
            console.error('Error fetching marketplace:', error)
        } finally {
            setMarketplaceLoading(false)
        }
    }

    const initializeTemplates = async () => {
        if (!confirm('Initialize default integration templates? This will add 8 pre-configured templates to the marketplace.')) {
            return
        }

        setMarketplaceLoading(true)
        try {
            const res = await fetch('/api/integrations/marketplace?init=true')
            if (res.ok) {
                alert('Templates initialized successfully!')
                await fetchMarketplace()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to initialize templates')
            }
        } catch (error) {
            console.error('Error initializing templates:', error)
            alert('Failed to initialize templates')
        } finally {
            setMarketplaceLoading(false)
        }
    }

    const fetchTemplateDetails = async (templateId: string) => {
        setLoadingTemplateDetails(true)
        try {
            const res = await fetch(`/api/integrations/marketplace/${templateId}`)
            if (res.ok) {
                const data = await res.json()
                setTemplateDetails(data.template)
                setSelectedTemplate(data.template)
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to fetch template details')
            }
        } catch (error) {
            console.error('Error fetching template details:', error)
            alert('Failed to fetch template details')
        } finally {
            setLoadingTemplateDetails(false)
        }
    }

    const installTemplate = async (templateId: string) => {
        if (!confirm('Install this template? It will create a new integration that you can configure with OAuth credentials.')) {
            return
        }

        setInstallingTemplateId(templateId)
        try {
            const res = await fetch('/api/integrations/marketplace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId }),
            })

            const responseData = await res.json()

            if (res.ok) {
                console.log('Install successful, response:', responseData)
                const integrationName = responseData.integration?.name || 'New Integration'
                const integrationId = responseData.integration?.id

                // Close dialogs first
                setSelectedTemplate(null)
                setTemplateDetails(null)

                // Refresh marketplace first (fast operation)
                await fetchMarketplace()

                // Switch to integrations tab
                setActiveView('integrations')

                // Small delay to ensure database write is committed, then fetch
                await new Promise(resolve => setTimeout(resolve, 300))

                // Fetch integrations - this should now include the newly created one
                await fetchIntegrations()

                // Verify the integration is in the list
                setTimeout(() => {
                    // Double-check by fetching again if needed
                    fetchIntegrations()

                    alert(`Template installed successfully!\n\nIntegration "${integrationName}" has been created.\n\nYou should now see it in the "My Integrations" tab. If you don't see it, please refresh the page.`)
                }, 500)
            } else {
                console.error('Install failed:', responseData)
                alert(responseData.error || responseData.details || 'Failed to install template')
            }
        } catch (error: any) {
            console.error('Error installing template:', error)
            alert(`Failed to install template: ${error.message || 'Unknown error'}`)
        } finally {
            setInstallingTemplateId(null)
        }
    }

    const getStatusBadge = (status: IntegrationStatus) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>
            case 'INACTIVE':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>
            case 'ERROR':
                return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>
            case 'SYNCING':
                return <Badge className="bg-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Syncing</Badge>
            case 'PAUSED':
                return <Badge variant="outline">Paused</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center text-muted-foreground">
                            You don't have permission to access this page.
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Plug className="h-8 w-8" />
                        SaaS Integrations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Connect and sync data from external services
                    </p>
                </div>
                {activeView === 'integrations' && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Integration
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Add New Integration</DialogTitle>
                                <DialogDescription>
                                    Configure a new SaaS integration
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Integration Type</label>
                                    <Select value={newIntegrationType} onValueChange={(v) => setNewIntegrationType(v as IntegrationType)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select integration type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(INTEGRATION_INFO).map(([type, info]) => (
                                                <SelectItem key={type} value={type}>
                                                    {info.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {newIntegrationType && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {INTEGRATION_INFO[newIntegrationType as IntegrationType]?.description}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Integration Name</label>
                                    <Input
                                        placeholder="e.g., Production Salesforce"
                                        value={newIntegrationName}
                                        onChange={(e) => setNewIntegrationName(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">Client ID</label>
                                        <Input
                                            placeholder="OAuth Client ID"
                                            value={configClientId}
                                            onChange={(e) => setConfigClientId(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium">Client Secret</label>
                                        <Input
                                            type="password"
                                            placeholder="OAuth Client Secret"
                                            value={configClientSecret}
                                            onChange={(e) => setConfigClientSecret(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Redirect URI</label>
                                    <Input
                                        placeholder="OAuth Redirect URI"
                                        value={configRedirectUri}
                                        onChange={(e) => setConfigRedirectUri(e.target.value)}
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Default: {window.location.origin}/api/integrations/callback
                                    </p>
                                </div>

                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={createIntegration}>
                                        Create Integration
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'integrations' | 'marketplace')} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="integrations">My Integrations</TabsTrigger>
                    <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                </TabsList>

                <TabsContent value="integrations">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Connected Integrations</CardTitle>
                                <CardDescription>
                                    Manage your SaaS integrations and sync settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Integration</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Last Sync</TableHead>
                                            <TableHead>Sync Jobs</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {integrations.map((integration) => {
                                            const info = INTEGRATION_INFO[integration.type as IntegrationType] || {
                                                name: integration.type || 'Unknown',
                                                description: 'Integration',
                                                color: 'bg-gray-500',
                                            }
                                            return (
                                                <TableRow key={integration.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded ${info.color} flex items-center justify-center text-white text-xs font-bold`}>
                                                                {info.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="font-medium">{info.name}</div>
                                                                <div className="text-xs text-muted-foreground">{info.description}</div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{integration.name}</TableCell>
                                                    <TableCell>{getStatusBadge(integration.status)}</TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {integration.lastSyncAt ? formatDate(integration.lastSyncAt) : 'Never'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{integration._count?.syncJobs || 0}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {integration.status !== 'ACTIVE' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => connectIntegration(integration.id)}
                                                                >
                                                                    <ExternalLink className="h-3 w-3 mr-1" />
                                                                    Connect
                                                                </Button>
                                                            )}
                                                            {integration.isActive && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => triggerSync(integration.id)}
                                                                >
                                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                                    Sync
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedIntegration(integration)
                                                                    fetchSyncHistory(integration.id)
                                                                }}
                                                            >
                                                                <Settings className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => deleteIntegration(integration.id)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                        {integrations.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    No integrations configured. Click "Add Integration" to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="marketplace">
                    <Card>
                        <CardHeader>
                            <CardTitle>Integration Marketplace</CardTitle>
                            <CardDescription>
                                Browse pre-configured integration templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search templates..."
                                            value={marketplaceSearch}
                                            onChange={(e) => {
                                                setMarketplaceSearch(e.target.value)
                                                fetchMarketplace()
                                            }}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Select value={selectedCategory} onValueChange={(v) => {
                                    setSelectedCategory(v)
                                    fetchMarketplace()
                                }}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Categories</SelectItem>
                                        <SelectItem value="CRM">CRM</SelectItem>
                                        <SelectItem value="Marketing">Marketing</SelectItem>
                                        <SelectItem value="Finance">Finance</SelectItem>
                                        <SelectItem value="Analytics">Analytics</SelectItem>
                                        <SelectItem value="Support">Support</SelectItem>
                                        <SelectItem value="Project Management">Project Management</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" onClick={fetchMarketplace}>
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>

                            {marketplaceLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : templates.length === 0 ? (
                                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <Store className="h-12 w-12 text-muted-foreground" />
                                        <div>
                                            <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
                                            <p className="text-muted-foreground mb-4">
                                                Initialize the default integration templates to get started with pre-configured integrations.
                                            </p>
                                            <Button onClick={initializeTemplates} disabled={marketplaceLoading}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Initialize Default Templates
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template) => {
                                        const info = INTEGRATION_INFO[template.integrationType as IntegrationType] || {
                                            name: template.integrationType || 'Unknown',
                                            description: 'Integration',
                                            color: 'bg-gray-500',
                                        }
                                        return (
                                            <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                                <CardHeader>
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-12 h-12 rounded-lg ${info.color} flex items-center justify-center text-white font-bold`}>
                                                                {info.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                                <CardDescription className="text-xs">{info.name}</CardDescription>
                                                            </div>
                                                        </div>
                                                        {template.isFeatured && (
                                                            <Badge className="bg-yellow-500">
                                                                <Star className="h-3 w-3 mr-1" />
                                                                Featured
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                                                    <div className="flex items-center gap-4 mb-4">
                                                        <div className="flex items-center gap-1">
                                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                            <span className="text-sm font-medium">
                                                                {template.rating ? template.rating.toFixed(1) : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {template._count?.installations || 0} installs
                                                        </div>
                                                        <Badge variant="outline">{template.category}</Badge>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            className="flex-1"
                                                            onClick={() => installTemplate(template.id)}
                                                            disabled={installingTemplateId === template.id}
                                                        >
                                                            {installingTemplateId === template.id ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Installing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Install
                                                                </>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => fetchTemplateDetails(template.id)}
                                                            disabled={loadingTemplateDetails}
                                                        >
                                                            {loadingTemplateDetails && selectedTemplate?.id === template.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                'Details'
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {selectedIntegration && (
                <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{selectedIntegration.name} - Details</DialogTitle>
                            <DialogDescription>
                                View sync history and configuration
                            </DialogDescription>
                        </DialogHeader>
                        <Tabs defaultValue="history">
                            <TabsList>
                                <TabsTrigger value="history">Sync History</TabsTrigger>
                                <TabsTrigger value="config">Configuration</TabsTrigger>
                            </TabsList>
                            <TabsContent value="history">
                                <div className="space-y-2">
                                    {syncHistory.length > 0 ? (
                                        syncHistory.map((job) => (
                                            <Card key={job.id}>
                                                <CardContent className="pt-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <div className="font-medium">{job.syncType}</div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {job.recordsProcessed} processed, {job.recordsCreated} created, {job.recordsUpdated} updated
                                                            </div>
                                                        </div>
                                                        <Badge>{job.status}</Badge>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-4">No sync history</p>
                                    )}
                                </div>
                            </TabsContent>
                            <TabsContent value="config">
                                <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                    {JSON.stringify(selectedIntegration.configuration, null, 2)}
                                </pre>
                            </TabsContent>
                        </Tabs>
                    </DialogContent>
                </Dialog>
            )}

            {/* Template Details Dialog */}
            {selectedTemplate && (
                <Dialog open={!!selectedTemplate} onOpenChange={() => {
                    setSelectedTemplate(null)
                    setTemplateDetails(null)
                }}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3">
                                {templateDetails && (() => {
                                    const info = INTEGRATION_INFO[templateDetails.integrationType as IntegrationType] || {
                                        name: templateDetails.integrationType || 'Unknown',
                                        description: 'Integration',
                                        color: 'bg-gray-500',
                                    }
                                    return (
                                        <>
                                            <div className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-white font-bold`}>
                                                {info.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div>{templateDetails.name}</div>
                                                <DialogDescription className="mt-1">
                                                    {info.name} • {templateDetails.category}
                                                </DialogDescription>
                                            </div>
                                        </>
                                    )
                                })()}
                                {!templateDetails && selectedTemplate.name}
                            </DialogTitle>
                        </DialogHeader>

                        {loadingTemplateDetails ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : templateDetails ? (
                            <Tabs defaultValue="overview" className="mt-4">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="overview">Overview</TabsTrigger>
                                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                    <TabsTrigger value="fieldMappings">Field Mappings</TabsTrigger>
                                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                                </TabsList>

                                <TabsContent value="overview" className="space-y-4 mt-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Description</h4>
                                        <p className="text-sm text-muted-foreground">{templateDetails.description}</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Category</h4>
                                            <Badge>{templateDetails.category}</Badge>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Rating</h4>
                                            <div className="flex items-center gap-2">
                                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">
                                                    {templateDetails.rating ? templateDetails.rating.toFixed(1) : 'N/A'}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    ({templateDetails._count?.reviews || 0} reviews)
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Installations</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {templateDetails._count?.installations || 0} installs
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Usage Count</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {templateDetails.usageCount || 0} times used
                                            </p>
                                        </div>
                                    </div>

                                    {templateDetails.isFeatured && (
                                        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-sm font-medium">Featured Template</span>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="configuration" className="mt-4">
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-semibold mb-2">Sync Configuration</h4>
                                            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                                {JSON.stringify(templateDetails.syncConfig || {}, null, 2)}
                                            </pre>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold mb-2">Template Configuration</h4>
                                            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                                {JSON.stringify(templateDetails.configuration || {}, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="fieldMappings" className="mt-4">
                                    <div>
                                        <h4 className="font-semibold mb-2">Field Mappings</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            These field mappings will be applied when you install this template.
                                        </p>
                                        <pre className="bg-muted p-4 rounded text-xs overflow-auto">
                                            {JSON.stringify(templateDetails.fieldMappings || {}, null, 2)}
                                        </pre>
                                    </div>
                                </TabsContent>

                                <TabsContent value="reviews" className="mt-4">
                                    <div className="space-y-4">
                                        {templateDetails.reviews && templateDetails.reviews.length > 0 ? (
                                            templateDetails.reviews.map((review: any) => (
                                                <Card key={review.id}>
                                                    <CardContent className="pt-4">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div>
                                                                <div className="font-medium">
                                                                    {review.user?.firstName} {review.user?.lastName}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <Star
                                                                        key={i}
                                                                        className={`h-4 w-4 ${i < review.rating
                                                                            ? 'fill-yellow-400 text-yellow-400'
                                                                            : 'text-gray-300'
                                                                            }`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {review.comment && (
                                                            <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))
                                        ) : (
                                            <p className="text-muted-foreground text-center py-4">No reviews yet</p>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : null}

                        <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedTemplate(null)
                                    setTemplateDetails(null)
                                }}
                            >
                                Close
                            </Button>
                            {templateDetails && (
                                <Button
                                    onClick={() => {
                                        installTemplate(templateDetails.id)
                                        setSelectedTemplate(null)
                                        setTemplateDetails(null)
                                    }}
                                    disabled={installingTemplateId === templateDetails.id}
                                >
                                    {installingTemplateId === templateDetails.id ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Installing...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-2" />
                                            Install Template
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}


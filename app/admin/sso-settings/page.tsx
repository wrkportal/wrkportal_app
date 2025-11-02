'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, Shield, Building2, Key, FileText, AlertCircle, Copy, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SSOConfig {
    tenantId: string
    tenantName: string
    domain: string
    ssoEnabled: boolean
    ssoProvider: string | null
    ssoConfig: any
}

export default function SSOSettingsPage() {
    const { user } = useAuthStore()
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [config, setConfig] = useState<SSOConfig | null>(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    // Form state
    const [ssoEnabled, setSsoEnabled] = useState(false)
    const [ssoProvider, setSsoProvider] = useState<string>('')
    const [domain, setDomain] = useState('')

    // SAML specific
    const [samlEntryPoint, setSamlEntryPoint] = useState('')
    const [samlIssuer, setSamlIssuer] = useState('')
    const [samlCert, setSamlCert] = useState('')

    // OIDC specific
    const [oidcIssuer, setOidcIssuer] = useState('')
    const [oidcAuthUrl, setOidcAuthUrl] = useState('')
    const [oidcTokenUrl, setOidcTokenUrl] = useState('')
    const [oidcClientId, setOidcClientId] = useState('')
    const [oidcClientSecret, setOidcClientSecret] = useState('')

    // Azure AD specific
    const [azureTenantId, setAzureTenantId] = useState('')
    const [azureClientId, setAzureClientId] = useState('')
    const [azureClientSecret, setAzureClientSecret] = useState('')

    useEffect(() => {
        // Wait for user to be loaded
        if (!user) return
        
        // Check permissions (will be handled in render, but double-check here)
        if (user.role !== 'TENANT_SUPER_ADMIN' && user.role !== 'ORG_ADMIN') {
            return
        }
        
        loadSSOConfig()
    }, [user])

    const loadSSOConfig = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/admin/sso-settings')
            const data = await response.json()

            if (response.ok) {
                setConfig(data)
                setSsoEnabled(data.ssoEnabled || false)
                setSsoProvider(data.ssoProvider || '')
                setDomain(data.domain || '')

                // Load existing config
                if (data.ssoConfig) {
                    const conf = data.ssoConfig
                    if (data.ssoProvider === 'SAML') {
                        setSamlEntryPoint(conf.entryPoint || '')
                        setSamlIssuer(conf.issuer || '')
                        setSamlCert(conf.cert || '')
                    } else if (data.ssoProvider === 'OIDC') {
                        setOidcIssuer(conf.issuer || '')
                        setOidcAuthUrl(conf.authorizationURL || '')
                        setOidcTokenUrl(conf.tokenURL || '')
                        setOidcClientId(conf.clientId || '')
                        setOidcClientSecret(conf.clientSecret || '')
                    } else if (data.ssoProvider === 'AZURE_AD') {
                        setAzureTenantId(conf.tenantId || '')
                        setAzureClientId(conf.clientId || '')
                        setAzureClientSecret(conf.clientSecret || '')
                    }
                }
            }
        } catch (err) {
            setError('Failed to load SSO configuration')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            setError('')
            setSuccess('')

            // Build config based on provider
            let ssoConfigData: any = null

            if (ssoProvider === 'SAML') {
                if (!samlEntryPoint || !samlIssuer || !samlCert) {
                    setError('Please fill in all SAML fields')
                    setSaving(false)
                    return
                }
                ssoConfigData = {
                    entryPoint: samlEntryPoint,
                    issuer: samlIssuer,
                    cert: samlCert,
                    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
                }
            } else if (ssoProvider === 'OIDC') {
                if (!oidcIssuer || !oidcAuthUrl || !oidcTokenUrl || !oidcClientId || !oidcClientSecret) {
                    setError('Please fill in all OIDC fields')
                    setSaving(false)
                    return
                }
                ssoConfigData = {
                    issuer: oidcIssuer,
                    authorizationURL: oidcAuthUrl,
                    tokenURL: oidcTokenUrl,
                    clientId: oidcClientId,
                    clientSecret: oidcClientSecret,
                }
            } else if (ssoProvider === 'AZURE_AD') {
                if (!azureTenantId || !azureClientId || !azureClientSecret) {
                    setError('Please fill in all Azure AD fields')
                    setSaving(false)
                    return
                }
                ssoConfigData = {
                    tenantId: azureTenantId,
                    clientId: azureClientId,
                    clientSecret: azureClientSecret,
                }
            }

            const response = await fetch('/api/admin/sso-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ssoEnabled,
                    ssoProvider: ssoProvider || null,
                    domain,
                    ssoConfig: ssoConfigData,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('SSO configuration saved successfully!')
                loadSSOConfig()
            } else {
                setError(data.error || 'Failed to save SSO configuration')
            }
        } catch (err) {
            setError('An error occurred while saving')
        } finally {
            setSaving(false)
        }
    }

    const handleTest = async () => {
        try {
            setTesting(true)
            setError('')
            setSuccess('')

            const response = await fetch('/api/admin/sso-settings/test', {
                method: 'POST',
            })

            const data = await response.json()

            if (response.ok) {
                setSuccess('SSO connection test successful! ✅')
            } else {
                setError(data.error || 'SSO connection test failed')
            }
        } catch (err) {
            setError('Failed to test SSO connection')
        } finally {
            setTesting(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setSuccess('Copied to clipboard!')
        setTimeout(() => setSuccess(''), 2000)
    }

    // Show loading while user data or SSO config is loading
    if (!user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }
    
    // Check permissions after user is loaded
    if (user.role !== 'TENANT_SUPER_ADMIN' && user.role !== 'ORG_ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access this page.</p>
                </div>
            </div>
        )
    }

    const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/callback/sso`
    const metadataUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/saml/metadata`

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Single Sign-On (SSO) Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Configure SSO to allow your users to log in with your organization&apos;s identity provider
                </p>
            </div>

            {/* Status Banner */}
            {config && (
                <Card className={ssoEnabled ? 'border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-950/30' : 'border-gray-300'}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className={`h-8 w-8 ${ssoEnabled ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        SSO Status: {ssoEnabled ? 'Enabled' : 'Disabled'}
                                    </h3>
                                    {ssoEnabled && ssoProvider && (
                                        <p className="text-sm text-muted-foreground">
                                            Provider: <Badge variant="secondary">{ssoProvider}</Badge>
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                {ssoEnabled ? (
                                    <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="h-12 w-12 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alerts */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {success && (
                <Alert className="border-green-500 dark:border-green-700 bg-green-50 dark:bg-green-950/30">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
                </Alert>
            )}

            {/* Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>SSO Configuration</CardTitle>
                    <CardDescription>
                        Configure your organization&apos;s Single Sign-On settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Enable SSO Toggle */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                        <div className="space-y-0.5 flex-1">
                            <Label className="text-base font-semibold">Enable SSO</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow users to log in with your organization&apos;s identity provider
                            </p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                            <span className={`text-sm font-medium ${ssoEnabled ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                {ssoEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <Switch
                                checked={ssoEnabled}
                                onCheckedChange={setSsoEnabled}
                                className="data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-white/20 dark:data-[state=unchecked]:bg-white/30"
                            />
                        </div>
                    </div>

                    {ssoEnabled && (
                        <>
                            <Separator />

                            {/* Organization Domain */}
                            <div className="space-y-2">
                                <Label htmlFor="domain">Organization Domain *</Label>
                                <Input
                                    id="domain"
                                    placeholder="company.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Users will enter this domain to identify your organization during SSO login
                                </p>
                            </div>

                            {/* SSO Provider Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="provider">SSO Provider *</Label>
                                <Select value={ssoProvider} onValueChange={setSsoProvider}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select SSO provider" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AZURE_AD">Microsoft Azure AD</SelectItem>
                                        <SelectItem value="SAML">SAML 2.0 (Generic)</SelectItem>
                                        <SelectItem value="OIDC">OpenID Connect (OIDC)</SelectItem>
                                        <SelectItem value="GOOGLE_WORKSPACE">Google Workspace</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Provider-specific Configuration */}
                            {ssoProvider && (
                                <Tabs defaultValue="config" className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="config">Configuration</TabsTrigger>
                                        <TabsTrigger value="integration">Integration Info</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="config" className="space-y-4 mt-4">
                                        {/* Azure AD Configuration */}
                                        {ssoProvider === 'AZURE_AD' && (
                                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    <h3 className="font-semibold">Microsoft Azure AD Configuration</h3>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="azureTenantId">Azure AD Tenant ID *</Label>
                                                    <Input
                                                        id="azureTenantId"
                                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                        value={azureTenantId}
                                                        onChange={(e) => setAzureTenantId(e.target.value)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Found in Azure Portal → Azure Active Directory → Overview
                                                    </p>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="azureClientId">Application (Client) ID *</Label>
                                                    <Input
                                                        id="azureClientId"
                                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                        value={azureClientId}
                                                        onChange={(e) => setAzureClientId(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="azureClientSecret">Client Secret *</Label>
                                                    <Input
                                                        id="azureClientSecret"
                                                        type="password"
                                                        placeholder="Enter client secret"
                                                        value={azureClientSecret}
                                                        onChange={(e) => setAzureClientSecret(e.target.value)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Create in Azure Portal → App registrations → Certificates & secrets
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* SAML Configuration */}
                                        {ssoProvider === 'SAML' && (
                                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Key className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                    <h3 className="font-semibold">SAML 2.0 Configuration</h3>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="samlEntryPoint">IdP SSO URL (Entry Point) *</Label>
                                                    <Input
                                                        id="samlEntryPoint"
                                                        placeholder="https://idp.company.com/saml/sso"
                                                        value={samlEntryPoint}
                                                        onChange={(e) => setSamlEntryPoint(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="samlIssuer">Issuer (Entity ID) *</Label>
                                                    <Input
                                                        id="samlIssuer"
                                                        placeholder="https://yourapp.com/saml/metadata"
                                                        value={samlIssuer}
                                                        onChange={(e) => setSamlIssuer(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="samlCert">X.509 Certificate *</Label>
                                                    <textarea
                                                        id="samlCert"
                                                        className="w-full min-h-[120px] p-2 border rounded-md font-mono text-xs"
                                                        placeholder="-----BEGIN CERTIFICATE-----&#10;MIIDXTCCAkWgAwIBAgIJ...&#10;-----END CERTIFICATE-----"
                                                        value={samlCert}
                                                        onChange={(e) => setSamlCert(e.target.value)}
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Paste the full certificate including BEGIN and END lines
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* OIDC Configuration */}
                                        {ssoProvider === 'OIDC' && (
                                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Key className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    <h3 className="font-semibold">OpenID Connect (OIDC) Configuration</h3>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="oidcIssuer">Issuer URL *</Label>
                                                    <Input
                                                        id="oidcIssuer"
                                                        placeholder="https://accounts.google.com"
                                                        value={oidcIssuer}
                                                        onChange={(e) => setOidcIssuer(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="oidcAuthUrl">Authorization URL *</Label>
                                                    <Input
                                                        id="oidcAuthUrl"
                                                        placeholder="https://accounts.google.com/o/oauth2/v2/auth"
                                                        value={oidcAuthUrl}
                                                        onChange={(e) => setOidcAuthUrl(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="oidcTokenUrl">Token URL *</Label>
                                                    <Input
                                                        id="oidcTokenUrl"
                                                        placeholder="https://oauth2.googleapis.com/token"
                                                        value={oidcTokenUrl}
                                                        onChange={(e) => setOidcTokenUrl(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="oidcClientId">Client ID *</Label>
                                                    <Input
                                                        id="oidcClientId"
                                                        placeholder="your-client-id"
                                                        value={oidcClientId}
                                                        onChange={(e) => setOidcClientId(e.target.value)}
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="oidcClientSecret">Client Secret *</Label>
                                                    <Input
                                                        id="oidcClientSecret"
                                                        type="password"
                                                        placeholder="your-client-secret"
                                                        value={oidcClientSecret}
                                                        onChange={(e) => setOidcClientSecret(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Google Workspace */}
                                        {ssoProvider === 'GOOGLE_WORKSPACE' && (
                                            <div className="p-4 border rounded-lg bg-muted/50">
                                                <p className="text-sm">
                                                    Google Workspace SSO will be configured automatically using Google OAuth.
                                                    Please contact support for setup assistance.
                                                </p>
                                            </div>
                                        )}
                                    </TabsContent>

                                    <TabsContent value="integration" className="space-y-4 mt-4">
                                        <Alert>
                                            <FileText className="h-4 w-4" />
                                            <AlertDescription>
                                                Provide these URLs to your Identity Provider administrator
                                            </AlertDescription>
                                        </Alert>

                                        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                            <div>
                                                <Label className="text-sm font-semibold">Callback URL (Redirect URI)</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Input value={callbackUrl} readOnly className="font-mono text-xs" />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(callbackUrl)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {ssoProvider === 'SAML' && (
                                                <div>
                                                    <Label className="text-sm font-semibold">SAML Metadata URL</Label>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Input value={metadataUrl} readOnly className="font-mono text-xs" />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(metadataUrl)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => window.open(metadataUrl, '_blank')}
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <Label className="text-sm font-semibold">Login URL for Users</Label>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Input
                                                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/login`}
                                                        readOnly
                                                        className="font-mono text-xs"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/login`)}
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Users will enter your domain ({domain || 'company.com'}) to authenticate via SSO
                                                </p>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            )}
                        </>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button onClick={handleSave} disabled={saving || !ssoEnabled || !ssoProvider}>
                            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Configuration
                        </Button>

                        {ssoEnabled && ssoProvider && (
                            <Button variant="outline" onClick={handleTest} disabled={testing}>
                                {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Test Connection
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Help Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        SSO setup requires coordination with your IT or security team. Here are some helpful resources:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                        <li>
                            <a href="#" className="text-purple-600 hover:underline">
                                Azure AD Setup Guide
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-purple-600 hover:underline">
                                SAML Configuration Guide
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-purple-600 hover:underline">
                                OIDC Setup Guide
                            </a>
                        </li>
                        <li>
                            <a href="#" className="text-purple-600 hover:underline">
                                Contact Support
                            </a>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}


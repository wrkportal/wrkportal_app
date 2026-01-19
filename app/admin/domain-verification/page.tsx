'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  Shield,
  Info,
  Loader2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

interface VerificationData {
  domain: string
  verificationCode: string
  txtRecord: string
  expiresAt: string
  instructions: {
    type: string
    host: string
    value: string
    ttl: string
  }
}

export default function DomainVerificationPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [updatingAutoJoin, setUpdatingAutoJoin] = useState(false)

  useEffect(() => {
    fetchTenantInfo()
  }, [])

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch('/api/tenant')
      if (response.ok) {
        const data = await response.json()
        setTenantInfo(data.tenant)
        
        // If already verified, show success
        if (data.tenant.domainVerified) {
          setVerificationResult({
            success: true,
            message: 'Domain is already verified',
            alreadyVerified: true,
          })
        }
      }
    } catch (err) {
      console.error('Error fetching tenant info:', err)
    } finally {
      setLoading(false)
    }
  }

  const initiateVerification = async () => {
    setLoading(true)
    setError(null)
    setVerificationResult(null)
    
    try {
      const response = await fetch('/api/tenant/verify/initiate', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationData(data)
      } else {
        setError(data.error || 'Failed to initiate verification')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkVerification = async () => {
    setVerifying(true)
    setError(null)
    setVerificationResult(null)

    try {
      const response = await fetch('/api/tenant/verify/check', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        setVerificationResult(data)
        // Refresh page after 2 seconds to update session
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || 'Verification failed')
        setVerificationResult(data)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleAutoJoinToggle = async (enabled: boolean) => {
    setUpdatingAutoJoin(true)
    setError(null)

    try {
      const response = await fetch('/api/tenant', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoJoinEnabled: enabled }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setTenantInfo((prev: any) => ({
          ...prev,
          autoJoinEnabled: enabled,
        }))
      } else {
        setError(data.error || 'Failed to update auto-join setting')
      }
    } catch (err) {
      setError('An error occurred while updating auto-join setting')
      console.error('Error updating auto-join:', err)
    } finally {
      setUpdatingAutoJoin(false)
    }
  }

  // Check if user can manage auto-join settings
  const canManageAutoJoin = user?.role === 'TENANT_SUPER_ADMIN' || user?.role === 'PLATFORM_OWNER'

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!tenantInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Unable to load tenant information</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if using public domain (no domain set)
  const isPublicDomain = !tenantInfo.domain

  if (isPublicDomain) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Organization Setup
          </h1>
          <p className="text-muted-foreground">
            Manage your organization settings
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Info className="h-8 w-8 text-blue-500" />
              <div>
                <CardTitle>Public Email Domain</CardTitle>
                <CardDescription>
                  You're using a public email provider (Gmail, Yahoo, etc.)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                <strong>Invite-Only Access:</strong> Since you're using a public email domain, 
                you'll need to invite team members manually. Domain verification and auto-join 
                are only available for organizations with custom email domains.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">How to Add Team Members:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Go to <strong>Admin → Organization → Users</strong></li>
                <li>Click <strong>"Invite User"</strong> button</li>
                <li>Enter their email address (Gmail, Yahoo, etc.)</li>
                <li>Select their role and send invitation</li>
                <li>They'll receive an email to join your organization</li>
              </ol>
            </div>

            <Button
              onClick={() => router.push('/admin/organization')}
              className="w-full"
            >
              Go to Organization Settings & Invite Members
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (tenantInfo.domainVerified) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Domain Verification
          </h1>
          <p className="text-muted-foreground">
            Manage your organization's domain verification
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Domain Verified</CardTitle>
                <CardDescription>
                  Your domain <Badge variant="outline">{tenantInfo.domain}</Badge> has been successfully verified
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Verified At</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(tenantInfo.verifiedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Verification Method</p>
                <p className="text-sm text-muted-foreground">
                  {tenantInfo.verificationMethod || 'DNS'}
                </p>
              </div>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Enabled Features:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {tenantInfo.autoJoinEnabled ? (
                    <li>Auto-join for users with @{tenantInfo.domain} email addresses</li>
                  ) : (
                    <li>Invite-only access (auto-join disabled)</li>
                  )}
                  <li>SSO configuration</li>
                  <li>Advanced security settings</li>
                  <li>Team management capabilities</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Auto-Join Toggle - Only for Admins */}
            {canManageAutoJoin && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="text-base">Auto-Join Settings</CardTitle>
                  <CardDescription>
                    Control whether users with @{tenantInfo.domain} email addresses can automatically join your organization
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-join-toggle" className="text-base">
                        Enable Auto-Join
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {tenantInfo.autoJoinEnabled
                          ? 'Anyone with your domain email can join automatically'
                          : 'Only invited users can join (Recommended for small teams)'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {updatingAutoJoin && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Switch
                        id="auto-join-toggle"
                        checked={tenantInfo.autoJoinEnabled || false}
                        onCheckedChange={handleAutoJoinToggle}
                        disabled={updatingAutoJoin}
                      />
                    </div>
                  </div>
                  {!tenantInfo.autoJoinEnabled && (
                    <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-900 dark:text-blue-100">
                        <strong>Invite-Only Mode:</strong> Users must be invited by an admin to join your organization. 
                        This is recommended for better security and access control.
                      </AlertDescription>
                    </Alert>
                  )}
                  {tenantInfo.autoJoinEnabled && (
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-amber-900 dark:text-amber-100">
                        <strong>Auto-Join Enabled:</strong> Anyone with an @{tenantInfo.domain} email address can automatically 
                        join your organization. Consider disabling this for better security.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              onClick={() => router.push('/admin/organization')}
            >
              Go to Organization Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Verify Your Domain</h1>
        <p className="text-muted-foreground">
          Verify domain ownership to unlock advanced features
        </p>
      </div>

      {/* Why Verify Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Why Verify Your Domain?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span>Enable automatic team member joining for your domain</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span>Configure Single Sign-On (SSO)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span>Access advanced security and compliance features</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <span>Establish official organization ownership</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Domain:</span>
              <Badge variant="outline">{tenantInfo.domain || 'No domain set'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="secondary">Unverified</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Instructions */}
      {!verificationData && (
        <Card>
          <CardHeader>
            <CardTitle>Start Verification</CardTitle>
            <CardDescription>
              Click the button below to generate your unique verification code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={initiateVerification}
              disabled={loading || !tenantInfo.domain}
            >
              Generate Verification Code
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DNS Instructions */}
      {verificationData && (
        <Card>
          <CardHeader>
            <CardTitle>Add DNS Record</CardTitle>
            <CardDescription>
              Add the following TXT record to your domain's DNS settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Log in to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.) and add this TXT record.
                DNS propagation typically takes 5-15 minutes.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="grid grid-cols-[100px_1fr_auto] gap-4 items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Type:</span>
                <code className="text-sm">{verificationData.instructions.type}</code>
                <div />
              </div>

              <div className="grid grid-cols-[100px_1fr_auto] gap-4 items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Host:</span>
                <code className="text-sm">{verificationData.instructions.host}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verificationData.instructions.host)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-[100px_1fr_auto] gap-4 items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">Value:</span>
                <code className="text-sm break-all">{verificationData.txtRecord}</code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(verificationData.txtRecord)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-[100px_1fr_auto] gap-4 items-center p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">TTL:</span>
                <code className="text-sm">{verificationData.instructions.ttl}</code>
                <div />
              </div>
            </div>

            {copied && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>Copied to clipboard!</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={checkVerification}
                disabled={verifying}
              >
                {verifying && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Verify Now
              </Button>
              <Button
                variant="outline"
                onClick={initiateVerification}
                disabled={loading}
              >
                Regenerate Code
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Code expires at: {new Date(verificationData.expiresAt).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Verification Result */}
      {verificationResult && !verificationResult.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-2">Verification Failed</p>
            <p className="text-sm">{verificationResult.error}</p>
            {verificationResult.foundRecords && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer">Show DNS records found</summary>
                <pre className="mt-1 p-2 bg-background rounded">
                  {JSON.stringify(verificationResult.foundRecords, null, 2)}
                </pre>
              </details>
            )}
          </AlertDescription>
        </Alert>
      )}

      {verificationResult && verificationResult.success && (
        <Alert className="border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <p className="font-medium text-green-700">Domain Verified Successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Redirecting to organization settings...
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}


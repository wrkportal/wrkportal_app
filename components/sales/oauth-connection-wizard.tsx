'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, XCircle, Loader2, ExternalLink, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface OAuthConnectionWizardProps {
  provider: string
  integrationId?: string
  onComplete: (integrationId: string) => void
  onCancel: () => void
}

export function OAuthConnectionWizard({
  provider,
  integrationId,
  onComplete,
  onCancel,
}: OAuthConnectionWizardProps) {
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [oauthUrl, setOauthUrl] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Provider-specific OAuth configuration
  const oauthConfig: Record<string, any> = {
    salesforce: {
      name: 'Salesforce',
      authUrl: 'https://login.salesforce.com/services/oauth2/authorize',
      scopes: 'api refresh_token offline_access',
      description: 'Connect your Salesforce account to sync leads, opportunities, and contacts',
      steps: [
        'Click "Connect to Salesforce" to authorize access',
        'Log in to your Salesforce account',
        'Grant permissions to the application',
        'You will be redirected back to complete the connection',
      ],
    },
    hubspot: {
      name: 'HubSpot',
      authUrl: 'https://app.hubspot.com/oauth/authorize',
      scopes: 'contacts deals',
      description: 'Connect your HubSpot account to sync contacts and deals',
      steps: [
        'Click "Connect to HubSpot" to authorize access',
        'Log in to your HubSpot account',
        'Grant permissions to the application',
        'You will be redirected back to complete the connection',
      ],
    },
    dynamics: {
      name: 'Microsoft Dynamics 365',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      scopes: 'https://graph.microsoft.com/.default offline_access',
      description: 'Connect your Dynamics 365 account to sync CRM data',
      steps: [
        'Click "Connect to Dynamics 365" to authorize access',
        'Log in to your Microsoft account',
        'Grant permissions to the application',
        'You will be redirected back to complete the connection',
      ],
    },
    zoom: {
      name: 'Zoom',
      authUrl: 'https://zoom.us/oauth/authorize',
      scopes: 'meeting:write meeting:read',
      description: 'Connect your Zoom account to schedule and manage meetings',
      steps: [
        'Click "Connect to Zoom" to authorize access',
        'Log in to your Zoom account',
        'Grant permissions to the application',
        'You will be redirected back to complete the connection',
      ],
    },
    webex: {
      name: 'Webex',
      authUrl: 'https://webexapis.com/v1/authorize',
      scopes: 'spark:all',
      description: 'Connect your Webex account to schedule meetings',
      steps: [
        'Click "Connect to Webex" to authorize access',
        'Log in to your Webex account',
        'Grant permissions to the application',
        'You will be redirected back to complete the connection',
      ],
    },
  }

  const config = oauthConfig[provider.toLowerCase()]
  if (!config) {
    return (
      <Alert>
        <AlertDescription>
          OAuth connection is not available for {provider}. Please use API key or other authentication method.
        </AlertDescription>
      </Alert>
    )
  }

  const handleStartOAuth = async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      // Get OAuth URL from backend
      const response = await fetch('/api/sales/integrations/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          integrationId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to initiate OAuth')
      }

      const data = await response.json()
      setOauthUrl(data.authUrl)
      setStep(2)

      // Open OAuth URL in new window
      const width = 600
      const height = 700
      const left = window.screen.width / 2 - width / 2
      const top = window.screen.height / 2 - height / 2

      const oauthWindow = window.open(
        data.authUrl,
        'OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      )

      // Poll for OAuth completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(
            `/api/sales/integrations/oauth/status?state=${data.state}`
          )

          if (statusResponse.ok) {
            const statusData = await statusResponse.json()

            if (statusData.status === 'completed') {
              clearInterval(pollInterval)
              oauthWindow?.close()
              setConnectionStatus('success')
              setStep(3)

              if (statusData.integrationId) {
                onComplete(statusData.integrationId)
              }
            } else if (statusData.status === 'error') {
              clearInterval(pollInterval)
              oauthWindow?.close()
              setConnectionStatus('error')
              setErrorMessage(statusData.error || 'OAuth connection failed')
            }
          }
        } catch (error) {
          console.error('Error checking OAuth status:', error)
        }
      }, 2000)

      // Cleanup after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval)
        oauthWindow?.close()
        if (connectionStatus === 'idle') {
          setConnectionStatus('error')
          setErrorMessage('Connection timeout. Please try again.')
        }
      }, 300000)
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to start OAuth flow')
      setConnectionStatus('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyUrl = () => {
    if (oauthUrl) {
      navigator.clipboard.writeText(oauthUrl)
      toast({
        title: 'Copied',
        description: 'OAuth URL copied to clipboard',
      })
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Connect {config.name}</DialogTitle>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Introduction */}
          {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>How it works</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2">
                    {config.steps.map((stepText: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {stepText}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {errorMessage && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleStartOAuth} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      Connect to {config.name}
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: OAuth in Progress */}
          {step === 2 && (
            <div className="space-y-4">
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Waiting for authorization... Please complete the OAuth flow in the popup window.
                </AlertDescription>
              </Alert>

              {oauthUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle>Authorization URL</CardTitle>
                    <CardDescription>
                      If the popup didn't open, you can copy this URL and open it manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input value={oauthUrl} readOnly className="font-mono text-xs" />
                      <Button variant="outline" size="sm" onClick={handleCopyUrl}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 3 && connectionStatus === 'success' && (
            <div className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Successfully connected to {config.name}! Your integration is now ready to use.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button onClick={() => onComplete('')}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {/* Error State */}
          {connectionStatus === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {errorMessage || 'Failed to connect. Please try again.'}
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setStep(1)
                  setConnectionStatus('idle')
                  setErrorMessage(null)
                  setOauthUrl(null)
                }}>
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


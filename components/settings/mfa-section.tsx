'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Shield, CheckCircle2, XCircle, RefreshCw, Copy, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface MFAStatus {
  enabled: boolean
  hasSecret: boolean
}

export function MFASection() {
  const { toast } = useToast()
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false, hasSecret: false })
  const [loading, setLoading] = useState(true)
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [verificationToken, setVerificationToken] = useState('')
  const [setupStep, setSetupStep] = useState<'generate' | 'verify'>('generate')

  useEffect(() => {
    fetchMFAStatus()
  }, [])

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/user/mfa')
      if (response.ok) {
        const data = await response.json()
        setMfaStatus(data)
      }
    } catch (error) {
      console.error('Error fetching MFA status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSecret = async () => {
    try {
      const response = await fetch('/api/user/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })

      if (response.ok) {
        const data = await response.json()
        setQrCodeUrl(data.qrCodeUrl)
        setBackupCodes(data.backupCodes)
        setSetupDialogOpen(true)
        setSetupStep('verify')
      } else {
        throw new Error('Failed to generate MFA secret')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate MFA secret',
        variant: 'destructive',
      })
    }
  }

  const handleEnableMFA = async () => {
    if (!verificationToken.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter the verification code',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch('/api/user/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable', token: verificationToken }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'MFA enabled successfully',
        })
        setSetupDialogOpen(false)
        setVerificationToken('')
        fetchMFAStatus()
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Failed to enable MFA')
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Invalid verification code',
        variant: 'destructive',
      })
    }
  }

  const handleDisableMFA = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return
    }

    try {
      const response = await fetch('/api/user/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disable' }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'MFA disabled successfully',
        })
        fetchMFAStatus()
      } else {
        throw new Error('Failed to disable MFA')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disable MFA',
        variant: 'destructive',
      })
    }
  }

  const handleRegenerateBackupCodes = async () => {
    if (!confirm('This will invalidate your existing backup codes. Are you sure?')) {
      return
    }

    try {
      const response = await fetch('/api/user/mfa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate-backup-codes' }),
      })

      if (response.ok) {
        const data = await response.json()
        setBackupCodes(data.backupCodes)
        toast({
          title: 'Success',
          description: 'Backup codes regenerated',
        })
      } else {
        throw new Error('Failed to regenerate backup codes')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to regenerate backup codes',
        variant: 'destructive',
      })
    }
  }

  const copyBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    navigator.clipboard.writeText(codesText)
    toast({
      title: 'Copied',
      description: 'Backup codes copied to clipboard',
    })
  }

  const downloadBackupCodes = () => {
    const codesText = backupCodes.join('\n')
    const blob = new Blob([codesText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mfa-backup-codes.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security to your account
          </p>
          {mfaStatus.enabled && (
            <Badge variant="default" className="mt-2">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Enabled
            </Badge>
          )}
        </div>
        {mfaStatus.enabled ? (
          <Button variant="outline" onClick={handleDisableMFA}>
            <XCircle className="h-4 w-4 mr-2" />
            Disable MFA
          </Button>
        ) : (
          <Button variant="outline" onClick={handleGenerateSecret}>
            <Shield className="h-4 w-4 mr-2" />
            Enable MFA
          </Button>
        )}
      </div>

      {mfaStatus.enabled && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Your account is protected with two-factor authentication. You'll need to enter a code from your authenticator app when logging in.
          </AlertDescription>
        </Alert>
      )}

      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>

          {setupStep === 'verify' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <div>
                <Label>Verification Code</Label>
                <Input
                  value={verificationToken}
                  onChange={(e) => setVerificationToken(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the code from your authenticator app to verify setup
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleEnableMFA} className="flex-1">
                  Verify & Enable
                </Button>
                <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {backupCodes.length > 0 && (
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <Label>Backup Codes</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadBackupCodes}>
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted rounded">
                {backupCodes.map((code, index) => (
                  <code key={index} className="text-xs font-mono">
                    {code}
                  </code>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {mfaStatus.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Backup Codes</CardTitle>
            <CardDescription>
              Regenerate backup codes if you've lost them
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" onClick={handleRegenerateBackupCodes}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Backup Codes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


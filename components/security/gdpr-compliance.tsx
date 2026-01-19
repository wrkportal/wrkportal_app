'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Trash2, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function GDPRCompliance() {
  const [email, setEmail] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleExport = async () => {
    if (!email) {
      setError('Email is required')
      return
    }

    setExportLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/security/gdpr/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to export data')
      }

      const result = await response.json()
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gdpr-export-${email}-${new Date().toISOString()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setSuccess('Data exported successfully')
      setEmail('')
    } catch (error: any) {
      setError(error.message || 'Failed to export data')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      setError('Please type DELETE to confirm')
      return
    }

    if (!email) {
      setError('Email is required')
      return
    }

    setDeleteLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/security/gdpr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, confirm: deleteConfirm })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete data')
      }

      const result = await response.json()
      setSuccess(`Successfully deleted ${result.deleted} records`)
      setEmail('')
      setDeleteConfirm('')
      setDeleteDialogOpen(false)
    } catch (error: any) {
      setError(error.message || 'Failed to delete data')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GDPR Compliance</CardTitle>
        <CardDescription>
          Manage data access and deletion requests (GDPR Right to Access & Right to Deletion)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Email Address</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Enter the email address of the person whose data you want to export or delete
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            disabled={exportLoading || !email}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export Data (Right to Access)'}
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                disabled={!email}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Data (Right to Deletion)
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirm Data Deletion</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All personal data associated with this email will be permanently deleted.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently delete all contacts, leads, activities, and related data for {email}
                  </AlertDescription>
                </Alert>
                <div>
                  <Label>Type DELETE to confirm</Label>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="mt-1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Permanently'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>Right to Access:</strong> Export all personal data associated with an email address in JSON format.</p>
          <p><strong>Right to Deletion:</strong> Permanently delete all personal data associated with an email address.</p>
          <p><strong>Note:</strong> All GDPR requests are logged in the audit log for compliance tracking.</p>
        </div>
      </CardContent>
    </Card>
  )
}


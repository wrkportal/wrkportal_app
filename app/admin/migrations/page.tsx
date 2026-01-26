'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function MigrationsPage() {
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const runAllowedSectionsMigration = async () => {
    setRunning(true)
    setResult(null)

    try {
      const response = await fetch('/api/migrate/allowed-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult({ success: true, message: data.message || 'Migration completed successfully' })
      } else {
        setResult({ success: false, error: data.error || data.message || 'Migration failed' })
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'An error occurred' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Database Migrations</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add allowedSections Column</CardTitle>
          <CardDescription>
            This migration adds the `allowedSections` column to the User and TenantInvitation tables.
            This column is used for fine-grained section access control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runAllowedSectionsMigration}
            disabled={running}
            className="w-full sm:w-auto"
          >
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              'Run Migration'
            )}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div>
                  <p className="font-semibold">
                    {result.success ? 'Success' : 'Error'}
                  </p>
                  <p className="text-sm mt-1">
                    {result.message || result.error}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-muted-foreground mt-4">
            <p className="font-semibold mb-2">What this migration does:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Adds `allowedSections` TEXT column to User table</li>
              <li>Adds `allowedSections` TEXT column to TenantInvitation table</li>
              <li>Safe to run multiple times (uses IF NOT EXISTS)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

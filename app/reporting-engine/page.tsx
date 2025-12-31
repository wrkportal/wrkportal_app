'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { QueryBuilder } from '@/components/reporting-engine/query-builder'
import { FunctionSelector } from '@/components/reporting-engine/function-selector'
import { QueryResults } from '@/components/reporting-engine/query-results'
import { PluginsManager } from '@/components/reporting-engine/plugins-manager'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'

function ReportingEngineContent() {
  const searchParams = useSearchParams()
  const [queryResult, setQueryResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'query')

  const availableTables = [
    'User',
    'Project',
    'Task',
    'Timesheet',
    'OKR',
    'Program',
    'Portfolio'
  ]

  const handleExecuteQuery = async (query: any) => {
    setLoading(true)
    setError(null)
    setQueryResult(null)

    try {
      const response = await fetch('/api/reporting-engine/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || errorData.details || 'Query failed')
      }

      const result = await response.json()
      setQueryResult(result)
    } catch (err: any) {
      setError(err.message)
      console.error('Query error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectFunction = (func: any) => {
    // Show function details - could integrate with query builder
    alert(`Function: ${func.name}\nSyntax: ${func.syntax}\n\n${func.description}`)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Advanced Reporting Engine</h1>
        <p className="text-muted-foreground mt-2">
          Build and execute queries with custom functions and plugins
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="plugins">Plugins</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <QueryBuilder
                onExecute={handleExecuteQuery}
                tables={availableTables}
              />
            </div>
            <div className="lg:col-span-2">
              {loading && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Executing query...</p>
                  </CardContent>
                </Card>
              )}
              {!loading && !error && (
                <QueryResults result={queryResult} />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="functions">
          <FunctionSelector onSelect={handleSelectFunction} />
        </TabsContent>

        <TabsContent value="plugins">
          <PluginsManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ReportingEnginePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background sticky top-16 z-20 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Advanced Reporting Engine
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<div className="container mx-auto p-6">Loading...</div>}>
        <ReportingEngineContent />
      </Suspense>
    </div>
  )
}


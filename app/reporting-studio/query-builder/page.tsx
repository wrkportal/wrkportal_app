'use client'

import { useState, useEffect } from 'react'
import { SQLQueryBuilder } from '@/components/reporting-studio/sql-query-builder'
import { QueryResults } from '@/components/reporting-studio/query-results'
import { NaturalLanguageQuery } from '@/components/reporting-studio/natural-language-query'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Database, Code2, Sparkles } from 'lucide-react'
import { QueryBuilderConfig } from '@/lib/reporting-studio/sql-builder'

interface DataSource {
  id: string
  name: string
  provider?: string
}

export default function QueryBuilderPage() {
  const [dataSourceId, setDataSourceId] = useState<string>('')
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [queryResults, setQueryResults] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedSQL, setGeneratedSQL] = useState<string>('')

  useEffect(() => {
    fetchDataSources()
  }, [])

  const fetchDataSources = async () => {
    try {
      const response = await fetch('/api/reporting-studio/data-sources?type=DATABASE')
      if (response.ok) {
        const data = await response.json()
        setDataSources(data.items || [])
        if (data.items && data.items.length > 0) {
          setDataSourceId(data.items[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching data sources:', error)
    }
  }

  const handleExecute = async (query: string, config: QueryBuilderConfig) => {
    if (!dataSourceId) {
      setError('Please select a data source')
      return
    }

    setIsExecuting(true)
    setError(null)

    try {
      const response = await fetch('/api/reporting-studio/query/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId,
          query,
          optimize: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to execute query')
      }

      const data = await response.json()
      setQueryResults(data)
    } catch (err: any) {
      setError(err.message || 'Failed to execute query')
      setQueryResults(null)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleSave = async (query: string, config: QueryBuilderConfig, name: string) => {
    if (!dataSourceId) {
      alert('Please select a data source')
      return
    }

    try {
      const response = await fetch('/api/reporting-studio/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: `Query: ${query.substring(0, 100)}`,
          type: 'QUERY',
          dataSourceId,
          query,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save query')
      }

      alert('Query saved as dataset successfully!')
    } catch (err: any) {
      alert(err.message || 'Failed to save query')
    }
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Code2 className="h-8 w-8" />
            SQL Query Builder
          </h1>
          <p className="text-muted-foreground mt-2">
            Build and execute SQL queries visually or write SQL directly
          </p>
        </div>
      </div>

      {/* Data Source Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="dataSource" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Source:
            </Label>
            <Select value={dataSourceId} onValueChange={setDataSourceId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((ds) => (
                  <SelectItem key={ds.id} value={ds.id}>
                    {ds.name} {ds.provider && `(${ds.provider})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Query Builder with Tabs */}
      <Tabs defaultValue="visual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="visual">
            <Code2 className="h-4 w-4 mr-2" />
            Visual Builder
          </TabsTrigger>
          <TabsTrigger value="nlq">
            <Sparkles className="h-4 w-4 mr-2" />
            Natural Language
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visual" className="space-y-4">
          <SQLQueryBuilder
            dataSourceId={dataSourceId}
            onExecute={handleExecute}
            onSave={handleSave}
            initialQuery={generatedSQL}
          />
        </TabsContent>
        <TabsContent value="nlq" className="space-y-4">
          <NaturalLanguageQuery
            dataSourceId={dataSourceId}
            onSQLGenerated={(sql) => {
              setGeneratedSQL(sql)
            }}
            dialect={dataSources.find(ds => ds.id === dataSourceId)?.provider?.toLowerCase() === 'mysql' ? 'mysql' : 'postgresql'}
          />
          {generatedSQL && (
            <Alert>
              <AlertDescription>
                SQL query generated! Switch to the Visual Builder tab to review and execute it.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Results */}
      <QueryResults
        results={queryResults}
        isLoading={isExecuting}
        error={error}
      />
    </div>
  )
}


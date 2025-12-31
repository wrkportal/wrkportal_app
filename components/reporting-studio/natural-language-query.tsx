'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Sparkles, Copy, CheckCircle2, AlertCircle, Play, RefreshCw, Lightbulb, ThumbsUp, ThumbsDown, BarChart3, PieChart, TrendingUp, Table2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface NaturalLanguageQueryProps {
  dataSourceId?: string
  onSQLGenerated?: (sql: string) => void
  dialect?: 'postgresql' | 'mysql' | 'sqlserver'
}

interface QueryResult {
  sql: string
  confidence: number
  explanation: string
  suggestedVisualization?: 'bar' | 'line' | 'pie' | 'table' | 'scatter'
  confidenceDetails?: any
  // Query execution results
  data?: any[]
  columns?: string[]
  rows?: any[][]
  rowCount?: number
  executionTime?: number
  metadata?: {
    question: string
    dialect: string
    hasData: boolean
    isAggregate: boolean
  }
  error?: string
  executionError?: string
}

export function NaturalLanguageQuery({
  dataSourceId,
  onSQLGenerated,
  dialect = 'postgresql',
}: NaturalLanguageQueryProps) {
  const { toast } = useToast()
  const [question, setQuestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<QueryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | 'needs_improvement' | null>(null)

  const handleGenerate = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/reporting-studio/nlq/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          dataSourceId,
          dialect,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to generate query')
        if (data.suggestion) {
          toast({
            title: 'Error',
            description: data.error,
            variant: 'destructive',
          })
        }
        return
      }

      // Check if there's an execution error in the response (even if status is 200)
      if (data.error || data.executionError) {
        setError(data.executionError || data.error || 'Query execution failed')
        toast({
          title: 'Query Execution Error',
          description: data.executionError || data.error || 'The SQL query was generated but could not be executed.',
          variant: 'destructive',
        })
        // Still set the result so user can see the SQL
        setResult(data)
        return
      }

      setResult(data)
      if (onSQLGenerated) {
        onSQLGenerated(data.sql)
      }

      toast({
        title: 'Query Generated',
        description: `SQL query generated with ${Math.round(data.confidence * 100)}% confidence`,
      })
    } catch (err: any) {
      setError(err.message || 'Failed to generate query')
      toast({
        title: 'Error',
        description: 'Failed to generate SQL query',
        variant: 'destructive',
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopySQL = async () => {
    if (result?.sql) {
      await navigator.clipboard.writeText(result.sql)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: 'Copied',
        description: 'SQL query copied to clipboard',
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate()
    }
  }

  const fetchSuggestions = async () => {
    if (!dataSourceId) return
    
    try {
      const response = await fetch(`/api/reporting-studio/nlq/suggestions?dataSourceId=${dataSourceId}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err)
    }
  }

  useEffect(() => {
    if (dataSourceId) {
      fetchSuggestions()
    }
  }, [dataSourceId])

  const handleRefine = async () => {
    if (!result) return

    setIsRefining(true)
    try {
      const response = await fetch('/api/reporting-studio/nlq/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalQuestion: question,
          originalSQL: result.sql,
          userFeedback: feedback,
        }),
      })

      if (response.ok) {
        const refined = await response.json()
        setResult(refined)
        toast({
          title: 'Query Refined',
          description: 'The query has been improved based on your feedback',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Refinement Failed',
        description: err.message || 'Failed to refine query',
        variant: 'destructive',
      })
    } finally {
      setIsRefining(false)
    }
  }

  const handleFeedback = async (feedbackType: 'correct' | 'incorrect' | 'needs_improvement') => {
    setFeedback(feedbackType)
    if (feedbackType === 'incorrect' || feedbackType === 'needs_improvement') {
      // Auto-refine on negative feedback
      await handleRefine()
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <CardTitle>Natural Language Query</CardTitle>
        </div>
        <CardDescription>
          Ask a question in plain English and get a SQL query automatically generated
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nlq-question">Ask a question about your data</Label>
          <Textarea
            id="nlq-question"
            placeholder="Example: Show me the top 10 customers by revenue in the last quarter"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Press Cmd/Ctrl + Enter to generate query
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !question.trim()}
            className="flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Query...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate SQL Query
              </>
            )}
          </Button>
          {dataSourceId && (
            <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
              <DialogTrigger asChild>
                <Button variant="outline" onClick={fetchSuggestions}>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Suggestions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Query Suggestions</DialogTitle>
                  <DialogDescription>
                    Suggested queries based on your data source schema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="cursor-pointer hover:bg-muted" onClick={() => {
                      setQuestion(suggestion.question)
                      setShowSuggestions(false)
                    }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{suggestion.question}</p>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                              <code>{suggestion.sql}</code>
                            </pre>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {Math.round(suggestion.confidence * 100)}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {Math.round(result.confidence * 100)}% Confidence
                </Badge>
                {result.suggestedVisualization && (
                  <Badge variant="secondary" className="text-xs">
                    Suggested: {result.suggestedVisualization}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopySQL}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy SQL
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Generated SQL Query</Label>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono">
                  <code>{result.sql}</code>
                </pre>
              </div>
            </div>

            {result.explanation && (
              <Alert>
                <AlertDescription className="text-sm">
                  {result.explanation}
                </AlertDescription>
              </Alert>
            )}

            {/* Query Results */}
            {result.data !== undefined && (
              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Query Results</h3>
                    {result.executionTime && (
                      <Badge variant="outline" className="text-xs">
                        {result.executionTime}ms
                      </Badge>
                    )}
                    {result.rowCount !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
                      </Badge>
                    )}
                  </div>
                  {result.suggestedVisualization && (
                    <Badge variant="secondary" className="text-xs">
                      {result.suggestedVisualization === 'bar' && <BarChart3 className="h-3 w-3 mr-1" />}
                      {result.suggestedVisualization === 'pie' && <PieChart className="h-3 w-3 mr-1" />}
                      {result.suggestedVisualization === 'line' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {result.suggestedVisualization === 'table' && <Table2 className="h-3 w-3 mr-1" />}
                      {result.suggestedVisualization}
                    </Badge>
                  )}
                </div>

                {result.executionError ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold mb-1">Query Execution Failed</div>
                      <div className="text-sm">{result.executionError}</div>
                      <div className="text-xs mt-2 text-muted-foreground">
                        The SQL query was generated but could not be executed. Check the query syntax above.
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : result.rowCount === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No results found. The query executed successfully but returned no data.
                    </AlertDescription>
                  </Alert>
                ) : result.columns && result.rows ? (
                  <div className="space-y-4">
                    {/* Single value result (like COUNT) - show as card */}
                    {result.metadata?.isAggregate && result.rows.length === 1 && result.columns.length <= 2 && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="text-center">
                            <div className="text-3xl font-bold mb-2">
                              {result.rows[0][result.columns.length - 1]}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.columns[result.columns.length - 1]}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Table view for all results */}
                    <Card>
                      <CardContent className="p-0">
                        <ScrollArea className="h-[400px] w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {result.columns.map((col, idx) => (
                                  <TableHead key={idx} className="sticky top-0 bg-background z-10">
                                    {col}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.rows.map((row, rowIdx) => (
                                <TableRow key={rowIdx}>
                                  {row.map((cell, cellIdx) => (
                                    <TableCell key={cellIdx} className="max-w-[200px]">
                                      <div className="truncate" title={String(cell)}>
                                        {typeof cell === 'object' && cell !== null 
                                          ? JSON.stringify(cell) 
                                          : cell === null || cell === undefined
                                          ? <span className="text-muted-foreground">null</span>
                                          : String(cell)
                                        }
                                      </div>
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </div>
                ) : null}
              </div>
            )}

            {/* Confidence Details */}
            {result.confidenceDetails && (
              <div className="space-y-2">
                <Label className="text-xs">Confidence Breakdown</Label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schema Match:</span>
                    <span>{Math.round(result.confidenceDetails.schemaMatch * 100)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Syntax Valid:</span>
                    <span>{result.confidenceDetails.syntaxValid ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Semantic Valid:</span>
                    <span>{result.confidenceDetails.semanticValid ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Complexity:</span>
                    <span>{Math.round(result.confidenceDetails.complexityScore * 100)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback and Refinement */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-xs text-muted-foreground">Was this query helpful?</span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('correct')}
                  className="h-7"
                >
                  <ThumbsUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFeedback('incorrect')}
                  className="h-7"
                >
                  <ThumbsDown className="h-3 w-3" />
                </Button>
              </div>
              {feedback && (feedback === 'incorrect' || feedback === 'needs_improvement') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefine}
                  disabled={isRefining}
                  className="h-7 ml-auto"
                >
                  {isRefining ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3 w-3 mr-1" />
                  )}
                  Refine
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Tips for better results:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Be specific about what data you want to see</li>
            <li>Mention table names, columns, or relationships if you know them</li>
            <li>Include filtering criteria (dates, categories, etc.)</li>
            <li>Specify sorting or aggregation needs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}


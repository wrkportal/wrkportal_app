'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface DealScoreResult {
  opportunityId: string
  score: number
  confidence: number
  reasoning: string
  factors: {
    factor: string
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    weight: number
    description: string
  }[]
  recommendations: string[]
  predictedCloseDate?: string
  predictedCloseProbability: number
}

interface AIDealScoreProps {
  opportunityId: string
  compact?: boolean
  onScoreUpdate?: (score: number) => void
}

export function AIDealScore({ opportunityId, compact = false, onScoreUpdate }: AIDealScoreProps) {
  const [score, setScore] = useState<DealScoreResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchScore = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/ai/sales/deal-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId }),
      })

      if (response.ok) {
        const data = await response.json()
        setScore(data)
        onScoreUpdate?.(data.score)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to score deal')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to score deal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (opportunityId) {
      fetchScore()
    }
  }, [opportunityId])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Attention'
  }

  if (compact) {
    if (loading) {
      return (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Scoring...</span>
        </Badge>
      )
    }

    if (error) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>Score Error</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    if (!score) {
      return (
        <Badge variant="outline" className="gap-1 cursor-pointer" onClick={fetchScore}>
          <Sparkles className="h-3 w-3" />
          <span>Get AI Score</span>
        </Badge>
      )
    }

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge className={`gap-1 ${getScoreColor(score.score)}`}>
              <Sparkles className="h-3 w-3" />
              <span>AI: {score.score}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-sm">
            <div className="space-y-2">
              <p className="font-semibold">AI Deal Score: {score.score}/100</p>
              <p className="text-xs">{score.reasoning}</p>
              {score.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold">Recommendations:</p>
                  <ul className="text-xs list-disc list-inside">
                    {score.recommendations.slice(0, 2).map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              AI Deal Score
            </CardTitle>
            <CardDescription>ML-powered opportunity scoring</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchScore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scoring...
              </>
            ) : (
              'Refresh Score'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !score && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Analyzing deal...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchScore}>
              Retry
            </Button>
          </div>
        )}

        {score && !loading && (
          <div className="space-y-4">
            {/* Score Display */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4 ${getScoreColor(score.score)}`}>
                <div className="text-center">
                  <div className="text-3xl font-bold">{score.score}</div>
                  <div className="text-xs opacity-75">/100</div>
                </div>
              </div>
              <h3 className="text-lg font-semibold mb-1">{getScoreLabel(score.score)}</h3>
              <p className="text-sm text-muted-foreground">Confidence: {score.confidence}%</p>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Analysis</h4>
              <p className="text-sm text-muted-foreground">{score.reasoning}</p>
            </div>

            {/* Key Factors */}
            {score.factors.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Key Factors</h4>
                <div className="space-y-2">
                  {score.factors.slice(0, 5).map((factor, i) => (
                    <div key={i} className="flex items-start justify-between text-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{factor.factor}</span>
                          {factor.impact === 'POSITIVE' && (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          )}
                          {factor.impact === 'NEGATIVE' && (
                            <AlertTriangle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{factor.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {score.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {score.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Predicted Close */}
            {score.predictedCloseDate && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Predicted Close Date:</span>
                  <span className="font-medium">{new Date(score.predictedCloseDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Predicted Close Probability:</span>
                  <span className="font-medium">{score.predictedCloseProbability}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {!score && !loading && !error && (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">Get AI-powered deal scoring</p>
            <Button onClick={fetchScore}>
              <Sparkles className="h-4 w-4 mr-2" />
              Score This Deal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


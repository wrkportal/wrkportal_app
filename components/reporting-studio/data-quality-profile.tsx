'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface DataQualityProfileProps {
  datasetId: string
  datasetName?: string
  onRefresh?: () => void
}

interface QualityIssue {
  type: 'missing' | 'duplicate' | 'invalid' | 'inconsistent' | 'outlier'
  severity: 'low' | 'medium' | 'high'
  column?: string
  message: string
  count?: number
  percentage?: number
}

interface ColumnProfile {
  columnName: string
  dataType: string
  nullCount: number
  nullPercentage: number
  uniqueCount: number
  uniquePercentage: number
  qualityScore: number
  issues: QualityIssue[]
}

interface QualityScore {
  overall: number
  completeness: number
  uniqueness: number
  validity: number
  consistency: number
  issues: QualityIssue[]
}

interface DataProfile {
  columnProfiles: ColumnProfile[]
  overallQuality: QualityScore
  rowCount: number
  duplicateRows: number
  completeness: number
  uniqueness: number
  validity: number
  consistency: number
}

export function DataQualityProfile({ datasetId, datasetName, onRefresh }: DataQualityProfileProps) {
  const [profile, setProfile] = useState<DataProfile | null>(null)
  const [report, setReport] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (datasetId) {
      fetchProfile()
    }
  }, [datasetId])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reporting-studio/datasets/${datasetId}/profile`)
      
      if (!response.ok) {
        throw new Error('Failed to load profile')
      }

      const data = await response.json()
      setProfile(data.profile)
      setReport(data.report)
      if (onRefresh) {
        onRefresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load data quality profile')
    } finally {
      setIsLoading(false)
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'low':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Overall Quality Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Data Quality Overview</CardTitle>
              <CardDescription>
                {datasetName || 'Dataset'} quality metrics and statistics
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchProfile}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className={cn("text-3xl font-bold mb-2", getQualityColor(profile.overallQuality.overall))}>
                    {profile.overallQuality.overall.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Overall Score</div>
                  <Badge className={getQualityBadgeColor(profile.overallQuality.overall)}>
                    {profile.overallQuality.overall >= 80 ? 'Excellent' : 
                     profile.overallQuality.overall >= 60 ? 'Good' : 'Needs Improvement'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{profile.completeness.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mb-2">Completeness</div>
                  <Progress value={profile.completeness} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{profile.uniqueness.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mb-2">Uniqueness</div>
                  <Progress value={profile.uniqueness} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{profile.validity.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mb-2">Validity</div>
                  <Progress value={profile.validity} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-2">{profile.consistency.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground mb-2">Consistency</div>
                  <Progress value={profile.consistency} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-xl font-semibold">{profile.rowCount.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Total Rows</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-600">{profile.duplicateRows.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Duplicate Rows</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-yellow-600">
                {profile.overallQuality.issues.length}
              </div>
              <div className="text-sm text-muted-foreground">Quality Issues</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {report && report.recommendations && report.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Suggestions to improve data quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.recommendations.map((rec: string, idx: number) => (
                <Alert key={idx}>
                  <Info className="h-4 w-4" />
                  <AlertDescription>{rec}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Critical Issues */}
      {report && report.criticalIssues && report.criticalIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Critical Issues
            </CardTitle>
            <CardDescription>
              Issues that require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.criticalIssues.map((issue: QualityIssue, idx: number) => (
                <Alert key={idx} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{issue.message}</span>
                      {issue.column && (
                        <Badge variant="outline" className="ml-2">
                          {issue.column}
                        </Badge>
                      )}
                    </div>
                    {issue.count !== undefined && (
                      <div className="text-xs mt-1">
                        {issue.count.toLocaleString()} occurrences
                        {issue.percentage !== undefined && ` (${issue.percentage.toFixed(1)}%)`}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Column Profiles */}
      <Card>
        <CardHeader>
          <CardTitle>Column Quality Profiles</CardTitle>
          <CardDescription>
            Detailed quality metrics for each column
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Data Type</TableHead>
                  <TableHead>Completeness</TableHead>
                  <TableHead>Uniqueness</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.columnProfiles.map((col, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{col.columnName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{col.dataType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={100 - col.nullPercentage} className="h-2 w-20" />
                        <span className="text-sm">{(100 - col.nullPercentage).toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {col.nullCount} missing
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={col.uniquePercentage} className="h-2 w-20" />
                        <span className="text-sm">{col.uniquePercentage.toFixed(1)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {col.uniqueCount} unique
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getQualityBadgeColor(col.qualityScore)}>
                        {col.qualityScore.toFixed(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {col.issues.length === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {col.issues.map((issue, issueIdx) => (
                            <Badge key={issueIdx} className={getSeverityColor(issue.severity)} variant="outline">
                              {issue.type}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}


'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, AlertTriangle, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Insight } from '@/lib/reporting-studio/auto-insights/insight-generator'

interface InsightsSummaryCardProps {
  datasetId: string
  datasetName: string
  insights: Insight[]
}

export function InsightsSummaryCard({
  datasetId,
  datasetName,
  insights,
}: InsightsSummaryCardProps) {
  const criticalCount = insights.filter((i) => i.severity === 'critical').length
  const warningCount = insights.filter((i) => i.severity === 'warning').length
  const infoCount = insights.filter((i) => i.severity === 'info').length
  const actionableCount = insights.filter((i) => i.actionable).length

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Auto-Insights</CardTitle>
            </div>
            <Link href={`/reporting-studio/datasets/${datasetId}/insights`}>
              <Button variant="outline" size="sm">
                Generate
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
          <CardDescription>No insights available yet</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Auto-Insights</CardTitle>
          </div>
          <Link href={`/reporting-studio/datasets/${datasetId}/insights`}>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
        <CardDescription>{insights.length} insights generated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Summary Stats */}
          <div className="flex flex-wrap gap-2">
            {criticalCount > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {warningCount} Warnings
              </Badge>
            )}
            {infoCount > 0 && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Info className="h-3 w-3" />
                {infoCount} Info
              </Badge>
            )}
            {actionableCount > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {actionableCount} Actionable
              </Badge>
            )}
          </div>

          {/* Top Insights Preview */}
          <div className="space-y-2">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="text-sm p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {insight.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {insight.description}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`flex-shrink-0 ${
                      insight.severity === 'critical'
                        ? 'border-red-300 text-red-700 dark:border-red-800 dark:text-red-300'
                        : insight.severity === 'warning'
                        ? 'border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-300'
                        : ''
                    }`}
                  >
                    {insight.severity}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


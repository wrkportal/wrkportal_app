'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { AlertCircle, TrendingUp, TrendingDown, AlertTriangle, Info, Lightbulb, MoreVertical, X, Star } from 'lucide-react'
import { Insight } from '@/lib/reporting-studio/auto-insights/insight-generator'

interface InsightCardProps {
  insight: Insight & { isDismissed?: boolean; isFavorited?: boolean }
  onAction?: (insight: Insight) => void
  onDismiss?: (insightId: string) => void
  onFavorite?: (insightId: string, favorited: boolean) => void
}

export function InsightCard({ insight, onAction, onDismiss, onFavorite }: InsightCardProps) {
  const getSeverityIcon = () => {
    switch (insight.severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = () => {
    switch (insight.severity) {
      case 'critical':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900'
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900'
    }
  }

  const getTypeIcon = () => {
    switch (insight.type) {
      case 'trend':
        return insight.data.change && insight.data.change > 0 ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (insight.type) {
      case 'trend':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      case 'anomaly':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'correlation':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'statistical':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card className={`${getSeverityColor()} transition-all hover:shadow-md`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="mt-0.5">{getSeverityIcon()}</div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold leading-tight">
                {insight.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className={getTypeColor()}>
                  <div className="flex items-center gap-1">
                    {getTypeIcon()}
                    <span className="capitalize text-xs">{insight.type}</span>
                  </div>
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {Math.round(insight.confidence * 100)}% confidence
                </Badge>
                {insight.actionable && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300 text-xs">
                    Actionable
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onFavorite && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onFavorite(insight.id, !insight.isFavorited)}
              >
                <Star
                  className={`h-4 w-4 ${
                    insight.isFavorited
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              </Button>
            )}
            {onDismiss && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {insight.isDismissed ? (
                    <DropdownMenuItem onClick={() => onDismiss(insight.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Undismiss
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => onDismiss(insight.id)}>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <CardDescription className="text-sm leading-relaxed">
          {insight.description}
        </CardDescription>

        {insight.data && (insight.data.value !== undefined || insight.data.metric) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {insight.data.metric && (
              <span className="font-medium">{insight.data.metric}:</span>
            )}
            {insight.data.value !== undefined && (
              <span className="font-semibold text-foreground">
                {typeof insight.data.value === 'number'
                  ? insight.data.value.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })
                  : insight.data.value}
              </span>
            )}
            {insight.data.change !== undefined && (
              <span className={`font-semibold ${insight.data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insight.data.change >= 0 ? '+' : ''}
                {insight.data.change.toFixed(2)}
              </span>
            )}
          </div>
        )}

        {insight.recommendation && (
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Recommendation:</p>
                <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


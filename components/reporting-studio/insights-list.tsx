'use client'

import { useState, useMemo } from 'react'
import { InsightCard } from './insight-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { AlertCircle, Filter, Search, RefreshCw, ArrowUpDown, Download, X } from 'lucide-react'
import { Insight } from '@/lib/reporting-studio/auto-insights/insight-generator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface InsightsListProps {
  insights: Insight[]
  isLoading?: boolean
  onRefresh?: () => void
  onFilterChange?: (filter: InsightFilter) => void
}

export interface InsightFilter {
  type?: Insight['type']
  severity?: Insight['severity']
  search?: string
  sortBy?: 'date' | 'severity' | 'confidence' | 'type'
  sortOrder?: 'asc' | 'desc'
}

export function InsightsList({
  insights,
  isLoading = false,
  onRefresh,
  onFilterChange,
}: InsightsListProps) {
  const [filter, setFilter] = useState<InsightFilter>({
    sortBy: 'date',
    sortOrder: 'desc',
  })
  const [searchTerm, setSearchTerm] = useState('')
  
  // Initialize dismissed insights from API data
  const dismissedInsights = useMemo(
    () => new Set(insights.filter(i => (i as any).isDismissed).map(i => i.id)),
    [insights]
  )
  
  const setDismissedInsights = (updater: (prev: Set<string>) => Set<string>) => {
    // This is handled via API calls now, state will update on refresh
    onRefresh?.()
  }

  const handleFilterChange = (newFilter: Partial<InsightFilter>) => {
    const updatedFilter = { ...filter, ...newFilter }
    setFilter(updatedFilter)
    onFilterChange?.(updatedFilter)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    handleFilterChange({ search: term })
  }

  // Filter and sort insights
  const filteredAndSortedInsights = useMemo(() => {
    let filtered = insights.filter((insight) => {
      // Skip dismissed insights
      if (dismissedInsights.has(insight.id)) return false
      
      if (filter.type && insight.type !== filter.type) return false
      if (filter.severity && insight.severity !== filter.severity) return false
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return (
          insight.title.toLowerCase().includes(searchLower) ||
          insight.description.toLowerCase().includes(searchLower)
        )
      }
      return true
    })

    // Sort insights
    const sortBy = filter.sortBy || 'date'
    const sortOrder = filter.sortOrder || 'desc'
    
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'severity':
          const severityOrder = { critical: 3, warning: 2, info: 1 }
          comparison = (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0)
          break
        case 'confidence':
          comparison = (a.confidence || 0) - (b.confidence || 0)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'date':
        default:
          // For date, we'll use the order they appear (newest first by default)
          comparison = 0
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    return filtered
  }, [insights, filter, searchTerm, dismissedInsights])

  const handleDismiss = async (insightId: string) => {
    try {
      const response = await fetch(`/api/reporting-studio/insights/${insightId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'DISMISSED' }),
      })

      if (response.ok) {
        // Refresh to get updated state
        onRefresh?.()
      } else {
        console.error('Failed to dismiss insight')
      }
    } catch (error) {
      console.error('Error dismissing insight:', error)
    }
  }

  const handleUndismiss = async (insightId: string) => {
    try {
      const response = await fetch(
        `/api/reporting-studio/insights/${insightId}/actions?actionType=DISMISSED`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        // Refresh to get updated state
        onRefresh?.()
      } else {
        console.error('Failed to undismiss insight')
      }
    } catch (error) {
      console.error('Error undismissing insight:', error)
    }
  }

  const handleFavorite = async (insightId: string, favorited: boolean) => {
    try {
      if (favorited) {
        await fetch(`/api/reporting-studio/insights/${insightId}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actionType: 'FAVORITED' }),
        })
      } else {
        await fetch(
          `/api/reporting-studio/insights/${insightId}/actions?actionType=FAVORITED`,
          { method: 'DELETE' }
        )
      }
      // Refresh insights to get updated state
      onRefresh?.()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleExport = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalInsights: filteredAndSortedInsights.length,
      insights: filteredAndSortedInsights.map(insight => ({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        severity: insight.severity,
        confidence: insight.confidence,
        actionable: insight.actionable,
        recommendation: insight.recommendation,
        data: insight.data,
      })),
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `insights-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Group by severity
  const criticalInsights = filteredAndSortedInsights.filter((i) => i.severity === 'critical')
  const warningInsights = filteredAndSortedInsights.filter((i) => i.severity === 'warning')
  const infoInsights = filteredAndSortedInsights.filter((i) => i.severity === 'info')

  // Count by type
  const typeCounts = filteredAndSortedInsights.reduce(
    (acc, insight) => {
      acc[insight.type] = (acc[insight.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No insights available. Generate insights by analyzing your dataset.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => handleSearch('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <Select
          value={filter.type || 'all'}
          onValueChange={(value) =>
            handleFilterChange({ type: value === 'all' ? undefined : (value as Insight['type']) })
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="statistical">Statistical</SelectItem>
            <SelectItem value="trend">Trend</SelectItem>
            <SelectItem value="anomaly">Anomaly</SelectItem>
            <SelectItem value="correlation">Correlation</SelectItem>
            <SelectItem value="pattern">Pattern</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.severity || 'all'}
          onValueChange={(value) =>
            handleFilterChange({
              severity: value === 'all' ? undefined : (value as Insight['severity']),
            })
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.sortBy || 'date'}
          onValueChange={(value) =>
            handleFilterChange({ sortBy: value as InsightFilter['sortBy'] })
          }
        >
          <SelectTrigger className="w-full sm:w-40">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="severity">Severity</SelectItem>
            <SelectItem value="confidence">Confidence</SelectItem>
            <SelectItem value="type">Type</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filter.sortOrder || 'desc'}
          onValueChange={(value) =>
            handleFilterChange({ sortOrder: value as 'asc' | 'desc' })
          }
        >
          <SelectTrigger className="w-full sm:w-32">
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Descending</SelectItem>
            <SelectItem value="asc">Ascending</SelectItem>
          </SelectContent>
        </Select>
        {filteredAndSortedInsights.length > 0 && (
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
        {onRefresh && (
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="flex flex-wrap gap-4 items-center">
        <Badge variant="outline" className="px-3 py-1">
          Total: {filteredAndSortedInsights.length}
        </Badge>
        {dismissedInsights.size > 0 && (
          <Badge variant="outline" className="px-3 py-1">
            Dismissed: {dismissedInsights.size}
          </Badge>
        )}
        {criticalInsights.length > 0 && (
          <Badge variant="destructive" className="px-3 py-1">
            Critical: {criticalInsights.length}
          </Badge>
        )}
        {warningInsights.length > 0 && (
          <Badge variant="outline" className="px-3 py-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
            Warnings: {warningInsights.length}
          </Badge>
        )}
        {Object.entries(typeCounts).map(([type, count]) => (
          <Badge key={type} variant="outline" className="px-3 py-1 capitalize">
            {type}: {count}
          </Badge>
        ))}
      </div>

      {/* Insights List - Grouped by Severity */}
      {filteredAndSortedInsights.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No insights match your filters. Try adjusting your search or filter criteria.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-6">
          {/* Critical Insights */}
          {criticalInsights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                Critical Insights ({criticalInsights.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {criticalInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={insight.isDismissed ? handleUndismiss : handleDismiss}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Warning Insights */}
          {warningInsights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                Warnings ({warningInsights.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {warningInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={insight.isDismissed ? handleUndismiss : handleDismiss}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Info Insights */}
          {infoInsights.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                Informational ({infoInsights.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {infoInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onDismiss={insight.isDismissed ? handleUndismiss : handleDismiss}
                    onFavorite={handleFavorite}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}


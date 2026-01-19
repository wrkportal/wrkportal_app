'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Target, DollarSign } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ProfitabilityTab() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('MTD')

  useEffect(() => {
    loadProfitabilityData()
  }, [period])

  const loadProfitabilityData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/finance/profitability?period=${period}`)
      if (response.ok) {
        const profitabilityData = await response.json()
        setData(profitabilityData)
      }
    } catch (error) {
      console.error('Error loading profitability data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profitability data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No profitability data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Profitability Analysis</h2>
          <p className="text-muted-foreground">Revenue vs Expenses analysis</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MTD">MTD</SelectItem>
            <SelectItem value="QTD">QTD</SelectItem>
            <SelectItem value="YTD">YTD</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gross Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.grossProfit)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.grossMargin.toFixed(1)}% margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Income</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">Costs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${data.profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.profitGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {data.profitGrowth >= 0 ? '+' : ''}{data.profitGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>
      </div>

      {/* Profitability by Project */}
      {data.profitabilityByProject && data.profitabilityByProject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Profitability by Project</CardTitle>
            <CardDescription>Revenue, expenses, and profit breakdown by project</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="text-right">Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.profitabilityByProject.map((project: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.expenses)}</TableCell>
                    <TableCell className={`text-right font-semibold ${project.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(project.profit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={project.margin >= 20 ? 'default' : project.margin >= 10 ? 'secondary' : 'destructive'}>
                        {project.margin.toFixed(1)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trend */}
      {data.monthlyTrend && data.monthlyTrend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Profitability Trend</CardTitle>
            <CardDescription>Revenue, expenses, and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.monthlyTrend.map((month: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        Rev: {formatCurrency(month.revenue)}
                      </span>
                      <span className="text-muted-foreground">
                        Exp: {formatCurrency(month.expenses)}
                      </span>
                      <span className={`font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Profit: {formatCurrency(month.profit)}
                      </span>
                      <Badge variant={month.margin >= 20 ? 'default' : month.margin >= 10 ? 'secondary' : 'destructive'}>
                        {month.margin.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 flex">
                    <div
                      className="bg-green-500 h-2 rounded-l-full transition-all"
                      style={{ width: `${month.revenue > 0 ? (month.profit / month.revenue) * 100 : 0}%` }}
                    />
                    <div
                      className="bg-red-500 h-2 transition-all"
                      style={{ width: `${month.revenue > 0 ? (month.expenses / month.revenue) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


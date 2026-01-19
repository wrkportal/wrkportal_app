'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ExpensesTab() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('MTD')
  const [costTypeFilter, setCostTypeFilter] = useState<string>('')

  useEffect(() => {
    loadExpensesData()
  }, [period, costTypeFilter])

  const loadExpensesData = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      params.append('period', period)
      if (costTypeFilter) params.append('costType', costTypeFilter)

      const response = await fetch(`/api/finance/expenses?${params.toString()}`)
      if (response.ok) {
        const expensesData = await response.json()
        setData(expensesData)
      }
    } catch (error) {
      console.error('Error loading expenses data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expenses data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No expenses data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Expenses Overview</h2>
          <p className="text-muted-foreground">Track and analyze your expenses</p>
        </div>
        <div className="flex gap-2">
          <Select value={costTypeFilter} onValueChange={setCostTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="DIRECT">Direct</SelectItem>
              <SelectItem value="INDIRECT">Indirect</SelectItem>
              <SelectItem value="FIXED">Fixed</SelectItem>
              <SelectItem value="VARIABLE">Variable</SelectItem>
            </SelectContent>
          </Select>
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.expenseCount} expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${data.expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.expenseGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {data.expenseGrowth >= 0 ? '+' : ''}{data.expenseGrowth.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">vs previous period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.expenseCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg per Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.expenseCount > 0 ? data.totalExpenses / data.expenseCount : 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Average expense value</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Type */}
      {data.expensesByType && data.expensesByType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Type</CardTitle>
            <CardDescription>Breakdown of expenses by cost type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.expensesByType.map((type: any, idx: number) => {
                const percentage = data.totalExpenses > 0 
                  ? (type.amount / data.totalExpenses) * 100 
                  : 0
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.type}</span>
                        <Badge variant="outline">{type.count} expenses</Badge>
                      </div>
                      <span className="font-semibold">{formatCurrency(type.amount)}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expenses by Project */}
      {data.expensesByProject && data.expensesByProject.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Project</CardTitle>
            <CardDescription>Breakdown of expenses by project</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expensesByProject.map((project: any, idx: number) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{project.projectName}</TableCell>
                    <TableCell>{project.count}</TableCell>
                    <TableCell className="text-right">{formatCurrency(project.amount)}</TableCell>
                    <TableCell className="text-right">
                      {data.totalExpenses > 0 
                        ? ((project.amount / data.totalExpenses) * 100).toFixed(1)
                        : 0}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      {data.expenses && data.expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest approved expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.expenses.slice(0, 10).map((expense: any) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.costType}</Badge>
                    </TableCell>
                    <TableCell>{expense.project?.name || 'N/A'}</TableCell>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(expense.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


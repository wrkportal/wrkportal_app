'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/utils'
import { DollarSign, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function ARAPTab() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadARAPData()
  }, [])

  const loadARAPData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/finance/ar-ap?type=all')
      if (response.ok) {
        const arApData = await response.json()
        setData(arApData)
      }
    } catch (error) {
      console.error('Error loading AR/AP data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AR/AP data...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No AR/AP data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Accounts Receivable & Payable</h2>
        <p className="text-muted-foreground">Track money owed to you and by you</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total AR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.accountsReceivable.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.accountsReceivable.count} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue AR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(data.accountsReceivable.overdue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.accountsReceivable.overdueCount} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total AP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.accountsPayable.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.accountsPayable.count} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Working Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold flex items-center gap-2 ${data.netWorkingCapital >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netWorkingCapital >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              {formatCurrency(data.netWorkingCapital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">AR - AP</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ar">Accounts Receivable</TabsTrigger>
          <TabsTrigger value="ap">Accounts Payable</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* AR Aging */}
          {data.accountsReceivable.aging && (
            <Card>
              <CardHeader>
                <CardTitle>AR Aging Analysis</CardTitle>
                <CardDescription>Breakdown of receivables by age</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current (Not Due)</span>
                    <span className="font-semibold">{formatCurrency(data.accountsReceivable.aging.current)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">1-30 Days</span>
                    <span className="font-semibold">{formatCurrency(data.accountsReceivable.aging.days1_30)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">31-60 Days</span>
                    <span className="font-semibold text-amber-600">{formatCurrency(data.accountsReceivable.aging.days31_60)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">61-90 Days</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(data.accountsReceivable.aging.days61_90)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Over 90 Days</span>
                    <span className="font-semibold text-red-600">{formatCurrency(data.accountsReceivable.aging.daysOver90)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Receivable</CardTitle>
              <CardDescription>Invoices awaiting payment</CardDescription>
            </CardHeader>
            <CardContent>
              {data.accountsReceivable.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No outstanding receivables
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.accountsReceivable.items.map((ar: any) => (
                      <TableRow key={ar.id} className={ar.isOverdue ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{ar.invoiceNumber}</TableCell>
                        <TableCell>{ar.clientName}</TableCell>
                        <TableCell>{ar.project?.name || 'N/A'}</TableCell>
                        <TableCell className={ar.isOverdue ? 'text-red-600 font-medium' : ''}>
                          {new Date(ar.dueDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(ar.totalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ar.paid)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(ar.balance)}</TableCell>
                        <TableCell>
                          {ar.isOverdue ? (
                            <Badge variant="destructive">
                              {ar.daysOverdue} days overdue
                            </Badge>
                          ) : (
                            <Badge variant="secondary">{ar.status}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounts Payable</CardTitle>
              <CardDescription>Expenses awaiting payment</CardDescription>
            </CardHeader>
            <CardContent>
              {data.accountsPayable.items.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No outstanding payables
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.accountsPayable.items.map((ap: any) => (
                      <TableRow key={ap.id} className={ap.isOverdue ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{ap.name}</TableCell>
                        <TableCell>{ap.vendor}</TableCell>
                        <TableCell>{ap.project?.name || 'N/A'}</TableCell>
                        <TableCell>{new Date(ap.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ap.amount)}</TableCell>
                        <TableCell>
                          {ap.isOverdue ? (
                            <Badge variant="destructive">
                              {ap.daysSince} days old
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


'use client'

import { useState, useEffect } from 'react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, TrendingUp, Users, Target, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function SalesAnalyticsPage() {
  const [funnelData, setFunnelData] = useState<any>(null)
  const [winRateData, setWinRateData] = useState<any>(null)
  const [timeToCloseData, setTimeToCloseData] = useState<any>(null)
  const [repPerformanceData, setRepPerformanceData] = useState<any>(null)
  const [cohortData, setCohortData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('lastQuarter')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const getDateRange = () => {
    const now = new Date()
    const endDate = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'lastMonth':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'lastQuarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'lastYear':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate = new Date(0)
    }

    return { startDate, endDate }
  }

  const fetchAnalytics = async () => {
    setLoading(true)
    const { startDate, endDate } = getDateRange()

    try {
      const [funnel, winRate, timeToClose, cohorts] = await Promise.all([
        fetch(`/api/analytics/sales/funnel?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(r => r.json()),
        fetch(`/api/analytics/sales/win-rate?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(r => r.json()),
        fetch(`/api/analytics/sales/time-to-close?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(r => r.json()),
        fetch(`/api/analytics/sales/cohorts?cohortType=month&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`).then(r => r.json())
      ])

      setFunnelData(funnel)
      setWinRateData(winRate)
      setTimeToCloseData(timeToClose)
      setCohortData(cohorts)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}K`
    }
    return `$${value.toFixed(2)}`
  }

  const exportData = (data: any, filename: string) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <SalesPageLayout
      title="Analytics"
      description="Advanced analytics and insights for your sales performance"
    >
      <div className="space-y-6">
        {/* Header Controls */}
        <div className="flex items-center justify-between">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="allTime">All Time</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="lastQuarter">Last Quarter</SelectItem>
              <SelectItem value="lastYear">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

      {loading ? (
        <div className="text-center py-12">Loading analytics...</div>
      ) : (
        <Tabs defaultValue="funnel" className="space-y-4">
          <TabsList>
            <TabsTrigger value="funnel">Funnel Analysis</TabsTrigger>
            <TabsTrigger value="win-rate">Win Rate</TabsTrigger>
            <TabsTrigger value="time-to-close">Time to Close</TabsTrigger>
            <TabsTrigger value="cohorts">Cohort Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-4">
            {funnelData && funnelData.stages && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{funnelData.totalOpportunities}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                    </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(funnelData.totalValue)}
                    </div>
                  </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Overall Conversion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{funnelData.overallConversionRate}%</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Sales Funnel</CardTitle>
                        <CardDescription>Opportunity flow through pipeline stages</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportData(funnelData, `funnel-analysis-${dateRange}.json`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={funnelData.stages}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="count" fill="#8884d8" name="Opportunities" />
                        <Bar yAxisId="right" dataKey="amount" fill="#82ca9d" name="Value ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Conversion Rates by Stage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {funnelData.stages.map((stage: any) => (
                        <div key={stage.stage} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{stage.name}</span>
                            <div className="flex gap-4 text-sm">
                              <span className="text-muted-foreground">
                                {stage.count} opportunities
                              </span>
                              <span className="font-medium">
                                {formatCurrency(stage.amount)}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Conversion Rate</span>
                                <span className="text-xs font-medium">{stage.conversionRate}%</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600"
                                  style={{ width: `${Math.min(stage.conversionRate, 100)}%` }}
                                />
                              </div>
                            </div>
                            {stage.dropoffRate > 0 && (
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Dropoff Rate</span>
                                  <span className="text-xs font-medium">{stage.dropoffRate}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-red-500"
                                    style={{ width: `${Math.min(stage.dropoffRate, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="win-rate" className="space-y-4">
            {winRateData && winRateData.overall && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Overall Win Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{winRateData.overall.winRate || 0}%</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {winRateData.overall.won || 0} won / {winRateData.overall.totalClosed || 0} closed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Won</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{winRateData.overall.won || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Lost</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">{winRateData.overall.lost || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Closed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{winRateData.overall.totalClosed || 0}</div>
                    </CardContent>
                  </Card>
                </div>

                {winRateData.byRep && winRateData.byRep.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Win Rate by Sales Rep</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportData(winRateData.byRep, `win-rate-by-rep-${dateRange}.json`)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={winRateData.byRep}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="repName" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="winRate" fill="#8884d8" name="Win Rate %">
                              {winRateData.byRep.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {winRateData.bySource && winRateData.bySource.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Win Rate by Source</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportData(winRateData.bySource, `win-rate-by-source-${dateRange}.json`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={winRateData.bySource}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ source, winRate }) => `${source}: ${winRate}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="winRate"
                              >
                                {winRateData.bySource.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="time-to-close" className="space-y-4">
            {timeToCloseData && timeToCloseData.overall && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Avg Time to Close
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{timeToCloseData.overall.avgDays || 0} days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Median</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{timeToCloseData.overall.medianDays || 0} days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Fastest</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{timeToCloseData.overall.minDays || 0} days</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Slowest</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-amber-600">{timeToCloseData.overall.maxDays || 0} days</div>
                    </CardContent>
                  </Card>
                </div>

                {timeToCloseData.byRep && timeToCloseData.byRep.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>Time to Close by Rep</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => exportData(timeToCloseData.byRep, `time-to-close-by-rep-${dateRange}.json`)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={timeToCloseData.byRep}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="repName" angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="avgDays" fill="#8884d8" name="Avg Days">
                              {timeToCloseData.byRep.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {timeToCloseData.trend && timeToCloseData.trend.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle>Time to Close Trend</CardTitle>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => exportData(timeToCloseData.trend, `time-to-close-trend-${dateRange}.json`)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={timeToCloseData.trend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="period" />
                              <YAxis />
                              <Tooltip />
                              <Area type="monotone" dataKey="avgDays" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} name="Avg Days" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="cohorts" className="space-y-4">
            {cohortData && cohortData.cohorts && cohortData.cohorts.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Cohort Analysis</CardTitle>
                        <CardDescription>Customer retention and revenue by acquisition cohort</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportData(cohortData, `cohort-analysis-${dateRange}.json`)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cohortData.cohorts.slice(0, 10).map((cohort: any) => (
                        <Card key={cohort.cohort}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{cohort.cohort}</CardTitle>
                              <Badge variant="secondary">{cohort.cohortSize} customers</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {cohort.periods.slice(0, 6).map((period: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-2 border rounded">
                                  <span className="text-sm font-medium">{period.period}</span>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-muted-foreground">
                                      {period.activeCustomers} active
                                    </span>
                                    <span className="font-medium">
                                      {formatCurrency(period.revenue)}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {period.retentionRate.toFixed(1)}% retention
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {cohort.periods.length > 6 && (
                                <div className="text-xs text-muted-foreground text-center pt-2">
                                  ... and {cohort.periods.length - 6} more periods
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
      </div>
    </SalesPageLayout>
  )
}


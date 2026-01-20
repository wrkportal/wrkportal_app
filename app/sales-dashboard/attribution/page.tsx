'use client'

import { useState, useEffect, Suspense } from 'react'
import { SalesPageLayout } from '@/components/sales/sales-page-layout'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

interface AttributionResult {
  opportunityId: string
  opportunityName: string
  totalValue: number
  touchpoints: Array<{
    id: string
    type: string
    date: string
    description: string
  }>
  attribution: {
    firstTouch: any
    lastTouch: any
    linear: Record<string, number>
    timeDecay: Record<string, number>
    uShaped: Record<string, number>
    wShaped: Record<string, number>
  }
}

interface AttributionSummary {
  [key: string]: {
    count: number
    totalValue: number
    linear: number
    timeDecay: number
    uShaped: number
    wShaped: number
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658']

function AttributionAnalysisPageInner() {
  const { toast } = useToast()
  const [results, setResults] = useState<AttributionResult[]>([])
  const [summary, setSummary] = useState<AttributionSummary>({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'opportunities'>('summary')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })
  const [selectedModel, setSelectedModel] = useState<'linear' | 'timeDecay' | 'uShaped' | 'wShaped'>('linear')

  useEffect(() => {
    fetchSummary()
  }, [dateRange])

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/sales/attribution?summary=true&startDate=${dateRange.start}&endDate=${dateRange.end}`
      )
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching attribution summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/sales/attribution?startDate=${dateRange.start}&endDate=${dateRange.end}`
      )
      if (response.ok) {
        const data = await response.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error fetching attribution results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'opportunities') {
      fetchOpportunities()
    }
  }, [activeTab, dateRange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const summaryChartData = Object.entries(summary).map(([type, data]) => ({
    type,
    value: data[selectedModel],
    count: data.count,
    totalValue: data.totalValue,
  }))

  const exportData = () => {
    const data = activeTab === 'summary' ? summary : results
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attribution-${activeTab}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <SalesPageLayout
      title="Attribution Analysis"
      description="Multi-touch attribution analysis for sales opportunities"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Attribution Analysis</h2>
            <p className="text-muted-foreground">
              Analyze revenue attribution across touchpoints
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-40"
              />
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-40"
              />
            </div>
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'summary' | 'opportunities')}>
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Attribution Model</CardTitle>
                  <Select value={selectedModel} onValueChange={(v: any) => setSelectedModel(v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="timeDecay">Time Decay</SelectItem>
                      <SelectItem value="uShaped">U-Shaped</SelectItem>
                      <SelectItem value="wShaped">W-Shaped</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : summaryChartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No attribution data available
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={summaryChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Legend />
                          <Bar dataKey="value" fill="#0088FE" name="Attributed Revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(summary).map(([type, data]) => (
                        <Card key={type}>
                          <CardHeader>
                            <CardTitle className="text-sm">{type}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <div className="text-2xl font-bold">
                                {formatCurrency(data[selectedModel])}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {data.count} touchpoints
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total: {formatCurrency(data.totalValue)}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : results.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No opportunities found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <Card key={result.opportunityId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{result.opportunityName}</CardTitle>
                          <CardDescription>
                            {formatCurrency(result.totalValue)}
                          </CardDescription>
                        </div>
                        <Badge>{result.touchpoints.length} touchpoints</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Touchpoints</h4>
                          <div className="space-y-2">
                            {result.touchpoints.map((tp, index) => (
                              <div key={tp.id} className="flex items-center justify-between p-2 bg-muted rounded">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">{tp.type}</Badge>
                                  <span className="text-sm">{tp.description}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(tp.date).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium mb-2">Attribution Credit ({selectedModel})</h4>
                          <div className="space-y-1">
                            {result.touchpoints.map((tp) => {
                              const credit = result.attribution[selectedModel][tp.id] || 0
                              return (
                                <div key={tp.id} className="flex items-center justify-between">
                                  <span className="text-sm">{tp.type}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-32 bg-muted rounded-full h-2">
                                      <div
                                        className="bg-primary h-2 rounded-full"
                                        style={{ width: `${credit}%` }}
                                      />
                                    </div>
                                    <span className="text-sm w-12 text-right">{credit.toFixed(1)}%</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SalesPageLayout>
  )
}

export default function AttributionAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    }>
      <AttributionAnalysisPageInner />
    </Suspense>
  )
}

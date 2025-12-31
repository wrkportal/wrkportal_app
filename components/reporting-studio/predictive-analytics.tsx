'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, TrendingUp, BarChart3, Brain } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface PredictiveAnalyticsProps {
  datasetId?: string
  data?: Array<{ date: string; value: number }>
}

export function PredictiveAnalytics({ datasetId, data }: PredictiveAnalyticsProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('forecast')
  const [isLoading, setIsLoading] = useState(false)
  const [forecastResult, setForecastResult] = useState<any>(null)
  const [regressionResult, setRegressionResult] = useState<any>(null)
  const [classificationResult, setClassificationResult] = useState<any>(null)

  // Forecast state
  const [forecastMethod, setForecastMethod] = useState('linear')
  const [forecastPeriods, setForecastPeriods] = useState('12')
  const [forecastSeasonality, setForecastSeasonality] = useState('12')

  // Regression state
  const [regressionType, setRegressionType] = useState('linear')
  const [regressionData, setRegressionData] = useState('')

  // Classification state
  const [classificationModel, setClassificationModel] = useState('knn')
  const [kValue, setKValue] = useState('3')

  const handleForecast = async () => {
    if (!data || data.length < 2) {
      toast({
        title: 'Insufficient Data',
        description: 'Need at least 2 data points for forecasting',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/reporting-studio/predictive/forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: data.map(d => ({
            date: d.date,
            value: d.value,
          })),
          options: {
            method: forecastMethod,
            periods: parseInt(forecastPeriods),
            seasonality: forecastMethod === 'seasonal' ? parseInt(forecastSeasonality) : undefined,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setForecastResult(result)
        toast({
          title: 'Forecast Generated',
          description: `Generated ${forecastPeriods} period forecast using ${forecastMethod} method`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Forecast failed')
      }
    } catch (error: any) {
      toast({
        title: 'Forecast Failed',
        description: error.message || 'Failed to generate forecast',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegression = async () => {
    try {
      const parsedData = JSON.parse(regressionData || '[]')
      if (!Array.isArray(parsedData) || parsedData.length < 2) {
        throw new Error('Invalid data format. Expected array of {x, y} objects')
      }

      setIsLoading(true)
      const response = await fetch('/api/reporting-studio/predictive/regression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: parsedData,
          type: regressionType,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setRegressionResult(result)
        toast({
          title: 'Regression Complete',
          description: `R² = ${(result.rSquared * 100).toFixed(2)}%`,
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Regression failed')
      }
    } catch (error: any) {
      toast({
        title: 'Regression Failed',
        description: error.message || 'Failed to perform regression',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClassification = async () => {
    // This would typically use dataset data
    // For now, show placeholder
    toast({
      title: 'Classification',
      description: 'Classification requires training and test datasets. Feature coming soon.',
    })
  }

  // Prepare chart data for forecast
  const forecastChartData = forecastResult
    ? [
        ...(forecastResult.historical || []).map((d: any) => ({
          date: new Date(d.date).toLocaleDateString(),
          value: d.value,
          type: 'Historical',
        })),
        ...(forecastResult.forecast || []).map((f: any) => ({
          date: new Date(f.date).toLocaleDateString(),
          value: f.forecast,
          lowerBound: f.lowerBound,
          upperBound: f.upperBound,
          type: 'Forecast',
        })),
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Predictive Analytics
        </CardTitle>
        <CardDescription>
          Time series forecasting, regression analysis, and classification models
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="forecast">
              <TrendingUp className="h-4 w-4 mr-2" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="regression">
              <BarChart3 className="h-4 w-4 mr-2" />
              Regression
            </TabsTrigger>
            <TabsTrigger value="classification">
              <Brain className="h-4 w-4 mr-2" />
              Classification
            </TabsTrigger>
          </TabsList>

          {/* Forecasting Tab */}
          <TabsContent value="forecast" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forecast Method</Label>
                <Select value={forecastMethod} onValueChange={setForecastMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear Regression</SelectItem>
                    <SelectItem value="exponential">Exponential Smoothing</SelectItem>
                    <SelectItem value="moving_average">Moving Average</SelectItem>
                    <SelectItem value="seasonal">Seasonal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Forecast Periods</Label>
                <Input
                  type="number"
                  value={forecastPeriods}
                  onChange={(e) => setForecastPeriods(e.target.value)}
                  min="1"
                  max="100"
                />
              </div>
              {forecastMethod === 'seasonal' && (
                <div className="space-y-2">
                  <Label>Seasonality Period</Label>
                  <Input
                    type="number"
                    value={forecastSeasonality}
                    onChange={(e) => setForecastSeasonality(e.target.value)}
                    min="2"
                  />
                </div>
              )}
            </div>

            <Button onClick={handleForecast} disabled={isLoading || !data || data.length < 2}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Forecast...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Generate Forecast
                </>
              )}
            </Button>

            {forecastResult && forecastChartData.length > 0 && (
              <div className="space-y-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecastChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        name="Value"
                        strokeWidth={2}
                      />
                      {forecastChartData.some((d: any) => d.lowerBound) && (
                        <>
                          <Line
                            type="monotone"
                            dataKey="lowerBound"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            name="Lower Bound"
                          />
                          <Line
                            type="monotone"
                            dataKey="upperBound"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                            name="Upper Bound"
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-sm text-muted-foreground">
                  Forecasted {forecastResult.periods} periods using {forecastResult.method} method
                </div>
              </div>
            )}
          </TabsContent>

          {/* Regression Tab */}
          <TabsContent value="regression" className="space-y-4">
            <div className="space-y-2">
              <Label>Regression Type</Label>
              <Select value={regressionType} onValueChange={setRegressionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="polynomial">Polynomial (Degree 2)</SelectItem>
                  <SelectItem value="logistic">Logistic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data (JSON array of {`{x, y}`} objects)</Label>
              <textarea
                className="w-full min-h-32 p-2 border rounded-md font-mono text-sm"
                value={regressionData}
                onChange={(e) => setRegressionData(e.target.value)}
                placeholder='[{"x": 1, "y": 2}, {"x": 2, "y": 4}, ...]'
              />
            </div>

            <Button onClick={handleRegression} disabled={isLoading || !regressionData}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Perform Regression
                </>
              )}
            </Button>

            {regressionResult && (
              <div className="space-y-4 p-4 bg-muted rounded-md">
                <div>
                  <Label className="text-sm font-semibold">Equation:</Label>
                  <p className="text-sm font-mono">{regressionResult.equation}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">R² Score:</Label>
                    <p className="font-semibold">{(regressionResult.rSquared * 100).toFixed(2)}%</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mean Squared Error:</Label>
                    <p className="font-semibold">{regressionResult.mse.toFixed(4)}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mean Absolute Error:</Label>
                    <p className="font-semibold">{regressionResult.mae.toFixed(4)}</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification" className="space-y-4">
            <div className="space-y-2">
              <Label>Classification Model</Label>
              <Select value={classificationModel} onValueChange={setClassificationModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knn">K-Nearest Neighbors</SelectItem>
                  <SelectItem value="decision_tree">Decision Tree</SelectItem>
                  <SelectItem value="naive_bayes">Naive Bayes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {classificationModel === 'knn' && (
              <div className="space-y-2">
                <Label>K Value</Label>
                <Input
                  type="number"
                  value={kValue}
                  onChange={(e) => setKValue(e.target.value)}
                  min="1"
                  max="10"
                />
              </div>
            )}

            <Button onClick={handleClassification} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Training Model...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Train & Test Model
                </>
              )}
            </Button>

            <div className="text-sm text-muted-foreground">
              Classification requires training and test datasets. This feature will be enhanced with dataset integration.
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}


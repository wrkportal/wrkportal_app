"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Loader2, BarChart3 } from "lucide-react"

interface ForecastData {
  currentSpend: number
  projectedSpend: number
  remainingBudget: number
  variancePercentage: number
  status: string
  insights: string[]
  recommendations: string[]
  monthlyBreakdown?: Array<{ month: string; projected: number; actual?: number }>
}

export default function BudgetForecastPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    totalBudget: "",
    currentSpend: "",
    spendHistory: "",
    projectDuration: "",
    completionPercentage: "",
  })
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [isForecasting, setIsForecasting] = useState(false)

  const handleForecast = async () => {
    if (!formData.totalBudget || !formData.currentSpend) {
      alert("Please provide at least total budget and current spend")
      return
    }

    setIsForecasting(true)

    try {
      const response = await fetch("/api/ai/budget/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          totalBudget: parseFloat(formData.totalBudget),
          currentSpend: parseFloat(formData.currentSpend),
          completionPercentage: formData.completionPercentage ? parseFloat(formData.completionPercentage) : undefined,
        }),
      })

      if (!response.ok) throw new Error("Failed to generate forecast")

      const data = await response.json()
      setForecast(data.forecast)
    } catch (err) {
      alert("Failed to generate budget forecast. Please try again.")
      console.error(err)
    } finally {
      setIsForecasting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "over budget":
        return "bg-red-100 text-red-700 border-red-300"
      case "at risk":
        return "bg-orange-100 text-orange-700 border-orange-300"
      case "on track":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              AI Budget Forecasting
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Predict budget outcomes and prevent overruns
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Budget Information
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g., Website Redesign Project"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalBudget">Total Budget (USD) *</Label>
                <Input
                  id="totalBudget"
                  type="number"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                  placeholder="e.g., 100000"
                />
              </div>

              <div>
                <Label htmlFor="currentSpend">Current Spend (USD) *</Label>
                <Input
                  id="currentSpend"
                  type="number"
                  value={formData.currentSpend}
                  onChange={(e) => setFormData({ ...formData, currentSpend: e.target.value })}
                  placeholder="e.g., 45000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectDuration">Project Duration</Label>
                <Input
                  id="projectDuration"
                  value={formData.projectDuration}
                  onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                  placeholder="e.g., 6 months, Jan-Jun 2025"
                />
              </div>

              <div>
                <Label htmlFor="completionPercentage">Completion % (Optional)</Label>
                <Input
                  id="completionPercentage"
                  type="number"
                  value={formData.completionPercentage}
                  onChange={(e) => setFormData({ ...formData, completionPercentage: e.target.value })}
                  placeholder="e.g., 40"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="spendHistory">Spend History (Optional)</Label>
              <Textarea
                id="spendHistory"
                value={formData.spendHistory}
                onChange={(e) => setFormData({ ...formData, spendHistory: e.target.value })}
                placeholder="Provide monthly spending data:&#10;Month 1: $8,000&#10;Month 2: $12,000&#10;Month 3: $15,000&#10;Month 4: $10,000"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 More data = more accurate forecasts
              </p>
            </div>

            <Button
              onClick={handleForecast}
              disabled={isForecasting}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-6 text-lg"
            >
              {isForecasting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Forecast...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Generate Budget Forecast
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Forecast Results */}
        {forecast && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-emerald-600" />
              Budget Forecast
            </h2>

            {/* Status Banner */}
            <div className={`p-4 rounded-lg border-2 mb-6 ${getStatusColor(forecast.status)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Status: {forecast.status}</h3>
                  <p className="text-sm mt-1">
                    Variance: {forecast.variancePercentage > 0 ? '+' : ''}{forecast.variancePercentage}%
                  </p>
                </div>
                {forecast.variancePercentage > 10 ? (
                  <TrendingUp className="h-10 w-10" />
                ) : forecast.variancePercentage < -10 ? (
                  <TrendingDown className="h-10 w-10" />
                ) : (
                  <DollarSign className="h-10 w-10" />
                )}
              </div>
            </div>

            {/* Budget Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-blue-600 font-semibold mb-1">Current Spend</div>
                <div className="text-3xl font-bold text-blue-900">
                  ${forecast.currentSpend.toLocaleString()}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-purple-600 font-semibold mb-1">Projected Total</div>
                <div className="text-3xl font-bold text-purple-900">
                  ${forecast.projectedSpend.toLocaleString()}
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${forecast.remainingBudget >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className={`text-sm font-semibold mb-1 ${forecast.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {forecast.remainingBudget >= 0 ? 'Remaining' : 'Overrun'}
                </div>
                <div className={`text-3xl font-bold ${forecast.remainingBudget >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                  ${Math.abs(forecast.remainingBudget).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {forecast.monthlyBreakdown && forecast.monthlyBreakdown.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">Monthly Projection</h3>
                <div className="space-y-2">
                  {forecast.monthlyBreakdown.map((month, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium text-slate-600">{month.month}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-8 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${(month.projected / (forecast.projectedSpend / forecast.monthlyBreakdown!.length)) * 100}%` }}
                        >
                          <span className="text-xs font-bold text-white">
                            ${month.projected.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {forecast.insights && forecast.insights.length > 0 && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-lg mb-2 text-blue-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Key Insights
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                  {forecast.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {forecast.recommendations && forecast.recommendations.length > 0 && (
              <div className="bg-emerald-50 p-4 rounded-lg border-2 border-emerald-200">
                <h3 className="font-semibold text-lg mb-2 text-emerald-900">💡 Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-emerald-800">
                  {forecast.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Target, TrendingUp, Award, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface OKRAnalysis {
  objectiveName: string
  overallProgress: number
  status: string
  keyResults: Array<{
    description: string
    currentValue: number
    targetValue: number
    progress: number
    status: string
    insights: string
  }>
  recommendations: string[]
  riskFactors: string[]
}

export default function OKRTrackingPage() {
  const [formData, setFormData] = useState({
    objectiveName: "",
    objectiveDescription: "",
    keyResults: "",
    currentMetrics: "",
    timeframe: "",
  })
  const [analysis, setAnalysis] = useState<OKRAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!formData.objectiveName || !formData.keyResults) {
      alert("Please provide objective name and key results")
      return
    }

    setIsAnalyzing(true)

    try {
      const response = await fetch("/api/ai/okr/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to analyze OKRs")

      const data = await response.json()
      setAnalysis(data.analysis)
    } catch (err) {
      alert("Failed to analyze OKRs. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "on track":
      case "achieved":
        return "text-green-600 bg-green-50 border-green-300"
      case "at risk":
        return "text-orange-600 bg-orange-50 border-orange-300"
      case "off track":
      case "behind":
        return "text-red-600 bg-red-50 border-red-300"
      default:
        return "text-slate-600 bg-slate-50 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Smart OKR Tracking
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            AI-powered OKR progress analysis and insights
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-600" />
            OKR Information
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="objectiveName">Objective Name *</Label>
              <Input
                id="objectiveName"
                value={formData.objectiveName}
                onChange={(e) => setFormData({ ...formData, objectiveName: e.target.value })}
                placeholder="e.g., Increase customer satisfaction"
              />
            </div>

            <div>
              <Label htmlFor="objectiveDescription">Objective Description</Label>
              <Textarea
                id="objectiveDescription"
                value={formData.objectiveDescription}
                onChange={(e) => setFormData({ ...formData, objectiveDescription: e.target.value })}
                placeholder="Describe the objective and why it matters..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="keyResults">Key Results *</Label>
              <Textarea
                id="keyResults"
                value={formData.keyResults}
                onChange={(e) => setFormData({ ...formData, keyResults: e.target.value })}
                placeholder="List your key results (one per line):&#10;KR1: Increase NPS score from 45 to 70&#10;KR2: Reduce support ticket response time from 24h to 2h&#10;KR3: Achieve 90% customer retention rate"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="currentMetrics">Current Progress/Metrics</Label>
              <Textarea
                id="currentMetrics"
                value={formData.currentMetrics}
                onChange={(e) => setFormData({ ...formData, currentMetrics: e.target.value })}
                placeholder="Provide current metrics:&#10;- Current NPS: 58&#10;- Current response time: 8 hours&#10;- Current retention: 82%"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Include current values for each key result
              </p>
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Input
                id="timeframe"
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                placeholder="e.g., Q4 2025, Jan-Mar 2026"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-6 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing OKRs...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Analyze OKR Progress
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-6">{analysis.objectiveName}</h2>

            {/* Overall Progress */}
            <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-lg border-2 border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Overall Progress</h3>
                <span className={`px-4 py-2 rounded-full font-bold border-2 ${getStatusColor(analysis.status)}`}>
                  {analysis.status}
                </span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-slate-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full flex items-center justify-center transition-all duration-500"
                    style={{ width: `${analysis.overallProgress}%` }}
                  >
                    <span className="text-xs font-bold text-white">
                      {analysis.overallProgress}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Results */}
            <div className="space-y-4 mb-6">
              <h3 className="font-semibold text-lg">Key Results Progress</h3>
              
              {analysis.keyResults.map((kr, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-amber-600">KR{idx + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(kr.status)}`}>
                          {kr.status}
                        </span>
                      </div>
                      <p className="text-slate-800 font-medium mb-2">{kr.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-amber-600">{kr.progress}%</div>
                      <div className="text-xs text-slate-500">
                        {kr.currentValue} / {kr.targetValue}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-full rounded-full ${
                        kr.progress >= 70 ? 'bg-green-500' :
                        kr.progress >= 40 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${kr.progress}%` }}
                    />
                  </div>

                  {kr.insights && (
                    <div className="mt-2 text-sm text-slate-600 bg-white p-2 rounded border border-slate-200">
                      💡 {kr.insights}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Risk Factors */}
            {analysis.riskFactors && analysis.riskFactors.length > 0 && (
              <div className="mb-6 bg-red-50 p-4 rounded-lg border-2 border-red-200">
                <h3 className="font-semibold text-lg mb-2 text-red-900 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Risk Factors
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                  {analysis.riskFactors.map((risk, idx) => (
                    <li key={idx}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <h3 className="font-semibold text-lg mb-2 text-green-900 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Recommendations
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-green-800">
                  {analysis.recommendations.map((rec, idx) => (
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


"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, TrendingUp, Shield, Loader2, AlertCircle } from "lucide-react"

export default function RiskPredictorPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    description: "",
    budget: "",
    duration: "",
    teamSize: "",
    complexity: "medium",
  })
  const [risks, setRisks] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!formData.projectName || !formData.description) {
      setError("Please provide project name and description")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const response = await fetch("/api/ai/risk/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectDescription: formData.description,
          budget: formData.budget ? parseFloat(formData.budget) : undefined,
          duration: formData.duration,
          teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
          complexity: formData.complexity,
        }),
      })

      if (!response.ok) throw new Error("Failed to analyze risks")

      const data = await response.json()
      setRisks(data.risks)
    } catch (err) {
      setError("Failed to analyze project risks. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Smart Risk Predictor
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            AI-powered risk analysis for your projects
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Project Information
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g., E-commerce Platform Redesign"
              />
            </div>

            <div>
              <Label htmlFor="description">Project Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your project goals, scope, technology stack, and any concerns..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budget">Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="e.g., 100000"
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 6 months"
                />
              </div>

              <div>
                <Label htmlFor="teamSize">Team Size</Label>
                <Input
                  id="teamSize"
                  type="number"
                  value={formData.teamSize}
                  onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                  placeholder="e.g., 8"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="complexity">Project Complexity</Label>
              <select
                id="complexity"
                value={formData.complexity}
                onChange={(e) => setFormData({ ...formData, complexity: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="low">Low - Simple, well-defined project</option>
                <option value="medium">Medium - Standard complexity</option>
                <option value="high">High - Complex, many dependencies</option>
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-6 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing Risks...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Analyze Project Risks
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {risks && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              Risk Analysis Results
            </h2>

            <div className="space-y-4">
              {/* Overall Assessment */}
              <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                <h3 className="font-semibold text-lg mb-2">Overall Risk Assessment</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-2 rounded-full font-semibold border-2 ${getRiskColor(risks.overallRiskLevel)}`}>
                    {risks.overallRiskLevel?.toUpperCase()} RISK
                  </span>
                  <span className="text-slate-600">Confidence: {risks.confidenceScore}%</span>
                </div>
              </div>

              {/* Individual Risks */}
              {risks.identifiedRisks?.map((risk: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-lg border-2 ${getRiskColor(risk.severity)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{risk.title}</h4>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getRiskColor(risk.severity)}`}>
                        {risk.category} • {risk.severity} Risk • {risk.probability}% Probability
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">Impact</div>
                      <div className={`text-2xl font-bold ${getRiskColor(risk.severity).split(' ')[0]}`}>
                        {risk.impact}/10
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm mb-3 mt-2">{risk.description}</p>

                  <div className="space-y-2">
                    <div>
                      <h5 className="text-sm font-semibold mb-1">Mitigation Strategy:</h5>
                      <p className="text-sm bg-white/50 p-2 rounded">{risk.mitigation}</p>
                    </div>
                    
                    {risk.contingencyPlan && (
                      <div>
                        <h5 className="text-sm font-semibold mb-1">Contingency Plan:</h5>
                        <p className="text-sm bg-white/50 p-2 rounded">{risk.contingencyPlan}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Recommendations */}
              {risks.recommendations?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <h3 className="font-semibold text-lg mb-2 text-blue-900">💡 Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    {risks.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertOctagon, Activity, TrendingUp, Loader2, CheckCircle, AlertTriangle } from "lucide-react"

interface Anomaly {
  type: string
  severity: string
  description: string
  detectedAt: string
  affectedArea: string
  potentialImpact: string
  suggestedAction: string
}

export default function AnomalyDetectionPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    dataType: "general",
    recentActivity: "",
    baselineMetrics: "",
    timeRange: "",
  })
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])
  const [summary, setSummary] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async () => {
    if (!formData.recentActivity) {
      alert("Please provide recent activity data")
      return
    }

    setIsScanning(true)

    try {
      const response = await fetch("/api/ai/anomaly/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to detect anomalies")

      const data = await response.json()
      setAnomalies(data.anomalies || [])
      setSummary(data.summary || "")
    } catch (err) {
      alert("Failed to scan for anomalies. Please try again.")
      console.error(err)
    } finally {
      setIsScanning(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "text-red-700 bg-red-100 border-red-300"
      case "high":
        return "text-orange-700 bg-orange-100 border-orange-300"
      case "medium":
        return "text-yellow-700 bg-yellow-100 border-yellow-300"
      case "low":
        return "text-blue-700 bg-blue-100 border-blue-300"
      default:
        return "text-slate-700 bg-slate-100 border-slate-300"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return <AlertOctagon className="h-5 w-5" />
      case "medium":
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl">
              <AlertOctagon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
              Anomaly Detection
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            AI-powered detection of unusual patterns and issues
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-rose-600" />
            Project Data
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g., E-commerce Platform"
              />
            </div>

            <div>
              <Label htmlFor="dataType">Data Type</Label>
              <select
                id="dataType"
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-rose-500"
              >
                <option value="general">General Project Data</option>
                <option value="budget">Budget & Financial</option>
                <option value="timeline">Timeline & Schedule</option>
                <option value="performance">Performance Metrics</option>
                <option value="team">Team Activity</option>
              </select>
            </div>

            <div>
              <Label htmlFor="recentActivity">Recent Activity/Data *</Label>
              <Textarea
                id="recentActivity"
                value={formData.recentActivity}
                onChange={(e) => setFormData({ ...formData, recentActivity: e.target.value })}
                placeholder="Provide recent project data:&#10;- Budget spent increased 30% this week&#10;- Task completion rate dropped from 85% to 60%&#10;- 3 team members marked unavailable&#10;- API response times increased by 200ms&#10;- 15 new critical bugs reported"
                rows={8}
              />
            </div>

            <div>
              <Label htmlFor="baselineMetrics">Baseline/Normal Metrics (Optional)</Label>
              <Textarea
                id="baselineMetrics"
                value={formData.baselineMetrics}
                onChange={(e) => setFormData({ ...formData, baselineMetrics: e.target.value })}
                placeholder="Provide normal/expected values:&#10;- Normal weekly spend: $8,000&#10;- Typical task completion: 80-90%&#10;- Average API response: 150ms"
                rows={4}
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Helps AI identify what's truly abnormal
              </p>
            </div>

            <div>
              <Label htmlFor="timeRange">Time Range</Label>
              <Input
                id="timeRange"
                value={formData.timeRange}
                onChange={(e) => setFormData({ ...formData, timeRange: e.target.value })}
                placeholder="e.g., Last 7 days, October 2025"
              />
            </div>

            <Button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white py-6 text-lg"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Scanning for Anomalies...
                </>
              ) : (
                <>
                  <AlertOctagon className="mr-2 h-5 w-5" />
                  Detect Anomalies
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {(summary || anomalies.length > 0) && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Activity className="h-6 w-6 text-rose-600" />
              Scan Results
            </h2>

            {/* Summary */}
            {summary && (
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">📊 Summary</h3>
                <p className="text-sm text-blue-800">{summary}</p>
              </div>
            )}

            {/* Anomalies */}
            {anomalies.length > 0 ? (
              <div className="space-y-4">
                {anomalies.map((anomaly, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-lg border-2 ${getSeverityColor(anomaly.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(anomaly.severity)}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getSeverityColor(anomaly.severity)}`}>
                          {anomaly.severity} SEVERITY
                        </span>
                        <span className="px-3 py-1 bg-white/50 rounded-full text-xs font-semibold">
                          {anomaly.type}
                        </span>
                      </div>
                      <span className="text-xs font-medium">{anomaly.detectedAt}</span>
                    </div>

                    <h3 className="font-bold text-lg mb-2">{anomaly.affectedArea}</h3>
                    <p className="text-sm mb-3">{anomaly.description}</p>

                    <div className="space-y-2">
                      <div className="bg-white/50 p-3 rounded border">
                        <h4 className="text-sm font-semibold mb-1">⚠️ Potential Impact:</h4>
                        <p className="text-sm">{anomaly.potentialImpact}</p>
                      </div>

                      <div className="bg-white/50 p-3 rounded border">
                        <h4 className="text-sm font-semibold mb-1">✅ Suggested Action:</h4>
                        <p className="text-sm">{anomaly.suggestedAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">
                  No Anomalies Detected
                </h3>
                <p className="text-slate-500">
                  All metrics appear normal for the given period
                </p>
              </div>
            )}

            {anomalies.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Total Anomalies: </span>
                    <span className="text-2xl font-bold text-rose-600">{anomalies.length}</span>
                  </div>
                  <div className="flex gap-3 text-sm">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                      {anomalies.filter(a => a.severity?.toLowerCase() === 'critical').length} Critical
                    </span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-semibold">
                      {anomalies.filter(a => a.severity?.toLowerCase() === 'high').length} High
                    </span>
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                      {anomalies.filter(a => a.severity?.toLowerCase() === 'medium').length} Medium
                    </span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}


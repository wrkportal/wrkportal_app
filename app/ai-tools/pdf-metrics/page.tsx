"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FileText, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"

type MetricResult = {
  name: string
  value?: string
  unit?: string
  context?: string
}

type ConditionResult = {
  condition: string
  matched: boolean
  evidence?: string
}

type ExposureResult = {
  state: string
  exposure: number | string
  unit?: string
  evidence?: string
}

type PdfMetricsResult = {
  summary: string
  metrics: MetricResult[]
  conditions: ConditionResult[]
  exposures: ExposureResult[]
}

export default function PdfMetricsToolPage() {
  const [file, setFile] = useState<File | null>(null)
  const [metrics, setMetrics] = useState("Exposure, Loss, Limit, Deductible")
  const [conditions, setConditions] = useState(
    "Flag if exposure > 2000 for CA state"
  )
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<PdfMetricsResult | null>(null)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a PDF.")
      return
    }

    setIsAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("metrics", metrics)
      formData.append("conditions", conditions)

      const response = await fetch("/api/ai/pdf-metrics/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to analyze PDF")
      }

      const data = await response.json()
      setResult(data.result)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to analyze PDF. Please try again.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              PDF Metrics Analyzer
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Upload a PDF, specify the metrics you care about, and let AI summarize the results.
          </p>
        </div>

        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-indigo-600" />
            Inputs
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="pdfFile">PDF File *</Label>
              <Input
                id="pdfFile"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label htmlFor="metrics">Metrics to Summarize</Label>
              <Textarea
                id="metrics"
                rows={2}
                value={metrics}
                onChange={(e) => setMetrics(e.target.value)}
                placeholder="Exposure, Loss, Limit, Deductible"
              />
            </div>

            <div>
              <Label htmlFor="conditions">Conditions / Checks</Label>
              <Textarea
                id="conditions"
                rows={2}
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                placeholder="Flag if exposure > 2000 for CA state"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white py-6 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing PDF...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Analyze PDF
                </>
              )}
            </Button>
          </div>
        </Card>

        {result && (
          <Card className="p-6 shadow-xl border-2 border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h2 className="text-2xl font-bold">Results</h2>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-sm text-slate-700">{result.summary}</p>
            </div>

            {result.metrics?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Metrics</h3>
                <div className="space-y-2">
                  {result.metrics.map((metric, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium">{metric.name}:</span>{" "}
                      {metric.value || "N/A"} {metric.unit || ""}
                      {metric.context ? (
                        <span className="text-slate-500"> — {metric.context}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.conditions?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Condition Checks</h3>
                <div className="space-y-2">
                  {result.conditions.map((check, idx) => (
                    <div key={idx} className="text-sm">
                      <span className={check.matched ? "text-red-600" : "text-green-600"}>
                        {check.matched ? "⚠" : "✓"}
                      </span>{" "}
                      {check.condition}
                      {check.evidence ? (
                        <span className="text-slate-500"> — {check.evidence}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.exposures?.length > 0 && (
              <div className="bg-white p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Exposures by State</h3>
                <div className="space-y-2 text-sm">
                  {result.exposures.map((exposure, idx) => (
                    <div key={idx}>
                      <span className="font-medium">{exposure.state}:</span>{" "}
                      {exposure.exposure} {exposure.unit || ""}
                      {exposure.evidence ? (
                        <span className="text-slate-500"> — {exposure.evidence}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}

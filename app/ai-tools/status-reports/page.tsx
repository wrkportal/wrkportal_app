"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, Copy, Check, Loader2, Sparkles } from "lucide-react"

export default function StatusReportsPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    reportingPeriod: "",
    accomplishments: "",
    challenges: "",
    upcomingWork: "",
    teamMembers: "",
  })
  const [report, setReport] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!formData.projectName) {
      alert("Please provide project name")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/ai/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to generate report")

      const data = await response.json()
      setReport(data.report)
    } catch (err) {
      alert("Failed to generate status report. Please try again.")
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([report], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${formData.projectName.replace(/\s+/g, "_")}_Status_Report.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Auto Status Reports
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Generate professional status reports in seconds
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            Report Details
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g., Q4 Marketing Campaign"
                />
              </div>

              <div>
                <Label htmlFor="reportingPeriod">Reporting Period</Label>
                <Input
                  id="reportingPeriod"
                  value={formData.reportingPeriod}
                  onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                  placeholder="e.g., October 1-31, 2025"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accomplishments">Key Accomplishments</Label>
              <Textarea
                id="accomplishments"
                value={formData.accomplishments}
                onChange={(e) => setFormData({ ...formData, accomplishments: e.target.value })}
                placeholder="What was completed this period? (e.g., Launched landing page, Completed user testing, Hit 1000 signups)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="challenges">Challenges & Blockers</Label>
              <Textarea
                id="challenges"
                value={formData.challenges}
                onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
                placeholder="Any issues or obstacles? (e.g., Budget approval delayed, Resource constraints)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="upcomingWork">Upcoming Work</Label>
              <Textarea
                id="upcomingWork"
                value={formData.upcomingWork}
                onChange={(e) => setFormData({ ...formData, upcomingWork: e.target.value })}
                placeholder="What's planned for next period? (e.g., Email campaign launch, A/B testing)"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="teamMembers">Team Members (Optional)</Label>
              <Input
                id="teamMembers"
                value={formData.teamMembers}
                onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                placeholder="e.g., John (PM), Sarah (Designer), Mike (Dev)"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-6 text-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Status Report
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Report */}
        {report && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Generated Report</h2>
              <div className="flex gap-2">
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border-2 border-slate-200 whitespace-pre-wrap font-mono text-sm">
              {report}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


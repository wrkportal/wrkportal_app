"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, ListTodo, Loader2, Copy, Check, Calendar, User } from "lucide-react"

interface ActionItem {
  task: string
  assignee: string
  dueDate: string
  priority: string
  category: string
}

export default function MeetingNotesPage() {
  const [formData, setFormData] = useState({
    meetingTitle: "",
    meetingDate: "",
    attendees: "",
    notes: "",
  })
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [summary, setSummary] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleProcess = async () => {
    if (!formData.notes) {
      alert("Please provide meeting notes")
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch("/api/ai/meetings/extract-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to process notes")

      const data = await response.json()
      setActionItems(data.actionItems || [])
      setSummary(data.summary || "")
    } catch (err) {
      alert("Failed to extract action items. Please try again.")
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCopyAll = () => {
    const text = `Meeting Summary:\n${summary}\n\nAction Items:\n${actionItems.map((item, idx) => 
      `${idx + 1}. ${item.task}\n   Assignee: ${item.assignee}\n   Due: ${item.dueDate}\n   Priority: ${item.priority}`
    ).join('\n\n')}`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border-red-300"
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "low":
        return "bg-green-100 text-green-700 border-green-300"
      default:
        return "bg-slate-100 text-slate-700 border-slate-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-xl">
              <MessageSquare className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Meeting Notes → Action Items
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Transform meeting notes into actionable tasks instantly
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-teal-600" />
            Meeting Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="meetingTitle">Meeting Title</Label>
                <Input
                  id="meetingTitle"
                  value={formData.meetingTitle}
                  onChange={(e) => setFormData({ ...formData, meetingTitle: e.target.value })}
                  placeholder="e.g., Q4 Planning Meeting"
                />
              </div>

              <div>
                <Label htmlFor="meetingDate">Meeting Date</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  value={formData.meetingDate}
                  onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="attendees">Attendees (Optional)</Label>
              <Input
                id="attendees"
                value={formData.attendees}
                onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                placeholder="e.g., John Smith, Sarah Lee, Mike Chen"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Helps AI identify who was assigned tasks
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Meeting Notes *</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Paste your meeting notes here...&#10;&#10;Example:&#10;- Discussed Q4 goals&#10;- John will prepare budget proposal by Friday&#10;- Sarah to finalize design mockups this week&#10;- Need to schedule follow-up with marketing team"
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleProcess}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white py-6 text-lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Notes...
                </>
              ) : (
                <>
                  <ListTodo className="mr-2 h-5 w-5" />
                  Extract Action Items
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {(summary || actionItems.length > 0) && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Extracted Action Items</h2>
              <Button onClick={handleCopyAll} variant="outline" size="sm">
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy All
                  </>
                )}
              </Button>
            </div>

            {/* Summary */}
            {summary && (
              <div className="mb-6 bg-teal-50 p-4 rounded-lg border-2 border-teal-200">
                <h3 className="font-semibold text-teal-900 mb-2">📝 Meeting Summary</h3>
                <p className="text-sm text-teal-800">{summary}</p>
              </div>
            )}

            {/* Action Items */}
            <div className="space-y-4">
              {actionItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold text-teal-600">#{idx + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                        {item.category && (
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                            {item.category}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-800 font-medium mb-3">{item.task}</p>
                      
                      <div className="flex flex-wrap gap-3 text-sm">
                        <div className="flex items-center gap-1 text-slate-600">
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{item.assignee}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="h-4 w-4" />
                          <span>{item.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-1">✅ Total Action Items</h3>
              <p className="text-sm text-blue-800">
                {actionItems.length} tasks identified • {actionItems.filter(i => i.priority?.toLowerCase() === 'high').length} high priority
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


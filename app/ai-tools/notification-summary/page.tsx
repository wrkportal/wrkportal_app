"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Bell, Sparkles, Loader2, Copy, Check, Filter } from "lucide-react"

interface Summary {
  overview: string
  priorityActions: Array<{
    priority: string
    action: string
    from: string
  }>
  keyUpdates: string[]
  canWait: string[]
}

export default function NotificationSummaryPage() {
  const [notifications, setNotifications] = useState("")
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleSummarize = async () => {
    if (!notifications.trim()) {
      alert("Please paste your notifications")
      return
    }

    // Prevent multiple simultaneous requests
    if (isSummarizing) {
      return
    }

    setIsSummarizing(true)

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch("/api/ai/notifications/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifications }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize")
      }

      // Validate response structure
      if (!data.summary) {
        throw new Error("Invalid response format")
      }

      setSummary(data.summary)
    } catch (err: any) {
      console.error('Summarization error:', err)
      
      if (err.name === 'AbortError') {
        alert("Request timed out. Please try again with shorter text or check your connection.")
      } else {
        alert(err.message || "Failed to summarize notifications. Please try again.")
      }
    } finally {
      setIsSummarizing(false)
    }
  }

  const handleCopy = () => {
    if (!summary) return
    
    const text = `Notification Summary:\n\n${summary.overview}\n\nPriority Actions:\n${summary.priorityActions.map(a => `- [${a.priority}] ${a.action} (from ${a.from})`).join('\n')}\n\nKey Updates:\n${summary.keyUpdates.map(u => `- ${u}`).join('\n')}\n\nCan Wait:\n${summary.canWait.map(c => `- ${c}`).join('\n')}`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl">
              <Bell className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              Smart Notification Summaries
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            Turn notification overload into actionable insights
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Filter className="h-5 w-5 text-violet-600" />
            Your Notifications
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notifications">Paste Notifications *</Label>
              <Textarea
                id="notifications"
                value={notifications}
                onChange={(e) => setNotifications(e.target.value)}
                placeholder="Paste all your notifications here...&#10;&#10;Examples:&#10;- Sarah commented on Task #123: 'Need your review ASAP'&#10;- Budget alert: Project X exceeded 90% of budget&#10;- Mike mentioned you in Project Alpha discussion&#10;- New task assigned: Update documentation&#10;- Reminder: Team standup in 15 minutes&#10;- John approved your timesheet&#10;- Weekly report is now available"
                rows={15}
                className="font-mono text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Paste from email, Slack, Teams, or any notification source
              </p>
            </div>

            <Button
              onClick={handleSummarize}
              disabled={isSummarizing || !notifications.trim()}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSummarizing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Summarizing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Summarize Notifications
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Summary Results */}
        {summary && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Smart Summary</h2>
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
            </div>

            {/* Overview */}
            <div className="mb-6 bg-gradient-to-r from-violet-50 to-purple-50 p-4 rounded-lg border-2 border-violet-200">
              <h3 className="font-semibold text-violet-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Overview
              </h3>
              <p className="text-sm text-violet-800">{summary.overview}</p>
            </div>

            {/* Priority Actions */}
            {summary.priorityActions && summary.priorityActions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  🔥 Priority Actions
                </h3>
                <div className="space-y-3">
                  {summary.priorityActions.map((action, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border-2 ${getPriorityColor(action.priority)}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getPriorityColor(action.priority)}`}>
                          {action.priority}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium mb-1">{action.action}</p>
                          <p className="text-xs opacity-75">From: {action.from}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Updates */}
            {summary.keyUpdates && summary.keyUpdates.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-lg mb-3">📬 Key Updates</h3>
                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                  <ul className="list-disc list-inside space-y-2 text-sm text-blue-900">
                    {summary.keyUpdates.map((update, idx) => (
                      <li key={idx}>{update}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Can Wait */}
            {summary.canWait && summary.canWait.length > 0 && (
              <div>
                <h3 className="font-semibold text-lg mb-3">⏰ Can Wait</h3>
                <div className="bg-slate-50 p-4 rounded-lg border-2 border-slate-200">
                  <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
                    {summary.canWait.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 pt-6 border-t-2 border-slate-200 flex justify-between items-center text-sm text-slate-600">
              <span>
                {summary.priorityActions.length} priority action{summary.priorityActions.length !== 1 ? 's' : ''} • {' '}
                {summary.keyUpdates.length} key update{summary.keyUpdates.length !== 1 ? 's' : ''} • {' '}
                {summary.canWait.length} can wait
              </span>
              <span className="text-violet-600 font-semibold">
                ✨ AI-Powered Summary
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


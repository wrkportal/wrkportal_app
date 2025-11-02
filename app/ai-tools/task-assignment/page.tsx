"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Users, Target, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface Assignment {
  taskName: string
  assignedTo: string
  reasoning: string
  estimatedEffort: string
  priority: string
}

export default function TaskAssignmentPage() {
  const [formData, setFormData] = useState({
    projectName: "",
    tasks: "",
    teamMembers: "",
    skillsAndExpertise: "",
  })
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState("")

  const handleAssign = async () => {
    if (!formData.tasks || !formData.teamMembers) {
      setError("Please provide both tasks and team members")
      return
    }

    setIsAnalyzing(true)
    setError("")

    try {
      const response = await fetch("/api/ai/tasks/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to assign tasks")

      const data = await response.json()
      setAssignments(data.assignments || [])
    } catch (err) {
      setError("Failed to generate task assignments. Please try again.")
      console.error(err)
    } finally {
      setIsAnalyzing(false)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Intelligent Task Assignment
            </h1>
          </div>
          <p className="text-slate-600 text-lg">
            AI-powered task allocation based on skills and workload
          </p>
        </div>

        {/* Input Form */}
        <Card className="p-6 shadow-xl border-2 border-slate-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Assignment Details
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="e.g., Mobile App Development"
              />
            </div>

            <div>
              <Label htmlFor="tasks">Tasks to Assign *</Label>
              <Textarea
                id="tasks"
                value={formData.tasks}
                onChange={(e) => setFormData({ ...formData, tasks: e.target.value })}
                placeholder="List tasks to assign (one per line):&#10;- Design user interface mockups&#10;- Implement REST API endpoints&#10;- Write unit tests&#10;- Create database schema"
                rows={6}
              />
              <p className="text-xs text-slate-500 mt-1">
                💡 Tip: Include task details for better assignment suggestions
              </p>
            </div>

            <div>
              <Label htmlFor="teamMembers">Team Members *</Label>
              <Textarea
                id="teamMembers"
                value={formData.teamMembers}
                onChange={(e) => setFormData({ ...formData, teamMembers: e.target.value })}
                placeholder="List team members (one per line):&#10;- Sarah Chen&#10;- Mike Rodriguez&#10;- Emily Johnson"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="skillsAndExpertise">Skills & Expertise (Optional)</Label>
              <Textarea
                id="skillsAndExpertise"
                value={formData.skillsAndExpertise}
                onChange={(e) => setFormData({ ...formData, skillsAndExpertise: e.target.value })}
                placeholder="Describe each member's skills:&#10;- Sarah: UI/UX expert, Figma, React&#10;- Mike: Backend dev, Node.js, PostgreSQL&#10;- Emily: QA engineer, automated testing"
                rows={4}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              onClick={handleAssign}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6 text-lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Analyzing & Assigning...
                </>
              ) : (
                <>
                  <Users className="mr-2 h-5 w-5" />
                  Generate Task Assignments
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Assignments */}
        {assignments.length > 0 && (
          <Card className="p-6 shadow-xl border-2 border-slate-200">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-purple-600" />
              Recommended Task Assignments
            </h2>

            <div className="space-y-4">
              {assignments.map((assignment, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {assignment.taskName}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                          👤 {assignment.assignedTo}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(assignment.priority)}`}>
                          {assignment.priority} Priority
                        </div>
                      </div>
                    </div>
                    {assignment.estimatedEffort && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Estimated Effort</div>
                        <div className="text-lg font-bold text-purple-600">
                          {assignment.estimatedEffort}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/50 p-3 rounded border border-purple-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      💡 Why this assignment:
                    </h4>
                    <p className="text-sm text-slate-600">{assignment.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Summary</h3>
              <p className="text-sm text-blue-800">
                {assignments.length} tasks assigned across {new Set(assignments.map(a => a.assignedTo)).size} team members
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}


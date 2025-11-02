'use client'

import { useState } from 'react'
import { FileText, Loader2, Download, Copy, Check, Edit2, Save, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CharterGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [charter, setCharter] = useState<any>(null)
  const [editableCharter, setEditableCharter] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    projectName: '',
    projectDescription: '',
    businessCase: '',
    estimatedBudget: '',
    estimatedDuration: '',
    detailLevel: 'balanced',
    laborBudget: '',
    materialsBudget: '',
    equipmentBudget: '',
    contingencyBudget: '',
    milestone1: '',
    milestone2: '',
    milestone3: '',
    knownStakeholders: '',
    keyConstraints: '',
  })

  const handleGenerate = async () => {
    if (!formData.projectName) return

    setIsGenerating(true)
    setIsEditing(false)
    try {
      // Build detailed input with budget breakdown if provided
      const budgetBreakdown = []
      if (formData.laborBudget) budgetBreakdown.push(`Labor: $${formData.laborBudget}`)
      if (formData.materialsBudget) budgetBreakdown.push(`Materials: $${formData.materialsBudget}`)
      if (formData.equipmentBudget) budgetBreakdown.push(`Equipment: $${formData.equipmentBudget}`)
      if (formData.contingencyBudget) budgetBreakdown.push(`Contingency: $${formData.contingencyBudget}`)

      const milestones = []
      if (formData.milestone1) milestones.push(formData.milestone1)
      if (formData.milestone2) milestones.push(formData.milestone2)
      if (formData.milestone3) milestones.push(formData.milestone3)

      const enhancedDescription = `
${formData.projectDescription}

${budgetBreakdown.length > 0 ? `\n**Budget Breakdown:**\n${budgetBreakdown.join('\n')}` : ''}
${milestones.length > 0 ? `\n**Key Milestones:**\n${milestones.join('\n')}` : ''}
${formData.knownStakeholders ? `\n**Known Stakeholders:** ${formData.knownStakeholders}` : ''}
${formData.keyConstraints ? `\n**Constraints:** ${formData.keyConstraints}` : ''}
      `.trim()

      const response = await fetch('/api/ai/charter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectDescription: enhancedDescription,
          businessCase: formData.businessCase,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
          estimatedDuration: formData.estimatedDuration,
          detailLevel: formData.detailLevel,
        }),
      })

      const data = await response.json()
      setCharter(data.charter)
      setEditableCharter(JSON.parse(JSON.stringify(data.charter))) // Deep copy
    } catch (error) {
      console.error('Charter generation error:', error)
      alert('Failed to generate charter. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleUseAIVersion = () => {
    setEditableCharter(JSON.parse(JSON.stringify(charter)))
    setIsEditing(false)
    alert('Using AI version!')
  }

  const handleEditCharter = () => {
    setIsEditing(true)
  }

  const handleSaveEdits = () => {
    setCharter(JSON.parse(JSON.stringify(editableCharter)))
    setIsEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    alert('Charter saved!')
  }

  const handleRefineCharter = async () => {
    const feedback = prompt('What would you like to change in the charter?\n\nExample: "Increase labor budget to $35,000" or "Add a milestone for user testing in Month 2"')
    
    if (!feedback) return

    setIsGenerating(true)
    try {
      // For now, regenerate with feedback in description
      const enhancedDescription = `${formData.projectDescription}\n\nREFINEMENT REQUEST: ${feedback}`
      
      const response = await fetch('/api/ai/charter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: formData.projectName,
          projectDescription: enhancedDescription,
          businessCase: formData.businessCase,
          estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
          estimatedDuration: formData.estimatedDuration,
        }),
      })

      const data = await response.json()
      setCharter(data.charter)
      setEditableCharter(JSON.parse(JSON.stringify(data.charter)))
    } catch (error) {
      console.error('Charter refinement error:', error)
      alert('Failed to refine charter. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleExportPDF = () => {
    if (!charter) return

    // Create a printable version
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF')
      return
    }

    const charterHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${charter.title} - Project Charter</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 40px; 
            line-height: 1.6;
            color: #333;
          }
          h1 { 
            color: #6366f1; 
            border-bottom: 3px solid #6366f1;
            padding-bottom: 10px;
          }
          h2 { 
            color: #4f46e5; 
            margin-top: 30px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          h3 { color: #6366f1; margin-top: 20px; }
          ul { margin: 10px 0; padding-left: 25px; }
          li { margin: 5px 0; }
          .section { margin-bottom: 25px; }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 15px 0; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 10px; 
            text-align: left; 
          }
          th { background-color: #f3f4f6; }
          .stakeholder { 
            background: #f9fafb; 
            padding: 10px; 
            margin: 10px 0; 
            border-left: 3px solid #6366f1;
          }
          @media print {
            body { padding: 20px; }
            h1 { page-break-before: avoid; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>PROJECT CHARTER: ${charter.title}</h1>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <p>${charter.executiveSummary}</p>
        </div>

        <div class="section">
          <h2>Background</h2>
          <p>${charter.background}</p>
        </div>

        <div class="section">
          <h2>Project Objectives</h2>
          <ul>
            ${charter.objectives.map((obj: string) => `<li>${obj}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Success Criteria</h2>
          <ul>
            ${charter.successCriteria.map((criteria: string) => `<li>${criteria}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Scope</h2>
          <h3>In-Scope</h3>
          <ul>
            ${charter.scopeInScope.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
          <h3>Out-of-Scope</h3>
          <ul>
            ${charter.scopeOutOfScope.map((item: string) => `<li>${item}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Key Stakeholders</h2>
          ${charter.stakeholders.map((s: any) => `
            <div class="stakeholder">
              <strong>${s.name}</strong> - ${s.role}<br>
              <em>Responsibilities:</em> ${s.responsibilities}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>Major Deliverables</h2>
          <ul>
            ${charter.deliverables.map((d: string) => `<li>${d}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>High-Level Risks</h2>
          <ul>
            ${charter.risks.map((r: string) => `<li>${r}</li>`).join('')}
          </ul>
        </div>

        <div class="section">
          <h2>Budget Estimate</h2>
          <p><strong>Total Budget:</strong> $${charter.budgetEstimate.total.toLocaleString()} ${charter.budgetEstimate.currency}</p>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${charter.budgetEstimate.breakdown.map((item: any) => `
                <tr>
                  <td>${item.category}</td>
                  <td>$${item.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Timeline</h2>
          <p><strong>Start Date:</strong> ${new Date(charter.timeline.startDate).toLocaleDateString()}</p>
          <p><strong>End Date:</strong> ${new Date(charter.timeline.endDate).toLocaleDateString()}</p>
          <h3>Key Milestones</h3>
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${charter.timeline.milestones.map((m: any) => `
                <tr>
                  <td>${m.name}</td>
                  <td>${new Date(m.date).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Approvals</h2>
          <table>
            <thead>
              <tr>
                <th>Stakeholder</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${charter.approvals.map((a: any) => `
                <tr>
                  <td>${a.stakeholder}</td>
                  <td>${a.role}</td>
                  <td>${a.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <hr style="margin: 30px 0;">
        <p style="text-align: center; color: #6b7280; font-size: 12px;">
          Generated on ${new Date().toLocaleDateString()} | Project Management AI
        </p>
      </body>
      </html>
    `

    printWindow.document.write(charterHTML)
    printWindow.document.close()
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const handleCopy = () => {
    if (!charter) return
    
    const text = `
PROJECT CHARTER: ${charter.title}

EXECUTIVE SUMMARY
${charter.executiveSummary}

BACKGROUND
${charter.background}

OBJECTIVES
${charter.objectives.map((o: string, i: number) => `${i + 1}. ${o}`).join('\n')}

SUCCESS CRITERIA
${charter.successCriteria.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}

SCOPE (IN-SCOPE)
${charter.scopeInScope.map((s: string) => `• ${s}`).join('\n')}

SCOPE (OUT-OF-SCOPE)
${charter.scopeOutOfScope.map((s: string) => `• ${s}`).join('\n')}

KEY STAKEHOLDERS
${charter.stakeholders.map((s: any) => `${s.name} - ${s.role}\n  ${s.responsibilities}`).join('\n\n')}

DELIVERABLES
${charter.deliverables.map((d: string, i: number) => `${i + 1}. ${d}`).join('\n')}

RISKS
${charter.risks.map((r: string) => `• ${r}`).join('\n')}

BUDGET ESTIMATE
Total: $${charter.budgetEstimate.total.toLocaleString()} ${charter.budgetEstimate.currency}
${charter.budgetEstimate.breakdown.map((b: any) => `• ${b.category}: $${b.amount.toLocaleString()}`).join('\n')}

TIMELINE
Start: ${new Date(charter.timeline.startDate).toLocaleDateString()}
End: ${new Date(charter.timeline.endDate).toLocaleDateString()}

MILESTONES
${charter.timeline.milestones.map((m: any) => `• ${m.name} - ${new Date(m.date).toLocaleDateString()}`).join('\n')}
`
    
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">AI Project Charter Generator</h1>
            <p className="text-slate-600">Create professional project charters with AI</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Project Information</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Enter project name"
              />
            </div>

            <div>
              <Label htmlFor="detailLevel">Charter Detail Level</Label>
              <Select value={formData.detailLevel} onValueChange={(value) => setFormData({ ...formData, detailLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high-level">High-Level (Generic, Fast)</SelectItem>
                  <SelectItem value="balanced">Balanced (Recommended)</SelectItem>
                  <SelectItem value="detailed">Detailed (Specific, Slower)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1">
                High-level: Generic milestones, budget ranges • Detailed: Specific dates, exact breakdowns
              </p>
            </div>

            <div>
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.projectDescription}
                onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                placeholder="Brief description of the project"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="businessCase">Business Case</Label>
              <Textarea
                id="businessCase"
                value={formData.businessCase}
                onChange={(e) => setFormData({ ...formData, businessCase: e.target.value })}
                placeholder="Why is this project important?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="budget">Total Estimated Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                value={formData.estimatedBudget}
                onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value })}
                placeholder="e.g., 100000"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="laborBudget">Labor Budget (Optional)</Label>
                <Input
                  id="laborBudget"
                  type="number"
                  value={formData.laborBudget}
                  onChange={(e) => setFormData({ ...formData, laborBudget: e.target.value })}
                  placeholder="e.g., 60000"
                />
              </div>
              <div>
                <Label htmlFor="materialsBudget">Materials Budget (Optional)</Label>
                <Input
                  id="materialsBudget"
                  type="number"
                  value={formData.materialsBudget}
                  onChange={(e) => setFormData({ ...formData, materialsBudget: e.target.value })}
                  placeholder="e.g., 25000"
                />
              </div>
              <div>
                <Label htmlFor="equipmentBudget">Equipment Budget (Optional)</Label>
                <Input
                  id="equipmentBudget"
                  type="number"
                  value={formData.equipmentBudget}
                  onChange={(e) => setFormData({ ...formData, equipmentBudget: e.target.value })}
                  placeholder="e.g., 10000"
                />
              </div>
              <div>
                <Label htmlFor="contingencyBudget">Contingency (Optional)</Label>
                <Input
                  id="contingencyBudget"
                  type="number"
                  value={formData.contingencyBudget}
                  onChange={(e) => setFormData({ ...formData, contingencyBudget: e.target.value })}
                  placeholder="e.g., 5000"
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 -mt-2">
              💡 Leave empty for AI to suggest. Must add up to total budget.
            </p>

            <div>
              <Label htmlFor="duration">Estimated Duration</Label>
              <Input
                id="duration"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                placeholder="e.g., 6 months, Q1-Q2 2024"
              />
            </div>

            <div>
              <Label>Key Milestones (Optional)</Label>
              <div className="space-y-2">
                <Input
                  placeholder="Milestone 1: e.g., Design completion - Month 2"
                  value={formData.milestone1}
                  onChange={(e) => setFormData({ ...formData, milestone1: e.target.value })}
                />
                <Input
                  placeholder="Milestone 2: e.g., Development complete - Month 4"
                  value={formData.milestone2}
                  onChange={(e) => setFormData({ ...formData, milestone2: e.target.value })}
                />
                <Input
                  placeholder="Milestone 3: e.g., Launch - Month 6"
                  value={formData.milestone3}
                  onChange={(e) => setFormData({ ...formData, milestone3: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="stakeholders">Known Stakeholders (Optional)</Label>
              <Input
                id="stakeholders"
                value={formData.knownStakeholders}
                onChange={(e) => setFormData({ ...formData, knownStakeholders: e.target.value })}
                placeholder="e.g., John Smith (Sponsor), Sarah Lee (PM)"
              />
            </div>

            <div>
              <Label htmlFor="constraints">Key Constraints (Optional)</Label>
              <Textarea
                id="constraints"
                value={formData.keyConstraints}
                onChange={(e) => setFormData({ ...formData, keyConstraints: e.target.value })}
                placeholder="e.g., Must complete before Q2, Limited to 5 team members"
                rows={2}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!formData.projectName || isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Charter...
                </>
              ) : (
                'Generate Project Charter'
              )}
            </Button>
          </div>
        </Card>

        {/* Generated Charter */}
        <Card className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Generated Charter</h2>
            </div>
            
            {charter && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleUseAIVersion}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Use AI Version
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditCharter}
                  disabled={isEditing}
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  {isEditing ? 'Editing...' : 'Edit Charter'}
                </Button>

                {isEditing && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveEdits}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saved ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Edits
                      </>
                    )}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefineCharter}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Refine with AI
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={copied}
                >
                  {copied ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Text
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </div>
            )}
          </div>

          {!charter ? (
            <div className="text-center py-12 text-slate-500">
              <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
              <p className="mb-2">Fill in the form and click Generate to create your project charter</p>
              <p className="text-xs">💡 The more details you provide, the better the charter!</p>
            </div>
          ) : (
            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
              {isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    ✏️ <strong>Edit Mode:</strong> You can now manually edit any section below. Click "Save Edits" when done.
                  </p>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {isEditing ? (
                    <Input
                      value={editableCharter.title}
                      onChange={(e) => setEditableCharter({ ...editableCharter, title: e.target.value })}
                      className="font-semibold text-lg"
                    />
                  ) : (
                    charter.title
                  )}
                </h3>
                {isEditing ? (
                  <Textarea
                    value={editableCharter.executiveSummary}
                    onChange={(e) => setEditableCharter({ ...editableCharter, executiveSummary: e.target.value })}
                    className="text-sm text-slate-600 italic"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-600 italic">{charter.executiveSummary}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-1">Background</h4>
                {isEditing ? (
                  <Textarea
                    value={editableCharter.background}
                    onChange={(e) => setEditableCharter({ ...editableCharter, background: e.target.value })}
                    className="text-sm"
                    rows={3}
                  />
                ) : (
                  <p className="text-sm text-slate-700">{charter.background}</p>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-1">Objectives</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {(isEditing ? editableCharter : charter).objectives.map((obj: string, idx: number) => (
                    <li key={idx}>
                      {isEditing ? (
                        <Input
                          value={obj}
                          onChange={(e) => {
                            const newObjectives = [...editableCharter.objectives]
                            newObjectives[idx] = e.target.value
                            setEditableCharter({ ...editableCharter, objectives: newObjectives })
                          }}
                          className="inline-block w-[calc(100%-20px)] ml-1"
                        />
                      ) : obj}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Success Criteria</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {(isEditing ? editableCharter : charter).successCriteria.map((criteria: string, idx: number) => (
                    <li key={idx}>
                      {isEditing ? (
                        <Input
                          value={criteria}
                          onChange={(e) => {
                            const newCriteria = [...editableCharter.successCriteria]
                            newCriteria[idx] = e.target.value
                            setEditableCharter({ ...editableCharter, successCriteria: newCriteria })
                          }}
                          className="inline-block w-[calc(100%-20px)] ml-1"
                        />
                      ) : criteria}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">In Scope</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {(isEditing ? editableCharter : charter).scopeInScope.map((item: string, idx: number) => (
                    <li key={idx}>
                      {isEditing ? (
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newScope = [...editableCharter.scopeInScope]
                            newScope[idx] = e.target.value
                            setEditableCharter({ ...editableCharter, scopeInScope: newScope })
                          }}
                          className="inline-block w-[calc(100%-20px)] ml-1"
                        />
                      ) : item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Out of Scope</h4>
                <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                  {(isEditing ? editableCharter : charter).scopeOutOfScope.map((item: string, idx: number) => (
                    <li key={idx}>
                      {isEditing ? (
                        <Input
                          value={item}
                          onChange={(e) => {
                            const newScope = [...editableCharter.scopeOutOfScope]
                            newScope[idx] = e.target.value
                            setEditableCharter({ ...editableCharter, scopeOutOfScope: newScope })
                          }}
                          className="inline-block w-[calc(100%-20px)] ml-1"
                        />
                      ) : item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-1">Budget Estimate</h4>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs w-24">Total:</Label>
                      <Input
                        type="number"
                        value={editableCharter.budgetEstimate.total}
                        onChange={(e) => setEditableCharter({
                          ...editableCharter,
                          budgetEstimate: {
                            ...editableCharter.budgetEstimate,
                            total: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="text-sm"
                      />
                    </div>
                    {editableCharter.budgetEstimate.breakdown.map((item: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          value={item.category}
                          onChange={(e) => {
                            const newBreakdown = [...editableCharter.budgetEstimate.breakdown]
                            newBreakdown[idx].category = e.target.value
                            setEditableCharter({
                              ...editableCharter,
                              budgetEstimate: { ...editableCharter.budgetEstimate, breakdown: newBreakdown }
                            })
                          }}
                          className="text-xs"
                          placeholder="Category"
                        />
                        <Input
                          type="number"
                          value={item.amount}
                          onChange={(e) => {
                            const newBreakdown = [...editableCharter.budgetEstimate.breakdown]
                            newBreakdown[idx].amount = parseFloat(e.target.value) || 0
                            setEditableCharter({
                              ...editableCharter,
                              budgetEstimate: { ...editableCharter.budgetEstimate, breakdown: newBreakdown }
                            })
                          }}
                          className="text-xs"
                          placeholder="Amount"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-slate-900">
                      ${charter.budgetEstimate.total.toLocaleString()} {charter.budgetEstimate.currency}
                    </p>
                    <div className="mt-2 space-y-1">
                      {charter.budgetEstimate.breakdown.map((item: any, idx: number) => (
                        <div key={idx} className="text-xs text-slate-600 flex justify-between">
                          <span>{item.category}</span>
                          <span>${item.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-1">Timeline</h4>
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs w-24">Start Date:</Label>
                      <Input
                        type="date"
                        value={new Date(editableCharter.timeline.startDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditableCharter({
                          ...editableCharter,
                          timeline: { ...editableCharter.timeline, startDate: new Date(e.target.value) }
                        })}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex gap-2 items-center">
                      <Label className="text-xs w-24">End Date:</Label>
                      <Input
                        type="date"
                        value={new Date(editableCharter.timeline.endDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditableCharter({
                          ...editableCharter,
                          timeline: { ...editableCharter.timeline, endDate: new Date(e.target.value) }
                        })}
                        className="text-sm"
                      />
                    </div>
                    <h5 className="text-xs font-medium mt-2">Milestones:</h5>
                    {editableCharter.timeline.milestones.map((milestone: any, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          value={milestone.name}
                          onChange={(e) => {
                            const newMilestones = [...editableCharter.timeline.milestones]
                            newMilestones[idx].name = e.target.value
                            setEditableCharter({
                              ...editableCharter,
                              timeline: { ...editableCharter.timeline, milestones: newMilestones }
                            })
                          }}
                          className="text-xs"
                          placeholder="Milestone name"
                        />
                        <Input
                          type="date"
                          value={new Date(milestone.date).toISOString().split('T')[0]}
                          onChange={(e) => {
                            const newMilestones = [...editableCharter.timeline.milestones]
                            newMilestones[idx].date = new Date(e.target.value)
                            setEditableCharter({
                              ...editableCharter,
                              timeline: { ...editableCharter.timeline, milestones: newMilestones }
                            })
                          }}
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-slate-700">
                      {new Date(charter.timeline.startDate).toLocaleDateString()} -{' '}
                      {new Date(charter.timeline.endDate).toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {charter.timeline.milestones.map((milestone: any, idx: number) => (
                        <div key={idx} className="text-xs text-slate-600 flex justify-between">
                          <span>{milestone.name}</span>
                          <span>{new Date(milestone.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}


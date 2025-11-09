'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
    ClipboardList,
    Plus,
    FileText,
    Users,
    CheckCircle2,
    Trash2,
    Edit2,
    Eye,
    Send,
    X,
    GripVertical,
    Download,
    Maximize,
    Minimize
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FormField {
    id: string
    type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date'
    label: string
    required: boolean
    options?: string[]
    placeholder?: string
}

interface Form {
    id: string
    name: string
    description: string
    fields: FormField[]
    submissions: any[]
    createdAt: string
}

export function AdvancedFormsWidget() {
    const cardRef = useRef<HTMLDivElement>(null)
    const [forms, setForms] = useState<Form[]>([])
    const [formBuilderOpen, setFormBuilderOpen] = useState(false)
    const [viewFormOpen, setViewFormOpen] = useState(false)
    const [submissionsOpen, setSubmissionsOpen] = useState(false)
    const [currentForm, setCurrentForm] = useState<Form | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [exportDialogOpen, setExportDialogOpen] = useState(false)
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json')
    const [formToExport, setFormToExport] = useState<Form | null>(null)

    // Form builder state
    const [formName, setFormName] = useState('')
    const [formDescription, setFormDescription] = useState('')
    const [formFields, setFormFields] = useState<FormField[]>([])
    const [editingFormId, setEditingFormId] = useState<string | null>(null)

    // Load forms from localStorage
    useEffect(() => {
        const savedForms = localStorage.getItem('custom-forms')
        if (savedForms) {
            try {
                setForms(JSON.parse(savedForms))
            } catch (e) {
                console.error('Error loading forms:', e)
            }
        }
    }, [])

    // Save forms to localStorage
    const saveForms = (updatedForms: Form[]) => {
        setForms(updatedForms)
        localStorage.setItem('custom-forms', JSON.stringify(updatedForms))
    }

    const addField = (type: FormField['type']) => {
        const newField: FormField = {
            id: `field-${Date.now()}`,
            type,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            required: false,
            placeholder: '',
            options: type === 'select' || type === 'radio' ? ['Option 1', 'Option 2'] : undefined
        }
        setFormFields([...formFields, newField])
    }

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFormFields(formFields.map(field =>
            field.id === id ? { ...field, ...updates } : field
        ))
    }

    const removeField = (id: string) => {
        setFormFields(formFields.filter(field => field.id !== id))
    }

    const saveForm = () => {
        if (!formName.trim()) {
            alert('Please enter a form name')
            return
        }

        const newForm: Form = {
            id: editingFormId || `form-${Date.now()}`,
            name: formName,
            description: formDescription,
            fields: formFields,
            submissions: editingFormId ? forms.find(f => f.id === editingFormId)?.submissions || [] : [],
            createdAt: new Date().toISOString()
        }

        if (editingFormId) {
            saveForms(forms.map(f => f.id === editingFormId ? newForm : f))
        } else {
            saveForms([...forms, newForm])
        }

        resetBuilder()
        setFormBuilderOpen(false)
    }

    const resetBuilder = () => {
        setFormName('')
        setFormDescription('')
        setFormFields([])
        setEditingFormId(null)
    }

    const editForm = (form: Form) => {
        setFormName(form.name)
        setFormDescription(form.description)
        setFormFields([...form.fields])
        setEditingFormId(form.id)
        setFormBuilderOpen(true)
    }

    const deleteForm = (id: string) => {
        if (confirm('Are you sure you want to delete this form?')) {
            saveForms(forms.filter(f => f.id !== id))
        }
    }

    const createQuickForm = (type: 'feedback' | 'survey' | 'checklist' | 'request') => {
        const templates: Record<string, { name: string; description: string; fields: FormField[] }> = {
            feedback: {
                name: 'Feedback Form',
                description: 'Collect user feedback',
                fields: [
                    { id: 'name', type: 'text', label: 'Your Name', required: true, placeholder: 'John Doe' },
                    { id: 'email', type: 'email', label: 'Email', required: true, placeholder: 'john@example.com' },
                    { id: 'rating', type: 'select', label: 'Rating', required: true, options: ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'] },
                    { id: 'feedback', type: 'textarea', label: 'Your Feedback', required: true, placeholder: 'Tell us what you think...' }
                ]
            },
            survey: {
                name: 'Survey Form',
                description: 'Conduct surveys',
                fields: [
                    { id: 'q1', type: 'radio', label: 'How satisfied are you?', required: true, options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Unsatisfied'] },
                    { id: 'q2', type: 'checkbox', label: 'Which features do you use?', required: false, options: ['Feature A', 'Feature B', 'Feature C'] },
                    { id: 'comments', type: 'textarea', label: 'Additional Comments', required: false, placeholder: 'Any other thoughts?' }
                ]
            },
            checklist: {
                name: 'Checklist Form',
                description: 'Create task checklists',
                fields: [
                    { id: 'title', type: 'text', label: 'Checklist Title', required: true, placeholder: 'e.g., Pre-launch Tasks' },
                    { id: 'items', type: 'textarea', label: 'Tasks (one per line)', required: true, placeholder: 'Task 1\nTask 2\nTask 3' },
                    { id: 'dueDate', type: 'date', label: 'Due Date', required: false }
                ]
            },
            request: {
                name: 'Request Form',
                description: 'Submit requests',
                fields: [
                    { id: 'requester', type: 'text', label: 'Your Name', required: true, placeholder: 'John Doe' },
                    { id: 'type', type: 'select', label: 'Request Type', required: true, options: ['Feature Request', 'Bug Report', 'Support', 'Other'] },
                    { id: 'priority', type: 'radio', label: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
                    { id: 'description', type: 'textarea', label: 'Description', required: true, placeholder: 'Describe your request...' }
                ]
            }
        }

        const template = templates[type]
        const newForm: Form = {
            id: `form-${Date.now()}`,
            name: template.name,
            description: template.description,
            fields: template.fields,
            submissions: [],
            createdAt: new Date().toISOString()
        }
        saveForms([...forms, newForm])
    }

    const viewSubmissions = (form: Form) => {
        setCurrentForm(form)
        setSubmissionsOpen(true)
    }

    const exportForm = (form: Form) => {
        setFormToExport(form)
        setExportDialogOpen(true)
    }

    const handleExport = () => {
        if (!formToExport) return

        if (exportFormat === 'json') {
            exportAsJSON(formToExport)
        } else if (exportFormat === 'csv') {
            exportAsCSV(formToExport)
        } else if (exportFormat === 'pdf') {
            exportAsPDF(formToExport)
        }

        setExportDialogOpen(false)
    }

    const exportAsJSON = (form: Form) => {
        const dataStr = JSON.stringify(form, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${form.name.replace(/\s+/g, '-').toLowerCase()}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const exportAsCSV = (form: Form) => {
        if (form.submissions.length === 0) {
            alert('No submissions to export')
            return
        }

        // Create CSV header from form fields
        const headers = form.fields.map(field => field.label)
        const csvRows = [headers.join(',')]

        // Add submission data
        form.submissions.forEach(submission => {
            const row = form.fields.map(field => {
                const value = submission[field.id] || ''
                // Escape commas and quotes
                const escaped = String(value).replace(/"/g, '""')
                return `"${escaped}"`
            })
            csvRows.push(row.join(','))
        })

        const csvContent = csvRows.join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${form.name.replace(/\s+/g, '-').toLowerCase()}-submissions.csv`
        link.click()
        URL.revokeObjectURL(url)
    }

    const exportAsPDF = (form: Form) => {
        // Create a simple HTML representation for PDF
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${form.name}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
        }
        .description {
            color: #666;
            font-style: italic;
            margin-bottom: 30px;
        }
        .field {
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-left: 4px solid #2563eb;
        }
        .field-label {
            font-weight: bold;
            color: #2563eb;
        }
        .field-type {
            display: inline-block;
            background: #e0e7ff;
            color: #3730a3;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            margin-left: 10px;
        }
        .required {
            color: #dc2626;
        }
        .submissions {
            margin-top: 40px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #2563eb;
            color: white;
        }
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <h1>${form.name}</h1>
    ${form.description ? `<p class="description">${form.description}</p>` : ''}
    
    <h2>Form Fields</h2>
    ${form.fields.map(field => `
        <div class="field">
            <div class="field-label">
                ${field.label}
                ${field.required ? '<span class="required">*</span>' : ''}
                <span class="field-type">${field.type}</span>
            </div>
            ${field.placeholder ? `<div style="color: #666; font-size: 14px; margin-top: 5px;">Placeholder: ${field.placeholder}</div>` : ''}
            ${field.options ? `<div style="color: #666; font-size: 14px; margin-top: 5px;">Options: ${field.options.join(', ')}</div>` : ''}
        </div>
    `).join('')}
    
    ${form.submissions.length > 0 ? `
        <div class="submissions">
            <h2>Submissions (${form.submissions.length})</h2>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        ${form.fields.map(field => `<th>${field.label}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${form.submissions.map((submission, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            ${form.fields.map(field => `<td>${submission[field.id] || '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    ` : '<p style="color: #666; margin-top: 30px;">No submissions yet.</p>'}
    
    <div class="footer">
        Generated on ${new Date().toLocaleString()}<br>
        Form created: ${new Date(form.createdAt).toLocaleString()}
    </div>
</body>
</html>
        `

        // Create a blob and download as HTML (user can print to PDF from browser)
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${form.name.replace(/\s+/g, '-').toLowerCase()}.html`
        link.click()
        URL.revokeObjectURL(url)

        // Also open in new window for printing
        const printWindow = window.open('', '_blank')
        if (printWindow) {
            printWindow.document.write(htmlContent)
            printWindow.document.close()
            setTimeout(() => {
                printWindow.print()
            }, 250)
        }
    }

    const toggleFullscreen = async () => {
        const card = cardRef.current
        if (!card) return

        try {
            if (!document.fullscreenElement) {
                await card.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch (err) {
            console.error('Error toggling fullscreen:', err)
        }
    }

    // Listen for fullscreen changes (e.g., user pressing ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    return (
        <Card ref={cardRef} className="h-full flex flex-col">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Forms
                </CardTitle>
                <CardDescription className="text-xs">Create and manage custom forms</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-3 overflow-auto pt-4">
                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                            resetBuilder()
                            setFormBuilderOpen(true)
                        }}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        New Form
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                    >
                        {isFullscreen ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    </Button>
                </div>

                {/* Quick Form Templates */}
                {forms.length === 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">Quick Start Templates</p>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto flex-col gap-1 py-3"
                                onClick={() => createQuickForm('feedback')}
                            >
                                <FileText className="h-4 w-4" />
                                <span className="text-xs">Feedback</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto flex-col gap-1 py-3"
                                onClick={() => createQuickForm('survey')}
                            >
                                <Users className="h-4 w-4" />
                                <span className="text-xs">Survey</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto flex-col gap-1 py-3"
                                onClick={() => createQuickForm('checklist')}
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-xs">Checklist</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-auto flex-col gap-1 py-3"
                                onClick={() => createQuickForm('request')}
                            >
                                <Send className="h-4 w-4" />
                                <span className="text-xs">Request</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Forms List */}
                {forms.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Your Forms ({forms.length})
                        </p>
                        <div className="space-y-2">
                            {forms.map((form) => (
                                <div
                                    key={form.id}
                                    className="p-3 border rounded-lg hover:bg-accent transition-colors group"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-sm truncate">{form.name}</p>
                                                <Badge variant="secondary" className="text-[10px]">
                                                    {form.fields.length} fields
                                                </Badge>
                                            </div>
                                            {form.description && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                    {form.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {form.submissions.length} submissions
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => viewSubmissions(form)}
                                                title="View Submissions"
                                            >
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => editForm(form)}
                                                title="Edit Form"
                                            >
                                                <Edit2 className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0"
                                                onClick={() => exportForm(form)}
                                                title="Export Form"
                                            >
                                                <Download className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 w-7 p-0 text-destructive"
                                                onClick={() => deleteForm(form.id)}
                                                title="Delete Form"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            {/* Form Builder Dialog */}
            <Dialog open={formBuilderOpen} onOpenChange={setFormBuilderOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingFormId ? 'Edit Form' : 'Create New Form'}</DialogTitle>
                        <DialogDescription>
                            Build your custom form by adding fields
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Form Details */}
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="formName">Form Name</Label>
                                <Input
                                    id="formName"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g., Customer Feedback Form"
                                />
                            </div>
                            <div>
                                <Label htmlFor="formDescription">Description (optional)</Label>
                                <Input
                                    id="formDescription"
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="What is this form for?"
                                />
                            </div>
                        </div>

                        {/* Field Types */}
                        <div>
                            <Label>Add Fields</Label>
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date'].map((type) => (
                                    <Button
                                        key={type}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addField(type as FormField['type'])}
                                        className="text-xs"
                                    >
                                        <Plus className="h-3 w-3 mr-1" />
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-2">
                            <Label>Form Fields ({formFields.length})</Label>
                            {formFields.length === 0 ? (
                                <div className="text-center py-6 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                                    <p>No fields added yet</p>
                                    <p className="mt-1">Add fields using the buttons above</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {formFields.map((field, index) => (
                                        <div
                                            key={field.id}
                                            className="p-3 border rounded-lg bg-muted/30 space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    <Badge variant="secondary" className="text-[10px]">
                                                        {field.type}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-destructive"
                                                    onClick={() => removeField(field.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-xs">Label</Label>
                                                    <Input
                                                        value={field.label}
                                                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                        className="h-8 text-xs"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">Placeholder</Label>
                                                    <Input
                                                        value={field.placeholder || ''}
                                                        onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                        className="h-8 text-xs"
                                                        placeholder="Optional"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`required-${field.id}`}
                                                    checked={field.required}
                                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                    className="h-4 w-4"
                                                />
                                                <Label htmlFor={`required-${field.id}`} className="text-xs">
                                                    Required field
                                                </Label>
                                            </div>
                                            {(field.type === 'select' || field.type === 'radio') && (
                                                <div>
                                                    <Label className="text-xs">Options (comma-separated)</Label>
                                                    <Input
                                                        value={field.options?.join(', ') || ''}
                                                        onChange={(e) => updateField(field.id, {
                                                            options: e.target.value.split(',').map(o => o.trim()).filter(Boolean)
                                                        })}
                                                        className="h-8 text-xs"
                                                        placeholder="Option 1, Option 2, Option 3"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setFormBuilderOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveForm} disabled={!formName.trim() || formFields.length === 0}>
                            {editingFormId ? 'Update Form' : 'Create Form'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submissions Dialog */}
            <Dialog open={submissionsOpen} onOpenChange={setSubmissionsOpen}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Form Submissions - {currentForm?.name}</DialogTitle>
                        <DialogDescription>
                            View all submissions for this form
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {currentForm && currentForm.submissions.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No submissions yet</p>
                                <p className="text-xs mt-1">Submissions will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {currentForm?.submissions.map((submission, index) => (
                                    <div key={index} className="p-3 border rounded-lg">
                                        <p className="text-xs font-semibold mb-2">Submission #{index + 1}</p>
                                        {/* Submission details would go here */}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Export Format Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Export Form</DialogTitle>
                        <DialogDescription>
                            Choose the format for exporting your form and submissions
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="json"
                                    checked={exportFormat === 'json'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">JSON Data</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export complete form structure with all data (can be imported later)
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="csv"
                                    checked={exportFormat === 'csv'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">CSV Spreadsheet</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export submissions as CSV (open in Excel, Google Sheets)
                                        {formToExport && formToExport.submissions.length === 0 && (
                                            <span className="text-orange-600 block mt-1">⚠ No submissions to export</span>
                                        )}
                                    </div>
                                </div>
                            </label>

                            <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="pdf"
                                    checked={exportFormat === 'pdf'}
                                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv' | 'pdf')}
                                    className="w-4 h-4"
                                />
                                <div className="flex-1">
                                    <div className="font-medium">PDF/HTML Report</div>
                                    <div className="text-xs text-muted-foreground">
                                        Export as printable HTML report (save as PDF from browser)
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleExport}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}


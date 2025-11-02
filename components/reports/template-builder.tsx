'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Trash2, Download, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TemplateBuilderProps {
    onSave: (template: {
        name: string
        description: string
        format: string
        category: string
        columns: string[]
        rows: string[][]
    }) => void
    onCancel: () => void
    initialData?: {
        name: string
        description: string
        format: string
        category: string
        columns: string[]
        rows: string[][]
    }
}

export function TemplateBuilder({ onSave, onCancel, initialData }: TemplateBuilderProps) {
    const [templateName, setTemplateName] = useState(initialData?.name || '')
    const [templateDescription, setTemplateDescription] = useState(initialData?.description || '')
    const [templateFormat, setTemplateFormat] = useState(initialData?.format || 'excel')
    const [templateCategory, setTemplateCategory] = useState(initialData?.category || 'project')
    const [columns, setColumns] = useState<string[]>(
        initialData?.columns || ['Column 1', 'Column 2', 'Column 3']
    )
    const [rows, setRows] = useState<string[][]>(
        initialData?.rows || [
            ['', '', ''],
            ['', '', ''],
            ['', '', '']
        ]
    )

    const addColumn = () => {
        setColumns([...columns, `Column ${columns.length + 1}`])
        setRows(rows.map(row => [...row, '']))
    }

    const addRow = () => {
        setRows([...rows, new Array(columns.length).fill('')])
    }

    const removeColumn = (index: number) => {
        if (columns.length <= 1) {
            alert('Template must have at least one column')
            return
        }
        setColumns(columns.filter((_, i) => i !== index))
        setRows(rows.map(row => row.filter((_, i) => i !== index)))
    }

    const removeRow = (index: number) => {
        if (rows.length <= 1) {
            alert('Template must have at least one row')
            return
        }
        setRows(rows.filter((_, i) => i !== index))
    }

    const updateColumnName = (index: number, value: string) => {
        const newColumns = [...columns]
        newColumns[index] = value
        setColumns(newColumns)
    }

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        const newRows = [...rows]
        newRows[rowIndex][colIndex] = value
        setRows(newRows)
    }

    const handleSave = () => {
        if (!templateName.trim()) {
            alert('Please enter a template name')
            return
        }

        onSave({
            name: templateName,
            description: templateDescription,
            format: templateFormat,
            category: templateCategory,
            columns,
            rows
        })
    }

    const handleDownload = () => {
        if (!templateName.trim()) {
            alert('Please enter a template name before downloading')
            return
        }

        // Create CSV content
        let csvContent = columns.join(',') + '\n'
        csvContent += rows.map(row => row.join(',')).join('\n')

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${templateName.replace(/\s+/g, '_')}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Template Metadata */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="templateName">Template Name *</Label>
                    <Input
                        id="templateName"
                        placeholder="Weekly Status Report"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={templateCategory} onValueChange={setTemplateCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="executive">Executive</SelectItem>
                            <SelectItem value="financial">Financial</SelectItem>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="format">Output Format *</Label>
                    <Select value={templateFormat} onValueChange={setTemplateFormat}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="csv">CSV</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe what this template is for..."
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                        rows={2}
                    />
                </div>
            </div>

            {/* Interactive Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Template Structure</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={addColumn}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Column
                            </Button>
                            <Button variant="outline" size="sm" onClick={addRow}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Row
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    {columns.map((col, colIndex) => (
                                        <th key={colIndex} className="border border-border p-2 bg-muted">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={col}
                                                    onChange={(e) => updateColumnName(colIndex, e.target.value)}
                                                    className="h-8 text-sm font-medium"
                                                    placeholder="Column name"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeColumn(colIndex)}
                                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {row.map((cell, colIndex) => (
                                            <td key={colIndex} className="border border-border p-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        value={cell}
                                                        onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                                                        className="h-8 text-sm"
                                                        placeholder="Enter value"
                                                    />
                                                    {colIndex === row.length - 1 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeRow(rowIndex)}
                                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                </Button>
                <Button variant="outline" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Template
                </Button>
            </div>
        </div>
    )
}


'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Download, Save, X, Check, ChevronRight, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Column {
    id: string
    name: string
    type: 'text' | 'person' | 'status' | 'date'
}

interface Row {
    id: string
    cells: Record<string, string>
    parentId?: string
    isSubtask?: boolean
    isExpanded?: boolean
}

interface TemplateTableViewProps {
    onSave?: (data: { columns: string[], rows: string[][], name: string, description: string, format: string, category: string }) => void
    onCancel?: () => void
    onStateChange?: (columns: Column[], rows: Row[]) => void
    initialColumns?: Column[]
    initialRows?: Row[]
}

const STATUS_OPTIONS = ['Working on it', 'Done', 'Stuck', 'Pending', 'In Review']
const STATUS_COLORS: Record<string, string> = {
    'Working on it': 'bg-yellow-500',
    'Done': 'bg-green-500',
    'Stuck': 'bg-red-500',
    'Pending': 'bg-gray-400',
    'In Review': 'bg-blue-500'
}

export function TemplateTableView({ onSave, onCancel, onStateChange, initialColumns, initialRows }: TemplateTableViewProps) {
    const [columns, setColumns] = useState<Column[]>(initialColumns || [
        { id: '1', name: 'Item', type: 'text' },
        { id: '2', name: 'Person', type: 'person' },
        { id: '3', name: 'Status', type: 'status' },
        { id: '4', name: 'Date', type: 'date' }
    ])

    const [rows, setRows] = useState<Row[]>(initialRows || [
        { id: '1', cells: { '1': 'Task 1', '2': '', '3': 'Working on it', '4': 'May 18' }, isExpanded: true },
        { id: '2', cells: { '1': 'Task 2', '2': '', '3': 'Done', '4': 'May 19' }, isExpanded: true },
        { id: '3', cells: { '1': 'Task 3', '2': '', '3': 'Stuck', '4': 'May 20' }, isExpanded: true }
    ])

    const [editingCell, setEditingCell] = useState<{ rowId: string, columnId: string } | null>(null)
    const [editingColumn, setEditingColumn] = useState<string | null>(null)
    const [templateName, setTemplateName] = useState('')
    const [showSaveDialog, setShowSaveDialog] = useState(false)

    // Notify parent of state changes
    useEffect(() => {
        onStateChange?.(columns, rows)
    }, [columns, rows, onStateChange])

    const addColumn = () => {
        const newColumn: Column = {
            id: Date.now().toString(),
            name: `Column ${columns.length + 1}`,
            type: 'text'
        }
        setColumns([...columns, newColumn])
        setRows(rows.map(row => ({
            ...row,
            cells: { ...row.cells, [newColumn.id]: '' }
        })))
    }

    const addRow = () => {
        const newRow: Row = {
            id: Date.now().toString(),
            cells: columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
            isExpanded: true
        }
        setRows([...rows, newRow])
    }

    const addSubtask = (parentId: string) => {
        const newSubtask: Row = {
            id: Date.now().toString(),
            cells: columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
            parentId,
            isSubtask: true
        }
        
        // Find the parent row index
        const parentIndex = rows.findIndex(r => r.id === parentId)
        
        // Find the last subtask of this parent or the parent itself
        let insertIndex = parentIndex + 1
        while (insertIndex < rows.length && rows[insertIndex].parentId === parentId) {
            insertIndex++
        }
        
        // Insert the new subtask
        const newRows = [...rows]
        newRows.splice(insertIndex, 0, newSubtask)
        setRows(newRows)
        
        // Make sure parent is expanded
        setRows(prevRows => prevRows.map(r => 
            r.id === parentId ? { ...r, isExpanded: true } : r
        ))
    }

    const toggleExpanded = (rowId: string) => {
        setRows(rows.map(row =>
            row.id === rowId ? { ...row, isExpanded: !row.isExpanded } : row
        ))
    }

    const removeColumn = (columnId: string) => {
        if (columns.length <= 1) {
            alert('Template must have at least one column')
            return
        }
        setColumns(columns.filter(col => col.id !== columnId))
        setRows(rows.map(row => {
            const newCells = { ...row.cells }
            delete newCells[columnId]
            return { ...row, cells: newCells }
        }))
    }

    const removeRow = (rowId: string) => {
        const rowToDelete = rows.find(r => r.id === rowId)
        
        if (!rowToDelete) return
        
        // Count parent tasks (non-subtasks)
        const parentTaskCount = rows.filter(r => !r.isSubtask).length
        if (!rowToDelete.isSubtask && parentTaskCount <= 1) {
            alert('Template must have at least one main task')
            return
        }
        
        // If deleting a parent task, also delete its subtasks
        if (!rowToDelete.isSubtask) {
            setRows(rows.filter(row => row.id !== rowId && row.parentId !== rowId))
        } else {
            setRows(rows.filter(row => row.id !== rowId))
        }
    }

    const updateColumnName = (columnId: string, name: string) => {
        setColumns(columns.map(col =>
            col.id === columnId ? { ...col, name } : col
        ))
    }

    const updateColumnType = (columnId: string, type: Column['type']) => {
        setColumns(columns.map(col =>
            col.id === columnId ? { ...col, type } : col
        ))
    }

    const updateCell = (rowId: string, columnId: string, value: string) => {
        setRows(rows.map(row =>
            row.id === rowId
                ? { ...row, cells: { ...row.cells, [columnId]: value } }
                : row
        ))
    }

    const handleSave = () => {
        if (!templateName.trim()) {
            alert('Please enter a template name')
            return
        }

        const columnNames = columns.map(col => col.name)
        
        // Flatten all rows (including subtasks) with indentation in first column
        const rowData = rows.map(row => {
            const rowValues = columns.map((col, index) => {
                const cellValue = row.cells[col.id] || ''
                // Add indentation to first column for subtasks
                if (index === 0 && row.isSubtask) {
                    return `  └ ${cellValue}`
                }
                return cellValue
            })
            return rowValues
        })

        onSave?.({
            columns: columnNames,
            rows: rowData,
            name: templateName,
            description: 'Custom template',
            format: 'excel',
            category: 'custom'
        })
        setShowSaveDialog(false)
    }

    const handleDownload = () => {
        const csvContent = columns.map(col => col.name).join(',') + '\n' +
            rows.map(row => {
                return columns.map((col, index) => {
                    const cellValue = row.cells[col.id] || ''
                    // Add indentation for subtasks in first column
                    if (index === 0 && row.isSubtask) {
                        return `"  └ ${cellValue}"`
                    }
                    return `"${cellValue}"`
                }).join(',')
            }).join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `template_${Date.now()}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const renderCell = (row: Row, column: Column) => {
        const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id
        const value = row.cells[column.id] || ''

        if (column.type === 'status') {
            return (
                <Select
                    value={value}
                    onValueChange={(newValue) => updateCell(row.id, column.id, newValue)}
                >
                    <SelectTrigger className={`h-8 border-0 ${value ? STATUS_COLORS[value] : 'bg-muted'} text-white font-medium`}>
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded ${STATUS_COLORS[option]}`} />
                                    {option}
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        if (column.type === 'person') {
            return (
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                        👤
                    </div>
                    {isEditing ? (
                        <Input
                            value={value}
                            onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                            onBlur={() => setEditingCell(null)}
                            autoFocus
                            className="h-6 text-sm border-0 p-0 focus-visible:ring-0"
                        />
                    ) : (
                        <span
                            className="text-sm cursor-pointer hover:bg-accent px-1 rounded flex-1"
                            onClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
                        >
                            {value || 'Click to add'}
                        </span>
                    )}
                </div>
            )
        }

        return (
            <div className="px-2 py-1">
                {isEditing ? (
                    <Input
                        value={value}
                        onChange={(e) => updateCell(row.id, column.id, e.target.value)}
                        onBlur={() => setEditingCell(null)}
                        autoFocus
                        className="h-6 text-sm border-0 p-0 focus-visible:ring-0"
                    />
                ) : (
                    <span
                        className="text-sm cursor-pointer hover:bg-accent px-1 rounded block"
                        onClick={() => setEditingCell({ rowId: row.id, columnId: column.id })}
                    >
                        {value || 'Click to add'}
                    </span>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={addRow}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Item
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
                        <Save className="h-4 w-4 mr-2" />
                        Save as Template
                    </Button>
                </div>
                {onCancel && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
                                onCancel()
                            }
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Save Dialog */}
            {showSaveDialog && (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Save Template</h3>
                        <Button variant="ghost" size="sm" onClick={() => setShowSaveDialog(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <Input
                        placeholder="Enter template name..."
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleSave}>
                            <Check className="h-4 w-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/50">
                                {columns.map((column) => (
                                    <th key={column.id} className="text-left px-4 py-2 font-medium text-sm min-w-[150px]">
                                        <div className="flex items-center justify-between group">
                                            {editingColumn === column.id ? (
                                                <Input
                                                    value={column.name}
                                                    onChange={(e) => updateColumnName(column.id, e.target.value)}
                                                    onBlur={() => setEditingColumn(null)}
                                                    autoFocus
                                                    className="h-7 text-sm font-medium"
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span
                                                        className="cursor-pointer hover:text-primary"
                                                        onClick={() => setEditingColumn(column.id)}
                                                    >
                                                        {column.name}
                                                    </span>
                                                    <Select
                                                        value={column.type}
                                                        onValueChange={(value) => updateColumnType(column.id, value as Column['type'])}
                                                    >
                                                        <SelectTrigger className="h-6 w-20 text-xs border-0 bg-transparent">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="text">Text</SelectItem>
                                                            <SelectItem value="person">Person</SelectItem>
                                                            <SelectItem value="status">Status</SelectItem>
                                                            <SelectItem value="date">Date</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeColumn(column.id)}
                                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </th>
                                ))}
                                <th className="text-left px-4 py-2 w-[60px]">
                                    <Button variant="ghost" size="sm" onClick={addColumn} className="h-7 w-7 p-0">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                // Don't show subtasks if parent is collapsed
                                if (row.isSubtask && row.parentId) {
                                    const parent = rows.find(r => r.id === row.parentId)
                                    if (parent && !parent.isExpanded) {
                                        return null
                                    }
                                }

                                const hasSubtasks = rows.some(r => r.parentId === row.id)
                                const subtaskCount = rows.filter(r => r.parentId === row.id).length

                                return (
                                    <tr key={row.id} className={`border-b border-border hover:bg-muted/30 group ${row.isSubtask ? 'bg-muted/20' : ''}`}>
                                        {columns.map((column, colIndex) => (
                                            <td key={column.id} className="px-4 py-2">
                                                <div className="flex items-center gap-1">
                                                    {/* Expand/Collapse button for first column of parent rows */}
                                                    {colIndex === 0 && !row.isSubtask && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleExpanded(row.id)}
                                                            className={`h-5 w-5 p-0 ${hasSubtasks ? '' : 'invisible'}`}
                                                        >
                                                            {row.isExpanded ? (
                                                                <ChevronDown className="h-3 w-3" />
                                                            ) : (
                                                                <ChevronRight className="h-3 w-3" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    
                                                    {/* Subtask indicator for first column */}
                                                    {colIndex === 0 && row.isSubtask && (
                                                        <span className="text-muted-foreground mr-1 text-xs">└</span>
                                                    )}
                                                    
                                                    <div className={`flex-1 ${row.isSubtask ? 'ml-6' : ''}`}>
                                                        {renderCell(row, column)}
                                                    </div>
                                                </div>
                                            </td>
                                        ))}
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-1">
                                                {/* Add Subtask button for parent rows */}
                                                {!row.isSubtask && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addSubtask(row.id)}
                                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                                        title="Add subtask"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                {/* Delete button */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeRow(row.id)}
                                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700"
                                                    title={!row.isSubtask && hasSubtasks ? `Delete task and ${subtaskCount} subtask(s)` : 'Delete'}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Row Button */}
            <Button variant="ghost" size="sm" onClick={addRow} className="w-full justify-start text-muted-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add item
            </Button>
        </div>
    )
}


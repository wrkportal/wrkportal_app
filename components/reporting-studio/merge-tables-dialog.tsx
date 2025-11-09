'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Link2, Table2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface TableInfo {
    id: string
    name: string
    columns?: string[]
    rowCount?: number
}

interface JoinConfig {
    id: string
    leftTable: string
    leftTableName?: string // User-friendly name
    rightTable: string
    rightTableName?: string // User-friendly name
    joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL'
    leftKey: string
    rightKey: string
    selectedColumns?: {
        left: string[]
        right: string[]
    }
}

interface MergeTablesDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    tables: TableInfo[]
    currentTable: TableInfo | null
    onMerge: (mergedData: any) => void
    onSaved?: () => void // Callback to refresh file list
}

const JOIN_TYPES = [
    { value: 'INNER', label: 'Inner Join', description: 'Only matching records', icon: '⋂' },
    { value: 'LEFT', label: 'Left Join', description: 'All from left + matches', icon: '⊆' },
    { value: 'RIGHT', label: 'Right Join', description: 'All from right + matches', icon: '⊇' },
    { value: 'FULL', label: 'Full Outer Join', description: 'All records from both', icon: '⋃' },
]

export function MergeTablesDialog({
    open,
    onOpenChange,
    tables,
    currentTable,
    onMerge,
    onSaved,
}: MergeTablesDialogProps) {
    const [joins, setJoins] = useState<JoinConfig[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [preview, setPreview] = useState<any>(null)
    const [tableColumns, setTableColumns] = useState<Record<string, string[]>>({})
    const [loadingColumns, setLoadingColumns] = useState<Record<string, boolean>>({})
    const [showSaveDialog, setShowSaveDialog] = useState(false)
    const [mergedResult, setMergedResult] = useState<any>(null)
    const [saveName, setSaveName] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    // Initialize with current table as the base
    useEffect(() => {
        if (open && currentTable && joins.length === 0) {
            // Fetch columns for current table immediately
            fetchTableColumns(currentTable.id)
            addJoin()
        }
    }, [open, currentTable])

    // Fetch columns for a table
    const fetchTableColumns = async (tableId: string) => {
        if (!tableId) return
        if (tableColumns[tableId]) {
            console.log(`Columns for ${tableId} already loaded:`, tableColumns[tableId])
            return
        }

        console.log(`Fetching columns for ${tableId}...`)
        setLoadingColumns(prev => ({ ...prev, [tableId]: true }))

        try {
            // Check if it's a database table or uploaded file
            // Uploaded files have IDs that are cuid (start with 'c' and are longer than typical table names)
            // Database tables are short lowercase names like 'user', 'project', 'task'
            const isDatabaseTable = tableId.length < 20 && !tableId.startsWith('c') && !/[A-Z]/.test(tableId)
            
            let response;
            if (isDatabaseTable) {
                // It's a database table
                console.log(`Detected as database table: ${tableId}`)
                response = await fetch(`/api/reporting-studio/database-tables/${tableId}?limit=1`)
            } else {
                // It's an uploaded file
                console.log(`Detected as uploaded file: ${tableId}`)
                response = await fetch(`/api/reporting-studio/preview/${tableId}?limit=1`)
            }
            
            if (response.ok) {
                const data = await response.json()
                console.log(`Columns fetched for ${tableId}:`, data.columns)
                setTableColumns(prev => ({
                    ...prev,
                    [tableId]: data.columns || []
                }))
            } else {
                console.error(`Failed to fetch columns for ${tableId}:`, response.status)
            }
        } catch (error) {
            console.error(`Error fetching columns for ${tableId}:`, error)
        } finally {
            setLoadingColumns(prev => ({ ...prev, [tableId]: false }))
        }
    }

    const addJoin = () => {
        const newJoin: JoinConfig = {
            id: Math.random().toString(36).substr(2, 9),
            leftTable: joins.length === 0 && currentTable ? currentTable.id : '',
            leftTableName: joins.length === 0 && currentTable ? currentTable.name : '',
            rightTable: '',
            rightTableName: '',
            joinType: 'INNER',
            leftKey: '',
            rightKey: '',
            selectedColumns: {
                left: [],
                right: []
            }
        }
        setJoins([...joins, newJoin])
    }

    const removeJoin = (id: string) => {
        setJoins(joins.filter(j => j.id !== id))
    }

    const updateJoin = (id: string, updates: Partial<JoinConfig>) => {
        const updatedJoins = joins.map(j => {
            if (j.id === id) {
                const updated = { ...j, ...updates }
                
                // Set table names when tables are selected
                if (updates.leftTable) {
                    const table = tables.find(t => t.id === updates.leftTable)
                    if (table) {
                        updated.leftTableName = table.name
                    }
                }
                if (updates.rightTable) {
                    const table = tables.find(t => t.id === updates.rightTable)
                    if (table) {
                        updated.rightTableName = table.name
                    }
                }
                
                return updated
            }
            return j
        })
        
        setJoins(updatedJoins)
        
        // Fetch columns immediately when table is selected
        if (updates.leftTable) {
            fetchTableColumns(updates.leftTable)
        }
        if (updates.rightTable) {
            fetchTableColumns(updates.rightTable)
        }
    }

    const toggleColumn = (joinId: string, side: 'left' | 'right', column: string) => {
        setJoins(joins.map(join => {
            if (join.id !== joinId) return join

            const currentSelected = join.selectedColumns?.[side] || []
            const newSelected = currentSelected.includes(column)
                ? currentSelected.filter(c => c !== column)
                : [...currentSelected, column]

            return {
                ...join,
                selectedColumns: {
                    ...join.selectedColumns,
                    [side]: newSelected
                }
            }
        }))
    }

    const selectAllColumns = (joinId: string, side: 'left' | 'right') => {
        const join = joins.find(j => j.id === joinId)
        if (!join) return

        const tableId = side === 'left' ? join.leftTable : join.rightTable
        const columns = tableColumns[tableId] || []

        setJoins(joins.map(j => {
            if (j.id !== joinId) return j
            return {
                ...j,
                selectedColumns: {
                    ...j.selectedColumns,
                    [side]: columns
                }
            }
        }))
    }

    const previewMerge = async () => {
        setIsLoading(true)
        setError(null)
        setPreview(null)

        try {
            // Validate joins
            for (const join of joins) {
                if (!join.leftTable || !join.rightTable) {
                    throw new Error('Please select both tables for all joins')
                }
                if (!join.leftKey || !join.rightKey) {
                    throw new Error('Please select join keys for all joins')
                }
            }

            const response = await fetch('/api/reporting-studio/merge-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    joins,
                    limit: 10 // Preview only 10 rows
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to preview merge')
            }

            const data = await response.json()
            setPreview(data)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    const executeMerge = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/reporting-studio/merge-tables', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    joins,
                    limit: 1000 // Full merge
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to merge tables')
            }

            const data = await response.json()
            setMergedResult(data)
            
            // Ask user if they want to save
            setShowSaveDialog(true)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSaveMergedTable = async () => {
        if (!saveName.trim()) {
            setError('Please enter a name for the merged table')
            return
        }

        setIsSaving(true)
        setError(null)

        try {
            const response = await fetch('/api/reporting-studio/save-merged-table', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: saveName,
                    data: mergedResult,
                    mergeConfig: { joins } // Store the merge configuration
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to save merged table')
            }

            const savedTable = await response.json()
            
            // Close dialogs and notify parent
            setShowSaveDialog(false)
            onMerge(mergedResult)
            
            // Refresh file list if callback provided
            if (onSaved) {
                onSaved()
            }
            
            onOpenChange(false)
            
            // Show success message
            alert(`Merged table "${saveName}" saved successfully! It will appear in your uploads list.`)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setIsSaving(false)
        }
    }

    const handleSkipSave = () => {
        setShowSaveDialog(false)
        onMerge(mergedResult)
        onOpenChange(false)
    }

    // Fetch columns when tables are selected
    useEffect(() => {
        joins.forEach(join => {
            if (join.leftTable) fetchTableColumns(join.leftTable)
            if (join.rightTable) fetchTableColumns(join.rightTable)
        })
    }, [joins])

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5" />
                            Merge Tables - Advanced Join Builder
                        </DialogTitle>
                        <DialogDescription>
                            Combine multiple tables using SQL-style joins. Select tables, join keys, and columns to create your merged dataset.
                        </DialogDescription>
                    </DialogHeader>

                <div className="flex-1 overflow-auto">
                    <div className="space-y-6 p-6">
                        {/* Join Configurations */}
                        {joins.map((join, index) => (
                            <Card key={join.id} className="relative">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Badge variant="outline">Join {index + 1}</Badge>
                                            {index === 0 ? 'Base Join' : 'Additional Join'}
                                        </CardTitle>
                                        {joins.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => removeJoin(join.id)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Table Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left Table */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">
                                                {index === 0 ? 'Base Table' : 'Left Table'}
                                            </Label>
                                            <Select
                                                value={join.leftTable}
                                                onValueChange={(value) => updateJoin(join.id, { leftTable: value, leftKey: '' })}
                                                disabled={index === 0}
                                            >
                                                <SelectTrigger className="text-sm">
                                                    <SelectValue placeholder="Select table" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tables.map(table => (
                                                        <SelectItem key={table.id} value={table.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Table2 className="h-3 w-3" />
                                                                {table.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Right Table */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Join With Table</Label>
                                            <Select
                                                value={join.rightTable}
                                                onValueChange={(value) => updateJoin(join.id, { rightTable: value, rightKey: '' })}
                                            >
                                                <SelectTrigger className="text-sm">
                                                    <SelectValue placeholder="Select table" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {tables.filter(t => t.id !== join.leftTable).map(table => (
                                                        <SelectItem key={table.id} value={table.id}>
                                                            <div className="flex items-center gap-2">
                                                                <Table2 className="h-3 w-3" />
                                                                {table.name}
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Join Type */}
                                    <div className="space-y-2">
                                        <Label className="text-xs">Join Type</Label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {JOIN_TYPES.map(type => (
                                                <button
                                                    key={type.value}
                                                    onClick={() => updateJoin(join.id, { joinType: type.value as any })}
                                                    className={cn(
                                                        "p-3 border rounded-lg text-left transition-all hover:border-primary",
                                                        join.joinType === type.value && "border-primary bg-primary/5"
                                                    )}
                                                >
                                                    <div className="text-2xl mb-1">{type.icon}</div>
                                                    <div className="text-xs font-semibold">{type.label}</div>
                                                    <div className="text-[10px] text-muted-foreground mt-0.5">
                                                        {type.description}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Join Keys */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left Key */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Left Join Key</Label>
                                            <Select
                                                value={join.leftKey}
                                                onValueChange={(value) => updateJoin(join.id, { leftKey: value })}
                                                disabled={!join.leftTable || loadingColumns[join.leftTable]}
                                            >
                                                <SelectTrigger className="text-sm">
                                                    <SelectValue placeholder={
                                                        loadingColumns[join.leftTable] 
                                                            ? "Loading columns..." 
                                                            : !join.leftTable
                                                            ? "Select table first"
                                                            : (tableColumns[join.leftTable]?.length || 0) === 0
                                                            ? "No columns found"
                                                            : "Select column"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(tableColumns[join.leftTable] || []).length === 0 ? (
                                                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                                            No columns available
                                                        </div>
                                                    ) : (
                                                        (tableColumns[join.leftTable] || []).map(col => (
                                                            <SelectItem key={col} value={col} className="text-xs">
                                                                {col}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Right Key */}
                                        <div className="space-y-2">
                                            <Label className="text-xs">Right Join Key</Label>
                                            <Select
                                                value={join.rightKey}
                                                onValueChange={(value) => updateJoin(join.id, { rightKey: value })}
                                                disabled={!join.rightTable || loadingColumns[join.rightTable]}
                                            >
                                                <SelectTrigger className="text-sm">
                                                    <SelectValue placeholder={
                                                        loadingColumns[join.rightTable] 
                                                            ? "Loading columns..." 
                                                            : !join.rightTable
                                                            ? "Select table first"
                                                            : (tableColumns[join.rightTable]?.length || 0) === 0
                                                            ? "No columns found"
                                                            : "Select column"
                                                    } />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(tableColumns[join.rightTable] || []).length === 0 ? (
                                                        <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                                            No columns available
                                                        </div>
                                                    ) : (
                                                        (tableColumns[join.rightTable] || []).map(col => (
                                                            <SelectItem key={col} value={col} className="text-xs">
                                                                {col}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Column Selection */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Left Columns */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Select Columns (Left)</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={() => selectAllColumns(join.id, 'left')}
                                                    disabled={!join.leftTable}
                                                >
                                                    Select All
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-32 border rounded-md p-2">
                                                <div className="space-y-1">
                                                    {(tableColumns[join.leftTable] || []).map(col => (
                                                        <div key={col} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`${join.id}-left-${col}`}
                                                                checked={(join.selectedColumns?.left || []).includes(col)}
                                                                onCheckedChange={() => toggleColumn(join.id, 'left', col)}
                                                            />
                                                            <label
                                                                htmlFor={`${join.id}-left-${col}`}
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                {col}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>

                                        {/* Right Columns */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs">Select Columns (Right)</Label>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    onClick={() => selectAllColumns(join.id, 'right')}
                                                    disabled={!join.rightTable}
                                                >
                                                    Select All
                                                </Button>
                                            </div>
                                            <ScrollArea className="h-32 border rounded-md p-2">
                                                <div className="space-y-1">
                                                    {(tableColumns[join.rightTable] || []).map(col => (
                                                        <div key={col} className="flex items-center gap-2">
                                                            <Checkbox
                                                                id={`${join.id}-right-${col}`}
                                                                checked={(join.selectedColumns?.right || []).includes(col)}
                                                                onCheckedChange={() => toggleColumn(join.id, 'right', col)}
                                                            />
                                                            <label
                                                                htmlFor={`${join.id}-right-${col}`}
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                {col}
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {/* Add Another Join */}
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={addJoin}
                            disabled={joins.length >= 5}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another Join {joins.length >= 5 && '(Max 5)'}
                        </Button>

                        {/* Preview Results */}
                        {preview && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Preview (First 10 rows)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <Badge variant="outline">{preview.rowCount} rows found</Badge>
                                            <Badge variant="outline">{preview.columns?.length} columns</Badge>
                                            {preview.totalLeft && preview.totalRight && (
                                                <>
                                                    <Badge variant="secondary">Left: {preview.totalLeft} rows</Badge>
                                                    <Badge variant="secondary">Right: {preview.totalRight} rows</Badge>
                                                    {preview.rowCount > (preview.totalLeft + preview.totalRight) && (
                                                        <Badge variant="destructive" className="animate-pulse">
                                                            ⚠️ Cartesian Product Detected!
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Warning for Cartesian Product */}
                                        {preview.totalLeft && preview.totalRight && 
                                         preview.rowCount > (preview.totalLeft + preview.totalRight) && (
                                            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                                                            Warning: Unexpected Row Multiplication
                                                        </p>
                                                        <p className="text-yellow-800 dark:text-yellow-200 text-xs">
                                                            Your merge created {preview.rowCount} rows from {preview.totalLeft} + {preview.totalRight} = {preview.totalLeft + preview.totalRight} original rows. 
                                                            This usually means:
                                                        </p>
                                                        <ul className="list-disc list-inside text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                                                            <li>Join keys have <strong>duplicate values</strong> (one-to-many relationship)</li>
                                                            <li>Join keys have <strong>different data types</strong> or formats</li>
                                                            <li>Join keys contain <strong>null or empty values</strong></li>
                                                            <li>Keys don't match at all (creating a <strong>cross join</strong>)</li>
                                                        </ul>
                                                        <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-2">
                                                            <strong>Suggestions:</strong> Check your join keys, ensure they're unique identifiers (like IDs), 
                                                            or use a different join key that creates a 1:1 relationship.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <ScrollArea className="h-48 border rounded-md">
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted sticky top-0">
                                                    <tr>
                                                        {preview.columns?.map((col: string, idx: number) => (
                                                            <th key={idx} className="px-2 py-1 text-left border-r">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {preview.rows?.slice(0, 10).map((row: any[], rowIdx: number) => (
                                                        <tr key={rowIdx} className="border-b">
                                                            {row.map((cell, cellIdx) => (
                                                                <td key={cellIdx} className="px-2 py-1 border-r">
                                                                    {String(cell).substring(0, 50)}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </ScrollArea>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded-lg text-sm">
                                <AlertCircle className="h-4 w-4 text-destructive" />
                                <span className="text-destructive">{error}</span>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={previewMerge} disabled={isLoading || joins.length === 0}>
                        {isLoading ? 'Loading...' : 'Preview'}
                    </Button>
                    <Button onClick={executeMerge} disabled={isLoading || joins.length === 0}>
                        {isLoading ? 'Merging...' : 'Merge Tables'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Save Merged Table Dialog */}
        <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Save Merged Table?</DialogTitle>
                    <DialogDescription>
                        Do you want to save this merged table? It will be saved as a new file and appear in your uploads list.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="table-name">Table Name</Label>
                        <Input
                            id="table-name"
                            placeholder="e.g., Users_Projects_Merged"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSaveMergedTable()
                                }
                            }}
                        />
                    </div>
                    
                    {mergedResult && (
                        <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
                            <p className="font-semibold">Merged Table Summary:</p>
                            <p className="text-muted-foreground">• {mergedResult.rowCount} rows</p>
                            <p className="text-muted-foreground">• {mergedResult.columns?.length} columns</p>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive rounded text-sm">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{error}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleSkipSave} disabled={isSaving}>
                        Skip & View
                    </Button>
                    <Button onClick={handleSaveMergedTable} disabled={isSaving || !saveName.trim()}>
                        {isSaving ? 'Saving...' : 'Save Table'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    )
}


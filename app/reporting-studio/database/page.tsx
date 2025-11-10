'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
    Database,
    Upload,
    FileSpreadsheet,
    Table2,
    Trash2,
    Search,
    File,
    FileText,
    Plus,
    Settings2,
    Calculator,
    X,
    HelpCircle,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Link2,
    RefreshCw,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { MergeTablesDialog } from "@/components/reporting-studio/merge-tables-dialog"
import { ExternalDatabaseConnection } from "@/components/reporting-studio/external-database-connection"
import { useAuthStore } from "@/stores/authStore"

interface UploadedFile {
    id: string
    name: string
    originalName: string
    size: number
    type: string
    rowCount?: number
    columnCount?: number
    uploadedAt: string
    isMerged?: boolean // Track if this is a merged table
    source?: 'upload' | 'database' // Track if it's an uploaded file or database table
    icon?: string // Icon name for database tables
    description?: string // Description for database tables
}

interface ColumnMetadata {
    name: string
    dataType: DataType
    isCalculated?: boolean
    formula?: string
    format?: string
}

interface TableData {
    columns: string[]
    rows: any[][]
    columnMetadata?: ColumnMetadata[]
}

interface FileSettings {
    columnWidths: Record<number, number>
    columnMetadata: ColumnMetadata[]
    calculatedFields: {
        name: string
        formula: string
    }[]
}

type DataType = 'text' | 'number' | 'date' | 'boolean' | 'currency'

// Format options for different data types
const FORMAT_OPTIONS: Record<DataType, { value: string; label: string }[]> = {
    text: [],
    number: [
        { value: 'default', label: 'Default' },
        { value: '0', label: '0 (1234)' },
        { value: '0.0', label: '0.0 (1234.5)' },
        { value: '0.00', label: '0.00 (1234.56)' },
        { value: '0,0', label: '0,0 (1,234)' },
        { value: '0,0.00', label: '0,0.00 (1,234.56)' },
    ],
    currency: [
        { value: 'default', label: '$0,0.00' },
        { value: '$0,0', label: '$0,0 ($1,234)' },
        { value: '$0,0.00', label: '$0,0.00 ($1,234.56)' },
        { value: '$0.00', label: '$0.00 ($1234.56)' },
    ],
    date: [
        { value: 'default', label: 'MM/DD/YYYY' },
        { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
        { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
        { value: 'MMM DD, YYYY', label: 'Jan 01, 2024' },
        { value: 'DD MMM YYYY', label: '01 Jan 2024' },
    ],
    boolean: [],
}

const DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'currency', label: 'Currency' },
]

// Predefined formula functions
const FORMULA_FUNCTIONS = [
    {
        name: 'SUM',
        syntax: 'SUM(column1, column2, ...)',
        description: 'Add multiple columns together',
        example: 'SUM(Price, Tax)',
    },
    {
        name: 'SUBTRACT',
        syntax: 'SUBTRACT(column1, column2)',
        description: 'Subtract column2 from column1',
        example: 'SUBTRACT(Revenue, Cost)',
    },
    {
        name: 'MULTIPLY',
        syntax: 'MULTIPLY(column1, column2, ...)',
        description: 'Multiply columns together',
        example: 'MULTIPLY(Quantity, Price)',
    },
    {
        name: 'DIVIDE',
        syntax: 'DIVIDE(column1, column2)',
        description: 'Divide column1 by column2',
        example: 'DIVIDE(Profit, Revenue)',
    },
    {
        name: 'AVERAGE',
        syntax: 'AVERAGE(column1, column2, ...)',
        description: 'Calculate average of columns',
        example: 'AVERAGE(Q1_Sales, Q2_Sales, Q3_Sales, Q4_Sales)',
    },
    {
        name: 'CONCAT',
        syntax: 'CONCAT(column1, column2, ...)',
        description: 'Combine text columns',
        example: 'CONCAT(FirstName, " ", LastName)',
    },
    {
        name: 'IF',
        syntax: 'IF(condition, trueValue, falseValue)',
        description: 'Conditional logic',
        example: 'IF(Sales > 1000, "High", "Low")',
    },
    {
        name: 'PERCENT',
        syntax: 'PERCENT(column1, column2)',
        description: 'Calculate percentage (column1/column2 * 100)',
        example: 'PERCENT(Profit, Revenue)',
    },
    {
        name: 'MAX',
        syntax: 'MAX(column1, column2, ...)',
        description: 'Get maximum value',
        example: 'MAX(Q1_Sales, Q2_Sales, Q3_Sales)',
    },
    {
        name: 'MIN',
        syntax: 'MIN(column1, column2, ...)',
        description: 'Get minimum value',
        example: 'MIN(Q1_Sales, Q2_Sales, Q3_Sales)',
    },
    {
        name: 'ROUND',
        syntax: 'ROUND(column, decimals)',
        description: 'Round to specified decimal places',
        example: 'ROUND(Price, 2)',
    },
    {
        name: 'UPPER',
        syntax: 'UPPER(column)',
        description: 'Convert text to uppercase',
        example: 'UPPER(Name)',
    },
    {
        name: 'LOWER',
        syntax: 'LOWER(column)',
        description: 'Convert text to lowercase',
        example: 'LOWER(Email)',
    },
]

export default function DatabasePage() {
    const user = useAuthStore((state) => state.user)
    const isPlatformOwner = user?.role === 'PLATFORM_OWNER'
    
    const [files, setFiles] = useState<UploadedFile[]>([])
    const [databaseTables, setDatabaseTables] = useState<UploadedFile[]>([])
    const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
    const [tableData, setTableData] = useState<TableData | null>(null)
    const [columnMetadata, setColumnMetadata] = useState<ColumnMetadata[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState<'uploads' | 'database' | 'external'>('uploads')
    const [zoomLevel, setZoomLevel] = useState(100) // Zoom percentage
    const [columnWidths, setColumnWidths] = useState<Record<number, number>>({}) // Column index -> width
    const [fileToUpdate, setFileToUpdate] = useState<string | null>(null) // File ID being updated
    const [isUpdating, setIsUpdating] = useState(false)
    const [expandedExcelDB, setExpandedExcelDB] = useState(true) // Dropdown state for Excel Database
    const [expandedSavedTables, setExpandedSavedTables] = useState(true) // Dropdown state for Saved Tables
    const [resizingColumn, setResizingColumn] = useState<number | null>(null)
    const [resizeStartX, setResizeStartX] = useState(0)
    const [resizeStartWidth, setResizeStartWidth] = useState(0)
    
    // Calculated field dialog
    const [showCalculatedFieldDialog, setShowCalculatedFieldDialog] = useState(false)
    const [newFieldName, setNewFieldName] = useState("")
    const [newFieldFormula, setNewFieldFormula] = useState("")
    const [selectedFormula, setSelectedFormula] = useState("")
    const [formulaSuggestions, setFormulaSuggestions] = useState<string[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    
    // Merge tables dialog
    const [showMergeDialog, setShowMergeDialog] = useState(false)
    
    // Formula help dialog
    const [showFormulaHelp, setShowFormulaHelp] = useState(false)

    // Fetch uploaded files on mount
    useEffect(() => {
        fetchFiles()
        fetchDatabaseTables()
        // Load zoom level from localStorage
        const savedZoom = localStorage.getItem('reportingStudio_zoomLevel')
        if (savedZoom) {
            setZoomLevel(Number(savedZoom))
        }
    }, [])

    // Save zoom level to localStorage
    useEffect(() => {
        localStorage.setItem('reportingStudio_zoomLevel', String(zoomLevel))
    }, [zoomLevel])

    // Save file settings to localStorage
    useEffect(() => {
        if (selectedFile && tableData) {
            const settings: FileSettings = {
                columnWidths,
                columnMetadata,
                calculatedFields: columnMetadata
                    .filter(col => col.isCalculated)
                    .map(col => ({
                        name: col.name,
                        formula: col.formula || ''
                    }))
            }
            localStorage.setItem(`reportingStudio_file_${selectedFile.id}`, JSON.stringify(settings))
        }
    }, [selectedFile, columnWidths, columnMetadata, tableData])

    // Handle column resize
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (resizingColumn !== null) {
                const delta = e.clientX - resizeStartX
                const newWidth = Math.max(100, resizeStartWidth + delta) // Min width 100px
                setColumnWidths(prev => ({
                    ...prev,
                    [resizingColumn]: newWidth
                }))
            }
        }

        const handleMouseUp = () => {
            setResizingColumn(null)
        }

        if (resizingColumn !== null) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizingColumn, resizeStartX, resizeStartWidth])

    const fetchFiles = async () => {
        try {
            const response = await fetch('/api/reporting-studio/files')
            if (response.ok) {
                const data = await response.json()
                const filesWithSource = (data.files || []).map((file: UploadedFile) => ({
                    ...file,
                    source: 'upload' as const
                }))
                setFiles(filesWithSource)
            }
        } catch (error) {
            console.error('Error fetching files:', error)
        }
    }

    const fetchDatabaseTables = async () => {
        try {
            const response = await fetch('/api/reporting-studio/database-tables')
            if (response.ok) {
                const data = await response.json()
                const tablesAsFiles = (data.tables || []).map((table: any) => ({
                    id: table.id,
                    name: table.name,
                    originalName: table.name,
                    size: 0, // Database tables don't have file size
                    type: 'database_table',
                    rowCount: table.rowCount,
                    columnCount: 0,
                    uploadedAt: new Date().toISOString(),
                    source: 'database' as const,
                    icon: table.icon,
                    description: table.description,
                }))
                setDatabaseTables(tablesAsFiles)
            }
        } catch (error) {
            console.error('Error fetching database tables:', error)
        }
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['.csv', '.xlsx', '.xls']
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
        if (!allowedTypes.includes(fileExt)) {
            alert('Please upload only CSV or Excel files')
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/reporting-studio/upload', {
                method: 'POST',
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                alert('File uploaded successfully!')
                fetchFiles()
                // Clear the input
                event.target.value = ''
            } else {
                const error = await response.json()
                alert(error.error || 'Failed to upload file')
            }
        } catch (error) {
            console.error('Error uploading file:', error)
            alert('Failed to upload file. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    const detectDataType = (values: any[]): DataType => {
        // Sample first 10 non-null values
        const sample = values.filter(v => v !== null && v !== undefined && v !== '').slice(0, 10)
        if (sample.length === 0) return 'text'

        const allNumbers = sample.every(v => !isNaN(Number(v)))
        if (allNumbers) {
            // Check if it looks like currency
            const hasCurrencySymbol = sample.some(v => String(v).match(/[$€£¥]/))
            if (hasCurrencySymbol) return 'currency'
            return 'number'
        }

        const allBooleans = sample.every(v => 
            ['true', 'false', '1', '0', 'yes', 'no'].includes(String(v).toLowerCase())
        )
        if (allBooleans) return 'boolean'

        const allDates = sample.every(v => !isNaN(Date.parse(String(v))))
        if (allDates) return 'date'

        return 'text'
    }

    const handleFileSelect = async (file: UploadedFile) => {
        setSelectedFile(file)
        setIsLoadingData(true)
        setTableData(null)
        setColumnMetadata([])
        setColumnWidths({})

        try {
            // Determine API endpoint based on source
            const apiUrl = file.source === 'database'
                ? `/api/reporting-studio/database-tables/${file.id}`
                : `/api/reporting-studio/preview/${file.id}`
            
            const response = await fetch(apiUrl)
            if (response.ok) {
                const data = await response.json()
                
                // Check for saved settings
                const savedSettingsStr = localStorage.getItem(`reportingStudio_file_${file.id}`)
                let savedSettings: FileSettings | null = null
                
                if (savedSettingsStr) {
                    try {
                        savedSettings = JSON.parse(savedSettingsStr)
                    } catch (e) {
                        console.error('Error parsing saved settings:', e)
                    }
                }

                // Auto-detect data types for each column
                const metadata: ColumnMetadata[] = data.columns.map((colName: string, idx: number) => {
                    const columnValues = data.rows.map((row: any[]) => row[idx])
                    
                    // Check if we have saved metadata for this column
                    const savedMeta = savedSettings?.columnMetadata.find(m => m.name === colName)
                    
                    return {
                        name: colName,
                        dataType: savedMeta?.dataType || detectDataType(columnValues),
                        isCalculated: false,
                    }
                })

                // Restore calculated fields
                if (savedSettings?.calculatedFields) {
                    savedSettings.calculatedFields.forEach(calcField => {
                        // Calculate values for all rows
                        const newRows = data.rows.map((row: any[]) => {
                            const calculatedValue = evaluateFormula(calcField.formula, row, data.columns)
                            return [...row, calculatedValue]
                        })
                        
                        data.columns.push(calcField.name)
                        data.rows = newRows
                        
                        metadata.push({
                            name: calcField.name,
                            dataType: 'number',
                            isCalculated: true,
                            formula: calcField.formula,
                        })
                    })
                }

                setTableData(data)
                setColumnMetadata(metadata)
                
                // Restore column widths
                if (savedSettings?.columnWidths) {
                    setColumnWidths(savedSettings.columnWidths)
                }
            } else {
                alert('Failed to load file preview')
            }
        } catch (error) {
            console.error('Error loading file preview:', error)
            alert('Failed to load file preview')
        } finally {
            setIsLoadingData(false)
        }
    }

    const handleDeleteFile = async (fileId: string, fileName: string) => {
        if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/reporting-studio/files/${fileId}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                alert('File deleted successfully!')
                fetchFiles()
                if (selectedFile?.id === fileId) {
                    setSelectedFile(null)
                    setTableData(null)
                    setColumnMetadata([])
                    setColumnWidths({})
                }
            } else {
                alert('Failed to delete file')
            }
        } catch (error) {
            console.error('Error deleting file:', error)
            alert('Failed to delete file')
        }
    }

    const handleUpdateFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file || !fileToUpdate) return

        setIsUpdating(true)

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/reporting-studio/files/${fileToUpdate}/update`, {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (response.ok) {
                // Refresh file list
                await fetchFiles()
                
                // Re-merge dependent files if any
                if (result.dependentFiles && result.dependentFiles.length > 0) {
                    const remergeTasks = result.dependentFiles.map(async (dep: any) => {
                        return fetch('/api/reporting-studio/remerge', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ fileId: dep.id })
                        })
                    })
                    
                    await Promise.all(remergeTasks)
                    alert(`File updated successfully! ${result.dependentFiles.length} merged file(s) were automatically updated.`)
                } else {
                    alert('File updated successfully!')
                }
                
                // Reload the current file if it's selected
                if (selectedFile?.id === fileToUpdate) {
                    const updatedFile = files.find(f => f.id === fileToUpdate)
                    if (updatedFile) {
                        handleFileSelect(updatedFile)
                    }
                }
            } else {
                if (result.error === 'Header mismatch') {
                    alert(`Header mismatch error:\n\nOld headers: ${result.oldHeaders.join(', ')}\n\nNew headers: ${result.newHeaders.join(', ')}\n\nPlease ensure the new file has the same column headers.`)
                } else {
                    alert(`Failed to update file: ${result.error || 'Unknown error'}`)
                }
            }
        } catch (error) {
            console.error('Error updating file:', error)
            alert('Error updating file')
        } finally {
            setIsUpdating(false)
            setFileToUpdate(null)
            // Reset the file input
            event.target.value = ''
        }
    }

    const handleZoomIn = () => {
        setZoomLevel(prev => Math.min(200, prev + 10)) // Max 200%
    }

    const handleZoomOut = () => {
        setZoomLevel(prev => Math.max(50, prev - 10)) // Min 50%
    }

    const handleResetZoom = () => {
        setZoomLevel(100)
    }

    const handleStartResize = (columnIndex: number, startX: number, currentWidth: number) => {
        setResizingColumn(columnIndex)
        setResizeStartX(startX)
        setResizeStartWidth(currentWidth)
    }

    const getColumnWidth = (columnIndex: number) => {
        return columnWidths[columnIndex] || 200 // Default 200px
    }

    const evaluateFormula = (formula: string, row: any[], columns: string[]): any => {
        try {
            // Create a safe context with column names as variables
            const context: any = {}
            columns.forEach((col, idx) => {
                // Store both original column name and sanitized version
                context[col] = row[idx]
                context[col.replace(/[^a-zA-Z0-9_]/g, '_')] = row[idx]
            })

            // Parse and evaluate formula
            let result = formula

            // SUM function
            result = result.replace(/SUM\(([^)]+)\)/gi, (match, args) => {
                const cols = args.split(',').map((c: string) => c.trim())
                const sum = cols.reduce((acc: number, col: string) => {
                    // Try both original and sanitized column name
                    const value = context[col] !== undefined ? context[col] : context[col.replace(/[^a-zA-Z0-9_]/g, '_')]
                    const numValue = Number(value)
                    return acc + (isNaN(numValue) ? 0 : numValue)
                }, 0)
                return String(sum)
            })

            // MULTIPLY function
            result = result.replace(/MULTIPLY\(([^)]+)\)/gi, (match, args) => {
                const cols = args.split(',').map((c: string) => c.trim())
                let product = 1
                for (const col of cols) {
                    const value = context[col] !== undefined ? context[col] : context[col.replace(/[^a-zA-Z0-9_]/g, '_')]
                    const numValue = Number(value)
                    if (isNaN(numValue)) return '0'
                    product *= numValue
                }
                return String(product)
            })

            // DIVIDE function
            result = result.replace(/DIVIDE\(([^,]+),([^)]+)\)/gi, (match, col1, col2) => {
                const c1 = col1.trim()
                const c2 = col2.trim()
                const val1 = context[c1] !== undefined ? context[c1] : context[c1.replace(/[^a-zA-Z0-9_]/g, '_')]
                const val2 = context[c2] !== undefined ? context[c2] : context[c2.replace(/[^a-zA-Z0-9_]/g, '_')]
                const num1 = Number(val1)
                const num2 = Number(val2)
                if (isNaN(num1) || isNaN(num2) || num2 === 0) return '0'
                return String(num1 / num2)
            })

            // SUBTRACT function
            result = result.replace(/SUBTRACT\(([^,]+),([^)]+)\)/gi, (match, col1, col2) => {
                const c1 = col1.trim()
                const c2 = col2.trim()
                const val1 = context[c1] !== undefined ? context[c1] : context[c1.replace(/[^a-zA-Z0-9_]/g, '_')]
                const val2 = context[c2] !== undefined ? context[c2] : context[c2.replace(/[^a-zA-Z0-9_]/g, '_')]
                const num1 = Number(val1)
                const num2 = Number(val2)
                if (isNaN(num1) || isNaN(num2)) return '0'
                return String(num1 - num2)
            })

            // AVERAGE function
            result = result.replace(/AVERAGE\(([^)]+)\)/gi, (match, args) => {
                const cols = args.split(',').map((c: string) => c.trim())
                let sum = 0
                let count = 0
                for (const col of cols) {
                    const value = context[col] !== undefined ? context[col] : context[col.replace(/[^a-zA-Z0-9_]/g, '_')]
                    const numValue = Number(value)
                    if (!isNaN(numValue)) {
                        sum += numValue
                        count++
                    }
                }
                return count > 0 ? String(sum / count) : '0'
            })

            // PERCENT function
            result = result.replace(/PERCENT\(([^,]+),([^)]+)\)/gi, (match, col1, col2) => {
                const c1 = col1.trim()
                const c2 = col2.trim()
                const val1 = context[c1] !== undefined ? context[c1] : context[c1.replace(/[^a-zA-Z0-9_]/g, '_')]
                const val2 = context[c2] !== undefined ? context[c2] : context[c2.replace(/[^a-zA-Z0-9_]/g, '_')]
                const num1 = Number(val1)
                const num2 = Number(val2)
                if (isNaN(num1) || isNaN(num2) || num2 === 0) return '0'
                return String((num1 / num2) * 100)
            })

            // CONCAT function
            result = result.replace(/CONCAT\(([^)]+)\)/gi, (match, args) => {
                const parts = args.split(',').map((part: string) => {
                    const trimmed = part.trim()
                    // Handle quoted strings
                    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
                        return trimmed.slice(1, -1)
                    }
                    // Handle column references
                    const value = context[trimmed] !== undefined ? context[trimmed] : context[trimmed.replace(/[^a-zA-Z0-9_]/g, '_')]
                    return value !== undefined ? String(value) : ''
                })
                return parts.join('')
            })

            // MAX function
            result = result.replace(/MAX\(([^)]+)\)/gi, (match, args) => {
                const cols = args.split(',').map((c: string) => c.trim())
                let max = -Infinity
                for (const col of cols) {
                    const value = context[col] !== undefined ? context[col] : context[col.replace(/[^a-zA-Z0-9_]/g, '_')]
                    const numValue = Number(value)
                    if (!isNaN(numValue) && numValue > max) {
                        max = numValue
                    }
                }
                return max === -Infinity ? '0' : String(max)
            })

            // MIN function
            result = result.replace(/MIN\(([^)]+)\)/gi, (match, args) => {
                const cols = args.split(',').map((c: string) => c.trim())
                let min = Infinity
                for (const col of cols) {
                    const value = context[col] !== undefined ? context[col] : context[col.replace(/[^a-zA-Z0-9_]/g, '_')]
                    const numValue = Number(value)
                    if (!isNaN(numValue) && numValue < min) {
                        min = numValue
                    }
                }
                return min === Infinity ? '0' : String(min)
            })

            // ROUND function
            result = result.replace(/ROUND\(([^,]+),([^)]+)\)/gi, (match, col, decimals) => {
                const c = col.trim()
                const value = context[c] !== undefined ? context[c] : context[c.replace(/[^a-zA-Z0-9_]/g, '_')]
                const numValue = Number(value)
                const dec = Number(decimals.trim())
                if (isNaN(numValue) || isNaN(dec)) return '0'
                return String(numValue.toFixed(dec))
            })

            // UPPER function
            result = result.replace(/UPPER\(([^)]+)\)/gi, (match, col) => {
                const c = col.trim()
                const value = context[c] !== undefined ? context[c] : context[c.replace(/[^a-zA-Z0-9_]/g, '_')]
                return value !== undefined ? String(value).toUpperCase() : ''
            })

            // LOWER function
            result = result.replace(/LOWER\(([^)]+)\)/gi, (match, col) => {
                const c = col.trim()
                const value = context[c] !== undefined ? context[c] : context[c.replace(/[^a-zA-Z0-9_]/g, '_')]
                return value !== undefined ? String(value).toLowerCase() : ''
            })

            return result
        } catch (error) {
            console.error('Formula evaluation error:', error)
            return 'ERROR'
        }
    }

    const handleFormulaChange = (value: string) => {
        setNewFieldFormula(value)
        
        // Get the last word being typed (potential column name)
        const words = value.split(/[\s,()]+/)
        const lastWord = words[words.length - 1]
        
        if (lastWord && tableData) {
            // Filter columns that start with the last word
            const matches = tableData.columns.filter(col => 
                col.toLowerCase().startsWith(lastWord.toLowerCase())
            )
            setFormulaSuggestions(matches)
            setShowSuggestions(matches.length > 0)
        } else {
            setShowSuggestions(false)
        }
    }

    const handleFormulaSelect = (functionName: string, syntax: string) => {
        setSelectedFormula(functionName)
        // Just add function name with empty brackets
        setNewFieldFormula(`${functionName}()`)
        // Don't auto-show suggestions - columns are already displayed below
        setShowSuggestions(false)
    }

    const handleSuggestionClick = (suggestion: string) => {
        // Check if there's a function with open brackets
        const hasOpenBracket = newFieldFormula.includes('(')
        const hasCloseBracket = newFieldFormula.includes(')')
        
        if (hasOpenBracket) {
            // Insert column name between brackets
            const beforeClosing = newFieldFormula.lastIndexOf(')')
            const insideParens = newFieldFormula.substring(newFieldFormula.indexOf('(') + 1, beforeClosing)
            
            // Add comma if there are already columns inside
            const newContent = insideParens.trim() ? `${insideParens}, ${suggestion}` : suggestion
            const functionPart = newFieldFormula.substring(0, newFieldFormula.indexOf('(') + 1)
            
            setNewFieldFormula(`${functionPart}${newContent})`)
        } else {
            // Just append if no function selected
            setNewFieldFormula(prev => prev + (prev ? ', ' : '') + suggestion)
        }
        setShowSuggestions(false)
    }

    const handleAddCalculatedField = () => {
        if (!newFieldName || !newFieldFormula || !tableData) {
            alert('Please provide both field name and formula')
            return
        }

        // Add new column to metadata
        const newMetadata: ColumnMetadata = {
            name: newFieldName,
            dataType: 'number',
            isCalculated: true,
            formula: newFieldFormula,
        }

        // Calculate values for all rows
        const newRows = tableData.rows.map(row => {
            const calculatedValue = evaluateFormula(newFieldFormula, row, tableData.columns)
            return [...row, calculatedValue]
        })

        setTableData({
            ...tableData,
            columns: [...tableData.columns, newFieldName],
            rows: newRows,
        })

        setColumnMetadata([...columnMetadata, newMetadata])
        setShowCalculatedFieldDialog(false)
        setNewFieldName("")
        setNewFieldFormula("")
        setSelectedFormula("")
        setShowSuggestions(false)
    }

    const handleDataTypeChange = (columnIndex: number, newType: DataType) => {
        const newMetadata = [...columnMetadata]
        newMetadata[columnIndex] = {
            ...newMetadata[columnIndex],
            dataType: newType,
            format: 'default',
        }
        setColumnMetadata(newMetadata)
    }

    const handleFormatChange = (columnIndex: number, newFormat: string) => {
        const newMetadata = [...columnMetadata]
        newMetadata[columnIndex] = {
            ...newMetadata[columnIndex],
            format: newFormat,
        }
        setColumnMetadata(newMetadata)
    }

    const handleRemoveCalculatedField = (columnIndex: number) => {
        if (!tableData || !columnMetadata[columnIndex].isCalculated) return

        if (!confirm(`Remove calculated field "${columnMetadata[columnIndex].name}"?`)) {
            return
        }

        const newColumns = tableData.columns.filter((_, idx) => idx !== columnIndex)
        const newRows = tableData.rows.map(row => row.filter((_, idx) => idx !== columnIndex))
        const newMetadata = columnMetadata.filter((_, idx) => idx !== columnIndex)

        setTableData({ ...tableData, columns: newColumns, rows: newRows })
        setColumnMetadata(newMetadata)
    }

    const handleMergeComplete = (mergedData: any) => {
        // Create a synthetic file object for the merged data
        const mergedFile: UploadedFile = {
            id: `merged_${Date.now()}`,
            name: 'Merged Tables',
            originalName: 'Merged Tables',
            size: 0,
            type: 'merged',
            rowCount: mergedData.rowCount,
            columnCount: mergedData.columns?.length || 0,
            uploadedAt: new Date().toISOString(),
            source: 'upload',
        }

        setSelectedFile(mergedFile)
        setTableData({
            columns: mergedData.columns || [],
            rows: mergedData.rows || [],
        })

        // Auto-detect data types
        const metadata: ColumnMetadata[] = mergedData.columns.map((colName: string, idx: number) => {
            const columnValues = mergedData.rows.map((row: any[]) => row[idx])
            return {
                name: colName,
                dataType: detectDataType(columnValues),
                isCalculated: false,
            }
        })

        setColumnMetadata(metadata)
        setColumnWidths({})
    }

    const filteredFiles = files.filter(file =>
        file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredDatabaseTables = databaseTables.filter(table =>
        table.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
    }

    const getFileIcon = (type: string) => {
        if (type.includes('csv')) return <FileText className="h-4 w-4" />
        if (type.includes('excel') || type.includes('spreadsheet')) return <FileSpreadsheet className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const formatCellValue = (value: any, dataType: DataType, format?: string) => {
        if (value === null || value === undefined || value === '') return ''
        
        try {
            switch (dataType) {
                case 'number': {
                    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
                    if (isNaN(num)) return String(value)
                    
                    // Apply number formatting
                    if (format === '0') return Math.round(num).toString()
                    if (format === '0.0') return num.toFixed(1)
                    if (format === '0.00') return num.toFixed(2)
                    if (format === '0,0') return Math.round(num).toLocaleString()
                    if (format === '0,0.00') return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    
                    return num.toLocaleString()
                }
                
                case 'currency': {
                    const num = typeof value === 'string' ? parseFloat(String(value).replace(/[^0-9.-]/g, '')) : Number(value)
                    if (isNaN(num)) return String(value)
                    
                    // Apply currency formatting
                    if (format === '$0,0') return '$' + Math.round(num).toLocaleString()
                    if (format === '$0.00') return '$' + num.toFixed(2)
                    
                    // Default: $0,0.00
                    return '$' + num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                }
                
                case 'date': {
                    let date: Date | null = null
                    const dateValue = String(value)
                    
                    // Check if it's an Excel serial date number (typically 5 digits)
                    if (/^\d{5}$/.test(dateValue)) {
                        const excelEpoch = new Date(1900, 0, 1)
                        const serialNumber = parseInt(dateValue)
                        const daysSinceEpoch = serialNumber - 2
                        date = new Date(excelEpoch.getTime() + daysSinceEpoch * 24 * 60 * 60 * 1000)
                    } else {
                        const parsed = new Date(dateValue)
                        if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900) {
                            date = parsed
                        }
                    }
                    
                    if (!date || isNaN(date.getTime())) return String(value)
                    
                    // Apply date formatting
                    const month = String(date.getMonth() + 1).padStart(2, '0')
                    const day = String(date.getDate()).padStart(2, '0')
                    const year = date.getFullYear()
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    const monthName = monthNames[date.getMonth()]
                    
                    if (format === 'DD/MM/YYYY') return `${day}/${month}/${year}`
                    if (format === 'YYYY-MM-DD') return `${year}-${month}-${day}`
                    if (format === 'MMM DD, YYYY') return `${monthName} ${day}, ${year}`
                    if (format === 'DD MMM YYYY') return `${day} ${monthName} ${year}`
                    
                    // Default: MM/DD/YYYY
                    return `${month}/${day}/${year}`
                }
                
                case 'boolean': {
                    const boolValue = String(value).toLowerCase()
                    if (['true', '1', 'yes'].includes(boolValue)) return 'Yes'
                    if (['false', '0', 'no'].includes(boolValue)) return 'No'
                    return String(value)
                }
                
                default:
                    return String(value)
            }
        } catch (error) {
            return String(value)
        }
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex">
            {/* Sidebar - File List */}
            <div className="w-80 h-full border-r bg-card flex flex-col flex-shrink-0">
                <div className="p-4 border-b space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Data Sources
                        </h2>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-muted p-1 rounded-lg">
                        <button
                            onClick={() => setActiveTab('uploads')}
                            className={cn(
                                "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                activeTab === 'uploads' 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Upload className="h-3 w-3 inline mr-1" />
                            Uploads ({files.length})
                        </button>
                        
                        <button
                            onClick={() => setActiveTab('external')}
                            className={cn(
                                "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                activeTab === 'external' 
                                    ? "bg-background text-foreground shadow-sm" 
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Database className="h-3 w-3 inline mr-1" />
                            Connections
                        </button>
                        
                        {/* Only show Tables tab for Platform Owners */}
                        {isPlatformOwner && (
                            <button
                                onClick={() => setActiveTab('database')}
                                className={cn(
                                    "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-colors",
                                    activeTab === 'database' 
                                        ? "bg-background text-foreground shadow-sm" 
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Table2 className="h-3 w-3 inline mr-1" />
                                Tables ({databaseTables.length})
                            </button>
                        )}
                    </div>

                    {/* Upload Button - Only show for uploads tab */}
                    {activeTab === 'uploads' && (
                        <div>
                            <input
                                type="file"
                                id="file-upload"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                            <input
                                type="file"
                                id="file-update"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleUpdateFile}
                                className="hidden"
                            />
                            <Button
                                onClick={() => document.getElementById('file-upload')?.click()}
                                disabled={isUploading}
                                className="w-full"
                                size="sm"
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {isUploading ? 'Uploading...' : 'Upload File'}
                            </Button>
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={activeTab === 'uploads' ? "Search files..." : "Search tables..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* File/Table List */}
                <ScrollArea className="flex-1 overflow-hidden">
                    <div className="p-2 space-y-3">
                        {activeTab === 'external' ? (
                            <div className="text-center py-8 px-4">
                                <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    Manage your external database connections in the main panel
                                </p>
                            </div>
                        ) : activeTab === 'uploads' ? (
                            <>
                                {/* Excel Database Dropdown */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setExpandedExcelDB(!expandedExcelDB)}
                                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                                    >
                                        <span>Excel Database</span>
                                        {expandedExcelDB ? (
                                            <ChevronDown className="h-3 w-3" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3" />
                                        )}
                                    </button>
                                    {expandedExcelDB && (
                                        <>
                                            {filteredFiles.filter(f => !f.isMerged).length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground text-xs">
                                                    No uploaded files yet
                                                </div>
                                            ) : (
                                                filteredFiles.filter(f => !f.isMerged).map((file) => (
                                            <div
                                                key={file.id}
                                                className={cn(
                                                    "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent group",
                                                    selectedFile?.id === file.id && "bg-primary/10 border-primary"
                                                )}
                                                onClick={() => handleFileSelect(file)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        {getFileIcon(file.type)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {file.originalName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setFileToUpdate(file.id)
                                                                document.getElementById('file-update')?.click()
                                                            }}
                                                            disabled={isUpdating}
                                                            title="Update file"
                                                        >
                                                            <RefreshCw className={cn("h-3 w-3 text-primary", isUpdating && fileToUpdate === file.id && "animate-spin")} />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDeleteFile(file.id, file.originalName)
                                                            }}
                                                            title="Delete file"
                                                        >
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                        </>
                                    )}
                                </div>

                                {/* Saved Tables Dropdown */}
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setExpandedSavedTables(!expandedSavedTables)}
                                        className="w-full flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-t pt-3 hover:text-foreground transition-colors"
                                    >
                                        <span>Saved Tables</span>
                                        {expandedSavedTables ? (
                                            <ChevronDown className="h-3 w-3" />
                                        ) : (
                                            <ChevronRight className="h-3 w-3" />
                                        )}
                                    </button>
                                    {expandedSavedTables && (
                                        <>
                                            {filteredFiles.filter(f => f.isMerged).length === 0 ? (
                                                <div className="text-center py-4 text-muted-foreground text-xs">
                                                    No saved tables yet
                                                </div>
                                            ) : (
                                                filteredFiles.filter(f => f.isMerged).map((file) => (
                                            <div
                                                key={file.id}
                                                className={cn(
                                                    "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent group",
                                                    selectedFile?.id === file.id && "bg-primary/10 border-primary"
                                                )}
                                                onClick={() => handleFileSelect(file)}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-start gap-2 flex-1 min-w-0">
                                                        <Link2 className="h-4 w-4 text-primary" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {file.originalName}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteFile(file.id, file.originalName)
                                                        }}
                                                        title="Delete table"
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                        </>
                                    )}
                                </div>
                            </>
                            ) : (
                            filteredDatabaseTables.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    {databaseTables.length === 0 ? 'No database tables found' : 'No tables match your search'}
                                </div>
                            ) : (
                                filteredDatabaseTables.map((table) => (
                                    <div
                                        key={table.id}
                                        className={cn(
                                            "p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent group",
                                            selectedFile?.id === table.id && "bg-primary/10 border-primary"
                                        )}
                                        onClick={() => handleFileSelect(table)}
                                    >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <Table2 className="h-4 w-4 text-primary mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {table.name}
                                                </p>
                                                {table.description && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                        {table.description}
                                                    </p>
                                                )}
                                                {table.rowCount !== undefined && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-muted-foreground">
                                                            {table.rowCount} records
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Area - Data Preview */}
            <div className="flex-1 h-full flex flex-col min-w-0">
                {/* Header */}
                <div className="p-4 border-b bg-card flex-shrink-0">
                    {activeTab === 'external' ? (
                        <div>
                            <h1 className="text-2xl font-bold">External Database Connections</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Connect your own SQL databases to import and analyze data
                            </p>
                        </div>
                    ) : selectedFile ? (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h1 className="text-2xl font-bold">{selectedFile.originalName}</h1>
                                <div className="flex gap-2 items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowCalculatedFieldDialog(true)}
                                        disabled={!tableData}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Calculated Field
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowMergeDialog(true)}
                                    >
                                        <Link2 className="mr-2 h-4 w-4" />
                                        Merge Tables
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFormulaHelp(true)}
                                    >
                                        <HelpCircle className="mr-2 h-4 w-4" />
                                        Formula Help
                                    </Button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {selectedFile.rowCount && (
                                    <span className="flex items-center gap-1">
                                        <Table2 className="h-4 w-4" />
                                        {selectedFile.rowCount} rows × {selectedFile.columnCount} columns
                                    </span>
                                )}
                                <span>•</span>
                                <span>{formatFileSize(selectedFile.size)}</span>
                                <span>•</span>
                                <span>Uploaded {new Date(selectedFile.uploadedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-2xl font-bold">Database Explorer</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Upload and preview your data files
                            </p>
                        </div>
                    )}
                </div>

                {/* Content - Fixed Height Container with Scrolling */}
                <div className="flex-1 overflow-auto bg-background min-h-0">
                    {activeTab === 'external' ? (
                        <div className="p-6">
                            <ExternalDatabaseConnection />
                        </div>
                    ) : !selectedFile ? (
                        <div className="flex items-center justify-center h-full bg-background">
                            <div className="text-center">
                                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-lg font-medium text-muted-foreground">
                                    No file selected
                                </p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Select a file from the sidebar to preview its data
                                </p>
                            </div>
                        </div>
                    ) : isLoadingData ? (
                        <div className="flex items-center justify-center h-full bg-background">
                            <div className="text-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">Loading data...</p>
                            </div>
                        </div>
                    ) : tableData ? (
                        <table className="border-collapse bg-white" style={{ minWidth: '100%', width: 'max-content' }}>
                            <thead className="bg-muted sticky top-0 z-10">
                                <tr>
                                    {tableData.columns.map((column, idx) => (
                                        <th
                                            key={idx}
                                            className="px-3 py-2 text-left border-b border-r relative bg-muted"
                                            style={{ 
                                                width: getColumnWidth(idx),
                                                minWidth: '120px'
                                            }}
                                        >
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-xs font-semibold truncate">{column}</span>
                                                    {columnMetadata[idx]?.isCalculated && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-4 w-4 flex-shrink-0"
                                                            onClick={() => handleRemoveCalculatedField(idx)}
                                                        >
                                                            <X className="h-2.5 w-2.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {columnMetadata[idx]?.isCalculated ? (
                                                        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                                            <Calculator className="h-2.5 w-2.5 mr-0.5" />
                                                            Calc
                                                        </Badge>
                                                    ) : (
                                                        <>
                                                            <Select
                                                                value={columnMetadata[idx]?.dataType || 'text'}
                                                                onValueChange={(value) => handleDataTypeChange(idx, value as DataType)}
                                                            >
                                                                <SelectTrigger className="h-5 text-[10px] w-20 px-1.5">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {DATA_TYPES.map((type) => (
                                                                        <SelectItem key={type.value} value={type.value} className="text-xs">
                                                                            {type.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            {FORMAT_OPTIONS[columnMetadata[idx]?.dataType || 'text'].length > 0 && (
                                                                <Select
                                                                    value={columnMetadata[idx]?.format || 'default'}
                                                                    onValueChange={(value) => handleFormatChange(idx, value)}
                                                                >
                                                                    <SelectTrigger className="h-5 text-[10px] w-24 px-1.5">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {FORMAT_OPTIONS[columnMetadata[idx]?.dataType || 'text'].map((fmt) => (
                                                                            <SelectItem key={fmt.value} value={fmt.value} className="text-xs">
                                                                                {fmt.label}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                                {columnMetadata[idx]?.isCalculated && (
                                                    <div className="text-[9px] text-muted-foreground font-mono bg-muted-foreground/10 px-1.5 py-0.5 rounded truncate max-w-[150px]" title={columnMetadata[idx].formula}>
                                                        {columnMetadata[idx].formula}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Resize Handle */}
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary transition-colors"
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    handleStartResize(idx, e.clientX, getColumnWidth(idx))
                                                }}
                                                title="Drag to resize column"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.rows.map((row, rowIdx) => (
                                    <tr
                                        key={rowIdx}
                                        className="hover:bg-accent/50 transition-colors"
                                    >
                                        {row.map((cell, cellIdx) => (
                                            <td
                                                key={cellIdx}
                                                className="px-3 py-1.5 text-xs border-b border-r whitespace-nowrap bg-white"
                                                style={{ 
                                                    width: getColumnWidth(cellIdx)
                                                }}
                                            >
                                                {formatCellValue(cell, columnMetadata[cellIdx]?.dataType || 'text', columnMetadata[cellIdx]?.format)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <p className="text-muted-foreground">Failed to load data</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Calculated Field Dialog */}
            <Dialog open={showCalculatedFieldDialog} onOpenChange={setShowCalculatedFieldDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Add Calculated Field</DialogTitle>
                        <DialogDescription>
                            Create a new column based on a formula using existing columns
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="field-name">Field Name</Label>
                                <Input
                                    id="field-name"
                                    placeholder="e.g., Total_Price"
                                    value={newFieldName}
                                    onChange={(e) => setNewFieldName(e.target.value)}
                                />
                            </div>
                            
                            {/* Formula Selector */}
                            <div className="space-y-2">
                                <Label>Select Formula</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto p-2 border rounded-lg bg-muted/30">
                                    {FORMULA_FUNCTIONS.map((func) => (
                                        <Button
                                            key={func.name}
                                            variant={selectedFormula === func.name ? "default" : "outline"}
                                            size="sm"
                                            className="justify-start text-xs h-auto py-2 px-3"
                                            onClick={() => handleFormulaSelect(func.name, func.syntax)}
                                            type="button"
                                        >
                                            <div className="text-left w-full">
                                                <div className="font-semibold">{func.name}</div>
                                                <div className="text-[10px] opacity-70 truncate">{func.description}</div>
                                            </div>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="formula">Formula</Label>
                                <div className="relative">
                                    <Textarea
                                        id="formula"
                                        placeholder="Select a formula above, then choose columns"
                                        value={newFieldFormula}
                                        onChange={(e) => handleFormulaChange(e.target.value)}
                                        onFocus={() => {
                                            if (formulaSuggestions.length > 0) {
                                                setShowSuggestions(true)
                                            }
                                        }}
                                        rows={3}
                                        className="font-mono"
                                    />
                                    {showSuggestions && formulaSuggestions.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-auto">
                                            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b bg-muted/50">
                                                Choose fields for calculation:
                                            </div>
                                            {formulaSuggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    type="button"
                                                >
                                                    <Table2 className="h-3 w-3 text-muted-foreground" />
                                                    <span className="font-medium">{suggestion}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-muted/50 p-3 rounded text-xs space-y-2">
                                    <p className="font-semibold">Available columns - Click to insert:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {tableData?.columns.map((col, idx) => (
                                            <Badge 
                                                key={idx} 
                                                variant="outline" 
                                                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                                onClick={() => handleSuggestionClick(col)}
                                            >
                                                {col}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            {selectedFormula && (
                                <div className="bg-muted/30 p-2 rounded text-xs">
                                    <p className="font-semibold text-muted-foreground">
                                        {FORMULA_FUNCTIONS.find(f => f.name === selectedFormula)?.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter className="flex-shrink-0">
                        <Button variant="outline" onClick={() => {
                            setShowCalculatedFieldDialog(false)
                            setSelectedFormula("")
                            setNewFieldName("")
                            setNewFieldFormula("")
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddCalculatedField}>
                            Add Field
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Merge Tables Dialog */}
            <MergeTablesDialog
                open={showMergeDialog}
                onOpenChange={setShowMergeDialog}
                tables={[...databaseTables, ...files].map(t => ({
                    id: t.id,
                    name: t.name,
                    rowCount: t.rowCount,
                }))}
                currentTable={selectedFile ? {
                    id: selectedFile.id,
                    name: selectedFile.name,
                    rowCount: selectedFile.rowCount,
                } : null}
                onMerge={handleMergeComplete}
                onSaved={fetchFiles}
            />

            {/* Formula Help Dialog */}
            <Dialog open={showFormulaHelp} onOpenChange={setShowFormulaHelp}>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                    <DialogHeader>
                        <DialogTitle>Formula Functions Reference</DialogTitle>
                        <DialogDescription>
                            Use these functions to create calculated fields
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] pr-4">
                        <div className="space-y-4">
                            {FORMULA_FUNCTIONS.map((func, idx) => (
                                <Card key={idx}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Calculator className="h-4 w-4" />
                                            {func.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Syntax:</p>
                                            <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                                                {func.syntax}
                                            </code>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Description:</p>
                                            <p className="text-sm mt-1">{func.description}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-muted-foreground">Example:</p>
                                            <code className="text-sm bg-primary/10 px-2 py-1 rounded block mt-1">
                                                {func.example}
                                            </code>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setShowFormulaHelp(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

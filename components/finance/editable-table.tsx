'use client'

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit2,
  Trash2,
  MoreHorizontal,
  GripVertical,
  X,
  Check,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TableCell {
  id: string
  value: string
}

type RowHierarchy = 'normal' | 'header' | 'subheader' | 'section' | 'subsection'

interface TableRow {
  id: string
  name: string
  cells: TableCell[]
  hierarchy?: RowHierarchy
}

interface TableColumn {
  id: string
  name: string
}

interface EditableTableProps {
  initialRows?: TableRow[]
  initialColumns?: TableColumn[]
}

export function EditableTable({
  initialRows = [],
  initialColumns = [],
}: EditableTableProps) {
  const STORAGE_KEY = 'editable-table-budget-data'

  // Initialize state from localStorage if available (client-side only)
  const getInitialState = () => {
    // Only access localStorage on client side
    if (typeof window === 'undefined') {
      return {
        columns: initialColumns.length > 0
          ? initialColumns
          : [{ id: 'col-1', name: 'Column 1' }],
        rows: initialRows,
        columnWidths: {} as Record<string, number>,
        rowHeights: {} as Record<string, number>,
      }
    }

    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          columns: parsed.columns && parsed.columns.length > 0
            ? parsed.columns
            : (initialColumns.length > 0 ? initialColumns : [{ id: 'col-1', name: 'Column 1' }]),
          rows: parsed.rows && parsed.rows.length > 0
            ? parsed.rows
            : initialRows,
          columnWidths: parsed.columnWidths || {},
          rowHeights: parsed.rowHeights || {},
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }

    return {
      columns: initialColumns.length > 0
        ? initialColumns
        : [{ id: 'col-1', name: 'Column 1' }],
      rows: initialRows,
      columnWidths: {} as Record<string, number>,
      rowHeights: {} as Record<string, number>,
    }
  }

  const initialState = getInitialState()
  const [rows, setRows] = useState<TableRow[]>(initialState.rows)
  const [columns, setColumns] = useState<TableColumn[]>(initialState.columns)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(initialState.columnWidths)
  const [rowHeights, setRowHeights] = useState<Record<string, number>>(initialState.rowHeights)
  const [isInitialized, setIsInitialized] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizingRow, setResizingRow] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartY, setResizeStartY] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const [resizeStartHeight, setResizeStartHeight] = useState(0)
  const [editingCell, setEditingCell] = useState<{
    rowId: string
    cellId: string
  } | null>(null)
  const [editingRowName, setEditingRowName] = useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null)
  const [cellValue, setCellValue] = useState('')
  const [rowNameValue, setRowNameValue] = useState('')
  const [columnNameValue, setColumnNameValue] = useState('')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addType, setAddType] = useState<'row' | 'column' | null>(null)
  const [addCount, setAddCount] = useState('1')
  const inputRef = useRef<HTMLInputElement>(null)
  const rowInputRef = useRef<HTMLInputElement>(null)
  const columnInputRef = useRef<HTMLInputElement>(null)
  const countInputRef = useRef<HTMLInputElement>(null)
  const horizontalScrollRef = useRef<HTMLDivElement>(null)
  const bodyScrollRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const defaultColumnWidth = 192 // w-48 = 192px
  const defaultRowHeight = 48
  const defaultLeftColumnWidth = 256 // w-64 = 256px

  // Load from localStorage on mount (handles SSR hydration)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          // Update state with saved data if it exists
          if (parsed.columns && parsed.columns.length > 0) {
            setColumns(parsed.columns)
          }
          if (parsed.rows && parsed.rows.length > 0) {
            setRows(parsed.rows)
          } else if (rows.length === 0 && initialRows.length === 0) {
            // Initialize with one row if no saved rows and no initial rows
            const colsToUse = parsed.columns && parsed.columns.length > 0 ? parsed.columns : columns
            const newRow: TableRow = {
              id: `row-${Date.now()}`,
              name: 'New Row',
              cells: colsToUse.map((col: TableColumn) => ({
                id: `cell-${Date.now()}-${col.id}`,
                value: '',
              })),
              hierarchy: 'normal',
            }
            setRows([newRow])
          }
          if (parsed.columnWidths) {
            setColumnWidths(parsed.columnWidths)
          }
          if (parsed.rowHeights) {
            setRowHeights(parsed.rowHeights)
          }
        } else if (rows.length === 0 && initialRows.length === 0) {
          // No saved data - initialize with one row
          const newRow: TableRow = {
            id: `row-${Date.now()}`,
            name: 'New Row',
            cells: columns.map((col) => ({
              id: `cell-${Date.now()}-${col.id}`,
              value: '',
            })),
            hierarchy: 'normal',
          }
          setRows([newRow])
        }
      } catch (error) {
        console.error('Error loading from localStorage:', error)
      }
    }
    setIsInitialized(true)
  }, [])

  // Save to localStorage whenever columns or rows change (but not during initial load)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined' && (columns.length > 0 || rows.length > 0)) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            columns,
            rows,
            columnWidths,
            rowHeights,
          })
        )
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
    }
  }, [columns, rows, columnWidths, rowHeights, isInitialized])

  // Update cells when columns change
  useEffect(() => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        const existingCells = row.cells || []
        // Create a map of columnId -> cell for quick lookup
        const cellMap = new Map<string, TableCell>()
        existingCells.forEach((cell) => {
          // Extract column ID from cell ID (format: cell-{rowId}-{columnId})
          const parts = cell.id.split('-')
          if (parts.length >= 3) {
            const colId = parts.slice(2).join('-')
            cellMap.set(colId, cell)
          }
        })

        const newCells = columns.map((col) => {
          const existingCell = cellMap.get(col.id)
          if (existingCell) {
            return existingCell
          }
          return {
            id: `cell-${row.id}-${col.id}`,
            value: '',
          }
        })

        return {
          ...row,
          cells: newCells,
        }
      })
    )
  }, [columns])

  const addRow = (insertAfterId?: string, count: number = 1) => {
    const newRows: TableRow[] = []
    const startIndex = insertAfterId
      ? rows.findIndex((row) => row.id === insertAfterId) + 1
      : rows.length

    for (let i = 0; i < count; i++) {
      const newRow: TableRow = {
        id: `row-${Date.now()}-${i}`,
        name: `Row ${rows.length + i + 1}`,
        cells: columns.map((col) => ({
          id: `cell-${Date.now()}-${i}-${col.id}`,
          value: '',
        })),
        hierarchy: 'normal',
      }
      newRows.push(newRow)
    }

    if (insertAfterId && startIndex > 0) {
      const updatedRows = [...rows]
      updatedRows.splice(startIndex, 0, ...newRows)
      setRows(updatedRows)
    } else {
      setRows([...rows, ...newRows])
    }
  }

  const setRowHierarchy = (rowId: string, hierarchy: RowHierarchy) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.id === rowId ? { ...row, hierarchy } : row
      )
    )
  }

  const getHierarchyStyles = (hierarchy: RowHierarchy = 'normal', rowIndex: number = 0): CSSProperties => {
    // Check if previous row is a header to make this look like a child
    const previousRow = rowIndex > 0 ? rows[rowIndex - 1] : null
    const isChildOfHeader = previousRow?.hierarchy === 'header' && (hierarchy === 'section' || hierarchy === 'subsection')

    switch (hierarchy) {
      case 'header':
        return {
          fontWeight: 'bold',
          fontSize: '1rem',
          backgroundColor: 'hsl(var(--primary) / 0.1)',
          borderBottom: '2px solid hsl(var(--primary) / 0.3)',
          paddingLeft: '0.75rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          marginTop: '0.5rem',
        }
      case 'subheader':
        return {
          fontWeight: '600',
          fontSize: '0.9375rem',
          backgroundColor: 'hsl(var(--primary) / 0.05)',
          borderBottom: '1px solid hsl(var(--primary) / 0.2)',
          paddingLeft: '1.5rem',
          fontStyle: 'italic',
        }
      case 'section':
        return {
          fontWeight: '600',
          fontSize: '0.9375rem',
          backgroundColor: isChildOfHeader ? 'hsl(var(--muted) / 0.8)' : 'hsl(var(--muted))',
          borderBottom: '1px solid hsl(var(--border))',
          paddingLeft: isChildOfHeader ? '2rem' : '1rem',
          borderLeft: isChildOfHeader ? '3px solid hsl(var(--primary) / 0.3)' : 'none',
        }
      case 'subsection':
        return {
          fontWeight: '500',
          fontSize: '0.875rem',
          backgroundColor: 'hsl(var(--muted) / 0.5)',
          paddingLeft: isChildOfHeader ? '2.5rem' : '2rem',
          fontStyle: 'italic',
          borderLeft: isChildOfHeader ? '3px solid hsl(var(--primary) / 0.2)' : 'none',
        }
      default:
        return {
          fontWeight: 'normal',
          fontSize: '0.875rem',
          paddingLeft: isChildOfHeader ? '2rem' : '0.75rem',
        }
    }
  }

  const addColumn = (count: number = 1) => {
    const newColumns: TableColumn[] = []

    for (let i = 0; i < count; i++) {
      const newColumn: TableColumn = {
        id: `col-${Date.now()}-${i}`,
        name: `Column ${columns.length + i + 1}`,
      }
      newColumns.push(newColumn)
      // Set default width for new column
      setColumnWidths((prev) => ({
        ...prev,
        [newColumn.id]: defaultColumnWidth,
      }))
    }

    setColumns([...columns, ...newColumns])
  }

  const fitColumnsToContainer = () => {
    if (!containerRef.current || !bodyScrollRef.current || columns.length === 0) return

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      // Get the outer container width
      const containerWidth = containerRef.current!.clientWidth

      // Get the scroll container to check for scrollbar
      const scrollContainer = bodyScrollRef.current!
      const hasVerticalScrollbar = scrollContainer.scrollHeight > scrollContainer.clientHeight
      const scrollbarWidth = hasVerticalScrollbar ? scrollContainer.offsetWidth - scrollContainer.clientWidth : 0

      const fixedLeftColumnWidth = defaultLeftColumnWidth
      const addColumnButtonWidth = 48 // w-12 = 48px
      const borderWidth = 1 // Border between columns (1px per border)
      const outerBorderWidth = 2 // Outer borders (1px each side)

      // Calculate available width for scrollable columns
      // Account for: fixed left column, add column button, borders, and scrollbar
      const availableWidth = containerWidth - fixedLeftColumnWidth - addColumnButtonWidth - (borderWidth * columns.length) - outerBorderWidth - scrollbarWidth

      // Minimum width per column to ensure readability
      const minColumnWidth = 100

      // Calculate target width per column
      let targetWidth = Math.floor(availableWidth / columns.length)

      // If the calculated width is less than minimum, use minimum (will cause scrolling)
      if (targetWidth < minColumnWidth) {
        targetWidth = minColumnWidth
      }

      // Set width for all columns
      const newWidths: Record<string, number> = {}
      columns.forEach((column) => {
        newWidths[column.id] = targetWidth
      })

      setColumnWidths(newWidths)
    })
  }

  const handleAddDialogOpen = (type: 'row' | 'column') => {
    setAddType(type)
    setAddCount('1')
    setAddDialogOpen(true)
  }

  const handleAddConfirm = () => {
    const count = parseInt(addCount, 10)
    if (count > 0 && count <= 100) {
      if (addType === 'row') {
        addRow(undefined, count)
      } else if (addType === 'column') {
        addColumn(count)
      }
      setAddDialogOpen(false)
      setAddType(null)
      setAddCount('1')
    }
  }

  const handleAddCancel = () => {
    setAddDialogOpen(false)
    setAddType(null)
    setAddCount('1')
  }

  const getColumnWidth = (columnId: string): number => {
    return columnWidths[columnId] || defaultColumnWidth
  }

  const getRowHeight = (rowId: string): number => {
    return rowHeights[rowId] || defaultRowHeight
  }

  const handleColumnResizeStart = (
    e: React.MouseEvent,
    columnId: string
  ) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    setResizeStartWidth(getColumnWidth(columnId))
  }

  const handleRowResizeStart = (e: React.MouseEvent, rowId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingRow(rowId)
    setResizeStartY(e.clientY)
    setResizeStartHeight(getRowHeight(rowId))
  }

  const deleteRow = (rowId: string) => {
    setRows(rows.filter((row) => row.id !== rowId))
  }

  const deleteColumn = (columnId: string) => {
    setColumns(columns.filter((col) => col.id !== columnId))
    setRows((prevRows) =>
      prevRows.map((row) => ({
        ...row,
        cells: row.cells.filter((cell) => {
          // Extract column ID from cell ID
          const parts = cell.id.split('-')
          if (parts.length >= 3) {
            const colId = parts.slice(2).join('-')
            return colId !== columnId
          }
          return true
        }),
      }))
    )
  }

  const startEditingCell = (rowId: string, cellId: string, value: string) => {
    setEditingCell({ rowId, cellId })
    setCellValue(value)
  }

  const startEditingRowName = (rowId: string, name: string) => {
    setEditingRowName(rowId)
    setRowNameValue(name)
  }

  const startEditingColumnName = (columnId: string, name: string) => {
    setEditingColumnName(columnId)
    setColumnNameValue(name)
  }

  const saveCell = () => {
    if (editingCell) {
      setRows((prevRows) =>
        prevRows.map((row) => {
          if (row.id === editingCell.rowId) {
            const cellIndex = row.cells.findIndex(
              (cell) => cell.id === editingCell.cellId
            )
            if (cellIndex !== -1) {
              const updatedCells = [...row.cells]
              updatedCells[cellIndex] = {
                ...updatedCells[cellIndex],
                value: cellValue,
              }
              return {
                ...row,
                cells: updatedCells,
              }
            }
            // If cell not found, create it
            return {
              ...row,
              cells: [
                ...row.cells,
                { id: editingCell.cellId, value: cellValue },
              ],
            }
          }
          return row
        })
      )
      setEditingCell(null)
      setCellValue('')
    }
  }

  const saveRowName = () => {
    if (editingRowName) {
      setRows((prevRows) =>
        prevRows.map((row) =>
          row.id === editingRowName ? { ...row, name: rowNameValue } : row
        )
      )
      setEditingRowName(null)
      setRowNameValue('')
    }
  }

  const saveColumnName = () => {
    if (editingColumnName) {
      setColumns((prevColumns) =>
        prevColumns.map((col) =>
          col.id === editingColumnName ? { ...col, name: columnNameValue } : col
        )
      )
      setEditingColumnName(null)
      setColumnNameValue('')
    }
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditingRowName(null)
    setEditingColumnName(null)
    setCellValue('')
    setRowNameValue('')
    setColumnNameValue('')
  }

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingCell])

  useEffect(() => {
    if (editingRowName && rowInputRef.current) {
      rowInputRef.current.focus()
      rowInputRef.current.select()
    }
  }, [editingRowName])

  useEffect(() => {
    if (editingColumnName && columnInputRef.current) {
      columnInputRef.current.focus()
      columnInputRef.current.select()
    }
  }, [editingColumnName])

  useEffect(() => {
    if (addDialogOpen && countInputRef.current) {
      setTimeout(() => {
        countInputRef.current?.focus()
        countInputRef.current?.select()
      }, 100)
    }
  }, [addDialogOpen])

  // Handle column resize
  useEffect(() => {
    if (resizingColumn) {
      const handleMove = (e: MouseEvent) => {
        const diff = e.clientX - resizeStartX
        const newWidth = Math.max(100, resizeStartWidth + diff)
        setColumnWidths((prev) => ({
          ...prev,
          [resizingColumn]: newWidth,
        }))
      }

      const handleEnd = () => {
        setResizingColumn(null)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
      }
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  // Handle row resize
  useEffect(() => {
    if (resizingRow) {
      const handleMove = (e: MouseEvent) => {
        const diff = e.clientY - resizeStartY
        const newHeight = Math.max(40, resizeStartHeight + diff)
        setRowHeights((prev) => ({
          ...prev,
          [resizingRow]: newHeight,
        }))
      }

      const handleEnd = () => {
        setResizingRow(null)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleEnd)

      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleEnd)
      }
    }
  }, [resizingRow, resizeStartY, resizeStartHeight])

  const getCellValue = (rowId: string, columnId: string): string => {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return ''
    const cell = row.cells.find((c) => {
      const parts = c.id.split('-')
      if (parts.length >= 3) {
        const colId = parts.slice(2).join('-')
        return colId === columnId
      }
      return false
    })
    return cell?.value || ''
  }

  const getCellId = (rowId: string, columnId: string): string => {
    const row = rows.find((r) => r.id === rowId)
    if (!row) return `cell-${rowId}-${columnId}`
    const cell = row.cells.find((c) => {
      const parts = c.id.split('-')
      if (parts.length >= 3) {
        const colId = parts.slice(2).join('-')
        return colId === columnId
      }
      return false
    })
    return cell?.id || `cell-${rowId}-${columnId}`
  }

  return (
    <div
      ref={containerRef}
      className="border rounded-lg bg-background"
      style={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'block',
        position: 'relative'
      }}
    >
      {/* Single scroll container for both header and body */}
      <div
        ref={bodyScrollRef}
        style={{
          maxHeight: '600px',
          overflowY: 'auto',
          overflowX: 'auto',
          width: '100%',
          position: 'relative'
        }}
      >
        <div style={{ width: 'max-content', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Header - sticky at top, inside scroll container */}
          <div
            ref={horizontalScrollRef}
            className="flex border-b bg-muted/30 header-row"
            style={{
              width: 'max-content',
              display: 'flex',
              position: 'sticky',
              top: 0,
              zIndex: 15,
              backgroundColor: 'hsl(var(--muted) / 0.3)'
            }}
          >
            {/* Fixed left column header - frozen top-left corner */}
            <div
              className="border-r bg-muted/50 p-3 flex items-center justify-between relative"
              style={{
                width: defaultLeftColumnWidth,
                flexShrink: 0,
                position: 'sticky',
                left: 0,
                top: 0,
                zIndex: 35,
                backgroundColor: 'hsl(var(--muted))',
                boxShadow: '2px 0 4px rgba(0, 0, 0, 0.15)',
                isolation: 'isolate'
              }}
            >
              <span className="font-semibold text-sm">Item</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => handleAddDialogOpen('row')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleAddDialogOpen('column')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={fitColumnsToContainer}>
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Fit to Container
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Scrollable column headers */}
            <div className="flex" style={{ width: 'max-content', marginLeft: 0 }}>
              {columns.map((column, colIndex) => (
                <div
                  key={column.id}
                  className="flex-shrink-0 border-r p-3 flex items-center justify-between group/header hover:bg-muted/50 transition-colors relative"
                  style={{
                    width: getColumnWidth(column.id),
                    backgroundColor: 'hsl(var(--muted) / 0.3)'
                  }}
                >
                  {editingColumnName === column.id ? (
                    <div className="flex items-center gap-1 flex-1">
                      <Input
                        ref={columnInputRef}
                        value={columnNameValue}
                        onChange={(e) => setColumnNameValue(e.target.value)}
                        onBlur={saveColumnName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveColumnName()
                          } else if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                        className="h-7 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={saveColumnName}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="font-semibold text-sm cursor-pointer flex-1"
                        onDoubleClick={() =>
                          startEditingColumnName(column.id, column.name)
                        }
                      >
                        {column.name}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover/header:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              startEditingColumnName(column.id, column.name)
                            }
                          >
                            <Edit2 className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteColumn(column.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Column
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                  {/* Column Resize Handle */}
                  <div
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary transition-colors z-10 group-hover/header:bg-primary/40"
                    onMouseDown={(e) => handleColumnResizeStart(e, column.id)}
                    style={{
                      cursor: 'col-resize',
                      backgroundColor: resizingColumn === column.id ? 'hsl(var(--primary))' : 'transparent',
                    }}
                    title="Drag to resize column"
                  />
                </div>
              ))}
              {/* Add Column Button */}
              <div className="w-12 flex-shrink-0 p-3 flex items-center justify-center border-r">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => handleAddDialogOpen('column')}
                  title="Add Column"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Body - inside same scroll container as header */}
          <div
            style={{
              width: '100%',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', width: 'max-content', minWidth: '100%' }}>
              {/* Fixed left column - frozen when scrolling horizontally */}
              <div
                className="border-r bg-muted/20"
                style={{
                  width: defaultLeftColumnWidth,
                  minWidth: defaultLeftColumnWidth,
                  flexShrink: 0,
                  position: 'sticky',
                  left: 0,
                  zIndex: 30,
                  backgroundColor: 'hsl(var(--muted))',
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.15)',
                  // Match header sticky properties
                  isolation: 'isolate'
                }}
              >
                {rows.map((row, rowIndex) => {
                  const hierarchyStyles = getHierarchyStyles(row.hierarchy, rowIndex)
                  return (
                    <div
                      key={row.id}
                      className="border-b last:border-b-0 flex items-center justify-between group/row hover:bg-muted/30 transition-colors relative"
                      style={{
                        height: getRowHeight(row.id),
                        minHeight: getRowHeight(row.id),
                        backgroundColor: hierarchyStyles.backgroundColor,
                        ...hierarchyStyles,
                      }}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0 h-full" style={{ padding: hierarchyStyles.paddingLeft ? `0.75rem 0.75rem 0.75rem ${hierarchyStyles.paddingLeft}` : '0.75rem' }}>
                        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" />
                        {editingRowName === row.id ? (
                          <div className="flex items-center gap-1 flex-1">
                            <Input
                              ref={rowInputRef}
                              value={rowNameValue}
                              onChange={(e) => setRowNameValue(e.target.value)}
                              onBlur={saveRowName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveRowName()
                                } else if (e.key === 'Escape') {
                                  cancelEdit()
                                }
                              }}
                              className="h-7 text-sm flex-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={saveRowName}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span
                              className="cursor-pointer flex-1 truncate"
                              style={{
                                fontSize: hierarchyStyles.fontSize,
                                fontWeight: hierarchyStyles.fontWeight,
                                textTransform: hierarchyStyles.textTransform,
                                letterSpacing: hierarchyStyles.letterSpacing,
                                fontStyle: hierarchyStyles.fontStyle,
                              }}
                              onDoubleClick={() => startEditingRowName(row.id, row.name)}
                            >
                              {row.name}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onClick={() => startEditingRowName(row.id, row.name)}
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => addRow(row.id)}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Row Below
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setRowHierarchy(row.id, 'header')}
                                  className={row.hierarchy === 'header' ? 'bg-primary/10' : ''}
                                >
                                  <span className="h-4 w-4 mr-2 flex items-center justify-center">
                                    <span className="text-xs font-bold">H</span>
                                  </span>
                                  Header
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRowHierarchy(row.id, 'subheader')}
                                  className={row.hierarchy === 'subheader' ? 'bg-primary/10' : ''}
                                >
                                  <span className="h-4 w-4 mr-2 flex items-center justify-center">
                                    <span className="text-xs font-semibold">H2</span>
                                  </span>
                                  Sub Header
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRowHierarchy(row.id, 'section')}
                                  className={row.hierarchy === 'section' ? 'bg-primary/10' : ''}
                                >
                                  <span className="h-4 w-4 mr-2 flex items-center justify-center">
                                    <span className="text-xs font-semibold">S</span>
                                  </span>
                                  Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRowHierarchy(row.id, 'subsection')}
                                  className={row.hierarchy === 'subsection' ? 'bg-primary/10' : ''}
                                >
                                  <span className="h-4 w-4 mr-2 flex items-center justify-center">
                                    <span className="text-xs">S2</span>
                                  </span>
                                  Sub Section
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRowHierarchy(row.id, 'normal')}
                                  className={(!row.hierarchy || row.hierarchy === 'normal') ? 'bg-primary/10' : ''}
                                >
                                  <span className="h-4 w-4 mr-2 flex items-center justify-center">
                                    <span className="text-xs">•</span>
                                  </span>
                                  Normal
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteRow(row.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Row
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                      {/* Row Resize Handle */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-primary transition-colors z-10 group-hover/row:bg-primary/40"
                        onMouseDown={(e) => handleRowResizeStart(e, row.id)}
                        style={{
                          cursor: 'row-resize',
                          backgroundColor: resizingRow === row.id ? 'hsl(var(--primary))' : 'transparent',
                        }}
                        title="Drag to resize row"
                      />
                    </div>
                  )
                })}
                {/* Add Row Button */}
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={() => addRow()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                </div>
              </div>
              {/* Scrollable data columns */}
              <div className="flex" style={{ width: 'max-content', position: 'relative', zIndex: 0 }}>
                {columns.map((column) => (
                  <div
                    key={column.id}
                    className="flex-shrink-0 border-r relative"
                    style={{ width: getColumnWidth(column.id), position: 'relative', zIndex: 0 }}
                  >
                    {rows.map((row, rowIndex) => {
                      const cellId = getCellId(row.id, column.id)
                      const cellValue = getCellValue(row.id, column.id)
                      const isEditing =
                        editingCell?.rowId === row.id &&
                        editingCell?.cellId === cellId
                      const hierarchyStyles = getHierarchyStyles(row.hierarchy, rowIndex)

                      return (
                        <div
                          key={cellId}
                          className={cn(
                            "border-b last:border-b-0 flex items-center group/cell hover:bg-muted/20 transition-colors",
                            isEditing && "rounded-md"
                          )}
                          style={{
                            height: getRowHeight(row.id),
                            minHeight: getRowHeight(row.id),
                            backgroundColor: hierarchyStyles.backgroundColor,
                            borderBottom: hierarchyStyles.borderBottom || '1px solid hsl(var(--border))',
                            borderLeft: hierarchyStyles.borderLeft || 'none',
                            padding: hierarchyStyles.paddingLeft ? `0.75rem 0.75rem 0.75rem ${hierarchyStyles.paddingLeft}` : '0.75rem',
                            marginTop: hierarchyStyles.marginTop || '0',
                          }}
                          onDoubleClick={() =>
                            startEditingCell(row.id, cellId, cellValue)
                          }
                        >
                          {isEditing ? (
                            <Input
                              ref={inputRef}
                              value={cellValue}
                              onChange={(e) => setCellValue(e.target.value)}
                              onBlur={saveCell}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveCell()
                                } else if (e.key === 'Escape') {
                                  cancelEdit()
                                }
                              }}
                              className="rounded-md border-b-4 border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                              className="h-8 text-sm rounded-md border-0 border-b-4 border-primary focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-b-4 focus-visible:border-primary"
                              onClick={(e) => e.stopPropagation()}
                              autoFocus
                            />
                          ) : (
                            <span className="text-sm w-full truncate cursor-pointer">
                              {cellValue || (
                                <span className="text-muted-foreground italic">
                                  Click to edit
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )
                    })}
                    {/* Empty space to match Add Row button height */}
                    <div className="border-t" style={{ height: '49px', minHeight: '49px' }}></div>
                    {/* Column Resize Handle for data columns */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary transition-colors z-10 opacity-0 hover:opacity-100 group-hover/header:opacity-100"
                      onMouseDown={(e) => handleColumnResizeStart(e, column.id)}
                      style={{
                        cursor: 'col-resize',
                        backgroundColor: resizingColumn === column.id ? 'hsl(var(--primary))' : 'transparent',
                      }}
                      title="Drag to resize column"
                    />
                  </div>
                ))}
                {/* Empty column for add column button */}
                <div className="w-12 flex-shrink-0 border-r">
                  {/* Empty space to match Add Row button height */}
                  <div className="border-t" style={{ height: '49px', minHeight: '49px' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Rows/Columns Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add {addType === 'row' ? 'Rows' : 'Columns'}
            </DialogTitle>
            <DialogDescription>
              Enter the number of {addType === 'row' ? 'rows' : 'columns'} you want to add (1-100)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-count">Number of {addType === 'row' ? 'Rows' : 'Columns'}</Label>
              <Input
                id="add-count"
                ref={countInputRef}
                type="number"
                min="1"
                max="100"
                value={addCount}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === '' || (parseInt(value, 10) > 0 && parseInt(value, 10) <= 100)) {
                    setAddCount(value)
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddConfirm()
                  } else if (e.key === 'Escape') {
                    handleAddCancel()
                  }
                }}
                placeholder="Enter a number (1-100)"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleAddCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleAddConfirm}
              disabled={!addCount || parseInt(addCount, 10) < 1 || parseInt(addCount, 10) > 100}
            >
              Add {addCount || '0'} {addType === 'row' ? 'Row(s)' : 'Column(s)'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

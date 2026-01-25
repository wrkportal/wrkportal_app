/**
 * Phase 5.3: Excel-like Grid Editor - Core Component
 * 
 * High-performance grid component with virtual scrolling, inline editing, and Excel-like features
 */

'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { evaluateFormula, parseCellReference, cellReferenceToString, type FormulaContext } from '@/lib/grid/formula-engine'

interface GridCell {
  value: string | null
  displayValue: string | null
  formula: string | null
  dataType: 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'FORMULA' | 'ERROR'
  isLocked: boolean
  comment?: string
}

interface GridColumn {
  index: number
  name?: string
  width: number
  type: string
  isVisible: boolean
  isLocked: boolean
}

interface GridEditorProps {
  gridId?: string
  initialRows?: number
  initialColumns?: number
  frozenRows?: number
  frozenColumns?: number
  onCellChange?: (row: number, column: number, value: string) => void
  readOnly?: boolean
}

const COLUMN_NAMES = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const DEFAULT_CELL_WIDTH = 100
const DEFAULT_CELL_HEIGHT = 24
const HEADER_HEIGHT = 30
const ROW_NUMBER_WIDTH = 50

export function GridEditor({
  gridId,
  initialRows = 1000,
  initialColumns = 26,
  frozenRows = 0,
  frozenColumns = 0,
  onCellChange,
  readOnly = false,
}: GridEditorProps) {
  const [cells, setCells] = useState<Map<string, GridCell>>(new Map())
  const [columns, setColumns] = useState<GridColumn[]>(() =>
    Array.from({ length: initialColumns }, (_, i) => ({
      index: i,
      width: DEFAULT_CELL_WIDTH,
      type: 'TEXT',
      isVisible: true,
      isLocked: false,
    }))
  )

  const [selectedCell, setSelectedCell] = useState<{ row: number; column: number } | null>(null)
  const [editingCell, setEditingCell] = useState<{ row: number; column: number; value: string } | null>(null)
  const [scrollPosition, setScrollPosition] = useState({ top: 0, left: 0 })
  const [visibleRange, setVisibleRange] = useState({ startRow: 0, endRow: 50, startCol: 0, endCol: 10 })

  const gridRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLInputElement>(null)

  // Formula context for evaluating formulas
  const formulaContext: FormulaContext = useMemo(() => ({
    getCellValue: (row: number, column: number) => {
      const key = `${row}:${column}`
      const cell = cells.get(key)
      return cell?.displayValue ?? null
    },
    getCellRange: (startRow: number, startCol: number, endRow: number, endCol: number) => {
      const values: (string | number | null)[] = []
      const minRow = Math.min(startRow, endRow)
      const maxRow = Math.max(startRow, endRow)
      const minCol = Math.min(startCol, endCol)
      const maxCol = Math.max(startCol, endCol)

      for (let row = minRow; row <= maxRow; row++) {
        for (let col = minCol; col <= maxCol; col++) {
          const key = `${row}:${col}`
          const cell = cells.get(key)
          values.push(cell?.displayValue ?? null)
        }
      }
      return values
    },
  }), [cells])

  // Load cells from API when gridId changes or visible range changes
  useEffect(() => {
    if (!gridId) return

    const loadCells = async () => {
      try {
        const response = await fetch(
          `/api/grids/${gridId}/cells?startRow=${visibleRange.startRow}&endRow=${visibleRange.endRow}&startCol=${visibleRange.startCol}&endCol=${visibleRange.endCol}`
        )
        if (response.ok) {
          const data = await response.json()
          const cellsMap = new Map<string, GridCell>()
          data.cells?.forEach((cell: any) => {
            const key = `${cell.rowIndex}:${cell.columnIndex}`
            cellsMap.set(key, {
              value: cell.value,
              displayValue: cell.displayValue || cell.value,
              formula: cell.formula,
              dataType: cell.dataType || 'TEXT',
              isLocked: cell.isLocked || false,
              comment: cell.comment,
            })
          })
          setCells(prev => {
            const merged = new Map(prev)
            cellsMap.forEach((value, key) => merged.set(key, value))
            return merged
          })
        }
      } catch (error) {
        console.error('Error loading cells:', error)
      }
    }

    loadCells()
  }, [gridId, visibleRange.startRow, visibleRange.endRow, visibleRange.startCol, visibleRange.endCol])

  // Update visible range based on scroll position
  useEffect(() => {
    if (!gridRef.current) return

    const container = gridRef.current
    const containerHeight = container.clientHeight
    const containerWidth = container.clientWidth

    const rowHeight = DEFAULT_CELL_HEIGHT
    const visibleRowCount = Math.ceil(containerHeight / rowHeight) + 5 // Buffer

    const startRow = Math.floor(scrollPosition.top / rowHeight)
    const endRow = Math.min(startRow + visibleRowCount, initialRows)

    // Calculate visible columns
    let colStart = 0
    let currentWidth = ROW_NUMBER_WIDTH
    for (let i = 0; i < columns.length; i++) {
      if (currentWidth >= scrollPosition.left) {
        colStart = i
        break
      }
      currentWidth += columns[i].width
    }

    let colEnd = colStart
    while (colEnd < columns.length && currentWidth < scrollPosition.left + containerWidth) {
      currentWidth += columns[colEnd].width
      colEnd++
    }
    colEnd = Math.min(colEnd + 2, initialColumns) // Buffer

    setVisibleRange({ startRow, endRow, startCol: colStart, endCol: colEnd })
  }, [scrollPosition, initialRows, initialColumns, columns])

  // Get or create cell
  const getCell = useCallback((row: number, column: number): GridCell => {
    const key = `${row}:${column}`
    return cells.get(key) ?? {
      value: null,
      displayValue: null,
      formula: null,
      dataType: 'TEXT',
      isLocked: false,
    }
  }, [cells])

  // Get cell style based on conditional formatting (placeholder for future API integration)
  const getCellStyle = useCallback((row: number, column: number, cell: GridCell): React.CSSProperties => {
    const style: React.CSSProperties = {}

    // Basic conditional formatting based on data type
    if (cell.dataType === 'ERROR') {
      style.backgroundColor = 'rgb(254 242 242)' // red-50
      style.color = 'rgb(185 28 28)' // red-700
    } else if (cell.dataType === 'FORMULA') {
      style.color = 'rgb(37 99 235)' // blue-600
    } else if (cell.dataType === 'NUMBER') {
      style.textAlign = 'right' as const
    }

    // Future: Load conditional formatting from API
    // const format = await fetch(`/api/grids/${gridId}/formats?row=${row}&col=${column}`)

    return style
  }, [])

  // Validate cell value (placeholder for future API integration)
  const validateCellValue = useCallback((row: number, column: number, value: string): { valid: boolean; error?: string } => {
    // Basic validation
    if (value.trim() === '') {
      return { valid: true } // Empty is valid
    }

    // Number validation
    const numValue = Number(value)
    if (!isNaN(numValue) && value.trim() !== '') {
      // Could check against column type or validation rules here
      // Future: const validation = await fetch(`/api/grids/${gridId}/validations?row=${row}&col=${column}`)
      return { valid: true }
    }

    // Date validation (basic)
    if (value.match(/^\d{4}-\d{2}-\d{2}$/) || value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return { valid: true }
    }

    // Email validation
    if (value.includes('@') && value.includes('.')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return { valid: false, error: 'Invalid email format' }
      }
      return { valid: true }
    }

    // URL validation
    if (value.startsWith('http://') || value.startsWith('https://')) {
      try {
        new URL(value)
        return { valid: true }
      } catch {
        return { valid: false, error: 'Invalid URL format' }
      }
    }

    return { valid: true }
  }, [])

  // Set cell value
  const setCellValue = useCallback((row: number, column: number, value: string) => {
    const key = `${row}:${column}`
    let cell: GridCell = getCell(row, column)

    // Validate value
    const validation = validateCellValue(row, column, value)
    if (!validation.valid) {
      cell = {
        ...cell,
        value: value,
        displayValue: `#ERROR: ${validation.error || 'Validation failed'}`,
        formula: null,
        dataType: 'ERROR',
      }
      setCells(prev => new Map(prev).set(key, cell))
      onCellChange?.(row, column, value)
      return
    }

    // Check if it's a formula
    if (value.startsWith('=')) {
      cell = {
        ...cell,
        formula: value,
        value: value,
        dataType: 'FORMULA',
      }

      // Evaluate formula
      try {
        const result = evaluateFormula(value, formulaContext, row, column)
        cell.displayValue = String(result)
        if (typeof result === 'number') {
          cell.dataType = 'NUMBER'
        } else if (String(result).startsWith('#ERROR')) {
          cell.dataType = 'ERROR'
        }
      } catch (error) {
        cell.displayValue = `#ERROR: ${error instanceof Error ? error.message : 'Invalid formula'}`
        cell.dataType = 'ERROR'
      }
    } else {
      // Regular value
      cell = {
        ...cell,
        value: value,
        displayValue: value,
        formula: null,
        dataType: 'TEXT',
      }

      // Try to detect data type
      if (!isNaN(Number(value)) && value.trim() !== '') {
        cell.dataType = 'NUMBER'
        cell.displayValue = value // Keep original format
      } else if (value.match(/^\d{4}-\d{2}-\d{2}$/) || value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        cell.dataType = 'DATE'
      } else if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
        cell.dataType = 'BOOLEAN'
      } else if (value.includes('@') && value.includes('.')) {
        cell.dataType = 'TEXT' // Email-like, but keep as TEXT for now
      }
    }

    setCells(prev => new Map(prev).set(key, cell))
    onCellChange?.(row, column, value)
  }, [getCell, formulaContext, onCellChange, validateCellValue])

  // Handle cell click
  const handleCellClick = useCallback((row: number, column: number) => {
    if (readOnly) return
    setSelectedCell({ row, column })
    const cell = getCell(row, column)
    setEditingCell({ row, column, value: cell.value ?? '' })
  }, [readOnly, getCell])

  // Handle cell double click
  const handleCellDoubleClick = useCallback((row: number, column: number) => {
    if (readOnly) return
    const cell = getCell(row, column)
    setEditingCell({ row, column, value: cell.formula ?? cell.value ?? '' })
    setTimeout(() => editorRef.current?.focus(), 0)
  }, [readOnly, getCell])

  // Handle editor change
  const handleEditorChange = useCallback((value: string) => {
    if (!editingCell) return
    setEditingCell({ ...editingCell, value })
  }, [editingCell])

  // Handle editor blur
  const handleEditorBlur = useCallback(() => {
    if (!editingCell) return
    setCellValue(editingCell.row, editingCell.column, editingCell.value)
    setEditingCell(null)
  }, [editingCell, setCellValue])

  // Copy/paste state
  const [copiedCells, setCopiedCells] = useState<Map<string, GridCell>>(new Map())
  const [copiedRange, setCopiedRange] = useState<{ startRow: number; startCol: number; endRow: number; endCol: number } | null>(null)

  // Handle copy
  const handleCopy = useCallback((e: React.ClipboardEvent<Element> | React.KeyboardEvent<Element>) => {
    if (!selectedCell || readOnly) return
    e.preventDefault()

    // For now, copy single cell. Can be extended to copy ranges
    const cell = getCell(selectedCell.row, selectedCell.column)
    const cellMap = new Map<string, GridCell>()
    cellMap.set(`${selectedCell.row}:${selectedCell.column}`, cell)
    setCopiedCells(cellMap)
    setCopiedRange({ startRow: selectedCell.row, startCol: selectedCell.column, endRow: selectedCell.row, endCol: selectedCell.column })

    // Copy to clipboard as TSV (tab-separated values) for Excel compatibility
    const clipboardText = cell.displayValue || cell.value || ''
    if ('clipboardData' in e && e.clipboardData) {
      e.clipboardData.setData('text/plain', clipboardText)
      e.clipboardData.setData('text/html', clipboardText)
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(clipboardText)
    }
  }, [selectedCell, readOnly, getCell])

  // Handle paste
  const handlePaste = useCallback(async (e: React.ClipboardEvent | KeyboardEvent) => {
    if (!selectedCell || readOnly) return
    e.preventDefault()

    let clipboardText = ''
    if (e instanceof ClipboardEvent && e.clipboardData) {
      clipboardText = e.clipboardData.getData('text/plain')
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      clipboardText = await navigator.clipboard.readText()
    }

    if (!clipboardText) return

    // Parse TSV (tab-separated) or CSV (comma-separated) data
    const lines = clipboardText.split(/\r?\n/).filter(line => line.trim())
    const pasteData: string[][] = lines.map(line => {
      // Try tab first (Excel default), then comma
      if (line.includes('\t')) {
        return line.split('\t')
      } else {
        return line.split(',').map(cell => cell.trim())
      }
    })

    // Paste data starting at selected cell
    const changes: Array<{ row: number; column: number; value: string }> = []
    pasteData.forEach((row, rowOffset) => {
      row.forEach((value, colOffset) => {
        const targetRow = selectedCell.row + rowOffset
        const targetCol = selectedCell.column + colOffset
        if (targetRow < initialRows && targetCol < initialColumns) {
          setCellValue(targetRow, targetCol, value)
          changes.push({ row: targetRow, column: targetCol, value })
        }
      })
    })

    // Notify parent of all changes
    changes.forEach(change => {
      onCellChange?.(change.row, change.column, change.value)
    })
  }, [selectedCell, readOnly, initialRows, initialColumns, setCellValue, onCellChange])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedCell || readOnly) return

    // Copy (Ctrl+C or Cmd+C)
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      handleCopy(e)
      return
    }

    // Paste (Ctrl+V or Cmd+V)
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      handlePaste(e as any)
      return
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault()
        if (editingCell) {
          handleEditorBlur()
        } else {
          handleCellDoubleClick(selectedCell.row, selectedCell.column)
        }
        break
      case 'Escape':
        if (editingCell) {
          setEditingCell(null)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedCell.row > 0) {
          setSelectedCell({ ...selectedCell, row: selectedCell.row - 1 })
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (selectedCell.row < initialRows - 1) {
          setSelectedCell({ ...selectedCell, row: selectedCell.row + 1 })
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        if (selectedCell.column > 0) {
          setSelectedCell({ ...selectedCell, column: selectedCell.column - 1 })
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (selectedCell.column < initialColumns - 1) {
          setSelectedCell({ ...selectedCell, column: selectedCell.column + 1 })
        }
        break
      case 'Tab':
        e.preventDefault()
        if (e.shiftKey) {
          if (selectedCell.column > 0) {
            setSelectedCell({ ...selectedCell, column: selectedCell.column - 1 })
          }
        } else {
          if (selectedCell.column < initialColumns - 1) {
            setSelectedCell({ ...selectedCell, column: selectedCell.column + 1 })
          }
        }
        break
      default:
        // Start editing if printable character
        if (!editingCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setEditingCell({ row: selectedCell.row, column: selectedCell.column, value: e.key })
          setTimeout(() => editorRef.current?.focus(), 0)
        }
    }
  }, [selectedCell, editingCell, readOnly, initialRows, initialColumns, handleCellDoubleClick, handleEditorBlur, handleCopy, handlePaste])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollPosition({
      top: e.currentTarget.scrollTop,
      left: e.currentTarget.scrollLeft,
    })
  }, [])

  // Get column header name
  const getColumnName = useCallback((index: number): string => {
    let name = ''
    let num = index + 1
    while (num > 0) {
      num -= 1
      name = COLUMN_NAMES[num % 26] + name
      num = Math.floor(num / 26)
    }
    return name
  }, [])

  // Calculate total width
  const totalWidth = useMemo(() => {
    return ROW_NUMBER_WIDTH + columns.reduce((sum, col) => sum + col.width, 0)
  }, [columns])

  // Calculate total height
  const totalHeight = HEADER_HEIGHT + initialRows * DEFAULT_CELL_HEIGHT

  return (
    <div className="grid-editor h-full w-full flex flex-col border border-border rounded-lg overflow-hidden bg-background">
      {/* Toolbar placeholder */}
      <div className="h-10 border-b border-border bg-muted/50 flex items-center px-4">
        <span className="text-sm font-medium">
          {selectedCell && `Cell: ${getColumnName(selectedCell.column)}${selectedCell.row + 1}`}
          {editingCell && `Editing: ${getColumnName(editingCell.column)}${editingCell.row + 1}`}
        </span>
      </div>

      {/* Grid container */}
      <div
        ref={gridRef}
        className="flex-1 overflow-auto relative"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        onCopy={handleCopy}
        onPaste={handlePaste}
        tabIndex={0}
      >
        {/* Grid content */}
        <div style={{ width: totalWidth, height: totalHeight, position: 'relative' }}>
          {/* Column headers */}
          <div
            className="sticky top-0 z-20 bg-muted border-b border-border flex"
            style={{ height: HEADER_HEIGHT }}
          >
            {/* Corner cell */}
            <div
              className="border-r border-border bg-muted flex items-center justify-center"
              style={{ width: ROW_NUMBER_WIDTH, height: HEADER_HEIGHT }}
            />
            {/* Column headers */}
            {columns.slice(visibleRange.startCol, visibleRange.endCol).map((col, idx) => {
              const actualIdx = visibleRange.startCol + idx
              const left = ROW_NUMBER_WIDTH + columns.slice(0, actualIdx).reduce((sum, c) => sum + c.width, 0)

              return (
                <div
                  key={actualIdx}
                  className="border-r border-border flex items-center justify-center text-xs font-medium text-muted-foreground"
                  style={{ width: col.width, height: HEADER_HEIGHT, position: 'absolute', left }}
                >
                  {getColumnName(actualIdx)}
                </div>
              )
            })}
          </div>

          {/* Rows */}
          {Array.from({ length: visibleRange.endRow - visibleRange.startRow }, (_, rowOffset) => {
            const row = visibleRange.startRow + rowOffset
            const top = HEADER_HEIGHT + row * DEFAULT_CELL_HEIGHT

            return (
              <div
                key={row}
                className="flex border-b border-border"
                style={{ position: 'absolute', top, width: totalWidth, height: DEFAULT_CELL_HEIGHT }}
              >
                {/* Row number */}
                <div
                  className="border-r border-border bg-muted flex items-center justify-center text-xs text-muted-foreground"
                  style={{ width: ROW_NUMBER_WIDTH, height: DEFAULT_CELL_HEIGHT }}
                >
                  {row + 1}
                </div>

                {/* Cells */}
                {columns.slice(visibleRange.startCol, visibleRange.endCol).map((col, colOffset) => {
                  const column = visibleRange.startCol + colOffset
                  const cell = getCell(row, column)
                  const isSelected = selectedCell?.row === row && selectedCell?.column === column
                  const isEditing = editingCell?.row === row && editingCell?.column === column
                  const left = ROW_NUMBER_WIDTH + columns.slice(0, column).reduce((sum, c) => sum + c.width, 0)

                  const cellStyle = getCellStyle(row, column, cell)

                  return (
                    <div
                      key={column}
                      className={cn(
                        'border-r border-border relative cursor-cell',
                        isSelected && 'ring-2 ring-primary ring-offset-1 rounded-md',
                        cell.isLocked && 'bg-gray-100 dark:bg-gray-800 opacity-60'
                      )}
                      style={{
                        width: col.width,
                        height: DEFAULT_CELL_HEIGHT,
                        position: 'absolute',
                        left,
                        ...cellStyle
                      }}
                      onClick={() => handleCellClick(row, column)}
                      onDoubleClick={() => handleCellDoubleClick(row, column)}
                    >
                      {isEditing ? (
                        <input
                          ref={editorRef}
                          type="text"
                          value={editingCell?.value ?? ''}
                          onChange={(e) => handleEditorChange(e.target.value)}
                          onBlur={handleEditorBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleEditorBlur()
                            } else if (e.key === 'Escape') {
                              setEditingCell(null)
                            }
                          }}
                          className="w-full h-full px-1 text-xs border-none outline-none bg-white dark:bg-gray-900 rounded-md border-b-4 border-primary"
                          style={{ width: col.width, height: DEFAULT_CELL_HEIGHT }}
                        />
                      ) : (
                        <div className="w-full h-full px-1 text-xs flex items-center overflow-hidden text-ellipsis whitespace-nowrap">
                          {cell.displayValue ?? ''}
                        </div>
                      )}
                      {cell.comment && (
                        <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

